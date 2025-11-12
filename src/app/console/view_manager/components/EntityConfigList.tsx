import React from 'react';
import { Table, Button, Tag, Space, Modal, message, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useMutation } from '@apollo/client';
import { DELETE_ENTITY_CONFIG } from '../graphql/mutations';

interface EntityConfigListProps {
  configs: any[];
  loading: boolean;
  onEdit: (config: any) => void;
  onRefetch: () => void;
}

export const EntityConfigList: React.FC<EntityConfigListProps> = ({
  configs,
  loading,
  onEdit,
  onRefetch
}) => {
  const [deleteConfig] = useMutation(DELETE_ENTITY_CONFIG, {
    onCompleted: (data) => {
      if (data.deleteEntityConfig.error) {
        message.error(data.deleteEntityConfig.error.message);
      } else {
        message.success('Entity config deleted successfully');
        onRefetch();
      }
    },
    onError: (error) => {
      message.error(`Failed to delete: ${error.message}`);
    }
  });

  const handleDelete = (config: any) => {
    Modal.confirm({
      title: 'Delete Entity Configuration',
      content: `Are you sure you want to delete the configuration for "${config.entityLabel}"? This will not delete the actual data.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        deleteConfig({ variables: { _id: config._id } });
      }
    });
  };

  const columns = [
    {
      title: 'Entity Type', dataIndex: 'entityType', key: 'entityType',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Label', dataIndex: 'entityLabel', key: 'entityLabel',
      render: (text: string, record: any) => (<div>
        <div style={{ fontWeight: 500 }}>{text}</div>
        <div style={{ fontSize: 12, color: '#666' }}>Singular: {record.entityLabelSingular}</div>
      </div>)
    },
    {
      title: 'Fields', key: 'fields',
      render: (_: any, record: any) => (<Tooltip title={`${record.fields?.length || 0} fields configured`}>
        <Tag>{record.fields?.length || 0} fields</Tag>
      </Tooltip>)
    },
    {
      title: 'Columns', key: 'columns',
      render: (_: any, record: any) => (<div>
        <Tag>{record.availableColumns?.length || 0} available</Tag>
        <Tag color="green">{record.defaultColumns?.length || 0} default</Tag>
      </div>)
    },
    {
      title: 'Default Sort', key: 'defaultSort',
      render: (_: any, record: any) => {
        if (!record.defaultSort?.field) return '--';
        return (<span>
          {record.defaultSort.field}{' '}
          <Tag color={record.defaultSort.direction === 'asc' ? 'blue' : 'orange'}>
            {record.defaultSort.direction}
          </Tag>
        </span>);
      }
    },
    {
      title: 'Status', dataIndex: 'isActive', key: 'isActive',
      render: (isActive: boolean) => (<Tag color={isActive ? 'green' : 'red'}>
        {isActive ? 'Active' : 'Inactive'}
      </Tag>)
    },
    // {
    //   title: 'Created', dataIndex: 'createdAt', key: 'createdAt',
    //   render: (date: string) => {
    //     if (!date) return '--';
    //     return new Date(date).toLocaleDateString();
    //   }
    // },
    {
      title: 'Actions', key: 'actions', fixed: 'right' as const, width: 150,
      render: (_: any, record: any) => (<Space>
          <Tooltip title="View Details">
            <Button type="text" size="small" icon={<EyeOutlined />}
              onClick={() => {
                Modal.info({
                  title: `${record.entityLabel} Configuration`,
                  width: 800,
                  content: (
                    <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
                      <h4>Fields ({record.fields?.length || 0})</h4>
                      <Table
                        size="small"
                        dataSource={record.fields}
                        columns={[
                          { title: 'Key', dataIndex: 'key', key: 'key' },
                          { title: 'Label', dataIndex: 'label', key: 'label' },
                          { title: 'Type', dataIndex: 'type', key: 'type' },
                          { title: 'Group', dataIndex: 'group', key: 'group' }
                        ]}
                        pagination={false}
                        rowKey="key"
                      />
                      <h4 style={{ marginTop: 16 }}>Columns ({record.availableColumns?.length || 0})</h4>
                      <Table
                        size="small"
                        dataSource={record.availableColumns}
                        columns={[
                          { title: 'Key', dataIndex: 'key', key: 'key' },
                          { title: 'Label', dataIndex: 'label', key: 'label' },
                          {
                            title: 'Visible',
                            dataIndex: 'visible',
                            key: 'visible',
                            render: (v: boolean) => (
                              <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag>
                            )
                          }
                        ]}
                        pagination={false}
                        rowKey="key"
                      />
                    </div>
                  )
                });
              }}
            />
          </Tooltip>

          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          </Tooltip>
          
          <Tooltip title="Delete">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (<div>
    <div style={{ marginBottom: 16 }}>
      <p style={{ color: '#666' }}>Entity configurations define how different data types (products, orders, users, etc.) are filtered and displayed.</p>
    </div>

    <Table
      columns={columns}
      dataSource={configs}
      loading={loading}
      rowKey="_id"
      scroll={{ x: 1200 }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} configurations`
      }}
    />
    
  </div>);
};
