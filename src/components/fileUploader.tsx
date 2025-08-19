'use client'

import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types';
import { Progress, message, Upload, Modal, Card, Alert, Row, Col, Space } from 'antd';
import { InboxOutlined, PictureOutlined, PlaySquareOutlined } from '@ant-design/icons';
import _, { debounce } from 'lodash';
import axios from 'axios';
import { DevBlock } from '@_/components'
import { Loader } from './loader';
import { IconButton, Button, DeleteButton } from './button';
import { Icon } from './icon';
import { __warning, __error, __success, __yellow } from '@_/lib/consoleHelper';
import { Image } from '@_/components'
import { getSrcFromFile, mergeObjects, sleep } from '@_/lib/utill';
import styles from './FileUploader.module.scss'
// import { NOIMAGE } from '@_/configs';

const { Dragger } = Upload;

const allowedExtensations = {
    image: ['.jpeg', '.jpg', '.png', '.webp'],
    video: ['.mp4'],
};


interface ThumbnailProps {
    display: { width: number, height: number };
    actions: { remove?: Function };
    disabled?: boolean; 
    placeholder?: string;
    handlePreview?: Function;
    file?: { _id: string, url: string, thumbnails: string };
    loading?: boolean; 
    style?: any;
    type?: 'image' | 'video';
}
export const Thumbnail: React.FC<ThumbnailProps> = (props) => {
    // console.log("Thumbnail: ", props);

    const defaults = {
        display: { width: 150, height: 150 },
        actions: {},

        disabled: false,
        placeholder: null,
        // size: { width:150, height: 150 },
        handlePreview: null,
        file: null,
        loading: false,
        style: {},
        type: 'image',
    }
    const config = { ...defaults, ...props };

    const [showPreview, set_showPreview] = useState(false)
    const [thumb_url, set_thumb_url] = useState(config?.file?.thumbnails && config.file.thumbnails[0])
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        if (config?.file?.originFileObj){
            fetchSourceFile();
            return;
        }

        if (config?.file?.thumbnails) {
            set_thumb_url(config.file.thumbnails[0])
            return;
        }

    }, [config.file])

    const fetchSourceFile = async() => {
        if (!config?.file?.originFileObj) return;

        setBusy(true)
        await getSrcFromFile(config?.file?.originFileObj).then(r => {
            set_thumb_url(r)
        })
        setBusy(false)
    }

    const onDelClick = async () => {
        // setBusy(true)
        await config?.actions?.remove(config.file);
        // await sleep(1500)
        // setBusy(false)
        return false;
    }

    const onPreviewClick = () => {
        if (config.handlePreview) config.handlePreview(config.file)
        else set_showPreview(config.file)
    }

    const URL = `${process.env.NEXT_PUBLIC_CDN_ASSETS}/${thumb_url}`

    return (<>
        {/* <DevBlock obj={config.file} title="config.file" /> */}
        {/* <p>{URL}</p> */}

        <Loader loading={busy || config.loading}>
            <div className={styles.gal_thumb_holder} style={{ ...config.style, width: config.display.width, height: config.display.height }}>
                {(thumb_url || config.placeholder) && <Image 
                    unoptimized
                    src={URL || config.placeholder} 
                    className={styles.thumb_img} 
                    alt="" 
                    width={config.display.width} 
                    height={config.display.height}
                />}

                <div className={styles.hover_layer}>
                    {config?.file?._id && <Space wrap>
                        {(config?.actions?.remove && !config?.disabled) && <DeleteButton onClick={onDelClick} />}
                        {(config.handlePreview || config.file.url) && <IconButton onClick={() => onPreviewClick(config.file)} icon="eye" />}
                    </Space>}
                </div>
            </div>
        </Loader>

        <Modal open={showPreview !== false} onCancel={() => set_showPreview(false)} width={'1000px'} style={{ textAlign: "center" }} title={false} footer={false} destroyOnHidden>
            {(showPreview) && <Image src={`${process.env.NEXT_PUBLIC_CDN_ASSETS}/${showPreview.url}`} width={500} height={500} alt="" />}
        </Modal>

    </>)

}


