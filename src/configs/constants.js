export const defaultPageSize = 10;
export const defaultDateFormat = "MM-DD-YYYY";
export const defaultDateTimeFormat = "MM-DD-YYYY hh:mm a";
export const adminRoot = "/console"
export const shiftGap = 5;
export const PROD_GAL_SIZE = 4;
export const NOIMAGE = '/images/no-image.jpg';

export const publishStatus = [{ label: "Online", value: 'online' }, { label: "Offline", value: 'offline' }];

export const userStatus = [
    { label: "Active", value: 'active' }, 
    { label: "In-active", value: 'inactive' }, 
    // { label: "Incomplete", values:"incomplete" }
];

export const taxTypes = [{ label: 'Fix', value: 'fix' }, { label: '%', value: '%' }]
export const tax_formula_types = [{ label: '%', value: 'percent' }, { label: 'Fix', value: 'fix' }]
export const tax_applition_on = [{ label: 'Before Discount', value: 'before-discount' }, { label: 'After Discount', value: 'after-discount' }]

export const locationTypes = [{ label: 'Country', value: 'country' }, { label: 'City', value: 'city' }]
export const gendersArray = [{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }]

export const basketCategories = [
    { label: 'Pickup', value: "pickup" },
    { label: 'Dispatch', value: 'dispatch' },
]


export const geoZoneTypes = [
    { label: 'Service Zones', value: "service" },
    { label: 'Delivery Zones', value: "delivery" },
]
export const fieldDefinationCategories = [
    { label: 'Product', value: "product" },
]
export const fieldTypesArray = [
    { label: 'Text', value: "text" },
    { label: 'Textarea', value: "textarea" },
    { label: 'Email', value: "email" },
    { label: 'Number', value: "number" },
    { label: 'Select', value: "select" },
    { label: 'Date', value: "date" },
    { label: 'Date & Time', value: "date-time" },
    { label: 'Switch', value: "switch" },
    { label: 'Checkbox', value: "checkbox" },
    { label: 'Radio Group', value: "radio-group" },
]

export const userAccountGroups = [
    { label: 'Employee', value: "employee" },
    { label: 'Manager', value: "manager" },
]

export const settingCats = [
    { value: "general", label: "General" },
    { value: "applications", label: "Applications" },
    { value: "alerts", label: "Alerts" },
]

export const timeZonesArray = [ "Asia/Karachi", ]
export const defaultTZ = timeZonesArray[0];

export const applicationArray = ["web 3.1", "smart 3.1"]

export const defaultPagination = {
    defaultCurrent: 1,
    current: 1, // Current page number
    defaultPageSize: defaultPageSize,
    pageSize: defaultPageSize,
    pageSizeOptions: [10, 20, 30, 50, 100],
    hideOnSinglePage: true,
    responsive: true,
    showLessItems: false,
    showQuickJumper: false,
    showSizeChanger: false, onShowSizeChange: undefined,
    showTitle: true,
    showTotal: (total, range) => (`${range.join(" ~ ")} / ${total}`), // (`${range} / ${total}`),
    size: 'medium',
    total: undefined,
    onChange: undefined,
};



/*****************************
 * PAGE Layout Settings
 * 
******************************* */
export const pageOptionsArray = {
    "home-page": {
        banners: ["top-slider", "top-banner", "mid-banner", "bottom-banner"],
        products: ["featured-products", "top-products"],
    }
}
