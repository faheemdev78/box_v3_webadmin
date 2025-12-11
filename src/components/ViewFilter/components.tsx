'use client'

import React from 'react'
import { Card, Button, Row, Col, Space, Tag, Modal, List, message, Divider } from 'antd';
import {
    StarFilled,
    StarOutlined,
    PushpinFilled,
    PushpinOutlined,
    DeleteOutlined,
    CopyOutlined,
    CheckOutlined,
    LockOutlined,
    TeamOutlined,
    GlobalOutlined
} from '@ant-design/icons';
import { Form as FinalForm } from 'react-final-form';
import { FormField, submitHandler } from '@/components/form';
import { ViewConfig, ViewFilterConfig } from './types';
import { canEditView, canDeleteView, getVisibilityLabel } from './utils';
import { SavedViewEditor } from './SavedViewEditor';

// ViewTab Component - shows individual view as tab content
export function ViewTab({
    view,
    config,
    onApply,
    onEdit,
    onDelete,
    onToggleFavorite,
    onTogglePin,
    onSetDefault,
    onClone,
    canEdit,
    canDelete,
    isExpanded = false
}: {
    view: ViewConfig;
    config?: ViewFilterConfig;
    onApply?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onToggleFavorite?: () => void;
    onTogglePin?: () => void;
    onSetDefault?: () => void;
    onClone?: () => void;
    canEdit?: boolean;
    canDelete?: boolean;
    isExpanded?: boolean;
}) {
    // If just rendering tab label
    if (!isExpanded) {
        return (<Space>
            {view.isPinned && <PushpinFilled style={{ color: '#1890ff' }} />}
            {view.isFavorite && <StarFilled style={{ color: '#faad14' }} />}
            {view.name}
            {view.isDefault && <Tag color="green">Default</Tag>}
        </Space>);
    }

    // Full tab content
    return (<div>
        <Card size="small" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                    <Space>
                        <strong style={{ fontSize: 16 }}>{view.name}</strong>
                        {view.isDefault && <Tag color="green">Default</Tag>}
                        {view.visibility === 'private' && <LockOutlined title="Private" />}
                        {view.visibility === 'team' && <TeamOutlined title="Team" />}
                        {view.visibility === 'everyone' && <GlobalOutlined title="Everyone" />}
                    </Space>
                    {view.description && (
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                            {view.description}
                        </div>
                    )}
                </div>
                <Space wrap>
                    <Button type="primary" onClick={onApply}>Apply This View</Button>
                    {canEdit && (<Button onClick={onEdit}>Edit View</Button>)}
                    <Button icon={view.isFavorite ? <StarFilled /> : <StarOutlined />} onClick={onToggleFavorite}>{view.isFavorite ? 'Unstar' : 'Star'}</Button>
                    <Button icon={view.isPinned ? <PushpinFilled /> : <PushpinOutlined />} onClick={onTogglePin}>{view.isPinned ? 'Unpin' : 'Pin'}</Button>
                    {!view.isDefault && (
                        <Button icon={<CheckOutlined />} onClick={onSetDefault}>Set as Default</Button>
                    )}
                    <Button icon={<CopyOutlined />} onClick={onClone}>Clone</Button>
                    {canDelete && (<Button danger icon={<DeleteOutlined />} onClick={onDelete}>Delete</Button>)}
                </Space>
            </Space>
        </Card>

        {/* Use SavedViewEditor to show filters with changeable fields */}
        {config && onApply && (<SavedViewEditor
            view={view}
            config={config}
            onApply={(modifiedView) => {
                // When user modifies changeable fields and clicks Apply, trigger the onApply with modified view
                onApply();
            }}
        />)}
    </div>);
}

