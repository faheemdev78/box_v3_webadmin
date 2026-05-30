import React, { useState, useEffect, useRef } from 'react'
import { __error, __yellow } from '@/lib/consoleHelper';
import { Alert, Card, Col, Divider, message, Row, Space } from 'antd';
import { Button, DeleteButton, DevBlock, DrawerFooter, FileUploader, Icon, IconButton, Loader } from '@/components';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, submitHandler, Label } from '@/components/form';
import { FieldArray } from 'react-final-form-arrays';
import axios from 'axios';
import { ensureArrayLength } from '@/lib/utill';
import { PROD_GAL_SIZE } from '@/configs';
import { useMutation } from '@apollo/client/react';
import { checkApolloRequestErrors } from '@/lib/utill_apollo';
import UPDATE_MAIN_IMG from '@/graphql/product/uploadProductImg.graphql';
import UPDATE_GALL_IMG from '@/graphql/product/uploadGalleryItems.graphql';
import UPDATE_VDO from '@/graphql/product/uploadProductVideo.graphql';



export function ProdImagesDataForm({ onSuccess, onCancel, ...props }) {
    const [initialValues, set_initialValues] = useState(null)
    const [error, setError] = useState(null)
    const [messageApi, contextHolder] = message.useMessage();
    const [uploadProductImg] = useMutation(UPDATE_MAIN_IMG);
    const [uploadGalleryItems] = useMutation(UPDATE_GALL_IMG);
    const [uploadProductVideo] = useMutation(UPDATE_VDO);

    console.log({ initialValues })

    useEffect(() => {
        if (initialValues) return;
        let gallery = ensureArrayLength(props?.initialValues?.gallery?.slice() || [], PROD_GAL_SIZE)

        set_initialValues({ ...props.initialValues, gallery })
        
    }, [props.initialValues])

    async function onSubmit({ picture, video, gallery }){
        console.log(__yellow("ProdImagesDataForm > onSubmit()"))
        setError(false);

        if (!(picture || video || gallery)){
            message.error("Nothing to upload")
            return false;
        }

        // let _gallery = gallery.filter(o => (!o.__typename || (o.originFileObj instanceof File)))
        let _gallery = gallery.filter(o => !!(o.originFileObj instanceof File))
        let _picture = (picture && !picture.__typename) && picture;
        let _video = (video && !video.__typename) && video;
        if ((!_gallery || _gallery.length < 1) && !_video && !_picture){
            alert("Nothing to upload")
            return false;
        }

        messageApi.open({ key: "onSubmit", type: 'loading', content: 'Saving..' })

        var results;

        if (_picture) {
            messageApi.open({ key: "onSubmit", type: 'loading', content: "Saving main image" })
            results = await onUpdateMainFile(_picture, initialValues._id)
            if (results.error) {
                messageApi.open({ key: "onSubmit", type: 'error', content: results.error.message, duration: 3 })
                return false;
            }
        }
        if (_video) {
            messageApi.open({ key: "onSubmit", type: 'loading', content: "Saving video" })
            results = await onUpdateVideoFile(_video, initialValues._id)
            if (results.error) {
                messageApi.open({ key: "onSubmit", type: 'error', content: results.error.message, duration: 3 })
                return false;
            }
        }
        if (_gallery) {
            messageApi.open({ key: "onSubmit", type: 'loading', content: "Saving gallery" })
            results = await onUpdateGalleryFiles(_gallery, initialValues._id)
            if (results.error) {
                messageApi.open({ key: "onSubmit", type: 'error', content: results.error.message, duration: 3 })
                return false;
            }
        }

        onSuccess(results);
        return false;
    }

    const uploadFilesToCdn = async (files, { folder, thumbnailSizes }) => {
        if (!files || files.length < 1) return { error: { message: 'No files to upload' } };

        const formData = new FormData();
        formData.append('folder', folder);
        if (thumbnailSizes) formData.append('thumbnails', JSON.stringify(thumbnailSizes));
        files.forEach((file) => formData.append('files', file));

        try {
            return await axios.post(`${process.env.NEXT_PUBLIC_CDN_API_URI}/upload_files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
                .then((r) => ((r.data.error) ? r.data : r.data));
        } catch (error) {
            console.error('Upload failed:', error.response?.data || error.message);
            return { error: { message: (error.response?.data?.error || error.response?.data || error.message) } }
        }
    }

    const onUpdateMainFile = async (files, _id) => {
        console.log(__yellow("onUpdateMainFile()"), files)

        const file = files
        if (!file) {
            console.log(__yellow("No picture file found to uplaod"))
            return false;
        }

        if (!(file.originFileObj instanceof File)) {
            message.error("File object not found!")
            return false;
        }

        messageApi.open({ key: "onSubmit", type: 'loading', content: "Uploading product image" })
        const uploadResult = await uploadFilesToCdn([file.originFileObj], {
            folder: `prod/${_id}`,
            thumbnailSizes: [{ width: 200, height: 200 }],
        });
        if (uploadResult?.error) return uploadResult;

        const uploadedFile = uploadResult?.files?.[0];
        if (!uploadedFile) return { error: { message: 'Invalid CDN upload response' } };

        messageApi.open({ key: "onSubmit", type: 'loading', content: "Saving product image" })
        return uploadProductImg({
            variables: {
                _id_product: _id,
                file: {
                    url: uploadedFile.url,
                    type: uploadedFile.type,
                    thumbnails: uploadedFile.thumbnails || [],
                },
            },
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.uploadProductImg }))
            .catch(error => ({ error: { message: error.message || 'Unable to save product image' } }));

    }
    const onUpdateVideoFile = async (files, _id) => {
        console.log(__yellow("onUpdateVideoFile()"), files)

        const file = files
        if (!file) {
            console.log(__yellow("No video file found to uplaod"))
            return false;
        }

        if (!(file.originFileObj instanceof File)) {
            message.error("File object not found!")
            return false;
        }

        messageApi.open({ key: "onSubmit", type: 'loading', content: "Uploading product video" })
        const uploadResult = await uploadFilesToCdn([file.originFileObj], { folder: `prod/${_id}` });
        if (uploadResult?.error) return uploadResult;

        const uploadedFile = uploadResult?.files?.[0];
        if (!uploadedFile) return { error: { message: 'Invalid CDN upload response' } };

        messageApi.open({ key: "onSubmit", type: 'loading', content: "Saving product video" })
        return uploadProductVideo({
            variables: {
                _id_product: _id,
                file: {
                    url: uploadedFile.url,
                    type: uploadedFile.type,
                    thumbnails: uploadedFile.thumbnails || [],
                },
            },
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.uploadProductVideo }))
            .catch(error => ({ error: { message: error.message || 'Unable to save product video' } }));

    }
    const onUpdateGalleryFiles = async (_files, _id) => {
        console.log(__yellow("onUpdateGalleryFiles()"), _files)

        const files = _files
            .filter(o => (o.originFileObj instanceof File))
            .map(o => (o.originFileObj))

        if (!files || files.length < 1) {
            console.log(__yellow("No gallery pictures file found to uplaod"))
            return false;
        }

        messageApi.open({ key: "onSubmit", type: 'loading', content: `Uploading product gallery (${files.length})` })
        const uploadResult = await uploadFilesToCdn(files, {
            folder: `prod/${_id}`,
            thumbnailSizes: [{ width: 200, height: 200 }],
        });
        if (uploadResult?.error) return uploadResult;

        const uploadedFiles = uploadResult?.files || [];
        if (uploadedFiles.length < 1) return { error: { message: 'Invalid CDN upload response' } };

        messageApi.open({ key: "onSubmit", type: 'loading', content: `Saving product gallery (${uploadedFiles.length})` })
        return uploadGalleryItems({
            variables: {
                _id_product: _id,
                files: uploadedFiles.map((file) => ({
                    url: file.url,
                    type: file.type,
                    thumbnails: file.thumbnails || [],
                })),
            },
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: false, parseReturn: (rr) => rr?.data?.uploadGalleryItems }))
            .catch(error => ({ error: { message: error.message || 'Unable to save product gallery' } }));

    }

    async function deleteMainImage(file){}
    async function deleteVideo(file){}
    async function deleteGalleryItem(file){}


    if (!initialValues) return <Loader loading={true}>Compiling...</Loader>
    // picture
    // video
    // gallery

    return (<>
        {contextHolder}

        <FinalForm onSubmit={onSubmit} initialValues={initialValues}
            mutators={{
                ...arrayMutators,
                onUpdateMainFile: (newValueArray, state, tools) => {
                    // console.log("onUpdateMainFile: ", newValueArray)
                    let file = newValueArray[0][0]
                    let action = newValueArray[1]

                    if (action == 'add') tools.changeValue(state, 'picture', () => file)
                    if (action == 'remove') tools.changeValue(state, 'picture', () => undefined)
                },
                onUpdateVideoFile: (newValueArray, state, tools) => {
                    // console.log("onUpdateVideoFile: ", newValueArray)
                    let file = newValueArray[0][0]
                    let action = newValueArray[1]

                    if (action == 'add') tools.changeValue(state, 'video', () => file)
                    if (action == 'remove') tools.changeValue(state, 'video', () => undefined)
                    // tools.changeValue(state, 'video', () => (newValueArray && newValueArray[0][0]) || undefined)
                },
                onUpdateGalleryFiles: (newValueArray, state, tools) => {
                    // console.log("onUpdateGalleryFiles: ", newValueArray)
                    let file = newValueArray[0][0]
                    let action = newValueArray[1]

                    let gallery = state?.formState?.values?.gallery?.slice() || []
                    gallery = gallery.filter(o => !!(o.uid))


                    if (action == 'add') {
                        gallery.push(file)
                        gallery = ensureArrayLength(gallery, PROD_GAL_SIZE)
                        tools.changeValue(state, 'gallery', () => gallery)
                    }
                    if (action == 'remove') {
                        gallery = gallery.filter(o => !(o.uid == file.uid))
                        gallery = ensureArrayLength(gallery, PROD_GAL_SIZE)
                        tools.changeValue(state, 'gallery', () => gallery)
                    }
                },
            }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                return (<>
                    {error && <Alert title="Error" description={error} showIcon type='error' />}
                    <form id="ProdImagesDataForm" {...submitHandler(formargs)}>

                        <Space wrap>
                            <div align="center">
                                {/* {values?.picture?.thumb} */}
                                <FileUploader // name="picture"
                                    // thumbnail={{ displaySize: { width: 190, height: 190 } }}
                                    uploadMode="deferred"
                                    maxCount={1}
                                    multiple={false}
                                    debounceTime={100}
                                    value={values?.picture ? [{ ...values?.picture }] : []}
                                    deleteFile={deleteMainImage}
                                    // uploadFiles={uploadProdImage}
                                    // deleteFile={onProdImageDelete}
                                    onUpdateFiles={form.mutators.onUpdateMainFile}
                                />
                                <div align="center">MAIN</div>
                            </div>
                            <div align="center">
                                <FileUploader //name="video"
                                    icon="video"
                                    accept=".mp4"
                                    uploadMode="deferred"
                                    // thumbnail={{ displaySize: { width: 190, height: 190 } }}
                                    maxCount={1}
                                    multiple={false}
                                    debounceTime={100}
                                    value={values?.video ? [{ ...values?.video }] : []}
                                    deleteFile={deleteVideo}
                                    // defaultValues={values?.picture && [{ ...values?.picture, _id: values._id, url: `${values?.picture?.url}`, thumb: `${values?.picture?.thumb}` }]}
                                    // uploadFiles={uploadProdImage}
                                    // deleteFile={onProdImageDelete}
                                    onUpdateFiles={form.mutators.onUpdateVideoFile}
                                />
                                <div align="center">VIDEO</div>
                            </div>

                            <FieldArray name="gallery">
                                {({ fields }) => {
                                    return (<Space wrap>
                                        {fields.map((name, index) => {
                                            const thisNode = fields.value[index];

                                            return (<div key={index}align="center">
                                                <FileUploader
                                                    name={name}
                                                    uploadMode="deferred"
                                                    thumbnail={{ displaySize: { width: 190, height: 190 } }}
                                                    maxCount={1}
                                                    multiple={false}
                                                    debounceTime={100}
                                                    value={(thisNode && (thisNode.uid || thisNode._id)) ? [thisNode] : []}
                                                    deleteFile={deleteGalleryItem}
                                                    // defaultValues={values?.picture && [{ ...values?.picture, _id: values._id, url: `${values?.picture?.url}`, thumb: `${values?.picture?.thumb}` }]}
                                                    // uploadFiles={uploadProdImage}
                                                    // deleteFile={onProdImageDelete}
                                                    onUpdateFiles={form.mutators.onUpdateGalleryFiles}
                                                />
                                            </div>)
                                        })}
                                    </Space>)
                                }}
                            </FieldArray>
                        </Space>


                        <DrawerFooter><Row>
                            <Col flex="auto"><Button onClick={onCancel}>Cancel</Button></Col>
                            <Col><SubmitButton loading={submitting} disabled={invalid}>Save</SubmitButton></Col>
                        </Row></DrawerFooter>

                        {/* <DevBlock obj={values} /> */}

                    </form>
                </>)

            }}
        />


    </>)
}
// ProdImagesDataForm.propTypes = {
//     initialValues: PropTypes.object.isRequired,
//     onSuccess: PropTypes.func.isRequired,
//     onCancel: PropTypes.func.isRequired,
// }
