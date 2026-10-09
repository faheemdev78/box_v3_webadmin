'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Col, message, Modal, Row, Space, Tabs, Tag, Card } from "antd";
import { Form as FinalForm } from 'react-final-form';
import { defaultPagination, defaultPageSize, defaultDateTimeFormat, defaultDateFormat } from "@/configs";
import { Button, DeleteButton, Icon, Table } from "@/components";
import { FormField, submitHandler } from '@/components/form';
import { BrandsDD, ProdCatsDD } from '@/components/dropdowns';
import { useLazyQuery, useMutation } from '@apollo/client/react'
import AppPageCreatorForm from "@/modules/composer/appPageCreatorForm";
import { catchApolloError, checkApolloRequestErrors, utcToDate } from "@/lib/utill";
import { __error } from "@/lib/consoleHelper";
import { PageHeader } from "@/template";
import { Page } from '@/template/page';

import QUERY_DATA from '@/graphql/app_pages/appPagesQuery.graphql'
import DEL_PAGE from '@/graphql/app_pages/deleteAppPage.graphql'

type ListWindow = 'active' | 'expired';

const PAGE_STATUS_OPTIONS = [
    { label: 'Published', value: 'published' },
    { label: 'Unpublished', value: 'unpublished' },
];

function buildPagesListFilter(values: any, listWindow: ListWindow) {
    const filter: Record<string, any> = { draft: true, list_window: listWindow };
    const keywords = String(values?.search?.keywords || '').trim();
    if (keywords) filter.search = { keywords };

    if (values?.published === 'published') filter.published = true;
    else if (values?.published === 'unpublished') filter.published = false;

    // Brand and category are mutually exclusive. A selected brand wins if both are present.
    if (values?.brand) {
        filter['page_type.type'] = 'brand_page';
        filter['page_type.page_source._id'] = values.brand;
    } else if (values?.category) {
        filter['page_type.type'] = 'category_page';
        filter['page_type.page_source._id'] = values.category;
    }

    return filter;
}

function PagesFilter({ loading, onApply }: { loading: boolean; onApply: (values: any) => void }) {
    return (
        <FinalForm onSubmit={(values) => { onApply(values); return false; }} initialValues={{}}
            render={(formargs) => {
                const { form } = formargs;

                const applyExclusive = (field: 'brand' | 'category', val: any) => {
                    const selected = val || undefined;
                    const nextValues = { ...form.getState().values, [field]: selected };
                    if (selected) {
                        const other = field === 'brand' ? 'category' : 'brand';
                        form.change(other, undefined);
                        nextValues[other] = undefined;
                    }
                    onApply(nextValues);
                };

                return (
                    <form {...submitHandler(formargs)}>
                        <Space align="end" wrap size={12} style={{ marginBottom: 8 }}>
                            <div style={{ width: 220 }}>
                                <FormField
                                    type="text"
                                    name="search.keywords"
                                    label="Page title"
                                    placeholder="Search title"
                                    compact
                                    allowClear
                                    onChange={(e: any) => {
                                        const text = e?.target?.value ?? '';
                                        if (String(text).trim()) return;
                                        onApply({ ...form.getState().values, search: { keywords: '' } });
                                    }}
                                />
                            </div>
                            <div style={{ width: 200 }}><BrandsDD
                                    name="brand"
                                    label="Brand"
                                    placeholder="Brand"
                                    compact
                                    allowClear
                                    preload
                                    size="small"
                                    filter={{}}
                                    onChange={(val: any) => applyExclusive('brand', val)}
                                />
                            </div>
                            <div style={{ width: 200 }}><ProdCatsDD
                                    name="category"
                                    label="Category"
                                    placeholder="Category"
                                    compact
                                    allowClear
                                    preload
                                    size="small"
                                    onChange={(val: any) => applyExclusive('category', val)}
                                />
                            </div>
                            <div style={{ width: 150 }}>
                                <FormField
                                    type="select"
                                    name="published"
                                    label="Status"
                                    placeholder="Status"
                                    options={PAGE_STATUS_OPTIONS}
                                    compact
                                    allowClear
                                    size="small"
                                    onChange={(val: any) => onApply({ ...form.getState().values, published: val || undefined })}
                                />
                            </div>
                            <div style={{ paddingLeft: 16, borderLeft: "1px solid #DDD" }}>
                                <Button className="send_button" loading={loading} htmlType="submit"><Icon icon="search" /></Button>
                            </div>
                        </Space>
                    </form>
                );
            }}
        />
    );
}

