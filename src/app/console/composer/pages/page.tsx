'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { Alert, Card, Col, message, Modal, Row, Space, Tag } from "antd";
import { adminRoot, defaultPagination, defaultPageSize, defaultDateTimeFormat, defaultDateFormat } from "@/configs";
import { Button, DeleteButton, DevBlock, Table } from "@/components";
import { useLazyQuery, useMutation } from '@apollo/client/react'
import AppPageCreatorForm from "@/modules/composer/appPageCreatorForm";
import { catchApolloError, checkApolloRequestErrors, utcToDate } from "@/lib/utill";
import { __error } from "@/lib/consoleHelper";
import { PageHeader } from "@/template";

import QUERY_DATA from '@/graphql/app_pages/appPagesQuery.graphql'
import DEL_PAGE from '@/graphql/app_pages/deleteAppPage.graphql'

function PagesHome() {
    const [busy, setBusy] = useState(false);
    const [pagination, setPagination] = useState(defaultPagination);
    const [filter, setFilter] = useState({  });
    const [dataArray, set_dataArray] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [showCreateForm, set_showCreateForm] = useState(false)

    const [appPagesQuery, { called, loading, data }] = useLazyQuery<any>(QUERY_DATA, {
        fetchPolicy: 'network-only'
    });

    const [deleteAppPage, del_details] = useMutation<any>(DEL_PAGE); // { data, loading, error }

    useEffect(() => {
        if (called || loading) return;
        fetchData(filter, { page: 0, pageSize: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [called, loading, filter])

    const fetchData = async (__filter = {}, __pagination: { page?: number, pageSize?: number } = {}) => {
        let _filter = { ...__filter, draft:true }
        setBusy(true);
        setFilter(_filter);

        const { page, pageSize } = __pagination;

        let _pagination = {
            ...pagination,
            current: page || 1,
            pageSize: pageSize || defaultPageSize,
            // total
        }

        let results = await appPagesQuery({
            variables: {
                first: _pagination.pageSize,
                after: _pagination.pageSize * (_pagination.current - 1),
                filter: JSON.stringify(_filter || {}),
                others: JSON.stringify({})
            },
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.appPagesQuery }))
            .catch(catchApolloError)

        if (!results || results.error){
            setError((results && results.error.message) || 'Invalid response received!');
        }
        else{
            setPagination({
                ..._pagination,
                total: results?.totalCount || 0,
            })
            set_dataArray(results);
        }

        setBusy(false);
    }

    // const doSearch = (vars) => fetchData(vars, { current: 1, pageSize: pagination.pageSize })

    const onDeletePage = async (_id:string) => {
        setBusy(true)
        let results = await deleteAppPage({ variables: { _id } }).then(r => (r?.data?.deleteAppPage))
        .catch(err=>{
            console.log(__error("Error: "), err)
            return { error:{message:"Unable to delete page!"}}
        })
        setBusy(false)

        if (results && results.error){
            message.error(results.error.message)
            return false
        }

        fetchData(filter, { 
            page: pagination.current,
            pageSize: pagination.pageSize,
        });

        return false;
    }

    const columns: any = [
        { title: "Page Name", dataIndex: 'title', render: (text: string, rec: any) => {
                return (<Row align="middle" gutter={[5, 5]}>
                    <Col><Link href={`./editPage/${rec._id}`} className='a'>{rec.title}</Link></Col>
                    <Col><DeleteButton size="small" onClick={() => onDeletePage(rec._id)} /></Col>
                </Row>)
            }
        },
        { title: 'Description', dataIndex: 'description', align: "left" as const, render:(___:string, rec:any) => {
            return (<>
                <div>{rec.slug.replace(/\/draft$/, "")}</div>
            </>)
        } },
        { title: 'Status', dataIndex: 'published', align: 'center' as const, width: 80, render: (published: boolean) => (<Tag color={published ? 'green' : 'red'}>{published ? "YES" : "NO"}</Tag>) },
        { title: 'Schedule', dataIndex: 'scheduled_from', align: "left" as const, width: 160, render:(___:string, rec:any) => {
            if (!rec.scheduled_from) return null;
            return (<>
                <div><b>From:</b> {utcToDate(rec.scheduled_from).format(defaultDateFormat)}</div>
                <div><b>To:</b> {utcToDate(rec.scheduled_to).format(defaultDateFormat)}</div>
            </>)
        } },
        { title: 'Type', dataIndex: ['page_type', 'title'], align: "left" as const, width: 150 },
        { title: 'Created by', dataIndex: 'created_by', align: "left" as const, width: 180, render: (created_by: string) => utcToDate(created_by).format(defaultDateTimeFormat) },
        { title: 'Last Updated', dataIndex: 'updatedAt', align: "left" as const, width: 180, render: (updatedAt: string) => utcToDate(updatedAt).format(defaultDateTimeFormat)},
    ];


    return (<>
        <PageHeader title="Pages" allowBack={false}>
            <Button onClick={() => set_showCreateForm(true)} color="orange">Create new page</Button>
        </PageHeader>

        {error && <Alert title="Error" description={error} showIcon type="error" />}
        <Table 
            bordered
            columns={columns} 
            loading={busy} 
            dataSource={dataArray && dataArray.edges}
            pagination={{
                ...pagination,
                size: 'default',
                onChange: (page, pageSize) => fetchData(filter, { page, pageSize })
            }}
        />

        {/* <DevBlock obj={dataArray && dataArray.edges} /> */}

        <Modal footer={false} width={"1000px"} open={showCreateForm} onCancel={() => set_showCreateForm(false)} destroyOnHidden>
            <AppPageCreatorForm onClose={() => set_showCreateForm(false)} />
        </Modal>


    </>)
}

export default PagesHome;
