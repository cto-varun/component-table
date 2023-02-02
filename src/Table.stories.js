import React from 'react';
import { storiesOf } from '@storybook/react';
import {
    withKnobsOptions,
    text,
    boolean,
    object,
    number,
    select,
} from '@storybook/addon-knobs';
import DonutPie from '@ivoyant/component-pie';
import { query, SandboxComponent, mock } from '../../component-loader';

import {
    sourceFieldsKnob,
    dynamicFieldsKnob,
    urlKnob,
    staticDatasource,
    staticURL,
    remoteConfiguration,
    JSXConfiguration,
} from '../../component-loader/dist/knobs';

import { component } from '../dist';
import { name, version } from '../package';


mock();

function generalConfiguration(groupName = 'General') {
    return {
        header: text('Header', '', groupName),
        footer: text('Footer', '', groupName),
        pagination: select(
            'Pagination',
            ['', 'both', 'top', 'bottom'],
            '',
            groupName
        ),
        groupedByField: text('Grouped by field', '', groupName),
        sorting: boolean('Sorting', false, groupName),
        bordered: boolean('Bordered', false, groupName),
        maxHeight: number('Max height (fixed header)', 0, {}, groupName),
    };
}

const alert = (groupName = 'Alert') => ({
    fieldName: text(`Field name (${groupName})`, '', groupName),
    functionName: select(
        `Function name (${groupName})`,
        ['gt', 'gte', 'lt', 'lte', 'eq', 'regex'],
        'lt',
        groupName
    ),
    value: text(`Value (${groupName})`, '0', groupName),
    state: select(
        `State (${groupName})`,
        ['', 'error', 'warning', 'active', 'inactive', 'info', 'success'],
        '',
        groupName
    ),
    badge: select(
        `Badge (${groupName})`,
        ['', 'success', 'error', 'processing', 'default', 'alert'],
        '',
        groupName
    ),
});

const fieldConfig = (idx, groupName = 'Fields configuration') => ({
    fieldName: text(`Field ${idx} name`, '', groupName),
    displayName: text(`Field ${idx} label`, '', groupName),
    group: text(`Field ${idx} group`, '', groupName),
    format: text(`Field ${idx} format`, '', groupName),
    width: text(`Field ${idx} width`, '', groupName),
});

