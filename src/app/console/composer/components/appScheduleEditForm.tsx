import React, { useState, useEffect } from 'react'
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { useMutation } from '@apollo/client/react';
import { __error } from '@_/lib/consoleHelper';
import { FormField, rules } from '@_/components/form';
import { Alert, Col, Divider, message, Row, Space } from 'antd';
import { catchApolloError, checkApolloRequestErrors, sleep, string_to_slug } from '@_/lib/utill';
import { Button, DevBlock } from '@_/components';

import EDIT_DATA from '@_/graphql/app_pages/scheduleAppPage.graphql'

function AppScheduleEditForm({ onCancel, onUpdate }: { onCancel: ()=>void, onUpdate: (args:any)=>void }) {
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)
    const form = useForm()

    const [scheduleAppPage, update_details] = useMutation<any>(EDIT_DATA); // { data, loading, error }

    const saveSettings = async() => {
        setBusy(true)
        setError(null)
        const values:any = form.getState().values

        const input = {
            _id: values._id,
            scheduled_from: values.scheduled_from,
            scheduled_to: values.scheduled_to,
        }
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
    

    let values = form.getState().values

    return (<div>
        {error && <Alert message={error} type="error" showIcon />}
        {/* <Divider>Schedule Date</Divider> */}

        <Space>
            <FormField name="scheduled_from" label="From" type="date" validate={rules.required} />
            <FormField name="scheduled_to" label="To" type="date" validate={rules.required} />
        </Space>

        <hr />

        <Row>
            <Col flex="auto"><Button onClick={onCancel} disabled={busy}>Cancel</Button></Col>
            <Col><Button loading={busy} onClick={saveSettings} color="orange">Save</Button></Col>
        </Row>

        <DevBlock obj={values} />
        
    </div>)
}

export default AppScheduleEditForm;
