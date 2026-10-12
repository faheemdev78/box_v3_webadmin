'use client'

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Alert, Col, message, Modal, Row, Space, Tabs, Tag, Card, Radio } from "antd";
import { Form as FinalForm } from 'react-final-form';
import { defaultPagination, defaultPageSize, defaultDateTimeFormat } from "@/configs";
import { instantMs, pageScheduleStatus } from "./scheduleStatus";
import { Button, DeleteButton, Icon, Table } from "@/components";
import { FormField, submitHandler } from '@/components/form';
import { BrandsDD, ProdCatsDD, ManufacturersDD } from '@/components/dropdowns';
import { useLazyQuery, useMutation } from '@apollo/client/react'
import { pageTypeArray } from "@/modules/composer/pageTypeSelection";
import AppPageCreatorForm from "@/modules/composer/appPageCreatorForm";
import { catchApolloError, checkApolloRequestErrors, utcToDate } from "@/lib/utill";
import { __error } from "@/lib/consoleHelper";
import { PageHeader } from "@/template";
import { Page } from '@/template/page';

import QUERY_DATA from '@/graphql/app_pages/appPagesQuery.graphql'
import DEL_PAGE from '@/graphql/app_pages/deleteAppPage.graphql'

type ListWindow = 'active' | 'expired';

const PAGE_TYPE_TABS = [
    { key: 'default_page', label: 'Default Page' },
    ...pageTypeArray.filter(item => !item.disabled).map(item => ({ key: item.type, label: item.title })),
];

const PAGE_STATUS_OPTIONS = [
    { label: 'Published', value: 'published' },
    { label: 'Unpublished', value: 'unpublished' },
];

const ACTIVE_STATUS_LABEL = {
    scheduled: { color: 'blue', label: 'Scheduled' },
    active: { color: 'green', label: 'Active' },
    expired: { color: 'red', label: 'Expired' },
};

// moment() treats a plain object as "now", which would paint a fake schedule time.
function scheduleMoment(value: any) {
    if (!hasScheduleValue(value)) return null;
    const direct = instantMs(value);
    if (direct != null) return utcToDate(direct);
    const parsed = typeof value === 'string' ? utcToDate(value) : null;
    return parsed?.isValid?.() ? parsed : null;
}

function hasScheduleValue(value: any) {
    if (value == null || value === '') return false;
    if (value instanceof Date || typeof value === 'number' || typeof value === 'string') return true;
    if (typeof value === 'object') {
        if (value.$date != null || value._isAMomentObject || value.$isDayjsObject || value.$d instanceof Date) return true;
        if (typeof value.valueOf === 'function' && value.valueOf() !== value) return true;
    }
    return false;
}

function buildPagesListFilter(values: any, listWindow: ListWindow, pageType: string) {
    const filter: Record<string, any> = { draft: true, list_window: listWindow, 'page_type.type': pageType };
    const keywords = String(values?.search?.keywords || '').trim();
    if (keywords) filter.search = { keywords };

    if (values?.published === 'published') filter.published = true;
    else if (values?.published === 'unpublished') filter.published = false;

    const sourceField = ({ brand_page: 'brand', manufacturer_page: 'manufacturer', store_page: 'category', category_page: 'category' } as Record<string, string>)[pageType];
    if (sourceField && values?.[sourceField]) {
        filter['page_type.page_source._id'] = values[sourceField];
    }

    return filter;
}

