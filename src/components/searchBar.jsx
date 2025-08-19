'use client'

// import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { Input, Alert } from 'antd';
import debounce from 'lodash/debounce';

export const SearchBar = ({ onFocus, style, placeholder, size, timeout, permanentFilter, filter, onFilterUpdate, onChange, onSearch, loading, returnJson }) => {
    if (!onSearch) return <Alert message="Missing onSearch function" type='error' showIcon />

    const doSearch = (kw) => {
        let _filter = { ...filter, ...permanentFilter }

        if (kw) Object.assign(_filter, { search: { keywords: kw } })
        else delete _filter.search
        if (onFilterUpdate) onFilterUpdate(_filter)

        if (returnJson) return onSearch(_filter);
        else onSearch(_filter);
        // else onSearch({ variables: { filter: JSON.stringify(_filter) } });
    }

    const doSearch_debounce = debounce(doSearch, (timeout || 800));

    const fieldProps = { }
    if (!(onChange === false)) Object.assign(fieldProps, { onChange: (e) => doSearch_debounce(e.target.value) })

    return (<>
        <Input.Search 
            {...fieldProps}
            allowClear
            onFocus={onFocus}
            onSearch={doSearch_debounce}
            loading={loading}
            placeholder={placeholder || "input search text"}
            size={size || "large"}
            style={{ width: "100%", minWidth:"300px", minWidth: "400px", marginBottom: "10px", ...style }}
        />
    </>)
}
// SearchBar.defaultProps = {
//     placeholder: "input search text",
//     size: "large",
// };

SearchBar.propTypes = {
    style: PropTypes.object,
    placeholder: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    size: PropTypes.string,
    timeout: PropTypes.number,
    timeout: PropTypes.number,
    permanentFilter: PropTypes.object,
    filter: PropTypes.object,
    onFilterUpdate: PropTypes.func,
    onChange: PropTypes.func,
    onSearch: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    returnJson: PropTypes.bool,
}
