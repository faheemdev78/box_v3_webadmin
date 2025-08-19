'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button, DeleteButton, DevBlock, Icon, IconButton, Loader, Portal } from '@_/components';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays'
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton } from '@_/components/form';
import { useMutation, useLazyQuery } from '@apollo/client';
import _ from 'lodash'
import { __error, __yellow } from '@_/lib/consoleHelper';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import { useDrop, useDrag } from 'ahooks';
import { checkApolloRequestErrors, dateToUtc, parseJson, sleep, timestamp, uploadFile, utcToDate, utcToDateField } from "@_/lib/utill";
import { Alert, Row, Col, Space, Card, message, Dropdown, Modal } from 'antd';
import { PageTypeSelection, PageSettings, SideMenu, PropsWindow } from '@_/modules/composer';
import { components } from '@_/modules/composer/components';
import { useRouter, useParams } from 'next/navigation';
import { adminRoot, defaultPageSize, defaultTZ } from '@_/configs';
import styles from '@_/modules/composer/Composer.module.scss';
import { parseStylesInput } from '@_/modules/composer/lib';
import AppPageEditForm from '@_/modules/composer/appPageEditForm';

import FETCH_MODULES from '@_/graphql/app_pages_modules/appPagesModulesQuery.graphql'
import FETCH_DATA from '@_/graphql/app_pages/appPage.graphql'
import SAVE_ROWS from '@_/graphql/app_pages_modules/saveAppPagesModules.graphql'
import DELETE_ROW from '@_/graphql/app_pages_modules/deleteAppPagesModules.graphql'
import PUBLISH_PAGE from '@_/graphql/app_pages/publishAppPage.graphql'


const ItemRender = ({ item, item: { data, value, name } }) => {
    let found = components.find(o => o.type == data?.type)
    if (!found) return <Alert type="error" message={`Invalid field (${data?.type})`} />

    return found.renderer({ item })
}

const RowRender = ({ item }) => {
    if (!item.data) return <div style={{ border: "1px dashed blue", padding: "10px", margin: "10px" }}>Empty</div>;

    return (<div className={styles.data_item}>
        <ItemRender item={item} />
    </div>)
}

const DataRow = ({ thisNode, row_id, onItemDrop }) => {
    const [isHovering, setIsHovering] = useState(false);
    const dropRef = useRef(null);

    useDrop(dropRef, {
        onDom: (dropItem, e) => {
            // alert(`custom: ${dropItem.label} dropped into zone ${row_id}`);
            onItemDrop({ item: dropItem, zone: row_id, id: thisNode.id })
        },
        onDragOver: () => setIsHovering(true),
        // onDragEnter: () => setIsHovering(true),
        onDragLeave: () => setIsHovering(false),
        onDrop: () => setIsHovering(false),
    });

    // if (thisNode.styles) console.log("thisNode: ", thisNode)

    return (<div ref={dropRef}>
        <div style={{ backgroundColor: `${isHovering ? 'rgba(0, 0, 255, 0.1)' : 'transparent'}` }}>
            <RowRender item={thisNode} />
            {/* {children} */}
        </div>
    </div>)
}

const AddRowButton = ({ fields }) => {
    return (<div style={{ padding: "20px" }} align="center"><Button onClick={() => {
        fields.push({ id: timestamp(), val: fields.length })
    }}>Add Row</Button></div>)
}

// Sortable Field Component
const SortableField = ({ id, name, remove, index, children, onClick, onEdit, onRemove, selected }) => {
    const [busy, setBusy] = useState(false)
    // const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: id });
    const args = useSortable({ id: id });
    const { active, attributes, listeners, setNodeRef, transform, transition } = args;

    const onRemoveClick = async() => {
        setBusy(true)
        await onRemove()
        setBusy(false)
    }

    const style = {
        // display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        transform: CSS.Transform.toString(transform), //transition,
        // border: "5px solid red",
    };
    // if (active && active.id == id) Object.assign(style, { height:"50px !important", overflow:"hidden", display:"block" })
    if (active) console.log("active: ", active)

    let className = `${styles.data_row}`
    if (selected) className += ` ${styles.selected}`

    return (<Loader loading={busy}>
        <div className={className} ref={setNodeRef} style={style}>
            <div onClick={onClick}>{children}</div>

            <div className={styles.data_row_menu}>
                <Space>
                    {/* <IconButton onClick={onEdit} size="small" icon="pen" shape="circle" /> */}
                    <DeleteButton onClick={onRemoveClick} loading={busy} disabled={!onRemove} size="small" />
                    <span />
                </Space>
                {/* <Row gutter={[10, 10]} className='nowrap'>
                    <Col><Button size="small" onClick={onEdit}>Edit</Button></Col>
                    <Col><Button disabled={!onRemove} size="small" onClick={onRemove}>Delete</Button></Col>
                </Row> */}
            </div>
            <div {...attributes} {...listeners} className={styles.data_row_dragger}><div className={styles.bg} /></div>

            {(selected) && <div className={styles.selected} />}
        </div>
    </Loader>)
};

