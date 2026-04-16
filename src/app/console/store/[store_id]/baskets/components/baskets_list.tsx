'use client'
import React, { useEffect, useState } from 'react'
import { useLazyQuery, useMutation, useSubscription } from '@apollo/client/react';
import { Popconfirm, Alert, message, Row, Col, Modal, Space, Tabs } from 'antd';
import { Barcode, Loader, Icon, Button, IconButton, Table, Avatar, ListHeader, DevBlock, DeleteButton } from '@/components';
import { __error } from '@/lib/consoleHelper';
import { catchApolloError, checkApolloRequestErrors, lightOrDark, utcToDate } from '@/lib/utill';
import Link from 'next/link';
import { adminRoot, defaultDateTimeFormat } from '@/configs';
import BasketForm from './basket_form';
import { useAppSelector } from '@/rStore/hooks';
import security from '@/lib/security';
import type { RootState } from '@/rStore';

import LIST_DATA from '@/graphql/baskets/baskets.graphql';
import RECORD_DELETE from '@/graphql/baskets/deleteBasket.graphql';
import RELEASE_BASKET from '@/graphql/baskets/releaseBasket.graphql';

const ReleaseBasketButton = ({ basket, onSuccess }) => {
    const [busy, setBusy] = useState(false)
    const [do_releaseBasket, release_details] = useMutation(RELEASE_BASKET, {});
    
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
    const session = useAppSelector((state: RootState) => state.session);

    const [get_baskets, { called, loading, error, data }] = useLazyQuery(LIST_DATA, { fetchPolicy: "no-cache" });
    const [deleteBasket, del_details] = useMutation(RECORD_DELETE, {});
    // const { data, loading } = useSubscription(QUERY_SUBSCRIPTION, { variables: { postID } });

    const [busy, setBusy] = useState(false)
    const [baskets, setBaskets] = useState(null)
    const [showForm, set_showForm] = useState(false);
    const [activeCategory, setActiveCategory] = useState<'dispatch' | 'pickup'>('dispatch');

    const handleDelete = async(id) => {
        setBusy(true);
        let results = await deleteBasket({ variables: { id } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.deleteBasket }))
            .catch(catchApolloError)

        setBusy(false);

        if (!results || results.error) return message.error((results && results?.error?.message) || "Unable to delete record")
        message.success("Record deleted")
        fetchData({ category: activeCategory });
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
            {security.verifyRole('1005.2', session.user.permissions) && <IconButton onClick={() => onEditRecord(record)} icon="pen" />}
            {security.verifyRole('1005.3', session.user.permissions) && <DeleteButton onConfirm={() => handleDelete(record._id)} />}
        </Space>)
    }

    const onSuccess = (val) => fetchData({ category: activeCategory });
    const onEditRecord = (item) => set_showForm(item)
    const onAddClick = security.verifyRole('1005.1', session.user.permissions) ? () => set_showForm(true) : false;


    useEffect(() => {
        if (called) return;
        fetchData({ category: activeCategory })
    }, [])

    useEffect(() => {
        if (!called) return;
        fetchData({ category: activeCategory })
    }, [activeCategory])

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
            const isLocked = Boolean(rec?.locked_by || rec?.locked_at || rec?.lock_expires_at || rec?._id_order || rec?.status === 'taken');
            const orderPreviewHref = rec?._id_order ? `${adminRoot}/store/${store._id}/orders/preview/${rec._id_order}` : '';
            const lockedByName = rec?.locked_user?.name || rec?.taken_by?.name || '';

            return (<>
                {rec?.taken_by?.name  && <div>Taken By: {rec?.taken_by?.name}</div>}
                {isLocked && rec?.locked_by && <div>Locked By: {lockedByName || rec?.locked_by}</div>}
                {rec.locked_at && <div>Locked At: {utcToDate(rec.locked_at).format(defaultDateTimeFormat)}</div>}
                {rec.lock_expires_at && <div>Auto unlock at: {utcToDate(rec.lock_expires_at).format(defaultDateTimeFormat)}</div>}
                {isLocked && rec?._id_order && (
                    <div>
                        Order ID:{' '}
                        <Link href={orderPreviewHref}>
                            {rec._id_order}
                        </Link>
                    </div>
                )}
                {isLocked && <ReleaseBasketButton basket={rec} onSuccess={() => fetchData({ category: activeCategory })} />}
            </>)
        } },
        { title: 'Category', dataIndex: 'category', width: 120, align:"center" },
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
            <Tabs
                activeKey={activeCategory}
                onChange={(key) => setActiveCategory(key as 'dispatch' | 'pickup')}
                items={[
                    { key: 'dispatch', label: 'Dispatch' },
                    { key: 'pickup', label: 'Pickup' },
                ]}
            />

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
