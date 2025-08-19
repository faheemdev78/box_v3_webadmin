'use client'

import React, { Component, useContext, useEffect, useState, useRef } from 'react';
import styles from './Field.module.scss'
import PropTypes from 'prop-types';
import { Field } from 'react-final-form'
import _ from 'lodash'
import { 
    Checkbox as AntCheckbox, 
    Input as AntInput, 
    InputNumber as AntInputNumber, 
    Switch, 
    Select as AntSelect, 
    Upload, 
    Radio as AntRadio,
    Alert, Space, Tooltip,
} from 'antd';
import ImgCrop from 'antd-img-crop';
import { Row, Col } from 'antd';
import { CheckOutlined, CloseOutlined, UploadOutlined, InboxOutlined, InfoCircleFilled } from '@ant-design/icons';
import { useSize } from 'ahooks';
import { __warning, __error, __success, __hilight } from '@_/lib/consoleHelper';
import { getSrcFromFile } from '@_/lib/utill';
import { Button } from '../';
import UploadField, { SimpleUploadField } from './UploadField';
import DateField from './DateField';
import { TimeField, TimeRangeField, TimePicker } from './TimeField'
import { Label, RenderError } from './extras';
import { composeValidators, composeValidatorsArray } from './lib';
import { ColorField } from './colorField';



/******** Field Usage*****************
 * 
 * Simple Default Input
    <Field name="firstName" component="input" placeholder="First Name" />

 * An Arbitrary Reusable Input Component
    <Field name="interests" component={InterestPicker} />

 * Render Function
    <Field
          name="bio"
          render={({ input, meta }) => (
            <div>
              <label>Bio</label>
              <textarea {...input} />
              {meta.touched && meta.error && <span>{meta.error}</span>}
            </div>
          )}
        />

 * Render Function as Children
    <Field name="phone">
          {({ input, meta }) => (
            <div>
              <label>Phone</label>
              <input type="text" {...input} placeholder="Phone" />
              {meta.touched && meta.error && <span>{meta.error}</span>}
            </div>
          )}
        </Field>

 */
/*****
 <FormField
    name="username"
    label="User name"
    type="text"
    placeholder="User name"
    validate={composeValidators(rules.required, rules.minChar(6))} />
    prefix={Node | String}
    addonAfter={Node | String}
    addonBefore={Node | String}
 */
