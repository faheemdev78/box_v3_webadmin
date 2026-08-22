'use client';

import { Button, Tabs } from 'antd';
import { AppstoreOutlined, PlusOutlined } from '@ant-design/icons';
import { ALL_ORDERS_TAB_ID, type SavedDynamicFilter } from './types';

type Props = {
  activeId: string;
  pinned: SavedDynamicFilter[];
  dirty: boolean;
  onChange: (id: string) => void;
  onOpenManager: () => void;
};

export function FilterTabs({ activeId, pinned, dirty, onChange, onOpenManager }: Props) {
  const items = [
    { key: ALL_ORDERS_TAB_ID, label: (
      <span>
        All orders
        {dirty && activeId === ALL_ORDERS_TAB_ID ? <span style={{ color: '#ff4d4f', marginLeft: 6 }}>●</span> : null}
      </span>
    ) },
    ...pinned.map((view) => ({
      key: view._id,
      label: (
        <span>
          {view.name}
          {dirty && activeId === view._id ? <span style={{ color: '#ff4d4f', marginLeft: 6 }}>●</span> : null}
        </span>
      ),
    })),
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Tabs
        size="small"
        activeKey={activeId}
        onChange={onChange}
        items={items}
        style={{ flex: 1, marginBottom: 0 }}
        tabBarStyle={{ marginBottom: 0 }}
      />
      <Button size="small" icon={<AppstoreOutlined />} onClick={onOpenManager}>All views</Button>
      <Button size="small" icon={<PlusOutlined />} onClick={onOpenManager} />
    </div>
  );
}
