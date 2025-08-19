'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import PropTypes from 'prop-types';
import { FormField } from './FormField';
import debounce from 'lodash/debounce';
import { Spin, Select, message } from 'antd';
import { __error } from '@_/lib/consoleHelper';
import { useMutation, useLazyQuery, gql } from '@apollo/client';


/* eslint-disable react-hooks/exhaustive-deps */
const DebounceSelect = ({ fetchOptions, defaultData, debounceTimeout = 800, ...props }) => {

    const [fetching, setFetching] = useState((props.preload===true));
    const [options, setOptions] = useState(defaultData || []);
    const [called, setCalled] = useState(false);
    const fetchRef = useRef(0);

    const debounceFetcher = useMemo(() => {
        const loadOptions = async (value) => {
            // await sleep(2000)
            setCalled(true);
            fetchRef.current += 1;
            const fetchId = fetchRef.current;
            setOptions([]);
            setFetching(true);
            fetchOptions(value).then((newOptions) => {
                if (fetchId !== fetchRef.current) { // for fetch callback order
                    return;
                }
                setOptions(newOptions);
                setFetching(false);
            });
        };
        return debounce(loadOptions, debounceTimeout);
    }, [fetchOptions, debounceTimeout]);

    useEffect(() => {
        if (!props.preload || called) return;
        debounceFetcher("preload_data");
    }, [props.preload, called])

    // if (props.preload && fetching) return <Loader loading={true} />

    return (<>
        <FormField
            type="select"
            {...props}
            // allowClear
            // labelInValue
            // showSearch={props.showSearch===false ? false : true}
            showSearch={true}
            // onSearch={props.showSearch===false ? false : debounceFetcher}
            onSearch={!props.showLocalSearch ? debounceFetcher : undefined}
            filterOption={false}
            loading={fetching || props.loading}
            notFoundContent={(fetching || props.loading) ? <Spin size="small" /> : null}
            options={options && options.map(o=>({ ...o, label: o.label || o.title }))}
        />
    </>)
}

// Usage of DebounceSelect
export const SearchableSelect = (props) => {
    const { client, defaultValues, placeholder } = props;
    const [value, setValue] = useState(props.data || []);
    const [busy, setBusy] = useState(false);

    const [fetchQuery, { called, loading }] = useLazyQuery(
        props.query,
        // { variables: { filter: JSON.stringify({}) } }
    );

    const fetchData = async (kw) => {
        if (!kw || kw.length < 1) return;

        let filter = { ...props.filter };

        if (kw == "preload_data") filter = Object.assign(filter, {})
        else filter = Object.assign(filter, { search: { keywords: kw } })

        if (props.static_filter) Object.assign(filter, { ...props.static_filter })
        filter = JSON.stringify(filter);

        setBusy(true);

        let results = await fetchQuery({
            variables: { filter },
            // fetchPolicy: // no-cache, network-only
            fetchPolicy: 'network-only', // Used for first execution
            nextFetchPolicy: 'cache-first', // Used for subsequent executions
        }).then(r => r?.data[props.queryName])
        .catch(err=>{
            console.log(__error("Error: "), err)
            return { error: { message:"Invalid results!"}}
        })

        setBusy(false);

        if (results && results?.error?.message) {
            message.error(results.error.message);
            return [];
        }
        else {
            let _results = results.slice()
            if (props.resultParser) return props.resultParser(results);

            return _results.map(o => ({
                value: o._id,
                title: o.title,
                raw: o
            }));
        }

    }

    return (
        <DebounceSelect
            loading={busy}
            {...props}
            // value={value}
            placeholder={placeholder || " - Select -"}
            fetchOptions={fetchData}
            onChange={(val, raw, callback) => {
                // console.log("val, raw: ", {val, raw})
                if (props.onChange) props.onChange(val, raw, callback)
                setValue(val);
                return val;
            }}
        />
    );
};
SearchableSelect.propTypes = {
    style: PropTypes.object,
    // Field specific properties
    rules: PropTypes.array,
    placeholder: PropTypes.string,
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    name: PropTypes.string.isRequired,
    mode: PropTypes.string,
    onChnage: PropTypes.func,
    onSelect: PropTypes.func,
    onDeselect: PropTypes.func,
    query: PropTypes.object.isRequired,
    queryName: PropTypes.string.isRequired,
    resultParser: PropTypes.func,
    preload: PropTypes.bool,
    showLocalSearch: PropTypes.bool,
    static_filter: PropTypes.object,
    filter: PropTypes.object,
    defaultData: PropTypes.array,
    validate: PropTypes.oneOfType([PropTypes.array, PropTypes.object, PropTypes.func])
}
