'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { message, Row, Col, Card, Alert, Popover, Space, Tooltip } from 'antd';
import moment from 'moment';
import _ from 'lodash'
import { Page, PageBar, PageHeader } from '@_/template';
import { __error, __yellow } from '@/lib/consoleHelper';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import { useLazyQuery, useMutation, useSubscription } from '@apollo/client';
import { catchApolloError, checkApolloRequestErrors, dateToUtc } from '@/lib/utill';
import { Button, Loader, DevBlock, Table, PopMenu } from '@/components'
import FieldFormEditor from '@/modules/settings/FieldFormEditor';
import { sleep } from '@_/lib';

import { FieldArray } from 'react-final-form-arrays';
import arrayMutators from 'final-form-arrays'
import { Form as FinalForm, Field as FinalField } from 'react-final-form';
import { FormField, FormFieldGroup, SubmitButton, rules, submitHandler } from '@/components/form';

import { useAppDispatch, useAppSelector, useAppStore } from '@/rStore/hooks';
import { initSettings } from '@_/rStore/slices/systemSlice';

import { fetchSettings } from '@_/lib/fetchSettings';

import GET_VALUES from '@_/graphql/value_pairs/valuePairs.graphql';
import UPDATE_SORT from '@_/graphql/value_pairs/updateValuePairsSort.graphql';
import EDIT_MULTIPLE from '@_/graphql/value_pairs/updateValuePairArray.graphql';
import DEL_SETTINGS from '@_/graphql/value_pairs/deleteValuePairs.graphql';


const SortableTable = ({ fields, onUpdate }) => {
    const [updateValuePairsSort, sort_details] = useMutation(UPDATE_SORT);

    const [isDirty, setIsDirty] = useState(false);
    const [busy, setBusy] = useState(false);
    const [data, setData] = useState(fields.slice());

    const DraggableBodyRow = ({ index, moveRow, className, style, ...restProps }) => {
        const ref = useRef(null);
        const type = 'DraggableBodyRow';

        const [{ isOver, dropClassName }, drop] = useDrop({
            accept: type,
            collect: (monitor) => {
                const { index: dragIndex } = monitor.getItem() || {};
                if (dragIndex === index) return {};
                return {
                    isOver: monitor.isOver(),
                    dropClassName: dragIndex < index ? ' drop-over-downward' : ' drop-over-upward',
                };
            },
            drop: (item) => {
                moveRow(item.index, index);
            },
        });

        const [, drag] = useDrag({
            type,
            item: { index },
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
        });

        drop(drag(ref));

        return (
            <tr ref={ref}
                className={`${className}${isOver ? dropClassName : ''}`}
                style={{ cursor: 'move', ...style }}
                {...restProps}
            />
        );
    };

    const columns = [
        {
            title: 'Drag to sort',
            dataIndex: 'title',
            key: 'title',
        },
        {
            type: 'Type',
            dataIndex: 'type',
            key: 'type',
        },
    ];

    const components = {
        body: {
            row: DraggableBodyRow,
        },
    };

    const moveRow = useCallback(
        (dragIndex, hoverIndex) => {
            const dragRow = data[dragIndex];
            if (!isDirty) setIsDirty(true)
            setData(
                update(data, {
                    $splice: [
                        [dragIndex, 1],
                        [hoverIndex, 0, dragRow],
                    ],
                }),
            );
        },
        [data],
    );

    const saveSort = async () => {
        // console.log("saveSort()")
        setBusy(true);

        const input = data.map((o, i) => ({ _id: o._id, sort_order: i }))

        let resutls = await updateValuePairsSort({ variables: { input } }).then(({ data }) => (data.updateValuePairsSort))
        if (resutls.error) {
            alert(resutls.error.message);
            return false;
        }
        setBusy(false);
        onUpdate(resutls)
    }


    return (<>
        <DndProvider backend={HTML5Backend}>
            <Table
                pagination={false}
                columns={columns}
                dataSource={data}
                components={components}
                onRow={(_, index) => {
                    const attr = { index, moveRow };
                    return attr;
                }}
            />
        </DndProvider>

        <div align="center" style={{ padding: "20px" }}>
            <Button loading={busy} onClick={saveSort} disabled={!isDirty}>Save The Order</Button>
        </div>

        <DevBlock obj={data} />

    </>)

}

