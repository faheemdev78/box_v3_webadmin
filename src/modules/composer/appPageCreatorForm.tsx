'use client'
import React, { useState, useEffect } from 'react'
// import { Form as FinalForm, Field as FinalField } from 'react-final-form';
// import { FieldArray } from 'react-final-form-arrays'
// import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton } from '@/components/form';
import { useMutation } from '@apollo/client/react';
import { __error } from '@/lib/consoleHelper';
import { Alert, message } from 'antd';
import { useRouter } from 'next/navigation';
// import { PageTypeSelection, PageSettings, SideMenu, PropsWindow } from './';
import { PageTypeSelection } from './pageTypeSelection';
import { PageSettings } from './pageSettings';
import { adminRoot } from '@/configs';
import { catchApolloError, checkApolloRequestErrors } from "@/lib/utill";

import ADD_DATA from '@/graphql/app_pages/addAppPage.graphql'



function AppPageCreatorForm({ onClose }: { onClose:Function }) {
    const [data, setData] = useState<{ page_type?: any }>({})
    const router = useRouter()

    const [addAppPage, add_details] = useMutation(ADD_DATA); // { data, loading, error }

    const onPageTypeUpdate = (page_type: any) => setData({ ...data, page_type });

    const onPageSettingsUpdate = async (values:any) => {
        const input = {
            title: values.title,
            slug: values.slug,
            description: values.description,
            page_type: {
                title: values.page_type.title,
                type: values.page_type.type
            },
            p_limit: values.p_limit || 50
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

        let results = await addAppPage({ variables: { input } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr: any) => rr?.data?.addAppPage }))
            .catch(catchApolloError)

        if (results.error){
            message.error(results.error.message)
        }
        else {
            message.success("Page Created");
            router.push(`${adminRoot}/composer/editPage/${results._id}`)
            onClose()
        }

        return results;
    }


    if (!data.page_type) return <PageTypeSelection onUpdate={onPageTypeUpdate} />

    return <PageSettings initialValues={data} onUpdate={onPageSettingsUpdate} />
}

export default AppPageCreatorForm
