import React, { Component } from 'react';
import { Badge, Table, Input, Button } from 'antd';
import { Icon } from '@ant-design/compatible';
import NumberFormat from 'react-number-format';
import day from 'dayjs';
import groupBy from 'lodash.groupby';
import * as sqrl from 'squirrelly';

import { name } from '../package.json';

const LOWER_THAN = 'lt';
const LOWER_OR_EQUAL_THAN = 'lte';
const EQUAL = 'eq';
const GREATER_THAN = 'gt';
const GREATER_OR_EQUAL_THAN = 'gte';
const REGEX = 'regex';
const LIMIT_FILTER_GROUPS = 3;

export default class TableComponent extends Component {
    static defaultProps = {
        properties: {},
    };

    static lazy = false;
    static componentName = name;

    dataElement = (item, idx) => Object.assign({}, item, { key: idx });

    state = {
        data: null,
        columnStructure: this.columns,
        filteredData: null,
        filteredColumnStructure: this.columns,
        displayBackButton: false,
        /**
         * puerColumnStructuer contains field for all data [All data: data from all the query]
         */

        puerColumnStructuer: null,

        levelONeFormattedFields: null,
        levelTwoFormattedFields: null,
    };

    /**
     * Run a query or just use passed data
     */
    runQuery(data) {
        return data.execute ? data.execute() : data;
    }

    /**
     * Inject data from props into a state.
     * Run a query if needed.
     */
    retrieveDataFromStorage(nextProps) {
        nextProps = nextProps || this.props;
        if (this.isNormal(nextProps)) {
            let result = [];
            nextProps.data.forEach((obj) => {
                let addKeyToData = this.runQuery(obj);
                addKeyToData = addKeyToData.map((obj, index) => {
                    obj.key = index;
                    return obj;
                });
                result.push(addKeyToData);
            });

            if (
                JSON.stringify(this.state.data) !== JSON.stringify(result) ||
                JSON.stringify(this.state.filteredData) !==
                    JSON.stringify(result[0])
            ) {
                this.setState({ data: result, filteredData: result[0] });
            }
        }
    }

    /**
     * Overwrites state by data from storage. Always.
     */
    componentWillMount() {
        this.retrieveDataFromStorage();
    }

    componentWillReceiveProps(nextProps) {
        this.retrieveDataFromStorage(nextProps);
    }

    /**
     * @param {Array} data
     * @param {String} fieldGrouping Field name we want to group
     */
    groupedData = (data, fieldGrouping) => {
        const makeGroups = (chunk, parentGroup = 'root', level = 0) => {
            const groupName = fieldGrouping[level];
            const groupedData = groupBy(chunk, groupName);
            const groupKeys = Object.keys(groupedData);

            const groupByField = (acc, key) => {
                // Data array to be a child
                let selectedGroup = groupedData[key].map((item, idx) =>
                    this.dataElement(item, [parentGroup, key, idx].join('.'))
                );

                // After we need to regroup them
                // Create a title row
                let titleRow = {
                    [groupName]: selectedGroup[0][groupName],
                    key: [parentGroup, key].join('.'),
                };
                if (level + 1 < fieldGrouping.length) {
                    titleRow.children = makeGroups(
                        selectedGroup,
                        `${parentGroup}.${key}`,
                        level + 1
                    );
                } else {
                    titleRow.children = selectedGroup;
                }

                return acc.concat(titleRow);
            };

            return groupKeys.reduce(groupByField, []);
        };

        const result = makeGroups(data);
        return result.length ? result : data;
    };

