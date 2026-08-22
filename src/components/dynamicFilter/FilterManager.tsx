'use client';

import { useEffect, useState } from 'react';
import { Button, Empty, Flex, Form, Input, Popconfirm, Select, Space, Switch, Typography, message } from 'antd';
import { CopyOutlined, DeleteOutlined, PushpinFilled, PushpinOutlined } from '@ant-design/icons';
import { Drawer } from '../drawer';
import { useMutation } from '@apollo/client/react';
import ADD_FILTER from '@/graphql/dynamic_filters/addDynamicFilter.graphql';
import EDIT_FILTER from '@/graphql/dynamic_filters/editDynamicFilter.graphql';
import DELETE_FILTER from '@/graphql/dynamic_filters/deleteDynamicFilter.graphql';
import PIN_FILTER from '@/graphql/dynamic_filters/pinDynamicFilter.graphql';
import DUPLICATE_FILTER from '@/graphql/dynamic_filters/duplicateDynamicFilter.graphql';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';
import type { FilterField, FilterGroup, SavedDynamicFilter } from './types';
import { isTreeComplete, toQueryGroups } from './completeness';
import { cloneJson } from './clone';
import { FilterEditor } from './FilterEditor';

const { Text } = Typography;

type Props = {
  open: boolean;
  onClose: () => void;
  entityType: string;
  storeId?: string;
  fields: FilterField[];
  views: SavedDynamicFilter[];
  draftGroups: FilterGroup[];
  onRefetch: () => Promise<any> | any;
  onSelect: (view: SavedDynamicFilter) => void;
  prefillCreate?: boolean;
};

