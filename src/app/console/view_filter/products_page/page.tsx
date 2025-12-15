'use client';

import React, { useState } from 'react';
import { Card, Tabs, Button, Space, Dropdown, Drawer, Modal, Input, Radio, Table, Tag, message } from 'antd';
import { PlusOutlined, FilterOutlined, CloseOutlined, MoreOutlined, DownOutlined } from '@ant-design/icons';
import { Page } from '@/template';
import { productsConfig } from '../configs/productsConfig';
import { products } from '../products';
import { SavedView, FilterCondition, FilterGroup } from '../types';
import { generateTableColumns, getRowKey, applyFilters, applySort } from '../utils';
import { EditColumnsModal } from '../components/EditColumnsModal';
import { QuickFiltersBar } from '../components/QuickFiltersBar';
import { AdvancedFiltersDrawer } from '../components/AdvancedFiltersDrawer';

// Initial saved views for products
const INITIAL_PRODUCT_VIEWS: SavedView[] = [
  {
    id: 'view1',
    name: 'All Products',
    description: 'View all products',
    filters: [],
    columns: productsConfig.defaultColumns,
    isPinned: true,
    visibility: 'everyone',
    owner: 'admin',
    isDefault: true
  },
  {
    id: 'view2',
    name: 'Online Products',
    description: 'Products that are currently online',
    filters: [
      {
        id: 'f1',
        field: 'status',
        operator: 'equals',
        value: 'online',
        isChangeable: true
      }
    ],
    columns: productsConfig.defaultColumns,
    isPinned: true,
    visibility: 'everyone',
    owner: 'admin'
  },
  {
    id: 'view3',
    name: 'Expirable Products',
    description: 'Products that have expiry dates',
    filters: [
      {
        id: 'f2',
        field: 'is_expirable',
        operator: 'is_true',
        value: true
      }
    ],
    columns: productsConfig.defaultColumns,
    isPinned: true,
    visibility: 'everyone',
    owner: 'admin'
  },
  {
    id: 'view4',
    name: 'Adams Brand Products',
    description: 'Products from Adams brand with changeable status filter',
    filters: [
      {
        id: 'f3',
        field: 'brand.title',
        operator: 'equals',
        value: 'Adams'
      },
      {
        id: 'f4',
        field: 'status',
        operator: 'in',
        value: ['online', 'offline'],
        isChangeable: true
      }
    ],
    quickFilters: [
      {
        field: 'status',
        label: 'Status',
        options: [
          { label: 'Online', value: 'online' },
          { label: 'Offline', value: 'offline' },
          { label: 'Draft', value: 'draft' }
        ],
        currentValue: ['online', 'offline']
      }
    ],
    columns: [...productsConfig.defaultColumns, 'is_expirable', 'fit_for_dispatch'],
    isPinned: true,
    visibility: 'private',
    owner: 'admin'
  }
];

interface AllViewProps {
  views: SavedView[];
  setActiveViewId: (id: string) => void;
  setShowAllViews: (show: boolean) => void;
  handleDeleteView: (id: string) => void;
}

const AllView = ({ views, setActiveViewId, setShowAllViews, handleDeleteView }: AllViewProps) => {
  return (<Tabs
    defaultActiveKey="all"
    items={[
      {
        key: 'all',
        label: 'All views',
        children: (
          <Table
            rowKey="id"
            columns={[
              { title: 'View Name', dataIndex: 'name', key: 'name' },
              {
                title: 'Description',
                dataIndex: 'description',
                key: 'description',
                render: (text) => text || '--'
              },
              { title: 'Owner', dataIndex: 'owner', key: 'owner' },
              {
                title: 'Shared With',
                dataIndex: 'visibility',
                key: 'visibility',
                render: (visibility) => (
                  <Tag>{visibility === 'everyone' ? 'Everyone' : visibility === 'team' ? 'My team' : 'Private'}</Tag>
                )
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, record: SavedView) => (
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'apply',
                          label: 'Apply',
                          onClick: () => {
                            setActiveViewId(record.id);
                            setShowAllViews(false);
                            message.success(`Applied view: ${record.name}`);
                          }
                        },
                        { key: 'edit', label: 'Edit' },
                        { key: 'clone', label: 'Clone' },
                        {
                          key: 'delete',
                          label: 'Delete',
                          danger: !record.isDefault,
                          disabled: record.isDefault,
                          onClick: () => handleDeleteView(record.id)
                        }
                      ]
                    }}
                  >
                    <Button type="text" icon={<MoreOutlined />} />
                  </Dropdown>
                )
              }
            ]}
            dataSource={views}
            pagination={false}
          />
        )
      },
      {
        key: 'default',
        label: 'Default views',
        children: (
          <Table
            rowKey="id"
            columns={[
              { title: 'View Name', dataIndex: 'name', key: 'name' },
              { title: 'Description', dataIndex: 'description', key: 'description' }
            ]}
            dataSource={views.filter((v:any) => v.isDefault)}
            pagination={false}
          />
        )
      }
    ]}
  />)
}

