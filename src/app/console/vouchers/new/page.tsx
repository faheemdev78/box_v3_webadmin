// 'use client'
// import React, { useEffect, useState } from 'react'
// import { Drawer, Button, Heading, Icon, Loader, DevBlock, IconButton } from '@/components'
// import { message, Row, Col, Modal, Divider, Space, Card, Alert } from 'antd';
// import { useLazyQuery, useMutation, useSubscription } from '@apollo/client/react';
// import { adminRoot, basketCategories } from '@_/configs';
// import { __error } from '@_/lib/consoleHelper';
// import { catchApolloError, checkApolloRequestErrors } from '@_/lib/utill_apollo';
// import { Page } from '@_/template';
// import { dateToUtc } from '@_/lib/utill';
// import { useAppSelector } from '@_/rStore/hooks';
// import { getSettings } from '@_/rStore/slices/systemSlice';
// import { useRouter } from 'next/navigation';

// import { Form as FinalForm, Field, useForm } from 'react-final-form';
// import arrayMutators from "final-form-arrays";
// import { FieldArray } from "react-final-form-arrays";
// import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField } from '@_/components/form';

// import ADD_RECORD from '@_/graphql/vouchers/addVoucher.graphql'
// import EDIT_RECORD from '@_/graphql/vouchers/editVoucher.graphql'


// const defaultFields = { status: "offline" };

// // function NewVoucher({ initialValues = defaultFields, onSuccess, store }: {
// function NewVoucher() {
//     // console.log("props: ", props)
//     const [addVoucher, add_details] = useMutation(ADD_RECORD); // { data, loading, error }
//     const [editVoucher, edit_details] = useMutation(EDIT_RECORD); // { data, loading, error }

//     const router = useRouter()

//     const [error, setError] = useState(null)

//     const settings = useAppSelector(getSettings);
    
//     const onSubmit = async (values) => {
//         setError(null);

//         let input = {
//             title: values.title,
//             code: values.code,
//             description: values.description,
            
//             type: values.type,
//             status: values.status,
            
//             value: values.value,
//             maxDiscount: values.maxDiscount,
//             minSpend: values.minSpend,
            
//             appliesTo: values.appliesTo && {
//                 scope: values.appliesTo.scope,
//                 productIds: values?.appliesTo?.products?.map(o => (o._id)),
//                 categoryIds: values?.appliesTo?.categories?.map(o => (o._id)),
//                 storeIds: values?.appliesTo?.stores?.map(o => (o._id)),
//             },
//             excludes: values.excludes && {
//                 productIds: values?.excludes?.products?.map(o => (o._id)),
//                 categoryIds: values?.excludes?.categories?.map(o => (o._id)),
//                 storeIds: values?.excludes?.stores?.map(o => (o._id)),
//             },
            
//             bogo: values.bogo && {
//                 buyQty: values.bogo.buyQty,
//                 getQty: values.bogo.getQty,
//                 freeProductIds: values?.bogo?.products?.map(o => (o._id)),
//             },
//             tiered: values?.tiered?.map(o => ({
//                 minSpend: o.minSpend,
//                 discountValue: o.discountValue,
//                 type: o.type,
//             })),
            
//             startDate: dateToUtc(values.startDate, { tz: settings.timezone }),
//             endDate: dateToUtc(values.endDate, { tz: settings.timezone }),
//             usageLimit: values.usageLimit,
//             perCustomerLimit: values.perCustomerLimit,
//         };

//         var results;

//         if (initialValues._id) {
//             Object.assign(input, { _id: initialValues._id })
            
//             results = await editVoucher({ variables: { input } })
//                 .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.editVoucher }))
//                 .catch(catchApolloError)
//         } else {
//             results = await addVoucher({ variables: { input } })
//                 .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.addVoucher }))
//                 .catch(catchApolloError)
//         }

//         if (results.error){
//             message.error(results.error.message)
//             setError(results.error.message);
//             return false;
//         }

//         message.success("Saved")
//         if (onSuccess) onSuccess(results)
//         else router.push(`${adminRoot}/vouchers`)
//     }

//     return (<>
//         <Page>
//             <FinalForm onSubmit={onSubmit} 
//                 initialValues={initialValues}
//                 mutators={{ ...arrayMutators }}
//                 render={(formargs:any) => {
//                     const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

//                     // form: {
//                     //     mutators: { push, remove }
//                     // }

//                     return (<>
//                         <form id="VoucherForm" {...submitHandler(formargs)} style={{ width: "500px" }}><Space direction="vertical" style={{ width:"100%" }}>
//                             {error && <Alert type="error" message={error} showIcon />}

//                             <Row gutter={[10, 10]}>
//                                 <Col span={12}><FormField type="text" name="title" label="Title" validate={rules.required} /></Col>
//                                 <Col span={12}><FormField type="text" name="code" label="Code" validate={rules.required} /></Col>
//                             </Row>
//                             <FormField type="text" name="description" label="Description" />

//                             <Row gutter={[10, 10]}>
//                                 <Col span={12}><FormField
//                                     options={[
//                                         { value: 'percentage', label: 'Percentage' },
//                                         { value: 'fixed', label: 'Fixed' },
//                                         { value: 'free_shipping', label: 'Free Shipping' },
//                                         { value: 'bogo', label: 'Buy 1 Get 1' },
//                                         { value: 'tiered', label: 'Tiered' },
//                                     ]}
//                                     type="select" name="type" label="Type" validate={rules.required}
//                                 /></Col>
//                                 <Col span={12}><FormField
//                                     options={[
//                                         { value: 'online', label: 'Online' },
//                                         { value: 'offline', label: 'Offline' },
//                                     ]}
//                                     type="select" name="status" label="Status" validate={rules.required}
//                                 /></Col>
//                             </Row>

