import React from 'react'
import { Card, Col, Row, Space } from 'antd'
import { Heading } from '../typography'
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@_/components/form';
import { useForm } from 'react-final-form'
import { IconButton } from '@_/components'

export function ComponentStyling({ name, showHeading=true }) {
    const form = useForm()
    const getFieldValue = (field_name) => form.getFieldState(name ? `${name}.${field_name}` : field_name)

    return (<>
        {showHeading && <h2 align="center">Styling</h2>}
        <Card styles={{ body: { padding: "10px" } }}>

            <Heading>Spacing</Heading>
            <Row>
                <Col span={6}><FormField name={name ? `${name}.styles.padding.top` : `styles.padding.top`} label="Top" type='number' validate={rules.required} /></Col>
                <Col span={6}><FormField name={name ? `${name}.styles.padding.right` : `styles.padding.right`} label="Right" type='number' validate={rules.required} /></Col>
                <Col span={6}><FormField name={name ? `${name}.styles.padding.bottom` : `styles.padding.bottom`} label="Bottom" type='number' validate={rules.required} /></Col>
                <Col span={6}><FormField name={name ? `${name}.styles.padding.left` : `styles.padding.left`} label="Left" type='number' validate={rules.required} /></Col>
            </Row>


            <Heading style={{ marginTop:"10px" }}>Background</Heading>
            <Space size={5} direction='horizontal'>
                <FormField name={name ? `${name}.styles.background.type` : `styles.background.type`} type='select' label="Color Type" compact
                    wrapperStyle={{ width: "100px", border: "0px solid blue" }}
                    options={[
                        { label: "Solid", value: "solid" }, { label: "Gradient", value: "gradient" },
                        // { label: "Picture", value: "picture" },
                    ]}
                />
                {getFieldValue('styles.background.type')?.value == 'gradient' && <>
                    <FormField name={name ? `${name}.styles.background.direction` : `styles.background.direction`} type='select' label="Direction" compact
                        wrapperStyle={{ width: "120px" }}
                        options={[
                            { label: "Vertical", value: "vertical" },
                            { label: "Horizontal", value: "horizontal" },
                        ]}
                    />
                </>}
                {getFieldValue('styles.background.type')?.value == 'solid' && <div style={{ marginTop: "23px" }}>
                    <FormField name={name ? `${name}.styles.background.color1` : `styles.background.color1`} _label="Color 1" type="color" compact />
                </div>}
                {getFieldValue('styles.background.type')?.value == 'gradient' && <div style={{ marginTop: "23px" }}>
                    <Space direction='horizontal'>
                        <FormField name={name ? `${name}.styles.background.color1` : `styles.background.color1`} _label="Color 1" type="color" compact />
                        <FormField name={name ? `${name}.styles.background.color2` : `styles.background.color2`} _label="Color 2" type="color" compact />
                    </Space>
                </div>}
            </Space>

            <div>
                <FormField name={name ? `${name}.styles.background.upload_image` : `styles.background.upload_image`} label="Background Picture"
                    accept=".jpg,.jpeg,.png" limit={1} multiple={false} type="image" compact
                    itemRender={(originNode, file, fileList, actions) => { // { download, preview, remove }
                        return (<Row gutter={[0]} align="middle" style={{ border: "1px solid #EEE", borderRadius: "5px" }} className='nowrap'>
                            <Col flex="auto"><div style={{ width: "300px" }} className='ellipsis'>{file.name} {file.name}</div></Col>
                            <Col style={{ marginLeft: "10px" }}><IconButton size="small" onClick={() => actions.remove()} icon='trash-alt' /></Col>
                        </Row>)
                    }}
                />
            </div>

            {/* {getFieldValue('styles.background.type')?.value == 'picture' && <div>
                <FormField name={name ? `${name}.styles.background.image` : `styles.background.image`} _label="Background Picture" 
                    accept=".jpg,.jpeg,.png" limit={1} multiple={false} type="image" compact
                    itemRender={(originNode, file, fileList, actions) => { // { download, preview, remove }
                        return (<Row gutter={[0]} align="middle" style={{ border:"1px solid #EEE", borderRadius:"5px" }} className='nowrap'>
                            <Col flex="auto"><div style={{ width:"300px" }} className='ellipsis'>{file.name} {file.name}</div></Col>
                            <Col style={{ marginLeft:"10px" }}><IconButton size="small" onClick={() => actions.remove()} icon='trash-alt' /></Col>
                        </Row>)
                    }}
                />
            </div>} */}


        </Card>
    </>)
}

