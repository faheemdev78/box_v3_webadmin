'use client';

import React, { useState } from 'react';
import { Card, Space, message, Tabs, Divider, Row, Col, Alert, Tooltip } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, InfoCircleFilled } from '@ant-design/icons';
import { Button } from '@/components';
import { useMutation } from '@apollo/client/react';
import { CREATE_ENTITY_CONFIG, UPDATE_ENTITY_CONFIG } from '../graphql/mutations';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { FormField, SubmitButton, rules, submitHandler } from '@/components/form';
import { FieldDefinitionsEditorFinal } from './FieldDefinitionsEditorFinal';
import { ColumnDefinitionsEditorFinal } from './ColumnDefinitionsEditorFinal';

interface EntityConfigFormFinalProps {
  config?: any;
  onClose: () => void;
  onSuccess: () => void;
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

export const EntityConfigFormFinal: React.FC<EntityConfigFormFinalProps> = ({
  config,
  onClose,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [fields, setFields] = useState<any[]>(config?.fields || []);
  const [columns, setColumns] = useState<any[]>(config?.availableColumns || []);
  const [error, setError] = useState<string | null>(null);

  const [createConfig, { loading: creating }] = useMutation<any>(CREATE_ENTITY_CONFIG, {
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

  const [updateConfig, { loading: updating }] = useMutation<any>(UPDATE_ENTITY_CONFIG, {
    onCompleted: (data) => {
      if (data.updateEntityConfig.error) {
        message.error(data.updateEntityConfig.error.message);
      } else {
        message.success('Entity config updated successfully');
        // onSuccess();
      }
    },
    onError: (error) => {
      message.error(`Failed to update: ${error.message}`);
    }
  });

  const initialValues = config ? {
    entityType: config.entityType,
    entityLabel: config.entityLabel,
    entityLabelSingular: config.entityLabelSingular,
    rowKey: config.rowKey || '_id',
    defaultColumns: config.defaultColumns || [],
    defaultSortField: config.defaultSort?.field,
    defaultSortDirection: config.defaultSort?.direction || 'asc',
    isActive: config.isActive !== false
  } : {
    rowKey: '_id',
    defaultSortDirection: 'desc',
    isActive: true
  };

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

  const onSubmit = async (values: any) => {
    setError(null);

    if (fields.length === 0) {
      setError('Please add at least one field definition');
      setActiveTab('fields');
      return;
    }

    if (columns.length === 0) {
      setError('Please add at least one column definition');
      setActiveTab('columns');
      return;
    }

    if (!values.defaultColumns || values.defaultColumns.length === 0) {
      setError('Please select at least one default column');
      setActiveTab('defaults');
      return;
    }

    // Clean and prepare input data
    const cleanedFields = fields.map(f => ({
      key: f.key,
      label: f.label,
      type: f.type,
      group: f.group,
      operators: f.operators || [],
      options: f.options ? cleanObject(f.options) : undefined,
      isFilterable: f.isFilterable !== false,
      isSortable: f.isSortable !== false,
      isSearchable: f.isSearchable === true,
      dataPath: f.dataPath
    }));

    const cleanedColumns = columns.map(c => ({
      key: c.key,
      label: c.label,
      visible: c.visible !== false,
      sortable: c.sortable !== false,
      width: c.width,
      frozen: c.frozen === true,
      group: c.group
    }));

    const input: any = {
      fields: cleanedFields,
      availableColumns: cleanedColumns,
      defaultColumns: values.defaultColumns,
      defaultSort: values.defaultSortField ? {
        field: values.defaultSortField,
        direction: values.defaultSortDirection
      } : undefined,
      rowKey: values.rowKey || '_id',
      isActive: values.isActive !== false
    };

    if (config) {
      // For update, only include _id and fields that can be updated
      input._id = config._id;
      input.entityLabel = values.entityLabel;
      input.entityLabelSingular = values.entityLabelSingular;
      await updateConfig({ variables: { input } });
    } else {
      // For create, include all fields
      input.entityType = values.entityType;
      input.entityLabel = values.entityLabel;
      input.entityLabelSingular = values.entityLabelSingular;
      await createConfig({ variables: { input } });
    }
  };

  const loading = creating || updating;

  return (
    <Card>
      <div style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onClose} style={{ marginRight: 16 }}>Back</Button>
        <span style={{ fontSize: 18, fontWeight: 500 }}>
          {config ? `Edit ${config.entityLabel} Configuration` : 'Create Entity Configuration'}
        </span>
      </div>

      {error && <Alert title="Error" description={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 16 }} />}

      <FinalForm
        onSubmit={onSubmit}
        initialValues={initialValues}
        mutators={{ ...arrayMutators }}
        render={(formargs) => {
          const { handleSubmit, submitting, values } = formargs;

          return (
            <form {...submitHandler(formargs)}>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: 'basic', label: 'Basic Info',
                    children: (
                      <Space orientation="vertical" style={{ width: '100%' }} size="large">
                        <Row gutter={16}>
                          <Col span={12}>
                            <FormField
                              type="text"
                              name="entityType"
                              label={<FieldLabel tooltip="Unique identifier for this entity type (e.g., 'products', 'orders', 'users')">Entity Type</FieldLabel>}
                              validate={rules.required}
                              disabled={!!config}
                              placeholder="e.g., products"
                            />
                          </Col>
                          <Col span={12}>
                            <FormField
                              type="text"
                              name="rowKey"
                              label={<FieldLabel tooltip="Field to use as unique identifier for table rows">Row Key</FieldLabel>}
                              validate={rules.required}
                              placeholder="e.g., _id"
                            />
                          </Col>
                        </Row>

                        <Row gutter={16}>
                          <Col span={12}>
                            <FormField
                              type="text"
                              name="entityLabel"
                              label="Entity Label (Plural)"
                              validate={rules.required}
                              placeholder="e.g., Products"
                            />
                          </Col>
                          <Col span={12}>
                            <FormField
                              type="text"
                              name="entityLabelSingular"
                              label="Entity Label (Singular)"
                              validate={rules.required}
                              placeholder="e.g., Product"
                            />
                          </Col>
                        </Row>

                        <FormField
                          type="switch"
                          name="isActive"
                          label="Status"
                          checkedChildren="Active"
                          unCheckedChildren="Inactive"
                        />
                      </Space>
                    )
                  },
                  {
                    key: 'fields', label: `Fields (${fields.length})`,
                    children: (<FieldDefinitionsEditorFinal fields={fields} onChange={setFields} />)
                  },
                  {
                    key: 'columns', label: `Columns (${columns.length})`,
                    children: (<ColumnDefinitionsEditorFinal columns={columns} onChange={setColumns} availableFields={fields} />)
                  },
                  {
                    key: 'defaults', label: 'Defaults',
                    children: (
                      <Space orientation="vertical" style={{ width: '100%' }} size="large">
                        <FormField
                          type="select"
                          name="defaultColumns"
                          label="Default Columns"
                          validate={rules.required}
                          mode="multiple"
                          placeholder="Select default columns"
                          options={columns.map(c => ({ label: c.label, value: c.key }))}
                          info="Columns that will be visible by default"
                        />

                        <Divider />

                        <h4>Default Sort</h4>
                        <Row gutter={16}>
                          <Col span={16}>
                            <FormField
                              type="select"
                              name="defaultSortField"
                              label="Sort Field"
                              showSearch
                              allowClear
                              placeholder="Select sort field"
                              options={fields.filter(f => f.isSortable !== false).map(f => ({
                                label: f.label,
                                value: f.key
                              }))}
                              info="Field to sort by default"
                            />
                          </Col>
                          <Col span={8}>
                            <FormField
                              type="select"
                              name="defaultSortDirection"
                              label="Sort Direction"
                              options={[
                                { label: 'Ascending', value: 'asc' },
                                { label: 'Descending', value: 'desc' }
                              ]}
                            />
                          </Col>
                        </Row>
                      </Space>
                    )
                  }
                ]}
              />

              <Divider />

              <Space>
                <Button onClick={onClose}>Cancel</Button>
                <SubmitButton
                  loading={loading || submitting}
                  label={config ? 'Update Configuration' : 'Create Configuration'}
                  icon={<SaveOutlined />}
                />
              </Space>
            </form>
          );
        }}
      />
    </Card>
  );
};
