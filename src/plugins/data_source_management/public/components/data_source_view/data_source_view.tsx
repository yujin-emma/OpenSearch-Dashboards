/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiPopover,
  EuiButtonEmpty,
  EuiContextMenuPanel,
  EuiPanel,
  EuiSelectable,
} from '@elastic/eui';
import {
  SavedObjectsClientContract,
  ToastsStart,
  ApplicationStart,
} from 'opensearch-dashboards/public';
import { IUiSettingsClient } from 'src/core/public';
import { DataSourceBaseState, DataSourceOption } from '../data_source_menu/types';
import {
  getDataSourceById,
  handleDataSourceFetchError,
  handleNoAvailableDataSourceError,
} from '../utils';
import { DataSourceDropDownHeader } from '../drop_down_header';
import { DataSourceItem } from '../data_source_item';
import { LocalCluster } from '../constants';
import './data_source_view.scss';
import { DataSourceViewError } from './data_source_view_error';

interface DataSourceViewProps {
  fullWidth: boolean;
  selectedOption: DataSourceOption[];
  hideLocalCluster: boolean;
  application?: ApplicationStart;
  savedObjectsClient?: SavedObjectsClientContract;
  notifications?: ToastsStart;
  uiSettings?: IUiSettingsClient;
  dataSourceFilter?: (dataSource: any) => boolean;
  onSelectedDataSources?: (dataSources: DataSourceOption[]) => void;
}

interface DataSourceViewState extends DataSourceBaseState {
  selectedOption: DataSourceOption[];
  isPopoverOpen: boolean;
  defaultDataSource: string | null;
}

export class DataSourceView extends React.Component<DataSourceViewProps, DataSourceViewState> {
  private _isMounted: boolean = false;

  constructor(props: DataSourceViewProps) {
    super(props);

    this.state = {
      isPopoverOpen: false,
      selectedOption: this.props.selectedOption ? this.props.selectedOption : [],
      showEmptyState: false,
      showError: false,
      defaultDataSource: null,
    };
  }

  componentWillUnmount() {
    this._isMounted = false;
  }
  async componentDidMount() {
    this._isMounted = true;

    const selectedOption = this.props.selectedOption;
    const option = selectedOption[0];
    const optionId = option.id;

    const defaultDataSource = this.props.uiSettings?.get('defaultDataSource', null) ?? null;

    if (optionId === '' && !this.props.hideLocalCluster) {
      this.setState({
        selectedOption: [LocalCluster],
        defaultDataSource,
      });
      if (this.props.onSelectedDataSources) {
        this.props.onSelectedDataSources([LocalCluster]);
      }
      return;
    }

    if (
      (optionId === '' && this.props.hideLocalCluster) ||
      (this.props.dataSourceFilter &&
        this.props.selectedOption.filter(this.props.dataSourceFilter).length === 0)
    ) {
      this.setState({
        selectedOption: [],
      });
      if (this.props.onSelectedDataSources) {
        this.props.onSelectedDataSources([]);
      }
      return;
    }

    if (!option.label) {
      try {
        const selectedDataSource = await getDataSourceById(
          optionId,
          this.props.savedObjectsClient!
        );
        if (!this._isMounted) return;
        this.setState({
          selectedOption: [{ id: optionId, label: selectedDataSource.title }],
          defaultDataSource,
        });
        if (this.props.onSelectedDataSources) {
          this.props.onSelectedDataSources([{ id: optionId, label: selectedDataSource.title }]);
        }
      } catch (error) {
        if (defaultDataSource) {
          this.setState({ defaultDataSource });
        }
        handleDataSourceFetchError(
          this.onError.bind(this),
          this.props.notifications!,
          this.props.onSelectedDataSources
        );
      }
    } else if (this.props.onSelectedDataSources) {
      this.setState({
        ...this.state,
        defaultDataSource,
      });
      this.props.onSelectedDataSources([option]);
    }
  }

  onError() {
    this.setState({ showError: true });
  }

  onClick() {
    this.setState({ ...this.state, isPopoverOpen: !this.state.isPopoverOpen });
  }

  closePopover() {
    this.setState({ ...this.state, isPopoverOpen: false });
  }
  /**
   * when call handleSwitchDefaultDatasource, the default data source must exist,
   * since the button only display when defaultDataSource exist
   */
  async handleSwitchDefaultDatasource() {
    /**
     * default dataSource label must exist when defaultDataSource exist
     */
    const defaultDataSourceId = this.state.defaultDataSource;
    const defaultDataSourceLabel = (
      await getDataSourceById(defaultDataSourceId!, this.props.savedObjectsClient!)
    ).title;

    const defaultDataSourceOption = { id: defaultDataSourceId!, label: defaultDataSourceLabel };
    // reset the state to close popover and error, selectedOption will be replaced by default option
    this.setState({
      selectedOption: [defaultDataSourceOption],
      showError: false,
      isPopoverOpen: false,
    });
    this.props.onSelectedDataSources!([defaultDataSourceOption]);
  }

  render() {
    if (this.state.showError) {
      return (
        <DataSourceViewError
          application={this.props.application}
          dataSourceId={this.props.selectedOption[0].id}
          showSwitchButton={!!this.state.defaultDataSource}
          handleSwitchDefaultDatasource={() => this.handleSwitchDefaultDatasource()}
        />
      );
    }
    const label = this.state.selectedOption.length > 0 ? this.state.selectedOption[0].label : '';
    const options =
      this.state.selectedOption.length > 0
        ? this.state.selectedOption.map((option) => ({
            ...option,
            checked: 'on',
            disabled: true,
          }))
        : [];

    const button = (
      <>
        <EuiButtonEmpty
          className="dataSourceComponentButtonTitle"
          data-test-subj="dataSourceViewButton"
          onClick={this.onClick.bind(this)}
          aria-label={i18n.translate('dataSourceView.dataSourceOptionsViewAriaLabel', {
            defaultMessage: 'dataSourceViewButton',
          })}
          iconType="database"
          iconSide="left"
          size="s"
        >
          {label}
        </EuiButtonEmpty>
      </>
    );

    return (
      <EuiPopover
        id={'dataSourceViewPopover'}
        button={button}
        isOpen={this.state.isPopoverOpen}
        closePopover={this.closePopover.bind(this)}
        panelPaddingSize="none"
        anchorPosition="downLeft"
      >
        <DataSourceDropDownHeader totalDataSourceCount={1} application={this.props.application} />
        <EuiContextMenuPanel className={'dataSourceViewOuiPanel'}>
          <EuiPanel color="subdued" paddingSize="none" borderRadius="none">
            <EuiSelectable
              options={options}
              singleSelection={true}
              data-test-subj={'dataSourceView'}
              compressed={true}
              renderOption={(option) => (
                <DataSourceItem
                  option={option}
                  defaultDataSource={this.state.defaultDataSource}
                  className={'dataSourceView'}
                />
              )}
            >
              {(list) => list}
            </EuiSelectable>
          </EuiPanel>
        </EuiContextMenuPanel>
      </EuiPopover>
    );
  }
}
