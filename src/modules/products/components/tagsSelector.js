'use client'
import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { __error, __hilight } from '@_/lib/consoleHelper';
import { message, Spin } from 'antd';
import debounce from 'lodash/debounce';
import { FormField } from '@_/components/form';


export const TagsSelector = props => {
    const setNull = (arr) => {
        if (!props.addnull) return arr;

        let nullval = { _id: null, title: " " };
        if (arr) return arr.unshift(nullval);
        return [nullval];
    }

    const [{ fetching, data, value }, setState] = useState({ data: props.data || setNull(), value: [], fetching: false });

    var lastFetchId = 0;
    const _fetchData = value => {
        if (!value || value.length < 1) return;

        lastFetchId += 1;
        const fetchId = lastFetchId;
        setState({ data: setNull(), fetching: true, value });

        fetch(`${process.env.ADMIN_API_URI}/tags/search?title=${value}&black_list_ids=${props.black_list_ids || ""}`)
            .then(response => response.json())
            .then(body => {

                if (!body || !body.json) {
                    console.log(__error("Invalid server response"), body);
                    setState({ data: setNull(), fetching: false, value: [] });
                    return;
                }
                if (body.json.error) {
                    // message.error(body.json.error.message);
                    console.log(__error(body.json.error.message));
                    setState({ data: setNull(), fetching: false, value: [] });
                    return;
                }

                // for fetch callback order
                if (fetchId !== lastFetchId) return;

                // const data = [...body.json];
                const data = body.json.map(row => (row.title));
                // const data = body.json.map(row => ({
                //     title: `${row.title}`,
                //     _id: `${row.title}`,
                //     // _id: JSON.stringify({ _id: row._id, title: row.title }),
                //     // _id: row._id,
                // }));
                setNull(data)

                // const data = null
                setState({ data, fetching: false });
            });
    };
    const fetchData = debounce(_fetchData, 800);

    const handleChange = value => {
        setState({ value, data: [], fetching: false });
    };

    return (
        <div>
            <FormField validate={props.validate}
                type='select'
                mode="tags"
                name={props.name} label={props.label || "Type"} data={data}
                placeholder="Search Type"
                addNull={false}
                // keyMap="value=>text"
                inputProps={{
                    loading: fetching,
                    mode: props.mode || 'tags',
                    showSearch: true,
                    defaultActiveFirstOption: false,
                    showArrow: true,
                    notFoundContent: fetching ? <Spin size="small" /> : null,
                    filterOption: false,
                    onSearch: fetchData,
                    onChange: handleChange,
                }}
            />
        </div>
    )
}

TagsSelector.propTypes = {
    data: PropTypes.array,
    black_list_ids: PropTypes.string, // comma saperated values
    mode: PropTypes.string,
}

