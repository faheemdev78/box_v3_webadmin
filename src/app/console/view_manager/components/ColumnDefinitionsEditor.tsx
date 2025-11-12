import React, { useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Switch, Space, Tag, Tooltip, message, InputNumber
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';

interface ColumnDefinitionsEditorProps {
  columns: any[];
  onChange: (columns: any[]) => void;
  availableFields: any[];
}

export const ColumnDefinitionsEditor: React.FC<ColumnDefinitionsEditorProps> = ({
  columns,
  onChange,
  availableFields
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingColumn, setEditingColumn] = useState<any>(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingColumn(null);
    form.resetFields();
    form.setFieldsValue({
      visible: true,
      sortable: true,
      frozen: false
    });
    setShowModal(true);
  };

  const handleEdit = (column: any) => {
    setEditingColumn(column);
    form.setFieldsValue({
      ...column,
      visible: column.visible !== false,
      sortable: column.sortable !== false,
      frozen: column.frozen === true
    });
    setShowModal(true);
  };

  const handleDuplicate = (column: any) => {
    const newColumn = {
      ...column,
      key: `${column.key}_copy`,
      label: `${column.label} (Copy)`
    };
    onChange([...columns, newColumn]);
    message.success('Column duplicated');
  };

  const handleDelete = (column: any) => {
    Modal.confirm({
      title: 'Delete Column',
      content: `Are you sure you want to delete "${column.label}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        onChange(columns.filter(c => c.key !== column.key));
        message.success('Column deleted');
      }
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const columnData = {
        key: values.key,
        label: values.label,
        visible: values.visible !== false,
        sortable: values.sortable !== false,
        width: values.width,
        frozen: values.frozen === true,
        group: values.group
      };

      if (editingColumn) {
        // Update existing column
        onChange(columns.map(c => c.key === editingColumn.key ? columnData : c));
        message.success('Column updated');
      } else {
        // Check for duplicate key
        if (columns.some(c => c.key === columnData.key)) {
          message.error('Column key already exists');
          return;
        }
        // Add new column
        onChange([...columns, columnData]);
        message.success('Column added');
      }

      setShowModal(false);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const tableColumns = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      width: 200,
      render: (text: string) => <code>{text}</code>
    },
    {
      title: 'Label',
      dataIndex: 'label',
      key: 'label',
      width: 200
    },
    {
      title: 'Group',
      dataIndex: 'group',
      key: 'group',
      width: 150,
      render: (text: string) => text || '--'
    },
    {
      title: 'Width',
      dataIndex: 'width',
      key: 'width',
      width: 100,
      render: (width: number) => width ? `${width}px` : 'Auto'
    },
    {
      title: 'Properties',
      key: 'properties',
      width: 200,
      render: (_: any, record: any) => (
        <Space size={4}>
          {record.visible !== false && <Tag color="green">Visible</Tag>}
          {record.sortable !== false && <Tag color="blue">Sortable</Tag>}
          {record.frozen && <Tag color="orange">Frozen</Tag>}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 120,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Duplicate">
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleDuplicate(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (<div>
    <div style={{ marginBottom: 16 }}>
      <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Add Column</Button>
      <p style={{ marginTop: 8, color: '#666' }}>Column definitions control which fields appear in the table and their display properties.</p>
    </div>

    <Table
      columns={tableColumns}
      dataSource={columns}
      rowKey="key"
      pagination={false}
      scroll={{ x: 1200 }}
    />

    <Modal
      title={editingColumn ? 'Edit Column Definition' : 'Add Column Definition'}
      open={showModal}
      onCancel={() => setShowModal(false)}
      onOk={handleSubmit}
      width={600}
      okText={editingColumn ? 'Update' : 'Add'}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Column Key" name="key" tooltip="Should match a field key defined in the Fields tab"
          rules={[
            { required: true, message: 'Please enter column key' },
            { pattern: /^[a-zA-Z0-9_.]+$/, message: 'Only letters, numbers, dots, and underscores allowed' }
          ]}
        >
          {availableFields.length > 0 ? (
            <Select 
              showSearch placeholder="Select a field" disabled={!!editingColumn}
              options={availableFields.map(f => ({
                label: `${f.label} (${f.key})`,
                value: f.key
              }))}
              onChange={(value) => {
                const field = availableFields.find(f => f.key === value);
                if (field && !form.getFieldValue('label')) {
                  form.setFieldValue('label', field.label);
                  form.setFieldValue('group', field.group);
                }
              }}
            />
          ) : (
            <Input placeholder="e.g., title" disabled={!!editingColumn} />
        )}
        </Form.Item>

        <Form.Item label="Label" name="label" rules={[{ required: true, message: 'Please enter label' }]}>
            <Input placeholder="e.g., Product Title" />
        </Form.Item>

        <Form.Item label="Group" name="group" tooltip="Grouping for column organization in Edit Columns modal">
          <Input placeholder="e.g., Product Information" />
        </Form.Item>

        <Form.Item label="Width (px)" name="width" tooltip="Fixed column width in pixels (leave empty for auto)">
          <InputNumber placeholder="e.g., 200" min={50} max={1000} style={{ width: '100%' }} />
        </Form.Item>

        <Space size="large">
          <Form.Item name="visible" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Switch checkedChildren="Visible" unCheckedChildren="Hidden" />
          </Form.Item>
          <Form.Item name="sortable" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Switch checkedChildren="Sortable" unCheckedChildren="Not Sortable" />
          </Form.Item>
          <Form.Item name="frozen" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Switch checkedChildren="Frozen" unCheckedChildren="Not Frozen" />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  </div>);
};
