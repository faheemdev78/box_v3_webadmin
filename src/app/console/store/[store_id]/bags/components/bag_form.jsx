'use client'
import PropTypes from 'prop-types';
import { DevBlock } from '@/components'
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { FormField, SubmitButton, rules, submitHandler } from '@/components/form';
import { message, Row, Col, Modal } from 'antd';
import { useLazyQuery, useMutation, useSubscription } from '@apollo/client/react';
import { __error } from '@/lib/consoleHelper';
import { checkApolloRequestErrors, catchApolloError } from '@/lib/utill_apollo';
import { activeStatus } from '@/configs'

import RECORD_ADD from '@/graphql/bags/addBag.graphql';
import RECORD_EDIT from '@/graphql/bags/editBag.graphql';

const defaultFields = { status: activeStatus.active };

function FormComp({ initialValues = defaultFields, onSuccess, store, ...props }) {
    const [addBag, add_details] = useMutation(RECORD_ADD); // { data, loading, error }
    const [editBag, edit_details] = useMutation(RECORD_EDIT); // { data, loading, error }

    const onSubmit = async (_values) => {
        let values = { ..._values }

        let input = {
            barcode: values.barcode,
            size: values.size,
            qty: values.qty,
            price: values.price,
            status: values.status,
            _id_store: store._id
        };

        var results;

        if (initialValues._id) {
            Object.assign(input, { _id: initialValues._id })
            
            results = await editBag({ variables: { input } })
                .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.editBag }))
                .catch(catchApolloError)
        } else {
            Object.assign(input, { _id_store: store._id, })

            results = await addBag({ variables: { input } })
                .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.addBag }))
                .catch(catchApolloError)
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
                    {/* {error && <Alert title="Error" description={error} showIcon type='error' />} */}
                    <form id="BagsForm" {...submitHandler(formargs)}>

                        <Row gutter={[10, 10]}>
                            <Col span={12}><FormField type="text" name="barcode" label="Barcode" validate={rules.required} /></Col>
                            <Col span={12}><FormField type="text" name="size" label="Size" validate={[rules.required, rules.minChar(2)]} /></Col>
                            <Col span={8}><FormField type="number" name="qty" label="Qty" validate={[rules.required ]} /></Col>
                            <Col span={8}><FormField type="number" name="price" label="Price" validate={[rules.required ]} /></Col>
                            <Col span={8}><FormField type="select" options={activeStatus} name="status" label="Status" validate={rules.required} /></Col>

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

const WithDrawer = ({ store, open, initialValues, onClose, ...props }) => {
    return (<Modal 
        width={"500px"} 
        open={open} 
        destroyOnHidden
        maskClosable={false} 
        placement="right"
        onCancel={onClose}
        title={`${(initialValues && initialValues._id) ? 'Edit' : 'Add'} Bag`}
        footer={false}
    >
        {open && <FormComp store={store} initialValues={initialValues} onSuccess={onClose} {...props} />}
    </Modal>)
}
export default WithDrawer;
