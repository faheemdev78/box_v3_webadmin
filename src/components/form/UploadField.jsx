'use client'

import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types';
import { Progress, message, Upload, Modal, Card, Alert, Row, Col, Space } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import _ from 'lodash';
import axios from 'axios';
import { Field } from 'react-final-form'
import { Loader, IconButton, Button, Icon } from "../";
import { __warning, __error, __success, __yellow } from '@_/lib/consoleHelper';
import { Image } from '@_/components'
import styles from './UploadField.modules.scss'
import { getSrcFromFile } from '@_/lib/utill';

const { Dragger } = Upload;

const UploadButton = props => {
    if (props.listType == 'picture-grid')
        return <Button><InboxOutlined /> {props.buttonLabel || "Upload"}</Button>;
    else
        return <div><InboxOutlined /><div className="ant-upload-text">{props.buttonLabel || "Upload"}</div></div>;
}

export const ThumbnailHolder = props => {
    const { thumbUrl, srcUrl, handlePreview, status, onRemovePress, response } = props;
    
    if (srcUrl && srcUrl.length < 10) return null;
    // else if (props.response) data = { ...props.response };

    // check if its a upload response or archived image from DB
    let _thumbUrl = response ? `${process.env.NEXT_PUBLIC_CDN_ASSETS}${response.thumbUrl}` : thumbUrl;
    let _srcUrl = response ? `${process.env.NEXT_PUBLIC_CDN_ASSETS}${response.srcUrl}` : srcUrl;

    return (<div className={styles.gallery_item}>
        {status == 'loading' && <Loader className={`loader`} size="small" loading={status == 'loading'} />}
        
        {status == 'loading' && <>
            <div className={styles.thumbnail_holder}>
                Thumb holder
                <Icon size='2x' icon="image" />
            </div>
            <div className={styles.loader_bar}>
                <Loader className={`loader`} size="small" loading={true} />
                <Progress percent={30} status="active" className={styles.progress_bar} />
            </div>
        </>}
        
       {status != 'loading' && <>
            <div className={styles.thumbnail_holder} onClick={() => handlePreview(_srcUrl)}>
                <div className="hoverLayer">
                    eye
                    {/* <Icon size="lg" className="preview-icon" icon="eye" /> */}
                </div>
                {_thumbUrl && <Image className={styles.thumb_img} src={_thumbUrl} alt={_thumbUrl} />}
                {!_thumbUrl && <div className={styles.thumb_img}><Icon size='2x' icon="image" /></div>}
            </div>
            <div className={styles.icon_holder}>
                <IconButton onClick={onRemovePress} icon="trash-alt" />
                {/* <IconButton className="delete_button" onClick={onRemovePress} icon="trash-alt" /> */}
            </div>
        </>}
        
    </div>)

}



/**********
 <UploadField type="picture"
    name="menu_bg_img" label="Menu Background Image" buttonLabel={<>Upload Menu Background Image</>}
    action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
    data={{a:"A", b:"B"}}
    limit={1} listType="picture" />
 */