function PagesHome() {
    const [busy, setBusy] = useState(false);
    const [pagination, setPagination] = useState(defaultPagination);
    const [filter, setFilter] = useState<Record<string, any>>({ draft: true, list_window: 'active' });
    const [listWindow, setListWindow] = useState<ListWindow>('active');
    const [dataArray, set_dataArray] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [showCreateForm, set_showCreateForm] = useState(false)

    const [appPagesQuery, { called, loading }] = useLazyQuery<any>(QUERY_DATA, {
        fetchPolicy: 'network-only'
    });

    const [deleteAppPage] = useMutation<any>(DEL_PAGE);

    const fetchData = async (nextFilter: Record<string, any> = {}, nextPagination: { page?: number, pageSize?: number } = {}) => {
        const pageSize = nextPagination.pageSize || defaultPageSize;
        const page = nextPagination.page || 1;

        setBusy(true);
        setFilter(nextFilter);

        let results = await appPagesQuery({
            variables: {
                limit: pageSize,
                page,
                filter: JSON.stringify(nextFilter || {}),
                others: JSON.stringify({})
            },
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.appPagesQuery }))
            .catch(catchApolloError)

        if (!results || results.error){
            setError((results && results.error.message) || 'Invalid response received!');
        }
        else{
            setError(null);
            setPagination({
                ...pagination,
                current: results?.pagination?.page || page,
                pageSize: results?.pagination?.limit || pageSize,
                total: results?.pagination?.totalDocs || 0,
            })
            set_dataArray(results);
        }

        setBusy(false);
    }

    const onApplyFilter = (values: any) => {
        fetchData(buildPagesListFilter(values, listWindow), { page: 1, pageSize: pagination.pageSize });
    }

    const onTabChange = (key: string) => {
        const nextWindow: ListWindow = key === 'expired' ? 'expired' : 'active';
        setListWindow(nextWindow);
        fetchData({ ...filter, list_window: nextWindow }, { page: 1, pageSize: pagination.pageSize });
    }

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

    useEffect(() => {
        if (called || loading) return;
        fetchData({ draft: true, list_window: 'active' }, { page: 1, pageSize: defaultPageSize });
    }, [called, loading])


    return (<>
        <PageHeader title="Pages" allowBack={false}>
            <Button onClick={() => set_showCreateForm(true)} color="orange">Create new page</Button>
        </PageHeader>


        <Page>
            <Card styles={{
                body:{
                    padding:'10px'
                }
            }}>
                <PagesFilter loading={busy} onApply={onApplyFilter} />
            </Card>

            <Row>
                <Col flex="auto" />
                <Col>
                    <Tabs
                        activeKey={listWindow}
                        onChange={onTabChange}
                        items={[
                            { key: 'active', label: 'Active' },
                            { key: 'expired', label: 'Expired' },
                        ]}
                    />
                </Col>
                <Col flex="auto" />
            </Row>


            {error && <Alert title="Error" description={error} showIcon type="error" />}
            <Table 
                bordered
                columns={columns} 
                loading={busy} 
                dataSource={dataArray && dataArray.edges}
                pagination={{
                    ...pagination,
                    size: 'middle',
                    onChange: (page, pageSize) => fetchData(filter, { page, pageSize })
                }}
            />

        </Page>


        <Modal footer={false} width={"1000px"} open={showCreateForm} onCancel={() => set_showCreateForm(false)} destroyOnHidden>
            <AppPageCreatorForm onClose={() => set_showCreateForm(false)} />
        </Modal>


    </>)
}

export default PagesHome;
