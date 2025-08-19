import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types';
import { Drawer, Button, Heading, Icon, Loader, DevBlock } from '@/components'
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField } from '@_/components/form';
// import { rules, composeValidators, FormField, FormFieldGroup, FormComponent, UploadField } from '@/components/form'
import { message, Row, Col, Modal } from 'antd';
import { useLazyQuery, useMutation, useSubscription } from '@apollo/client';
import { basketCategories } from '@_/configs';
import { __error } from '@_/lib/consoleHelper';

import RECORD_ADD from '@_/graphql/baskets/addBasket.graphql';
import RECORD_EDIT from '@_/graphql/baskets/editBasket.graphql';
import { checkApolloRequestErrors } from '@_/lib/utill_apollo';

const defaultFields = { status: "disabled" };

function FormComp({ initialValues = defaultFields, onSuccess, store, ...props }) {
    const [addBasket, add_details] = useMutation(RECORD_ADD); // { data, loading, error }
    const [editBasket, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }
    
    const onSubmit = async (_values) => {
        let values = { ..._values }

        let input = {
            title: values.title,
            barcode: values.barcode,
            color: values.color,
            category: values.category,
        };

        var results;

        if (initialValues._id) {
            Object.assign(input, { _id: initialValues._id })
            
            results = await editBasket({ variables: { input } })
                .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.editBasket }))
            .catch(error => {
                console.log(error);
                return { error:{ message: "Request Error!" } }
            });
        } else {
            Object.assign(input, { _id_store: store._id, })

            results = await addBasket({ variables: { input } }).then((r) => (r?.data?.addBasket))
            .catch(error => {
                console.log(error);
                return { error: { message: "Request Error!" } }
            });
        }

        if (!results || results.error){
            message.error((results && results?.error?.message) || "Invalid response!")
            return false;
        }

        onSuccess(results)
    }

    return (
        <FinalForm onSubmit={onSubmit} initialValues={initialValues}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                return (<>
                    {/* {error && <Alert message={error} showIcon type='error' />} */}
                    <form id="BasketForm" {...submitHandler(formargs)}>

                        <Row gutter={[10, 10]}>
                            <Col span={24}><FormField type="text" name="title" label="Title" validate={rules.required} /></Col>
                            <Col span={10}><FormField type="text" name="color" label="Color (#FFFFFF)" validate={[rules.required, rules.minChar(7)]} /></Col>
                            <Col span={14}><FormField type="select" options={basketCategories} name="category" label="Category" validate={rules.required} /></Col>

                            <Col span={24} align="right"><SubmitButton loading={submitting} label={'Save'} /></Col>
                        </Row>

                        <DevBlock obj={values} title="values" />

                    </form>
                </>)

            }}
        />
    )
}
FormComp.propTypes = {
    initialValues: PropTypes.object,
    store: PropTypes.object.isRequired,
    onSuccess: PropTypes.func.isRequired,
}

const WithDrawer = ({ store, open, initialValues, onClose }) => {
    return (<Modal 
        width={"500px"} 
        open={open} 
        destroyOnHidden
        maskClosable={false} 
        placement="right"
        onCancel={onClose}
        title={`${(initialValues && initialValues._id) ? 'Edit' : 'Add'} Basket`}
        footer={false}
    >
        {open && <FormComp store={store} initialValues={initialValues} onSuccess={onClose} />}
    </Modal>)
}
export default WithDrawer;
