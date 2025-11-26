'use client';

import React, { useState, useMemo } from 'react';
import { Card, Tabs, Button, Space, Input, Table, Tag, message, Modal } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ENTITY_CONFIG, GET_SAVED_VIEWS, GET_FILTERED_DATA } from '../graphql/queries';
import { CREATE_SAVED_VIEW, UPDATE_SAVED_VIEW, DELETE_SAVED_VIEW, PIN_SAVED_VIEW } from '../graphql/mutations';
import { QuickFiltersBar } from './QuickFiltersBar';
import { AdvancedFiltersDrawer } from './AdvancedFiltersDrawer';
import { EditColumnsModal } from './EditColumnsModal';
import { AllViewsDrawer } from './AllViewsDrawer';
import { generateTableColumns, getRowKey } from '../utils';

interface DynamicViewFilterProps {
  entityType: string; // 'products', 'orders', 'users', etc.
  customDataFetch?: (filters: any, page: number, limit: number) => Promise<any>; // Optional custom data fetching
  customRenderers?: Record<string, (value: any, record?: any) => React.ReactNode>; // Optional custom column renderers (backward compatibility)
  customColumns?: Record<string, Partial<any>>; // Optional full column configuration objects (width, align, render, etc.)
}

// Helper to strip __typename and other GraphQL cache fields
const cleanObject = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  } else if (obj !== null && typeof obj === 'object') {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      if (key !== '__typename' && key !== '_id' && obj[key] !== undefined) {
        cleaned[key] = cleanObject(obj[key]);
      }
    });
    return cleaned;
  }
  return obj;
};

