'use client'
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types';
import { useMutation, useLazyQuery } from '@apollo/client';
import { Alert, Breadcrumb, Col, message, Modal, Popconfirm, Row, Space, Switch } from 'antd';
import { Button, DeleteButton, DevBlock, IconButton, Loader, StatusTag, Table, AsyncSwitch } from '@_/components';
import { DeliverySlotForm, DeliverySlotFormZone, SlotFilter } from '@_/modules/delivery_slot';
import { checkApolloRequestErrors, timeStr2Date } from '@_/lib/utill';
import { adminRoot, publishStatus } from '@_/configs';
import { __error } from '@_/lib/consoleHelper';
import Link from 'next/link';
import { Page } from '@_/template/page';
import { PageHeader } from '@_/template';

import LIST_DATA from '@_/graphql/delivery_slots/deliverySlots.graphql'
import RECORD_DELETE from '@_/graphql/delivery_slots/deleteDeliverySlot.graphql';
import ADD_ZONE from '@_/graphql/delivery_slots/addZoneToSlot.graphql';
import EDIT_ZONE from '@_/graphql/delivery_slots/editDeliverySlot.graphql';
import REMOVE_ZONE from '@_/graphql/delivery_slots/removeZoneFromSlot.graphql';

const defaultFilter = {}

