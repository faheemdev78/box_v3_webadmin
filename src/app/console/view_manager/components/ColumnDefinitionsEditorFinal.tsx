import React, { useState } from 'react';
import {
  Table, Button, Modal, Space, Tag, Tooltip, message
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, InfoCircleFilled } from '@ant-design/icons';
import { Form as FinalForm } from 'react-final-form';
import { FormField, SubmitButton, rules, submitHandler } from '@_/components/form';

interface ColumnDefinitionsEditorFinalProps {
  columns: any[];
  onChange: (columns: any[]) => void;
  availableFields: any[];
}

// Helper component for labels with tooltips
const FieldLabel: React.FC<{ children: React.ReactNode; tooltip?: string }> = ({ children, tooltip }) => {
  if (!tooltip) return <>{children}</>;
  return (<span>
    {children}{' '}
    <Tooltip title={tooltip} color="#1C9DFF">
      <InfoCircleFilled style={{ color: '#1C9DFF', fontSize: '12px' }} />
    </Tooltip>
  </span>);
};

export const ColumnDefinitionsEditorFinal: React.FC<ColumnDefinitionsEditorFinalProps> = ({
  columns,
  onChange,
  availableFields
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingColumn, setEditingColumn] = useState<any>(null);

  const handleAdd = () => {
    setEditingColumn(null);
    setShowModal(true);
  };

  const handleEdit = (column: any) => {
    setEditingColumn(column);
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

  const handleSubmit = (values: any) => {
    // Check for duplicate key
    if (!editingColumn && columns.some(c => c.key === values.key)) {
      message.error('Column key already exists');
      return;
    }

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
      onChange(columns.map(c => c.key === editingColumn.key ? columnData : c));
      message.success('Column updated');
    } else {
      onChange([...columns, columnData]);
      message.success('Column added');
    }

    setShowModal(false);
  };

  const initialValues = editingColumn ? {
    ...editingColumn
  } : {
    visible: true,
    sortable: true,
    frozen: false
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

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Add Column</Button>
        <p style={{ marginTop: 8, color: '#666' }}>
          Column definitions control which fields appear in the table and their display properties.
        </p>
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
        footer={null}
        width={600}
        destroyOnHidden
      >
        <FinalForm
          onSubmit={handleSubmit} initialValues={initialValues}
          render={(formargs) => {
            const { handleSubmit, submitting, form, values } = formargs;

            return (<>
              <form {...submitHandler(formargs)}>
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {availableFields.length > 0 ? (
                    <FormField
                      type="select"
                      name="key"
                      label="Column Key"
                      validate={rules.required}
                      disabled={!!editingColumn}
                      showSearch
                      placeholder="Select a field"
                      options={availableFields.map(f => ({
                        label: `${f.label} (${f.key})`,
                        value: f.key
                      }))}
                      onChange={(value: any) => {
                        const field = availableFields.find(f => f.key === value);
                        if (field && !form.getState().values.label) {
                          form.change('label', field.label);
                          form.change('group', field.group);
                        }
                      }}
                      info="Should match a field key defined in the Fields tab"
                    />
                  ) : (
                    <FormField
                      type="text" name="key" placeholder="e.g., title"
                      label={<FieldLabel tooltip="Should match a field key defined in the Fields tab">Column Key</FieldLabel>}
                      validate={rules.required}
                      disabled={!!editingColumn}
                    />
                  )}

                  <FormField
                    type="text" name="label" label="Label" placeholder="e.g., Product Title"
                    validate={rules.required}
                  />

                  <FormField
                    type="text"
                    name="group"
                    label={<FieldLabel tooltip="Grouping for column organization in Edit Columns modal">Group</FieldLabel>}
                    placeholder="e.g., Product Information"
                  />

                  <FormField
                    type="number"
                    name="width"
                    label={<FieldLabel tooltip="Fixed column width in pixels (leave empty for auto)">Width (px)</FieldLabel>}
                    min={50}
                    max={1000}
                    placeholder="e.g., 200"
                  />

                  <Space size="large">
                    <FormField
                      type="switch"
                      name="visible"
                      checkedChildren="Visible"
                      unCheckedChildren="Hidden"
                    />
                    <FormField
                      type="switch"
                      name="sortable"
                      checkedChildren="Sortable"
                      unCheckedChildren="Not Sortable"
                    />
                    <FormField
                      type="switch"
                      name="frozen"
                      checkedChildren="Frozen"
                      unCheckedChildren="Not Frozen"
                    />
                  </Space>

                  <Space>
                    <Button onClick={() => setShowModal(false)}>Cancel</Button>
                    <SubmitButton
                      loading={submitting}
                      label={editingColumn ? 'Update' : 'Add'}
                    />
                  </Space>
                </Space>
              </form>
            </>);
          }}
        />
      </Modal>
    </div>
  );
};