export const DynamicViewFilter: React.FC<DynamicViewFilterProps> = ({
  entityType,
  customDataFetch,
  customRenderers,
  customColumns
}) => {
  // State
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [showAllViews, setShowAllViews] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showEditColumns, setShowEditColumns] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [newViewDescription, setNewViewDescription] = useState('');
  const [newViewVisibility, setNewViewVisibility] = useState<'private' | 'team' | 'everyone'>('everyone');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch entity configuration
  const { data: configData, loading: configLoading } = useQuery(GET_ENTITY_CONFIG, {
    variables: { entityType },
    fetchPolicy: "no-cache",
    onError: (error) => message.error(`Failed to load entity config: ${error.message}`)
  });
  
  const entityConfig = configData?.entityConfig;
  // console.log("entityType: ", entityType)
  // console.log("entityConfig: ", entityConfig)
  

  // Fetch saved views
  const { data: viewsData, loading: viewsLoading, refetch: refetchViews } = useQuery(GET_SAVED_VIEWS, {
    variables: { entityType, limit: 100, page: 1 },
    skip: !entityConfig,
    onCompleted: (data) => {
      // Set first view as active if none selected
      if (!activeViewId && data?.savedViews?.edges?.length > 0) {
        setActiveViewId(data.savedViews.edges[0]._id);
      }
    },
    onError: (error) => message.error(`Failed to load views: ${error.message}`)
  });

  const views = viewsData?.savedViews?.edges || [];
  const activeView = views.find((v: any) => v._id === activeViewId);
  const pinnedViews = views.filter((v: any) => v.isPinned);

  // Fetch filtered data
  const { data: filteredDataResult, loading: dataLoading, refetch: refetchData } = useQuery(GET_FILTERED_DATA, {
    variables: {
      entityType,
      viewId: activeViewId,
      limit: pageSize,
      page: currentPage,
      searchTerm
    },
    skip: !entityConfig || !activeViewId,
    onError: (error) => message.error(`Failed to load data: ${error.message}`)
  });

  const processedData = filteredDataResult?.filteredData?.edges || [];
  const totalCount = filteredDataResult?.filteredData?.totalCount || 0;
  const error = filteredDataResult?.filteredData?.error;
  if (error) message.error(error.message, 1.5)

  // Mutations
  const [createView] = useMutation(CREATE_SAVED_VIEW, {
    onCompleted: () => {
      message.success('View created successfully');
      refetchViews();
      setShowCreateModal(false);
      setNewViewName('');
      setNewViewDescription('');
    },
    onError: (error) => message.error(`Failed to create view: ${error.message}`)
  });

  const [updateView] = useMutation(UPDATE_SAVED_VIEW, {
    onCompleted: () => {
      message.success('View updated successfully');
      refetchViews();
    },
    onError: (error) => message.error(`Failed to update view: ${error.message}`)
  });

  const [deleteView] = useMutation(DELETE_SAVED_VIEW, {
    onCompleted: () => {
      message.success('View deleted successfully');
      refetchViews();
    },
    onError: (error) => message.error(`Failed to delete view: ${error.message}`)
  });

  const [pinView] = useMutation(PIN_SAVED_VIEW, {
    onCompleted: () => {
      refetchViews();
    },
    onError: (error) => message.error(`Failed to pin/unpin view: ${error.message}`)
  });

  // Handlers
  const handleCreateView = () => {
    if (!newViewName.trim()) {
      message.error('View name is required');
      return;
    }

    createView({
      variables: {
        input: {
          name: newViewName,
          description: newViewDescription,
          entityType,
          filters: [],
          columns: entityConfig?.defaultColumns || [],
          visibility: newViewVisibility,
          isPinned: true
        }
      }
    });
  };

  const handleDeleteView = (viewId: string) => {
    Modal.confirm({
      title: 'Delete View',
      content: 'Are you sure you want to delete this view?',
      onOk: () => {
        deleteView({ variables: { _id: viewId } });
        if (activeViewId === viewId) {
          setActiveViewId(views[0]?._id || null);
        }
      }
    });
  };

  const handleApplyColumns = (selectedColumns: string[]) => {
    if (!activeView) return;

    updateView({
      variables: {
        input: {
          _id: activeView._id,
          columns: selectedColumns
        }
      }
    });
  };

  const handleFilterChange = (filterId: string, newValue: any) => {
    if (!activeView) return;

    const updatedFilters = activeView.filters.map((f: any) =>
      f.id === filterId ? { ...f, value: newValue } : f
    );

    updateView({
      variables: {
        input: {
          _id: activeView._id,
          filters: cleanObject(updatedFilters)
        }
      }
    });
  };

  const handleRemoveFilter = (filterId: string) => {
    if (!activeView) return;

    const updatedFilters = activeView.filters.filter((f: any) => f.id !== filterId);

    updateView({
      variables: {
        input: {
          _id: activeView._id,
          filters: cleanObject(updatedFilters)
        }
      }
    });
  };

  const handleClearAllFilters = () => {
    if (!activeView) return;

    updateView({
      variables: {
        input: {
          _id: activeView._id,
          filters: []
        }
      }
    });
  };

  const handleApplyAdvancedFilters = (filterGroups: any[]) => {
    if (!activeView) return;

    const cleanedFilterGroups = cleanObject(filterGroups);
    const flatFilters = cleanedFilterGroups.flatMap((group: any) => group.conditions);

    updateView({
      variables: {
        input: {
          _id: activeView._id,
          filters: flatFilters,
          filterGroups: cleanedFilterGroups
        }
      }
    });
  };

  // Generate table columns
  const tableColumns = useMemo(() => {
    if (!activeView || !entityConfig) return [];
    return generateTableColumns(entityConfig, activeView.columns, entityType, customRenderers, customColumns).filter(col => col !== null);
  }, [activeView, entityConfig, entityType, customRenderers, customColumns]);

  // Loading states
  if (configLoading) return <Card loading />;

  if (!entityConfig) {
    return (<Card>
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <h3>Entity Configuration Not Found</h3>
        <p>Please configure the "{entityType}" entity in the View Manager first.</p>
        <Button type="primary" href="/console/view_manager">Go to View Manager</Button>
      </div>
    </Card>);
  }

  return (<>
    <Card styles={{ body: { padding: 0 } }}>
      {/* Tabs Section */}
      <div style={{ padding: '0 16px', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Tabs
            activeKey={activeViewId || undefined}
            onChange={setActiveViewId}
            items={pinnedViews.map((view: any) => ({
              key: view._id,
              label: (<Space>
                {view.name}
                {view.isDefault && <Tag color="green" style={{ fontSize: 10 }}>Default</Tag>}
              </Space>),
              closeIcon: !view.isDefault ? <CloseOutlined /> : null,
              closable: !view.isDefault
            }))}
            style={{ flex: 1 }}
          />

          <Space style={{ marginLeft: 16 }}>
            <Button type="text" icon={<PlusOutlined />} onClick={() => setShowCreateModal(true)}>Add view ({views.length}/50)</Button>
            <Button type="link" onClick={() => setShowAllViews(true)}>All Views</Button>
          </Space>
        </div>
      </div>

      {/* Quick Filters Section */}
      {activeView && entityConfig && (<QuickFiltersBar
        filters={activeView.filters || []}
        fields={entityConfig.fields}
        onFilterChange={handleFilterChange}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAllFilters}
        onAdvancedFiltersClick={() => setShowAdvancedFilters(true)}
        onRefresh={() => refetchData()}
      />)}

      {/* Table Section */}
      <div style={{ padding: 0 }}>
        <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Input.Search
            placeholder={`Search ${entityConfig.entityLabel.toLowerCase()}...`}
            style={{ width: 300 }}
            allowClear
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={() => refetchData()}
          />
          <Space>
            <Tag color="blue">
              {totalCount} {totalCount === 1 ? entityConfig.entityLabelSingular.toLowerCase() : entityConfig.entityLabel.toLowerCase()}
            </Tag>
            <Button>Export</Button>
            <Button onClick={() => setShowEditColumns(true)}>Edit columns</Button>
          </Space>
        </div>

        <Table
          rowKey={(record) => getRowKey(record, entityConfig.rowKey)}
          columns={tableColumns}
          dataSource={processedData}
          loading={dataLoading || viewsLoading}
          pagination={{
            current: currentPage,
            pageSize,
            total: totalCount,
            showSizeChanger: true,
            showTotal: (total) => `${total} ${total === 1 ? entityConfig.entityLabelSingular.toLowerCase() : entityConfig.entityLabel.toLowerCase()}`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 25);
            }
          }}
          scroll={{ x: 1200 }}
        />
      </div>
    </Card>

    {/* All Views Drawer */}
    <AllViewsDrawer
      visible={showAllViews}
      onClose={() => setShowAllViews(false)}
      views={views}
      activeViewId={activeViewId}
      onSelectView={setActiveViewId}
      onRefetch={refetchViews}
    />

    {/* Advanced Filters Drawer */}
    {activeView && entityConfig && (
      <AdvancedFiltersDrawer
        visible={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filterGroups={activeView.filterGroups || (activeView.filters?.length > 0 ? [{
          id: 'group_1',
          logic: 'AND' as const,
          conditions: activeView.filters
        }] : [])}
        fields={entityConfig.fields}
        onApply={handleApplyAdvancedFilters}
      />
    )}

    {/* Create View Modal */}
    <Modal
      title="Create a saved view"
      open={showCreateModal}
      onCancel={() => {
        setShowCreateModal(false);
        setNewViewName('');
        setNewViewDescription('');
      }}
      footer={[
        <Button key="cancel" onClick={() => setShowCreateModal(false)}>Cancel</Button>,
        <Button key="confirm" type="primary" onClick={handleCreateView} disabled={!newViewName.trim()}>Confirm</Button>
      ]}
    >
      <div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Name <span style={{ color: 'red' }}>*</span></label>
          <Input
            value={newViewName}
            onChange={(e) => setNewViewName(e.target.value)}
            placeholder="Enter view name"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Description</label>
          <Input.TextArea
            value={newViewDescription}
            onChange={(e) => setNewViewDescription(e.target.value)}
            placeholder="Enter view description (optional)"
            rows={3}
          />
        </div>
      </div>
    </Modal>

    {/* Edit Columns Modal */}
    {activeView && entityConfig && (
      <EditColumnsModal
        visible={showEditColumns}
        onClose={() => setShowEditColumns(false)}
        onApply={handleApplyColumns}
        availableColumns={entityConfig.availableColumns}
        selectedColumns={activeView.columns}
      />
    )}
  
  </>);
};
