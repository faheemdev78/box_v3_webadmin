import React, { useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Switch, Space, Tag, Tooltip, message
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';

interface FieldDefinitionsEditorProps {
  fields: any[];
  onChange: (fields: any[]) => void;
}

const FIELD_TYPES = [
  { label: 'Text', value: 'text' },
  { label: 'Number', value: 'number' },
  { label: 'Date', value: 'date' },
  { label: 'Select (Single)', value: 'select' },
  { label: 'Multi-Select', value: 'multiselect' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Object', value: 'object' },
  { label: 'Array', value: 'array' }
];

const ALL_OPERATORS = [
  { label: 'Equals', value: 'equals' },
  { label: 'Not Equals', value: 'not_equals' },
  { label: 'Contains', value: 'contains' },
  { label: 'Not Contains', value: 'not_contains' },
  { label: 'Starts With', value: 'starts_with' },
  { label: 'Ends With', value: 'ends_with' },
  { label: 'Greater Than', value: 'greater_than' },
  { label: 'Less Than', value: 'less_than' },
  { label: 'Greater or Equal', value: 'greater_or_equal' },
  { label: 'Less or Equal', value: 'less_or_equal' },
  { label: 'In', value: 'in' },
  { label: 'Not In', value: 'not_in' },
  { label: 'Is Empty', value: 'is_empty' },
  { label: 'Is Not Empty', value: 'is_not_empty' },
  { label: 'Is True', value: 'is_true' },
  { label: 'Is False', value: 'is_false' }
];

export const FieldDefinitionsEditor: React.FC<FieldDefinitionsEditorProps> = ({
  fields,
  onChange
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [form] = Form.useForm();
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<any[]>([]);

  const handleAdd = () => {
    setEditingField(null);
    setOptions([]);
    setShowOptions(false);
    form.resetFields();
    form.setFieldsValue({
      isFilterable: true,
      isSortable: true,
      isSearchable: false,
      operators: ['equals']
    });
    setShowModal(true);
  };

  const handleEdit = (field: any) => {
    setEditingField(field);
    setOptions(field.options || []);
    setShowOptions(['select', 'multiselect'].includes(field.type));
    form.setFieldsValue({
      ...field,
      isFilterable: field.isFilterable !== false,
      isSortable: field.isSortable !== false,
      isSearchable: field.isSearchable === true
    });
    setShowModal(true);
  };

  const handleDuplicate = (field: any) => {
    const newField = {
      ...field,
      key: `${field.key}_copy`,
      label: `${field.label} (Copy)`
    };
    onChange([...fields, newField]);
    message.success('Field duplicated');
  };

  const handleDelete = (field: any) => {
    Modal.confirm({
      title: 'Delete Field',
      content: `Are you sure you want to delete "${field.label}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        onChange(fields.filter(f => f.key !== field.key));
        message.success('Field deleted');
      }
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (showOptions && options.length === 0) {
        message.error('Please add at least one option for select fields');
        return;
      }

      const fieldData = {
        ...values,
        options: showOptions ? options : undefined
      };

      if (editingField) {
        // Update existing field
        onChange(fields.map(f => f.key === editingField.key ? fieldData : f));
        message.success('Field updated');
      } else {
        // Check for duplicate key
        if (fields.some(f => f.key === fieldData.key)) {
          message.error('Field key already exists');
          return;
        }
        // Add new field
        onChange([...fields, fieldData]);
        message.success('Field added');
      }

      setShowModal(false);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleTypeChange = (type: string) => {
    setShowOptions(['select', 'multiselect'].includes(type));
  };

  const addOption = () => {
    setOptions([...options, { label: '', value: '' }]);
  };

  const updateOption = (index: number, field: 'label' | 'value', value: any) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const columns = [
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
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => <Tag color="blue">{type}</Tag>
    },
    {
      title: 'Group',
      dataIndex: 'group',
      key: 'group',
      width: 150,
      render: (text: string) => text || '--'
    },
    {
      title: 'Operators',
      dataIndex: 'operators',
      key: 'operators',
      width: 200,
      render: (operators: string[]) => (
        <Tooltip title={operators?.join(', ')}>
          <Tag>{operators?.length || 0} operators</Tag>
        </Tooltip>
      )
    },
    {
      title: 'Properties',
      key: 'properties',
      width: 200,
      render: (_: any, record: any) => (
        <Space size={4}>
          {record.isFilterable !== false && <Tag color="green">Filterable</Tag>}
          {record.isSortable !== false && <Tag color="blue">Sortable</Tag>}
          {record.isSearchable && <Tag color="orange">Searchable</Tag>}
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

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Field
        </Button>
        <p style={{ marginTop: 8, color: '#666' }}>
          Field definitions control which database fields can be filtered, sorted, and displayed.
        </p>
      </div>

      <Table
        columns={columns}
        dataSource={fields}
        rowKey="key"
        pagination={false}
        scroll={{ x: 1400 }}
      />

      <Modal
        title={editingField ? 'Edit Field Definition' : 'Add Field Definition'}
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={handleSubmit}
        width={700}
        okText={editingField ? 'Update' : 'Add'}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Field Key"
            name="key"
            rules={[
              { required: true, message: 'Please enter field key' },
              { pattern: /^[a-zA-Z0-9_.]+$/, message: 'Only letters, numbers, dots, and underscores allowed' }
            ]}
            tooltip="Database field name (e.g., 'title', 'brand.title', 'stock_level.min')"
          >
            <Input placeholder="e.g., title" disabled={!!editingField} />
          </Form.Item>

          <Form.Item
            label="Label"
            name="label"
            rules={[{ required: true, message: 'Please enter label' }]}
          >
            <Input placeholder="e.g., Product Title" />
          </Form.Item>

          <Form.Item
            label="Type"
            name="type"
            rules={[{ required: true, message: 'Please select type' }]}
          >
            <Select options={FIELD_TYPES} onChange={handleTypeChange} />
          </Form.Item>

          <Form.Item label="Group" name="group" tooltip="Grouping for filter UI">
            <Input placeholder="e.g., Product Information" />
          </Form.Item>

          <Form.Item
            label="Data Path"
            name="dataPath"
            tooltip="Use this for nested fields (e.g., 'brand.title' for accessing brand.title in database)"
          >
            <Input placeholder="e.g., brand.title" />
          </Form.Item>

          <Form.Item
            label="Operators"
            name="operators"
            rules={[{ required: true, message: 'Please select at least one operator' }]}
          >
            <Select mode="multiple" options={ALL_OPERATORS} />
          </Form.Item>

          {showOptions && (
            <Form.Item label="Options">
              <Space orientation="vertical" style={{ width: '100%' }}>
                {options.map((option, index) => (
                  <Space key={index} style={{ width: '100%' }}>
                    <Input
                      placeholder="Label"
                      value={option.label}
                      onChange={(e) => updateOption(index, 'label', e.target.value)}
                      style={{ width: 200 }}
                    />
                    <Input
                      placeholder="Value"
                      value={option.value}
                      onChange={(e) => updateOption(index, 'value', e.target.value)}
                      style={{ width: 200 }}
                    />
                    <Button danger onClick={() => removeOption(index)}>Remove</Button>
                  </Space>
                ))}
                <Button onClick={addOption}>Add Option</Button>
              </Space>
            </Form.Item>
          )}

          <Space>
            <Form.Item name="isFilterable" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch checkedChildren="Filterable" unCheckedChildren="Not Filterable" />
            </Form.Item>
            <Form.Item name="isSortable" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch checkedChildren="Sortable" unCheckedChildren="Not Sortable" />
            </Form.Item>
            <Form.Item name="isSearchable" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch checkedChildren="Searchable" unCheckedChildren="Not Searchable" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};
