'use client'
import React, { useState, useEffect } from 'react'
import { Button, DevBlock, IconButton, DeleteButton, Loader, Table } from '@/components';
import { Alert, Col, Drawer, message, Row, Space } from 'antd';
import type { ColumnType } from 'antd/es/table';
import security from '@/lib/security';
import { defaultPagination } from '@/configs';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { FieldsDefinationForm } from '@/modules/fieldsDefinations';
import { useAppSelector } from '@/rStore/hooks';
import type { RootState } from '@/rStore';
import { __error } from '@/lib/consoleHelper';
import { PageHeader } from '@/template';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';

import GET_QUERY_RECORDS from '@/graphql/fields_definations/fieldsDefinationsQuery.graphql'
import DELETE_RECORD from '@/graphql/fields_definations/deleteFieldsDefination.graphql'

interface StateType {
    pagination: typeof defaultPagination;
    dataSource: any[] | null;
    filter: any;
    others?: any;
}

function ProductFields() {
    const session = useAppSelector((state: RootState) => state.session);

    const canManage = security.verifyRole('104.8', session.user.permissions); // Manage Product Fields

    const [state, setState] = useState<StateType>({
        pagination: defaultPagination,
        dataSource: null,
        filter: { },
    })
    const [busy, setBusy] = useState(false)
    const [showForm, set_showForm] = useState(false)

    const [fieldsDefinationsQuery, { called, loading }] = useLazyQuery<any>(GET_QUERY_RECORDS, { fetchPolicy: 'cache-and-network' });

    const [deleteFieldsDefination, dell_details] = useMutation<any>(DELETE_RECORD); // { data, loading, error }

    async function fetchData ({ filter, pagination = {} }: { filter?: any; pagination?: any }) {
        const variables = {
            limit: pagination?.pageSize || state.pagination.pageSize,
            page: pagination?.current || state.pagination.current,
            filter: filter || state.filter || {},
            others: state.others || {},
        }

        setBusy(true)
        const resutls = await fieldsDefinationsQuery({
            variables: {
                ...variables,
                filter: JSON.stringify(variables.filter || {}),
                others: JSON.stringify(variables.others || {})
            },
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.fieldsDefinationsQuery }))
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

    const handleTableChange = (pagination: any) => {
        fetchData({
            filter: state.filter,
            pagination: {
                pageSize: pagination.pageSize,
                current: pagination.page,
            }
        })
    };


    async function deleteField(values: any) {}

    function onSuccess(val: any) {
        set_showForm(false)
        fetchData({ filter: state.filter })
    }


    useEffect(() => {
        if (called || loading) return
        fetchData({ filter: state.filter })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [called, loading])


    const columns:ColumnType<any>[] = [
        { title: 'Label', dataIndex: 'label', key: 'label' },
        { title: 'Type', dataIndex: 'type', key: 'type' },
        { title: 'Required', dataIndex: 'required', key: 'required', render: (val: any) => (val ? "YES" : "NO") },
        { title: 'Category', dataIndex: 'category', key: 'category' },
        { title: 'Actions', dataIndex: 'actions', key: 'actions', align: 'right', width: 100,
            render: (text: any, record: any) => {
                return (<Space>
                    <IconButton onClick={() => set_showForm(record)} icon="pen" />
                    <DeleteButton onClick={() => deleteField(record._id)} />
                </Space>)
            },
        },
    ]


    // if (status == 'loading') return <Loader loading={true} />
    if (!session || !session?.user?._id) return <Alert message="Invalid user session" showIcon type='error' />
    if (!canManage) return <Alert message="Acess Denied" showIcon type='error' />



    return (<>
        <PageHeader title="Product Fields">
            <Button onClick={() => set_showForm(true)} color="orange">Add New Field</Button>
        </PageHeader>

        <Table
            loading={loading || busy}
            columns={columns}
            dataSource={state.dataSource || []}
            pagination={state.pagination ? { ...state.pagination, size: undefined } : false}
            rowClassName={(record => (record.status == 'offline' ? 'disabled-table-row' : ""))}
            onChange={({ current, pageSize }) => handleTableChange({page: current, pageSize })}
        />

        <FieldsDefinationForm open={showForm !== false} onClose={() => set_showForm(false)} initialValues={showForm !== true ? showForm : undefined} onSuccess={onSuccess} />


        {/* <Drawer open={showForm !== false} title="Field Defination" onClose={() => set_showForm(false)} footer={false} destroyOnHidden>
            {(showForm !== false) && <FieldDefinationForm initialValues={showForm !== true ? showForm : undefined} onSuccess={onSuccess} />}
        </Drawer> */}

        {/* <DevBlock obj={state.dataSource} title="dataSource" /> */}

    </>
    )
}

export default ProductFields;