export const FormField = props => {
    let final_fieldProps = {
        name: props.name,
        type: props.type,
        value: props.value, // radio, checkbox 
        disabled: !!props.disabled,
        validate: props.validate,
        allowNull: props.allowNull,
        prefix: props.prefix,
        suffix: props.suffix,
        // afterSubmit: ()=>void,
        // beforeSubmit: ()=>void,
        // children: <></>,
        // component: <></>,
        // data: {},
        // defaultValue: "",
        // initialValue: "",
        // multiple: true | false, // select
        // ref: ref
        // render: (props) => <></>
    }

    const initialProps = {
        isRequired: props.required || !!props.isRequired,
        style: props.style,
    }

    if (!final_fieldProps?.validate || final_fieldProps.validate == undefined || final_fieldProps.validate == "undefined"){
        // console.log("Validation is undefined")
        delete final_fieldProps.validate
    }

    if (final_fieldProps?.validate && _.isArray(final_fieldProps?.validate)) {
        if (final_fieldProps?.validate?.filter(o=>(o!=undefined))?.map(o => (o && o != undefined && o != "undefined" && o.name))?.includes("required")) Object.assign(initialProps, { isRequired: true })
        Object.assign(final_fieldProps, { validate: composeValidatorsArray(final_fieldProps.validate) })
    }
    if (final_fieldProps?.validate && _.isFunction(final_fieldProps.validate)){
        if (final_fieldProps?.validate?.name == "required") Object.assign(initialProps, { isRequired: true })
    }

    if (props.width) Object.assign(initialProps, { style: { ...initialProps.style, width: props.width } })

    Object.assign(initialProps, { final_fieldProps })
    Object.assign(initialProps, { fieldProps:{
        ...props.fieldProps,
        placeholder: props.placeholder,
    } })

    if (props.mode == 'preview') return <div className={`${styles.preview_field} ${styles[props.type+"_preview"]}`} style={props.style}>{props.value}</div>

    if (!props.type) return <Alert message="Undefined field type" type="warning" showIcon />
    if (!props.name) return <Alert message="Undefined field name" type="warning" showIcon />

    else if (
        props.type == 'text'
        || props.type == 'password'
        || props.type == 'email'
        // || props.type == 'number'
    ) return TextField({ ...props, ...initialProps });
    else if (props.type == 'number') return NumberField({ ...props, ...initialProps });
    else if (props.type == 'hidden') return HiddenField({ ...props, ...initialProps });

    else if (props.type == 'textarea') return TextareaField({ ...props, ...initialProps });

    else if (props.type == 'switch') return SwitchField({ ...props, ...initialProps });
    else if (props.type == 'checkbox') return CheckboxField({ ...props, ...initialProps });

    else if (props.type == 'select') return SelectField({ ...props, ...initialProps });
    // else if (props.type == 'select-multiple') return SelectFieldMultiple(props);

    else if (props.type == 'upload') return UploadField({ ...props, ...initialProps });
    else if (props.type == 'simple-upload') return SimpleUploadField({ ...props, ...initialProps });
    else if (props.type == 'file') return FileField({ ...props, ...initialProps });
    else if (props.type == 'image') return ImageField({ ...props, ...initialProps });
    
    else if (['date', 'date-range'].includes(props.type)) return DateField({ ...props, ...initialProps });
    else if (props.type == "time") return TimeField({ ...props, ...initialProps })

    else if (props.type == 'radio') return RadioField({ ...props, ...initialProps });
    else if (props.type == 'single-radio') return SingleRadioField({ ...props, ...initialProps });
    
    else if (props.type == 'color') return ColorField({ ...props, ...initialProps });

    return <Alert message={`Undfined type (${props.type})`} type='warning' />

}
export default FormField;
FormField.propTypes = {
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    validate: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.object,
        PropTypes.array,
    ]),
    label: PropTypes.any, 
    fieldProps: PropTypes.object, 
    placeholder: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    width: PropTypes.oneOfType([ PropTypes.string, PropTypes.number ]),

    style: PropTypes.object,
    wrapperStyle: PropTypes.object,
    
    prefix: PropTypes.oneOfType([
        PropTypes.string, PropTypes.object
    ]),
    postfix: PropTypes.oneOfType([
        PropTypes.string, PropTypes.object
    ]),
    addonAfter: PropTypes.oneOfType([
        PropTypes.string, PropTypes.object
    ]),
    addonBefore: PropTypes.oneOfType([
        PropTypes.string, PropTypes.object
    ]),
}


export const SearchField = props => {
    return <AntInput.Search {...props} />;
}
SearchField.propTypes = {
    type: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    enterButton: PropTypes.string,
    size: PropTypes.string, // large | default | small
    placeholder: PropTypes.any,
    suffix: PropTypes.oneOfType([
        PropTypes.string, PropTypes.object
    ]),
    addonAfter: PropTypes.oneOfType([
        PropTypes.string, PropTypes.object
    ]),
    addonBefore: PropTypes.oneOfType([
        PropTypes.string, PropTypes.object
    ]),
}



