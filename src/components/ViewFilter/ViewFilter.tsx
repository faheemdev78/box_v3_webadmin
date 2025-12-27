'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, Button, Space, Tabs, message, Dropdown, Collapse, Row, Col } from 'antd';
import type { MenuProps } from 'antd';
import {
    PlusOutlined,
    FilterOutlined,
    SaveOutlined,
    DownOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    HolderOutlined,
    StarFilled,
    PushpinFilled
} from '@ant-design/icons';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import { submitHandler } from '@/components/form';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { ViewConfig, ViewFilterConfig, ViewFilterCallbacks } from './types';
import { getVisibleViews, getDefaultView, canEditView, canDeleteView, cloneView } from './utils';
import { FilterBuilder } from './FilterBuilder';
import { ViewTab, AllViewsTab, SaveViewModal } from './components';
import { Drawer } from '../drawer';
import DevBlock from '../devBlock';
import FitlerForm from './fitlerForm';

interface ViewFilterProps {
    config: ViewFilterConfig;
    views: ViewConfig[];
    callbacks: ViewFilterCallbacks;
}

// Sortable tab label with drag handle
const SortableTabLabel = React.memo(({ view }: { view: ViewConfig }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `view-${view.id}`,
    });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    };

    return (
        <div ref={setNodeRef} style={style}>
            <span {...attributes} {...listeners} style={{ cursor: 'grab', display: 'flex', alignItems: 'center' }}>
                <HolderOutlined style={{ fontSize: 12, color: '#999' }} />
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {view.isPinned && <PushpinFilled style={{ color: '#1890ff' }} />}
                {view.isFavorite && <StarFilled style={{ color: '#faad14' }} />}
                <span>{view.name}</span>
            </span>
        </div>
    );
});
SortableTabLabel.displayName = 'SortableTabLabel';

interface TabBarProps {
    sensors: any;
    handleDragEnd: any;
    pinnedViews: ViewConfig[];
    activeViewId: string | null;
    applyView: (view: ViewConfig) => void;
    setShowBuilder: (val: boolean) => void;
    setEditingViewId: (val: string | null) => void;
    currentFormRef: React.RefObject<any>;
    showFilterDetails: boolean;
    setShowFilterDetails: (val: boolean) => void;
    showAllViews: boolean;
    setShowAllViews: (val: boolean) => void;
    showAddNewForm: boolean;
    set_showAddNewForm: (val: boolean) => void;
}

const TabBar = ({ 
    sensors, handleDragEnd, pinnedViews, activeViewId, applyView, setShowBuilder, setEditingViewId, currentFormRef, 
    showFilterDetails, setShowFilterDetails,
    showAllViews, setShowAllViews,
    showAddNewForm, set_showAddNewForm
}: TabBarProps) => {
    // const [showAddNewForm, set_showAddNewForm] = useState(false);
    // const [showAllViews, setShowAllViews] = useState(false);
    // const [showFilterDetails, setShowFilterDetails] = useState(false);

    // Dropdown menu items for view actions
    const viewMenuItems: MenuProps['items'] = [
        {
            key: 'add',
            label: 'Add View',
            icon: <PlusOutlined />,
            onClick: () => {
                set_showAddNewForm(true)
                if (showAllViews) setShowAllViews(false);
                // setShowBuilder(true);
                // setShowAllViews(false);
                // setEditingViewId(null);
                // if (currentFormRef.current) currentFormRef.current.reset();
            }
        },
        {
            key: 'all',
            label: 'All Views',
            onClick: () => {
                setShowAllViews(true);
                if (showAddNewForm) set_showAddNewForm(false)
                // setShowBuilder(false);
            }
        }
    ];

    return (<>
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={pinnedViews.map((v:any) => `view-${v.id}`)} strategy={horizontalListSortingStrategy}>
                <Tabs
                    activeKey={activeViewId || undefined}
                    onChange={(key) => {
                        const view = pinnedViews.find((v:any) => v.id === key);
                        if (view) applyView(view);
                    }}
                    tabBarExtraContent={<>
                        <Button type="link" icon={showFilterDetails ? <EyeInvisibleOutlined /> : <EyeOutlined />} onClick={() => setShowFilterDetails(!showFilterDetails)}>
                            {showFilterDetails ? 'Hide' : 'Show'} Filter Details
                        </Button>
                        <Dropdown menu={{ items: viewMenuItems }} trigger={['click']}>
                            <Button type="text"><Space>Views <DownOutlined /></Space></Button>
                        </Dropdown>
                    </>}
                    items={pinnedViews.map((view:any) => ({
                        key: view.id,
                        label: <SortableTabLabel view={view} />,
                        children: null
                    }))}
                />
            </SortableContext>
        </DndContext>
        
    </>)
}

