import React from 'react';
import {createRoot} from 'react-dom/client'

import TestComponentLoader from '../../component-loader/dist/TestComponentLoader';

import Table from '../src/Table';
import { schema } from '../src/Table.schema';

const
 props = { Content: Table, schema },
 root = createRoot(document.getElementById('app'))

root.render( <TestComponentLoader {...props} />)