export const RadioField = props => {
    if (!props.data && !props?.options) return <p>No data available</p>
    let options = props?.data || props?.options;

    return (<>
        <div className={`form-field ${!props.compact && "field-margins"} radio ${props.className}`} style={props.wrapperStyle}>
            {props.label && <Label isRequired={props.isRequired} style={{ ...props.label_style, paddingRight:"10px" }}>{props.label}{` `}</Label>}
            <Space direction={props.direction || 'horizontal'} split={props.split} align={props.align} size={props.size}>
                {options.map((item, i) => {
                    return (<label key={i} style={item.style}>
                        {/* <Field {...props.final_fieldProps} component="input" type="radio" /> */}
                        <Field 
                            disabled={props?.final_fieldProps?.disabled}
                            validate={props?.final_fieldProps?.validate}
                            name={`${props?.final_fieldProps?.name}`} 
                            value={item.value}
                            component="input" type="radio"
                        />
                            {` `}{item.title || item.label}
                    </label>)
                })}
            </Space>
        </div>
    </>)
}

export const SingleRadioField = props => {
    let isChecked = (props.checked === true);

    const __Radio = ({ input, children }) => {
        return (<label><input type="radio" {...input} checked={isChecked} /><span style={{ marginLeft: children ? '10px' : '0px' }}>{children}</span></label>)
    }
        
    return (<>
        <div className={`form-field ${!props.compact && "field-margins"} radio ${props.className}`} style={props.wrapperStyle}>
            <span style={props.style}>
                <Field {...final_fieldProps} id={props.id} type="radio" checked={isChecked} component={__Radio} disabled={props?.final_fieldProps?.disabled}>
                    {props.label}
                </Field>
            </span>
        </div>
    </>)
}


/*******
 * name={string}
 * placeholder={string}
 * type={string} // The type of input, see: MDN(use Input.TextArea instead of type="textarea")
 * size={large | middle | small}
 * prefix={string | ReactNode}
 * suffix={string | ReactNode}
 * validate={composeValidators(rules.required, rules.minChar(6))} />
 */
export const TextField = props => {
    // let _inputProps = { ...props.inputProps };
    // if (props.disabled) _inputProps = Object.assign(_inputProps, { disabled: props.disabled })

    return (
        <Field {...props.final_fieldProps}>
            {({ input, meta }) => {
                let onChange = (e) => {
                    input.onChange(e);
                    if (props.onChange) props.onChange(e, input.onChange);
                }

                return (<div className={`${styles.field} ${styles.text}`} style={props.wrapperStyle}>
                    <Row align="middle" gutter={props.gutter || [0, 0]}>
                        {props.label && <Col span={props.direction == 'horizontal' ? undefined : 24} flex={props.label_width || undefined}><Label style={{ ...props.label_style, width: props.label_width || undefined }} isRequired={props.isRequired}>{props.label}</Label></Col>}
                        <Col flex="auto">
                            {props.preview && <Row style={{ border: "1px solid #DDD", borderRadius: "3px", width: props.width || 'inherit' }}>
                                <Col flex="auto" style={{ padding: "7px 10px", color: input.value ? '#000' : '#FFF' }}>{input.value || "."}</Col>
                            </Row>}

                            {!props.preview && <div className={`${styles.field_wrapper}`} style={{ width: props.width || 'inherit' }}>
                                <AntInput {...input} {...props.fieldProps}
                                    prefix={props.prefix}
                                    suffix={props.suffix}
                                    onChange={onChange}
                                    className={`${props.isRequired && styles.is_required_field}`}
                                    style={props.style}
                                    disabled={props?.final_fieldProps?.disabled}
                                />
                                <RenderError {...meta} />
                            </div>}
                        </Col>
                    </Row>
                </div>)

            }}
        </Field>
    )
}

export const HiddenField = props => {

    return (
        <Field {...props.final_fieldProps}>
            {({ input, meta }) => {
                {/* let onChange = (e) => {
                    input.onChange(e);
                    if (props.onChange) props.onChange(e, input.onChange);
                } */}

                return (<>
                    <AntInput type='hidden' {...input} {...props.fieldProps}  />
                    <RenderError {...meta} />
                </>)

            }}
        </Field>
    )
}