function ProductsFilterPage() {
  const [views, setViews] = useState<SavedView[]>(INITIAL_PRODUCT_VIEWS);
  const [activeViewId, setActiveViewId] = useState<string>('view1');
  const [showAllViews, setShowAllViews] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditColumns, setShowEditColumns] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [newViewDescription, setNewViewDescription] = useState('');
  const [newViewVisibility, setNewViewVisibility] = useState<'private' | 'team' | 'everyone'>('everyone');

  const activeView = views.find(v => v.id === activeViewId);
  const pinnedViews = views.filter(v => v.isPinned);

  // Apply filters and sorting to data
  const processedData = React.useMemo(() => {
    let result = [...products];

    // Apply filters
    if (activeView && activeView.filters.length > 0) {
      result = applyFilters(result, activeView.filters);
    }

    // Apply sorting
    if (activeView?.sort) {
      result = applySort(result, activeView.sort.field, activeView.sort.direction);
    } else if (productsConfig.defaultSort) {
      result = applySort(result, productsConfig.defaultSort.field, productsConfig.defaultSort.direction);
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, products]);

  // Handle filter change (defined before useMemo)
  const handleFilterChange = (filterId: string, newValue: any) => {
    if (!activeView) return;

    const updatedFilters = activeView.filters.map(f =>
      f.id === filterId ? { ...f, value: newValue } : f
    );

    const updatedView = { ...activeView, filters: updatedFilters };
    setViews(views.map(v => v.id === activeView.id ? updatedView : v));
  };

  // Generate table columns with filter dropdowns for changeable filters
  const tableColumns = React.useMemo(() => {
    if (!activeView) return [];
    const baseColumns = generateTableColumns(productsConfig, activeView.columns);

    // Add filter dropdowns to column headers for changeable filters
    return baseColumns.filter(col => col !== null).map(column => {
      if (!column) return column;

      const changeableFilter = activeView.filters.find(
        f => f.field === column.key && f.isChangeable
      );

      if (changeableFilter) {
        const field = productsConfig.fields.find(f => f.key === column.key);

        if (field?.options) {
          const filterValue = Array.isArray(changeableFilter.value)
            ? changeableFilter.value
            : [changeableFilter.value];

          const filterCount = filterValue.filter(v => v != null).length;

          return {
            ...column,
            title: (
              <Dropdown
                menu={{
                  items: field.options.map(opt => ({
                    key: opt.value,
                    label: opt.label
                  })),
                  selectable: true,
                  multiple: true,
                  selectedKeys: filterValue,
                  onSelect: ({ key }) => {
                    const newValue = [...filterValue, key];
                    handleFilterChange(changeableFilter.id, newValue);
                  },
                  onDeselect: ({ key }) => {
                    const newValue = filterValue.filter(v => v !== key);
                    handleFilterChange(changeableFilter.id, newValue.length > 0 ? newValue : null);
                  }
                }}
                trigger={['click']}
              >
                <Button type="text" style={{ padding: 0, height: 'auto' }}>
                  <Space size={4}>
                    {filterCount > 0 && `(${filterCount}) `}
                    {column.title as any}
                    <DownOutlined style={{ fontSize: 10 }} />
                  </Space>
                </Button>
              </Dropdown>
            )
          };
        }
      }

      return column;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, views, handleFilterChange]);

  const handleCreateView = () => {
    if (!newViewName.trim()) {
      message.error('View name is required');
      return;
    }

    const newView: SavedView = {
      id: `view${Date.now()}`,
      name: newViewName,
      description: newViewDescription,
      filters: [],
      columns: productsConfig.defaultColumns,
      isPinned: true,
      visibility: newViewVisibility,
      owner: 'admin'
    };

    setViews([...views, newView]);
    setActiveViewId(newView.id);
    setShowCreateModal(false);
    setNewViewName('');
    setNewViewDescription('');
    message.success(`View "${newViewName}" created successfully`);
  };

  const handleDeleteView = (viewId: string) => {
    Modal.confirm({
      title: 'Delete View',
      content: 'Are you sure you want to delete this view?',
      onOk: () => {
        setViews(views.filter(v => v.id !== viewId));
        if (activeViewId === viewId) {
          setActiveViewId(views[0]?.id || '');
        }
        message.success('View deleted successfully');
      }
    });
  };

  const handleApplyColumns = (selectedColumns: string[]) => {
    if (!activeView) return;

    const updatedView = { ...activeView, columns: selectedColumns };
    setViews(views.map(v => v.id === activeView.id ? updatedView : v));
    message.success('Columns updated successfully');
  };

  const handleRemoveFilter = (filterId: string) => {
    if (!activeView) return;

    const updatedFilters = activeView.filters.filter(f => f.id !== filterId);
    const updatedView = { ...activeView, filters: updatedFilters };
    setViews(views.map(v => v.id === activeView.id ? updatedView : v));
    message.success('Filter removed');
  };

  const handleClearAllFilters = () => {
    if (!activeView) return;

    const updatedView = { ...activeView, filters: [] };
    setViews(views.map(v => v.id === activeView.id ? updatedView : v));
    message.success('All filters cleared');
  };

  const handleApplyAdvancedFilters = (filterGroups: FilterGroup[]) => {
    if (!activeView) return;

    // Convert filter groups to flat filter list for backward compatibility
    const flatFilters = filterGroups.flatMap(group => group.conditions);

    const updatedView = {
      ...activeView,
      filters: flatFilters,
      filterGroups
    };
    setViews(views.map(v => v.id === activeView.id ? updatedView : v));
  };

  return (<>
    <Page>
      <Card styles={{ body: { padding: 0 } }}>
        {/* Tabs Section */}
        <div style={{ padding: '0 16px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Tabs */}
            <Tabs
              activeKey={activeViewId}
              onChange={setActiveViewId}
              items={pinnedViews.map(view => ({
                key: view.id,
                label: (<Space>
                  {view.name}
                  {view.isDefault && <Tag color="green" style={{ fontSize: 10 }}>Default</Tag>}
                </Space>),
                closeIcon: !view.isDefault ? <CloseOutlined /> : null,
                closable: !view.isDefault
              }))}
              style={{ flex: 1 }}
            />

            {/* Right side actions */}
            <Space style={{ marginLeft: 16 }}>
              <Button type="text" icon={<PlusOutlined />} onClick={() => setShowCreateModal(true)}>Add view ({views.length}/50)</Button>
              <Button type="link" onClick={() => setShowAllViews(true)}>All Views</Button>
            </Space>
          </div>
        </div>

        {/* Quick Filters Section */}
        {activeView && (<QuickFiltersBar
          filters={activeView.filters}
          fields={productsConfig.fields}
          onFilterChange={handleFilterChange}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
          onAdvancedFiltersClick={() => setShowAdvancedFilters(true)}
        />)}

        {/* Table Section */}
        <div style={{ padding: 0 }}>
          <div style={{ padding: "10px 16px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Input.Search
              placeholder={`Search ${productsConfig.entityLabel.toLowerCase()}...`}
              style={{ width: 300 }}
              allowClear
            />
            <Space>
              <Tag color="blue">{processedData.length} {processedData.length === 1 ? productsConfig.entityLabelSingular.toLowerCase() : productsConfig.entityLabel.toLowerCase()}</Tag>
              <Button>Export</Button>
              <Button onClick={() => setShowEditColumns(true)}>Edit columns</Button>
            </Space>
          </div>

          <Table
            rowKey={(record) => getRowKey(record, productsConfig.rowKey)}
            columns={tableColumns}
            dataSource={processedData}
            pagination={{
              total: processedData.length,
              pageSize: 25,
              showSizeChanger: true,
              showTotal: (total) => `${total} ${total === 1 ? productsConfig.entityLabelSingular.toLowerCase() : productsConfig.entityLabel.toLowerCase()}`
            }}
            scroll={{ x: 1200 }}
          />
        </div>
      </Card>

      {/* All Views Drawer */}
      <Drawer title="All Views" open={showAllViews} onClose={() => setShowAllViews(false)} width={720}>
        <AllView views={views} setActiveViewId={setActiveViewId} setShowAllViews={setShowAllViews} handleDeleteView={handleDeleteView} />
      </Drawer>

      {/* Advanced Filters Drawer */}
      {activeView && (
        <AdvancedFiltersDrawer
          visible={showAdvancedFilters}
          onClose={() => setShowAdvancedFilters(false)}
          filterGroups={activeView.filterGroups || (activeView.filters.length > 0 ? [{
            id: 'group_1',
            logic: 'AND' as const,
            conditions: activeView.filters
          }] : [])}
          fields={productsConfig.fields}
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
          <Button
            key="confirm"
            type="primary"
            onClick={handleCreateView}
            disabled={!newViewName.trim()}
          >
            Confirm
          </Button>
        ]}
      >
        <div>
          <p style={{ color: '#666', marginBottom: 16 }}>Saved views created: {views.length} of 5,000</p>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Name <span style={{ color: 'red' }}>*</span>
            </label>
            <Input
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="Enter view name"
            />
            {!newViewName.trim() && newViewName.length > 0 && (
              <span style={{ color: 'red', fontSize: 12 }}>View name can&apos;t be blank</span>
            )}
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

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Shared with:</label>
            <Radio.Group
              value={newViewVisibility}
              onChange={(e) => setNewViewVisibility(e.target.value)}
            >
              <Space direction="vertical">
                <Radio value="private">Private</Radio>
                <Radio value="team" disabled>
                  My team:
                  <div style={{ color: '#999', fontSize: 12, marginLeft: 24 }}>
                    You are not on any teams to share this view with
                  </div>
                </Radio>
                <Radio value="everyone">Everyone</Radio>
              </Space>
            </Radio.Group>
          </div>
        </div>
      </Modal>

      {/* Edit Columns Modal */}
      {activeView && (
        <EditColumnsModal
          visible={showEditColumns}
          onClose={() => setShowEditColumns(false)}
          onApply={handleApplyColumns}
          availableColumns={productsConfig.availableColumns}
          selectedColumns={activeView.columns}
        />
      )}
    </Page>
  </>);
}

export default ProductsFilterPage