    /**
     * If props handlers has onDataClick handler
     * each field become filterable.
     */
    columnFilters = (field) => {
        if (
            !this.props.handlers ||
            !this.props.handlers.onFilterSet ||
            !this.props.handlers.onFilterRemove
        ) {
            return {};
        }

        const { onFilterSet, onFilterRemove } = this.props.handlers;

        const handleSearch = (value, confirm) => () => {
            lastSearch = value;
            onFilterSet(field, 'equal', value);
            confirm();
        };

        const handleReset = (clearFilters) => () => {
            onFilterRemove(field, 'equal', lastSearch);
            clearFilters();
        };

        const getFilterValue = () => {
            const result = this.props.associatedFilters.filter(
                (item) => item.field == field
            );
            if (result.length) {
                return result[0].value;
            }

            return null;
        };

        var searchInput;
        var lastSearch;
        return {
            filterDropdown: ({
                setSelectedKeys,
                selectedKeys,
                confirm,
                clearFilters,
            }) => (
                <div className="table-filter-dropdown">
                    <Input
                        ref={(ele) => (searchInput = ele)}
                        placeholder="Search value"
                        value={selectedKeys}
                        onChange={(e) => setSelectedKeys(e.target.value)}
                        onPressEnter={handleSearch(selectedKeys, confirm)}
                    />
                    <Button
                        type="primary"
                        onClick={handleSearch(selectedKeys, confirm)}
                    >
                        Search
                    </Button>
                    <Button onClick={handleReset(clearFilters)}>Reset</Button>
                </div>
            ),
            filteredValue: getFilterValue(),
            onFilterDropdownVisibleChange: (visible) => {
                if (visible) {
                    setTimeout(() => {
                        searchInput.focus();
                    });
                }
            },
        };
    };