export const TextareaField = props => {
    return (
        <Field {...props.final_fieldProps} disabled={true}>
            {({ input, meta }) => {
                let onChange = (e) => {
                    input.onChange(e);
                    if (props.onChange) props.onChange(e, input.onChange);
                }

                return(<>
                    <div className={`${styles.field} ${styles.textarea}`} style={props.wrapperStyle}>
                        <Label style={{ ...props.label_style }} isRequired={props.isRequired}>{props.label}</Label>
                        <div className={`${styles.field_wrapper}`}>
                            <AntInput.TextArea {...input} {...props.fieldProps}
                                prefix={props.prefix}
                                suffix={props.suffix}
                                onChange={onChange}
                                rows={props.rows || 4}
                                className={`${props.isRequired && styles.is_required_field}`}
                                style={props.style}
                                disabled={props?.final_fieldProps?.disabled}
                            />
                        </div>
                        <RenderError {...meta} />
                    </div>
                </>)
            }}
        </Field>
    )
}

export const NumberField = props => {
    return (
        <Field {...props.final_fieldProps}>
            {({ input, meta }) => {
                let onChange = (e) => {
                    input.onChange(e);
                    if (props.onChange) props.onChange(e, input.onChange);
                }


                return (<div className={`${styles.field} ${styles.number}`} style={props.wrapperStyle}>
                    <Row align="middle" gutter={props.gutter || [0, 0]}>
                        {props.label && <Col span={props.direction == 'horizontal' ? undefined : 24} flex={props.label_width || undefined}><Label style={{ ...props.label_style, width: props.label_width || undefined }} isRequired={props.isRequired}>{props.label}</Label></Col>}
                        <Col flex="auto">
                            {props.preview && <Row style={{ border: "1px solid #DDD", borderRadius: "3px", width: props.width || 'inherit' }}>
                                <Col flex="auto" style={{ padding: "7px 10px", color: input.value ? '#000' : '#FFF' }}>{input.value || "."}</Col>
                            </Row>}

                            {!props.preview && <div className={`${styles.field_wrapper}`} style={{ width: props.width || 'inherit' }}>
                                <AntInputNumber {...input} {...props.fieldProps}
                                    prefix={props.prefix}
                                    suffix={props.suffix}

                                    className={`${props.isRequired && styles.is_required_field}`}
                                    onChange={onChange}
                                    style={props.style}
                                    min={props.min}
                                    max={props.max}
                                    disabled={props?.final_fieldProps?.disabled}
                                    step={props.step}
                                    // onkeypress={props.onkeypress}
                                    parser={props.parser}
                                />
                                <RenderError {...meta} />
                            </div>}
                        </Col>
                    </Row>
                </div>)

            }}
        </Field>
    )
}

export const SwitchField = props => {
    return (
        <Field {...props.final_fieldProps}>
            {({ input, meta }) => {
                let onChange = (e) => {
                    if (props.onChange) props.onChange(e);
                    input.onChange(e);
                }

                let _input = { ...input }
                delete _input.checked;
                delete _input.value;

                return (<div className={`${styles.field} ${styles.switch}`} style={props.wrapperStyle}>
                    <Row align="middle" gutter={props.gutter || [10, 10]}>
                        {props.label && <Col flex={props.label_width || undefined}>
                            <Label style={{ width: props.label_width || undefined }} isRequired={props.isRequired}>{props.label}</Label>
                        </Col>}
                        <Col flex="auto">
                            {props.preview && <Row style={{ border: "1px solid #DDD", borderRadius: "3px", width: props.width || 'inherit' }}>
                                <Col flex="auto" style={{ padding: "7px 10px", color: input.value ? '#000' : '#FFF' }}>{input.value || "."}</Col>
                            </Row>}

                            <div className={`${styles.field_wrapper}`}>
                                <Switch {..._input} {...props.fieldProps}
                                    onChange={onChange}
                                    checkedChildren={props.checkedChildren || <CheckOutlined />}
                                    unCheckedChildren={props.unCheckedChildren || <CloseOutlined />}
                                    defaultChecked={input.value === true || props.defaultChecked}
                                    disabled={props?.final_fieldProps?.disabled}
                                />
                                <RenderError {...meta} />
                            </div>
                        </Col>
                    </Row>

                </div>)

            }}
        </Field>
    )
}