interface FileUploaderProps {
    folder?: string;
    thumbnail?: { 
        resize: { width: number, height: number }[], 
        display: { width: number, height: number },
        actions?: { remove: Function },
        // onDeletePress?: (args: any) => void,
    };
    disabled?: boolean;
    onUpload?: (args: any) => void;
    // defaultValues?: { name: string, url: string }[]; // can replace with specific type like File[] or {name: string, url: string}[]
    value: { url: string, thumbnails: [string] }[]; // can replace with specific type like File[] or {name: string, url: string}[]
    multiple?: boolean;
    maxCount?: number;
    type: 'image' | 'video';
    hideList?: boolean;
    debounceTime?: number;
}
export const FileUploader: React.FC<FileUploaderProps> = (props) => {
    const defaultProps = {
        folder: "",
        thumbnail: { 
            resize: [{ width: 200, height: 200 }], 
            display: { width: 200, height: 200 },
            actions: { },
        },
        disabled: false,
        value: [],
        multiple: false,
        maxCount: 1,
        type: 'image',
        hideList: false,
        debounceTime: 100,
    }
    const config = { 
        ...defaultProps, 
        ...props,
        thumbnail: {
            resize: props?.thumbnail?.resize || defaultProps.thumbnail.resize,
            display: props?.thumbnail?.display || defaultProps.thumbnail.display,
            actions: props?.thumbnail?.actions,
        }
    };
        
    const accept = allowedExtensations[config.type] // ".jpg,.jpeg,.png";
    const [previewImg, setPreviewImg] = useState(null)
    const [busy, setBusy] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [fileList, setFileList] = useState(config.value || [])
    const [_maxCount, set_maxCount] = useState(config.maxCount)
    const [messageApi, contextHolder] = message.useMessage();
    
    // const previewProps = mergeObjects(defaultProps, { width: 500, height: 500, className: "none" })

    
    useEffect(() => {
        if (JSON.stringify(fileList) === JSON.stringify(props.value || [])) return;
        setFileList(props.value)
    }, [props.value])

    useEffect(() => {
        set_maxCount(_maxCount - ((fileList && fileList.length) || 0))
    }, [fileList])

    const handlePreview = async(file) => {
        if(!file) return;

        if (file.originFileObj){
            setPreviewImg('loading')
            setBusy(true)
            await getSrcFromFile(file.originFileObj).then(r => (setPreviewImg(r.image)))
            setBusy(false)
            return;
        }

        // if (file.url) setPreviewImg(`${path_prefix}${file.url}`)        
        if (file.url) setPreviewImg(file.url)        ;
    }

    const handelUploadRequest = async(files) => {
        console.log("handelUploadRequest()", files);

        if (!files) {
            message.error("No picture file found to uplaod")
            return false;
        }

        const formData = new FormData();
            formData.append('folder', config.folder);
            formData.append('thumbnails', JSON.stringify(config.thumbnail.resize));

        messageApi.open({ key: "on_uploadMainImage", type: 'loading', content: "Preparing files to upload...." })

        let fileErrors:any = false;
        files.forEach(file => {
            if (!(file.originFileObj instanceof File)) {
                fileErrors = "File object not found!";
                return false;
            } else {
                formData.append('files', file.originFileObj); // Append each file
            }
        });

        if (fileErrors) {
            console.error(files)
            messageApi.open({ key: "on_uploadMainImage", type: 'error', content: fileErrors, duration: 3 });
            return false;
        }

        messageApi.open({ key: "on_uploadMainImage", type: 'loading', content: "Uploading files..." })

        let uri:string = `upload_files`;

        const results = await axios.post(`${process.env.NEXT_PUBLIC_CDN_API}/${uri}`, formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            )
            .then(r => (r?.error || r?.data?.error || r.data))
            .catch(err=>{
                console.error(err);
                return { error: { message:"upload Failed!" } }
            });
        
        if (results.error) {
            messageApi.open({ key: "on_uploadMainImage", type: 'error', content: results?.error?.message, duration: 3 });
            return false;
        }
    
        messageApi.open({ key: "on_uploadMainImage", type: 'success', content: "Done", duration: 2 });

        config.onUpload(results);
        return results;

    }
    const _handelUploadRequest = debounce(handelUploadRequest, config.debounceTime)

    const uploadProps = {
        name: 'file',
        multiple: config.multiple,
        accept,
        disabled: fileList.length == config.maxCount || uploading || config.disabled,
        showUploadList: config.hideList,
        maxCount: _maxCount,
        previewFile: false,
        fileList: [],

        beforeUpload(file, fileList){
            console.log("beforeUpload()", { file, fileList })
            return false;
        },

        itemRender(originNode, file, fileList, actions){
            return <Thumbnail file={file} actions={actions} handlePreview={handlePreview} />
        },

        // previewFile(file){ },
        // action: 'https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload',
        onChange(info) {
            console.log("onChange()", info)
            _handelUploadRequest(info.fileList)
            // const { status } = info.file;
            // if (status !== 'uploading') console.log(info.file, info.fileList);
            // if (status === 'done') message.success(`${info.file.name} file uploaded successfully.`);
            // else if (status === 'error') message.error(`${info.file.name} file upload failed.`);
        },
        onDrop(e) {
            // console.log('Dropped files', e.dataTransfer.files);
        },
    };

    return (<>
        {contextHolder}

        <Space wrap size={7}>

            {(!config.hideList && fileList) && fileList.map((file, i) => {
                return (<Thumbnail key={i}
                    {...props.thumbnail}
                    // size={{ width: config.thumbnail.display.width, height: config.thumbnail.display.height}}
                    file={file}
                    disabled={config.disabled}
                    loading={!!file.loading}
                    handlePreview={handlePreview} 
                />)
            })}

            {(fileList && fileList.length < config.maxCount && !uploading) && <>
                <div style={{ padding: "0", width: config.thumbnail.display.width, height: config.thumbnail.display.height, border: "0px solid blue" }}>
                    <Dragger {...uploadProps} style={{ opacity: config.disabled ? 0.5 : 1 }}>
                        {(config.type == 'video') ? <PlaySquareOutlined style={{ fontSize: "52px", color: "#1877FF" }} /> : <PictureOutlined style={{ fontSize: "52px", color: "#1877FF" }} />}
                    </Dragger>
                </div>
            </>}

        </Space>

        <Modal open={previewImg !== null} onCancel={() => setPreviewImg(null)} width={'1000px'} title={false} footer={false} destroyOnHidden style={{ textAlign: "center" }}>
            {/* {(previewImg && !busy) && <Image src={previewImg} style={{ width: "100%" }} width={0} height={0} alt="" />} */}
            {(previewImg && !busy) && <Image unoptimized src={process.env.NEXT_PUBLIC_CDN_ASSETS+'/'+previewImg} width={500} height={500} alt="" />}
            {busy && <Loader loading={true} />}
        </Modal>

    </>)

}

export default FileUploader;