export function ViewFilter({ config, views, callbacks }: ViewFilterProps) {

    const [showAddNewForm, set_showAddNewForm] = useState(false);
    const [showAllViews, setShowAllViews] = useState(false);

    const [localViews, setLocalViews] = useState<ViewConfig[]>(views);
    const [activeViewId, setActiveViewId] = useState<string | null>(null);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showBuilder, setShowBuilder] = useState(false);
    const [editingViewId, setEditingViewId] = useState<string | null>(null);
    const [showFilterDetails, setShowFilterDetails] = useState(false);
    const [pendingViewLoad, setPendingViewLoad] = useState<ViewConfig | null>(null);
    const currentFormRef = useRef<any>(null);

    // Get visible views for current user
    const visibleViews = getVisibleViews(localViews, config.currentUser.id, config.currentUser.teamId);
    const pinnedViews = visibleViews.filter(v => v.isPinned && v.isFavorite);

    // Set default view on mount
    useEffect(() => {
        const defaultView = getDefaultView(localViews, config.currentUser.id, config.currentUser.teamId);
        if (defaultView && !activeViewId) {
            setActiveViewId(defaultView.id);
            // Auto-apply default view
            if (callbacks.onApplyView) {
                callbacks.onApplyView(defaultView);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync with external views
    useEffect(() => {
        setLocalViews(views);
    }, [views]);

    // Load pending view when builder becomes active
    useEffect(() => {
        if (showBuilder && pendingViewLoad && currentFormRef.current) {
            const form = currentFormRef.current;

            // Deep clone the filter groups to avoid reference issues
            const filterGroups = JSON.parse(JSON.stringify(pendingViewLoad.filterGroups));

            // Convert columns to array of keys
            const columns = Array.isArray(pendingViewLoad.columns)
                ? pendingViewLoad.columns.map(c => typeof c === 'string' ? c : c.key)
                : config.defaultColumns;

            // Update form fields
            form.change('filterGroups', filterGroups);
            form.change('columns', columns);
            form.change('sort', pendingViewLoad.sort || null);

            setPendingViewLoad(null);
            message.success(`View "${pendingViewLoad.name}" loaded for editing`);
        }
    }, [showBuilder, pendingViewLoad, config.defaultColumns]);

    const initialValues = {
        filterGroups: [
            {
                logic: 'AND',
                conditions: []
            }
        ],
        columns: config.defaultColumns,
        sort: null
    };

    // Apply view
    const handleApplyView = (values: any) => {
        console.log('Applying view:', values);
        if (callbacks.onApplyView) {
            const viewConfig: ViewConfig = {
                id: 'temp_' + Date.now(),
                name: 'Temporary View',
                filterGroups: values.filterGroups || [],
                columns: values.columns || config.defaultColumns.map(key =>
                    config.availableColumns.find(col => col.key === key)!
                ),
                visibility: 'private',
                createdBy: config.currentUser.id,
                createdAt: new Date().toISOString(),
                isFavorite: false,
                isPinned: false,
                isDefault: false,
                isHidden: false,
                order: 9999
            };
            callbacks.onApplyView(viewConfig);
        }
        message.success('View applied successfully');
    };

    // Save view
    const handleSaveView = async (values: any) => {
        if (!values.viewName?.trim()) {
            message.error('Please enter a view name');
            return;
        }

        const currentFilterGroups = currentFormRef.current?.getState()?.values?.filterGroups || [];
        const currentColumns = currentFormRef.current?.getState()?.values?.columns || config.defaultColumns;
        const currentSort = currentFormRef.current?.getState()?.values?.sort || null;

        const newView: ViewConfig = {
            id: 'view_' + Date.now(),
            name: values.viewName,
            description: values.viewDescription,
            filterGroups: JSON.parse(JSON.stringify(currentFilterGroups)),
            columns: currentColumns.map((key: string) =>
                config.availableColumns.find(col => col.key === key)!
            ),
            sort: currentSort,
            visibility: values.visibility || 'private',
            createdBy: config.currentUser.id,
            createdAt: new Date().toISOString(),
            isFavorite: false,
            isPinned: false,
            isDefault: false,
            isHidden: false,
            order: localViews.length
        };

        try {
            if (callbacks.onSaveView) {
                await callbacks.onSaveView(newView);
            }
            setLocalViews([...localViews, newView]);
            setShowSaveModal(false);
            message.success(`View "${values.viewName}" saved successfully`);
        } catch (error) {
            message.error('Failed to save view');
        }
    };

    // Update view
    const handleUpdateView = async (view: ViewConfig) => {
        try {
            if (callbacks.onUpdateView) {
                await callbacks.onUpdateView(view);
            }
            setLocalViews(localViews.map(v => v.id === view.id ? view : v));
            message.success(`View "${view.name}" updated successfully`);
        } catch (error) {
            message.error('Failed to update view');
        }
    };

    // Delete view
    const handleDeleteView = async (viewId: string) => {
        try {
            if (callbacks.onDeleteView) {
                await callbacks.onDeleteView(viewId);
            }
            setLocalViews(localViews.filter(v => v.id !== viewId));
            message.success('View deleted successfully');

            // Switch to default if current view was deleted
            if (activeViewId === viewId) {
                const defaultView = getDefaultView(localViews.filter(v => v.id !== viewId), config.currentUser.id, config.currentUser.teamId);
                setActiveViewId(defaultView?.id || null);
            }
        } catch (error) {
            message.error('Failed to delete view');
        }
    };

    // Load view for editing
    const loadView = (view: ViewConfig) => {
        // Set editing mode
        setEditingViewId(view.id);

        // Set pending view to load
        setPendingViewLoad(view);

        // Switch to builder (useEffect will handle loading the data)
        setShowBuilder(true);
        setShowAllViews(false);
    };

    // Apply a view (click on tab or from list)
    const applyView = (view: ViewConfig) => {
        setActiveViewId(view.id);
        setShowBuilder(false);
        setShowAllViews(false);
        if (callbacks.onApplyView) {
            callbacks.onApplyView(view);
        }
        message.success(`View "${view.name}" applied`);
    };

    // Toggle favorite
    const toggleFavorite = async (viewId: string) => {
        const view = localViews.find(v => v.id === viewId);
        if (view) {
            const updatedView = { ...view, isFavorite: !view.isFavorite };
            await handleUpdateView(updatedView);
        }
    };

    // Toggle pin
    const togglePin = async (viewId: string) => {
        const view = localViews.find(v => v.id === viewId);
        if (view) {
            const updatedView = { ...view, isPinned: !view.isPinned };
            await handleUpdateView(updatedView);
        }
    };

    // Set as default
    const setAsDefault = async (viewId: string) => {
        // Remove default from all views
        const updatedViews = localViews.map(v => ({ ...v, isDefault: v.id === viewId }));
        setLocalViews(updatedViews);

        // Update via callback if provided
        if (callbacks.onUpdateView) {
            const view = updatedViews.find(v => v.id === viewId);
            if (view) {
                await callbacks.onUpdateView(view);
            }
        }
        message.success('Default view updated');
    };

    // Clone view
    const handleCloneView = (view: ViewConfig) => {
        const clonedView = cloneView(view, config.currentUser.id);
        setLocalViews([...localViews, clonedView]);
        message.success(`View "${clonedView.name}" created`);
    };

    // Get the current active view
    const activeView = activeViewId ? localViews.find(v => v.id === activeViewId) : null;

    // Drag sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle tab reorder
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = pinnedViews.findIndex(v => `view-${v.id}` === active.id);
            const newIndex = pinnedViews.findIndex(v => `view-${v.id}` === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const reorderedPinned = arrayMove(pinnedViews, oldIndex, newIndex);

                // Update order property for all pinned views
                const updatedViews = localViews.map(view => {
                    const pinnedIndex = reorderedPinned.findIndex(pv => pv.id === view.id);
                    if (pinnedIndex !== -1) {
                        return { ...view, order: pinnedIndex };
                    }
                    return view;
                });

                setLocalViews(updatedViews);
                message.success('Tab order updated');
            }
        }
    };

    // Dropdown menu items for view actions
    const viewMenuItems: MenuProps['items'] = [
        {
            key: 'add',
            label: 'Add View',
            icon: <PlusOutlined />,
            onClick: () => {
                setShowBuilder(true);
                setShowAllViews(false);
                setEditingViewId(null);
                if (currentFormRef.current) {
                    currentFormRef.current.reset();
                }
            }
        },
        {
            key: 'all',
            label: 'All Views',
            onClick: () => {
                setShowAllViews(true);
                setShowBuilder(false);
            }
        }
    ];

    return (<>
        <TabBar
            sensors={sensors}
            handleDragEnd={handleDragEnd}
            pinnedViews={pinnedViews}
            activeViewId={activeViewId}
            applyView={applyView}
            setShowBuilder={setShowBuilder}
            setEditingViewId={setEditingViewId}
            currentFormRef={currentFormRef}
            setShowFilterDetails={setShowFilterDetails}
            showFilterDetails={showFilterDetails}
            showAllViews={showAllViews} setShowAllViews={setShowAllViews}
            showAddNewForm={showAddNewForm} set_showAddNewForm={set_showAddNewForm}
        />

        {showFilterDetails && activeView && <>
            <ViewTab
                view={activeView}
                config={config}
                // form={form}
                onApply={() => activeView && applyView(activeView)}
                onEdit={() => activeView && loadView(activeView)}
                onDelete={() => activeView && handleDeleteView(activeView.id)}
                onToggleFavorite={() => activeView && toggleFavorite(activeView.id)}
                onTogglePin={() => activeView && togglePin(activeView.id)}
                onSetDefault={() => activeView && setAsDefault(activeView.id)}
                onClone={() => activeView && handleCloneView(activeView)}
                canEdit={activeView ? canEditView(activeView, config.currentUser.id, config.currentUser.role) : false}
                canDelete={activeView ? canDeleteView(activeView, config.currentUser.id, config.currentUser.role) : false}
                isExpanded
            />
        </>}


        <Drawer title="All Views" footer={false} open={showAllViews} destroyOnHidden={true} onClose={() => setShowAllViews(false)} styles={{ body:{ padding:0 } }}>
            <AllViewsTab
                views={visibleViews}
                config={config}
                form={currentFormRef.current}
                onLoad={loadView}
                onApply={applyView}
                onDelete={handleDeleteView}
                onToggleFavorite={toggleFavorite}
                onTogglePin={togglePin}
                onSetDefault={setAsDefault}
                onClone={handleCloneView}
            />
        </Drawer>

        <Drawer title={`${showAddNewForm === true ? 'Create' : 'Edit'} View`} footer={false} open={showAddNewForm !== false} destroyOnHidden={true} onClose={() => set_showAddNewForm(false)} styles={{ body:{ padding:"15px" } }} size={600}>
            {showAddNewForm !== false && <>
                <FitlerForm initialValues={{}} config={config} />
            </>}
        </Drawer>


    </>)

    return (<>
            <TabBar
                sensors={sensors}
                handleDragEnd={handleDragEnd}
                pinnedViews={pinnedViews}
                activeViewId={activeViewId}
                applyView={applyView}
                setShowBuilder={setShowBuilder}
                setEditingViewId={setEditingViewId}
                currentFormRef={currentFormRef}
                showFilterDetails={showFilterDetails}
                setShowFilterDetails={setShowFilterDetails}
                showAllViews={showAllViews}
                setShowAllViews={setShowAllViews}
                showAddNewForm={showAddNewForm}
                set_showAddNewForm={set_showAddNewForm}
            />
        

        <Button type="link" icon={showFilterDetails ? <EyeInvisibleOutlined /> : <EyeOutlined />} onClick={() => setShowFilterDetails(!showFilterDetails)}>
            {showFilterDetails ? 'Hide' : 'Show'} Filter Details
        </Button>

        {showFilterDetails && <>
            {activeView && (<ViewTab
                view={activeView!}
                config={config}
                // form={form}
                onApply={() => applyView(activeView!)}
                onEdit={() => loadView(activeView!)}
                onDelete={() => handleDeleteView(activeView!.id)}
                onToggleFavorite={() => toggleFavorite(activeView!.id)}
                onTogglePin={() => togglePin(activeView!.id)}
                onSetDefault={() => setAsDefault(activeView!.id)}
                onClone={() => handleCloneView(activeView!)}
                canEdit={canEditView(activeView!, config.currentUser.id, config.currentUser.role)}
                canDelete={canDeleteView(activeView!, config.currentUser.id, config.currentUser.role)}
                isExpanded
            />)}
        </>}

        <hr />


        <FinalForm
            onSubmit={handleApplyView}
            initialValues={initialValues}
            mutators={{ ...arrayMutators }}
            render={(formArgs) => {
                const { handleSubmit, form, values } = formArgs;

                // Store form reference
                currentFormRef.current = form;

                // HubSpot-style View UI
                return (<>
                    <Card>
                        <form {...submitHandler(formArgs)}>
                            {/* Show Builder Mode */}
                            {showBuilder ? (
                                <div>
                                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0 }}>
                                            {editingViewId
                                                ? `Editing: ${localViews.find(v => v.id === editingViewId)?.name}`
                                                : 'Create New View'
                                            }
                                        </h3>
                                        <Space>
                                            <Button onClick={() => {
                                                form.reset();
                                                setEditingViewId(null);
                                                setShowBuilder(false);
                                                // Go back to default view
                                                const defaultView = getDefaultView(localViews, config.currentUser.id, config.currentUser.teamId);
                                                if (defaultView) {
                                                    setActiveViewId(defaultView.id);
                                                }
                                            }}>
                                                Cancel
                                            </Button>
                                            {editingViewId ? (
                                                <Button
                                                    icon={<SaveOutlined />}
                                                    type="primary"
                                                    onClick={() => {
                                                        const existingView = localViews.find(v => v.id === editingViewId);
                                                        if (existingView) {
                                                            const currentFilterGroups = currentFormRef.current?.getState()?.values?.filterGroups || [];
                                                            const currentColumns = currentFormRef.current?.getState()?.values?.columns || config.defaultColumns;
                                                            const currentSort = currentFormRef.current?.getState()?.values?.sort || null;

                                                            const updatedView: ViewConfig = {
                                                                ...existingView,
                                                                filterGroups: JSON.parse(JSON.stringify(currentFilterGroups)),
                                                                columns: currentColumns.map((key: string) =>
                                                                    config.availableColumns.find(col => col.key === key)!
                                                                ),
                                                                sort: currentSort,
                                                                updatedAt: new Date().toISOString()
                                                            };
                                                            handleUpdateView(updatedView);
                                                            setEditingViewId(null);
                                                            setShowBuilder(false);
                                                            setActiveViewId(updatedView.id);
                                                        }
                                                    }}
                                                >
                                                    Update View
                                                </Button>
                                            ) : (
                                                <Button icon={<SaveOutlined />} type="primary" onClick={() => setShowSaveModal(true)}>
                                                    Save New View
                                                </Button>
                                            )}
                                        </Space>
                                    </div>
                                    <FilterBuilder config={config} form={form} />
                                </div>
                            ) : showAllViews ? (
                                /* Show All Views List */
                                <div>
                                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0 }}>All Views</h3>
                                        <Button onClick={() => {
                                            setShowAllViews(false);
                                            const defaultView = getDefaultView(localViews, config.currentUser.id, config.currentUser.teamId);
                                            if (defaultView) {
                                                setActiveViewId(defaultView.id);
                                            }
                                        }}>
                                            Close
                                        </Button>
                                    </div>
                                    <AllViewsTab
                                        views={visibleViews}
                                        config={config}
                                        form={form}
                                        onLoad={loadView}
                                        onApply={applyView}
                                        onDelete={handleDeleteView}
                                        onToggleFavorite={toggleFavorite}
                                        onTogglePin={togglePin}
                                        onSetDefault={setAsDefault}
                                        onClone={handleCloneView}
                                    />
                                </div>
                            ) : (
                                /* HubSpot-style Tab Bar with Dropdown */
                                <div>
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext
                                            items={pinnedViews.map(v => `view-${v.id}`)}
                                            strategy={horizontalListSortingStrategy}
                                        >
                                            <Tabs
                                                activeKey={activeViewId || undefined}
                                                onChange={(key) => {
                                                    const view = pinnedViews.find(v => v.id === key);
                                                    if (view) {
                                                        applyView(view);
                                                    }
                                                }}
                                                tabBarExtraContent={
                                                    <Dropdown menu={{ items: viewMenuItems }} trigger={['click']}>
                                                        <Button type="text"><Space>Views <DownOutlined /></Space></Button>
                                                    </Dropdown>
                                                }
                                                items={pinnedViews.map(view => ({
                                                    key: view.id,
                                                    label: <SortableTabLabel view={view} />,
                                                    children: null
                                                }))}
                                            />
                                        </SortableContext>
                                    </DndContext>

                                    {/* Current View Details with Toggle */}
                                    {activeView && (
                                        <div style={{ marginTop: 16 }}>
                                            <div style={{ marginBottom: 12 }}>
                                                <Button
                                                    type="link"
                                                    icon={showFilterDetails ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                                                    onClick={() => setShowFilterDetails(!showFilterDetails)}
                                                >
                                                    {showFilterDetails ? 'Hide' : 'Show'} Filter Details
                                                </Button>
                                            </div>

                                            <Collapse
                                                activeKey={showFilterDetails ? ['details'] : []}
                                                items={[
                                                    {
                                                        key: 'details',
                                                        label: 'Filter Configuration',
                                                        showArrow: false,
                                                        children: (
                                                                <ViewTab
                                                                    view={activeView}
                                                                    config={config}
                                                                    onApply={() => activeView && applyView(activeView)}
                                                                    onEdit={() => activeView && loadView(activeView)}
                                                                    onDelete={() => activeView && handleDeleteView(activeView.id)}
                                                                    onToggleFavorite={() => activeView && toggleFavorite(activeView.id)}
                                                                    onTogglePin={() => activeView && togglePin(activeView.id)}
                                                                    onSetDefault={() => activeView && setAsDefault(activeView.id)}
                                                                    onClone={() => activeView && handleCloneView(activeView)}
                                                                    canEdit={activeView ? canEditView(activeView, config.currentUser.id, config.currentUser.role) : false}
                                                                    canDelete={activeView ? canDeleteView(activeView, config.currentUser.id, config.currentUser.role) : false}
                                                                    isExpanded
                                                                />
                                                            )
                                                    }
                                                ]}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>

                        {/* Save View Modal */}
                        <SaveViewModal
                            visible={showSaveModal}
                            onClose={() => setShowSaveModal(false)}
                            onSave={handleSaveView}
                            config={config}
                        />
                    </Card>

                    <DevBlock obj={values} />
                </>);
            }}
        />


        
    </>
    );
}