export function DeliverySlotManager({ store, zone }) {
    const [dataArray, set_dataArray] = useState(null)
    const [showForm, set_showForm] = useState(false)
    const [filter, setFilter] = useState(defaultFilter)
    const [localFilter, setLocalFilter] = useState({})
    const [showSlotForm, set_showSlotForm] = useState(false)
    const [error, setError] = useState(null)

    const [addZoneToSlot, add_results] = useMutation(ADD_ZONE); // { data, loading, error }
    const [editDeliverySlot, edit_results] = useMutation(EDIT_ZONE); // { data, loading, error }
    const [removeZoneFromSlot, remove_results] = useMutation(REMOVE_ZONE); // { data, loading, error }
    const [deleteDeliverySlot, del_results] = useMutation(RECORD_DELETE); // { data, loading, error }

    const [deliverySlots, { called, loading }] = useLazyQuery(
        LIST_DATA,
        // { variables: { filter: JSON.stringify({}) } }
    );

    useEffect(() => {
        if (called) return;
        fetchData()
    }, [store])

    const fetchData = async (args = {}) => {
        let _filter = { ...filter, "store._id": store._id };
        if (args.filter) _filter = { ...args.filter };
        // if (zone) Object.assign(_filter, { "zones._id": zone._id })

        var results = await deliverySlots({
            variables: { filter: JSON.stringify(_filter) }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.deliverySlots }))
            .catch(err => {
                console.log(__error("Error: "), err)
                return { error: { message: "Invalid response!" } }
            })

        if (results && results.error) {
            setError(results.error.message)
            message.error(results.error.message)
            return false;
        }

        if (zone && zone._id && results){
            results = results.map(o => ({
                ...o,
                zone: o?.zones?.find(oo => (oo._id_zone == zone._id)),
                // zones: undefined
            }))
        }


        set_dataArray(results)
    }
    const onUpdateCallback = () => fetchData()

    const handleDelete = async ({ _id }) => {
        let results = await deleteDeliverySlot(id)
            .then(r => (r?.data?.deleteDeliverySlot))
            .catch(error => {
                console.log(__error("ERROR"), error);
                message.error("Invalid Response!")
            })

        if (!results || results.error) {
            message.error((results && results?.error?.message) || "Unable to delete record")
            return false;
        }

        message.success("Record deleted")
    }

    async function updateSlotAttachment({ _id, add }) {
        var resutls;
        if (!add){
            resutls = await removeZoneFromSlot({ variables: { _id_slot: _id, _id_zone: zone._id } }).then(r => (r?.data?.removeZoneFromSlot))
            .catch(err=>{
                console.log(__error("Error"), err)
                return { error:{message:"Request Error!"}}
            })
        }
        else {
            resutls = await addZoneToSlot({ variables: { _id_slot: _id, _id_zone: zone._id } }).then(r => (r?.data?.addZoneToSlot))
                .catch(err => {
                    console.log(__error("Error"), err)
                    return { error: { message: "Request Error!" } }
                })
        }

        if (!resutls || resutls.error){
            message.error((resutls && resutls?.error?.message) || "Invalid Response")
            return false;
        }

        onUpdateCallback()
        return true
    }

    async function updateStatus(values){
        let resutls = await editDeliverySlot({ variables: { input: { 
            _id: values._id,
            start_time: values.start_time,
            end_time: values.end_time,
            day: values.day,
            store: {
                _id: values.store._id,
                title: values.store.title,
                code: values.store.code
            },
            status: values.status,
        } } }).then(r => (r?.data?.editDeliverySlot))
        .catch(err=>{
            console.log(__error("Error: "), err)
            return {error:{ message: err.message || "Request Error!"}}
        })
        if (!resutls || resutls.error){
            message.error((resutls && resutls?.error?.message) || "Invalid response!")
            return false;
        }
        onUpdateCallback()
        return resutls.status;
    }

    const columns = () => {
        const arr = [
            { 
                title: <div style={{ color: "#999", fontSize: "18px", fontWeight: "bold" }}>Day</div>, 
                dataIndex: 'label', 
                key: 'label', 
                fixed: 'left', 
                width: 200,
                render: (txt, rec) => (<div style={{ color: "#999", fontSize: "18px", fontWeight: "bold" }}>{txt}</div>) },
        ];

        function groupByStartTimeAndEndTime(data) {
            return data.reduce((result, item) => {
                const key = `${item.start_time}-${item.end_time}`; // Combine start_time and end_time as key
                if (!result[key]) {
                    result[key] = []; // Initialize the group if it doesn't exist
                }
                result[key].push(item); // Add the current item to the group
                return result;
            }, {});
        }

        function sortGroupsByTime(groupedData) {
            // Extract keys from the grouped data and sort them
            const sortedKeys = Object.keys(groupedData).sort((a, b) => {
                const [startA, endA] = a.split("-").map(Number); // Split and convert times to numbers
                const [startB, endB] = b.split("-").map(Number);

                // Sort by start_time first, then by end_time if start_time is the same
                return startA - startB || endA - endB;
            });

            // Rebuild the grouped object based on the sorted keys
            const sortedGroupedData = {};
            sortedKeys.forEach((key) => {
                sortedGroupedData[key] = groupedData[key];
            });

            return sortedGroupedData;
        }

        if (dataArray) {
            let groups = sortGroupsByTime(groupByStartTimeAndEndTime(dataArray))

            Object.keys(groups).forEach((group, index) => {

                let gArr = groups[group]
                let start_time = timeStr2Date(gArr[0].start_time)
                let end_time = timeStr2Date(gArr[0].end_time)

                arr.push({
                    width: 200,
                    dataIndex: group, key: group, align: "left",
                    title: <div align="center">
                        <div style={{ fontSize: "16px" }}>{group}</div>
                        <div style={{ fontSize: "12px" }}>({start_time.format("hh:mm A")} ~ {end_time.format("hh:mm A")})</div>
                    </div>,
                    render: (val, rec, rowIndex) => {
                        let day = daysArray[rowIndex]
                        let data = rec?.data?.filter(o => (group == `${o.start_time}-${o.end_time}`))

                        if (!data) return null;

                        return data?.filter(item => {
                            let keys = Object.keys(localFilter)
                            let matched = true;

                            keys.forEach(key => {
                                if (key == "zones._id") {
                                    if (!item?.zones?.find(o => o._id == localFilter[key])) matched = false;
                                }
                                else if (item[key] !== localFilter[key]) matched = false;
                            });

                            return matched;
                        })?.map((item, i) => {
                            // let isInZone = zone && (item.zones.find(o => (o._id_zone == zone._id))) ? true : false;
                            let isInZone = !!(zone && item?.zone?._id_zone == zone._id)

                            return (<div key={i} style={{ opacity: (item.status == 'offline') ? 0.5 : 1 }}>
                                {isInZone && <>
                                    <p>Limit: {item?.zone?.order_limit || "0"}</p>
                                    <p>Orders In Queue: {item.orders_in_queue}</p>
                                </>}
                                <div><Space>
                                    {zone && <> {/* Zone options */} 
                                        {item.status == 'offline' && <StatusTag value={item.status} size={12} />}
                                        {item.status == 'online' && <>
                                            <AsyncSwitch value={isInZone} disabled={item.status=='offline'} onSubmit={(val) => updateSlotAttachment({ _id: item._id, add: val })} />
                                            {isInZone && <IconButton icon="pen" size="small" onClick={() => set_showSlotForm(item)} />}
                                        </>}
                                    </>}
                                    {!zone && <> {/* Store options */} 
                                        <StatusTag size={12} value={item.status} editable onSubmit={(val) => updateStatus({ ...item, ...val })} options={publishStatus} />
                                        <IconButton onClick={() => set_showForm(item)} icon="pen" size="small" />
                                        <DeleteButton onConfirm={() => handleDelete(item)} size="small" />
                                    </>}
                                </Space></div>
                            </div>)
                        })

                    }
                })

            });

        }

        return arr;
    }

    const daysArray = [
        { label: "Sat", data: dataArray && dataArray.filter(o => o.day == 'sat') },
        { label: "Sun", data: dataArray && dataArray.filter(o => o.day == 'sun') },
        { label: "Mon", data: dataArray && dataArray.filter(o => o.day == 'mon') },
        { label: "Tue", data: dataArray && dataArray.filter(o => o.day == 'tue') },
        { label: "Wed", data: dataArray && dataArray.filter(o => o.day == 'wed') },
        { label: "Thu", data: dataArray && dataArray.filter(o => o.day == 'thu') },
        { label: "Fri", data: dataArray && dataArray.filter(o => o.day == 'fri') },
    ]

    return (<>
        <PageHeader title={`Delivery Slots`}
            sub={<Breadcrumb
                items={[
                    { title: <Link href={`${adminRoot}/store/${store._id}`}>{store.title}</Link> },
                    { title: zone && <Link href={`${adminRoot}/store/${store._id}/zone/${zone._id}`}>{zone.title}</Link> },
                    { title: "Delivery Slots" },
                ]}
            />}
        >
            <Button onClick={() => set_showForm({ show: true })} color="orange">Add New Slot</Button>
        </PageHeader>

        <Page>
            {error && <Alert message={error} type="error" showIcon />}

            <Table
                title={zone ? false : () => (<SlotFilter onSubmit={setLocalFilter} />)}
                bordered
                loading={loading}
                columns={columns()}
                dataSource={daysArray}
                pagination={false}
                scroll={{ x: 'max-content' }}
            />
        </Page>


        {/* {set_showSlotForm} */}
        <Modal footer={false} open={showSlotForm !== false} onCancel={() => set_showSlotForm(false)} title="Update Zone Slot" destroyOnHidden>
            {(showSlotForm !== false) && <div>
                <DeliverySlotFormZone initialValues={showSlotForm} zone={zone} onSuccess={(v) => {
                    set_showSlotForm(false)
                    onUpdateCallback()
                }} />
            </div>}
        </Modal>

        <DeliverySlotForm
            onClose={() => set_showForm(false)}
            open={showForm !== false}
            initialValues={showForm !== true && showForm}
            store={store}
            onSuccess={onUpdateCallback}
        />

    </>)

}
DeliverySlotManager.propTypes = {
    store: PropTypes.object.isRequired,
    zone: PropTypes.object,
}


