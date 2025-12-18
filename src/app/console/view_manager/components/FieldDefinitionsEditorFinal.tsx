import React, { useState } from 'react';
import {
  Table, Button, Modal, Space, Tag, Tooltip, message
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, InfoCircleFilled } from '@ant-design/icons';
import { Form as FinalForm } from 'react-final-form';
import { FormField, SubmitButton, rules, submitHandler } from '@/components/form';
import arrayMutators from 'final-form-arrays';
import { FieldArray } from 'react-final-form-arrays';

interface FieldDefinitionsEditorFinalProps {
  fields: any[];
  onChange: (fields: any[]) => void;
}

// Helper component for labels with tooltips
const FieldLabel: React.FC<{ children: React.ReactNode; tooltip?: string }> = ({ children, tooltip }) => {
  if (!tooltip) return <>{children}</>;
  return (
    <span>
      {children}{' '}
      <Tooltip title={tooltip} color="#1C9DFF">
        <InfoCircleFilled style={{ color: '#1C9DFF', fontSize: '12px' }} />
      </Tooltip>
    </span>
  );
};

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

export const FieldDefinitionsEditorFinal: React.FC<FieldDefinitionsEditorFinalProps> = ({
  fields,
  onChange
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);

  const handleAdd = () => {
    setEditingField(null);
    setShowModal(true);
  };

  const handleEdit = (field: any) => {
    setEditingField(field);
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

  const handleSubmit = (values: any) => {
    // Check for duplicate key
    if (!editingField && fields.some(f => f.key === values.key)) {
      message.error('Field key already exists');
      return;
    }

    // Build options from array
    const options = values.options?.filter((o: any) => o.label && o.value) || [];

    const fieldData = {
      key: values.key,
      label: values.label,
      type: values.type,
      group: values.group,
      dataPath: values.dataPath,
      operators: values.operators || [],
      options: ['select', 'multiselect'].includes(values.type) ? options : undefined,
      isFilterable: values.isFilterable !== false,
      isSortable: values.isSortable !== false,
      isSearchable: values.isSearchable === true
    };

    if (editingField) {
      onChange(fields.map(f => f.key === editingField.key ? fieldData : f));
      message.success('Field updated');
    } else {
      onChange([...fields, fieldData]);
      message.success('Field added');
    }

    setShowModal(false);
  };

  const initialValues = editingField ? {
    ...editingField,
    options: editingField.options || []
  } : {
    isFilterable: true,
    isSortable: true,
    isSearchable: false,
    operators: ['equals'],
    options: []
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
        footer={null}
        width={700}
      >
        <FinalForm
          onSubmit={handleSubmit}
          initialValues={initialValues}
          mutators={{ ...arrayMutators }}
          render={(formargs) => {
            const { handleSubmit, submitting, values } = formargs;
            const showOptions = ['select', 'multiselect'].includes(values.type);

            return (
              <form {...submitHandler(formargs)}>
                <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                  <FormField
                    type="text"
                    name="key"
                    label={<FieldLabel tooltip="Database field name (use dots for nested fields like brand.title)">Field Key</FieldLabel>}
                    validate={rules.required}
                    disabled={!!editingField}
                    placeholder="e.g., title or brand.title"
                  />

                  <FormField
                    type="text"
                    name="label"
                    label="Label"
                    validate={rules.required}
                    placeholder="e.g., Product Title"
                  />

                  <FormField
                    type="select"
                    name="type"
                    label="Type"
                    validate={rules.required}
                    options={FIELD_TYPES}
                  />

                  <FormField
                    type="text"
                    name="group"
                    label={<FieldLabel tooltip="Grouping for filter UI organization">Group</FieldLabel>}
                    placeholder="e.g., Product Information"
                  />

                  <FormField
                    type="text"
                    name="dataPath"
                    label={<FieldLabel tooltip="Optional: Override the field path for nested data (e.g., brand.title)">Data Path</FieldLabel>}
                    placeholder="e.g., brand.title"
                  />

                  <FormField
                    type="select"
                    name="operators"
                    label="Operators"
                    validate={rules.required}
                    mode="multiple"
                    options={ALL_OPERATORS}
                  />

                  {showOptions && (
                    <div>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Options</label>
                      <FieldArray name="options">
                        {({ fields: optionFields }) => (
                          <Space orientation="vertical" style={{ width: '100%' }}>
                            {optionFields.map((name, index) => (
                              <Space key={index} style={{ width: '100%' }}>
                                <FormField
                                  type="text"
                                  name={`${name}.label`}
                                  placeholder="Label"
                                  style={{ width: 200 }}
                                />
                                <FormField
                                  type="text"
                                  name={`${name}.value`}
                                  placeholder="Value"
                                  style={{ width: 200 }}
                                />
                                <Button danger onClick={() => optionFields.remove(index)}>Remove</Button>
                              </Space>
                            ))}
                            <Button onClick={() => optionFields.push({ label: '', value: '' })}>
                              Add Option
                            </Button>
                          </Space>
                        )}
                      </FieldArray>
                    </div>
                  )}

                  <Space>
                    <FormField
                      type="switch"
                      name="isFilterable"
                      checkedChildren="Filterable"
                      unCheckedChildren="Not Filterable"
                    />
                    <FormField
                      type="switch"
                      name="isSortable"
                      checkedChildren="Sortable"
                      unCheckedChildren="Not Sortable"
                    />
                    <FormField
                      type="switch"
                      name="isSearchable"
                      checkedChildren="Searchable"
                      unCheckedChildren="Not Searchable"
                    />
                  </Space>

                  <Space>
                    <Button onClick={() => setShowModal(false)}>Cancel</Button>
                    <SubmitButton
                      loading={submitting}
                      label={editingField ? 'Update' : 'Add'}
                    />
                  </Space>
                </Space>
              </form>
            );
          }}
        />
      </Modal>
    </div>
  );
};