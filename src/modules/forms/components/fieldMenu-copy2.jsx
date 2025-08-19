import React, { useState, useEffect } from 'react'
import { Checkbox, Col, Divider, Input, Popover, Radio, Row, Select, Form as AntForm, Tabs, message, Dropdown, Modal } from 'antd'
import { FormField, SubmitButton, rules, submitHandler, Label } from '@_/components/form';
import { Button, IconButton, MenuButton, DevBlock } from '@_/components';
import { StyleInput } from './styleInput'
import { PlusOutlined, TableOutlined, PicCenterOutlined, EyeInvisibleFilled, EyeFilled,
    CaretUpOutlined, CaretDownOutlined, MenuOutlined
} from '@ant-design/icons';
import { forms_fieldDefinations, forms_validationTypes } from '../constants';


const OptionEditor = () => {
    const [open, setOpen] = useState(false)
    const [options, setOptions] = useState([])

    const onAddClick = () => {
        let _options = options.slice()
        _options.push("")
        setOptions(_options)
        setOpen(true)
    }

    const onFinish = (values) => {
        console.log('Success:', values);
    };
    const onFinishFailed = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };


    return (<>
        <AntForm name="basic"
            labelCol={{ span: 8, }}
            wrapperCol={{ span: 16, }}
            style={{ maxWidth: 600, }}
            initialValues={{ remember: true, }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
        >
            <Row gutter={[5]} align="top">
                <Col flex="auto" style={{ border: "1px solid #D9D9D9", borderRadius: "5px" }}>
                    {!open && <div>Option</div>}

                    {open && options?.map((item, i) => {
                        return <div key={i}>
                            <AntForm.Item label="Label" name="label" rules={[{ required: true, message: 'Input required' }]}>
                                <Input />
                            </AntForm.Item>
                            <hr />
                        </div>
                    })}


                </Col>
                <Col><Button onClick={() => setOpen(!open)} icon={open ? <CaretUpOutlined /> : <CaretDownOutlined />} /></Col>
                <Col><Button onClick={() => onAddClick()} icon={<PlusOutlined />} /></Col>
            </Row>



            <AntForm.Item wrapperCol={{ offset: 8, span: 16 }}>
                <Button type="primary" htmlType="submit">Submit</Button>
            </AntForm.Item>
        </AntForm>
    </>)

    return (<>
        <Row gutter={[5]}>
            <Col flex="auto" style={{ border: "1px solid #D9D9D9", borderRadius: "5px" }}>
                {open && options?.map((item, i) => {
                    {/* return <Input name={`opt_${i}`} value={item} onChange={(val) => onAttributeChange('answer', val)} key={i} /> */}
                    return <div key={i}>item</div>
                })}
            </Col>
            <Col><Button onClick={() => setOpen(!open)} icon={open ? <CaretUpOutlined /> : <CaretDownOutlined />} /></Col>
            <Col><Button onClick={() => onAddClick()} icon={<PlusOutlined />} /></Col>
        </Row>
    </>)
}

