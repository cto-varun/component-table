export const schema = {
    title: 'Table settings',
    type: 'object',
    required: [],
    properties: {
        styles: {
            title: 'CSS Styles',
            type: 'textarea',
            default: '',
        },
        template: {
            title: 'HTML template',
            type: 'textarea',
            default: '',
        },
        mainTableRootClassName: {
            title: 'Root className for main table',
            type: 'string',
        },
        levelOneTableRootClassName: {
            title: 'Root className for level 1 table',
            type: 'string',
        },
        levelTwoTableRootClassName: {
            title: 'Root className for level 2 table',
            type: 'string',
        },
        '': '',
        alerts: {
            type: 'array',
            items: {
                $ref: '#/definitions/alert',
            },
        },
        fieldsConfiguration: {
            type: 'array',
            items: {
                $ref: '#/definitions/fieldsConfiguration',
            },
        },
        unwantedFields: {
            type: 'array',
            title: 'Add a list of unwanted column',
            items: {
                $ref: '#/definitions/unwantedColumn',
            },
        },
        bordered: {
            type: 'boolean',
            title: 'Whether to show all table borders',
            default: false,
        },
        header: {
            type: 'string',
            title: 'Table header text',
            default: '',
        },
        minWidth: {
            title: 'Minimum table width',
            type: 'number',
            default: null,
        },
        maxHeight: {
            title: 'Maximum table height',
            type: 'number',
            default: null,
        },
        footer: {
            type: 'string',
            title: 'Table footer text',
            default: '',
        },
        groupedByField: {
            title: 'Field name to group',
            type: 'string',
            default: '',
        },
        pagination: {
            type: 'string',
            title: 'Pagination position',
            default: 'bottom',
            enum: ['null', 'top', 'bottom', 'both'],
        },
        pageSize: {
            type: 'number',
            title: 'Number of Rows',
            default: 10,
        },
        resizableColumns: {
            title: "Possiblity to change width of column with drag'n'drop",
            type: 'boolean',
            default: false,
        },
        sorting: {
            type: 'boolean',
            title: 'Enable sorting for table',
            default: false,
        },
        levelOnePontOfContact: {
            title: 'Level One Point of Contact for data',
            type: 'array', // Rather then array use string we jsuts need one point of conatact
            items: {
                $ref: '#/definitions/pointOfContact',
            },
        },
        levelOneNestingStructure: {
            title: 'Level One Nested Structure',
            type: 'array',
            items: {
                $ref: '#/definitions/fieldsConfiguration',
            },
        },
        levelTwoNestingStructure: {
            title: 'Level Two Nested Structure',
            type: 'array',
            items: {
                $ref: '#/definitions/fieldsConfiguration',
            },
        },
    },
    definitions: {
        unwantedColumn: {
            type: 'object',
            properties: {
                columnName: {
                    type: 'string',
                    title: 'Unwanted Column',
                },
            },
        },
        pointOfContact: {
            type: 'object',
            properties: {
                dataName: {
                    type: 'string',
                    title: 'Data Which is source for this contaner',
                },
            },
        },
        alert: {
            type: 'object',
            properties: {
                fieldName: {
                    type: 'string',
                },
                functionName: {
                    type: 'string',
                    enum: ['eq', 'lte', 'lt', 'gt', 'gte', 'regex'],
                },
                value: {
                    type: 'string',
                },
                state: {
                    type: 'string',
                    enum: [
                        'default',
                        'processing',
                        'error',
                        'warning',
                        'success',
                    ],
                },
                badge: {
                    type: 'string',
                    enum: [
                        'default',
                        'processing',
                        'error',
                        'warning',
                        'success',
                    ],
                },
            },
        },
        fieldsConfiguration: {
            type: 'object',
            properties: {
                fieldName: {
                    type: 'string',
                },
                displayName: {
                    type: 'string',
                    title: 'Label',
                },
                fixed: {
                    type: 'string',
                    title: 'Fixed column position',
                    enum: ['right', 'left'],
                },
                width: {
                    type: 'number',
                    title: 'Column width',
                },
                format: {
                    type: 'string',
                    title: 'Data format',
                },
                group: {
                    type: 'string',
                    title: 'Column group name',
                },
                render: {
                    // Text area for render funtion
                    title: 'Render funtion',
                    type: 'textarea',
                    default: '',
                },
            },
        },
    },
};

export const ui = {
    render: {
        'ui:widget': 'textarea',
    },
    styles: {
        'ui:widget': 'textarea',
    },
};
