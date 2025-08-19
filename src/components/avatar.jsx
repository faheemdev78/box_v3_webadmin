'use client'

import React, { useEffect, useState } from 'react'
import { Avatar as AntAvatar, Upload, message } from 'antd'
import PropTypes from 'prop-types';
import { EditFilled } from '@ant-design/icons';
import ImgCrop from 'antd-img-crop';
import styles from './Avatar.module.scss'
import { __error } from '@/lib/consoleHelper';

/* eslint-disable react-hooks/exhaustive-deps */
export const Avatar = (_props) => {
    const [fileList, setFileList] = useState([]);
    const [src, setSrc] = useState(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        setSrc(getSourse());
    }, [_props])

    const getSrcFromFile = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
        });
    };

    const startUpload = async (file) => {
        setFileList([file])

        let fileObj = await getSrcFromFile(file);

        setBusy(true);
        const results = await _props.uploadAvatar(fileObj).then(r => (r)).catch(err => {
            console.log(__error("Request Error: "), err);
            return { error: { message: "Request ERROR" } }
        })
        setBusy(false);
        if (!results || results.error) {
            message.error((results && results?.error?.message) || 'Invalid Response!');
            return false;
        }

        setSrc(fileObj);
    }

    const getSourse = () => {
        if (_props.src) return _props.src;
        if (_props.children) return null;

        return null;

        // if (!_props.src && _props.type == 'avatar') return '/assets/avatar-image-available.png';
        // return '/assets/no-image-available.png';
    }


    const props = { ..._props }
    delete props.uploadAvatar;

    if (_props.uploadAvatar){
        return <span className={styles.editable_avatar}>
            <AntAvatar {...props} src={src || undefined} size={_props.size || 40} style={{ backgroundColor: "#EFF8FF", fontSize: `${_props.size ? _props.size/2 : 40}px`, verticalAlign: 'middle', color:"#1E6091", ..._props.style }} />
            
            <ImgCrop rotationSlider showGrid quality={1} fillColor={"white"} aspectSlider showReset cropShape="rect">
                <Upload disabled={busy}
                    beforeUpload={(file) => {
                        startUpload(file);
                        return false;
                    }}
                    onRemove={(file) => setFileList([])}
                    showUploadList={false}
                    action={false} //"https://www.mocky.io/v2/5cc8019d300000980a055e76"
                    // listType="picture-card"
                    fileList={fileList}
                    defaultFileList={[]}
                    accept=".jpg,.jpeg,.png,.gif"
                    // onChange={console.log}
                    // onPreview={onPreview}
                >
                    <span className="edit_float_button"><EditFilled /></span>
                </Upload>
            </ImgCrop>
        </span>
    }

    return (<>
        <AntAvatar {...props} src={src || undefined} size={_props.size || 40} 
            style={{ border:"1px solid #DDD", backgroundColor: "#EFF8FF", fontSize: `${_props.size ? _props.size / 2 : 40}px`, verticalAlign: 'middle', color: "#1E6091", ..._props.style }}
        />
    </>)
}
Avatar.propTypes = {
    // editable: PropTypes.bool,
    uploadAvatar: PropTypes.func,
    src: PropTypes.string,
    size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}
