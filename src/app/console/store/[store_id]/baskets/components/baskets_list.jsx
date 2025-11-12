import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types';
import { useLazyQuery, useMutation, useSubscription } from '@apollo/client';
import { Popconfirm, Alert, message, Row, Col, Modal, Space } from 'antd';
import { Barcode, Loader, Icon, Button, IconButton, Table, Avatar, ListHeader, DevBlock, DeleteButton } from '@/components';
import { __error } from '@_/lib/consoleHelper';
import BasketFilter from './BasketFilter'
import { catchApolloError, checkApolloRequestErrors, lightOrDark, utcToDate } from '@_/lib/utill';
import BasketForm from './basket_form';
import { defaultDateTimeFormat } from '@_/configs';

import LIST_DATA from '@_/graphql/baskets/baskets.graphql';
import RECORD_DELETE from '@_/graphql/baskets/deleteBasket.graphql';
import RELEASE_BASKET from '@_/graphql/baskets/releaseBasket.graphql';

const ReleaseBasketButton = ({ basket, onSuccess }) => {
    const [busy, setBusy] = useState(false)
    const [do_releaseBasket, release_details] = useMutation(RELEASE_BASKET, {});
    
    // if (!basket.is_locked) return null;

    const releaseBasket = async() => {        
        setBusy(true);
        let results = await do_releaseBasket({ variables: { filter: JSON.stringify({ barcode: basket.barcode }) } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.releaseBasket }))
            .catch(catchApolloError)
        setBusy(false);
            
        if (!results || results.error) return message.error((results && results?.error?.message) || "Invalid Response");
        
        message.success("Released!")
        if (onSuccess) onSuccess(results)
    }
    
    return <Button size="small" color="red" loading={busy} onClick={releaseBasket}>Reset Basket</Button>
}


const ListComp = ({ store }) => {
    const [get_baskets, { called, loading, error, data }] = useLazyQuery(LIST_DATA, { fetchPolicy: "no-cache" });
    const [deleteBasket, del_details] = useMutation(RECORD_DELETE, {});
    // const { data, loading } = useSubscription(QUERY_SUBSCRIPTION, { variables: { postID } });

    const [busy, setBusy] = useState(false)
    const [baskets, setBaskets] = useState(null)
    const [showForm, set_showForm] = useState(false);

    const handleDelete = async(id) => {
        setBusy(true);
        let results = await deleteBasket({ variables: { id } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.deleteBasket }))
            .catch(catchApolloError)

        setBusy(false);

        if (!results || results.error) return message.error((results && results?.error?.message) || "Unable to delete record")
        message.success("Record deleted")
        fetchData();
    }

    const fetchData = async(_filter={}) => {
        const filter = {
            ..._filter,
            _id_store: store._id,
        }

        setBusy(true);
        let results = await get_baskets({ variables: { filter: JSON.stringify(filter) } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.baskets }))
            .catch(catchApolloError)
        setBusy(false);
        
        // if (!results || results.error) return message.error((results && results?.error?.message) || "no ")
        setBaskets(results)
    }

    const renderActions = (text, record) => {
        return (<Space>
            <IconButton onClick={() => onEditRecord(record)} icon="pen" />
            <DeleteButton onConfirm={() => handleDelete(record._id)} />
        </Space>)
    }

    const onSuccess = (val) => fetchData();
    const onEditRecord = (item) => set_showForm(item)
    const onAddClick = () => set_showForm(true)


    useEffect(() => {
        if (called) return;
        fetchData()
    }, [])

    const columns = [
        { title: 'Basket', dataIndex: 'barcode', render:(txt, record) => (<div>
            {/* <div className="label" style={{ backgroundColor: record.color || "#FFFFFF", color: lightOrDark(record.color) == 'light' ? "#000000" : "#FFFFFF", fontSize: '14px' }}>{record.title}</div> */}
            <h3>{record.title}</h3>
            <Barcode 
                value={`${record.barcode}`} 
                background={record.color || "#FFFFFF"} 
                lineColor={lightOrDark(record.color || "#FFFFFF") == 'light' ? '#000000' : '#FFFFFF'}
                width={1} height={25} 
                displayValue={true}
            />
        </div>)},
        { title: 'In Use', dataIndex: 'record', render:(__, rec) => {
            return (<>
                {rec?.taken_by?.name  && <div>Taken By: {rec?.taken_by?.name}</div>}
                {rec.locked_at && <div>Locked At: {utcToDate(rec.locked_at).format(defaultDateTimeFormat)}</div>}
                {rec.lock_expires_at && <div>Auto unlock at: {utcToDate(rec.lock_expires_at).format(defaultDateTimeFormat)}</div>}
                <ReleaseBasketButton basket={rec} onSuccess={() => fetchData({})} />
            </>)
        } },
        { title: 'Category', dataIndex: 'category', width: 100, align:"center" },
        { title: 'Status', dataIndex: 'status', width: 120, align: "center" },
        { title: 'Actions', dataIndex: '', render: renderActions, className: 'actions-column', align: 'right', width: '100px' },
    ];

    return (<>
        <div style={{ padding:"20px" }}>
            <ListHeader 
                title="Baskets"
                sub={<>Total {(baskets && baskets?.length) || '0'} records found</>}
                right={onAddClick ? <><Button onClick={onAddClick} size="small">Add New Basket</Button></> : false}
            />
            <BasketFilter onSearch={(val)=>{ fetchData(val) }} />

            <Table loading={busy}
                columns={columns}
                dataSource={baskets ? baskets : null}
                pagination={false}
                scroll={{ y: -220 }}
            />
        </div>

        <BasketForm 
            onClose={() => set_showForm(false)} 
            open={showForm !== false} 
            store={store} 
            initialValues={(showForm && showForm._id) ? showForm : undefined}
            onSuccess={onSuccess}
        />
        
    </>)
}
ListComp.propTypes = {
    // prop: PropTypes.type.isRequired
    // onEditRecord: PropTypes.func.isRequired
}

export default ListComp;