//                             {/* Type-specific fields */}
//                             {["percentage", "fixed"].includes(values.type) && (<Card>
//                                 <Space>
//                                     <FormField type="number" name="value" label="Value" />
//                                     <FormField type="number" name="maxDiscount" label="Max Discount" />
//                                 </Space>
//                                 {/* <Row gutter={[10, 10]}>
//                                     <Col span={12}><FormField type="number" name="value" label="Value" /></Col>
//                                     <Col span={12}><FormField type="number" name="maxDiscount" label="Max Discount" /></Col>
//                                 </Row> */}
//                             </Card>)}
                            
//                             {values.type === "bogo" && (<Card>
//                                 <Divider>Bogo Settings</Divider>
//                                 <Row gutter={[10, 10]}>
//                                     <Col span={12}><FormField type="number" name="bogo.buyQty" label="Buy Qty" /></Col>
//                                     <Col span={12}><FormField type="number" name="bogo.getQty" label="Get Qty" /></Col>
//                                 </Row>
//                                 <Col span={12}>
//                                     <p>Free Product IDs (comma separated)</p>
//                                     <h3>freeProductIds</h3>
//                                     {/* <FormField type="number" name="bogo.freeProductIds" label="Free Products" placeholder="productId1,productId2" /> */}
//                                 </Col>
//                             </Card>)}

//                             {values.type === "tiered" && (<Card>
//                                 <Divider>Tiered Discounts</Divider>
//                                 <FieldArray name="tiered">
//                                     {({ fields }) => (<div>
//                                         {fields.map((name, index) => (
//                                             <Row key={name} gutter={[5]}>
//                                                 <Col span={6}><FormField type="number" name={`${name}.minSpend`} label="Min Spend" /></Col>
//                                                 <Col span={6}><FormField type="number" name={`${name}.discountValue`} label="Discount" /></Col>
//                                                 <Col span={8}><FormField
//                                                     options={[
//                                                         { value: 'percentage', label: 'Percentage' },
//                                                         { value: 'fixed', label: '%' },
//                                                     ]}
//                                                     type="select" name={`${name}.type`} label="Type" validate={rules.required}
//                                                 /></Col>
//                                                 <Col style={{ paddingTop:"22px" }}><IconButton onClick={() => fields.remove(index)} icon="close" /></Col>
//                                             </Row>
//                                         ))}
//                                         <div align="center" style={{ paddingTop:"10px" }}><Button onClick={() => fields.push({})}>➕ Add Tier</Button></div>
//                                     </div>)}
//                                 </FieldArray>
//                             </Card>)}
                            
//                             {/* Applies To */}
//                             <Card>
//                                 <Divider>Applies To</Divider>
//                                 <FormField
//                                     type="select" name="appliesTo.scope" label="Applies To" validate={rules.required}
//                                     options={[
//                                         { value: 'all', label: 'All' },
//                                         { value: 'products', label: 'Products' },
//                                         { value: 'categories', label: 'Categories' },
//                                         { value: 'stores', label: 'Stores' },
//                                     ]}
//                                 />
//                                 {values.appliesTo?.scope === "products" && (
//                                     <FormField type="text" name="appliesTo.productIds" label="Products" placeholder="Comma separated product IDs" />
//                                 )}
//                                 {values.appliesTo?.scope === "categories" && (
//                                     <FormField type="text" name="appliesTo.categoryIds" label="Categories" placeholder="Comma separated category IDs" />
//                                 )}
//                                 {values.appliesTo?.scope === "stores" && (
//                                     <FormField type="text" name="appliesTo.storeIds" label="Stores" placeholder="Comma separated store IDs" />
//                                 )}
//                             </Card>
//                             <Card>
//                                 <Divider>Exclude</Divider>
//                                 <FormField type="text" name="excludes.productIds" label="Products" placeholder="Comma separated product IDs" />
//                                 <FormField type="text" name="excludes.categoryIds" label="Categories" placeholder="Comma separated category IDs" />
//                                 <FormField type="text" name="excludes.storeIds" label="Stores" placeholder="Comma separated store IDs" />
//                             </Card>

//                             {/* General rules */}
//                             <Card>
//                                 <Space>
//                                     <FormField type="date" name="startDate" label="Start Date" validate={rules.required} />
//                                     <FormField type="date" name="endDate" label="End Date" validate={rules.required} />
//                                 </Space>
//                                 <Space>
//                                     <FormField type="number" name="minSpend" label="Min Spend" compact />
//                                     <FormField type="number" name="usageLimit" label="Usage Limit" compact />
//                                     <FormField type="number" name="perCustomerLimit" label="Per Customer Limit" compact />
//                                 </Space>
//                             </Card>

//                             <div align="right"><SubmitButton loading={submitting} label={'Save'} /></div>

//                         </Space></form>

//                         <DevBlock obj={values} title="values" />
//                     </>)
//                 }}
//             />


//         </Page>
//     </>)

// }

// export default NewVoucher
export default function NewVoucher(){}