// export default function EditAppPage({ params }){
export default function EditAppPage(){
    const { page_id } = useParams<{ page_id: string }>()

    const [fatelError, set_fatelError] = useState(false)
    const [error, setError] = useState(false)
    const [saving, setSaving] = useState(false);
    const [busy, setBusy] = useState(false);
    const [pageData, set_pageData] = useState(null)
    // const [data, setData] = useState({ rows: [] })
    const [showProps, set_showProps] = useState(false)
    const [sortDragging, set_sortDragging] = useState(null);
    const [publishing, set_publishing] = useState(false);
    const [loadingModules, set_loadingModules] = useState(false);
    // const [modulesArray, set_modulesArray] = useState(null);
    const [modulesPageNum, set_modulesPageNum] = useState(1);
    const [showPageEdit, set_showPageEdit] = useState(false);


    const router = useRouter();

    const [deleteAppPagesModules, delRow_details] = useMutation(DELETE_ROW); // { data, loading, error }
    const [saveAppPagesModules, saveRows_details] = useMutation(SAVE_ROWS); // { data, loading, error }
    const [publishAppPage, publishAppPage_details] = useMutation(PUBLISH_PAGE); // { data, loading, error }

    const [appPage, { called, loading }] = useLazyQuery(FETCH_DATA,
        { variables: { filter: JSON.stringify({ _id: page_id }) } }
    );

    const [appPagesModulesQuery, modules_load] = useLazyQuery(FETCH_MODULES,
        { variables: { limit: defaultPageSize, page: 1, filter: JSON.stringify({ _id_parent: page_id }), others: JSON.stringify({}) }, }
    );


    useEffect(() => {
        if (called) return;
        fetchData();
    }, [page_id])

    const fetchData = async () => {
        console.log(__yellow("fetchData()"));

        let results = await appPage({
            variables: {
                filter: JSON.stringify({ _id: page_id }),
                fetchPolicy: 'network-only'
            }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.appPage }))
            .catch(err => {
                console.log(__error("Error:"), err)
                return { error: { message: "Unable to fetch page, request error!" } }
            })

        if (!results || results.error) {
            set_fatelError((results && results.error.message) || "No page data found!")
            return false;
        }

        let modules = await fetchModules(1);
        if (modules === false) console.log("modules: ", modules)
        if (modules===false) return false;

        parseData({ ...results, rows: (modules && modules.edges) || [] })
        return false;
    }

    const fetchModules = async (_modulesPageNum:number) => {
        set_loadingModules(true);
        set_modulesPageNum(_modulesPageNum)

        let results = await appPagesModulesQuery({
            variables: {
                limit: defaultPageSize,
                page: _modulesPageNum, //_pagination.pageSize * (_pagination.current - 1),
                filter: JSON.stringify({ _id_parent: page_id }),
                others: JSON.stringify({ sort: { sort_order: 1 } })
            },
            fetchPolicy: 'network-only'
        })
        .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.appPagesModulesQuery }))
        .catch(err=>{
            console.error(err);
            return { error: { message: "Unable to fetch modules, request error!" } }
        });
        set_loadingModules(false);

        if (!results || results.error) {
            set_fatelError((results && results?.error?.message) || 'No Modules found!');
            return false;
        }
        return results;
    }

    const parseData = (_data) => {
        let results = { ..._data };

        if (results.rows) {
            Object.assign(results,
                {
                    rows: results.rows.map(o => {
                        let values = parseJson(o.values);
                        return {
                            ...o,
                            id: o._id,
                            schedule_start: o.schedule_start && utcToDateField(o.schedule_start),
                            schedule_end: o.schedule_end && utcToDateField(o.schedule_end),
                            values: (!values || values == "null" || values == "undefined") ? undefined : values
                        }
                    })
                }
            )
        }

        if (results.error) setError(results.error.message)
        else set_pageData(results);
        return results;
    }

    const onDeleteRow = async (row, callback) => {
        // await sleep(2000)
        // callback();
        // return false;

        let resutls = await deleteAppPagesModules({ variables: { _id: row._id } }).then(r => (r?.data?.deleteAppPagesModules))
            .catch(err => {
                console.log(__error("Error: "), err)
                return { error: { message: "Unable to delete module!" } }
            })

        if (!resutls || resutls.error) {
            message.error((resutls && resutls.error.message) || "Invalid Response!")
            return false;
        }

        let rows = pageData.rows.filter(o => (o._id !== row._id))
        set_pageData({ ...pageData, rows: rows })

        message.success("Modules removed!")
        callback()
        return false;
    }

    const onSubmit = async ({ rows }) => {
        // console.log(__yellow("onSubmit()"), rows)

        if (!rows || rows.length < 1 || !rows[0]?.id) {
            setError("Oops! Seems like your havent added anything into the page yet!")
            return false;
        }

        let uploadArray = [];

        let input = {
            _id: pageData._id,
            rows: rows.map((row, row_index) => {
                if (!row?.data?.type) return false;

                let _values;// = { ...row.values }

                if (_.isString(row.values)) {
                    _values = row.values
                }

                else if (row.data.type == 'prod_list_3_2') {
                    _values = JSON.stringify({
                        ...row.values,
                        products: row.values.products.map(prod => ({ _id: prod._id }))
                    })
                }

                else {
                    _values = JSON.stringify(row.values)
                }

                if (row.styles?.background?.upload_image && row.styles.background.upload_image[0]) {
                    uploadArray.push({ file: row.styles.background.upload_image[0], row_index })
                }

                return ({
                    _id: row._id,
                    _id_parent: pageData._id,
                    schedule_start: row.schedule_start ? dateToUtc(row.schedule_start.startOf('day'), { tz: defaultTZ }) : undefined,
                    schedule_end: row.schedule_end ? dateToUtc(row.schedule_end.endOf('day'), { tz: defaultTZ }) : undefined,
                    linked_to: 'page',
                    status: row.status || 'online',
                    data: {
                        desc: row.data.desc,
                        label: row.data.label,
                        type: row.data.type,
                    },
                    values: _values, // _.isString(row.values) ? row.values : JSON.stringify(row.values),
                    styles: parseStylesInput(row.styles),
                    sort_order: row_index,
                })

            }),
        }

        // console.log("input: ", input)
        // return { error:{message:"testing"}}

        // verify that there is no empty ROW
        if (!input.rows || input.rows.length < 1 || input.rows.includes(false)) {
            setError("Loooks liek you have one or more empty rows, please populate the row(s) or remove!")
            return false;
        }

        setSaving(true)
        let results = await saveAppPagesModules({ variables: { input: input.rows } }).then(r => (r?.data?.saveAppPagesModules))
            .catch(err => {
                console.log(__error("Error: "), err)
                return { error: { message: "Unable to complete your request at the moment." } }
            })

        if (results.error) {
            setError(results.error.message);
            message.error(results.error.message)
        }
        else message.success("Saved")

        // await sleep(1500)
        // parseData({ ...pageData, rows: results, published: false })
        await fetchData();
        setSaving(false)
        return false;
    }

    const uploadImage = async (file) => {
        let result = uploadFile({ file, data: { upload_type: "page_assets" } }).catch(err => {
            console.log(__error("Error: "), err)
            return { error: { message: "Unable to comeplte upload!" } }
        })

        if (!result || result.error) {
            setError((result && result.error.message) && "Invalid Upload response!")
            return false;
        }

        return result;
    }

    const updatePublish = async ({ rows, published }) => {
        if (!rows || rows.length < 1 || !rows[0]?.id) {
            setError("Oops! Seems like your havent added anything into the page yet!")
            return false;
        }

        setError(null);
        set_publishing(true)

        let result = await publishAppPage({ variables: { input: { _id: pageData._id, published } } })
            .then(r => (r?.data?.publishAppPage))
            .catch(err => {
                console.log(__error("Error: "), err)
                return { error: { message: "Unable to publish at the moment!" } }
            })
        set_publishing(false)

        if (!result || result.error) {
            setError((result && result?.error?.message) || "Invalid response")
            return false;
        }

        message.success("Published")

        set_pageData({ ...pageData, published: published })
    }

    const toggleSettings = () => set_showPageEdit(!showPageEdit)

    const savePageSettings = async (values) => {
        setBusy(true)
        await sleep(1500)
        setBusy(false)
        toggleSettings(false)

        return true;
    }
    const onSettingsUpdate = (values) => {
        set_pageData({ ...pageData, ...values })
        toggleSettings()
    }



    // Initialize sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10, // Minimum movement in pixels to start dragging
            },
        })
    );
    const handleDragEnd = (fields) => (event) => {
        set_sortDragging(null);

        const { active, over } = event;

        if (active.id !== over.id) {
            // const oldIndex = fields.value.indexOf(active.id);
            // const newIndex = fields.value.indexOf(over.id);
            const oldIndex = fields.value.findIndex(o => o.id == active.id)
            const newIndex = fields.value.findIndex(o => o.id == over.id)
            // console.log(`Move ${oldIndex} to ${newIndex}`)

            fields.move(oldIndex, newIndex);
        }
    };

    const onItemClick = (vals) => set_showProps(vals)
    const handleDragStart = (event) => set_sortDragging(event.active.id);

    if (fatelError) return <Alert message={fatelError} type='error' showIcon />
    if (loading && !pageData) return <Loader loading={true} />
    if (!pageData) return <Loader loading={true}>Parsing data...</Loader>

    
    return (<>
        <FinalForm onSubmit={onSubmit} initialValues={pageData}
            mutators={{ ...arrayMutators }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                const onItemDrop = ({ item, zone, id }, { field, fields, index }) => {
                    // alert(`custom: ${item.label} dropped into zone ${zone}`);
                    // let data = field?.data?.slice() || [];
                    //     data.push(item)

                    // fields.update(index, { ...field, data: item })
                    fields.update(index, { id, zone, data: item })
                }


                return (<>
                    {error && <Alert message={error} showIcon type='error' />}
                    <form id="page_composer_form" {...submitHandler(formargs)}>

                        <div style={{ borderBottom: "1px solid #D0DAE5", padding: "10px", backgroundColor: "#FFF" }}>
                            <Row gutter={[20, 20]}>
                                <Col span={8}><Button disabled={!pageData.published} onClick={toggleSettings} icon={<Icon icon="cog" />}>Settings</Button></Col>
                                <Col span={8} align="center">
                                    <Space>
                                        <div>Web</div>
                                        <div>|</div>
                                        <div>Mobile</div>
                                    </Space>
                                    <h4>{pageData.title}</h4>
                                </Col>
                                <Col span={8} align="right">
                                    <Space>
                                        {!pageData.published && <Alert type='warning' showIcon message="Contents updated" />}
                                        <ExternalSubmitButton color="orange" loading={saving} label="Save" form_id="page_composer_form" />
                                        <Button onClick={() => updatePublish({ ...values, published: !pageData.published })} color="blue" loading={publishing} disabled={pageData.published}>Publish</Button>
                                    </Space>
                                </Col>
                            </Row>
                        </div>


                        <Row gutter={[0]}>
                            <Col><SideMenu /></Col>

                            <Col flex="auto" style={{ border: "0px solid black" }} align="center">

                                <div className={`${styles.mob_view_wrapper} ${styles.custom_scroller}`}>
                                    <div className={styles.mob_view} align="left">
                                        <FieldArray name="rows">
                                            {({ fields }) => {
                                                return (<>
                                                    <DndContext
                                                        sensors={sensors}
                                                        collisionDetection={closestCenter}
                                                        onDragStart={handleDragStart}
                                                        // onDragEnd={handleDragEnd}
                                                        onDragEnd={handleDragEnd(fields)}
                                                        modifiers={[restrictToVerticalAxis]}
                                                    >
                                                        <SortableContext items={fields?.value?.map(({ id }) => id)} strategy={verticalListSortingStrategy}>
                                                            {fields.map((name, index) => {
                                                                const thisNode = fields.value[index];

                                                                return (<div key={index}>
                                                                    <SortableField
                                                                        selected={showProps && (showProps.id == thisNode.id)}
                                                                        onClick={() => onItemClick({ ...thisNode, name })}
                                                                        // onRemove={fields.length < 2 ? undefined : () => fields.remove(index)}
                                                                        onRemove={fields.length < 2 ? undefined : async () => onDeleteRow(thisNode, () => fields.remove(index))}
                                                                        onEdit={() => console.log("EDIT")}
                                                                        id={thisNode.id} name={name} index={index} remove={fields.remove}>
                                                                        <DataRow
                                                                            thisNode={thisNode}
                                                                            field_name={name}
                                                                            row_id={index}
                                                                            // onItemClick={onItemClick}
                                                                            onItemDrop={args => onItemDrop(args, { field: thisNode, fields, index })}
                                                                        />
                                                                    </SortableField>
                                                                </div>)

                                                            })}
                                                        </SortableContext>
                                                    </DndContext>

                                                    <AddRowButton fields={fields} />
                                                </>)
                                            }}
                                        </FieldArray>
                                    </div>
                                </div>

                            </Col>

                            {showProps && <Col><PropsWindow item={showProps} onClose={() => set_showProps(false)} /></Col>}
                        </Row>


                        <Modal
                            footer={false}
                            // closable={!busy} cancelButtonProps={{ disabled: busy }} confirmLoading={busy}
                            // onOk={() => savePageSettings(values)}
                            title="Page Settings"
                            width="1000px"
                            open={showPageEdit}
                            onCancel={() => set_showPageEdit(false)}
                        >
                            <AppPageEditForm onCancel={() => set_showPageEdit(false)} onUpdate={onSettingsUpdate} page_id={pageData._id} />
                        </Modal>

                        <DevBlock obj={{ ...values }} />
                    </form>
                </>)

            }}
        />

        <DevBlock obj={pageData} />
    </>)
}
