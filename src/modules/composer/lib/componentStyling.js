import React from 'react'
import { Card, Col, Divider, Row, Space } from 'antd'
// import { Heading } from '../typography'
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@/components/form';
import { useForm, Field } from 'react-final-form'
import { IconButton } from '@/components'

export function ComponentStyling({ name, showHeading=true }) {
    // const form = useForm()
    // const getFieldValue = (field_name) => form.getFieldState(name ? `${name}.${field_name}` : field_name)

    const bgTypeName = name ? `${name}.styles.background.type` : `styles.background.type`;
    const bgDirName = name ? `${name}.styles.background.direction` : `styles.background.direction`;
    const bgColor1Name = name ? `${name}.styles.background.color1` : `styles.background.color1`;
    const bgColor2Name = name ? `${name}.styles.background.color2` : `styles.background.color2`;

    // TODO: add text color option

    return (<>
        {showHeading && <h2 align="center">Styling</h2>}

        <Divider>Spacing</Divider>
        <Row>
            <Col span={6}><FormField name={name ? `${name}.styles.padding.top` : `styles.padding.top`} label="Top" type='number' validate={rules.required} /></Col>
            <Col span={6}><FormField name={name ? `${name}.styles.padding.right` : `styles.padding.right`} label="Right" type='number' validate={rules.required} /></Col>
            <Col span={6}><FormField name={name ? `${name}.styles.padding.bottom` : `styles.padding.bottom`} label="Bottom" type='number' validate={rules.required} /></Col>
            <Col span={6}><FormField name={name ? `${name}.styles.padding.left` : `styles.padding.left`} label="Left" type='number' validate={rules.required} /></Col>
        </Row>

        <Divider>Background</Divider>

        <Row gutter={[10, 10]}>
            <Col flex="100px">
                <FormField
                    width="100px"
                    name={bgTypeName}
                    type="select"
                    label="Color Type"
                    options={[
                        { label: "Solid", value: "solid" },
                        { label: "Gradient", value: "gradient" },
                    ]}
                />
            </Col>
            <Col flex="auto">
                <Field name={bgTypeName} subscription={{ value: true }}>
                    {({ input }) => {
                        const type = input.value;

                        return (<Row gutter={[10, 10]}>
                            {type === 'gradient' && (<Col flex="110px">
                                <FormField
                                    name={bgDirName}
                                    type="select"
                                    label="Direction"
                                    options={[
                                        { label: "Vertical", value: "vertical" },
                                        { label: "Horizontal", value: "horizontal" },
                                    ]}
                                />
                            </Col>)}

                            {type === 'solid' && (<Col style={{ marginTop: "20px" }}>
                                <FormField name={bgColor1Name} type="color" _label="Color 1" compact />
                            </Col>)}

                            {type === 'gradient' && (<Col style={{ marginTop:"20px" }}><Space>
                                <FormField name={bgColor1Name} type="color" _label="Color 1" compact />
                                <FormField name={bgColor2Name} type="color" _label="Color 2" compact />
                            </Space></Col>)}
                        </Row>);
                    }}
                </Field>
            </Col>
        </Row>

        <Space size={5} orientation='horizontal'>


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

    </>)
}

