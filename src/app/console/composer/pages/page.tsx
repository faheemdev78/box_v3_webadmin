'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { Alert, Card, Col, message, Modal, Row, Space, Tag } from "antd";
import { adminRoot, defaultPagination, defaultPageSize, defaultDateTimeFormat } from "@_/configs";
import { Button, DeleteButton, DevBlock, Table } from "@_/components";
import { useLazyQuery, useMutation } from '@apollo/client';
import AppPageCreatorForm from "@_/modules/composer/appPageCreatorForm";
import { utcToDate } from "@_/lib/utill";
import { __error } from "@_/lib/consoleHelper";
import { PageHeader } from "@_/template";

import QUERY_DATA from '@_/graphql/app_pages/appPagesQuery.graphql'
import DEL_PAGE from '@_/graphql/app_pages/deleteAppPage.graphql'

function PagesHome(props) {
    const [busy, setBusy] = useState(false);
    const [pagination, setPagination] = useState(defaultPagination);
    const [filter, setFilter] = useState({  });
    const [dataArray, set_dataArray] = useState(null)
    const [error, setError] = useState(null)
    const [showCreateForm, set_showCreateForm] = useState(false)

    const [appPagesQuery, { called, loading, data }] = useLazyQuery(
        QUERY_DATA,
        // { variables: { ...pagination, filter: JSON.stringify(filter) } }
        { variables: { first: defaultPageSize, after: 0, filter: JSON.stringify({}), others: JSON.stringify({}) }, }
    );

    const [deleteAppPage, del_details] = useMutation(DEL_PAGE); // { data, loading, error }

    useEffect(() => {
        if (called || loading) return;
        fetchData(filter);
    }, [called, loading])

    const fetchData = async (__filter={}, __pagination) => {
        let _filter = { ...__filter, draft:true }
        setBusy(true);
        setFilter(_filter);

        const { page, pageSize } = __pagination || {};

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
        }).then(r => (r?.data?.appPagesQuery));

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

    const onDeletePage = async (_id) => {
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

    const columns = [
        {
            title: "Page Title", dataIndex: 'title',
            render: (text, rec) => {
                return (<Row align="middle" gutter={[5]}>
                    <Col><Link href={`./editPage/${rec._id}`} className='a'>{rec.title}</Link></Col>
                    <Col><DeleteButton size="small" onClick={() => onDeletePage(rec._id)} /></Col>
                </Row>)
            }
        },
        { title: 'Slug', dataIndex: 'slug', align: "left", render: (txt, rec) => (txt.replace(/\/draft$/, "")) },
        // { title: 'Created', dataIndex: 'createdAt', align: "left", render: (txt, rec) => (utcToDate(txt).format(defaultDateTimeFormat)), width: 120, align:'center' },
        // { title: 'Updated', dataIndex: 'updatedAt', align: "left", render: (txt, rec) => (utcToDate(txt).format(defaultDateTimeFormat)), width: 120, align: 'center' },
        // { title: "Status", dataIndex: 'status', align: "center", width: 100, render: (text, rec) => (<Tag color={text == 'enabled' ? "green" : "red"}>{text}</Tag>) },
    ];


    return (<>
        <PageHeader title="Pages">
            <Button onClick={() => set_showCreateForm(true)} color="orange">Create new page</Button>
        </PageHeader>

        {error && <Alert message={error} showIcon type="error" />}
        <Table columns={columns} loading={busy} bordered
            dataSource={dataArray && dataArray.edges}
            pagination={{
                ...pagination,
                onChange: (page, pageSize) => fetchData(filter, { page, pageSize })
            }}
        />

        <Modal title="Create New Page" footer={false} width={"1000px"} open={showCreateForm} onCancel={() => set_showCreateForm(false)}>
            <AppPageCreatorForm onClose={() => set_showCreateForm(false)} />
        </Modal>


    </>)
}

export default PagesHome;