    /**
     * Extract information about coluns from a first row of data
     *
     * @return {Array} Columns
     */
    columns = () => {
        const { data } = this.state;
        if (
            this.isNormal() &&
            data &&
            data[0] &&
            data.length &&
            data[0].length
        ) {
            const { sorting, fieldsConfiguration = [] } = this.props.properties;
            let firstRow = null;

            data.forEach((obj) => {
                firstRow = { ...firstRow, ...obj[0] };
            });

            // Would be good to move label with carets into separate component
            const getLabel = (label, sortOrder) => {
                return sorting && sortOrder ? (
                    <div>
                        {label}
                        <div className="ant-table-column-sorter">
                            <Icon
                                type="caret-up"
                                className={`caret ant-table-column-sorter-up ${
                                    sortOrder === 'ascend' ? 'on' : ''
                                }`}
                            />
                            <Icon
                                type="caret-down"
                                className={`caret ant-table-column-sorter-down ${
                                    sortOrder === 'descend' ? 'on' : ''
                                }`}
                            />
                        </div>
                    </div>
                ) : (
                    label
                );
            };

            const getSortOrder = (field) => {
                if (sorting) {
                    const { sorter } = this.state;
                    if (sorter) {
                        const sort = sorter.find((s) => s.key === field);
                        if (sort) {
                            return sort.order;
                        }
                    }
                }
                return false;
            };

            const renderHtmlNode = (text, template) => {
                const data = { data: text };
                const __html = sqrl.Render(
                    template === undefined || template.length < 3
                        ? '{{data}}'
                        : template,
                    data || []
                );

                return <div dangerouslySetInnerHTML={{ __html }} />;
            };

            const columnData = (
                field,
                type,
                format,
                width,
                fixed,
                order,
                label,
                htmlNode
            ) => ({
                format,
                fixed,
                order,
                width,
                dataIndex: field,
                key: field,
                title: getLabel(label, getSortOrder(field)),
                render: (text) => renderHtmlNode(text, htmlNode),
                ...this.columnFilters(field),
                onCell: (record) => ({
                    field,
                    type,
                    format,
                    record,
                    alert: this.getRowStatus(record, field),
                }),

                sorting: sorting ? this.sorting(field, type) : false,
                onHeaderCell: sorting
                    ? (column) => ({
                          className: 'table-cell__sorted',
                          onClick: (event) =>
                              this.onHeaderCellClick(column, event),
                      })
                    : undefined,
            });
            const guessType = (targetFieldName, data) => {
                for (let idx = 0; idx < this.props.datasource.length; idx++) {
                    const { name, type } = this.props.datasource[idx];
                    if (name === targetFieldName) {
                        return type;
                    }
                }

                const t = parseFloat(data);
                if (isNaN(t)) {
                    return typeof data;
                }
                return 'number';
            };

            const groups = this.getGroupedByField();
            let fieldNamesAndTypes = Object.keys(firstRow).map((field) => ({
                field,
                type: guessType(field, firstRow[field]),
            }));

            if (groups.length) {
                fieldNamesAndTypes = fieldNamesAndTypes.sort(function (a, b) {
                    let indexA = groups.indexOf(a.field);
                    let indexB = groups.indexOf(b.field);
                    if (indexA === -1) indexA = 10;
                    if (indexB === -1) indexB = 10;

                    return indexA - indexB;
                });
            }

            const getProperColumnStructuer = (
                refForStructuer,
                rewColumnStructure
            ) => {
                return refForStructuer.map(({ field, type }, order) => {
                    return columnData(
                        field,
                        type,
                        this.getFormat(field),
                        this.getWidth(field),
                        this.getFixed(field),
                        order,
                        this.getLabel(field),
                        this.getRenderString(field, rewColumnStructure)
                    );
                });
            };

            /**
             * getProperColumnStructuer Function reduce the redandancy for the code
             * First argument is column structuer in proper formate
             * Second is a column config that we get from the props
             */
            const formattedFields = getProperColumnStructuer(
                fieldNamesAndTypes,
                this.props.properties.fieldsConfiguration
            );

            // Below line of code is needed to achive the leve 2 config
            let levelOneFieldNamesAndTypes = [];
            this.props.properties.levelOneNestingStructure &&
                this.props.properties.levelOneNestingStructure.forEach(
                    (obj) => {
                        fieldNamesAndTypes.forEach((ref) => {
                            if (obj.fieldName === ref.field) {
                                levelOneFieldNamesAndTypes.push(ref);
                            }
                        });
                    }
                );

            const levelONeFormattedFields = getProperColumnStructuer(
                levelOneFieldNamesAndTypes,
                this.props.properties.levelOneNestingStructure
            );
            if (
                JSON.stringify(this.state.levelONeFormattedFields) !==
                JSON.stringify(levelONeFormattedFields)
            )
                this.setState({ levelONeFormattedFields });

            // Below line of code is needed to achive the leve 2 config
            if (this.props.properties.levelTwoNestingStructure !== undefined) {
                let levelTwoFieldNamesAndTypes = [];
                this.props.properties.levelTwoNestingStructure &&
                    this.props.properties.levelTwoNestingStructure.forEach(
                        (obj) => {
                            fieldNamesAndTypes.forEach((ref) => {
                                if (obj.fieldName === ref.field) {
                                    levelTwoFieldNamesAndTypes.push(ref);
                                }
                            });
                        }
                    );

                const levelTwoFormattedFields = getProperColumnStructuer(
                    levelTwoFieldNamesAndTypes,
                    this.props.properties.levelTwoNestingStructure
                );

                if (
                    JSON.stringify(this.state.levelTwoFormattedFields) !==
                    JSON.stringify(levelTwoFormattedFields)
                )
                    this.setState({ levelTwoFormattedFields });
            }

            if (
                JSON.stringify(this.state.puerColumnStructuer) !==
                JSON.stringify(formattedFields)
            )
                this.setState({ puerColumnStructuer: formattedFields });

            return this.regroupColumns(
                [...formattedFields],
                fieldsConfiguration
            );
        }
    };

    getFormat = (sourceFieldName) => {
        return this.getColumnConfig(sourceFieldName, 'format');
    };

    getWidth = (sourceFieldName) => {
        const width = parseInt(
            this.getColumnConfig(sourceFieldName, 'width'),
            10
        );
        return Number.isNaN(width) ? undefined : width;
    };

    getLabel = (sourceFieldName) => {
        const label = this.getColumnConfig(sourceFieldName, 'displayName');
        return label && label !== '' ? label : sourceFieldName;
    };

    getRenderString = (string, columnConfig) => {
        let renderString;

        // fieldsConfiguration we need to pass this thing as a argument
        columnConfig &&
            columnConfig.forEach((obj) => {
                if (string === obj.fieldName) {
                    renderString = obj.render;
                }
            });
        return renderString;
    };

    getFixed = (sourceFieldName) => {
        return this.getColumnConfig(sourceFieldName, 'fixed');
    };