export const UploadImage = props => {
    const propTypes = {
        limit: PropTypes.number,
        listType: PropTypes.string, // text, picture, picture-card
        label: PropTypes.string,
        buttonLabel: PropTypes.string,
        onUpdateFileList: PropTypes.func,
        action: PropTypes.string,
        showCount: PropTypes.bool,
    }

    const [{ previewVisible, previewImage, previewTitle }, setState] = React.useState({
        previewVisible: false, previewImage: "", previewTitle: ""
    });

    const [fileList, setFileList] = React.useState(props.fileList || []);
    // const [uploaded_fileList, setUploadFileList] = React.useState([]);

    // let uploadButton;
    // if (props.listType == 'picture-grid')
    //     uploadButton = <Button><Icon icon="upload" /> {props.buttonLabel || "Upload"}</Button>;
    // else
    //     uploadButton = <div><Icon icon="upload" /><div className="ant-upload-text">{props.buttonLabel || "Upload"}</div></div>;

    const handlePreviewCancel = () => setState({ previewVisible: false, previewImage:"", previewTitle:"" });

    const handlePreview = async file => {
        // if (!file.url && !file.preview) {
        //     file.preview = await getBase64(file.originFileObj);
        // }

        let title = _.isString(file) ?
            file.substring(file.lastIndexOf('/') + 1) :
            file.name || file.response.srcUrl.substring(file.response.srcUrl.lastIndexOf('/') + 1);
        let src = _.isString(file) ? file : file.response.srcUrl;

        setState({
            previewVisible: true,
            previewImage: src,
            previewTitle: title,
        });
    };

    const onChange = (args) => {
        // console.log(__warning("onChange: "), args);
        setFileList(args.fileList);
    }

    const getFileIndex = file => {
        // var matchKey = file.uid !== undefined ? 'uid' : 'name';
        var matchKey;
        if (!matchKey && file.uid !== undefined) matchKey = 'uid';
        if (!matchKey && file.srcUrl !== undefined) matchKey = 'srcUrl';
        // if (!matchKey && file.name !== undefined) matchKey = 'name';
        
        if (!matchKey) {
            console.log(__error("Missing match key"), file);
            return false;
        }

        return fileList.find(o => o[matchKey] === file[matchKey])
    }

    const beforeUpload = file => {
        console.log(__warning("beforeUpload()"), file);
        setFileList([...fileList, file]);
        return true;
    }

    const removeFileFromLocal = file => {
        const index = getFileIndex(file);
        if (index === false || index < 0) return;
        const newFileList = fileList.slice();
        newFileList.splice(index, 1);
        setFileList(newFileList);
    }

    const onRemove = file => {
        console.log(__warning("onRemove()"), file);

        props.onDeleteClicked(file)
            .then(r => {
                if (!r || r.error) {
                    console.log(__error("Response ERROR"), r);
                    message.error((r && r.error) ? r.error.message : "Invalid response");
                    return;
                }
                removeFileFromLocal(file);
                // const index = getFileIndex(file);
                // if (index === false || index < 0) return;
                // const newFileList = fileList.slice();
                // newFileList.splice(index, 1);
                // setFileList(newFileList);
                message.success("File removed")
            })
            .catch(error => {
                console.log(__error("ERROR"), error);
                message.error("Deletion request failed")
            });

    }

    const onStart = file => {
        // console.log(__warning('onStart'), file);
        // let _file = { ...file, status: "uploading", percent: 0 };

        let targetIndex = getFileIndex(file);
        if (targetIndex < 0) return;
        let targetItem = fileList[targetIndex];

        targetItem = Object.assign(targetItem, { ...file }, { status: "uploading", percent: 0 })

        const newFileList = fileList.slice();
        // newFileList[targetIndex] = { ...targetItem, status: "uploading", percent: 0 }
        newFileList[targetIndex] = targetItem

        setFileList(newFileList)
    }

    // const onSuccess = (response, file) => {
    const onSuccess = (response, file, xhr) => {
        console.log(__success('onSuccess'), response);

        if (response.error) {
            message.error(response.error.message);
            // onRemove(file);
            return;
        }
        if (response.success && response.success.message)
            message.success(response.success.message);

        // console.log("file: ", file);
        // console.log("fileList: ", fileList);
        message.success("Upload complete")

        try { if (typeof response === 'string') response = JSON.parse(response); }
        catch (e) { /* do nothing */ }

        let targetIndex = getFileIndex(file);
        if (targetIndex < 0) return;

        let targetItem = fileList[targetIndex];
            targetItem = Object.assign(targetItem, {
                percent: 100,
                status: 'done',
                response: response,
                xhr: xhr,
                uid: response.id || targetItem.uid || targetItem.srcUrl
            })
        
        if (props.onUploadComplete) props.onUploadComplete(response)
        
        // let newItem = {
        //     percent: 100,
        //     status: 'done',
        //     response: response,
        //     xhr: xhr,
        //     srcUrl: targetItem.srcUrl,
        //     thumbUrl: targetItem.thumbUrl,
        //     uid: targetItem.uid || targetItem.srcUrl
        // };

        const newFileList = fileList.slice();
        newFileList[targetIndex] = targetItem

        onChange({ fileList: newFileList, file: targetItem });
        // setUploadFileList(uploaded_fileList)

    }

    const onError = (error, response, file) => {
        // console.log(__error('onError'), error);
        // console.log("response: ", response);
        // console.log("file: ", file);

        if (error.response && error.response.data && error.response.data.error && error.response.data.error.message) {
            // return { error: { message: error.response.data.error.message } };
            message.error(error.response.data.error.message);
        } else {
            message.error("Error uploading file..")
        }

        removeFileFromLocal(file);

        return false;
    }

    // const onProgress = ({ percent }, file) => {
    const onProgress = args => {
        console.log(__warning('onProgress'), args);
    }

    const customRequest = args => {
        // console.log(__warning("customRequest()"), args);
        const { action,
            data, file, filename, headers,
            onError, onProgress, onSuccess,
            withCredentials,
        } = args;

        // EXAMPLE: post form-data with 'axios'
        // eslint-disable-next-line no-undef
        const formData = new FormData();
        if (data) {
            Object.keys(data).forEach(key => {
                formData.append(key, data[key]);
            });
        }
        formData.append(filename, file);
        formData.append("name", props.name);
        // if custom size if available
        if (props.thumbSize) formData.append("thumbSize", props.thumbSize);


        axios.post(action, formData, {
            withCredentials,
            headers,
            onUploadProgress: ({ total, loaded }) => {
                let percent = Math.round(loaded / total * 100).toFixed(2);
                // let percent = Math.round((loaded/2) / total * 100).toFixed(2);
                // if (percent == 100) return;
                onProgress({ percent: percent }, file);
                // onProgress({ percent: Math.round(loaded / total * 100).toFixed(2) }, file);
            },
        })
            .then(({ data: response }) => {
                // onProgress({ percent: 100 }, file);
                onSuccess(response, file);
            })
            .catch(onError);

        return {
            abort() {
                console.log('upload progress is aborted.');
            },
        };
    }

    const RenderGalleryItems = args => {
        if (!args.items) return null;
        // console.log("RenderGalleryItems: ", args.items);

        const { items, input } = args;
        const { listType } = props;

        return (<><div className={`${styles.upload_gallery} ${listType}`}>
            {items.map((item, i) => {
                return <ThumbnailHolder {...props} {...item} key={i} handlePreview={handlePreview}
                    onRemovePress={!props.onDeleteClicked ? false : () => onRemove({ ...item.response, ...item, name: input.name, data: props.data })} />
                // return <ThumbnailHolder {...item} key={i} handlePreview={handlePreview} onRemovePress={() => onRemove({ ...item.response, ...item})} />
            })}
        </div></>)
    }

    const uploadProps = {
        // fileList,
        action: props.action, // || `${process.env.NEXT_PUBLIC_API_URL}/upload/assets`,
        disabled: false,
        multiple: false,
        data: props.data,
        accept: ".png,.jpg,.jpeg",
        method: props.method || "post",
        listType: props.listType || "picture-card",
        // headers: { Authorization: '$prefix $token' },
        beforeUpload: beforeUpload,
        onRemove: onRemove,
        onChange: onChange,
        onError: onError,
        onSuccess: onSuccess,
        // onProgress: onProgress,
        // onPreview: handlePreview,
        onStart: onStart,
        customRequest: customRequest,
    };


    return (
        <Field name={props.name} validate={props.validate}>
            {({ input, meta }) => {
                // let value = input.value;

                return (
                    <div className="form-field upload-image">
                        {props.label && <label>{props.label}</label>}
                        <Upload {...uploadProps}>
                            {/* {props.onUploadClicked && (!fileList || _.isUndefined(fileList) || fileList.length < (props.limit || 1)) && uploadButton} */}
                            {(!fileList || _.isUndefined(fileList) || fileList.length < (props.limit || 1)) && <UploadButton {...props} />}
                            {/* {(!fileList || _.isUndefined(fileList) || fileList.length < (props.limit || 1)) && uploadButton} */}
                            {/* {(!fileList || _.isUndefined(fileList) || fileList.length < (props.limit || 1)) && <>
                                {uploadButton}
                            </>} */}
                        </Upload>
                        
                        {!props.disableGalleryDisplay && <RenderGalleryItems items={fileList} input={input} /> }
                        {props.customGalleryRender && <props.customGalleryRender items={fileList} input={input} /> }

                        {/* {fileList.map((item, i) => {
                            // console.log("fileList", fileList);
                            return <ThumbnailHolder {...props} {...item} key={i} handlePreview={handlePreview}
                                onRemovePress={!props.onDeleteClicked ? false : () => onRemove({ ...item.response, ...item, name: input.name, data: props.data})} />
                            // return <ThumbnailHolder {...item} key={i} handlePreview={handlePreview} onRemovePress={() => onRemove({ ...item.response, ...item})} />
                        })} */}

                        {props.showCount && <div>{fileList.length} / {props.limit}</div>}
                        
                        <Modal open={previewVisible} title={previewTitle} footer={null} onCancel={handlePreviewCancel}>
                            <Image alt="preview" style={{ width: '100%' }} src={previewImage} />
                        </Modal>
                    </div>
                )
            }}
        </Field>
    )

}


