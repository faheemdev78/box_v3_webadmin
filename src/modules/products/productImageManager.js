'use client'
import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types';
import { DevBlock, FileUploader, IconButton, Thumbnail } from '@_/components';
import { Drawer, Card, Divider, Alert, Space, message } from 'antd';
import { __error, __yellow } from '@_/lib/consoleHelper';
import security from '@_/lib/security';
import { NOIMAGE, PROD_GAL_SIZE } from '@_/configs';
import axios from 'axios';
import { useLazyQuery, useMutation } from '@apollo/client';

// import GET_PRODUCT from '@_/graphql/product/get_product_images.graphql';

import UPDATE_MAIN_IMG from '@_/graphql/product/uploadProductImg.graphql';
import DEL_MAIN_IMG from '@_/graphql/product/deleteProductImg.graphql';

import UPDATE_GALL_IMG from '@_/graphql/product/uploadGalleryItems.graphql';
import DEL_GAL_IMG from '@_/graphql/product/deleteGalleryItem.graphql';

import UPDATE_VDO from '@_/graphql/product/uploadProductVideo.graphql';
import DEL_VDO from '@_/graphql/product/deleteProductVideo.graphql';



export function ProductImageManager({ session, ...props }) {
    const [initialValues, set_initialValues] = useState(props.initialValues)
    const [messageApi, contextHolder] = message.useMessage();

    // const [get_product_images, { loading, called }] = useLazyQuery(GET_PRODUCT);
    
    const [uploadProductImg, img_updates] = useMutation(UPDATE_MAIN_IMG); // { data, loading, error }
    const [deleteProductImg, del_img_updates] = useMutation(DEL_MAIN_IMG); // { data, loading, error }
    
    const [uploadGalleryItems, galup_updates] = useMutation(UPDATE_GALL_IMG); // { data, loading, error }
    const [deleteGalleryItem, galdel_updates] = useMutation(DEL_GAL_IMG); // { data, loading, error }

    const [uploadProductVideo, vdoup_updates] = useMutation(UPDATE_VDO); // { data, loading, error }
    const [deleteProductVideo, vdodel_updates] = useMutation(DEL_VDO); // { data, loading, error }



    useEffect(() => {
        if (!initialValues) return; // skip this for the frist time
        set_initialValues(props.initialValues)
    }, [props.initialValues])

    async function on_uploadMainImage ({ files }) {
        console.log(__yellow("on_uploadMainImage()"), files);
        
        messageApi.open({ key: "on_uploadMainImage", type: 'loading', content: `Uploading file...` })

        const file = files[0]
        let results = await uploadProductImg({ variables: {
            _id_product: initialValues._id,
            file: {
                url: file.url,
                type: file.type,
                thumbnails: file.thumbnails
            }
        } }).then(r => r?.data?.uploadProductImg)
        .catch(err=>{
            console.error(err)
            return { error:{message:"Request Error"}}
        })

        if (!results || results.error){
            messageApi.open({ 
                key: "on_uploadMainImage", 
                type: 'error', 
                content: (results && results?.error?.message) || "Invalid Response!", 
                duration: 2
            });
            return;
        }

        set_initialValues({
            ...initialValues,
            picture: results
        })

        messageApi.open({ key: "on_uploadMainImage", type: 'success', content: "Success", duration: 2 });
    }

    async function on_uploadGallImages ({ files }) {
        console.log(__yellow("on_uploadGallImages()"), files);

        messageApi.open({ key: "on_uploadGallImages", type: 'loading', content: `Uploading...` })

        let variables = {
            _id_product: initialValues._id,
            files: files.map(file => ({
                url: file.url,
                type: file.type,
                thumbnails: file.thumbnails
            }))
        }

        let results = await uploadGalleryItems({ variables }).then(r => (r?.data?.uploadGalleryItems))
            .catch(err => {
                console.error(err);
                return { error:{message:"Request Error"}}
            })

        if (!results || results.error){
            messageApi.open({
                key: "on_uploadGallImages", type: 'error', duration: 2,
                content: (results && results?.error?.message) || "Invalid Response!",
            });
            return;
        }

        set_initialValues({ ...initialValues, gallery: results.images })

        messageApi.open({ key: "on_uploadGallImages", type: 'success', content: "Upload complete", duration: 2 });

    }

    async function on_uploadVideo ({ files }) {
        console.log(__yellow("on_uploadVideo()"), files);
        
        messageApi.open({ key: "on_uploadVideo", type: 'loading', content: `Uploading...` })

        const file = files[0]
        let results = await uploadProductVideo({ variables: {
            _id_product: initialValues._id,
            file: {
                url: file.url,
                type: file.type,
                thumbnails: file.thumbnails
            }
        }
        }).then(r => r?.data?.uploadProductVideo)
        .catch(err=>{
            console.error(err)
            return { error:{message:"Request Error"}}
        })

        if (!results || results.error){
            messageApi.open({ 
                key: "on_uploadVideo", type: 'error', duration: 2,
                content: (results && results?.error?.message) || "Invalid Response!", 
            });
            return;
        }

        set_initialValues({
            ...initialValues,
            video: results
        })

        messageApi.open({ key: "on_uploadVideo", type: 'success', content: "Success", duration: 2 });
    }

    // const fetchData = async() =>{
    //     let resutls = await get_product_images().then(r => (r?.data?.get_product_images)).catch(err => {
    //         console.log(__error("Error: "), err)
    //         return {}
    //     })
    //     set_initialValues({ ...initialValues, ...resutls })
    // }

    const onRemoveImgeClick = async(e) => {
        // console.log("onRemoveImgeClick()", e)

        let resutls = await deleteProductImg({ variables: { _id_product: initialValues._id } }).then(r => (r?.data?.deleteProductImg))
            .catch(err => {
                console.error(err);
                return { error: { message:"Request Error!"}}
            })

        if (!resutls || resutls.error){
            message.error(resutls && resutls?.error?.message || "Invalid Response!")
            return false;
        }

        set_initialValues({ ...initialValues, picture: undefined })

        message.success("Image removed");
        return false;
    }

    const onRemoveGallImgeClick = async(e) => {
        // console.log("onRemoveGallImgeClick()", e)

        let resutls = await deleteGalleryItem({ variables: { _id_product: initialValues._id, _id: e._id } }).then(r => (r?.data?.deleteGalleryItem))
            .catch(err => {
                console.error(err);
                return { error: { message:"Request Error!"}}
            })

        if (!resutls || resutls.error){
            message.error(resutls && resutls?.error?.message || "Invalid Response!")
            return false;
        }

        let gallery = initialValues.gallery.filter(o => (String(o._id) !== String(e._id) ));

        set_initialValues({ ...initialValues, gallery })

        message.success("Image removed");
        return false;
    }

    const onRemoveVdoClick = async(e) => {
        console.log("onRemoveVdoClick()", e)

        let resutls = await deleteProductVideo({ variables: { _id_product: initialValues._id } }).then(r => (r?.data?.deleteProductVideo))
            .catch(err => {
                console.error(err);
                return { error: { message:"Request Error!"}}
            })

        if (!resutls || resutls.error){
            message.error(resutls && resutls?.error?.message || "Invalid Response!")
            return false;
        }

        set_initialValues({ ...initialValues, video: undefined })

        message.success("Image removed");
        return false;
    }



    if (!session || !session?.user?._id) return <Alert message="Invalid session provided" showIcon type='error' />

    const isStoreUser = !!(session?.user?.store?._id);
    const canEdit = !isStoreUser && security.verifyRole('104.4', session.user.permissions);

    return (<>
        {contextHolder}
        <Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Product Images</Divider>

        {/* <DevBlock obj={initialValues?.picture} /> */}

        <Space wrap split={<div style={{ borderRight:"1px solid #DDD", height:"100px" }} />}>
            <div align="center" style={{ maxWidth:"400px" }}><Space wrap>
                <div align="center">
                    <FileUploader
                        thumbnail={{
                            resize: [{width: 200, height: 200 }],
                            display: { width: 150, height: 150 },
                            actions: { 
                                remove: async (e) => {
                                    await onRemoveImgeClick(e)
                                    return false;
                                }
                            },
                        }}
                        folder={`prod/${initialValues._id}`}
                        disabled={!canEdit}
                        onUpload={e => {
                            on_uploadMainImage(e)
                        }}
                        value={initialValues?.picture && [{ ...initialValues?.picture }]}
                        multiple={false}
                        maxCount={1}
                        type='image'
                        showUploadList={true}                    
                    />
                    <div align="center">MAIN</div>
                </div>

                <div align="center">
                    <FileUploader
                        thumbnail={{
                            resize: [{ width: 200, height: 200 }],
                            display: { width: 150, height: 150 },
                            actions: {
                                remove: async (e) => {
                                    await onRemoveVdoClick(e)
                                    return false;
                                }
                            },
                        }}
                        folder={`prod/${initialValues._id}`}
                        disabled={!canEdit}
                        onUpload={e => {
                            on_uploadVideo(e)
                        }}
                        value={initialValues?.video && [{ ...initialValues?.video }]}
                        multiple={false}
                        maxCount={1}
                        type='video'
                        showUploadList={true}
                    />
                    <div align="center">VIDEO</div>
                </div>
            </Space></div>

            <div align="center">
                <FileUploader
                    thumbnail={{
                        resize: [{ width: 200, height: 200 }],
                        display: { width: 150, height: 150 },
                        actions: {
                            remove: async (e) => {
                                await onRemoveGallImgeClick(e)
                                return false;
                            }
                        },
                    }}
                    folder={`prod/${initialValues._id}`}
                    disabled={!canEdit}
                    onUpload={e => {
                        on_uploadGallImages(e)
                    }}
                    value={initialValues?.gallery}
                    multiple={true}
                    maxCount={PROD_GAL_SIZE}
                    type='image'
                    showUploadList={true}
                />
                <div align="center">GALLERY</div>
            </div>

        </Space>





        {/* <Card>
            <Divider style={{ fontWeight: "bold", fontSize: "18px" }}>Product Images</Divider>
            <Space wrap style={{ width: "100%" }}>
                {initialValues?.picture && <Thumbnail prefix={process.env.NEXT_PUBLIC_ASSETS_API} actions={!canEdit ? undefined : { remove: removeMainImage }} file={initialValues?.picture} />}
                {initialValues?.video && <Thumbnail prefix={process.env.NEXT_PUBLIC_ASSETS_API} actions={!canEdit ? undefined : { remove: removeVideo }} file={initialValues?.video} />}
                {ensureArrayLength(gallery || [], PROD_GAL_SIZE)?.map((item, i) => (<Thumbnail actions={!canEdit ? undefined : { remove: removeGalleryImage }} placeholder={NOIMAGE} file={item} key={i} />))}
            </Space>
        </Card> */}

    </>)

}
ProductImageManager.propTypes = {
    session: PropTypes.object.isRequired,
    initialValues: PropTypes.object.isRequired,
}