    getGroupedByField = () => {
        const { groupedByField = '' } = this.props.properties;
        const data = this.state;

        if (!groupedByField || groupedByField === '') {
            return [];
        }

        return groupedByField
            .replace(/\s/g, '')
            .split(',', LIMIT_FILTER_GROUPS)
            .filter(
                (item) =>
                    data &&
                    data[0] &&
                    data.length &&
                    data[0].length &&
                    data[0][0][item]
            );
    };

    getColumnConfig = (sourceFieldName, propName) => {
        const { fieldsConfiguration = [] } = this.props.properties;

        for (let idx = 0; idx < fieldsConfiguration.length; idx++) {
            const config = fieldsConfiguration[idx];

            if (config.fieldName === sourceFieldName) {
                if (config[propName]) {
                    return config[propName];
                }

                if (propName === undefined) {
                    return config;
                }
            }
        }
    };

    swapElement = (array, indexA, indexB) => {
        var tmp = array[indexA];
        array[indexA] = array[indexB];
        array[indexB] = tmp;
        return array;
    };

    arrangeFields = (fieldsConfiguration, formattedFields) => {
        let array = [...formattedFields];
        fieldsConfiguration &&
            fieldsConfiguration.length > 0 &&
            fieldsConfiguration.forEach((obj, upperIndex) => {
                array.forEach((data, lowerIndex) => {
                    if (
                        data.children === undefined &&
                        obj.fieldName === data.key
                    ) {
                        array = this.swapElement(array, upperIndex, lowerIndex);
                    }
                });
            });
        return fieldsConfiguration && fieldsConfiguration.length > 0
            ? array
            : formattedFields;
    };

    /**
     * Below function removes the unwanted column
     */
    handleUnwantedColumn = (array) => {
        const { unwantedFields } = this.props.properties;
        let result = array;
        unwantedFields &&
            unwantedFields.map((ref) => {
                result.map((obj, index) => {
                    if (ref.columnName === obj.key) {
                        result.splice(index, 1);
                    }
                });
            });
        return result;
    };

    /**
     * Group columns featuree
     *
     * @layout
     * |-------------|
     * | Column Name |
     * |------|------|
     * | Sub1 | Sub2 |
     * |======|======|
     * | V 1  | V 2  |
     */
    regroupColumns = (formattedFields, fieldsConfiguration) => {
        const { unwantedFields } = this.props.properties;
        const fieldNamesToGroups = fieldsConfiguration
            .filter(({ group }) => group && group !== '')
            .reduce(
                (acc, { fieldName, group }) => ({ ...acc, [fieldName]: group }),
                {}
            );

        const groupContext = groupBy(
            formattedFields,
            ({ dataIndex }) => fieldNamesToGroups[dataIndex]
        );
        let pendingDeletion = [];

        delete groupContext.undefined;

        Object.keys(groupContext).map((title) => {
            const children = groupContext[title];
            const order = children[0].order;
            const key = `group-${title}`;
            const groupElement = {
                key,
                title,
                order,
                children,
            };

            formattedFields[order] = groupElement;
            children.forEach(({ order }, index) => {
                if (index > 0) {
                    pendingDeletion.push(order);
                }
            });
        });

        pendingDeletion.forEach((index) => formattedFields.splice(index, 1));

        // NOTE: FIXME
        // If we divide the code in sub catogery then code will break
        // This issue is resolved with temperary fix
        // Need to work on this
        let arrangeFields = this.arrangeFields(
            fieldsConfiguration,
            formattedFields
        );
        let flag = false;
        formattedFields.forEach((data) => {
            if (flag === false && data.children && data.children.length > 0) {
                flag = true;
            }
        });

        if (flag) {
            return this.handleUnwantedColumn(formattedFields);
        } else {
            return this.handleUnwantedColumn(arrangeFields);
        }
    };

    /**
     * @return {Function} Sorter function based on field type
     */
    sorting = (field, type) => {
        if (type === 'date') {
            return (a, b) => {
                if (day(a[field]).isBefore(day(b[field]))) {
                    return -1;
                }

                if (day(a[field]).isAfter(day(b[field]))) {
                    return 1;
                }

                return 0;
            };
        }

        if (type === 'number') {
            return (a, b) => a[field] - b[field];
        }

        if (type === 'string') {
            return (a, b) =>
                a[field] && b[field] ? a[field].localeCompare(b[field]) : 0;
        }
    };