const Thumbnail = ({ handlePreview, file, actions, onEdit }) => {
    const { download, preview, remove } = actions;
    const [thumb_url, set_thumb_url] = useState(file)
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        if (!file || !file.originFileObj || file.image) return;
        fetchSourceFile()
    }, [file])

    const fetchSourceFile = async() => {
        if (!file || !file.originFileObj) return;

        setBusy(true)
        await getSrcFromFile(file.originFileObj).then(r => {
            set_thumb_url(r)
        })
        setBusy(false)
    }

    const onDelClick = () => {
        console.log(__yellow("onDelClick()"))
        set_thumb_url(null)
        remove()
    }

    return (<Loader loading={busy}>
        <div className={"gal_thumb_holder"}>
            {(thumb_url && thumb_url.image) && <img src={thumb_url.image} className='thumb_img' alt="" />}

            <div className='hover_layer'>
                <Space wrap>
                    {onEdit && <IconButton onClick={() => onEdit(file)} icon="pen" />}
                    <IconButton onClick={onDelClick} icon="trash-alt" color="red" />
                    <IconButton onClick={() => handlePreview(file)} icon="eye" />
                </Space>
            </div>
        </div>
    </Loader>)

}

export const UploadField = ({ name, defaultValues, validate, multiple=false, maxCount = 1, accept = ".jpg,.jpeg,.png", showUploadList=true }) => {
    const [previewImg, setPreviewImg] = useState(null)
    const [busy, setBusy] = useState(false)
    const [fileList, setFileList] = useState(defaultValues || [])

    const handlePreview = async(file) => {
        // console.log(__yellow("handlePreview()"), file)
        if(!file) return;
        // if (!file || !file.originFileObj) return;

        if (file.originFileObj){
            setPreviewImg('loading')
            setBusy(true)
            await getSrcFromFile(file.originFileObj).then(r => {
                setPreviewImg(r.image)
            })
            setBusy(false)
            return;
        }

        if (file.url) setPreviewImg(file.url)
        
    }

    const uploadProps = {
        name: 'file',
        multiple,
        accept,
        disabled: fileList.length == maxCount,
        showUploadList: false,
        maxCount,
        previewFile: false,
        fileList,

        beforeUpload(file, fileList){
            // console.log("file: ", file)
            // console.log("fileList: ", fileList)
            // setFileList(fileList)
            return false;
        },

        itemRender(originNode, file, fileList, actions){
            return <Thumbnail file={file} actions={actions} handlePreview={handlePreview} />
        },

        // previewFile(file){ },
        // action: 'https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload',
        // onChange(info) {
        //     setFileList(info.fileList)

        //     const { status } = info.file;
        //     if (status !== 'uploading') {
        //         console.log(info.file, info.fileList);
        //     }
        //     if (status === 'done') {
        //         message.success(`${info.file.name} file uploaded successfully.`);
        //     } else if (status === 'error') {
        //         message.error(`${info.file.name} file upload failed.`);
        //     }
        // },
        // onDrop(e) { console.log('Dropped files', e.dataTransfer.files); },
    };

    return (<>
        <Field name={name} validate={validate}>
            {({ input, meta }) => {
                console.log("input: ", input)

                function onChange(info) {
                    let _list = info.fileList;
                    if (info.fileList.length > uploadProps.maxCount) _list = info.fileList.slice(0, uploadProps.maxCount)

                    setFileList(_list)
                    input.onChange(_list)

                    {/* const { status } = info.file;
                    if (status !== 'uploading') console.log(info.file, _list);
                    if (status === 'done') message.success(`${info.file.name} file uploaded successfully.`);
                    else if (status === 'error') message.error(`${info.file.name} file upload failed.`); */}
                }

                return (<>
                    <Dragger {...uploadProps} onChange={onChange}>
                        <p className="ant-upload-drag-icon" style={{ margin:0 }}><InboxOutlined /></p>
                        <div className="ant-upload-text">Click or drag file to this area to upload ({fileList.length}/{uploadProps.maxCount})</div>
                        {/* <p className="ant-upload-hint"></p> */}
                    </Dragger>

                    <Space wrap size={7}>
                        {fileList.map((file, i) => {
                            return (<Thumbnail file={file} actions={{
                                remove: () => {
                                    let _list = fileList.filter(o => {
                                        if(o._id && o._id == file._id) return false;
                                        else if (o.uid == file.uid) return false;
                                        return true;
                                    });
                                    setFileList(_list)
                                    input.onChange(_list)
                                }
                            }} handlePreview={handlePreview} key={i} />)
                        })}
                        {/* {fileList.map((file, i) => {
                            return (<Thumbnail file={file} actions={{
                                remove: () => {
                                    let _list = fileList.filter(o => {
                                        if(o._id && o._id == file._id) return false;
                                        else if (o.uid == file.uid) return false;
                                        return true;
                                    });
                                    setFileList(_list)
                                    input.onChange(_list)
                                }
                            }} handlePreview={handlePreview} key={i} />)
                        })} */}
                    </Space>
                </>)
            }}
        </Field>

        <Modal open={previewImg!==null} onCancel={() => setPreviewImg(null)} width={'1000px'} title={false} footer={false} destroyOnHidden>
            {(previewImg && !busy) && <img src={previewImg} style={{ width:"100%" }} alt="" />}
            {busy && <Loader loading={true} />}
        </Modal>
    </>)
}

