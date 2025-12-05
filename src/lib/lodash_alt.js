/**
 * Edge Runtime-compatible alternatives to lodash functions
 * Use these instead of lodash in middleware and Edge Runtime contexts
 */

/**
 * Capitalize the first letter of a string
 * Replaces: lodash/capitalize
 */
export const capitalize = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Check if value is a string
 * Replaces: lodash/isString or _.isString
 */
export const isString = (value) => {
    return typeof value === 'string';
};

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * Replaces: lodash/isEmpty or _.isEmpty
 */
export const isEmpty = (value) => {
    if (value == null) return true;
    if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

/**
 * Check if value is an object
 * Replaces: lodash/isObject or _.isObject
 */
export const isObject = (value) => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * Deep clone an object
 * Replaces: lodash/cloneDeep or _.cloneDeep
 */
export const cloneDeep = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    return JSON.parse(JSON.stringify(obj));
};

/**
 * Get a nested property from an object safely
 * Replaces: lodash/get or _.get
 */
export const get = (obj, path, defaultValue = undefined) => {
    const keys = Array.isArray(path) ? path : path.split('.');
    let result = obj;

    for (const key of keys) {
        if (result == null) return defaultValue;
        result = result[key];
    }

    return result === undefined ? defaultValue : result;
};
