import React, { useState, useEffect } from 'react';
import { Modal, Input, Checkbox, Space, Button, Divider, Select } from 'antd';
import { HolderOutlined, CloseOutlined } from '@ant-design/icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ColumnDefinition } from '../types';

interface EditColumnsModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (selectedColumns: string[]) => void;
  availableColumns: ColumnDefinition[];
  selectedColumns: string[]; // Array of column keys currently selected
  frozenCount?: number; // Number of frozen columns
}

interface SortableColumnItemProps {
  column: ColumnDefinition;
  onRemove: () => void;
}

// Sortable column item for the selected columns list
const SortableColumnItem: React.FC<SortableColumnItemProps> = ({ column, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    padding: '8px 12px',
    backgroundColor: '#fff',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'default'
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
        <span
          {...attributes}
          {...listeners}
          style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: '#999' }}
        >
          <HolderOutlined />
        </span>
        <span>{column.label}</span>
      </div>
      <CloseOutlined
        style={{ cursor: 'pointer', color: '#999' }}
        onClick={onRemove}
      />
    </div>
  );
};

export const EditColumnsModal: React.FC<EditColumnsModalProps> = ({
  visible,
  onClose,
  onApply,
  availableColumns,
  selectedColumns,
  frozenCount = 0
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelectedColumns, setLocalSelectedColumns] = useState<string[]>(selectedColumns);
  const [localFrozenCount, setLocalFrozenCount] = useState(frozenCount);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Reset local state when modal opens
  useEffect(() => {
    if (visible) {
      setLocalSelectedColumns(selectedColumns);
      setLocalFrozenCount(frozenCount);
      setSearchTerm('');
    }
  }, [visible, selectedColumns, frozenCount]);

  // Group available columns
  const groupedColumns = availableColumns.reduce((acc, column) => {
    const group = column.group || 'Other';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(column);
    return acc;
  }, {} as Record<string, ColumnDefinition[]>);

  // Filter columns based on search
  const filteredGroupedColumns = Object.entries(groupedColumns).reduce((acc, [group, columns]) => {
    const filtered = columns.filter(col =>
      col.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[group] = filtered;
    }
    return acc;
  }, {} as Record<string, ColumnDefinition[]>);

  // Get selected column objects in order
  const selectedColumnObjects = localSelectedColumns
    .map(key => availableColumns.find(col => col.key === key))
    .filter(Boolean) as ColumnDefinition[];

  // Handle column selection/deselection
  const handleToggleColumn = (columnKey: string) => {
    if (localSelectedColumns.includes(columnKey)) {
      setLocalSelectedColumns(localSelectedColumns.filter(key => key !== columnKey));
    } else {
      setLocalSelectedColumns([...localSelectedColumns, columnKey]);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setLocalSelectedColumns((columns) => {
        const oldIndex = columns.indexOf(active.id);
        const newIndex = columns.indexOf(over.id);
        return arrayMove(columns, oldIndex, newIndex);
      });
    }
  };

  // Handle remove column
  const handleRemoveColumn = (columnKey: string) => {
    setLocalSelectedColumns(localSelectedColumns.filter(key => key !== columnKey));
  };

  // Handle apply
  const handleApply = () => {
    onApply(localSelectedColumns);
    onClose();
  };

  // Handle remove all
  const handleRemoveAll = () => {
    setLocalSelectedColumns([]);
  };

  return (
    <Modal
      title="Choose which columns you see"
      open={visible}
      onCancel={onClose}
      width={900}
      footer={[
        <Button key="apply" type="primary" onClick={handleApply}>Apply</Button>,
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button key="remove-all" danger onClick={handleRemoveAll}>Remove All Columns</Button>
      ]}
    >
      <div style={{ display: 'flex', gap: '16px', minHeight: '500px' }}>
        {/* Left Panel - Available Columns */}
        <div style={{ flex: 1, borderRight: '1px solid #f0f0f0', paddingRight: '16px' }}>
          <Input.Search
            placeholder="Search columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: '16px' }}
          />

          <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
            {Object.entries(filteredGroupedColumns).map(([group, columns]) => (
              <div key={group} style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                  {group}
                </div>
                <Space orientation="vertical" style={{ width: '100%' }}>
                  {columns.map((column) => (
                    <Checkbox
                      key={column.key}
                      checked={localSelectedColumns.includes(column.key)}
                      onChange={() => handleToggleColumn(column.key)}
                      style={{ width: '100%' }}
                    >
                      {column.label}
                    </Checkbox>
                  ))}
                </Space>
              </div>
            ))}
          </div>

          {Object.keys(filteredGroupedColumns).length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              No columns found
            </div>
          )}

          <Divider />
          <div style={{ fontSize: '12px', color: '#666' }}>
            Don&apos;t see the property you&apos;re looking for?{' '}
            <a href="#" onClick={(e) => e.preventDefault()}>Create a property</a>
          </div>
        </div>

        {/* Right Panel - Selected Columns */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 600 }}>
              SELECTED COLUMNS ({localSelectedColumns.length})
            </div>
            <div>
              <Space>
                <span style={{ fontSize: '12px', color: '#666' }}>Frozen columns</span>
                <Select
                  value={localFrozenCount}
                  onChange={setLocalFrozenCount}
                  style={{ width: 80 }}
                  options={[
                    { label: '0', value: 0 },
                    { label: '1', value: 1 },
                    { label: '2', value: 2 },
                    { label: '3', value: 3 }
                  ]}
                />
              </Space>
            </div>
          </div>

          {localSelectedColumns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              No columns selected
            </div>
          ) : (
            <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localSelectedColumns}
                  strategy={verticalListSortingStrategy}
                >
                  {selectedColumnObjects.map((column) => (
                    <SortableColumnItem
                      key={column.key}
                      column={column}
                      onRemove={() => handleRemoveColumn(column.key)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