export const Bk_UploadField = props => {
    const propTypes = {
        onDeleteClicked: PropTypes.func,
        onUploadComplete: PropTypes.func,
        disableGalleryDisplay: PropTypes.bool,
        // onUploadClicked: PropTypes.func,

        name: PropTypes.string.isRequired,
        label: PropTypes.string,
        buttonLabel: PropTypes.string,
        action: PropTypes.string,
        // remove_action: PropTypes.string,
        data: PropTypes.object.isRequired,
        listType: PropTypes.string, // text, picture, picture-card
        // type: PropTypes.string,
        fileList: PropTypes.array,
        limit: PropTypes.number,
        thumbSize: PropTypes.string, //"WidthxHeight"
    }

    let _props = { ...props };
    if (!props.buttonLabel) _props.buttonLabel = "Upload";
    if (!props.listType) _props.listType = "picture";
    if (!props.limit) _props.limit = 1;
    if (!props.action) _props.action = `${process.env.ADMIN_API_URI}/upload/assets`;
    // if (!props.remove_action) _props.remove_action = `${process.env.ADMIN_API_URI}/remove/assets`;

    if (_props.listType == "picture-grid" || _props.listType == "picture-card" || _props.listType == "list") {
        return <UploadImage {..._props} />
    }
    else {
        return <Alert message={`Invalid gallery type (${props.listType})`} type="warning" showIcon />
    }
}

