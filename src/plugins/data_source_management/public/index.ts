/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { from } from 'rxjs';
import { DataSourceManagementPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new DataSourceManagementPlugin();
}

export { DataSourceManagementPluginStart } from './types';
export { DataSourceSelector } from './components/data_source_selector';
export { DataSourceMenu } from './components/data_source_menu';
export { DataSourceManagementPlugin, DataSourceManagementPluginSetup } from './plugin';
export {
  DataSourceSelectableConfig,
  DataSourceComponentType,
  DataSourceAggregatedViewConfig,
  DataSourceViewConfig,
  DataSourceMenuProps,
  DataSourceMultiSelectableConfig,
  DataSourceBaseConfig,
} from './components/data_source_menu';

export { NoDataSource } from './components/no_data_source'