const renderField = ({ field, session }) => {
    if (!field) return { error: { message: `Invalid field (${field.title})` } }

    let tooltip = field.tooltip && <>{field.tooltip} <br />field_name: {field.field_name} <br />type: {field.type}</>;
    let label = field.title; // [<span key={0}>{field.title}</span>];
    if (session.user.acc_type == 'super-admin') {
        label = <Tooltip title={field.field_name}><span>{label}</span></Tooltip>
        // label.push(<small key={label.length}> ({field.field_name})</small>)
    }

    if (field.value_type == "timezone") {
        let arr = moment.tz.names();
        return {
            showSearch: true,
            optionFilterProp: "children",
            filterOption: (input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase()),
            options: arr.map(o => ({ value: o, label: o })),
            type: "select",
            label,
            tooltip,
            allowClear: true
        }
    }
    if (field.value_type == "text") return { type: "text", label, tooltip, allowClear: true }
    if (field.value_type == "textarea") return { type: "textarea", label, tooltip, allowClear: true }
    if (field.value_type == "number") return { type: "number", label, tooltip, allowClear: true }
    if (field.value_type == "email") return { type: "email", label, tooltip, allowClear: true }
    if (field.value_type == "switch") return { type: "switch", label, tooltip, allowClear: true }
    if (field.value_type == "datetime") return { type: "date", label, tooltip, allowClear: true }
    if (field.value_type == "date") return { type: "date", label, tooltip, allowClear: true }
    if (field.value_type == "select") return { type: "select", options: [], label, tooltip, allowClear: true }

    return { error: { message: `Invalid field (${field.title}) ~ (type: ${field && field.value_type})` } }
}


