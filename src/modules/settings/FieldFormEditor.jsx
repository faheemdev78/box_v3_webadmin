import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types';
import { Drawer, Button, Heading, Icon, Loader, DevBlock, IconButton } from '@/components'
import { message, Row, Col, Modal, Alert } from 'antd';
import { useLazyQuery, useMutation, useSubscription } from '@apollo/client';
import { __error } from '@_/lib/consoleHelper';
import { dateToUtc } from '@_/lib/utill';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField } from '@_/components/form';
import arrayMutators from 'final-form-arrays'
import { FieldArray } from 'react-final-form-arrays'

// import GET_VALUE from '@_/graphql/value_pairs/valuePair.graphql';
import ADD_VALUE from '@_/graphql/value_pairs/addValuePairs.graphql';
import EDIT_VALUE from '@_/graphql/value_pairs/editValuePairs.graphql';
import { settingCats } from '@_/configs';


const FieldFormEditorComp = ({ department, initialValues, onSuccess, onCancel, client }) => {
    // const [get_valuePair, { called, loading, error, data }] = useLazyQuery(GET_VALUE);
    const [addValuePairs, add_details] = useMutation(ADD_VALUE);
    const [editValuePairs, edit_details] = useMutation(EDIT_VALUE);
    // const { data, loading } = useSubscription(QUERY_SUBSCRIPTION, { variables: { postID } });

    // const [busy, setBusy] = useState(false)

    const onSubmit = async(values) => {
        let input = {
            title: values.title,
            values: values.values ? String(values.values) : undefined,
            value_type: values.value_type,
            field_name: values.field_name,
            tooltip: values.tooltip,
            department,
            category: values.category,
            // status: String
            // sort_order: Int
            validator_function: values.validator_function,
        }
        if (values.value_type == "date" && values.values) Object.assign(input, { values: dateToUtc(values.values) })
        if (values.value_type == "date_time" && values.values) Object.assign(input, { values: dateToUtc(values.values) })
        if (values.value_type == "select" && values.options) Object.assign(input, { values: JSON.stringify(values.options) })
                    
        if (values._id) {
           Object.assign(input, { _id: values._id })
           return updateSettings(input);
       }
        else return addSettings(input)
    }

    const updateSettings = async (input) => {
        let resutls = await editValuePairs({ variables: { input } })
            .then(({ data }) => (data && data.editValuePairs))
            .catch(err => {
                console.error(err)
                return { error: { message: "Request Error" } }
            })

        if (!resutls || resutls?.error?.message) {
            alert((resutls && resutls?.error?.message) || "Invalid response!");
            return false;
        }

        onSuccess(resutls)
        return false;
    }

    const addSettings = async (input) => {
        let resutls = await addValuePairs({ variables: { input } })
            .then(({ data }) => (data && data.addValuePairs))
            .catch(err => {
                console.error(err)
                return { error: { message:"Request Error" }}
            })

        if (!resutls || resutls?.error?.message) {
            alert((resutls && resutls?.error?.message) || "Invalid response!");
            return false;
        }

        onSuccess(resutls)
        return false;
    }

    // if (busy) return <Loader loading={true} center />

    return (<>
        <FinalForm onSubmit={onSubmit} initialValues={initialValues}
            mutators={{
                ...arrayMutators,
                onFieldTypeChange: (newValueArray, state, tools) => {
                    tools.changeValue(state, 'value', () => undefined)
                    tools.changeValue(state, 'options', () => undefined)
                },
            }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                return (<>
                    {/* {error && <Alert message={error} showIcon type='error' />} */}
                    <form id="SettingsFieldEditorForm" {...submitHandler(formargs)}>

                        <Row>
                            <Col flex="150px">
                                <FormField
                                    onChange={(v, raw) => {
                                        form.mutators.onFieldTypeChange()
                                    }}
                                    options={[
                                        { value: "timezone", label: "Time Zones" },
                                        { value: "text", label: "Text field" },
                                        { value: "number", label: "Number field" },
                                        { value: "switch", label: "Switch" },
                                        { value: "textarea", label: "Textarea" },
                                        { value: "select", label: "Select" },
                                        { value: "date", label: "Date" },
                                        { value: "date_time", label: "Date & Time" },
                                        { value: "email", label: "Email" },
                                    ]}
                                    type="select" name="value_type" label="Type" validate={rules.required}
                                />
                            </Col>
                            <Col>
                                {/* {values.value_type && <FormField type="text" name="category" label="Category" validate={rules.required} />} */}
                                {values.value_type && <FormField
                                    options={settingCats}
                                    type="select" name="category" label="Category" validate={rules.required}
                                />}
                            </Col>
                        </Row>

                        {(values.value_type && values.category) && <>
                            <FormField type="text" name="title" label="Title" validate={rules.required} />
                            {values.type == "text" && <FormField type="text" name="values" label="Value" />}
                            {values.type == "number" && <FormField type="number" name="values" label="Value" />}
                            {values.type == "switch" && <FormField type="switch" name="values" label="Value" />}
                            {values.type == "textarea" && <FormField type="textarea" name="values" label="Value" />}
                            {values.type == "select" && <>
                                <FieldArray name="options">
                                    {({ fields }) => {

                                        return (<div>
                                            {fields.map((name, index) => {
                                                let thisField = fields.value[index];

                                                return (<div key={index} style={{ border: "1px solid #EEE", padding: "10px", marginBottom: "5px", borderRadius: "5px" }}>
                                                    <Row align="middle" gutter={[5, 5]}>
                                                        <Col><FormField type="text" compact size="small" label="Label" name={`${name}.label`} /></Col>
                                                        <Col flex="auto"><FormField type="text" compact size="small" label="Value" name={`${name}.value`} /></Col>
                                                        <Col><IconButton onClick={() => fields.remove(index)} size="small" icon="minus" color="red" /></Col>
                                                    </Row>

                                                </div>)

                                            })}

                                            <Button onClick={() => fields.push({ id: "", value: "" })} size="small" block type="dashed"><Icon icon="plus" />{` `} Add option</Button>
                                            <div style={{ marginBottom: "50px" }} />

                                        </div>)
                                    }}
                                </FieldArray>
                            </>}
                            {values.type == "date" && <FormField type="date" name="values" label="Value" />}
                            {values.type == "date_time" && <FormField type="date" showTime name="values" label="Value" />}
                            {values.type == "email" && <FormField type="email" name="values" label="Value" />}

                            <FormField type="text" name="tooltip" label="Tooltip" />
                            <FormField type="text" name="field_name" label="Field Name" validate={rules.required} />
                            <FormField type="textarea" name="validator_function" label="Validator Function" />

                            <div style={{ height: "20px" }} />

                            <Row>
                                <Col flex="auto"><Button onClick={onCancel} type="default">Cancel</Button></Col>
                                <Col><SubmitButton loading={submitting}>Save</SubmitButton></Col>
                            </Row>

                        </>}

                        <DevBlock obj={values} title="values" />

                    </form>
                </>)

            }}
        />

    </>)
}
FieldFormEditorComp.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    initialValues: PropTypes.obj,
    cat: PropTypes.string.isRequired,
}


const Wrapper = ({ department, show, initialValues, onCancel, onSuccess }) => {
    // if (!department) return <Alert message="Department not found" type='error' showIcon />
    // if (!show) return null;
    // store-settings
    return (<Modal title={initialValues ? `Edit Field under ${department}` : `Add Field under (${department})`} open={show} footer={false} onCancel={onCancel} destroyOnHidden>
        {!department && <Alert message="Department not found" type='error' showIcon />}
        {(!department || !show) ? null : <>
            <FieldFormEditorComp department={department} initialValues={initialValues} onSuccess={onSuccess} onCancel={onCancel} />
        </>}
    </Modal>)
}
export default Wrapper;

