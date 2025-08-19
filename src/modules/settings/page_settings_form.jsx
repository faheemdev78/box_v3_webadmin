import React, { Component, useState, useEffect } from 'react'
import PropTypes from 'prop-types';
import { Drawer, Button, Heading, Icon, Loader, Avatar, IconButton, DevBlock, BannerSelection } from '@/components'
import { FormComponent } from '@/components/form'
import { FormField, FormFieldGroup, SubmitButton, rules, submitHandler } from '@_/components/form';
import { message, Row, Col } from 'antd';
import { useLazyQuery, useMutation, useSubscription } from '@apollo/client';
import { pageOptionsArray } from '@_/configs';
import { __error } from '@_/lib/consoleHelper';
import ProductSelector from './ProductSelector'
import { FieldArray } from 'react-final-form-arrays'
import arrayMutators from 'final-form-arrays'

import RECORD from '@_/graphql/page_settings/page_setting.graphql';
import RECORD_EDIT from '@_/graphql/page_settings/edit.graphql';


const setProduct = (newValueArray, state, tools) => {
    let _target = newValueArray[0];
    let key = _target.key;

    // setup prev values/
    let products = state.formState.values.products || [];
    let prev = products.find(o=>o.key==key) || {};
    let ids = prev.ids || [];// = state.formState.values.products && state.formState.values.products[key];
    let title = prev.title;
    let _products = prev.products || [];

    // update values
    if (_target.title) title = _target.title;
    // product actions
    if (_target.add_prod) {
        ids.push(_target.add_prod._id);
        _products.push(_target.add_prod);
    }
    if (_target.remove_prod) {
        ids = ids.filter(o => (o != _target.remove_prod._id))
        _products = _products.filter(o => o._id != _target.remove_prod._id);
    }

    let product = { ids, title, key, products: _products }

    // update master array 'products'
    let index = products.findIndex(o => o.key.search(key) > -1);
    if (index > -1) products[index] = product;
    else products.push(product)

    // update form field
    tools.changeValue(state, 'products', () => products)
}

