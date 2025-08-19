'use client'
import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types';
import { Button, DevBlock, Drawer, Icon, IconButton, Loader, StatusTag, Image, Thumbnail, usePageProps } from '@_/components';
import { message, Row, Col, Card, Divider, Tag, Alert, Space } from 'antd';
import { adminRoot, publishStatus } from '@_/configs';
import { __error, __yellow } from '@_/lib/consoleHelper';
import { useMutation, useLazyQuery } from '@apollo/client';
import { Label as FormLabel } from '@_/components/form';
import { ProductWrapper, ProdItendityForm, ProdVitalInfoForm, ProdLimitsForm, ProductsList, ProdDetailsForm, ProdVariationForm, 
    ProdSEODataForm, ProdStorePropsForm, ProdExtraFieldsForm, ProdCategoriesFieldsForm, ProdImagesDataForm, 
    ProductImageManager} from "@_/modules/products";
import { useRouter } from 'next/navigation';
import security from '@_/lib/security';
// import Image from 'next/image';




import GET_VARIENTS from '@_/graphql/product/products.graphql';

const Label = ({ children, style }) => (<FormLabel style={{ marginTop: "7px", ...style }}>{children}</FormLabel>)

export function ProductView({ session, store, refresh, ...props }) {
    const [initialValues, set_initialValues] = useState(props.initialValues)
    const [variations, set_variations] = useState([])
    const [editMode, set_editMode] = useState(false)
    const reouter = useRouter();

    const isStoreUser = !!(session?.user?.store?._id);
    const canEdit = security.verifyRole('104.4', session.user.permissions);
    const canEditStore = isStoreUser && security.verifyRole('104.4', session.user.permissions);
    const canReinitilize = security.verifyRole('104.7', session.user.permissions);

    const [get_varients, { loading, data, called }] = useLazyQuery(GET_VARIENTS);

    useEffect(() => {
        if (!initialValues) return; // skip this for the frist time
        set_initialValues(props.initialValues)
    }, [props.initialValues])

    useEffect(() => {
        if (initialValues && initialValues._id) set_initialValues(initialValues)
        if (!initialValues || !initialValues._id || loading || called) return;
        fetchVarients();
    }, [initialValues])

    if (!session || !session?.user?._id) return <Alert message="Invalid session provided" showIcon type='error' />
    if (isStoreUser && String(session?.user?.store?._id) !== String(store._id)) return <Alert message="Unauthorized Store Access" showIcon type='error' />


    async function fetchVarients(){
        let resutls = await get_varients({ variables: { filter: JSON.stringify({ _id_parent: initialValues._id }) } })
            .then(r => (r?.data?.products))
            .catch(err => {
                console.log(__error("Error: "), err)
                return { error: { message: "Unable to fetch varients" } }
            })

        if (resutls && resutls.error) {
            message.error(resutls.error.message);
            return;
        }
        set_variations(resutls)
    }

    async function canReinitilizeStoreProduct(){
        alert("Product not initilized for store")
    }

    const drawerProps = {
        onClose: () => set_editMode(false),
        placement: 'right',
        destroyOnHidden: true,
        width: "500px",
        footer: <p>Hello world</p>
    }



    return (<>
        <Row className='nowrap' style={{ border: "0px solid black", minHeight: "100%" }}>
            <Col flex="300px">
                <Divider>Picture</Divider>

                <Divider>Categories {security.verifyModule('104.6', session.user.permissions) && <IconButton onClick={() => set_editMode('editCategories')} icon="pen" size="small" />} </Divider>
                <div style={{ marginLeft: "10px" }}>
                    {initialValues?.categories?.map((item, i) => (<div key={i}>- {item.title}</div>))}
                </div>

                {/* {!initialValues?.store?._id ? <Alert message="No Store Found" showIcon type='warning' /> : <>
                    <Divider>{initialValues?.store?.store_title}</Divider>
                </>} */}

            </Col>

            <Col flex="auto"><Space style={{ width:"100%"}} direction='vertical'>

                {initialValues.status == 'offline' && <Alert message="This product is globally offline" showIcon type='warning' />}

                {(store && store._id) && <>
                    <Card style={{ padding:0 }} styles={{  body: { padding: 0 } }}>
                        <Divider style={{ fontWeight: "bold", fontSize: "18px" }}><Space>
                            <span>Store Props {` `}</span>
                            {(canEditStore && initialValues?.store?._id) && <>
                                <IconButton onClick={() => set_editMode('editStoreProps')} icon="pen" size="small" />
                                {canReinitilize && <Button color="blue" onClick={canReinitilizeStoreProduct}>Configure store now</Button>}
                            </>}
                        </Space></Divider>
                        <div style={{ padding:"0 20px 20px 20px" }}>
                            {!initialValues?.store?._id && <Alert
                                message={<Space><span>Store not configured yet</span> <Button onClick={() => set_editMode('editStoreProps')} color="blue" size="small">Configure now</Button></Space>}
                                type='warning'
                                showIcon
                            />}
                            <Row gutter={[10, 20]} align="middle">
                                <Col span={8} align="right"><Label>Price was</Label></Col>
                                <Col span={16}>{initialValues?.store?.price_was}</Col>
                                <Col span={8} align="right"><Label>Price</Label></Col>
                                <Col span={16}>{initialValues?.store?.price}</Col>
                                <Col span={8} align="right"><Label>Status</Label></Col>
                                <Col span={16}><StatusTag value={initialValues?.store?.store_status} /></Col>
                                <Col span={8} align="right"><Label>Available Qty.</Label></Col>
                                <Col span={16}>{initialValues?.store?.available_qty}</Col>
                                <Col span={8} align="right"><Label>Reserved Qty.</Label></Col>
                                <Col span={16}>{initialValues?.store?.reserved_qty}</Col>
                            </Row>
                        </div>
                    </Card>
                </>}

                <Card style={{ backgroundColor: !isStoreUser ? "#FFFFFF" : "#EEEEEE", padding: 0 }} styles={{ body: { padding: 0 } }}><Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Product Identity {(canEdit && !isStoreUser) && <IconButton onClick={() => set_editMode('editIdentity')} size="small" icon="pen" />} </Divider>
                    <div style={{ padding: "0 20px 20px 20px" }}>
                        <Row gutter={[10, 20]} align="top">
                            <Col span={8} align="right"><Label>Product Name</Label></Col>
                            <Col span={16}>{initialValues.title}</Col>
                            <Col span={8} align="right"><Label>Slug</Label></Col>
                            <Col span={16}>{initialValues.slug}</Col>
                            <Col span={8} align="right"><Label>Brand Name</Label></Col>
                            <Col span={16}>
                                {initialValues.no_brand ? "This product does not have a brand name" : initialValues?.brand?.title}
                            </Col>
                            <Col span={8} align="right"><Label>Barcode</Label></Col>
                            <Col span={16}>
                                {initialValues.no_barcode ? "I don't have a product barcode" : initialValues.barcode}
                            </Col>
                        </Row>
                    </div>
                </Card>

                <Card style={{ backgroundColor: !isStoreUser ? "#FFFFFF" : "#EEEEEE", padding: 0 }} styles={{ body: { padding: 0 } }}><Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Vital Info {(canEdit && !isStoreUser) && <IconButton onClick={() => set_editMode('editVitalInfo')} size="small" icon="pen" />}</Divider>
                    <div style={{ padding: "0 20px 20px 20px" }}>
                        <Row gutter={[10, 20]} align="top">
                            <Col span={8} align="right"><Label style={{ margin: 0 }}>Is product expirable?</Label></Col>
                            <Col span={16}>{initialValues.is_expirable ? "YES" : "NO"}</Col>

                            <Col span={8} align="right"><Label style={{ margin: 0 }}>Country/Regin or Origin</Label></Col>
                            <Col span={16}>{initialValues.origon}</Col>

                            <Col span={8} align="right"><Label style={{ margin: 0 }}>Attribute</Label></Col>
                            <Col span={16}>{initialValues?.attribute?.map((item, i) => {
                                return <Tag key={i}>{`${item.title}: ${item.val}`}</Tag>
                            })}</Col>
                            <Col span={8} align="right"><Label style={{ margin: 0 }}>Is this item temperature sensitive?</Label></Col>
                            <Col span={16}>{initialValues.is_temp_sensitive ? "YES" : "NO"}</Col>

                            <Col span={8} align="right"><Label style={{ margin: 0 }}>Product Type</Label></Col>
                            <Col span={16}>{initialValues?.type?.title}</Col>

                            <Col span={8} align="right"><Label style={{ margin: 0 }}>Is this unfit for dispatch box?</Label></Col>
                            <Col span={16}>{initialValues.fit_for_dispatch ? "YES" : "NO"}</Col>

                        </Row>
                    </div>
                </Card>

                <Card style={{ backgroundColor: !isStoreUser ? "#FFFFFF" : "#EEEEEE", padding: 0 }} styles={{ body: { padding: 0 } }}>
                    <Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Limits {(canEdit && !isStoreUser) && <IconButton onClick={() => set_editMode('editLimits')} icon="pen" size="small" />}</Divider>
                    <div style={{ padding: "0 20px 20px 20px" }}>
                        <Row gutter={[10, 20]} align="top">
                            <Col span={8}><Label>Cart limit</Label>: {initialValues.cart_limit}</Col>
                            <Col span={8}><Label>Stock level</Label> Min: {initialValues?.stock_level?.min || 0}, Max: {initialValues?.stock_level?.max || 0}</Col>
                            <Col span={8}><Label>Cost:</Label> {initialValues.cost}</Col>

                            <Col span={24}><Divider>Tax Settings</Divider></Col>
                            <Col span={6}><Label>This product is texable: </Label> {initialValues?.tax?.texable ? "YES" : "NO"}</Col>
                            {initialValues?.tax?.texable && <>
                                <Col span={6}><Label>HS Code:</Label> {initialValues?.tax?.hs_code}</Col>
                                <Col span={6}><Label>Tax amount to be applied at:</Label> {initialValues?.tax?.applied_at}</Col>
                                <Col span={6}><Label>Tax Formula:</Label> {initialValues?.tax?.formula}</Col>
                                <Col span={6}><Label>Tax Amount:</Label> {initialValues?.tax?.amount}</Col>
                            </>}
                        </Row>
                    </div>
                </Card>

                <Card style={{ backgroundColor: !isStoreUser ? "#FFFFFF" : "#EEEEEE", padding: 0 }} styles={{ body: { padding: 0 } }}>
                    <Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Product Details {(canEdit && !isStoreUser) && <IconButton onClick={() => set_editMode('editProductDetails')} icon="pen" size="small" />}</Divider>
                    <div style={{ padding: "0 20px 20px 20px" }}>
                        <Row gutter={[10, 20]} align="top">
                            <Col span={8} align="right"><Label>Product description</Label></Col>
                            <Col span={16}>
                                {initialValues?.description?.map((item, i) => {
                                    return <p key={i}>{item}</p>
                                })}
                            </Col>

                            <Col span={8} align="right"><Label>Bullit points</Label></Col>
                            <Col span={16}><ul style={{ marginLeft: "10px" }}>
                                {initialValues?.bullits?.map((item, i) => {
                                    return <li key={i}>{item}</li>
                                })}
                            </ul></Col>
                        </Row>
                    </div>
                </Card>

                <Card style={{ backgroundColor: !isStoreUser ? "#FFFFFF" : "#EEEEEE", padding: 0 }} styles={{ body: { padding: 0 } }}>
                    <Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Extra Info {(canEdit && !isStoreUser) && <IconButton onClick={() => set_editMode('extra_fields')} icon="pen" size="small" />}</Divider>

                    <div style={{ padding: "0 20px 20px 20px" }}>
                        <Space style={{ width:"100%" }} direction='vertical' size={20}>
                            {initialValues?.extra_fields?.map((field, i) => {
                                return (<Row gutter={[10, 20]} align="top" key={i}>
                                    <Col span={8} align="right"><Label>{field.label}</Label></Col>
                                    <Col span={16}>{field.value}</Col>
                                </Row>)
                            })}
                        </Space>
                    </div>

                </Card>

                {/* Manage Images if its not a varition */}
                {!initialValues._id_parent && <ProductImageManager session={session} initialValues={initialValues} />}

                {/* <DevBlock obj={initialValues} /> */}

                {/* {!initialValues._id_parent && <Card>
                    <Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Images {(canEdit && !isStoreUser) && <IconButton onClick={() => set_editMode('editImages')} icon="pen" size="small" />}</Divider>
                    <Space wrap style={{ width:"100%" }}>
                        {initialValues?.picture && <Thumbnail file={initialValues?.picture} />}
                        {initialValues?.video && <Thumbnail file={initialValues?.video} />}
                        {initialValues?.gallery?.map((item, i) => (<Thumbnail file={item} key={i} />))}
                    </Space>
                </Card>} */}


                <Card style={{ backgroundColor: !isStoreUser ? "#FFFFFF" : "#EEEEEE", padding: 0 }} styles={{ body: { padding: 0 } }}>
                    <Divider style={{ fontWeight: "bold", fontSize: "18px" }}>SEO Data {(canEdit && !isStoreUser) && <IconButton onClick={() => set_editMode('editSEOData')} icon="pen" size="small" />}</Divider>
                    <div style={{ padding: "0 20px 20px 20px" }}>
                        <Row gutter={[10, 20]} align="top">
                            <Col span={8} align="right"><Label style={{ marginTop: "3px" }}>Tags for local search</Label></Col>
                            <Col span={16}>{initialValues?.tags}</Col>

                            <Col span={8} align="right"><Label>SEO Keywords</Label></Col>
                            <Col span={16}>{initialValues?.meta?.keywords}</Col>

                            <Col span={8} align="right"><Label>SEO Title</Label></Col>
                            <Col span={16}>{initialValues?.meta?.title}</Col>

                            <Col span={8} align="right"><Label>SEO Description</Label></Col>
                            <Col span={16}>{initialValues?.meta?.description}</Col>
                        </Row>
                    </div>
                </Card>

                {!initialValues._id_parent && <Card style={{ backgroundColor: !isStoreUser ? "#FFFFFF" : "#EEEEEE", padding: 0 }} styles={{ body: { padding: 0 } }}>
                    <Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Variations {initialValues.variations_count > 0 ? `(${initialValues.variations_count})` : ""} 
                        {(canEdit && !isStoreUser) && <IconButton onClick={() => set_editMode('editVariations')} icon="pen" size="small" />}
                    </Divider>

                    <div style={{ padding: "0 20px 20px 20px" }}>
                        <Label>This product have Variations? </Label> {(initialValues.have_variations === true) ? "YES" : "NO"}

                        {(initialValues.have_variations === true) && <div style={{ border: "1px solid #EEE", marginTop: "10px" }}>
                            <ProductsList
                                loading={loading}
                                parseEditLink={(item) => (`${adminRoot}/store/${session?.user?.store?._id}/product/${item._id}/view`)}
                                dataSource={variations}
                                searchFilterConfig={{ hide: true }}
                                hideListHeader={true}
                                columns={['title', 'barcode', 'price', 'available_qty', 'reserved_for_order', 'status', 'actions']}
                            />
                            {/* <Link href={`${adminRoot}/product/${initialValues._id}/variation/new`}>Add Variation</Link> */}
                            {canEdit && <div align="center" style={{ padding: "10px" }}>
                                <Button type="dashed" onClick={() => reouter.push(`${adminRoot}/product/${initialValues._id}/variation/new`)} icon={<Icon icon="plus" />}>Add Variation</Button>
                            </div>}
                        </div>}
                    </div>
                </Card>}
            
            </Space></Col>

        </Row>


        <DevBlock obj={initialValues} />


        <Drawer {...drawerProps} open={editMode === 'editIdentity'} title="Edit Identity" width={"500px"}>
            {editMode === 'editIdentity' && <ProdItendityForm
                store={store}
                initialValues={initialValues}
                onCancel={() => set_editMode(false)}
                onSuccess={(val) => {
                    set_editMode(true);
                    set_initialValues(val);
                }}
            />}
        </Drawer>

        <Drawer {...drawerProps} open={editMode === 'editVitalInfo'} title="Edit Vital Info">
            {editMode === 'editVitalInfo' && <ProdVitalInfoForm
                store={store}
                initialValues={initialValues}
                onCancel={() => set_editMode(false)}
                onSuccess={(val) => {
                    set_editMode(true);
                    set_initialValues(val);
                }}
            />}
        </Drawer>

        <Drawer {...drawerProps} open={editMode === 'editLimits'} title="Edit Limits">
            {editMode === 'editLimits' && <ProdLimitsForm
                store={store}
                initialValues={initialValues}
                onCancel={() => set_editMode(false)}
                onSuccess={(val) => {
                    set_editMode(true);
                    set_initialValues(val);
                }}
            />}
        </Drawer>

        <Drawer {...drawerProps} open={editMode === 'editProductDetails'} title="Edit Product Details">
            {editMode === 'editProductDetails' && <ProdDetailsForm
                store={store}
                initialValues={initialValues}
                onCancel={() => set_editMode(false)}
                onSuccess={(val) => {
                    set_editMode(true);
                    set_initialValues(val);
                }}
            />}
        </Drawer>

        <Drawer {...drawerProps} width="650px" open={editMode === 'editImages'} title="Product Images">
            {editMode === 'editImages' && <ProdImagesDataForm
                store={store}
                initialValues={initialValues}
                onCancel={() => set_editMode(false)}
                onSuccess={(val) => {
                    set_editMode(true);
                    refresh()
                    // set_initialValues(val);
                }}
            />}
        </Drawer>

        <Drawer {...drawerProps} open={editMode === 'editSEOData'} title="Edit SEO Data">
            {editMode === 'editSEOData' && <ProdSEODataForm
                store={store}
                initialValues={initialValues}
                onCancel={() => set_editMode(false)}
                onSuccess={(val) => {
                    set_editMode(true);
                    set_initialValues(val);
                }}
            />}
        </Drawer>

        <Drawer {...drawerProps} open={editMode === 'editVariations'} title="Product Variations">
            {editMode === 'editVariations' && <ProdVariationForm
                store={store}
                initialValues={initialValues}
                onCancel={() => set_editMode(false)}
                onSuccess={(val) => {
                    set_editMode(true);
                    set_initialValues(val);
                }}
            />}
        </Drawer>

        <Drawer {...drawerProps} open={editMode === 'editStoreProps'} title="Product Store Properties">
            {editMode === 'editStoreProps' && <ProdStorePropsForm
                store={store}
                initialValues={initialValues}
                onCancel={() => set_editMode(false)}
                onSuccess={(val) => {
                    set_editMode(true);
                    set_initialValues(val);
                }}
            />}
        </Drawer>

        <Drawer {...drawerProps} open={editMode === 'extra_fields'} title="Extra Info">
            {editMode === 'extra_fields' && <ProdExtraFieldsForm
                store={store}
                initialValues={initialValues}
                onCancel={() => set_editMode(false)}
                onSuccess={(val) => {
                    set_editMode(true);
                    set_initialValues(val);
                }}
            />}
        </Drawer>

        <Drawer {...drawerProps} open={editMode === 'editCategories'} title="Edit Product Categories">
            {editMode === 'editCategories' && <ProdCategoriesFieldsForm
                store={store}
                initialValues={initialValues}
                onCancel={() => set_editMode(false)}
                onSuccess={(val) => {
                    set_editMode(true);
                    set_initialValues(val);
                }}
            />}
        </Drawer>


    </>)

}
ProductView.propTypes = {
    session: PropTypes.object.isRequired,
    initialValues: PropTypes.object.isRequired,
    refresh: PropTypes.func,
}


