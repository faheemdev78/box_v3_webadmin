'use client'

import React, { useEffect, useState } from 'react';
import { Table as AntTable, Space, TableProps } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { DndContext } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, DeleteButton, IconButton } from './button';

interface MyTableProps extends TableProps<any> {
    tooltip?: string | object,
    isSortable?: boolean;
    onSortSave?: (order: { _id: string; priority_order: number }[]) => Promise<any>;
}

export const Table: React.FC<MyTableProps> = (_props) => {
    const props = { ..._props }
    delete props.isSortable;
    delete props.onSortSave;

    const [dataSource, setDataSource] = useState<any[] | null>(null);

    useEffect(() => {
        if (!props?.dataSource) return;
        if (!Array.isArray(props.dataSource)) return;
        let _dataSource = props?.dataSource?.map((o, i) => ({ key: (o._id || i + 1), ...o }));
        setDataSource(_dataSource)

    }, [props?.dataSource])

    const [dirty, set_dirty] = useState(false)
    const [busy, set_busy] = useState(false)

    
    if (_props.isSortable){
        // let columns = [{ key: 'sort' }, { title: 'Name', dataIndex: 'name' }, { title: 'Age', dataIndex: 'age' }, { title: 'Address', dataIndex: 'address' } ];
        const columns = [{ key: 'sort', width:50 } ];
        const sortableColumns = props.columns ? columns.concat(props.columns as any) : columns;


        const Row = ({ children, ...rowProps }: { children: React.ReactNode; [key: string]: any }) => {
            const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, } = useSortable({ id: rowProps['data-row-key'] });
            const style = {
                ...rowProps.style,
                transform: CSS.Transform.toString(
                    transform && { ...transform, scaleY: 1 },
                ),
                transition,
                ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
            };

            return (
                <tr {...rowProps} ref={setNodeRef} style={style} {...attributes}>
                    {React.Children.map(children, (child) => {
                        if (!React.isValidElement(child)) return child;
                        if (child.key === 'sort') {
                            return React.cloneElement(child as React.ReactElement, {
                                children: (<MenuOutlined ref={setActivatorNodeRef} style={{ touchAction: 'none', cursor: 'move', }} {...listeners} />),
                            } as any);
                        }
                        return child;
                    })}
                </tr>
            );
        };

        const onDragEnd = ({ active, over }: { active: any; over: any }) => {
            if (active.id !== over?.id) {
                setDataSource((previous) => {
                    if (!previous || !over) return previous;
                    const activeIndex = previous.findIndex((i) => i.key === active.id);
                    const overIndex = previous.findIndex((i) => i.key === over?.id);
                    if (activeIndex < 0 || overIndex < 0) return previous;
                    set_dirty(true)
                    return arrayMove(previous, activeIndex, overIndex);
                });
            }
        };

        const saveSortOrder = async() => {
            if (!dataSource) return;
            let newOrder = dataSource.map((o, i) => ({ _id: o._id, priority_order: (i+1) }))

            if (_props.onSortSave) {
                set_busy(true)
                _props.onSortSave(newOrder).then(r => {
                    set_busy(false)
                    if (r.error) return;
                });
            }
        }

        return (<>
            <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
                <SortableContext
                    items={dataSource?.map((i) => i.key) || []}
                    strategy={verticalListSortingStrategy}
                >
                    <AntTable
                        rowClassName={(record, index) => (`table_row`)}
                        {...props}
                        components={{ body: { row: Row, } }}
                        // rowKey="key"
                        // rowKey={(r, i) => (r._id || i)}
                        columns={sortableColumns}
                        dataSource={dataSource || []}
                    />
                </SortableContext>
            </DndContext>

            {dirty && <div style={{ paddingTop:"20px", textAlign: "right" }}><Button onClick={saveSortOrder} color="orange">Save sort order</Button></div>}
        </>)
    }

    return (<>
        <AntTable
            rowClassName={(record, index) => (`table_row ${index % 2 ? "even_row" : "odd_row"}`)}
            {...props}
            dataSource={dataSource || []}
            // rowKey={(r, i) => (r._id || i)}
        />
    </>)
}

export const CellTitle = ({ children, menu }: { children: React.ReactNode; menu?: any }) => {
    return (<>
        {children}
        {menu && Object.keys(menu).length > 0 && <Space className={`hover_menu`}>
            {menu.onEdit && <IconButton onClick={menu.onEdit} icon="edit" size="small" />}
            {menu.onDelete && <DeleteButton onClick={menu.onDelete} size="small" />}
        </Space>}
    </>)
}
// CellTitle.propTypes = {
//     children: PropTypes.object,
//     menu: PropTypes.arrayOf(PropTypes.object),
// }