    sortData = (data) => {
        const columns = this.state.columnStructure;
        const sorter = this.state.sorter;

        if (columns && sorter) {
            const sortMethods = {};
            columns.map((col) => (sortMethods[col.key] = col.sorting));

            const multiDimensionalSort = (fields) => (a, b) =>
                fields
                    .map((f) =>
                        f.order === 'ascend'
                            ? sortMethods[f.key](b, a)
                            : sortMethods[f.key](a, b)
                    )
                    .reduce((p, n) => (p ? p : n), 0);

            data.sort(multiDimensionalSort(sorter));
        }
        return data;
    };

    /**
     * Get data transformed into a table format
     * @return {Array} Table data
     */
    data = () => {
        if (this.isNormal()) {
            const { data } = this.state;
            const groupedByField = this.getGroupedByField();

            if (groupedByField.length) {
                return this.groupedData(data[0], groupedByField);
            }

            return this.sortData(data[0].map(this.dataElement));
        }
    };

    onHeaderCellClick = (column, event) => {
        const { key, order } = column;
        const isControlPressed = window.navigator.platform.match('Mac')
            ? event.metaKey
            : event.ctrlKey;

        let sorter = this.state.sorter || [];
        let index = sorter.findIndex((a) => a.key === key);

        if (index > -1) {
            if (!isControlPressed) {
                sorter = [sorter[index]];
                index = 0;
            }

            switch (sorter[index].order) {
                case 'descend':
                    sorter[index].order = 'ascend';
                    break;

                case 'ascend':
                    sorter.splice(index, 1);
                    break;
                default:
            }
        } else {
            if (!isControlPressed) {
                sorter.splice(0, sorter.length);
            }

            sorter.push({
                key,
                index: order,
                order: 'descend',
                sorter: column.sorter,
            });
        }

        if (JSON.stringify(this.state.sorter) !== JSON.stringify(sorter)) {
            this.setState({
                sorter: sorter,
            });
        }
    };

    /* eslint-disable complexity*/
    /**
     * Execute alert rules. First rule applied stops rule execution on a field
     * @param {Object} record
     * @param {String} requiredField The only field to check agains rules
     * @return {String} Row status based on rule output.
     */
    getRowStatus(record, requiredField) {
        const {
            properties: { alerts = [] },
        } = this.props;

        for (let idx = 0; idx < alerts.length; idx++) {
            const { fieldName, functionName, value, state, badge } = alerts[
                idx
            ];
            const fieldValue = record[fieldName];

            if (
                typeof requiredField !== 'undefined' &&
                fieldName !== requiredField
            ) {
                continue;
            }

            if (typeof fieldValue === 'undefined') {
                continue;
            }

            switch (functionName) {
                case EQUAL:
                    if (fieldValue === value) return { state, badge };
                    break;
                case LOWER_OR_EQUAL_THAN:
                    if (fieldValue <= value) return { state, badge };
                    break;
                case LOWER_THAN:
                    if (fieldValue < value) return { state, badge };
                    break;
                case GREATER_THAN:
                    if (fieldValue > value) return { state, badge };
                    break;
                case GREATER_OR_EQUAL_THAN:
                    if (fieldValue >= value) return { state, badge };
                    break;
                case REGEX:
                    if (new RegExp(value, 'i').test(fieldValue)) {
                        return { state, badge };
                    }
                    break;
                default:
                    break;
            }
        }

        return { state: null, badge: null };
    }
    /* eslint-enable complexity*/

    rowClassName = (record) => {
        const { state } = this.getRowStatus(record);

        if (state) {
            return `table-status-${state}`;
        }
    };

    paginationConfigutation = () => {
        const {
            position,
            pageSize,
            showSizeChanger = false,
        } = this.props.properties;

        return {
            showSizeChanger: showSizeChanger,
            position:
                position && position !== 'null' && position !== ''
                    ? position
                    : 'bottom',
            pageSize:
                pageSize && pageSize.length > 0 ? parseInt(pageSize, 10) : 10,
        };
    };