function RenderGroup({ initialValues, title, refetchData, session, onEditField }){
    const [enableSort, set_enableSort] = useState(false)
    const [error, setError] = useState(null)
    const [data, setData] = useState(initialValues)

    const dispatch = useAppDispatch()

    const [updateValuePairArray, edit_details] = useMutation(EDIT_MULTIPLE);
    const [deleteValuePairs, del_details] = useMutation(DEL_SETTINGS);

    useEffect(() => {
        setData(initialValues)
    }, [initialValues])
    

    const onDeletePress = async (_id) => {
        let resutls = await deleteValuePairs({ variables: { _id } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.deleteValuePairs }))
            .catch(catchApolloError)
        
        if (resutls.error) {
            alert(resutls.error.message);
            return false;
        }
        refetchData();
    }

    const onSubmit = async (values) => {
        // console.log(__yellow("onSubmit()"), values);

        setError(null);
        sleep(2000);

        const input = values.settings.map((item: any) => {
            let _return = {
                _id: item._id,
                value: item.value.length > 0 ? String(item.value).trim() : "", // (item.value !== null || item.value !== undefined || item.value !== "") ? String(item.value) : "",
            }
            if (item.value_type == 'number') Object.assign(_return, { value: isNaN(item.value) ? "0" : String(item.value || 0) })
            if (item.value_type == "switch") Object.assign(_return, { value: (_return.value === true) ? "yes" : "no" })
            if (item.value_type == "select") Object.assign(_return, { value: JSON.stringify(_return.options) })
            if (['date', 'datetime'].includes(item.value_type)) Object.assign(_return, { value: dateToUtc(_return.value) })

            return _return;
        })

        let resutls = await updateValuePairArray({ variables: { input } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.updateValuePairArray }))
            .catch(catchApolloError)

        if (resutls.error) {
            setError(resutls.error.message);
            return false;
        }

        message.success("Settings Updated!")
        setData(values.settings)

        if(title=='general'){
            fetchSettings().then(r => {
                if (!r.error) dispatch(initSettings(r));
            });
        }

        // fetchData();
        return false;
    }



    return (<><Card>
        <Row align='middle'>
            <Col flex="auto"><div style={{ fontWeight: "bold", textTransform: "capitalize" }}>{title == "null" ? "Others" : title}</div></Col>
            <Col>
                <Button size="small" shape="round" type={enableSort ? "primary" : "dashed"} onClick={() => set_enableSort(prev => (!prev))}>{enableSort ? "Disable" : "Enable"} Sort</Button>
            </Col>
        </Row>

        <FinalForm onSubmit={onSubmit} id="ConfigForm" initialValues={{ settings:data }}
            mutators={{ ...arrayMutators }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                return (<>
                    {(error) && <Alert message={error} showIcon type='error' />}

                    <form id={`form_${title.replaceAll(" ", "_")}`} {...submitHandler(formargs)}>

                        <FieldArray name="settings">
                            {({ fields }) => {
                                
                                return (<>
                                    <Row gutter={[10, 10]}>
                                        {fields.map((name, index) => {
                                            const field = fields.value[index];
                                            const _field = renderField({ field, session })

                                            return (<Col span={["something"].includes(field.category) ? 24 : 12} key={index}>
                                                <Row align="bottom" className='nowrap'>
                                                    <Col flex="auto">
                                                        {/* {field.error && <Alert message={field.error.message} type='error' showIcon />} */}
                                                        {!field.error && <FormField name={`${name}.value`} {..._field} />}
                                                    </Col>
                                                    <Col>
                                                        <PopMenu direction="horizontal" size="small" placement="left" items={[
                                                            { onClick: () => onEditField(field), label: "Edit" },
                                                            { onClick: () => onDeletePress(field._id), label: "Delete", type: 'delete' }
                                                        ]}></PopMenu>
                                                    </Col>
                                                </Row>
                                            </Col>)

                                        })}
                                    </Row>
                                </>)

                            }}
                        </FieldArray>
                                          
                        <div style={{ padding:"10px 20px 0", textAlign:"center" }}><SubmitButton loading={submitting} disabled={invalid} color="orange" label="Save" /></div>

                    </form>

                    {/* <DevBlock obj={values} /> */}
                </>)

            }}
        />
    </Card></>)
}


