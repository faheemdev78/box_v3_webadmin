'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, Space, message, Tabs, Select, Switch, Row, Col, Divider
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useMutation } from '@apollo/client';
import { CREATE_ENTITY_CONFIG, UPDATE_ENTITY_CONFIG } from '../graphql/mutations';
import { FieldDefinitionsEditor } from './FieldDefinitionsEditor';
import { ColumnDefinitionsEditor } from './ColumnDefinitionsEditor';

interface EntityConfigFormProps {
  config?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const EntityConfigForm: React.FC<EntityConfigFormProps> = ({
  config,
  onClose,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('basic');
  const [fields, setFields] = useState<any[]>([]);
  const [columns, setColumns] = useState<any[]>([]);

  const [createConfig, { loading: creating }] = useMutation(CREATE_ENTITY_CONFIG, {
    onCompleted: (data) => {
      if (data.createEntityConfig.error) {
        message.error(data.createEntityConfig.error.message);
      } else {
        message.success('Entity config created successfully');
        onSuccess();
      }
    },
    onError: (error) => {
      message.error(`Failed to create: ${error.message}`);
    }
  });

  const [updateConfig, { loading: updating }] = useMutation(UPDATE_ENTITY_CONFIG, {
    onCompleted: (data) => {
      if (data.updateEntityConfig.error) {
        message.error(data.updateEntityConfig.error.message);
      } else {
        message.success('Entity config updated successfully');
        onSuccess();
      }
    },
    onError: (error) => {
      message.error(`Failed to update: ${error.message}`);
    }
  });

  useEffect(() => {
    if (config) {
      form.setFieldsValue({
        entityType: config.entityType,
        entityLabel: config.entityLabel,
        entityLabelSingular: config.entityLabelSingular,
        rowKey: config.rowKey || '_id',
        defaultColumns: config.defaultColumns || [],
        defaultSortField: config.defaultSort?.field,
        defaultSortDirection: config.defaultSort?.direction || 'asc',
        isActive: config.isActive !== false
      });
      setFields(config.fields || []);
      setColumns(config.availableColumns || []);
    } else {
      // Set defaults for new config
      form.setFieldsValue({
        rowKey: '_id',
        defaultSortDirection: 'desc',
        isActive: true
      });
    }
  }, [config, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (fields.length === 0) {
        message.error('Please add at least one field definition');
        setActiveTab('fields');
        return;
      }

      if (columns.length === 0) {
        message.error('Please add at least one column definition');
        setActiveTab('columns');
        return;
      }

      if (!values.defaultColumns || values.defaultColumns.length === 0) {
        message.error('Please select at least one default column');
        setActiveTab('defaults');
        return;
      }

      const input = {
        entityType: values.entityType,
        entityLabel: values.entityLabel,
        entityLabelSingular: values.entityLabelSingular,
        fields: fields.map(f => ({
          key: f.key,
          label: f.label,
          type: f.type,
          group: f.group,
          operators: f.operators,
          options: f.options,
          isFilterable: f.isFilterable !== false,
          isSortable: f.isSortable !== false,
          isSearchable: f.isSearchable === true,
          dataPath: f.dataPath
        })),
        availableColumns: columns.map(c => ({
          key: c.key,
          label: c.label,
          visible: c.visible !== false,
          sortable: c.sortable !== false,
          width: c.width,
          frozen: c.frozen === true,
          group: c.group
        })),
        defaultColumns: values.defaultColumns,
        defaultSort: values.defaultSortField ? {
          field: values.defaultSortField,
          direction: values.defaultSortDirection
        } : undefined,
        rowKey: values.rowKey || '_id',
        isActive: values.isActive !== false
      };

      if (config) {
        await updateConfig({ variables: { input: { _id: config._id, ...input } } });
      } else {
        await createConfig({ variables: { input } });
      }
    } catch (error: any) {
      console.error('Validation failed:', error);
    }
  };

  const loading = creating || updating;

  return (
    <Card>
      <div style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onClose} style={{ marginRight: 16 }}>
          Back
        </Button>
        <span style={{ fontSize: 18, fontWeight: 500 }}>
          {config ? `Edit ${config.entityLabel} Configuration` : 'Create Entity Configuration'}
        </span>
      </div>

      <Form form={form} layout="vertical">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'basic',
              label: 'Basic Info',
              children: (
                <div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Entity Type"
                        name="entityType"
                        rules={[
                          { required: true, message: 'Please enter entity type' },
                          { pattern: /^[a-z_]+$/, message: 'Only lowercase letters and underscores allowed' }
                        ]}
                        tooltip="Unique identifier for this entity type (e.g., 'products', 'orders', 'users')"
                      >
                        <Input placeholder="e.g., products" disabled={!!config} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Row Key"
                        name="rowKey"
                        rules={[{ required: true, message: 'Please enter row key' }]}
                        tooltip="Field to use as unique identifier for table rows"
                      >
                        <Input placeholder="e.g., _id" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Entity Label (Plural)"
                        name="entityLabel"
                        rules={[{ required: true, message: 'Please enter entity label' }]}
                      >
                        <Input placeholder="e.g., Products" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Entity Label (Singular)"
                        name="entityLabelSingular"
                        rules={[{ required: true, message: 'Please enter singular label' }]}
                      >
                        <Input placeholder="e.g., Product" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label="Status" name="isActive" valuePropName="checked">
                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                  </Form.Item>
                </div>
              )
            },
            {
              key: 'fields', label: `Fields (${fields.length})`,
              children: (<FieldDefinitionsEditor fields={fields} onChange={setFields} />)
            },
            {
              key: 'columns', label: `Columns (${columns.length})`,
              children: (<ColumnDefinitionsEditor columns={columns} onChange={setColumns} availableFields={fields} />)
            },
            {
              key: 'defaults', label: 'Defaults',
              children: (
                <div>
                  <Form.Item
                    label="Default Columns" name="defaultColumns"
                    rules={[{ required: true, message: 'Please select at least one default column' }]}
                    tooltip="Columns that will be visible by default"
                  >
                    <Select
                      mode="multiple"
                      placeholder="Select default columns"
                      options={columns.map(c => ({ label: c.label, value: c.key }))}
                    />
                  </Form.Item>

                  <Divider />

                  <h4>Default Sort</h4>
                  <Row gutter={16}>
                    <Col span={16}>
                      <Form.Item
                        label="Sort Field"
                        name="defaultSortField"
                        tooltip="Field to sort by default"
                      >
                        <Select
                          placeholder="Select sort field"
                          allowClear
                          showSearch
                          options={fields.filter(f => f.isSortable !== false).map(f => ({
                            label: f.label,
                            value: f.key
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item
                        label="Sort Direction"
                        name="defaultSortDirection"
                      >
                        <Select
                          options={[
                            { label: 'Ascending', value: 'asc' },
                            { label: 'Descending', value: 'desc' }
                          ]}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              )
            }
          ]}
        />

        <Divider />

        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSubmit}
            loading={loading}
          >
            {config ? 'Update Configuration' : 'Create Configuration'}
          </Button>
        </Space>
      </Form>
    </Card>
  );
};
