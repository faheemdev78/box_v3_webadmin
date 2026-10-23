import React, { useState, useEffect } from 'react'
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { useMutation } from '@apollo/client/react';
import { __error } from '@/lib/consoleHelper';
import { FormField, rules, SubmitButton } from '@/components/form';
import { Alert, Col, Divider, message, Row, Space } from 'antd';
import { defaultDateTimeFormat } from '@/configs';
import { catchApolloError, checkApolloRequestErrors, sleep, string_to_slug } from '@/lib/utill';
import { Button, DevBlock } from '@/components';

import EDIT_DATA from '@/graphql/app_pages/scheduleAppPage.graphql'

function AppScheduleEditForm({ onCancel, onUpdate, initialValues={} }: { onCancel: ()=>void, onUpdate: (args:any)=>void }) {
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)
    const form = useForm()

    const [scheduleAppPage, update_details] = useMutation<any>(EDIT_DATA); // { data, loading, error }

    const saveSettings = async() => {
        const values:any = form.getState().values;
        if (!values.scheduled_from || !values.scheduled_to) {
            alert("Please prodivde schedule dates")
            return;
        }

        setError(null)
        setBusy(true)

        const input = {
            _id: values._id,
            scheduled_from: values.scheduled_from,
            scheduled_to: values.scheduled_to,
        }
        // return setBusy(false)
        
        let results = await scheduleAppPage({ variables: { input } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.scheduleAppPage }))
            .catch(catchApolloError)
        
        setBusy(false)
        if (results.error) {
            setError(results.error.message);
            return false;
        }
        else {
            message.success("Settings updated");
            onUpdate(results)
        }

        return false;
    }

    let values = form.getState().values;

    // return (<div>
    //     <FinalForm onSubmit={console.log} initialValues={initialValues}
    //         render={(formargs) => {
    //             const { handleSubmit, submitting, form, values, invalid, errors, submitFailed, dirty } = formargs;

    //             return (<>
    //                 {error && <Alert title="Error!" description={error} type="error" showIcon />}

    //                 <Row>
    //                     <Col flex="12"><FormField name="scheduled_from" label="From" type="date" validate={rules.required} showTime format={defaultDateTimeFormat} /></Col>
    //                     <Col flex="12"><FormField name="scheduled_to" label="To" type="date" validate={rules.required} showTime format={defaultDateTimeFormat} /></Col>
    //                 </Row>

    //                 <hr />

    //                 <Row>
    //                     <Col flex="auto"><Button onClick={onCancel} disabled={busy}>Cancel</Button></Col>
    //                     <Col>
    //                         <SubmitButton loading={submitting}>Save</SubmitButton>
    //                         {/* <Button loading={busy} onClick={saveSettings} color="orange">Save</Button> */}
    //                     </Col>
    //                 </Row>
    //             </>)
    //         }}
    //     />

    // </div>)



    return (<div>
        {error && <Alert title="Error!" description={error} type="error" showIcon />}

        <Space orientation="vertical" size={8} style={{ width: '100%' }}>
            <FormField name="scheduled_from" label="From" type="date" validate={rules.required} showTime format={defaultDateTimeFormat} style={{ width: '100%' }} />
            <FormField name="scheduled_to" label="To" type="date" validate={rules.required} showTime format={defaultDateTimeFormat} style={{ width: '100%' }} />
        </Space>

        <hr />

        <Row>
            <Col flex="auto"><Button onClick={onCancel} disabled={busy}>Cancel</Button></Col>
            <Col><Button loading={busy} onClick={saveSettings} color="orange">Save</Button></Col>
        </Row>

        <DevBlock obj={{ 
            scheduled_from: values && values?.scheduled_from,
            scheduled_to: values && values?.scheduled_to
        }} />
        
    </div>)
}

export default AppScheduleEditForm;
