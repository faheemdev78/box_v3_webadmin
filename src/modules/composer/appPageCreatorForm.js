'use client'
import React, { useState, useEffect } from 'react'
import { Form as FinalForm, Field as FinalField } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton } from '@_/components/form';
import { useMutation } from '@apollo/client';
import { __error } from '@_/lib/consoleHelper';
import { Alert, message } from 'antd';
import { useRouter } from 'next/navigation';
// import { PageTypeSelection, PageSettings, SideMenu, PropsWindow } from './';
import { PageTypeSelection } from './pageTypeSelection';
import { PageSettings } from './pageSettings';
import { adminRoot } from '@_/configs';

import ADD_DATA from '@_/graphql/app_pages/addAppPage.graphql'



export default function AppPageCreatorForm() {
    const [error, setError] = useState(null)
    const [busy, setBusy] = useState(false)
    const [data, setData] = useState({})
    const router = useRouter()

    const [addAppPage, add_details] = useMutation(ADD_DATA); // { data, loading, error }

    const onPageTypeUpdate = (page_type) => setData({ ...data, page_type });

    const onPageSettingsUpdate = async (values) => {
        setBusy(true);
        setError(null);

        const input = {
            title: values.title,
            slug: values.slug,
            description: values.description,
            page_type: {
                title: values.page_type.title,
                type: values.page_type.type
            },
            styles: {
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
                },
                margins: {
                    top: values?.styles?.margins?.top || 0,
                    right: values?.styles?.margins?.right || 0,
                    bottom: values?.styles?.margins?.bottom || 0,
                    left: values?.styles?.margins?.left || 0,
                },
                padding: {
                    top: values?.styles?.padding?.top || 0,
                    right: values?.styles?.padding?.right || 0,
                    bottom: values?.styles?.padding?.bottom || 0,
                    left: values?.styles?.padding?.left || 0,
                }
            },
            p_limit: values.p_limit || 50
        }

        let results = await addAppPage({ variables: { input } }).then(r => (r?.data?.addAppPage))
            .catch(err => {
                console.log(__error("Error: "), err)
                return { error: { message: "Unable to complete your request at the moment." } }
            })

        // console.log("results: ", results)
        if (results.error){
            setError(results.error.message);
            setBusy(false);
        }
        else {
            message.success("Page Created");
            router.push(`${adminRoot}/composer/editPage/${results._id}`)
        }

        return false;
    }


    if (!data.page_type) return <>
        <PageTypeSelection data={data} onUpdate={onPageTypeUpdate} />
    </>

    return <PageSettings data={data} onUpdate={onPageSettingsUpdate} />
}
