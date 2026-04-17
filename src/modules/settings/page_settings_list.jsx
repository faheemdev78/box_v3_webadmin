import React, { Component, useEffect } from 'react'
import { useLazyQuery, useMutation, useSubscription } from '@apollo/client/react';
import { IconButton, Table } from '@/components';
import { __error } from '@/lib/consoleHelper';

import LIST_DATA from '@/graphql/page_settings/page_settings.graphql';


const ListComp = ({ pageSettings, onEditRecord }) => {
    const [get_pageSettings, { called, loading, error, data }] = useLazyQuery(LIST_DATA, { fetchPolicy: "no-cache" });
    // const [changeUserPickupAllow, update_details] = useMutation(UPDATE_PICKUP_ALLOW);
    // const { data, loading } = useSubscription(QUERY_SUBSCRIPTION, { variables: { postID } });

    useEffect(() => {
        if(called) return;
        get_pageSettings({ variables: { filter: "" } })
    }, [called, get_pageSettings])
    
    
    const renderActions = (text, record) => {
        return (<span className="action_buttons">
            <IconButton onClick={() => onEditRecord(record)} icon="pen" />
        </span>)
    }

    const columns = [
        { title: 'Name', dataIndex: 'title' },
        { title: 'Key', dataIndex: 'key' },
        { title: 'Actions',
            dataIndex: '',
            render: renderActions,
            className: 'actions-column',
            align: 'right',
            width: '100px'
        },
    ];

    return (<>
        <Table loading={loading}
            columns={columns}
            dataSource={data ? data.pageSettings : null}
            pagination={false}
        />
    </>)
}
// ListComp.propTypes = {
//     // prop: PropTypes.type.isRequired
//     // onEditRecord: PropTypes.func.isRequired
// }
export default ListComp;