function PagesFilter({ loading, onApply, pageType, initialValues }: { loading: boolean; onApply: (values: any) => void; pageType: string; initialValues: any }) {
    return (
        <FinalForm onSubmit={(values) => { onApply(values); }} initialValues={initialValues}
            render={(formargs) => {
                const { form } = formargs;

                const applyExclusive = (field: 'brand' | 'category' | 'manufacturer', val: any) => {
                    const selected = val || undefined;
                    const nextValues = { ...form.getState().values, [field]: selected };
                    if (selected) {
                        for (const other of ['brand', 'category', 'manufacturer']) {
                            if (other === field) continue;
                            form.change(other, undefined);
                            nextValues[other] = undefined;
                        }
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
                            {pageType === 'brand_page' && <div style={{ width: 200 }}><BrandsDD
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
                            </div>}
                            {['category_page', 'store_page'].includes(pageType) && <div style={{ width: 200 }}><ProdCatsDD
                                    name="category"
                                    label="Category"
                                    placeholder="Category"
                                    compact
                                    allowClear
                                    preload
                                    size="small"
                                    onChange={(val: any) => applyExclusive('category', val)}
                                />
                            </div>}
                            {pageType === 'manufacturer_page' && <div style={{ width: 200 }}><ManufacturersDD
                                    name="manufacturer"
                                    label="Manufacturer"
                                    placeholder="Manufacturer"
                                    compact
                                    allowClear
                                    preload
                                    size="small"
                                    onChange={(val: any) => applyExclusive('manufacturer', val)}
                                />
                            </div>}
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
    const latestRequest = useRef(0);
    const [busy, setBusy] = useState(false);
    const [pagination, setPagination] = useState(defaultPagination);
    const [filter, setFilter] = useState<Record<string, any>>(buildPagesListFilter({}, 'active', 'default_page'));
    const [pageType, setPageType] = useState('default_page');
    const [filterValues, setFilterValues] = useState<Record<string, any>>({});
    const [listWindow, setListWindow] = useState<ListWindow>('active');
    const [dataArray, set_dataArray] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [showCreateForm, set_showCreateForm] = useState(false)

    const [appPagesQuery, { called, loading }] = useLazyQuery<any>(QUERY_DATA, {
        fetchPolicy: 'network-only'
    });

    const [deleteAppPage] = useMutation<any>(DEL_PAGE);

    const fetchData = async (nextFilter: Record<string, any> = {}, nextPagination: { page?: number, pageSize?: number } = {}) => {
        const requestId = ++latestRequest.current;
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

        if (requestId !== latestRequest.current) return;
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
        setFilterValues(values);
        fetchData(buildPagesListFilter(values, listWindow, pageType), { page: 1, pageSize: pagination.pageSize });
    }

    const onTabChange = (nextType: string) => {
        setPageType(nextType);
        const nextValues = { ...filterValues, brand: undefined, manufacturer: undefined, category: undefined };
        setFilterValues(nextValues);
        fetchData(buildPagesListFilter(nextValues, listWindow, nextType), { page: 1, pageSize: pagination.pageSize });
    }

    const onWindowChange = (nextWindow: ListWindow) => {
        setListWindow(nextWindow);
        fetchData(buildPagesListFilter(filterValues, nextWindow, pageType), { page: 1, pageSize: pagination.pageSize });
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
            return (<>
                <Link href={`./editPage/${rec._id}`} className='a'>{rec.title}</Link>
            </>)
            }
        },
        { title: "", dataIndex: 'actions', render: (text: string, rec: any) => {
            const locked = rec?.deleteable === false || rec?.page_type?.type === 'default_page';
            return (<>
                {locked
                    ? <Tag color="blue">Default</Tag>
                    : <DeleteButton size="small" onClick={() => onDeletePage(rec._id)} />}
            </>)
            }
        },
        { title: 'Description', dataIndex: 'description', align: "left" as const, render:(___:string, rec:any) => {
            return (<>
                <div>{rec.slug.replace(/\/draft$/, "")}</div>
            </>)
        } },
        { title: 'Status', dataIndex: 'published', align: 'center' as const, width: 170, render: (published: boolean) => (<Tag color={published ? 'green' : 'red'}>{published ? "Published" : "Unpublished changes"}</Tag>) },
        { title: 'Schedule', dataIndex: 'scheduled_from', align: "left" as const, width: 230, render:(___:string, rec:any) => {
            const from = scheduleMoment(rec?.scheduled_from);
            const to = scheduleMoment(rec?.scheduled_to);
            const status = pageScheduleStatus(from?.valueOf?.() ?? null, to?.valueOf?.() ?? null);
            const shown = status === 'active' || status === 'scheduled' || status === 'expired'
                ? ACTIVE_STATUS_LABEL[status]
                : null;
            if (!shown && !from && !to) return null;
            return (<>
                {shown ? <div style={{ marginBottom: 4 }}><Tag color={shown.color}>{shown.label}</Tag></div> : null}
                {from ? <div><b>From:</b> {from.format(defaultDateTimeFormat)}</div> : null}
                {to ? <div><b>To:</b> {to.format(defaultDateTimeFormat)}</div> : null}
            </>)
        } },
        { title: 'Type', dataIndex: ['page_type', 'title'], align: "left" as const, width: 150 },
        { title: 'Last Updated', dataIndex: 'updatedAt', align: "left" as const, width: 180, render: (updatedAt: string) => utcToDate(updatedAt).format(defaultDateTimeFormat)},
    ];

    useEffect(() => {
        if (called || loading) return;
        fetchData(buildPagesListFilter({}, 'active', 'default_page'), { page: 1, pageSize: defaultPageSize });
    }, [called, loading])


    return (<>
        <PageHeader title="Pages" allowBack={false}>
            <Button onClick={() => set_showCreateForm(true)} color="orange">Create new page</Button>
        </PageHeader>


        <Page>
            {/* <Card styles={{
                body:{
                    padding:'10px'
                }
            }}>
                <PagesFilter key={pageType} loading={busy} onApply={onApplyFilter} pageType={pageType} initialValues={filterValues} />
            </Card> */}

            <Tabs
                activeKey={pageType}
                onChange={onTabChange}
                items={PAGE_TYPE_TABS}
                tabBarExtraContent={{ right: (
                    <Radio.Group
                        value={listWindow}
                        onChange={event => onWindowChange(event.target.value)}
                        optionType="button"
                        buttonStyle="solid"
                        options={[
                            { label: 'Active', value: 'active' },
                            { label: 'Expired', value: 'expired' },
                        ]}
                        style={{ marginLeft: 16 }}
                    />
                ) }}
            />


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