export function FilterManager({
  open,
  onClose,
  entityType,
  storeId,
  fields,
  views,
  draftGroups,
  onRefetch,
  onSelect,
  prefillCreate = false,
}: Props) {
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [editing, setEditing] = useState<SavedDynamicFilter | null>(null);
  const [formGroups, setFormGroups] = useState<FilterGroup[]>([]);
  const [form] = Form.useForm();
  const complete = isTreeComplete(formGroups, fields);

  const [addFilter, addState] = useMutation<any>(ADD_FILTER);
  const [editFilter, editState] = useMutation<any>(EDIT_FILTER);
  const [deleteFilter, deleteState] = useMutation<any>(DELETE_FILTER);
  const [pinFilter, pinState] = useMutation<any>(PIN_FILTER);
  const [duplicateFilter, duplicateState] = useMutation<any>(DUPLICATE_FILTER);
  const saving = addState.loading || editState.loading || deleteState.loading || pinState.loading || duplicateState.loading;

  useEffect(() => {
    if (!open) return;
    if (prefillCreate) openCreate();
    else setMode('list');
  }, [open, prefillCreate]);

  const openCreate = () => {
    setEditing(null);
    setFormGroups(cloneJson(draftGroups || []));
    form.setFieldsValue({
      name: '',
      description: '',
      visibility: 'everyone',
      isPinned: true,
    });
    setMode('form');
  };

  const openEdit = (view: SavedDynamicFilter) => {
    setEditing(view);
    setFormGroups(cloneJson(view.filterGroups || []));
    form.setFieldsValue({
      name: view.name,
      description: view.description,
      visibility: view.visibility || 'everyone',
      isPinned: Boolean(view.isPinned),
    });
    setMode('form');
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    if (!complete) {
      message.error('Finish or remove incomplete conditions before saving');
      return;
    }

    const filterGroups = toQueryGroups(formGroups);
    const result = editing
      ? await editFilter({
          variables: {
            input: {
              _id: editing._id,
              name: values.name,
              description: values.description,
              visibility: values.visibility,
              isPinned: values.isPinned,
              filterGroups,
            },
          },
        })
          .then((r) => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.editDynamicFilter }))
          .catch(catchApolloError)
      : await addFilter({
          variables: {
            input: {
              ...values,
              entityType,
              storeId,
              filterGroups,
            },
          },
        })
          .then((r) => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.addDynamicFilter }))
          .catch(catchApolloError);

    if (result?.error) {
      message.error(result.error.message);
      return;
    }
    message.success(editing ? 'Filter updated' : 'Filter saved');
    await onRefetch();
    if (result?._id) onSelect(result);
    setMode('list');
    onClose();
  };

  const handlePin = async (view: SavedDynamicFilter, isPinned: boolean) => {
    const result = await pinFilter({ variables: { id: view._id, isPinned } })
      .then((r) => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.pinDynamicFilter }))
      .catch(catchApolloError);
    if (result?.error) {
      message.error(result.error.message);
      return;
    }
    await onRefetch();
  };

  const handleDuplicate = async (view: SavedDynamicFilter) => {
    const result = await duplicateFilter({ variables: { id: view._id } })
      .then((r) => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.duplicateDynamicFilter }))
      .catch(catchApolloError);
    if (result?.error) {
      message.error(result.error.message);
      return;
    }
    message.success('Filter duplicated');
    await onRefetch();
  };

  const handleDelete = async (view: SavedDynamicFilter) => {
    const result = await deleteFilter({ variables: { id: view._id } })
      .then((r) => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.deleteDynamicFilter }))
      .catch(catchApolloError);
    if (result?.error) {
      message.error(result.error.message);
      return;
    }
    message.success('Filter deleted');
    await onRefetch();
  };

  const title = mode === 'form' ? (editing ? 'Edit filter' : 'New filter') : 'Filter Manager';

  return (
    <Drawer
      title={title}
      open={open}
      onClose={onClose}
      size={720}
      extra={mode === 'list' ? <Button type="primary" onClick={openCreate}>New filter</Button> : null}
    >
      {mode === 'list' && (
        <div>
          {!views.length && <Empty description="No saved filters yet. Create one and add conditions below." />}
          {views.map((view) => (
            <div key={view._id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start">
                <div>
                  <Button type="link" style={{ padding: 0 }} onClick={() => { onSelect(view); onClose(); }}>
                    {view.name}
                  </Button>
                  {view.description && <div><Text type="secondary">{view.description}</Text></div>}
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {(view.filterGroups || []).reduce((count, group) => count + (group.conditions?.length || 0), 0)} condition(s)
                    </Text>
                  </div>
                </div>
                <Space>
                  <Button
                    type="text"
                    icon={view.isPinned ? <PushpinFilled /> : <PushpinOutlined />}
                    onClick={() => handlePin(view, !view.isPinned)}
                  />
                  <Button type="text" icon={<CopyOutlined />} onClick={() => handleDuplicate(view)} />
                  <Button type="link" onClick={() => openEdit(view)}>Edit</Button>
                  <Popconfirm title="Delete this filter?" onConfirm={() => handleDelete(view)}>
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              </Space>
            </div>
          ))}
        </div>
      )}

      {mode === 'form' && (
        <Form form={form} layout="vertical">
          <Flex gap={12} align="flex-start" wrap="wrap">
            <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]} style={{ flex: 1, minWidth: 180, marginBottom: 12 }}>
              <Input placeholder="e.g. High value picking" />
            </Form.Item>
            <Form.Item name="visibility" label="Visibility" style={{ width: 180, marginBottom: 12 }}>
              <Select options={[
                { value: 'everyone', label: 'Everyone' },
                { value: 'team', label: 'Team' },
                { value: 'private', label: 'Private' },
              ]} />
            </Form.Item>
            <Form.Item name="isPinned" label="Pin as tab" valuePropName="checked" style={{ width: 110, marginBottom: 12 }}>
              <Switch />
            </Form.Item>
          </Flex>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Conditions" required={false}>
            <FilterEditor
              compact
              fields={fields}
              groups={formGroups}
              onChange={(next) => setFormGroups(next)}
            />
          </Form.Item>
          {!complete && <Text type="danger">Finish or remove incomplete conditions before saving.</Text>}
          <Space style={{ marginTop: 16 }}>
            <Button onClick={() => setMode('list')}>Back</Button>
            <Button type="primary" loading={saving} disabled={!complete} onClick={handleSave}>
              {editing ? 'Update filter' : 'Save filter'}
            </Button>
          </Space>
        </Form>
      )}
    </Drawer>
  );
}