const FormComp = props => {
    // const [ordersQuery, { called, loading, error, data }] = useLazyQuery(LIST_DATA);
    const [editPageSettings, edit_details] = useMutation(RECORD_EDIT);
    // const { data, loading } = useSubscription(QUERY_SUBSCRIPTION, { variables: { postID } });
    
    const [busy, setBusy] = useState(false)

    const onSubmit = async (values) => {
        const { pageSetting, onClose, fields } = props;
        if (!pageSetting._id){
            message.error("No ID to update")
            return false;
        }

        const input = { 
            _id: pageSetting._id, 
            banners: values?.banners?.map(o => ({...o, _id: Number(o._id) })),
            products: values?.products?.map(product=>({
                // ...product,
                ids: product?.ids?.map(oo=>Number(oo)), 
                key: product.key, 
                title: product.title
            }))
        }


        // if (values.products){
        //     Object.assign(input, {
        //         products: values.products.map(item => ({ ids: item.ids, key: item.key, title: item.title }))
        //     })
        // }

        setBusy(true)
        let resutls = await editPageSettings({ variables: { input } }).then((e) => (e?.data?.editPageSettings))
        .catch(error => {
            console.log(__error("Error: "), error)
            return { error: { message:"Query Error" } }
        });
        setBusy(false)

        if (!resutls || resutls?.error?.message){
            message.error((resutls && resutls?.error?.message) || "Invalid response!");
            return true;
        }

        message.success("Success");
        onClose(resutls);

        return false;
    }

    const { onClose, showform, pageSetting, loadingEditNode } = props;
    const pageOptions = pageOptionsArray[props?.fields?.key];

    return (<>
        <Drawer width={"500px"} destroyOnClose maskClosable={false} placement="right" visible={showform} onClose={onClose} bodyStyle={{ backgroundColor: "#f0f2f5", padding:0 }} title={`Edit Page Setting`}
            footer={<>
                <span></span>
                <Button loading={busy} disabled={loadingEditNode} type="primary" onClick={() => {
                    document.getElementById('PageSettingForm').dispatchEvent(new Event('submit', { cancelable: true }))
                }}>Save</Button>
            </>}
        >
            {loadingEditNode && <Loader loading={true} />}
            
            {(props.initialValues && showform && !loadingEditNode) && <>
                <FinalForm onSubmit={onSubmit} initialValues={props.initialValues}
                    mutators={{
                        ...arrayMutators,
                        setProduct: setProduct,

                        setBanners: (newValueArray, state, tools) => {
                            let _target = newValueArray[0];
                            let key = _target.key;
                            let _id = _target._id;

                            let banners = state.formState.values.banners || []; // setup prev values/
                            banners = banners.filter(o => o.key != key); // remove previous records/

                            // update values
                            let banner = { _id, key }
                            if (banner._id && banner._id != "null") banners.push(banner)

                            // update form field
                            tools.changeValue(state, 'banners', () => banners)
                            return;
                        },

                    }}
                    render={(formargs) => {
                        const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                        return (<>
                            {/* {error && <Alert message={error} showIcon type='error' />} */}
                            <form id="PageSettingForm" {...submitHandler(formargs)}>

                                {/* <FormField type="text" name="tooltip" label="Tooltip" validate={rules.required} /> */}
                                <div className="grid-block" style={{ margin: "0 0 10px 0" }}>
                                    <FormField disabled type="text" name="title" label="Title" validate={[rules.required, rules.minChar(4)]} />
                                </div>

                                <FieldArray name="banners">
                                    {({ fields }) => {
                                        return (<div className="grid-block" style={{ margin: "0 0 10px 0" }}>
                                            <Heading>Banners</Heading>

                                            {fields.map((name, index) => {
                                                let thisField = fields.value[index];

                                                return (<div key={index} style={{ borderBottom: "0px solid #EEE", padding: "0px", marginBottom: "15px" }}>
                                                    <FormField disabled type="hidden" name={`${name}.key`} style={{ border: "0px solid black", backgroundColor: "white", padding: 0, margin: 0 }} />
                                                    <BannerSelection label={thisField.key} preload allowClear name={`${name}._id`} />
                                                </div>)

                                            })}
                                        </div>)
                                    }}
                                </FieldArray>

                                {(pageOptions && pageOptions.products && pageOptions.products.length > 0) && <>
                                    <div className="grid-block" style={{ margin: "0 0 10px 0" }}>
                                        <Heading>Products</Heading>
                                        {pageOptions.products.map((item, i) => {
                                            let node = values?.products?.find(o => o.key == item) || {};

                                            let key = node.key;
                                            let title = node.title;
                                            let products = node.products;
                                            let ids = node.ids;

                                            return (<div key={i} style={{ marginBottom: "30px" }}>
                                                <ProductSelector values={values} label={item} name={`__products.${item}.ids`}
                                                    blockIds={ids}
                                                    onAddClick={(prod) => formProps.form.mutators.setProduct({ add_prod: prod, key: item })}
                                                >
                                                    <FormField type="text" name={`__products.${item}.title`} label="Title" defaultValue={title}
                                                        onChange={(e, callback) => {
                                                            formProps.form.mutators.setProduct({ title: e.target.value, key: item })
                                                            callback(e);
                                                        }}
                                                    />
                                                </ProductSelector>

                                                <div style={{ margin: "0 20px" }}>
                                                    {products && products.map((prod, i) => {
                                                        return (
                                                            <Row key={i} className="date-row" gutter={[15, 0]} style={{ flexWrap: "nowrap" }}>
                                                                <Col flex="30px"><Avatar size={40} shape="square" src={`${process.env.REACT_APP_DATA_URL}/${prod.picture_thumb}`} /></Col>
                                                                <Col flex="auto"><div style={{ flexWrap: "wrap", whiteSpace: "normal" }}>{prod.title}</div></Col>
                                                                <Col flex="20px"><IconButton icon="minus" onClick={() => formProps.form.mutators.setProduct({ remove_prod: prod, key: key })} /></Col>
                                                            </Row>
                                                        )
                                                    })}
                                                </div>

                                            </div>)
                                        })}
                                    </div>
                                </>}



                                <Row>
                                    <Col flex="auto"><Button onClick={onCancel} type="default">Cancel</Button></Col>
                                    <Col><SubmitButton loading={submitting}>Save</SubmitButton></Col>
                                </Row>

                                <DevBlock obj={values} title="values" />

                            </form>
                        </>)

                    }}
                />



                {/* <FormComponent onSubmit={onSubmit} id='PageSettingForm' fields={props.initialValues}
                    mutators={{
                        ...arrayMutators,
                        setProduct: setProduct,

                        setBanners: (newValueArray, state, tools) => {
                            let _target = newValueArray[0];
                            let key = _target.key;
                            let _id = _target._id;

                            // setup prev values/
                            let banners = state.formState.values.banners || [];
                            // remove previous records/
                            banners = banners.filter(o => o.key != key);

                            // update values
                            let banner = { _id, key }
                            if (banner._id && banner._id != "null") banners.push(banner)

                            // update form field
                            tools.changeValue(state, 'banners', () => banners)

                            return;
                        },

                    }}
                    form_render={formProps => {
                        const { values, submitting } = formProps;

                        return <>
                            <div className="grid-block" style={{ margin: "0 0 10px 0" }}>
                                <FormField disabled type="text" name="title" label="Title" validate={[rules.required, rules.minChar(4)]} />
                            </div>

                            <FieldArray name="banners">
                                {({ fields }) => {
                                    return (<div className="grid-block" style={{ margin: "0 0 10px 0" }}>
                                        <Heading>Banners</Heading>

                                        {fields.map((name, index) => {
                                            let thisField = fields.value[index];

                                            return (<div key={index} style={{ borderBottom: "0px solid #EEE", padding: "0px", marginBottom: "15px" }}>
                                                <FormField disabled type="hidden" name={`${name}.key`} style={{ border:"0px solid black", backgroundColor:"white", padding:0, margin:0 }} />
                                                <BannerSelection label={thisField.key} preload allowClear name={`${name}._id`} />
                                            </div>)

                                        })}
                                    </div>)
                                }}
                            </FieldArray>

                            {(pageOptions && pageOptions.products && pageOptions.products.length > 0) && <>
                                <div className="grid-block" style={{ margin: "0 0 10px 0" }}>
                                    <Heading>Products</Heading>
                                    {pageOptions.products.map((item, i) => {
                                        let node = values?.products?.find(o => o.key == item) || {};

                                        let key = node.key;
                                        let title = node.title;
                                        let products = node.products;
                                        let ids = node.ids;

                                        return (<div key={i} style={{ marginBottom: "30px" }}>
                                            <ProductSelector values={values} label={item} name={`__products.${item}.ids`} 
                                                blockIds={ids}
                                                onAddClick={(prod) => formProps.form.mutators.setProduct({ add_prod: prod, key: item })}
                                            >
                                                <FormField type="text" name={`__products.${item}.title`} label="Title" defaultValue={title}
                                                    onChange={(e, callback) => {
                                                        formProps.form.mutators.setProduct({ title: e.target.value, key: item })
                                                        callback(e);
                                                    }}
                                                />
                                            </ProductSelector>

                                            <div style={{ margin: "0 20px" }}>
                                                {products && products.map((prod, i) => {
                                                    return (
                                                        <Row key={i} className="date-row" gutter={[15, 0]} style={{ flexWrap: "nowrap" }}>
                                                            <Col flex="30px"><Avatar size={40} shape="square" src={`${process.env.REACT_APP_DATA_URL}/${prod.picture_thumb}`} /></Col>
                                                            <Col flex="auto"><div style={{ flexWrap: "wrap", whiteSpace: "normal" }}>{prod.title}</div></Col>
                                                            <Col flex="20px"><IconButton icon="minus" onClick={() => formProps.form.mutators.setProduct({ remove_prod: prod, key: key })} /></Col>
                                                        </Row>
                                                    )
                                                })}
                                            </div>

                                        </div>)
                                    })}
                                </div>
                            </>}

                            <DevBlock obj={values} />

                        </>
                    }}
                /> */}

            </>}                
        </Drawer>
    </>)

}
FormComp.propTypes = {
    onClose: PropTypes.func.isRequired,
    showform: PropTypes.bool.isRequired,
    fields: PropTypes.object,
    // agreement: PropTypes.object,
}

export const Wrapper = (props) => {
    const [get_pageSetting, { called, loading, error, data }] = useLazyQuery(RECORD);
    // const [changeUserPickupAllow, update_details] = useMutation(UPDATE_PICKUP_ALLOW);
    // const { data, loading } = useSubscription(QUERY_SUBSCRIPTION, { variables: { postID } });

    useEffect(() => {
        if (called || !props?.fields?._id) return;
        get_pageSetting({
            variables: { id: props.fields._id },
            fetchPolicy: "no-cache",
        })
    }, [props])

    var initialValues = false;
    if (data && data.pageSetting){
        initialValues = {
            ...data.pageSetting,
            banners: data?.pageSetting?.banners?.map(o => {
                let val = data?.pageSetting?.banners?.find(oo => (oo.key == o));
                return {
                    key: o,
                    _id: val ? val._id : undefined,
                    // ...pageSetting?.banners?.find(oo => (oo.key == o))
                }
            }),
        }
    }

    return (<FormComp
        {...props}
        loadingEditNode={loading}
        pageSetting={data && data.pageSetting}
        initialValues={initialValues}
    />)
}
export default Wrapper;
