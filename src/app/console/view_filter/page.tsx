'use client';

import React, { useState } from 'react';
import { Card, Tabs, Button, Space, Dropdown, Drawer, Modal, Input, Radio, Table, Tag } from 'antd';
import { PlusOutlined, FilterOutlined, CloseOutlined, MoreOutlined, DownOutlined } from '@ant-design/icons';
import { Page } from '@_/template';


// Dummy data types
interface SavedView {
  id: string;
  name: string;
  filters: FilterCondition[];
  quickFilters?: QuickFilter[];
  visibility: 'private' | 'team' | 'everyone';
  owner: string;
  isPinned: boolean;
}

interface FilterCondition {
  id: string;
  field: string;
  operator: string;
  value: any;
  isChangeable?: boolean; // For filters that users can modify without editing the view
}

interface QuickFilter {
  field: string;
  label: string;
  options: { label: string; value: any }[];
  currentValue?: any;
}

// Dummy saved views
const DUMMY_VIEWS: SavedView[] = [
  {
    id: 'view1',
    name: 'All contacts',
    filters: [],
    isPinned: true,
    visibility: 'everyone',
    owner: 'faheem dev'
  },
  {
    id: 'view2',
    name: 'Newsletter subscribers',
    filters: [
      { id: 'f1', field: 'subscription_status', operator: 'equals', value: 'subscribed' }
    ],
    isPinned: true,
    visibility: 'everyone',
    owner: 'faheem dev'
  },
  {
    id: 'view3',
    name: 'Unsubscribed',
    filters: [
      { id: 'f2', field: 'subscription_status', operator: 'equals', value: 'unsubscribed' }
    ],
    isPinned: true,
    visibility: 'everyone',
    owner: 'faheem dev'
  },
  {
    id: 'view4',
    name: 'All customers',
    filters: [
      { id: 'f3', field: 'contact_type', operator: 'equals', value: 'customer' }
    ],
    isPinned: true,
    visibility: 'everyone',
    owner: 'faheem dev'
  },
  {
    id: 'view5',
    name: 'Test View',
    filters: [
      { id: 'f4', field: 'lead_status', operator: 'in', value: ['new', 'open'], isChangeable: true }
    ],
    quickFilters: [
      {
        field: 'contact_owner',
        label: 'Contact owner',
        options: [
          { label: 'John Doe', value: 'john' },
          { label: 'Jane Smith', value: 'jane' },
          { label: 'Unassigned', value: 'unassigned' }
        ]
      },
      {
        field: 'create_date',
        label: 'Create date',
        options: [
          { label: 'Last 7 days', value: 'last_7_days' },
          { label: 'Last 30 days', value: 'last_30_days' },
          { label: 'This month', value: 'this_month' }
        ]
      },
      {
        field: 'last_activity_date',
        label: 'Last activity date',
        options: [
          { label: 'Today', value: 'today' },
          { label: 'Yesterday', value: 'yesterday' },
          { label: 'Last 7 days', value: 'last_7_days' }
        ]
      },
      {
        field: 'lead_status',
        label: 'Lead status',
        options: [
          { label: 'New', value: 'new' },
          { label: 'Open', value: 'open' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Open Deal', value: 'open_deal' },
          { label: 'Unqualified', value: 'unqualified' },
          { label: 'Unassigned', value: 'unassigned' }
        ],
        currentValue: ['new', 'open']
      }
    ],
    isPinned: true,
    visibility: 'private',
    owner: 'faheem dev'
  }
];

// Available filter fields
const AVAILABLE_FILTERS = [
  { label: 'Campaign of last booking in meetings tool', value: 'campaign_last_booking', group: 'Contact activity' },
  { label: 'Date of last meeting booked in meetings tool', value: 'last_meeting_date', group: 'Contact activity' },
  { label: 'First conversion', value: 'first_conversion', group: 'Contact activity' },
  { label: 'First conversion date', value: 'first_conversion_date', group: 'Contact activity' },
  { label: 'Last activity date', value: 'last_activity_date', group: 'Contact activity' },
  { label: 'Last contacted', value: 'last_contacted', group: 'Contact activity' },
  { label: 'Lead status', value: 'lead_status', group: 'Contact information' },
  { label: 'Contact owner', value: 'contact_owner', group: 'Contact information' },
  { label: 'Create date', value: 'create_date', group: 'Contact information' },
  { label: 'Email', value: 'email', group: 'Contact information' },
  { label: 'Phone number', value: 'phone_number', group: 'Contact information' },
];

export default function ViewFilterPage() {
  const [views, setViews] = useState<SavedView[]>(DUMMY_VIEWS);
  const [activeViewId, setActiveViewId] = useState<string>('view1');
  const [showAllViews, setShowAllViews] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [newViewVisibility, setNewViewVisibility] = useState<'private' | 'team' | 'everyone'>('everyone');

  const activeView = views.find(v => v.id === activeViewId);
  const pinnedViews = views.filter(v => v.isPinned);

  // Dummy table data
  const tableData = [
    {
      key: '1',
      name: 'Brian Halligan (Sample Contact)',
      email: 'bh@hubspot.com',
      phone: '--',
      leadStatus: '--',
      favoriteTopics: '--',
      preferredChannels: '--'
    },
    {
      key: '2',
      name: 'Maria Johnson (Sample Contact)',
      email: 'emailmaria@hubspot.com',
      phone: '--',
      leadStatus: '--',
      favoriteTopics: '--',
      preferredChannels: '--'
    }
  ];

  const tableColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name', sorter: true },
    { title: 'Email', dataIndex: 'email', key: 'email', sorter: true },
    { title: 'Phone Number', dataIndex: 'phone', key: 'phone', sorter: true },
    { title: 'Lead Status', dataIndex: 'leadStatus', key: 'leadStatus', sorter: true },
    { title: 'Favorite Content Topics', dataIndex: 'favoriteTopics', key: 'favoriteTopics', sorter: true },
    { title: 'Preferred Channels', dataIndex: 'preferredChannels', key: 'preferredChannels', sorter: true },
  ];

  const handleCreateView = () => {
    if (!newViewName.trim()) {
      return;
    }

    const newView: SavedView = {
      id: `view${views.length + 1}`,
      name: newViewName,
      filters: [],
      isPinned: true,
      visibility: newViewVisibility,
      owner: 'faheem dev'
    };

    setViews([...views, newView]);
    setActiveViewId(newView.id);
    setShowCreateModal(false);
    setNewViewName('');
  };

  const handleDeleteView = (viewId: string) => {
    setViews(views.filter(v => v.id !== viewId));
    if (activeViewId === viewId) {
      setActiveViewId(views[0]?.id || '');
    }
  };

  return (
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
                label: view.name,
                closeIcon: view.id !== 'view1' ? <CloseOutlined /> : null,
                closable: view.id !== 'view1'
              }))}
              style={{ flex: 1 }}
            />

            {/* Right side actions */}
            <Space style={{ marginLeft: 16 }}>
              <Button
                type="text"
                icon={<PlusOutlined />}
                onClick={() => setShowCreateModal(true)}
              >
                Add view ({views.length}/5)
              </Button>
              <Button type="link" onClick={() => setShowAllViews(true)}>
                All Views
              </Button>
            </Space>
          </div>
        </div>

        {/* Quick Filters and Advanced Filters Section */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', backgroundColor: '#fafafa' }}>
          <Space size="middle">
            {/* Quick Filters - shown as dropdowns */}
            {activeView?.quickFilters?.map((qf, index) => (
              <Dropdown
                key={index}
                menu={{
                  items: qf.options.map(opt => ({
                    key: opt.value,
                    label: opt.label
                  })),
                  selectable: true,
                  multiple: true,
                  selectedKeys: Array.isArray(qf.currentValue) ? qf.currentValue : [qf.currentValue]
                }}
                trigger={['click']}
              >
                <Button>
                  {qf.label} <DownOutlined />
                </Button>
              </Dropdown>
            ))}

            {/* More button for additional filters */}
            {activeView?.quickFilters && activeView.quickFilters.length > 3 && (
              <Button>+ More</Button>
            )}

            {/* Advanced Filters Button */}
            <Button
              icon={<FilterOutlined />}
              onClick={() => setShowAdvancedFilters(true)}
            >
              Advanced filters
            </Button>
          </Space>
        </div>

        {/* Table Section */}
        <div style={{ padding: 16 }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Input.Search
              placeholder="Search"
              style={{ width: 300 }}
              allowClear
            />
            <Space>
              <Button>Export</Button>
              <Button>Edit columns</Button>
            </Space>
          </div>

          <Table
            // rowKey={(row) => (row.id)}
            rowKey="key"
            columns={tableColumns}
            dataSource={tableData}
            pagination={{
              total: 2,
              pageSize: 25,
              showSizeChanger: true,
              showTotal: (total) => `${total} records`
            }}
          />
        </div>
      </Card>

      {/* All Views Drawer */}
      <Drawer
        title="All Views"
        open={showAllViews}
        onClose={() => setShowAllViews(false)}
        width={720}
      >
        <Tabs
          defaultActiveKey="all"
          items={[
            {
              key: 'all',
              label: 'All views',
              children: (
                <Table
                    rowKey="key"
                  columns={[
                    { title: 'View Name', dataIndex: 'name', key: 'name' },
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
                      render: (_, record: any) => (
                        <Dropdown
                          menu={{
                            items: [
                              { key: 'edit', label: 'Edit' },
                              { key: 'clone', label: 'Clone' },
                              { key: 'delete', label: 'Delete', danger: true, onClick: () => handleDeleteView(record.id) }
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
              children: <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>No default views</div>
            }
          ]}
        />
      </Drawer>

      {/* Advanced Filters Drawer */}
      <Drawer
        title="All Filters"
        open={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        width={720}
      >
        <div style={{ display: 'flex', height: '100%' }}>
          {/* Left side - Current filters */}
          <div style={{ flex: 1, borderRight: '1px solid #f0f0f0', padding: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <h4>Quick filters</h4>
              <p style={{ color: '#666', fontSize: 12 }}>These filters were set within the current table.</p>
            </div>

            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>AND</div>

            <div>
              <h4>Advanced Filters</h4>
              {activeView?.filters.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                  This view doesn't have any advanced filters. Select a filter to begin.
                </div>
              ) : (
                <div>
                  {activeView?.filters.map((filter) => (
                    <Card key={filter.id} size="small" style={{ marginBottom: 8 }}>
                      <Space>
                        <span>{filter.field}</span>
                        <span>{filter.operator}</span>
                        <Tag>{String(filter.value)}</Tag>
                        <Button type="text" size="small" icon={<CloseOutlined />} />
                      </Space>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Button type="primary" style={{ marginTop: 16 }}>
              Apply filters
            </Button>
          </div>

          {/* Right side - Add filter */}
          <div style={{ flex: 1, padding: 16 }}>
            <h4>Add filter</h4>
            <Input.Search
              placeholder="Search in contact properties"
              style={{ marginBottom: 16 }}
            />

            <div>
              {AVAILABLE_FILTERS.map((filter) => (
                <div
                  key={filter.value}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderRadius: 4
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {filter.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Drawer>

      {/* Create View Modal */}
      <Modal
        title="Create a saved view"
        open={showCreateModal}
        onCancel={() => {
          setShowCreateModal(false);
          setNewViewName('');
        }}
        footer={[
          <Button key="cancel" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>,
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
          <p style={{ color: '#666', marginBottom: 16 }}>
            Saved views created: {views.length} of 5,000
          </p>

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
              <span style={{ color: 'red', fontSize: 12 }}>View name can't be blank</span>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Shared with:
            </label>
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
    </Page>
  );
}