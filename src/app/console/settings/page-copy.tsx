'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { message, Row, Col, Card, Alert, Popover, Space } from 'antd';
import moment from 'moment';
import _ from 'lodash'
import { Page, PageBar, PageHeader } from '@_/template';
import { __error, __yellow } from '@/lib/consoleHelper';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import { useLazyQuery, useMutation, useSubscription } from '@apollo/client';
import FieldFormEditor from '@/modules/settings/FieldFormEditor';
import { catchApolloError, checkApolloRequestErrors, dateToUtc } from '@/lib/utill';
import { Button, Heading, Icon, Loader, DeleteButton, IconButton, ListHeader, DevBlock, Table, PopMenu } from '@/components'

import arrayMutators from 'final-form-arrays'
import { Form as FinalForm, Field as FinalField } from 'react-final-form';
import { FormField, FormFieldGroup, SubmitButton, rules, submitHandler } from '@/components/form';

import { useDispatch, useSelector } from 'react-redux';
import { useAppDispatch, useAppSelector, useAppStore } from '@/rStore/hooks';
// import { setSettings, getSettings } from '@/rStore/slices/systemSlice';

import GET_CONFIGS from '@_/graphql/value_pairs/valuePairs.graphql';
import UPDATE_SORT from '@_/graphql/value_pairs/updateValuePairsSort.graphql';
import EDIT_MULTIPLE from '@_/graphql/value_pairs/updateValuePairArray.graphql';
import DEL_SETTINGS from '@_/graphql/value_pairs/deleteValuePairs.graphql';

// import EDIT_MULTIPLE from '@_/graphql/settings/editMultipleSettings.graphql';

const languageArray = [
    { _id: "en", title: "English" }
]

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




export default function SettingsPage (props) {
    const [getValuePairs, { called, loading, data }] = useLazyQuery(GET_CONFIGS);
    const [updateValuePairArray, edit_details] = useMutation(EDIT_MULTIPLE);
    const [deleteValuePairs, del_details] = useMutation(DEL_SETTINGS);

    const dispatch = useAppDispatch();
    // const settings = useAppSelector(getSettings);
    const session = useSelector((state) => state.session);
    
    const [settingsArray, set_settings] = useState(null)
    const [showFieldForm, set_showFieldForm] = useState(false)
    const [busy, setBusy] = useState(false)
    const [enableSort, set_enableSort] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (settingsArray) return;
        fetchData();

        return () => {
            set_settings(null)
        };
    }, [])

    const fetchData = async () => {
        set_enableSort(false)
        setBusy(true)
        let resutls = await getValuePairs({
            variables: {
                filter: JSON.stringify({
                    department: "sys_configs",
                })
            },
            fetchPolicy: "network-only"
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
            if (_return.type == "date" || _return.type == "date_time") Object.assign(_return, { value: dateToUtc(_return.value) })

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
        if (theField.value_type == "date_time") return { type: "date", label: label, tooltip: tooltip, allowClear: true }
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

    
    if (busy) return <Loader loading={true} center />
    if (!settingsArray) return <Alert message="Empty settingsArray" type='error' showIcon />

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

                                    const group_fields = groupped[group];
                                    // group_fields.sort(function (a, b) { return a.sort_order - b.sort_order });

                                    return (<Col span={12} key={i}>
                                        <Card>
                                            <Row align='middle'>
                                                <Col flex="auto"><b>{group == "null" ? "Others" : group}</b></Col>
                                                <Col>
                                                    <Button 
                                                        size="small" shape="round"
                                                        disabled={enableSort && enableSort !== group} 
                                                        type={enableSort ? "primary" : "dashed"} 
                                                        onClick={() => {
                                                            console.log("enableSort: ", enableSort)
                                                            set_enableSort(enableSort === false ? group : false)
                                                        }}
                                                    >{!enableSort ? "Enable Sort" : "Disable Sort"}</Button>
                                                </Col>
                                            </Row>

                                            {enableSort == group && <SortableTable fields={group_fields} onUpdate={() => fetchData()} />}

                                            {enableSort !== group && <Row gutter={[5, 0]} align='middle'>
                                                {group_fields.map((field, ii) => {
                                                    {/* Set collumn width by group type */ }
                                                    let _field = renderField(field);

                                                    return (<Col span={["general", "applications", "products"].includes(group) ? 12 : 24} key={ii}>
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

                                    const group_fields = groupped[group];
                                        // group_fields.sort(function (a, b) { return a.sort_order - b.sort_order });

                                    return (<Col span={12} key={i}>
                                        <Card>
                                            <Row align='middle'>
                                                <Col flex="auto"><b>{group == "null" ? "Others" : group}</b></Col>
                                                <Col><Button disabled={enableSort && enableSort !== group} size="small" type={enableSort ? "primary" : "dashed"} shape="round"
                                                    onClick={() => set_enableSort(!enableSort ? group : false)}
                                                >{!enableSort ? "Enable Sort" : "Disable Sort"}</Button></Col>
                                            </Row>

                                            {enableSort == group && <SortableTable fields={group_fields} onUpdate={() => fetchData()} />}

                                            {enableSort !== group && <Row gutter={[5, 0]} align='middle'>
                                                {group_fields.map((field, ii) => {
                                                    {/* Set collumn width by group type */ }
                                                    let _field = renderField(field);

                                                    return (<Col span={["general", "applications", "products"].includes(group) ? 12 : 24} key={ii}>
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
        </Page>

        <FieldFormEditor show={showFieldForm !== false} initialValues={showFieldForm === true ? null : showFieldForm}
            department="sys_configs"
            onSuccess={onFieldsUpdate}
            onCancel={() => set_showFieldForm(false)}
        />

    </>)
}