storiesOf('Table Component', module)
    .addDecorator(
        withKnobsOptions({
            timestamps: true,
            // debounce: { wait: 1000, leading: true},
        })
    )
    .addWithJSX('Injected data', () => {
        const props = {
            data: object(
                'Injected object',
                [{ timestamp: 1, ram: 250, type: 'test' }],
                'Injected data'
            ),
            url: staticURL,
            datasource: [
                query.sourceField('event_type', 'string'),
                query.sourceField('event_id', 'string'),
                query.sourceField('execution_step', 'string'),
                query.sourceField('execution_start_time', 'date'),
                query.sourceField('event_time', 'date'),
                query.sourceField('execution_end_time', 'date'),
                query.sourceField('status', 'string'),
                query.sourceField('subscription_id', 'string'),
            ],
            properties: Object.assign({}, generalConfiguration()),
            extractData: text('Data extractor (ata)', '', 'Advanced'),
            extractFields: text('Field names extractor (ata)', '', 'Advanced'),
        };

        return <SandboxComponent component={component} {...props} />;
    })
    .add('Alerting', () => {
        const props = {
            refreshInterval: 0,
            url: staticURL,
            properties: Object.assign({}, generalConfiguration(), {
                alerts: [alert('Alert #1'), alert('Alert #2')],
            }),
            datasource: staticDatasource,
        };

        return <SandboxComponent component={component} {...props} />;
    })
    .add('Grouping', () => {
        const groupName = text('Group name', 'test', 'Group');
        const fieldsConfiguration = [
            {
                fieldName: text('Field name 1', 'model'),
                group: groupName,
            },
            {
                fieldName: text('Field name 2', 'location'),
                group: groupName,
            },
        ];

        const props = {
            refreshInterval: 0,
            url: staticURL,
            properties: Object.assign({}, generalConfiguration(), {
                fieldsConfiguration,
            }),
            datasource: staticDatasource,
        };

        return <SandboxComponent component={component} {...props} />;
    })
    .add('Data formatting', () => {
        const fieldsConfiguration = [
            {
                fieldName: text('Field name', 'ram', 'Formatting'),
                format: text('Field format', '##.## Mb', 'Formatting'),
                displayName: text(`Field label`, '', 'Formatting'),
            },
        ];

        const props = {
            refreshInterval: 0,
            url: staticURL,
            properties: Object.assign({}, generalConfiguration(), {
                fieldsConfiguration,
            }),
            datasource: staticDatasource,
        };

        return <SandboxComponent component={component} {...props} />;
    })
    .add('Associated component', () => {
        const groupName = 'Associated component';
        const summary = {
            position: select(
                'Position',
                ['top', 'bottom', 'right', 'left'],
                'left',
                groupName
            ),
            width: text('Width', '200px', groupName),
            component: text(`Component name`, '', groupName),
            field: text(`Field to process`, '', groupName),
            groups: text('Group data by', '', groupName),
            current: boolean(`Current?`, false, groupName),
            avg: boolean(`Average?`, false, groupName),
            min: boolean(`Minimum?`, true, groupName),
            max: boolean(`Maximum?`, true, groupName),
            sum: boolean(`Sum?`, false, groupName),
        };

        const Legends = {
            Table: component,
            Donut: DonutPie.component,
        };

        const props = {
            refreshInterval: 0,
            url: staticURL,
            Legends,
            properties: Object.assign({}, generalConfiguration(), { summary }),
            datasource: staticDatasource,
        };

        return <SandboxComponent component={component} {...props} />;
    })
    .addWithJSX(
        'Fake server configuration',
        () => {
            const sourceFields = sourceFieldsKnob();
            const dynamicFields = dynamicFieldsKnob();
            const url = urlKnob(sourceFields.forUrl);

            const datasource = [].concat(
                sourceFields.datasource,
                dynamicFields
            );

            const props = {
                refreshInterval: 0,
                url,
                properties: Object.assign({}, generalConfiguration()),
                datasource,
            };

            return <SandboxComponent component={component} {...props} />;
        },
        JSXConfiguration(name, version)
    )
    .addWithJSX(
        'Real server configuration',
        () => {
            const gConfig = generalConfiguration();
            const sourceFields = sourceFieldsKnob(false);
            const dynamicFields = dynamicFieldsKnob();
            const {
                url,
                refreshInterval,
                httpConfiguration,
                extractData,
                extractFields,
            } = remoteConfiguration();

            const numberOfAlerts = parseFloat(
                text('Number of alerts', '0', 'General')
            );
            const numberOfFields = parseFloat(
                text(
                    'Number of fields to configure',
                    '0',
                    'Fields configuration'
                )
            );

            let alerts = [];
            let fieldsConfiguration = [];

            if (!isNaN(numberOfAlerts)) {
                let idx = 0;
                for (idx; idx < numberOfAlerts; idx++) {
                    alerts.push(alert(`Alert ${idx + 1}`));
                }
            }

            if (!isNaN(numberOfFields)) {
                let idx = 0;
                for (idx; idx < numberOfFields; idx++) {
                    fieldsConfiguration.push(fieldConfig(idx + 1));
                }
            }

            const datasource = [].concat(
                sourceFields.datasource,
                dynamicFields
            );

            const props = {
                refreshInterval,
                url,
                httpConfiguration,
                properties: Object.assign({}, gConfig, {
                    fieldsConfiguration,
                    alerts,
                }),
                datasource,
                extractData,
                extractFields,
            };
            return <SandboxComponent component={component} {...props} />;
        },
        JSXConfiguration(name, version)
    );
