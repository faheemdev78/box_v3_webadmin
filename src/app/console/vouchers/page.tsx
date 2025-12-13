'use client'

import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { Card, Col, message, Popconfirm, Row, Space } from 'antd';
import { adminRoot, defaultDateTimeFormat, defaultPageSize, defaultPagination } from '@_/configs';
import Link from 'next/link';
import { Button, IconButton, PageHeading, Table } from '@_/components';
import { Page } from '@_/template/page';
import { PageBar, PageHeader } from '@_/template';
import { catchApolloError, checkApolloRequestErrors } from '@_/lib/utill_apollo';
import { __error } from '@_/lib/consoleHelper';

import LIST_DATA from '@_/graphql/vouchers/vouchersQuery.graphql'
import RECORD_DELETE from '@_/graphql/vouchers/deleteVoucher.graphql';
import { utcToDate } from '@_/lib/utill';
import { ColumnsType } from 'antd/es/table';

const defaultFilter = { status: 'online' }


function Vouchers(props:any) {
    const [state, setState] = useState({
        pagination: defaultPagination,
        pageView: "list",
        dataSource: null,
        filter: { ...defaultFilter },
        others: {},
    })

    const [dataArray, set_dataArray] = useState(null)
    const [busy, setBusy] = useState(false)

    const [deleteVoucher, del_results] = useMutation<any>(RECORD_DELETE); // { data, loading, error }
    const [vouchersQuery, { called, loading }] = useLazyQuery<any>(LIST_DATA, { fetchPolicy: 'network-only' });

    useEffect(() => {
        if (called) return;
        fetchData({ filter: state.filter })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props])

    const fetchData = async ({ filter, pagination = {} }: { filter: any; pagination?: { pageSize?: number; current?: number } }) => {
        const variables = {
            limit: pagination?.pageSize || state.pagination.pageSize,
            page: pagination?.current || state.pagination.current,
            filter: filter || state.filter || {},
            others: state.others || {},
        }

        setBusy(true)
        const resutls = await vouchersQuery({
            variables: {
                ...variables,
                filter: JSON.stringify(variables.filter || {}),
                others: JSON.stringify(variables.others || {})
            }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.vouchersQuery }))
            .catch(catchApolloError)
        setBusy(false)

        if (resutls && resutls.error) {
            message.error(resutls.error.message);
            return;
        }

        setState({
            ...state,
            pagination: {
                ...state.pagination,
                current: resutls.pagination.page,
                total: resutls.pagination.totalDocs,
                // resutls.pagination.totalPages,
                pageSize: resutls.pagination.limit,
            },
            filter: variables.filter,
            dataSource: resutls?.edges?.map((o: any) => ({
                ...o,
                children: o?.variations?.length > 0 && o.variations,
                variations: undefined
            })),
        })

    }

    const handleTableChange = (pagination: { current?: number; pageSize?: number }) => {
        fetchData({
            filter: state.filter,
            pagination: {
                pageSize: pagination.pageSize || state.pagination.pageSize,
                current: pagination.current || state.pagination.current,
            }
        })
    };


    const handleDelete = async ({ _id }: { _id: string }) => {
        let results = await deleteVoucher({ variables: { _id }})
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.deleteVoucher }))
            .catch(catchApolloError)

        if (!results || results.error) {
            message.error((results && results?.error?.message) || "Unable to delete record")
            return false;
        }

        message.success("Record deleted")
    }

    const columns: ColumnsType<any> = [
        { title: 'Title', dataIndex: 'title', key: 'title',
            render: (title: string, rec: any) => {
                return <Link href={`${adminRoot}/vouchers/details/${rec._id}`}>{title}</Link>
            }
        },
        { title: 'Type', dataIndex: 'type', key: 'type', width: 150, align: 'center' as const },
        { title: 'Schedule', dataIndex: 'startDate', key: 'startDate', width: 230, align: 'left' as const, render: (___:string, rec:any) => {
            return (<>
                <div><b>From: </b>{utcToDate(rec.startDate).format(defaultDateTimeFormat)}</div>
                <div><b>To: </b>{utcToDate(rec.endDate).format(defaultDateTimeFormat)}</div>
            </>)
        } },
        { title: 'Used Count', dataIndex: 'usedCount', key: 'usedCount', width: 100, align: 'center' as const },
        { title: 'Status', dataIndex: 'status', key: 'status', width: 100, align: 'center' as const },
        {
            title: 'Actions', dataIndex: 'actions', width: 120, key: 'actions', align: 'right',
            render: (_text: string, rec: any) => {
                return (<Space>
                    {/* <IconButton onClick={() => set_showForm({ show: true, fields: rec })} icon="pen" /> */}
                    <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(rec)}>
                        <IconButton onClick={()=>void(0)} icon="trash-alt" />
                    </Popconfirm>
                </Space>)
            }
        },
    ];
    

    return (<>
        <PageHeader title={"Discount Vouchers"} sub={<div>{(state?.pagination?.total) || 0} records found</div>}>
            <Link href={`${adminRoot}/vouchers/new`} >Add New Voucher</Link>
        </PageHeader>
    
        <Page>
            <Table
                bordered
                loading={loading || busy}
                columns={columns}
                dataSource={state.dataSource || []}
                pagination={state.pagination ? { ...state.pagination, size: undefined } : false}
                rowClassName={((record:any) => {
                    return record.status == 'offline' ? 'disabled-table-row' : "";
                })}
                onChange={({ current, pageSize }) => handleTableChange({ current, pageSize })}
            />
        </Page>

    </>)

}

export default Vouchers

// export async function generateMetadata(_, parent) {
//     const headersList = headers();
//     const store_id = headersList.get('x-store-id');
//     return { title: `Store ${store_id}` };
// }