export const CheckboxField = props => {
    return (
        <Field name={props.name} type="checkbox" validate={props?.final_fieldProps?.validate}>
            {({ input, meta }) => {
                let onChange = (e) => {
                    if (props.onChange) props.onChange(e);
                    input.onChange(e);
                }
                let _input = { ...input }
                delete _input.checked;
                delete _input.value;

                return (
                    <div className={`${styles.field} ${styles.checkbox}`} style={props.wrapperStyle}>
                        <Row align={"middle"}>
                            <Col style={{ paddingRight: "5px" }}>
                                <Checkbox id={props.name} 
                                    {..._input} 
                                    {...props.fieldProps} 
                                    onChange={(e) => onChange(e.target.checked)}
                                    disabled={props?.final_fieldProps?.disabled}
                                    defaultChecked={input.checked || props.defaultChecked} />
                            </Col>
                            {props.children && <Col>
                                <Label style={{ ...props.label_style }} htmlFor={props.name} isRequired={props.isRequired}>{props.children}</Label>
                            </Col>}
                        </Row>
                        <RenderError {...meta} />
                    </div>
                )
            }}
        </Field>
    )
}


export const SelectField = props => {
    // const keyMap = props.keyMap ? props.keyMap.split("=>") : ['value', 'label'];

    const optionParser = (item) => {
        return props.optionParser ? props.optionParser(item) : { ...item, children: item.label }
    };

    return (<div>
        <Field {...props.final_fieldProps}>
            {({ input, meta }) => {

                let value = input.value;
                if (props.mode == 'multiple') value = input.value || [];
                if (props.mode == 'tags') value = input.value || [];

                const fieldProps = {
                    prefix: props.prefix, // prefix={<UserOutlined className="site-form-item-icon" />}
                    suffix: props.suffix,
                    placeholder: props.placeholder,
                    style: { width: "100%", ...props.style },
                    allowClear: !!props.allowClear,
                    disabled: !!props.disabled,
                    // labelInValue: !!props.labelInValue,
                    showSearch: !!props.showSearch,
                    filterOption: props.filterOption || false,
                    onSearch: props.onSearch,
                    notFoundContent: props.notFoundContent,
                    value,
                    // value: (props.mode == 'multiple' || props.mode == 'tag') ? (input.value || []) : (input.value),
                    mode: props.mode,
                    onChange: (v1, v2) => {
                        let raw;
                        // for multiple selection
                        if (_.isArray(v1)) {
                            raw = v1.map(_v1 => {
                                let val = props?.options?.find(o => (o.value == _v1))
                                return !val ? val : (val.raw || val);
                            })
                        }
                        // for single selection
                        else {
                            console.log("GET RAW")
                            raw = props?.options?.find(o => (o.value == v1));
                            if (raw && raw.raw) raw = raw.raw;
                        }

                        input.onChange(v1);
                        if (props.onChange) props.onChange(v1, raw, input.onChange);

                        return v1;
                    },
                    onSelect: (v1, v2) => {
                        let raw = props?.options?.find(o => (o.value == v1))
                        if (props.onSelect) props.onSelect(v1, raw.raw)
                        return raw;
                    },
                    // onSelect: props.onSelect,
                    onDeselect: props.onDeselect,
                    defaultValue: props.defaultValue,
                    autoClearSearchValue: !!props.autoClearSearchValue,
                    autoFocus: !!props.autoFocus,
                    variant: props.bordered === false ? "borderless" : "outlined",
                    // bordered: props.bordered === false ? false : true,
                    // showArrow: props.showArrow === false ? false : true,
                    clearIcon: props.clearIcon,
                    defaultActiveFirstOption: !!props.defaultActiveFirstOption,
                    listHeight: props.listHeight,
                    loading: props.loading,

                    optionFilterProp: props.optionFilterProp,
                }

                if (props.showLocalSearch) Object.assign(fieldProps, {
                    showSearch: true,
                    optionFilterProp: "children",
                    filterOption: (input, option) => {
                        return (option?.children ?? '').toLowerCase().includes(input.toLowerCase());
                    },
                    // onSearch: (val) => console.log('search:', val),
                })

                return (<div className={`${styles.field} ${styles.select}`} style={props.wrapperStyle}>

                    <Row align="middle" gutter={props.gutter || [0, 0]}>
                        {props.label && <Col span={props.direction == 'horizontal' ? undefined : 24}><Label style={{ width: props.label_width || undefined }} isRequired={props.isRequired}>{props.label}</Label></Col>}
                        <Col flex="auto">
                            <div className={`${styles.field_wrapper}`}>
                                <Row style={{ width: props.width || 'inherit' }}>
                                    <Col flex="auto">
                                        {props.preview && <Row style={{ border: "1px solid #DDD", borderRadius: "5px" }}>
                                            <Col flex="auto" style={{ padding: "5px 10px", color: value ? '#000' : 'white' }}>{value || "."}</Col>
                                            <Col></Col>
                                        </Row>}
                                        {!props.preview && <AntSelect {...input} {...fieldProps} className={`${props.isRequired && styles.is_required_field}`}>
                                            {props?.options?.map((item, i) => {
                                                let node = optionParser(item);
                                                return <AntSelect.Option value={node.value} style={node.style} key={i}>{node.children}</AntSelect.Option>;
                                            })}
                                        </AntSelect>}
                                    </Col>
                                    {props.info && <Col><Tooltip title={props.info} color="#1C9DFF"><InfoCircleFilled style={{ color: "#1C9DFF" }} /></Tooltip></Col>}
                                </Row>
                                <RenderError {...meta} />
                            </div>
                        </Col>
                    </Row>

                </div>)

            }}
        </Field>
    </div>)
}
SelectField.propTypes = {
    name: PropTypes.string.isRequired,
    mode: PropTypes.string,
    style: PropTypes.object,
    prefix: PropTypes.object,
    allowClear: PropTypes.bool,
    disabled: PropTypes.bool,
    labelInValue: PropTypes.bool,
    showSearch: PropTypes.bool,
    showLocalSearch: PropTypes.bool,
    filterOption: PropTypes.bool,
    onSearch: PropTypes.func,
    notFoundContent: PropTypes.object,
    value: PropTypes.any,
    onChange: PropTypes.func,
    onSelect: PropTypes.func,
    onDeselect: PropTypes.func,
    keyMap: PropTypes.string,
    optionParser: PropTypes.func,
    preview: PropTypes.bool,
    direction: PropTypes.string,

    label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    placeholder: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
}




