import React from 'react';
import ReactDOM from 'react-dom';
import '@atlaskit/css-reset';
import AppProvider from '@atlaskit/app-provider';

import Example from './example';

ReactDOM.render(
  <AppProvider children={<Example />}>
    <Example />
  </AppProvider>,
  document.getElementById('root')
);