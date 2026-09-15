'use client';

import type { ReactNode } from 'react';
import { Flex, Space, theme } from 'antd';

// Listy owns the row padding and separators; these components lay out its content.
export function ListyItem({ children, actions }: {
    children?: ReactNode;
    actions?: ReactNode[];
}) {
    return (
        <Flex align="center" justify="space-between" gap="middle" wrap>
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>{children}</div>
            {actions && actions.length > 0 && (
                <Space wrap separator="|">{actions}</Space>
            )}
        </Flex>
    );
}

export function ListyItemMeta({ avatar, title, description }: {
    avatar?: ReactNode;
    title?: ReactNode;
    description?: ReactNode;
}) {
    const { token } = theme.useToken();

    return (
        <Flex align="start" gap="middle">
            {avatar && <div style={{ flexShrink: 0 }}>{avatar}</div>}
            <div style={{ flex: 1, minWidth: 0 }}>
                {title && <div style={{ marginBottom: token.marginXXS, fontWeight: token.fontWeightStrong }}>{title}</div>}
                {description && <div style={{ color: token.colorTextDescription }}>{description}</div>}
            </div>
        </Flex>
    );
}
