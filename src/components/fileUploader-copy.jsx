'use client'
import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types';
import { Progress, message, Upload, Modal, Card, Alert, Row, Col, Space } from 'antd';
import { InboxOutlined, PictureOutlined, PlaySquareOutlined } from '@ant-design/icons';
import _, { debounce } from 'lodash';
import axios from 'axios';
// import { Field } from 'react-final-form'
import { Loader } from './loader';
import { IconButton, Button } from './button';
import { Icon } from './icon';
import { __warning, __error, __success, __yellow } from '@_/lib/consoleHelper';
// import Image from 'next/image';
import { Image } from '@_/components'
import { getSrcFromFile, mergeObjects, sleep } from '@_/lib/utill';
// import { NOIMAGE } from '@_/configs';
// import styles from './UploadField.modules.scss'

const { Dragger } = Upload;
const defaultProps = {
    width: 190,
    height: 190,
    alt:"",
    className: 'thumb_img',
}

export const Thumbnail = ({ disabled, placeholder, prefix="", width = defaultProps.width, height = defaultProps.height, handlePreview, file, actions={}, onEdit, loading, style={} }) => {
    const { download, preview, remove } = actions;
    const [showPreview, set_showPreview] = useState(false)
    const [thumb_url, set_thumb_url] = useState(file)
    const [busy, setBusy] = useState(false)
    const thumbProps = mergeObjects(defaultProps, { width, height })
    const previewProps = mergeObjects(defaultProps, { width: 500, height: 500, className:"none" })


    useEffect(() => {
        if (file && file.thumb) {
            set_thumb_url({
                ...file,
                thumb: `${prefix}${file.thumb}`,
                url: `${prefix}${file.url}`,
            })
            return;
        }

        if (!file || !file.originFileObj) return;
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
        setBusy(true)
        remove().then(r=>{
            setBusy(false)
        })
    }

    const onPreviewClick = () => {
        if (handlePreview) handlePreview(file)
        else set_showPreview(file)
    }

    // let thumbStyle = style;
    // if (size) Object.assign(thumbStyle, { width: size.width, height: size.width })
    // console.log("thumb_url.thumb || NOIMAGE: ", (thumb_url.thumb || NOIMAGE))

    let _thumb = thumb_url && thumb_url.thumb;

    return (<>
        <Loader loading={busy || loading}>
            <div className={"gal_thumb_holder"} style={{ ...style, width: thumbProps.width, height: thumbProps.height }}>
                {/* {(thumb_url && thumb_url.thumb) && <img src={thumb_url.thumb} className='thumb_img' alt="" />} */}
                {(_thumb) && <Image src={_thumb} {...thumbProps} />}
                {(!_thumb && placeholder) && <Image src={placeholder} {...thumbProps} />}

                <div className='hover_layer'>
                    {Object.keys(file).length > 1 && <Space wrap>
                        {(onEdit && !disabled) && <IconButton onClick={() => onEdit(file)} icon="pen" />}
                        {(remove && !disabled) && <IconButton onClick={onDelClick} icon="trash-alt" color="red" />}
                        {(handlePreview || file.url) && <IconButton onClick={() => onPreviewClick(file)} icon="eye" />}
                    </Space>}
                </div>
            </div>
        </Loader>

        <Modal open={showPreview !== false} onCancel={() => set_showPreview(false)} width={'1000px'} style={{ textAlign: "center" }} title={false} footer={false} destroyOnHidden>
            {(showPreview) && <Image src={`${prefix}${showPreview.url}`} {...previewProps} />}
        </Modal>

    </>)

}
Thumbnail.propTypes = {
    prefix: PropTypes.string,
    placeholder: PropTypes.string,
    disabled: PropTypes.bool,
}


export const FileUploader = ({ disabled, path_prefix, icon, name, thumbnail, debounceTime = 1000, deleteFile, uploadFiles, onUpdateFiles, defaultValues, multiple=false, maxCount = 1, accept = ".jpg,.jpeg,.png", showUploadList=true }) => {
    const [previewImg, setPreviewImg] = useState(null)
    const [busy, setBusy] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [fileList, setFileList] = useState(defaultValues || [])
    const [_maxCount, set_maxCount] = useState(maxCount)
    const previewProps = mergeObjects(defaultProps, { width: 500, height: 500, className: "none" })

    // if (uploadFiles && addFiles) return <Alert message="only 1 function should be provided at a time (uploadFiles, addFiles)" type='error' showIcon />

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

        if (file.url) setPreviewImg(`${path_prefix}${file.url}`)        
    }

    const processUpload = async(files) => {
        uploadFiles(files).then(r=>{
            setUploading(false)

            // remove uploading items
            let _fileList = fileList.filter(o => !(o.loading))

            if(r.error) {
                setFileList(_fileList)
                return message.error(r.error.message)
            }
            
            // concat new images // skip if _id is same
            _fileList = _fileList.concat(r.filter(o => (!_fileList.find(oo=>(oo._id==o._id)))))
            setFileList(_fileList)
        })
    }

    const handelUploadRequest = async(files) => {
        // let existingCount = (fileList && fileList.length) || 0;
        // let incommingLength = files.length;
        // let newLength = files.length;

        // console.log({ existingCount, incommingLength, maxCount })

        let _files = files.slice()

        // if ((existingCount + newLength) > maxCount) {
        //     newLength = maxCount - (existingCount + newLength);
        //     _files = files.slice(0, (newLength))
        // }

        // if (!_files || _files.length<1) {
        //     message.error("No more files can be uploaded")
        //     return;
        // }

        if (onUpdateFiles) onUpdateFiles(_files)


        if (uploadFiles) {
            setUploading(true)
            let _fileList = fileList.slice()
                _fileList = _fileList.concat(_files.map(o => ({ ...o, loading: true })))
            setFileList(_fileList)
            processUpload(_files)
            return;
        }

        else{
            let _fileList = fileList.slice()
            _fileList = _fileList.concat(_files)
            setFileList(_fileList)
        }

        // setUploading(true)
        // let _fileList = fileList.slice()
        //     _fileList = _fileList.concat(files.map(o => ({ ...o, loading: true })))
            
        // setFileList(_fileList)
        // processUpload(files)
    }
    const _handelUploadRequest = debounce(handelUploadRequest, debounceTime)

    const removeFile = async(file) => {
        if (deleteFile && file.__typename){
            await deleteFile(file).then(r => {
                if (r && r.error) return message.error(r.error.message)
                let _list = fileList.filter(o => !(o._id && o._id == file._id));

                setFileList(_list)
            })
        }

        if (onUpdateFiles) onUpdateFiles([file], 'remove')
        let _list = fileList.filter(o => !(o._id && o._id == file._id || (o.uid && o.uid == file.uid)));
        setFileList(_list)

        return false;
    }

    const uploadProps = {
        name: 'file',
        multiple,
        accept,
        disabled: fileList.length == maxCount || uploading || disabled,
        showUploadList: false,
        maxCount: _maxCount,
        previewFile: false,
        fileList: [],

        beforeUpload(file, fileList){
            return false;
        },

        itemRender(originNode, file, fileList, actions){
            return <Thumbnail file={file} actions={actions} handlePreview={handlePreview} />
        },

        // previewFile(file){ },
        // action: 'https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload',
        onChange(info) {
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
        <Space wrap size={7}>
            {showUploadList && fileList.map((file, i) => {
                return (<Thumbnail file={file}
                    disabled={disabled}
                    prefix={path_prefix}
                    width={thumbnail && thumbnail?.displaySize?.width}
                    height={thumbnail && thumbnail?.displaySize?.height}
                    // size={thumbnail && thumbnail.displaySize}
                    loading={file.loading}
                    actions={{
                        remove: () => removeFile(file)
                    }}
                    handlePreview={handlePreview} key={i} />)
            })}

            {(fileList.length < maxCount && !uploading) && <>
                {/* <div className="__gal_thumb_holder" style={{ padding: "0", width: thumbnail?.displaySize?.width || "190px", height: thumbnail?.displaySize?.height || "190px" }}> */}
                <div style={{ padding: "0", width: 190, height: 190, border:"0px solid blue" }}>
                    <Dragger {...uploadProps} style={{ opacity: uploadProps.disabled ? 0.5 : 1 }}>
                        {(icon == 'video') ? <PlaySquareOutlined style={{ fontSize: "52px", color: "#1877FF" }} /> : <PictureOutlined style={{ fontSize: "52px", color: "#1877FF" }} />}
                    </Dragger>
                </div>
            </>}

        </Space>
        {/* {maxCount > 1 && <div align="center">{fileList.length} / {maxCount}</div>} */}

        <Modal open={previewImg !== null} onCancel={() => setPreviewImg(null)} width={'1000px'} title={false} footer={false} destroyOnHidden style={{ textAlign: "center" }}>
            {/* {(previewImg && !busy) && <Image src={previewImg} style={{ width: "100%" }} width={0} height={0} alt="" />} */}
            {(previewImg && !busy) && <Image src={previewImg} {...previewProps} />}
            {busy && <Loader loading={true} />}
        </Modal>

    </>)

    // return (<>
    //     <Space wrap size={7}>
    //         {showUploadList && fileList.map((file, i) => {
    //             return (<Thumbnail file={file}
    //                 width={thumbnail && thumbnail?.displaySize?.width}
    //                 height={thumbnail && thumbnail?.displaySize?.height}
    //                 // size={thumbnail && thumbnail.displaySize}
    //                 loading={file.loading}
    //                 actions={{
    //                     remove: () => removeFile(file)
    //                 }}
    //             handlePreview={handlePreview} key={i} />)
    //         })}

    //         {(fileList.length !== maxCount && !uploading) && <>
    //             <div className={"gal_thumb_holder"} style={{ padding: "0", width: thumbnail?.displaySize?.width || "190px", height: thumbnail?.displaySize?.height || "190px" }}>
    //                 <Dragger {...uploadProps} style={{ opacity: uploadProps.disabled ? 0.5 : 1 }}>
    //                     {(icon == 'video') ? <PlaySquareOutlined style={{ fontSize: "52px", color: "#1877FF" }} /> : <PictureOutlined style={{ fontSize: "52px", color: "#1877FF" }} />}
    //                 </Dragger>
    //             </div>
    //         </>}

    //     </Space>
    //     {maxCount > 1 && <div align="center">{fileList.length} / {maxCount}</div>}


    //     <Modal open={previewImg !== null} onCancel={() => setPreviewImg(null)} width={'1000px'} title={false} footer={false} destroyOnHidden>
    //         {/* {(previewImg && !busy) && <Image src={previewImg} style={{ width: "100%" }} width={0} height={0} alt="" />} */}
    //         {(previewImg && !busy) && <Image src={previewImg} {...previewProps} />}
    //         {busy && <Loader loading={true} />}
    //     </Modal>

    // </>)

}
FileUploader.propTypes = {
    name: PropTypes.string.isRequired, 
    thumbnail: PropTypes.object, 
    deleteFile: PropTypes.func, 
    uploadFiles: PropTypes.func,  
    path_prefix: PropTypes.string,
    
    onUpdateFiles: PropTypes.func,
    disabled: PropTypes.bool,
    
    defaultValues: PropTypes.array, 
    multiple: PropTypes.bool, 
    maxCount: PropTypes.bool, 
    accept: PropTypes.string, //.jpg,.jpeg,.png
    showUploadList: PropTypes.bool,
    debounceTime: PropTypes.number,
}

export default FileUploader;
