'use client';

import { Popover } from 'antd';
import type { FilterField, FilterGroup } from './types';
import { FilterEditor, type FilterChangeKind } from './FilterEditor';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fields: FilterField[];
  groups: FilterGroup[];
  onChange: (groups: FilterGroup[], kind: FilterChangeKind) => void;
  children: React.ReactNode;
};

const popupContainer = (trigger?: HTMLElement) => (trigger?.closest('.ant-popover') as HTMLElement) || document.body;

export function FilterBuilder({ open, onOpenChange, fields, groups, onChange, children }: Props) {
  return (
    <Popover
      trigger="click"
      open={open}
      onOpenChange={onOpenChange}
      placement="bottomLeft"
      content={(
        <FilterEditor
          fields={fields}
          groups={groups}
          onChange={onChange}
          getPopupContainer={popupContainer}
          showDone
          onDone={() => onOpenChange(false)}
        />
      )}
    >
      {children}
    </Popover>
  );
}