export const UploadImageCrop = props => {
    // https://github.com/nanxiaobei/antd-img-crop

    const propTypes = {
        limit: PropTypes.number,
        aspect: PropTypes.number,  // {width/height}
        listType: PropTypes.string, // text, picture, picture-card
        label: PropTypes.string,
        buttonLabel: PropTypes.string,
        grid: PropTypes.bool,
        zoom: PropTypes.bool,
        rotate: PropTypes.bool,
    }

    const uploadButton = <Button>{props.buttonLabel || <><UploadOutlined /> Upload</>}</Button>;

    const [fileList, setFileList] = React.useState([
        // {
        //     uid: '-1',
        //     name: 'image-image-image-image-image-image-image-image-image-image.png',
        //     status: 'done',
        //     url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
        // },
    ]);

    const onChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };

    const onPreview = async file => {
        let src = file.url;
        if (!src) {
            src = await new Promise(resolve => {
                const reader = new FileReader();
                reader.readAsDataURL(file.originFileObj);
                reader.onload = () => resolve(reader.result);
            });
        }
        const image = new Image();
        image.src = src;
        const imgWindow = window.open(src);
        imgWindow.document.write(image.outerHTML);
    };

    return (
        <div className={`form-field ${!props.compact && "field-margins"} upload-image-crop`}>
            {props.label && <label>{props.label}<br /></label>}

            <ImgCrop rotate aspect={props.aspect || (1 / 1)}>
                <Upload
                    // action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
                    listType={props.listType || "picture-card"}
                    fileList={fileList}
                    onChange={onChange}
                    onPreview={onPreview}
                >
                    {fileList.length < (props.limit || 1) && uploadButton}
                </Upload>
            </ImgCrop>
        </div>
    )
}

