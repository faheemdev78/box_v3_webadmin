import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types';
import { __error, __yellow } from '@_/lib/consoleHelper';
import { Alert, Card, Col, Divider, message, Row, Space } from 'antd';
import { Button, DeleteButton, DevBlock, DrawerFooter, FileUploader, Icon, IconButton, Loader } from '@_/components';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, submitHandler, Label } from '@_/components/form';
import { FieldArray } from 'react-final-form-arrays';
import axios from 'axios';
import { ensureArrayLength } from '@_/lib/utill';
import { PROD_GAL_SIZE } from '@_/configs';



export function ProdImagesDataForm({ onSuccess, onCancel, ...props }) {
    const [initialValues, set_initialValues] = useState(null)
    const [error, setError] = useState(null)
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        if (initialValues) return;
        let gallery = ensureArrayLength(props?.initialValues?.gallery?.slice() || [], PROD_GAL_SIZE)

        set_initialValues({ ...props.initialValues, gallery })
    }, [props.initialValues])

    async function onSubmit({ picture, video, gallery }){
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

    const onUpdateMainFile = async (files, _id) => {
        console.log(__yellow("onUpdateMainFile()"), files)

        const file = files
        if (!file) {
            console.log(__yellow("No picture file found to uplaod"))
            return false;
        }

        const formData = new FormData();
        const data = { uploadPath: "prod", uploadType: "prod-img", _id }
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });

        // Append files, ensuring each is a File object
        if (!(file.originFileObj instanceof File)) {
            message.error("File object not found!")
            return false;
        }
        formData.append('files', file.originFileObj); // Append each file

        messageApi.open({ key: "onSubmit", type: 'loading', content: "Saving product image" })

        try {
            const results = await axios.post(`${process.env.ADMIN_API_URI}/upload_files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
                .then(r => ((r.data.error) ? r.data : r?.data?.files));

            return results.error ? results : [{ ...results, _id: data._id }]
        } catch (error) {
            console.error('Upload failed:', error.response?.data || error.message);
            return { error: { message: (error.response?.data || error.message) } }
        }

    }
    const onUpdateVideoFile = async (files, _id) => {
        console.log(__yellow("onUpdateVideoFile()"), files)

        const file = files
        if (!file) {
            console.log(__yellow("No video file found to uplaod"))
            return false;
        }

        const formData = new FormData();
        const data = { uploadPath: "prod", uploadType: "prod-video", _id }
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });

        // Append files, ensuring each is a File object
        if (!(file.originFileObj instanceof File)) {
            message.error("File object not found!")
            return false;
        }
        formData.append('files', file.originFileObj); // Append each file

        messageApi.open({ key: "onSubmit", type: 'loading', content: "Saving product video" })

        try {
            const results = await axios.post(`${process.env.ADMIN_API_URI}/upload_files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
                .then(r => ((r.data.error) ? r.data : r?.data?.files));

            return results.error ? results : [{ ...results, _id: data._id }]
        } catch (error) {
            console.error('Upload failed:', error.response?.data || error.message);
            return { error: { message: (error.response?.data || error.message) } }
        }

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

        const formData = new FormData();
        const data = { uploadPath: "prod", uploadType: "prod-gallery", _id }
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });

        // // Append files, ensuring each is a File object
        // if (!(file.originFileObj instanceof File)) {
        //     message.error("File object not found!")
        //     return false;
        // }
        // formData.append('files', files); // Append each file
        files.forEach(file => {
            formData.append('files', file); // Append each file
        });

        messageApi.open({ key: "onSubmit", type: 'loading', content: `Saving product gallery (${files.length})` })

        try {
            const results = await axios.post(`${process.env.ADMIN_API_URI}/upload_files`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
                .then(r => ((r.data.error) ? r.data : r?.data?.files));

            return results.error ? results : [{ ...results, _id: data._id }]
        } catch (error) {
            console.error('Upload failed:', error.response?.data || error.message);
            return { error: { message: (error.response?.data || error.message) } }
        }

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
                    {error && <Alert message={error} showIcon type='error' />}
                    <form id="ProdImagesDataForm" {...submitHandler(formargs)}>

                        <Space wrap>
                            <div align="center">
                                {/* {values?.picture?.thumb} */}
                                <FileUploader // name="picture"
                                    // thumbnail={{ displaySize: { width: 190, height: 190 } }}
                                    maxCount={1}
                                    multiple={false}
                                    debounceTime={100}
                                    defaultValues={values?.picture && [{ ...values?.picture }]}
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
                                    // thumbnail={{ displaySize: { width: 190, height: 190 } }}
                                    maxCount={1}
                                    multiple={false}
                                    debounceTime={100}
                                    defaultValues={values?.video && [{ ...values?.video }]}
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
                                                    thumbnail={{ displaySize: { width: 190, height: 190 } }}
                                                    maxCount={1}
                                                    multiple={false}
                                                    debounceTime={100}
                                                    defaultValues={(thisNode && (thisNode.uid || thisNode._id)) ? [thisNode] : []}
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
ProdImagesDataForm.propTypes = {
    initialValues: PropTypes.object.isRequired,
    onSuccess: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
}
