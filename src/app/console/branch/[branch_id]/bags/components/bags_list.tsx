'use client'
import React, { useEffect, useState } from 'react'
import { useLazyQuery, useMutation, useSubscription } from '@apollo/client/react';
import { Tag, Popconfirm, Alert, message, Row, Col, Modal, Space } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { Barcode, Loader, Icon, Button, IconButton, Table, Avatar, ListHeader, DevBlock, DeleteButton } from '@/components';
import { __error } from '@/lib/consoleHelper';
import { catchApolloError, checkApolloRequestErrors, lightOrDark, utcToDate } from '@/lib/utill';
import BagForm from './bag_form';
import { useAppSelector } from '@/rStore/hooks';
import security from '@/lib/security';
import type { RootState } from '@/rStore';


import LIST_DATA from '@/graphql/bags/bags.graphql';
import RECORD_DELETE from '@/graphql/bags/deleteBag.graphql';


const ListComp = ({ store }: { store:any; }) => {
    const session = useAppSelector((state: RootState) => state.session);

    const [get_bags, { called, loading, error, data }] = useLazyQuery(LIST_DATA, { fetchPolicy: "no-cache" });
    const [deleteBag, del_details] = useMutation(RECORD_DELETE, {});
    // const { data, loading } = useSubscription(QUERY_SUBSCRIPTION, { variables: { postID } });

    const [busy, setBusy] = useState(false)
    const [bags, setBags] = useState<any[]>([])
    const [showForm, set_showForm] = useState<any | boolean>(false);

    const handleDelete = async(id:string) => {
        setBusy(true);
        let results = await deleteBag({ variables: { id } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr:any) => rr?.data?.deleteBag }))
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
        let results = await get_bags({ 
            variables: { filter: JSON.stringify(filter) },
            // fetchPolicy: "no-cache"
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr:any) => rr?.data?.bags }))
            .catch(catchApolloError)
        setBusy(false);
        
        // if (!results || results.error) return message.error((results && results?.error?.message) || "no ")
        setBags(results)
    }

    const renderActions = (text:string, record:any) => {
        return (<Space>
            {security.verifyRole('1009.2', session.user.permissions) && <IconButton onClick={() => onEditRecord(record)} icon="pen" />}
            {security.verifyRole('1009.3', session.user.permissions) && <DeleteButton onConfirm={() => handleDelete(record._id)} />}
        </Space>)
    }

    const onSuccess = (val:any) => {
        set_showForm(false)
        fetchData();
    }
    const onEditRecord = (item:any) => set_showForm(item)
    const onAddClick = security.verifyRole('1009.1', session.user.permissions) ? () => set_showForm(true) : false;

    const columns: ColumnsType<any> = [
        { title: 'Size', dataIndex: 'size', render:(txt:string, record:any) => (<div>
            <h3>{record.size}</h3>
        </div>)},
        { title: 'barcode', dataIndex: 'barcode', render:(txt:string, record:any) => (<div>
            <Barcode 
                value={`${record.barcode}`} 
                background={record.color || "#FFFFFF"} 
                lineColor={lightOrDark(record.color || "#FFFFFF") == 'light' ? '#000000' : '#FFFFFF'}
                width={1} height={25} 
                displayValue={true}
            />
        </div>)},
        { title: 'Qty', dataIndex: 'qty', width: 100, align:"center" },
        { title: 'Price', dataIndex: 'price', width: 100, align:"center" },
        { title: 'Status', dataIndex: 'status', width: 120, align: "center", render: (status:string) => (<Tag color={status =='active' ? 'green' : 'red'}>{status}</Tag>) },
        { title: 'Actions', dataIndex: '', render: renderActions, className: 'actions-column', align: 'right', width: 100 },
    ];

    useEffect(() => {
        if (called) return;
        fetchData()
    }, [])

    return (<>
        <div style={{ padding:"20px" }}>
            <ListHeader 
                title="Bags"
                sub={<>Total {(bags && bags?.length) || '0'} records found</>}
                right={onAddClick ? <><Button onClick={onAddClick} size="small">Add New Bag</Button></> : false}
            />

            <Table loading={busy}
                bordered
                columns={columns}
                dataSource={bags}
                pagination={false}
                scroll={{ y: -220 }}
            />
        </div>

        <BagForm 
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