export default function SettingsPage (props) {
    const [getValuePairs, { called, loading, data }] = useLazyQuery(GET_VALUES, { fetchPolicy: "network-only" });
    const [updateValuePairArray, edit_details] = useMutation(EDIT_MULTIPLE);
    const [deleteValuePairs, del_details] = useMutation(DEL_SETTINGS);

    const session = useAppSelector((state) => state.session);
    
    const [settingsArray, set_settings] = useState(null)
    const [showFieldForm, set_showFieldForm] = useState(false)
    const [busy, setBusy] = useState(false)
    const [enableSort, set_enableSort] = useState(false)
    const [error, setError] = useState(null)


    useEffect(() => {
        if (settingsArray || called) return;
        fetchData();

        return () => {
            set_settings(null)
        };
    }, [])

    const fetchData = async () => {
        // set_enableSort(false)
        setBusy(true)
        let resutls = await getValuePairs({
            variables: {
                filter: JSON.stringify({
                    department: "sys_configs",
                })
            }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.valuePairs }))
            .catch(catchApolloError)

        setBusy(false);
        if (!resutls || resutls.error){
            message.error((resutls && resutls?.error?.message) || "Empty response!");
            return false;
        }

        if (resutls && resutls.length > 0) resutls = resutls.slice().sort(function (a, b) { return a.sort_order - b.sort_order });
        set_settings(resutls)
    }

    const onSubmit = async (values) => {
        console.log(__yellow("onSubmit()"));

        const input = values.settings.map(item => {
            let _return = {
                _id: item._id,
                // tooltip: item.tooltip,
                // title: item.title,
                value: String(item.value || ""),
                // code: item.code,
                // type: item.type,
                // cat: item.cat,
            }
            if (_return.type == "switch") Object.assign(_return, { value: (_return.value === true) ? "yes" : "no" })
            if (_return.type == "select") Object.assign(_return, { value: JSON.stringify(_return.options) })
            if (_return.type == "date" || _return.type == "datetime") Object.assign(_return, { value: dateToUtc(_return.value) })

            return _return;
        })

        let resutls = await updateValuePairArray({ variables: { input } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.updateValuePairArray }))
            .catch(catchApolloError)

        if (resutls.error) {
            alert(resutls.error.message);
            return false;
        }

        message.success("Settings Updated!")
        fetchData();
        return true;
    }

    const renderField = (theField) => {
        // console.log("renderField: ", theField)
        if (!theField) return { error: { message: `Invalid field (${theField.title})` } }

        let tooltip = theField.tooltip && <>{theField.tooltip} <br />field_name: {theField.field_name} <br />type: {theField.type}</>;
        let label = `${theField.title}`; // theField.title; // && <>{theField.title}</>;
            if (session.user.acc_type == 'super-admin') label += ` (${theField.department})`

        // if (code == "current_language") return <FormField type="select" data={languageArray} name={`settings[${index}].value`} label={label} tooltip={tooltip} allowClear />

        if (theField.value_type == "timezone") {
            let arr = moment.tz.names();
            return { 
                showSearch: true,
                optionFilterProp: "children",
                filterOption: (input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase()),
                options: arr.map(o => ({ value: o, label: o })),
                type: "select", 
                label, //: `${label} (${theField.department})`, 
                tooltip, 
                allowClear: true
            }
        }
        if (theField.value_type == "text") return { type: "text", label: label, tooltip: tooltip, allowClear:true }
        if (theField.value_type == "textarea") return { type: "textarea", label: label, tooltip: tooltip, allowClear: true }
        if (theField.value_type == "number") return { type: "number", label: label, tooltip: tooltip, allowClear: true }
        if (theField.value_type == "email") return { type: "email", label: label, tooltip: tooltip, allowClear: true }
        if (theField.value_type == "switch") return { type: "switch", label: label, tooltip: tooltip, allowClear: true }
        if (theField.value_type == "datetime") return { type: "date", label: label, tooltip: tooltip, allowClear: true }
        if (theField.value_type == "date") return { type: "date", label: label, tooltip: tooltip, allowClear: true }
        if (theField.value_type == "select") return { type: "select", options:[], label: label, tooltip: tooltip, allowClear: true }

        return { error: { message: `Invalid field (${theField.title}) ~ (type: ${theField && theField.value_type})` }}
        // return <Alert message={`Invalid field (code: ${theField.title}) ~ (type: ${theField && theField.type})`} type="error" showIcon />
    }

    const onFieldsUpdate = () => {
        set_showFieldForm(false);
        fetchData();
    }

    const onDeletePress = async (_id) => {
        let resutls = await deleteValuePairs({ variables: { _id } }).then(({ data }) => (data.deleteValuePairs))
        if (resutls.error) {
            alert(resutls.error.message);
            return false;
        }
        fetchData();
    }

    
    if (busy || loading) return <Loader loading={true} center />
    if (!settingsArray) return <Alert message="Empty settingsArray" type='error' showIcon />

    let groupped = _.groupBy(settingsArray, "category");
    let keys = Object.keys(groupped);


    return (<>
        <PageHeader title={"Settings"} sub={null}>
            <Button color="orange" onClick={() => set_showFieldForm(true)}>Add New Field</Button>
        </PageHeader>

        <Page style={{ padding: "0 20px" }}>
            <Row gutter={[5, 5]}>
                {keys && keys.sort().map((group_key, i) => {
                    const group = groupped[group_key];

                    return (<Col span={12} key={i}>
                        <RenderGroup initialValues={group} title={group_key} session={session} refetchData={fetchData} onEditField={set_showFieldForm} />
                    </Col>)

                })}
            </Row>
        </Page>


        <FieldFormEditor show={showFieldForm !== false} initialValues={showFieldForm === true ? null : showFieldForm}
            department="sys_configs"
            onSuccess={onFieldsUpdate}
            onCancel={() => set_showFieldForm(false)}
        />

    </>)


    return (<>
        <PageHeader title={"Settings"} sub={null}>
            <Button color="orange" onClick={() => set_showFieldForm(true)}>Add New Field</Button>
        </PageHeader>

        <Page>



            <FinalForm onSubmit={onSubmit} id="ConfigForm" initialValues={{ settings: settingsArray }}
                mutators={{ ...arrayMutators }}
                render={(formargs) => {
                    const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                    let groupped = _.groupBy(values.settings, "category");
                    let keys = Object.keys(groupped);

                    return (<>
                        {(error) && <Alert message={error} showIcon type='error' />}

                        <form id="configs_form" {...submitHandler(formargs)}>

                            <Row gutter={[5, 5]}>
                                {keys.map((group, i) => {
                                    // if (!checkRights(rights, `settings-${String(group).toLowerCase()}`)) return <span key={i} />;

                                    // console.log("enableSort: ", { enableSort, group })

                                    const group_fields = groupped[group];
                                    // group_fields.sort(function (a, b) { return a.sort_order - b.sort_order });

                                    return (<Col span={12} key={i}>
                                        <Card>
                                            <Row align='middle'>
                                                <Col flex="auto"><b>{group == "null" ? "Others" : group}</b></Col>
                                                <Col>
                                                    <Button size="small" shape="round" disabled={enableSort && enableSort !== group} type={enableSort ? "primary" : "dashed"} 
                                                        onClick={() => set_enableSort(prev => (!prev ? group : false))}
                                                    >{enableSort ? "Disable" : "Enable"} Sort</Button>
                                                </Col>
                                            </Row>

                                            {enableSort === group && <SortableTable fields={group_fields} onUpdate={() => fetchData()} />}

                                            {enableSort !== group && <Row gutter={[5, 0]} align='middle'>
                                                {group_fields.map((field, ii) => {
                                                    {/* Set collumn width by group type */ }
                                                    let _field = renderField(field);

                                                    return (<Col span={!["something"].includes(group) ? 12 : 24} key={ii}>
                                                        <Row align="bottom" className='nowrap'>
                                                            <Col flex="auto">
                                                                {_field.error && <Alert message={_field.error.message} type='error' showIcon />}
                                                                {!_field.error && <FormField name={`settings[${ii}].value`} {..._field} />}
                                                            </Col>
                                                            <Col>
                                                                <PopMenu direction="horizontal" placement="left" items={[
                                                                    { onClick: () => set_showFieldForm(field), label: "Edit" },
                                                                    { onClick: () => onDeletePress(field._id), label: "Delete", type: 'delete' }
                                                                ]}></PopMenu>
                                                            </Col>
                                                        </Row>
                                                    </Col>)
                                                })}
                                            </Row>}

                                        </Card>
                                    </Col>)
                                })}

                                <Col span={24} align="center">
                                    <SubmitButton loading={submitting} disabled={invalid} color="orange" label="Save" />
                                </Col>
                            </Row>

                        </form>

                        {/* <DevBlock obj={values} /> */}
                    </>)

                }}
            />


            <Row>
                <Col span={12}><DevBlock obj={settingsArray} title="settingsArray" /></Col>
            </Row>
            
            
        </Page>
    </>)

    // security.verifyRole('104.8', session.user.permissions)
}

