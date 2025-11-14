'use client';

import React, { useState, useMemo } from 'react';
import { Drawer, List, Card, Space, Tag, Button, Select, Input, Typography, Tooltip, Popconfirm, Avatar, Empty } from 'antd';
import {
  PushpinOutlined, PushpinFilled, EyeOutlined, CopyOutlined,
  DeleteOutlined, EditOutlined, UserOutlined, ClockCircleOutlined,
  TeamOutlined, GlobalOutlined, LockOutlined, StarFilled
} from '@ant-design/icons';
import { useMutation } from '@apollo/client';
import { PIN_SAVED_VIEW, DELETE_SAVED_VIEW } from '../graphql/mutations';
import moment from 'moment';

const { Text, Title } = Typography;
const { Search } = Input;

interface AllViewsDrawerProps {
  visible: boolean;
  onClose: () => void;
  views: any[];
  activeViewId: string | null;
  onSelectView: (viewId: string) => void;
  onRefetch: () => void;
}

type SortOption = 'name' | 'date' | 'usage';
type SortDirection = 'asc' | 'desc';

export const AllViewsDrawer: React.FC<AllViewsDrawerProps> = ({
  visible,
  onClose,
  views,
  activeViewId,
  onSelectView,
  onRefetch
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');

  const [pinView] = useMutation(PIN_SAVED_VIEW);
  const [deleteView] = useMutation(DELETE_SAVED_VIEW);

  // Filter and sort views
  const filteredAndSortedViews = useMemo(() => {
    let filtered = views;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(view =>
        view.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        view.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply visibility filter
    if (filterVisibility !== 'all') {
      filtered = filtered.filter(view => view.visibility === filterVisibility);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'date':
          compareValue = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'usage':
          compareValue = (a.usageCount || 0) - (b.usageCount || 0);
          break;
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  }, [views, searchTerm, sortBy, sortDirection, filterVisibility]);

  const handlePinToggle = async (viewId: string, currentPinStatus: boolean) => {
    try {
      await pinView({
        variables: {
          _id: viewId,
          isPinned: !currentPinStatus
        }
      });
      onRefetch();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const handleDelete = async (viewId: string) => {
    try {
      await deleteView({
        variables: { _id: viewId }
      });
      onRefetch();

      // If deleted view was active, switch to first available view
      if (viewId === activeViewId && views.length > 1) {
        const remainingViews = views.filter(v => v._id !== viewId);
        if (remainingViews.length > 0) {
          onSelectView(remainingViews[0]._id);
        }
      }
    } catch (error) {
      console.error('Failed to delete view:', error);
    }
  };

  const handleSwitchView = (viewId: string) => {
    onSelectView(viewId);
    onClose();
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'private':
        return <LockOutlined />;
      case 'team':
        return <TeamOutlined />;
      case 'everyone':
        return <GlobalOutlined />;
      default:
        return null;
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'private':
        return 'default';
      case 'team':
        return 'blue';
      case 'everyone':
        return 'green';
      default:
        return 'default';
    }
  };

  return (
    <Drawer
      title={<Space>
        <Title level={4} style={{ margin: 0 }}>All Views</Title>
        <Tag color="blue">{views.length} {views.length === 1 ? 'view' : 'views'}</Tag>
      </Space>}
      placement="right"
      onClose={onClose}
      open={visible}
      width={720}
    >
      {/* Filters and Search */}
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <Search
          placeholder="Search views by name or description..."
          allowClear
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%' }}
        />

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Text type="secondary">Filter:</Text>
            <Select
              value={filterVisibility}
              onChange={setFilterVisibility}
              style={{ width: 120 }}
              options={[
                { label: 'All Views', value: 'all' },
                { label: 'Private', value: 'private' },
                { label: 'Team', value: 'team' },
                { label: 'Everyone', value: 'everyone' }
              ]}
            />
          </Space>

          <Space>
            <Text type="secondary">Sort by:</Text>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 120 }}
              options={[
                { label: 'Name', value: 'name' },
                { label: 'Date Modified', value: 'date' },
                { label: 'Usage', value: 'usage' }
              ]}
            />
            <Button
              type="text"
              icon={sortDirection === 'asc' ? '↑' : '↓'}
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            />
          </Space>
        </Space>
      </Space>

      {/* Views List */}
      {filteredAndSortedViews.length === 0 ? (
        <Empty description="No views found" />
      ) : (
        <List
          dataSource={filteredAndSortedViews}
          renderItem={(view) => {
            const isActive = view._id === activeViewId;

            return (
              <Card
                key={view._id}
                style={{
                  marginBottom: 12,
                  border: isActive ? '2px solid #1890ff' : '1px solid #d9d9d9',
                  cursor: 'pointer'
                }}
                bodyStyle={{ padding: 16 }}
                onClick={() => handleSwitchView(view._id)}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  {/* Header Row */}
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      <Title level={5} style={{ margin: 0 }}>
                        {view.name}
                      </Title>
                      {isActive && <Tag color="blue">Active</Tag>}
                      {view.isDefault && (
                        <Tooltip title="Default view">
                          <StarFilled style={{ color: '#faad14' }} />
                        </Tooltip>
                      )}
                    </Space>

                    <Space onClick={(e) => e.stopPropagation()}>
                      <Tooltip title={view.isPinned ? 'Unpin from tabs' : 'Pin to tabs'}>
                        <Button
                          type="text"
                          size="small"
                          icon={view.isPinned ? <PushpinFilled style={{ color: '#1890ff' }} /> : <PushpinOutlined />}
                          onClick={() => handlePinToggle(view._id, view.isPinned)}
                        />
                      </Tooltip>

                      {!view.isDefault && (
                        <Popconfirm
                          title="Delete View"
                          description="Are you sure you want to delete this view?"
                          onConfirm={() => handleDelete(view._id)}
                          okText="Delete"
                          cancelText="Cancel"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                          />
                        </Popconfirm>
                      )}
                    </Space>
                  </Space>

                  {/* Description */}
                  {view.description && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {view.description}
                    </Text>
                  )}

                  {/* Metadata Row */}
                  <Space size="large" style={{ fontSize: 12 }}>
                    <Space size={4}>
                      {getVisibilityIcon(view.visibility)}
                      <Tag color={getVisibilityColor(view.visibility)} style={{ margin: 0 }}>
                        {view.visibility.charAt(0).toUpperCase() + view.visibility.slice(1)}
                      </Tag>
                    </Space>

                    <Space size={4}>
                      <UserOutlined />
                      <Text type="secondary">{view.owner?.name || 'Unknown'}</Text>
                    </Space>

                    <Space size={4}>
                      <ClockCircleOutlined />
                      <Text type="secondary">{moment(view.updatedAt).fromNow()}</Text>
                    </Space>

                    {view.usageCount !== undefined && (
                      <Space size={4}>
                        <EyeOutlined />
                        <Text type="secondary">{view.usageCount} uses</Text>
                      </Space>
                    )}
                  </Space>

                  {/* Filters Preview */}
                  {view.filters && view.filters.length > 0 && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Filters: {view.filters.map((f: any) => f.field).join(', ')}
                      </Text>
                    </div>
                  )}

                  {/* Columns Preview */}
                  {view.columns && view.columns.length > 0 && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Columns: {view.columns.slice(0, 5).join(', ')}
                        {view.columns.length > 5 && ` +${view.columns.length - 5} more`}
                      </Text>
                    </div>
                  )}
                </Space>
              </Card>
            );
          }}
        />
      )}
    </Drawer>
  );
};
