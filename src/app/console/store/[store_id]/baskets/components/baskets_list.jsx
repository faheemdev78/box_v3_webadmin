import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types';
import { useLazyQuery, useMutation, useSubscription } from '@apollo/client';
import { Popconfirm, Alert, message, Row, Col, Modal } from 'antd';
import { Barcode, Loader, Icon, Button, IconButton, Table, Avatar, ListHeader, DevBlock } from '@/components';
import { __error } from '@_/lib/consoleHelper';
import BasketFilter from './BasketFilter'
import { checkApolloRequestErrors, lightOrDark } from '@_/lib/utill';
import BasketForm from './basket_form';

import LIST_DATA from '@_/graphql/baskets/baskets.graphql';
import RECORD_DELETE from '@_/graphql/baskets/deleteBasket.graphql';
import RELEASE_BASKET from '@_/graphql/baskets/releaseBasket.graphql';

const ReleaseBasketButtonComp = ({ basket, onSuccess }) => {
    const [do_releaseBasket, release_details] = useMutation(RELEASE_BASKET);

    const [busy, setBusy] = useState(false)

    const releaseBasket = async() => {        
        setBusy(true);
        let results = await do_releaseBasket({ variables: { barcode: basket.barcode }, fetchPolicy: "no-cache" })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.releaseBasket }))
            .catch(err => {
                console.log(__error("Request ERROR : "), err);
                return { error: { message:"Request ERROR"}}
            })
        setBusy(false);
            
        if (!results || results.error) return message.error((results && results?.error?.message) || "Invalid Response");
        message.success("Released!")
        if (onSuccess) onSuccess(results)
    }
    
    if (basket?.taken_by?._id || basket.order_id) return <Button loading={busy} onClick={releaseBasket}>Release Basket</Button>
    return null;
     // return <DevBlock obj={basket} />
}
const ReleaseBasketButton = ReleaseBasketButtonComp;


const ListComp = ({ store }) => {
    const [get_baskets, { called, loading, error, data }] = useLazyQuery(LIST_DATA);
    const [deleteBasket, del_details] = useMutation(RECORD_DELETE);
    // const { data, loading } = useSubscription(QUERY_SUBSCRIPTION, { variables: { postID } });

    const [busy, setBusy] = useState(false)
    const [baskets, setBaskets] = useState(null)
    const [showForm, set_showForm] = useState(false);

    const handleDelete = async(id) => {
        setBusy(true);
        let results = await deleteBasket({ variables: { id }, fetchPolicy: "no-cache" })
            .then(e => (e?.data?.deleteBasket))
            .catch(err => {
                console.log(__error("Request ERROR : "), err);
                return { error: { message: "Request ERROR" } }
            })
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
        let results = await get_baskets({ variables: { filter: JSON.stringify(filter) }, fetchPolicy: "no-cache" })
            .then(e => (e?.data?.baskets))
            .catch(err => {
                console.log(__error("Request ERROR : "), err);
                return { error: { message: "Request ERROR" } }
            })
        setBusy(false);
        
        // if (!results || results.error) return message.error((results && results?.error?.message) || "no ")
        setBaskets(results)
    }

    const renderActions = (text, record) => {
        return (
            <span className="action_buttons">
                <IconButton onClick={() => onEditRecord(record)} icon="pen" />
                <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record._id)}>
                    <IconButton icon="trash-alt" />
                </Popconfirm>
                {/* <Button onClick={()=>this.checkStatus(record)}>Check Status</Button> */}
                {/* <CheckBasketStatusButton basket={record} /> */}
            </span>
        )
    }

    const onSuccess = (val) => fetchData();
    const onEditRecord = (item) => set_showForm(item)
    const onAddClick = () => set_showForm(true)


    useEffect(() => {
        if (called) return;
        fetchData()
    }, [])

    const columns = [
        { title: 'Basket', dataIndex: 'barcode', render:(txt, record) => {
            return (<Row><Col style={{marginRight:'5px'}}><div className="basketLab">
                {/* <div className="label" style={{ backgroundColor: record.color || "#FFFFFF", color: record.color ? lightOrDark(record.color) : "#0000FF"}}>{record.title}</div> */}
                <div className="label" style={{ backgroundColor: record.color || "#FFFFFF", color: lightOrDark(record.color)=='light' ? "#000000" : "#FFFFFF", fontSize:'14px'}}>{record.title}</div>
                <div className="barcode">
                    <Barcode value={`${record.barcode}`} width={1} height={25} displayValue={true} />
                </div>
            </div></Col>
            <Col><ReleaseBasketButton basket={record} onSuccess={onSuccess} /></Col>
            {/* <Col><CheckBasketStatusButton basket={record} /></Col> */}
            </Row>)
        } },
        { title: 'Category', dataIndex: 'category' },
        {
            title: 'Actions',
            dataIndex: '',
            render: renderActions,
            className: 'actions-column',
            align: 'right',
            width: '100px'
        },
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