export const Select = props => {
    let _props = { ...props }
    const keyMap = _props.keyMap ? _props.keyMap.split("=>") : ['value', 'label']

    if (props.width) _props.style = Object.assign({ ..._props.style }, { width: props.width || '100%' })

    var data = props.data;
    if (props.addNull && data[0]._id) data.unshift({ _id: "", title: "" });

    delete _props.keyMap;
    delete _props.data;
    delete _props.addNull;
    delete _props.width;
    delete _props.label;
    delete _props.compact;
    delete _props.validate;

    return (<div className="simple-field">
        {props.label && <Label style={{ ...props.label_style }}>{props.label}</Label>}
        <AntSelect {..._props}>
            {data.map((item, i) => {
                if (!item) return null;
                let optProps = { key: i };
                const optStyle = {}
                if (props.coloredItems && item.itemBgColor) {
                    Object.assign(optStyle, { backgroundColor: item.itemBgColor || "#FFFFF" });
                }

                if (item.divider) {
                    Object.assign(optProps, { label: item.divider, disabled: true, className: 'dd-divider' });
                }
                else {
                    if (_.isString(item)) Object.assign(optProps, { label: item });
                    else Object.assign(optProps, { label: item[keyMap[1]], value: item[keyMap[0]] });

                    if (item.disabled) Object.assign(optProps, { disabled: item.disabled });
                    if (item.className) Object.assign(optProps, { className: item.className });
                }

                return <AntSelect.Option style={optStyle} {...optProps} key={i}>
                    {optProps.label}
                </AntSelect.Option>

            })}
        </AntSelect>
    </div>
    )
}
Select.propTypes = {
    coloredItems: PropTypes.bool,
}


export const Input = props => {
    let _props = { ...props }

    if (props.width) _props.style = Object.assign({ ..._props.style }, { width: props.width || '100%' })

    delete _props.addNull;
    delete _props.width;
    delete _props.type;
    delete _props.label;
    delete _props.compact;
    delete _props.validate;

    return (<div className="simple-field">
        {props.label && <Label style={{ ...props.label_style }}>{props.label}</Label>}
        {(props.type && props.type == 'number') && <AntInputNumber {..._props} />}
        {(!props.type || props.type != 'number') && <AntInput {..._props} />}
    </div>)

}

export const Checkbox = props => {
    let _props = { ...props };
    // delete _props.children;

    return (<AntCheckbox {..._props} disabled={props?.final_fieldProps?.disabled} />)
}



