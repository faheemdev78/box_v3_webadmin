import React, { CSSProperties, ReactNode } from 'react';
import styles from './List.module.scss';

interface ListProps<T = any> {
    dataSource?: T[];
    renderItem?: (item: T, index: number) => ReactNode;
    children?: ReactNode;
    size?: 'small' | 'default' | 'large';
    bordered?: boolean;
    split?: boolean;
    loading?: boolean;
    grid?: {
        gutter?: number;
        column?: number;
        xs?: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
        xxl?: number;
    };
    header?: ReactNode;
    footer?: ReactNode;
    className?: string;
    style?: CSSProperties;
    itemLayout?: 'horizontal' | 'vertical';
    locale?: { emptyText: string };
    pagination?: any;
    rowKey?: string | ((item: T) => string);
}

interface ListItemProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
    actions?: ReactNode[];
    extra?: ReactNode;
}

interface ListItemMetaProps {
    avatar?: ReactNode;
    title?: ReactNode;
    description?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

const ListItemMeta: React.FC<ListItemMetaProps> = ({
    avatar,
    title,
    description,
    className = '',
    style
}) => {
    return (
        <div className={`${styles['list-item-meta']} ${className}`} style={style}>
            {avatar && <div className={styles['list-item-meta-avatar']}>{avatar}</div>}
            <div className={styles['list-item-meta-content']}>
                {title && <div className={styles['list-item-meta-title']}>{title}</div>}
                {description && <div className={styles['list-item-meta-description']}>{description}</div>}
            </div>
        </div>
    );
};

const ListItem: React.FC<ListItemProps> & { Meta: typeof ListItemMeta } = ({
    children,
    className = '',
    style,
    actions,
    extra
}) => {
    return (
        <div className={`${styles['list-item']} ${className}`} style={style}>
            <div className={styles['list-item-main']}>
                {children}
            </div>
            {actions && actions.length > 0 && (
                <ul className={styles['list-item-actions']}>
                    {actions.map((action, index) => (
                        <li key={index}>
                            {action}
                            {index < actions.length - 1 && <em className={styles['list-item-actions-split']} />}
                        </li>
                    ))}
                </ul>
            )}
            {extra && <div className={styles['list-item-extra']}>{extra}</div>}
        </div>
    );
};

ListItem.Meta = ListItemMeta;

function List<T = any>({
    dataSource = [],
    renderItem,
    children,
    size = 'default',
    bordered = false,
    split = true,
    loading = false,
    grid,
    header,
    footer,
    className = '',
    style,
    itemLayout = 'horizontal',
    locale = { emptyText: 'No Data' },
    pagination,
    rowKey
}: ListProps<T>) {
    const listClasses = [
        styles.list,
        styles[`list-${size}`],
        bordered ? styles['list-bordered'] : '',
        split ? styles['list-split'] : '',
        itemLayout === 'vertical' ? styles['list-vertical'] : styles['list-horizontal'],
        grid ? styles['list-grid'] : '',
        loading ? styles['list-loading'] : '',
        className
    ].filter(Boolean).join(' ');

    const getKey = (item: T, index: number): string => {
        if (typeof rowKey === 'function') {
            return rowKey(item);
        }
        if (typeof rowKey === 'string' && item && typeof item === 'object') {
            return (item as any)[rowKey];
        }
        return String(index);
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className={styles['list-loading-container']}>
                    <div className={styles['list-loading-spinner']}>Loading...</div>
                </div>
            );
        }

        if (dataSource.length === 0 && !children) {
            return (
                <div className={styles['list-empty']}>
                    <div className={styles['list-empty-text']}>{locale.emptyText}</div>
                </div>
            );
        }

        if (renderItem && dataSource.length > 0) {
            return dataSource.map((item, index) => (
                <React.Fragment key={getKey(item, index)}>
                    {renderItem(item, index)}
                </React.Fragment>
            ));
        }

        return children;
    };

    return (
        <div className={listClasses} style={style}>
            {header && <div className={styles['list-header']}>{header}</div>}
            <div className={styles['list-items']}>
                {renderContent()}
            </div>
            {footer && <div className={styles['list-footer']}>{footer}</div>}
            {pagination && <div className={styles['list-pagination']}>{pagination}</div>}
        </div>
    );
}

List.Item = ListItem;

export default List;