    tableHeaderConfiguration = () => {
        const header = this.props.properties.header;

        if (header && header !== '') {
            return () => header;
        }
    };

    tableFooterConfiguration = () => {
        const footer = this.props.properties.footer;

        if (footer && footer !== '') {
            return () => footer;
        }
    };

    scrollY = () => {
        return parseInt(this.props.properties.maxHeight, 10);
    };

    /**
     * A fixed value which is greater than table width for scroll.x is recommended.
     * The sum of unfixed columns should not greater than scroll.x.
     * NOTE: For more infformation refer antd documentation
     */
    scrollX = () => {
        return parseInt(this.props.properties.minWidth, 10);
    };

    /* Table statuses */
    isLoading = (nextProps) => !(nextProps || this.props).data;
    isNormal = (nextProps) => !this.isLoading(nextProps);
    isBordered = () => !!this.props.properties.bordered;
    components = () => ({
        body: {
            cell: FormattedCell,
        },
    });

    /**
     * TRY NOT TO TOUCH THIS PART OF CODE
     * This code is used by the Cueernt Table componenet
     */
    filterData = (key, value) => {
        const { columnStructure } = this.state;
        let filteredColumnStructure = columnStructure;
        filteredColumnStructure = filteredColumnStructure?.filter(
            (item) => item.key !== key
        );
        if (
            JSON.stringify(this.state.filteredColumnStructure) !==
            JSON.stringify(filteredColumnStructure)
        ) {
            this.setState({
                filteredColumnStructure: filteredColumnStructure,
                displayBackButton: true,
            });
        }
        /**
         * I need to take care of data too
         * Depending on the value I need to filter the data and show the perticular data
         */
        let filteredData = this.state.data[0];
        filteredData = filteredData.filter(
            (obj) => obj[key] === value.toString()
        );
        if (
            JSON.stringify(this.state.filteredData) !==
            JSON.stringify(filteredData)
        ) {
            this.setState({ filteredData: filteredData });
        }
    };

    resetDataAndColumns = () => {
        this.setState({ filteredColumnStructure: this.columns() });
        this.retrieveDataFromStorage();
        this.setState({ displayBackButton: false });
    };

    componentDidMount = () => {
        if (this.state.columnStructure === undefined) {
            this.setState({ columnStructure: this.columns() });
        }
        if (this.state.filteredColumnStructure === undefined) {
            this.setState({ filteredColumnStructure: this.columns() });
        }

        if (this.props.component.id !== undefined) {
            window[window.sessionStorage?.tabId][this.props.component.id] = (
                key,
                value
            ) => this.filterData(key, value);
            window[window.sessionStorage?.tabId][
                this.props.component.id + 'resetDataAndColumns'
            ] = () => this.resetDataAndColumns();
        }
    };
    componentWillUnmount() {
        if (this.props.component.id !== undefined) {
            delete window[window.sessionStorage?.tabId][
                this.props.component.id
            ];
            delete window[window.sessionStorage?.tabId][
                this.props.component.id + 'resetDataAndColumns'
            ];
        }
    }

    /**
     * Working on HTML template for the table componenet
     * NOTE: Code is same as template component
     */
    get template() {
        try {
            const { template = '' } = this.props.properties;

            const html = template;
            return sqrl.Render(html, []);
        } catch (e) {
            return e.message;
        }
    }

    getRequestedColumnFields = (refForArray, actualColumnStructure) => {
        let result = [];
        refForArray.forEach((ref, i) => {
            actualColumnStructure.forEach((obj, j) => {
                if (ref.fieldName === obj.key) {
                    result.push(obj);
                }
            });
        });
        return result;
    };

    getRequestedData = (refForData, actualData, keyValue) => {
        let result = [];
        refForData &&
            refForData.forEach((ref, i) => {
                let value = keyValue[ref.dataName];
                result = actualData.filter(
                    (obj) => obj[ref.dataName] === value
                );
            });
        return result;
    };

    expandedRowRenderForLevelOneTable = (key) => {
        return (
            <Table
                columns={this.state.levelTwoFormattedFields}
                dataSource={this.state.data[0]} // this data is for level 2 extended table
                pagination={{
                    position: 'bottom',
                    pageSize: 3,
                }}
            />
        );
    };

