'use client'
import React, { useState, useEffect } from 'react'
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { FormField, rules } from '@_/components/form';
import { useMutation } from '@apollo/client';
import { __error } from '@_/lib/consoleHelper';
import { Alert, Col, Divider, message, Row } from 'antd';
import { catchApolloError, checkApolloRequestErrors, sleep, string_to_slug } from '@_/lib/utill';
import { ComponentStyling } from './lib';
import { Button } from '@_/components';

import EDIT_DATA from '@_/graphql/app_pages/editAppPage.graphql'

function AppPageEditForm({ onUpdate, onCancel }: { onUpdate: Function, onCancel: Function }) {
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)
    const form = useForm()

    const [editAppPage, update_details] = useMutation(EDIT_DATA); // { data, loading, error }

    const saveSettings = async() => {
        setBusy(true)
        setError(null)
        let values = form.getState().values

        const input = {
            _id: values._id,
            title: values.title,
            slug: values.slug,
            description: values.description,
            p_limit: values.p_limit || 10
        }

        let styles = {};
        if (values?.styles?.background?.type) {
            Object.assign(styles, {
                background: {
                    type: values?.styles?.background?.type,
                    direction: values?.styles?.background?.direction,
                    color1: values?.styles?.background?.color1,
                    color2: values?.styles?.background?.color2,
                    image: {
                        name: values?.styles?.background?.image?.name,
                        url: values?.styles?.background?.image?.url,
                        thumb: values?.styles?.background?.image?.thumb,
                        type: values?.styles?.background?.image?.type,
                        width: values?.styles?.background?.image?.width,
                        height: values?.styles?.background?.image?.height,
                        size: values?.styles?.background?.image?.size,
                    }
                }
            })
        }
        if (values?.styles?.margins?.top) {
            Object.assign(styles, {
                margins: {
                    top: values?.styles?.margins?.top || 0,
                    right: values?.styles?.margins?.right || 0,
                    bottom: values?.styles?.margins?.bottom || 0,
                    left: values?.styles?.margins?.left || 0,
                }
            })
        }
        if (values?.styles?.padding?.top) {
            Object.assign(styles, {
                padding: {
                    top: values?.styles?.padding?.top || 0,
                    right: values?.styles?.padding?.right || 0,
                    bottom: values?.styles?.padding?.bottom || 0,
                    left: values?.styles?.padding?.left || 0,
                }
            })
        }
        if (Object.keys(styles).length > 0) Object.assign(input, { styles })


        let results = await editAppPage({ variables: { input } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.editAppPage }))
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


    return (<div>
        {/* <h1>{`Editing "${data?.page_type?.title}" Variant`}</h1> */}
        {error && <Alert message={error} type="error" showIcon />}

        <Row gutter={[20, 20]}>
            <Col span={12}>
                <Divider>Page Info</Divider>
                <FormField name="title" label="Page Title" type="text" validate={rules.required} />
                <FormField name="slug" label="Page Slug" type="text" placeholder={'section1/section2/section3'}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>, callback: (val: string) => void) => callback(string_to_slug(e.target.value, "/"))}
                    validate={rules.required} />
                <FormField name="description" label="Page Description" rows={2} type="textarea" />
                <FormField name="p_limit" label="Pagination Limit" type="number" validate={rules.required} />
            </Col>
            <Col span={12}>
                <ComponentStyling name="" showHeading={false} />
            </Col>
        </Row>

        <hr />
        <Row>
            <Col flex="auto"><Button onClick={() => onCancel()} disabled={busy}>Cancel</Button></Col>
            <Col><Button loading={busy} onClick={saveSettings} color="orange">Save</Button></Col>
        </Row>
    </div>)

    // return <PageSettings data={data} onUpdate={onPageSettingsUpdate} />
}

export default AppPageEditForm