export const SimpleUploadField = props => {
    const propTypes = {
        onChange: PropTypes.func.isRequired,
        // onDeleteClicked: PropTypes.func,
        // onUploadComplete: PropTypes.func,
        name: PropTypes.string.isRequired,
        label: PropTypes.string,
        // buttonLabel: PropTypes.string,
        // action: PropTypes.string,
        validate: PropTypes.object,
    }

    const [uploadFile, set_uploadFile] = React.useState(null)

    // const handleUpload = () => {
    //     const formData = new FormData();
    //     fileList.forEach((file) => {
    //         formData.append('files[]', file);
    //     });
    //     setUploading(true);
    //     // You can use any AJAX library you like
    //     fetch('https://www.mocky.io/v2/5cc8019d300000980a055e76', {
    //         method: 'POST',
    //         body: formData,
    //     })
    //         .then((res) => res.json())
    //         .then(() => {
    //             setFileList([]);
    //             message.success('upload successfully.');
    //         })
    //         .catch(() => {
    //             message.error('upload failed.');
    //         })
    //         .finally(() => {
    //             setUploading(false);
    //         });
    // };

    const upload_props = {
        name: 'file',
        multiple: false,
        action: null, //'https://www.mocky.io/v2/5cc8019d300000980a055e76',
        beforeUpload: (file) => {
            // console.log("beforeUpload(): ", file)
            set_uploadFile(file);
            props.onChange(file);
            return false;
        },
        maxCount: 1,
        fileList: null
        // onChange(info) {
        //     console.log("onChange()", info);
        //     const { status } = info.file;
        //     if (status !== 'uploading') console.log(info.file, info.fileList);
        //     if (status === 'done') message.success(`${info.file.name} file uploaded successfully.`);
        //     else if (status === 'error') message.error(`${info.file.name} file upload failed.`);
        // },
        // onDrop(e) {
        //     console.log('Dropped files', e.dataTransfer.files);
        // },
    };

    // console.log("uploadFile: ", uploadFile)

    return(<>
        <Field name={props.name} validate={props.validate}>
            {({ input, meta }) => {
                // let value = input.value;

                return (
                    <div className="form-field simple-upload" style={props.style}>
                        {props.label && <label>{props.label}</label>}
                        <Dragger {...upload_props} style={{ padding:"0", margin:"0" }}>
                            <Row align="middle" style={{ margin:"0 10px 0 0" }}>
                                <Col><p className="ant-upload-drag-icon" style={{ padding: "0", margin: "0" }}><InboxOutlined /></p></Col>
                                <Col><div>Drop your file here</div></Col>
                            </Row>
                        </Dragger>
                        {uploadFile && <div>
                            <div className='ellipsis file-list-item'>
                                <div className='file-name'>{uploadFile.name}</div>
                                <span className={styles.icon_holder}><IconButton onClick={() => {
                                    set_uploadFile(null);
                                    props.onChange(null);
                                }} icon="times" /></span>
                            </div>
                        </div>}
                    </div>
                )
            }}
        </Field>
    </>)
}

export default UploadField;