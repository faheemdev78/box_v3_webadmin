// Usage in your component:
// const OrdersList: React.FC<OrdersListProps> = ({ 
//   pagination, 
//   pageView, 
//   filter, 
//   data, 
//   fetchData, 
//   setBusy, 
//   busy, 
//   columns, 
//   hideListHeader, 
//   parseEditLink, 
//   searchFilterConfig 
// }) => {
//   // Your component logic here
// };

// Picker status enums
// export enum ItemStatus {
//     REQUESTED = 'requested',
//     CONFIRMED = 'confirmed',
//     OUT_OF_STOCK = 'out_of_stock',
//     DAMAGED = 'damaged',
//     SUBSTITUTED = 'substituted',
//     REJECTED_BY_CUSTOMER = 'rejected_by_customer'
// }

import { PaginationProps } from "./common";

export interface SearchFilterConfig {
    exclude?: any[];
    hide?: boolean;
}

export interface OrdersListProps {
    pagination?: PaginationProps;
    pageView?: string;
    filter?: Record<string, any>;
    dataSource?: any[];
    fetchData?: (args:any) => void;
    setBusy?: (busy: boolean) => void;
    busy?: boolean;
    columns?: string[] | any[];
    hideListHeader?: boolean;
    parseEditLink?: (item: any) => string;
    searchFilterConfig?: SearchFilterConfig;
    loading?: boolean;
}