export const ImageField = (props) => {
    // getSrcFromFile

    async function loadImages(fileList, calback){
        if (!fileList || fileList.length < 1) return;

        let pArray = fileList.map(async (img) => {
            return getSrcFromFile(img.originFileObj).then(r=>{
                return { ...img, src: r }
            })
        })

        let resutls = await Promise.all(pArray);
        calback(resutls)
    }

    return (<>
        <Field {...props.final_fieldProps}>
            {({ input, meta }) => {
                
                const fieldProps = {
                    onChange: ({ file, fileList }) => {
                        {/* console.log("fileList: ", fileList) */}
                        if (fileList && fileList.length > 0) loadImages(fileList, input.onChange)

                        return input.onChange(fileList)
                    },
                    beforeUpload: (file) => (false),
                    multiple: props.multiple, // || false,
                    name: props.name,
                    disabled: props.disabled,
                    maxCount: props.limit, // || 1,
                    accept: props.accept,
                    fileList: input.value || [],
                    itemRender: props.itemRender,
                }

                let disabled = (props.limit && input?.value?.length >= props.limit);

                return (<div className={`${styles.field} ${styles.select}`}>
                    <Label style={{ ...props.label_style }} isRequired={props.isRequired}>{props.label}</Label>

                    <div className={`${styles.field_wrapper}`}>
                        <Upload.Dragger {...fieldProps} disabled={disabled}>
                            <Col align="center">
                                <Row align="middle" style={{ display: "inline-flex" }}>
                                    <Col><span style={{ fontSize: "40px", lineHeight: "12px", color: props.disabled ? "#EDD" : "#1877FF" }}><InboxOutlined /></span></Col>
                                    <Col style={{ fontSize: "12px" }}>Click or drag file to this<br />area to upload</Col>
                                </Row>
                            </Col>
                        </Upload.Dragger>

                    </div>
                    <RenderError {...meta} />
                </div>)
            }}
        </Field>
    </>)
}
ImageField.defaultProps = {
    multiple: false,
    disabled: false,
    limit: 1,
    accept: '.jpg,.jpeg,.png'
};
ImageField.propTypes = {
    accept: PropTypes.string, // .doc,.docx,.xml,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
    limit: PropTypes.number,
    multiple: PropTypes.bool,
    disabled: PropTypes.bool,
    name: PropTypes.string.isRequired,
    validate: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.object,
        PropTypes.array,
    ]),
}





export const FileField = (props) => {
    return (<>
        <Field {...props.final_fieldProps}>
            {({ input, meta }) => {
                
                const fieldProps = {
                    onChange: ({ file, fileList }) => (input.onChange(fileList)),
                    beforeUpload: (file) => (false),
                    multiple: props.multiple, // || false,
                    name: props.name,
                    disabled: props.disabled,
                    maxCount: props.limit, // || 1,
                    accept: props.accept,
                    fileList: input.value || [],
                    itemRender: props.itemRender,
                }

                let disabled = (props.limit && input?.value?.length >= props.limit);

                return (<div className={`${styles.field} ${styles.select}`}>
                    <Label style={{ ...props.label_style }} isRequired={props.isRequired}>{props.label}</Label>

                    <div className={`${styles.field_wrapper}`}>
                        <Upload.Dragger {...fieldProps} disabled={disabled}>
                            <Col align="center">
                                <Row align="middle" style={{ display: "inline-flex" }}>
                                    <Col><span style={{ fontSize: "40px", lineHeight: "12px", color: props.disabled ? "#EDD" : "#1877FF" }}><InboxOutlined /></span></Col>
                                    <Col style={{ fontSize: "12px" }}>Click or drag file to this<br />area to upload</Col>
                                </Row>
                            </Col>
                        </Upload.Dragger>

                    </div>
                    <RenderError {...meta} />
                </div>)
            }}
        </Field>
    </>)
}
FileField.defaultProps = {
    multiple: false,
    disabled: false,
    limit: 1,
};
FileField.propTypes = {
    accept: PropTypes.string, // .doc,.docx,.xml,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
    limit: PropTypes.number,
    multiple: PropTypes.bool,
    disabled: PropTypes.bool,
    name: PropTypes.string.isRequired,
    validate: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.object,
        PropTypes.array,
    ]),
}


