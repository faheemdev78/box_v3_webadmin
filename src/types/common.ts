export interface PaginationProps {
    defaultCurrent ?: number;
    current ?: number;
    defaultPageSize ?: number;
    pageSize ?: number;
    pageSizeOptions ?: number[];
    hideOnSinglePage ?: boolean;
    responsive ?: boolean;
    showLessItems ?: boolean;
    showQuickJumper ?: boolean;
    showSizeChanger ?: boolean;
    showTitle ?: boolean;
    size ?: 'default' | 'small';
    total ?: number;
}
