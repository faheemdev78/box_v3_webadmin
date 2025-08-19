import React, { useState } from 'react'
import { Col, Divider, Input, Popover, Row, Select } from 'antd'
import { FormField, SubmitButton, rules, submitHandler, Label } from '@_/components/form';
import { Button, IconButton, MenuButton } from '@_/components';
import { StyleInput } from './styleInput'
import { PlusOutlined, TableOutlined, PicCenterOutlined } from '@ant-design/icons';
import { forms_fieldDefinations, forms_validationTypes } from '../constants';


/* eslint-disable react-hooks/exhaustive-deps */
export const FieldMenu = ({ field, onUpdate, onDelete }) => {
    const [isOpen, set_isOpen] = useState(false)
    const [state, setState] = useState({ ...field })

    const onSettingsChange = (opt_name, value) => setState({ ...state, [opt_name]: value })
    const onSavePress = () => {
        onUpdate(state);
        set_isOpen(false);
    }

    const onOptionChange = (index, opt) => {
        let options = state.options.slice();

        options = options.map((o, i) => {
            return (i == index) ? opt : o;
        })

        setState({ ...state, options })
    }
    const onAddOption = ({ label, value }) => {
        let options = state?.options?.slice() || [];
        options.push({ label, value })

        setState({ ...state, options })
    }

    const onOptionDelete = (index) => {
        let options = state.options.filter((o, i) => (i !== index))
        setState({ ...state, options })
    }


    const onAttributeChange = (attr_name, value) => {
        let attributes = state.attributes;
        Object.assign(attributes, { [attr_name]: value })

        setState({ ...state, attributes })
    }

    const onFieldDelete = () => {
        onDelete();
        set_isOpen(false);
    }

    function getFieldByType(_type) {
        let _field = forms_fieldDefinations.find(o => o.value == _type);
        if (!_field) return {};

        let validation = _field?.validation?.split(",")
        if (validation) validation = forms_validationTypes.filter(o => validation.includes(o.value))

        return {
            ..._field,
            validation
        };
    }

    function setFloatStyle() {
        let _styles = state?.attributes?.style || [];
        _styles.push({ s: 'position', v: 'absolute' })
        onAttributeChange('style', _styles)
    }

    // const thisField = state.type ? getFieldByType(state.type) : {};
    const thisFieldDefination = forms_fieldDefinations.find(o => o.value == state.type) || [];

    const popoverContent = (<div style={{ width: "700px" }}>
        <Row gutter={[20]}>
            <Col span={14} style={{ borderRight: "1px solid #EEE" }}>
                {/* <h3>Field Options</h3> */}
                <Divider orientation='left' style={{ fontWeight: "bold" }}>Field</Divider>

                <Row gutter={[5, 5]}>
                    <Col span={10}>
                        <div><Label>Type *</Label></div>
                        <Select value={state.type} onChange={(val) => onSettingsChange('type', val)} style={{ width: "100%" }} options={forms_fieldDefinations} />
                    </Col>
                    {/* <Col span={12}>
                        <div><Label>Field Name *</Label></div>
                        <Input name='name' value={state.name} placeholder='eg: user_name' onChange={(e) => onSettingsChange('name', string_to_slug(e.target.value, "_"))} />
                    </Col> */}
                    <Col span={14}>
                        <div><Label>Label *</Label></div>
                        <Input name='label' value={state.label} placeholder='Label' onChange={(e) => onSettingsChange('label', e.target.value)} />
                    </Col>
                    {forms_fieldDefinations?.find(o => o.value == state.type)?.type == 'ui_elements' && <Col span={24}>
                        <div><Label>Default Value</Label></div>
                        <Input name='defaultValue' value={state.defaultValue} placeholder='Default Value' onChange={(e) => onSettingsChange('defaultValue', e.target.value)} />
                    </Col>}
                </Row>
            </Col>

            <Col span={10}>
                <Divider orientation='left' style={{ fontWeight: "bold" }}>Settings</Divider>

                <Row gutter={[5, 5]}>
                    {thisFieldDefination?.attributes?.includes('placeholder') && <Col span={16}>
                        <div><Label>Placeholder</Label></div>
                        <Input name='placeholder' value={state?.attributes?.placeholder} placeholder='placeholder' onChange={(e) => onAttributeChange('placeholder', e.target.value)} />
                    </Col>}

                    {thisFieldDefination?.attributes?.includes('span') && <Col span={8}>
                        <div><Label>Span *</Label></div>
                        <Select value={state?.attributes?.span} defaultValue='4' onChange={(val) => onAttributeChange('span', val)} style={{ width: "100%" }}
                            options={String("4,6,8,12,16,20,24").split(",").map(item => ({ value: item, label: `${item}` }))}
                        />
                    </Col>}

                    {thisFieldDefination?.attributes?.includes('orientation') && <Col span={16}>
                        <div><Label>Orientation *</Label></div>
                        <Select value={state?.attributes?.orientation} onChange={(val) => onAttributeChange('orientation', val)} style={{ width: "100%" }}
                            options={[{ label: "Horizontal", value: "horizontal" }, { label: "Vertical", value: "vertical" }]}
                        />
                    </Col>}

                    {thisFieldDefination?.attributes?.includes('validation') && <Col span={24}>
                        <div><Label>Validation</Label></div>
                        <Select value={state?.attributes?.validation} mode="tags" onChange={(val) => onAttributeChange('validation', val)} style={{ width: "100%" }} allowClear
                            options={thisFieldDefination?.validation.map(o => ({ label: o, value: o }))}
                        />
                    </Col>}

                    {thisFieldDefination?.attributes?.includes('style') && <Col span={24}>
                        <Row>
                            <Col flex="auto"><div><Label>Style</Label></div></Col>
                            <Col><Button onClick={setFloatStyle} size="small">Float</Button></Col>
                        </Row>
                        <StyleInput
                            // name='Style Object' 
                            // placeholder='marginTop:"10px",marginLeft:"5px"' 
                            // value={state?.attributes?.style} 
                            // onChange={(v) => onAttributeChange('style', v)}
                            set_stylesArray={(v) => onAttributeChange('style', v)}
                            stylesArray={state?.attributes?.style}
                        // stylesArray, set_stylesArray
                        />
                        {/* <Input name='Style Object' value={state?.attributes?.style} placeholder='marginTop:"10px",marginLeft:"5px"' onChange={(e) => onAttributeChange('style', e.target.value)} /> */}
                    </Col>}

                </Row>
            </Col>
        </Row>

        <Row gutter={[5, 5]}>
            {thisFieldDefination?.attributes?.includes('options') && <Col span={24}>
                <Divider>Options</Divider>
                <table style={{ width: "100%" }}>
                    <thead>
                        <tr>
                            <th>Label</th>
                            <th>Value</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {state?.options?.map((item, i) => {
                            return (<tr key={i}>
                                <td><Input name='label' value={item.label} onChange={(e) => onOptionChange(i, { label: e.target.value, value: item.value })} /></td>
                                <td><Input name='value' value={item.value} onChange={(e) => onOptionChange(i, { label: item.label, value: e.target.value })} /></td>
                                <td><IconButton onClick={() => onOptionDelete(i)} icon='trash' color="red" /></td>
                            </tr>)
                        })}
                    </tbody>
                </table>

                <div style={{ padding: "10px 50px" }}>
                    <Button type="dashed" block
                        onClick={() => onAddOption({ label: `Option ${state?.options?.length + 1 || 1} label`, value: `option ${state?.options?.length + 1 || 1} value` })}
                        icon={<PlusOutlined />}>Add new option</Button>
                </div>

            </Col>}

            <Col span={24} style={{ marginTop: "10px" }}><hr /></Col>
            <Col span={12}><Button color="red" onClick={onFieldDelete}>Delete</Button></Col>
            <Col span={12} align="right"><Button color="orange" onClick={onSavePress}>Save</Button></Col>
        </Row>

        {/* <DevBlock obj={state} title="state" /> */}
    </div>);

    return (<Popover content={popoverContent} open={isOpen} onOpenChange={set_isOpen} title={false} trigger="click" placement='left' destroyTooltipOnHide>
        <MenuButton color="blue" shape="round" />
    </Popover>)
}
