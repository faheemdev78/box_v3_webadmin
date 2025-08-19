'use client'

import React, { useState, useEffect, useRef } from 'react'
import { FieldArray } from 'react-final-form-arrays'
import { Flex, Input, Tag as AntTag, Tooltip, theme, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons';
import { Field } from 'react-final-form';

const Tag = ({ fields, index, name, style, icon, onClick, children }) => {
    const [mode, setMode] = useState('view')

    return (<Field name={name}>
        {({ input, meta }) => {
            {/* let onChange = (e) => {
                input.onChange(e);
                if (props.onChange) props.onChange(e, input.onChange);
            } */}

            if (mode == 'edit') return (<TagInput 
                onConfirm={(v) => {
                    setMode('view');
                    fields.update(index, v)
                }} 
                value={input.value} editMode={true} />)


            const isLongTag = input?.value.length > 20;

            const tagElem = <AntTag closable style={{ userSelect: 'none' }} onClose={() => fields.remove(index)}><span
                onDoubleClick={(e) => {
                    setMode('edit')
                    e.preventDefault();
                }}
            >
                {isLongTag ? `${input.value.slice(0, 20)}...` : input.value}
            </span></AntTag>

            return isLongTag ? (<Tooltip title={input.value}>{tagElem}</Tooltip>) : (tagElem);

        }}
    </Field>)
}
const TagInput = ({ onConfirm, editMode=false , value=''}) => {
    const { token } = theme.useToken();
    const [inputVisible, setInputVisible] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const inputRef = useRef(null);
    const tagPlusStyle = { height: 22, background: token.colorBgContainer, borderStyle: 'dashed' };

    const handleInputConfirm = () => {
        // if (inputValue && !tags?.includes(inputValue)) callback(inputValue)
        if (inputValue && inputValue.length > 3) onConfirm(inputValue)
        setInputVisible(false);
        setInputValue('');
    };

    useEffect(() => {
        if (!(inputVisible || editMode)) return;
        inputRef.current?.focus();
    }, [inputVisible, editMode]);

    const tagInputStyle = {
        width: 100,
        height: 22,
        marginInlineEnd: 8,
        verticalAlign: 'top',
    };

    if (inputVisible || editMode){
        return (<Input ref={inputRef} type="text" size="small" style={tagInputStyle}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleInputConfirm}
            onPressEnter={handleInputConfirm}
            // onBlur={() => handleInputConfirm(fields.value, (v) => fields.push(v))}
            // onPressEnter={() => handleInputConfirm(fields.value, (v) => fields.push(v))}
        />)
    }

    return <AntTag style={tagPlusStyle} icon={<PlusOutlined />} onClick={() => setInputVisible(true)}>New Tag</AntTag>
}

export const TagsManager = (props) => {
    return (<>
        <FieldArray name={props.name}>
            {({ fields }) => {

                return (<>
                    <Space wrap size={5}>
                        {fields.map((name, index) => {
                            const thisNode = fields.value[index];
                            return <Tag fields={fields} name={name} index={index} key={`${index}_${thisNode}`} />
                        })}
                        <TagInput onConfirm={(val) => fields.push(val)} />
                    </Space>
                </>)
            }}
        </FieldArray>
        
    </>)
}