    /**
     * Bellow Property is passing to the Main Table Componenet
     */
    expandedRowRender = (key) => {
        let levelOneData = this.getRequestedData(
            this.props.properties.levelOnePontOfContact,
            this.state.data[0],
            key
        );

        if (this.props.properties.levelTwoNestingStructure[0] !== undefined) {
            return (
                <Table
                    className={this.props.properties.levelOneTableRootClassName}
                    columns={this.state.levelONeFormattedFields}
                    dataSource={levelOneData}
                    pagination={{
                        position: 'bottom',
                        pageSize: 3,
                    }}
                    expandedRowRender={(text) =>
                        this.expandedRowRenderForLevelOneTable(text)
                    }
                />
            );
        } else {
            return (
                <Table
                    className={this.props.properties.levelOneTableRootClassName}
                    columns={this.state.levelONeFormattedFields}
                    dataSource={levelOneData}
                    pagination={{
                        position: 'bottom',
                        pageSize: 3,
                    }}
                />
            );
        }
    };

    render = () => {
        const __html = this.template;
        const {
            displayBackButton,
            filteredData,
            filteredColumnStructure,
        } = this.state;
        const { levelOneNestingStructure } = this.props.properties;

        let backButtonVisible =
            displayBackButton === true
                ? { visibility: 'visible' }
                : { visibility: 'hidden' };
        const template = (
            <div
                className="device-history-html-template"
                style={backButtonVisible}
                dangerouslySetInnerHTML={{ __html }}
            />
        );

        const mainTableComponent = (
            <Table
                className={this.props.properties.mainTableRootClassName}
                components={this.components()}
                bordered={this.isBordered()}
                columns={filteredColumnStructure}
                loading={this.isLoading()}
                title={this.tableHeaderConfiguration()}
                footer={this.tableFooterConfiguration()}
                pagination={this.paginationConfigutation()}
                rowClassName={this.rowClassName}
                scroll={{ x: this.scrollX(), y: this.scrollY() }}
                dataSource={this.state.filteredData}
            />
        );

        const levelOneNestedTable = (
            <Table
                className={this.props.properties.mainTableRootClassName}
                components={this.components()}
                bordered={this.isBordered()}
                columns={this.state.filteredColumnStructure}
                loading={this.isLoading()}
                title={this.tableHeaderConfiguration()}
                footer={this.tableFooterConfiguration()}
                rowClassName={this.rowClassName}
                scroll={{ x: this.scrollX(), y: this.scrollY() }}
                dataSource={this.state.filteredData}
                expandedRowRender={(text) => this.expandedRowRender(text)}
            />
        );

        return (
            <div>
                {template}
                {levelOneNestingStructure === undefined ||
                levelOneNestingStructure[0] === undefined
                    ? mainTableComponent
                    : levelOneNestedTable}
            </div>
        );
    };
}

class FormattedCell extends Component {
    render() {
        const { field, type, format, alert, record, ...restProps } = this.props;

        if (!format || ['number', 'date'].indexOf(type) === -1) {
            return (
                <td ref={(node) => (this.cell = node)} {...restProps}>
                    {/* Temporarily commenting out this next line until I figure out how the alerts work */}
                    {/* {alert.badge && <Badge status={alert.badge} /> } */}
                    {restProps.children}
                </td>
            );
        }

        if (type === 'number') {
            return (
                <td ref={(node) => (this.cell = node)} {...restProps}>
                    {/* Temporarily commenting out this next line until I figure out how the alerts work */}
                    {/* {alert.badge && <Badge status={alert.badge} /> } */}
                    <NumberFormat
                        format={format}
                        value={this.props.record[field]}
                        displayType={'text'}
                    />
                </td>
            );
        }

        if (type === 'date') {
            return (
                <td ref={(node) => (this.cell = node)} {...restProps}>
                    {/* Temporarily commenting out this next line until I figure out how the alerts work */}
                    {/* {alert.badge && <Badge status={alert.badge} /> } */}
                    {day(this.props.record[field]).format(format)}
                </td>
            );
        }
    }
}