/* eslint-disable react-hooks/exhaustive-deps */
export const FieldMenu = ({ field, onUpdate, onDelete, onDuplicate, onMove, float, form, mode }) => {
    const [activeTab, setActiveTab] = useState('field');
    const [isOpen, set_isOpen] = useState(false);
    const [state, setState] = useState(null);
    const [showMenu, set_showMenu] = useState(false);

    useEffect(() => {
        setState(field)
        return () => {
            setState(null);
        };
    }, [field])

    const onSettingsChange = (opt_name, value) => {
        let attributes = state.attributes;
        if (opt_name=='type') delete attributes.answer; // remove answer value if field type is chanegd

        setState({ ...state, attributes, [opt_name]: value })
    }
    const onSavePress = () => {
        if (['simple-text', 'heading1', 'heading2', 'heading3'].includes(state.type) && (!state.defaultValue || state.defaultValue.length<1)){
            message.error("Please provide some default value")
            return false;
        }

        if (['placeholder'].includes(state.type) && (!state.name || !state.value)){
            message.error("Please select the field for placeholder value")
            return false;
        }

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

    // function getFieldByType(_type) {
    //     let _field = forms_fieldDefinations.find(o => o.value == _type);
    //     if (!_field) return {};

    //     let validation = _field?.validation?.split(",")
    //     if (validation) validation = forms_validationTypes.filter(o => validation.includes(o.value))

    //     return {
    //         ..._field,
    //         validation
    //     };
    // }

    function setFloatStyle() {
        let _styles = state?.attributes?.style || [];
        _styles.push({ s: 'position', v: 'absolute' })
        onAttributeChange('style', _styles)
    }

    if (!state) return null;

    // const thisField = state.type ? getFieldByType(state.type) : {};
    const thisFieldDefination = forms_fieldDefinations.find(o => o.value == state.type) || [];

    const onMenuOptions = (e) => {
        if (e.key =='move') onMove()
        if (e.key =='duplicate') onDuplicate()
    }
    const onMenuClick = (e) => set_showMenu(!showMenu)

    const onMenuItemClick = (key) => {
        console.log("onMenuItemClick()", key)
        if (key == "options") set_showMenu(!showMenu)
        if (key == "move") onMove()
        if (key == "duplicate") onDuplicate()
    }

    const renderLabel = ({ label, key }) => {
        return { 
            label: <span  rel="noopener noreferrer" onClick={() => onMenuItemClick(key)}>{label}</span>,
            key,
        }
    }

    const items = () => {
        let its = [{ label: 'Options', key: "options" }]
        if (onMove) its.push({ label: 'Move', key: "move" })
        if (onDuplicate) its.push({ label: 'Duplicate', key: "duplicate" })
        return its.map(o => renderLabel(o));

        // renderLabel({ label: 'Options', key: "options" }),
        // renderLabel({ label: 'Move', key: "move" }),
        // renderLabel({ label: 'Duplicate', key: "duplicate" }),

    }

    return (<>
        {/* <Dropdown.Button type="primary" size="small" placement="topLeft" 
            menu={{
                items: [
                    {
                        label: 'Move',
                        key: 'move',
                        // icon: <UserOutlined />,
                        // danger: true,
                        // disabled: true,
                    },
                    {
                        label: 'Duplicate',
                        key: 'duplicate',
                        // icon: <UserOutlined />,
                        // danger: true,
                        // disabled: true,
                    }
                ],
                onClick: onMenuOptions,
            }}
            onClick={onMenuClick}>
            Field
        </Dropdown.Button> */}

        <Dropdown placement='right' 
            menu={{
                items: items(),
            }}
        >
            <Button color="blue" size="small" shape="round"><MenuOutlined /></Button>
        </Dropdown>

        <Modal open={showMenu} title="Field Options" footer={false} onCancel={() => set_showMenu(false)} width={(state.type == 'placeholder') ? '500px' : "700px"}>
            <div>

                {state.type !== 'placeholder' && <Tabs activeKey={activeTab} type="card" items={[
                        { key: 'field', label: "Field" },
                        { key: 'settings', label: "Settings" },
                    ]} onChange={setActiveTab} />
                }

                {/* Field Type & Label */}
                {activeTab == 'field' && <>
                    <Row gutter={[5, 5]} align="bottom">
                        <Col flex="180px">
                            <div><Label>Type *</Label></div>
                            <Select value={state.type} onChange={(val) => onSettingsChange('type', val)} style={{ width: "100%" }} options={forms_fieldDefinations} />
                        </Col>
                        <Col flex="auto">
                            <div><Label>Label *</Label></div>
                            <Input name='label' value={state.label} placeholder='Label' onChange={(e) => onSettingsChange('label', e.target.value)} />
                        </Col>
                        <Col>
                            <IconButton
                                style={{ marginBottom: "5px" }}
                                onClick={() => onAttributeChange('hideLabel', (state?.attributes?.hideLabel == 'yes') ? 'no' : 'yes')}
                                color={(state?.attributes?.hideLabel == 'yes') ? 'red' : 'white'}
                                shape='circle' size="small"
                                icon={(state?.attributes?.hideLabel == 'yes') ? <EyeInvisibleFilled /> : <EyeFilled />}
                            />
                        </Col>
                    </Row>
                </>}

                {/* Placeholder field selection */}
                {state.type == 'placeholder' && <>
                    <Row gutter={[10, 10]}>
                        <Col span={12}>
                            <Label>Step</Label>
                            <Select value={state.name}
                                onChange={(val) => {
                                    setState((args) => {
                                        return {
                                            ...state,
                                            name: val,
                                            value: undefined
                                        }
                                    })
                                }}
                                style={{ width: "100%" }}
                                options={form?.steps?.map(o => ({ value: o.identifier, label: o.title }))}
                            />
                        </Col>
                        <Col span={12}>
                            {state.name && <>
                                <Label>Field</Label>
                                <Select value={state.value} onChange={(val) => onSettingsChange('value', val)} style={{ width: "100%" }}
                                    options={form?.steps?.find(o => o.identifier == state.name)?.fields?.map((o, field_index) => ({ value: o.identifier, label: o.label }))}
                                />
                            </>}
                        </Col>
                    </Row>

                </>}

                {state.type != 'placeholder' && <>
                    {activeTab == 'field' && <>
                        <Row gutter={[5, 5]} align="bottom">
                            {forms_fieldDefinations?.find(o => o.value == state.type)?.type == 'ui_elements' && <Col span={24}>
                                <div><Label>Default Value</Label></div>
                                <Input name='defaultValue' value={state.defaultValue} placeholder='Default Value' onChange={(e) => onSettingsChange('defaultValue', e.target.value)} />
                            </Col>}

                            {['text', 'select', 'radio'].includes(thisFieldDefination.value) && mode == 'exam' && <Col span={24}>
                                <div style={{ border: "0px solid red", borderRadius: "5px", margin: "10px 3px", padding: "0px" }}>
                                    <Label>Correct Answer *</Label>
                                    {state?.options?.length > 0 ? <>
                                        <Select value={state?.attributes?.answer} onChange={(val) => onAttributeChange('answer', val)} style={{ width: "100%" }} options={state.options} />
                                    </> : <>
                                        <Input status="error" name='answer' value={state?.attributes?.answer} onChange={(val) => onAttributeChange('answer', val)} />
                                    </>}
                                </div>
                            </Col>}

                        </Row>
                    </>}

                    {activeTab == 'settings' && <>
                        <Row gutter={[5, 5]}>
                            {thisFieldDefination?.attributes?.includes('placeholder') && <Col span={float ? 24 : 16}>
                                <div><Label>Placeholder</Label></div>
                                <Input name='placeholder' value={state?.attributes?.placeholder} placeholder='placeholder' onChange={(e) => onAttributeChange('placeholder', e.target.value)} />
                            </Col>}

                            {!float && thisFieldDefination?.attributes?.includes('span') && <Col flex="80px">
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
                                <div><Label>Style</Label></div>
                                <StyleInput
                                    set_stylesArray={(v) => onAttributeChange('style', v)}
                                    stylesArray={state?.attributes?.style}
                                />
                            </Col>}

                        </Row>
                    </>}


                </>}

                {activeTab == 'field' && <>
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

                    </Row>
                </>}

                <Row>
                    <Col span={24} style={{ marginTop: "10px" }}><hr /></Col>
                    <Col span={12}><Button color="red" onClick={onFieldDelete}>Delete</Button></Col>
                    <Col span={12} align="right"><Button color="orange" onClick={onSavePress}>Save</Button></Col>
                </Row>

                {/* <DevBlock obj={state?.attributes} title="attributes" /> */}
            </div>
        </Modal>
    </>)

    const popoverContent_BK2 = (<div style={{ width: (state.type == 'placeholder') ? '500px' : "700px" }}>

        <Tabs activeKey={activeTab} items={[
            { key: 'field', label: "Field" },
            { key: 'settings', label: "Settings" },
        ]} onChange={setActiveTab} />

        {/* {activeTab =='field' && <></>}        
        {activeTab =='settings' && <></>} */}



        {state.type == 'placeholder' && <>
            <Row gutter={[10, 10]}>
                <Col span={24}>
                    <div><Label>Type *</Label></div>
                    <Select value={state.type} onChange={(val) => onSettingsChange('type', val)} style={{ width: "100%" }} options={forms_fieldDefinations} />
                </Col>

                <Col span={12}>
                    <Label>Step</Label>
                    <Select value={state.name} 
                        onChange={(val) => {
                            setState((args) => {
                                return { ...state, 
                                    name: val,
                                    value: undefined
                                }
                            })
                        }} 
                        style={{ width: "100%" }}
                        options={form?.steps?.map(o => ({ value: o.identifier, label: o.title }))}
                    />
                </Col>
                <Col span={12}>
                    {state.name && <>
                        <Label>Field</Label>
                        <Select value={state.value} onChange={(val) => onSettingsChange('value', val)} style={{ width: "100%" }}
                            options={form?.steps?.find(o => o.identifier == state.name)?.fields?.map((o, field_index) => ({ value: o.identifier, label: o.label }))}
                        />
                    </>}
                </Col>
            </Row>

            {/* <DevBlock obj={state} /> */}
        </>}

        {state.type != 'placeholder' && <>
            <p>Mode: {mode}</p>

            <Row gutter={[20]}>
                <Col span={14} style={{ borderRight: "1px solid #EEE" }}>
                    {/* <h3>Field Options</h3> */}
                    <Divider orientation='left' style={{ fontWeight: "bold" }}>Field</Divider>

                    <Row gutter={[5, 5]} align="bottom">
                        <Col span={16}>
                            <div><Label>Type *</Label></div>
                            <Select value={state.type} onChange={(val) => onSettingsChange('type', val)} style={{ width: "100%" }} options={forms_fieldDefinations} />
                        </Col>
                        <Col span={22}>
                            {/* <div><Label>Label * <IconButton icon={<EyeFilled />} color={state?.attributes?.hideLabel=='yes' ? 'blue' : 'white'} size="small" shape="circle" /></Label></div> */}
                            <div><Label>Label *</Label></div>
                            <Input name='label' value={state.label} placeholder='Label' onChange={(e) => onSettingsChange('label', e.target.value)} />
                        </Col>
                        <Col span={2}>
                            <IconButton
                                style={{ marginBottom: "5px" }}
                                onClick={() => onAttributeChange('hideLabel', (state?.attributes?.hideLabel == 'yes') ? 'no' : 'yes')}
                                color={(state?.attributes?.hideLabel == 'yes') ? 'red' : 'white'}
                                shape='circle' size="small"
                                icon={(state?.attributes?.hideLabel == 'yes') ? <EyeInvisibleFilled /> : <EyeFilled />}
                            />
                            {/* <span onClick={() => onAttributeChange('hideLabel', (state?.attributes?.hideLabel == 'yes') ? 'no' : 'yes')} style={{ fontSize: "18px", color: (state?.attributes?.hideLabel == 'yes') ? "#000" : "#999" }}>{(state?.attributes?.hideLabel == 'yes') ? <EyeInvisibleFilled /> : <EyeFilled />}</span> */}
                        </Col>
                        {forms_fieldDefinations?.find(o => o.value == state.type)?.type == 'ui_elements' && <Col span={24}>
                            <div><Label>Default Value</Label></div>
                            <Input name='defaultValue' value={state.defaultValue} placeholder='Default Value' onChange={(e) => onSettingsChange('defaultValue', e.target.value)} />
                        </Col>}

                        {['text', 'select', 'radio'].includes(thisFieldDefination.value) && mode == 'exam' && <Col span={24}>
                            <div style={{ border: "1px solid red", borderRadius: "5px", margin:"10px 3px", padding:"10px" }}>
                                <Label>Correct Answer *</Label>
                                {['select', 'radio'].includes(thisFieldDefination.value) && <>
                                    <Select value={state?.attributes?.answer} onChange={(val) => onAttributeChange('answer', val)} style={{ width: "100%" }} options={state.options} />
                                </>}
                                {thisFieldDefination.value =='text' && <>
                                    <Input name='answer' value={state?.attributes?.answer} onChange={(val) => onAttributeChange('answer', val)} />
                                </>}
                            </div>
                        </Col>}


                        {/* {(mode=="exam") && <>
                            <div><Label>Correct Answer *</Label></div>
                            <Input name='correct_value' value={state.correct_value} placeholder='Correct Answer' onChange={(e) => onSettingsChange('correct_value', e.target.value)} />
                        </>} */}
                    </Row>
                </Col>

                <Col span={10}>
                    <Divider orientation='left' style={{ fontWeight: "bold" }}>Settings</Divider>

                    <Row gutter={[5, 5]}>
                        {thisFieldDefination?.attributes?.includes('placeholder') && <Col span={float ? 24 : 16}>
                            <div><Label>Placeholder</Label></div>
                            <Input name='placeholder' value={state?.attributes?.placeholder} placeholder='placeholder' onChange={(e) => onAttributeChange('placeholder', e.target.value)} />
                        </Col>}

                        {!float && thisFieldDefination?.attributes?.includes('span') && <Col span={8}>
                            <div><Label>Span *</Label></div>
                            <Select value={state?.attributes?.span} defaultValue='24' onChange={(val) => onAttributeChange('span', val)} style={{ width: "100%" }}
                                options={String("24,20,16,12,8,6,4").split(",").map(item => ({ value: item, label: `${item}` }))}
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

        </>}


        {thisFieldDefination.value == 'select' && <Col span={24}><div style={{ padding: "5px 3px" }}>
            <OptionEditor />
        </div></Col>}


        <Row gutter={[5, 5]}>
            {thisFieldDefination?.attributes?.includes('options') && <Col span={24}>
                <Divider>Options</Divider>
                <table style={{ width: "100%" }}>
                    <thead>
                        <tr>
                            {/* {mode == "exam" && <th>Answer</th>} */}
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

        <DevBlock obj={state?.attributes} title="attributes" />
    </div>);

    const popoverContent = (<div style={{ width: (state.type == 'placeholder') ? '500px' : "700px" }}>
        {/* <p>Mode: {mode}</p> */}

        {state.type !== 'placeholder' && <Tabs activeKey={activeTab} type="card" items={[
                { key: 'field', label: "Field" },
                { key: 'settings', label: "Settings" },
            ]} onChange={setActiveTab} />
        }

        {/* Field Type & Label */}
        {activeTab == 'field' && <>
            <Row gutter={[5, 5]} align="bottom">
                <Col flex="180px">
                    <div><Label>Type *</Label></div>
                    <Select value={state.type} onChange={(val) => onSettingsChange('type', val)} style={{ width: "100%" }} options={forms_fieldDefinations} />
                </Col>
                <Col flex="auto">
                    <div><Label>Label *</Label></div>
                    <Input name='label' value={state.label} placeholder='Label' onChange={(e) => onSettingsChange('label', e.target.value)} />
                </Col>
                <Col>
                    <IconButton
                        style={{ marginBottom: "5px" }}
                        onClick={() => onAttributeChange('hideLabel', (state?.attributes?.hideLabel == 'yes') ? 'no' : 'yes')}
                        color={(state?.attributes?.hideLabel == 'yes') ? 'red' : 'white'}
                        shape='circle' size="small"
                        icon={(state?.attributes?.hideLabel == 'yes') ? <EyeInvisibleFilled /> : <EyeFilled />}
                    />
                </Col>
            </Row>
        </>}

        {/* Placeholder field selection */}
        {state.type == 'placeholder' && <>
            <Row gutter={[10, 10]}>
                <Col span={12}>
                    <Label>Step</Label>
                    <Select value={state.name} 
                        onChange={(val) => {
                            setState((args) => {
                                return { ...state, 
                                    name: val,
                                    value: undefined
                                }
                            })
                        }} 
                        style={{ width: "100%" }}
                        options={form?.steps?.map(o => ({ value: o.identifier, label: o.title }))}
                    />
                </Col>
                <Col span={12}>
                    {state.name && <>
                        <Label>Field</Label>
                        <Select value={state.value} onChange={(val) => onSettingsChange('value', val)} style={{ width: "100%" }}
                            options={form?.steps?.find(o => o.identifier == state.name)?.fields?.map((o, field_index) => ({ value: o.identifier, label: o.label }))}
                        />
                    </>}
                </Col>
            </Row>

            {/* <DevBlock obj={state} /> */}
        </>}


        {state.type != 'placeholder' && <>
            {activeTab == 'field' && <>
                <Row gutter={[5, 5]} align="bottom">
                    {forms_fieldDefinations?.find(o => o.value == state.type)?.type == 'ui_elements' && <Col span={24}>
                        <div><Label>Default Value</Label></div>
                        <Input name='defaultValue' value={state.defaultValue} placeholder='Default Value' onChange={(e) => onSettingsChange('defaultValue', e.target.value)} />
                    </Col>}

                    {['text', 'select', 'radio'].includes(thisFieldDefination.value) && mode == 'exam' && <Col span={24}>
                        {/* <DevBlock obj={state.options} /> */}
                        <div style={{ border: "0px solid red", borderRadius: "5px", margin: "10px 3px", padding: "0px" }}>
                            <Label>Correct Answer *</Label>
                            {state?.options?.length > 0 ? <>
                                <Select value={state?.attributes?.answer} onChange={(val) => onAttributeChange('answer', val)} style={{ width: "100%" }} options={state.options} />
                            </> : <>
                                <Input status="error" name='answer' value={state?.attributes?.answer} onChange={(val) => onAttributeChange('answer', val)} />
                            </>}
                        </div>
                    </Col>}

                    {/* {(mode=="exam") && <>
                        <div><Label>Correct Answer *</Label></div>
                        <Input name='correct_value' value={state.correct_value} placeholder='Correct Answer' onChange={(e) => onSettingsChange('correct_value', e.target.value)} />
                    </>} */}
                </Row>
            </>}

            {activeTab == 'settings' && <>
                {/* <Divider orientation='left' style={{ fontWeight: "bold" }}>Settings</Divider> */}
                <Row gutter={[5, 5]}>
                    {thisFieldDefination?.attributes?.includes('placeholder') && <Col span={float ? 24 : 16}>
                        <div><Label>Placeholder</Label></div>
                        <Input name='placeholder' value={state?.attributes?.placeholder} placeholder='placeholder' onChange={(e) => onAttributeChange('placeholder', e.target.value)} />
                    </Col>}

                    {!float && thisFieldDefination?.attributes?.includes('span') && <Col flex="80px">
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
                        <div><Label>Style</Label></div>
                        {/* <Row>
                            <Col flex="auto"><div><Label>Style</Label></div></Col>
                            <Col><Button onClick={setFloatStyle} size="small">Float</Button></Col>
                        </Row> */}
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
            </>}


        </>}


        {/* {thisFieldDefination.value == 'select' && <Col span={24}><div style={{ padding: "5px 3px" }}>
            <OptionEditor />
        </div></Col>} */}

        {activeTab == 'field' && <>
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

            </Row>
        </>}

        <Row>
            <Col span={24} style={{ marginTop: "10px" }}><hr /></Col>
            <Col span={12}><Button color="red" onClick={onFieldDelete}>Delete</Button></Col>
            <Col span={12} align="right"><Button color="orange" onClick={onSavePress}>Save</Button></Col>
        </Row>


        {/* <DevBlock obj={state?.attributes} title="attributes" /> */}
    </div>);

    return (<Popover content={popoverContent} open={isOpen} onOpenChange={set_isOpen} title={false} trigger="click" placement='left' destroyTooltipOnHide>
        <MenuButton color="blue" shape="round" size="small" />
    </Popover>)
}