// AllViewsTab Component - shows all views in a list
export function AllViewsTab({
    views,
    config,
    form,
    onLoad,
    onApply,
    onDelete,
    onToggleFavorite,
    onTogglePin,
    onSetDefault,
    onClone
}: {
    views: ViewConfig[];
    config: ViewFilterConfig;
    form: any;
    onLoad: (view: ViewConfig, form: any) => void;
    onApply?: (view: ViewConfig) => void;
    onDelete: (viewId: string) => void;
    onToggleFavorite: (viewId: string) => void;
    onTogglePin: (viewId: string) => void;
    onSetDefault: (viewId: string) => void;
    onClone: (view: ViewConfig) => void;
}) {
    const favoriteViews = views.filter(v => v.isFavorite);
    const otherViews = views.filter(v => !v.isFavorite);

    const renderViewCard = (view: ViewConfig) => (
        <Card key={view.id} size="small" style={{ width: '100%', marginBottom: 8 }}>
            <Row justify="space-between" align="middle">
                <Col flex="auto">
                    <Space direction="vertical" size={0}>
                        <Space direction='horizontal'>
                            {/* <Space direction='vertical' size={0}>
                                {view.isPinned && <PushpinFilled style={{ color: '#1890ff' }} />}
                                {view.isFavorite && <StarFilled style={{ color: '#faad14' }} />}
                            </Space> */}
                            <strong>{view.name}</strong>
                            {view.isDefault && <Tag color="green">Default</Tag>}
                            <Tag>{getVisibilityLabel(view.visibility)}</Tag>
                        </Space>
                        {view.description && (
                            <div style={{ fontSize: 12, color: '#666' }}>{view.description}</div>
                        )}
                    </Space>
                </Col>
                <Col>
                    <Space>
                        {onApply && (<Button size="small" type="primary" onClick={() => onApply(view)}>Apply</Button>)}
                        <Button size="small" onClick={() => onLoad(view, form)}>Edit</Button>
                        <Button
                            size="small"
                            icon={view.isFavorite ? <StarFilled /> : <StarOutlined />}
                            onClick={() => onToggleFavorite(view.id)}
                        />
                        <Button
                            size="small"
                            icon={view.isPinned ? <PushpinFilled /> : <PushpinOutlined />}
                            onClick={() => onTogglePin(view.id)}
                        />
                        {canDeleteView(view, config.currentUser.id, config.currentUser.role) && (
                            <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => onDelete(view.id)}
                            />
                        )}
                    </Space>
                </Col>
            </Row>
        </Card>
    );

    if (views.length === 0) return (<div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
        No saved views yet. Create views in the Builder tab and save them.
    </div>)

    return (<>
        {favoriteViews.length > 0 && (<>
            <Divider>Starred Views</Divider>
            <Space direction="vertical" style={{ width: '100%', marginBottom: 16, padding: "10px" }}>
                {favoriteViews.map(renderViewCard)}
            </Space>
        </>)}

        {otherViews.length > 0 && (<>
            <Divider>Other Views</Divider>
            <Space direction="vertical" style={{ width: '100%', padding: "10px" }}>
                {otherViews.map(renderViewCard)}
            </Space>
        </>)}
    </>);
}

// SaveViewModal Component
export function SaveViewModal({ visible, onClose, onSave, config }: {
    visible: boolean;
    onClose: () => void;
    onSave: (values: any) => void;
    config: ViewFilterConfig;
}) {
    return (
        <Modal title="Save View" open={visible} onCancel={onClose} footer={null}>
            <FinalForm
                onSubmit={onSave}
                render={(formArgs) => (
                    <form {...submitHandler(formArgs)}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <FormField
                                name="viewName"
                                type="text"
                                label="View Name"
                                placeholder="e.g., Active Store Managers"
                            />
                            <FormField
                                name="viewDescription"
                                type="textarea"
                                label="Description (optional)"
                                placeholder="Describe what this view shows"
                                rows={3}
                            />
                            <FormField
                                name="visibility"
                                type="select"
                                label="Visibility"
                                options={[
                                    { label: 'Private (Only me)', value: 'private' },
                                    { label: 'My Team', value: 'team' },
                                    { label: 'Everyone', value: 'everyone' }
                                ]}
                                initialValue="private"
                            />
                            <Row justify="end" gutter={8}>
                                <Col>
                                    <Button onClick={onClose}>Cancel</Button>
                                </Col>
                                <Col>
                                    <Button type="primary" onClick={formArgs.handleSubmit}>Save</Button>
                                </Col>
                            </Row>
                        </Space>
                    </form>
                )}
            />
        </Modal>
    );
}

// ViewSettingsModal Component
export function ViewSettingsModal({
    visible,
    onClose,
    views,
    config,
    onReorder,
    onToggleHide
}: {
    visible: boolean;
    onClose: () => void;
    views: ViewConfig[];
    config: ViewFilterConfig;
    onReorder: (views: ViewConfig[]) => void;
    onToggleHide: (viewId: string) => void;
}) {
    return (
        <Modal
            title="View Settings"
            open={visible}
            onCancel={onClose}
            footer={<Button onClick={onClose}>Close</Button>}
            width={600}
        >
            <div>
                <h4>Manage Views</h4>
                <List
                    dataSource={views}
                    renderItem={(view) => (
                        <List.Item
                            actions={[
                                <Button size="small" key="hide" onClick={() => onToggleHide(view.id)}>
                                    {view.isHidden ? 'Show' : 'Hide'}
                                </Button>
                            ]}
                        >
                            <List.Item.Meta
                                title={
                                    <Space>
                                        {view.isFavorite && <StarFilled style={{ color: '#faad14' }} />}
                                        {view.name}
                                        {view.isHidden && <Tag>Hidden</Tag>}
                                    </Space>
                                }
                                description={getVisibilityLabel(view.visibility)}
                            />
                        </List.Item>
                    )}
                />
            </div>
        </Modal>
    );
}
