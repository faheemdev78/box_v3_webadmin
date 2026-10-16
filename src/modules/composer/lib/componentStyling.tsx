import React from 'react'
import { Checkbox, Card, Col, Divider, Row, Space } from 'antd'
// import { Heading } from '../typography'
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@/components/form';
import { useForm, Field } from 'react-final-form'
import { BackgroundPicture } from './BackgroundPicture'

export const ComponentBackground = ({ name, bgTypeName, bgDirName, bgColor1Name, bgColor2Name }:{
    name: string,
    bgTypeName: string,
    bgDirName: string,
    bgColor1Name: string,
    bgColor2Name: string,
}) => {
    return (<>
        <Divider>Component Background</Divider>

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

                            {type === 'solid' && (<Col style={{ marginTop: "0px" }}>
                                <FormField name={bgColor1Name} type="color" label="&nbsp;" compact />
                            </Col>)}

                            {type === 'gradient' && (<Col ><Space>
                                <FormField name={bgColor1Name} type="color" label="&nbsp;" compact />
                                <FormField name={bgColor2Name} type="color" label="&nbsp;" compact />
                            </Space></Col>)}
                        </Row>);
                    }}
                </Field>
            </Col>
        </Row>

        <BackgroundPicture key={name || 'page'} name={name} />
    </>)
}

export function ComponentStyling({ name, showHeading=true, showBorder=true }) {
    // const form = useForm()
    // const getFieldValue = (field_name) => form.getFieldState(name ? `${name}.${field_name}` : field_name)

    const bgTypeName = name ? `${name}.styles.background.type` : `styles.background.type`;
    const bgDirName = name ? `${name}.styles.background.direction` : `styles.background.direction`;
    const bgColor1Name = name ? `${name}.styles.background.color1` : `styles.background.color1`;
    const bgColor2Name = name ? `${name}.styles.background.color2` : `styles.background.color2`;

    // TODO: add text color option

    return (<>
        {showHeading && <h2 style={{ textAlign:"center" }}>Styling</h2>}

        <Divider>Spacing</Divider>
        <Row>
            <Col span={6}><FormField name={name ? `${name}.styles.padding.top` : `styles.padding.top`} label="Top" type='number' validate={rules.required} /></Col>
            <Col span={6}><FormField name={name ? `${name}.styles.padding.right` : `styles.padding.right`} label="Right" type='number' validate={rules.required} /></Col>
            <Col span={6}><FormField name={name ? `${name}.styles.padding.bottom` : `styles.padding.bottom`} label="Bottom" type='number' validate={rules.required} /></Col>
            <Col span={6}><FormField name={name ? `${name}.styles.padding.left` : `styles.padding.left`} label="Left" type='number' validate={rules.required} /></Col>
        </Row>

        {showBorder && <><Divider>Border</Divider>
        <Row gutter={[8, 8]}>
            {['top', 'right', 'bottom', 'left'].map((side) => (
                <Col span={6} key={side}>
                    <Field name={name ? `${name}.styles.border.${side}` : `styles.border.${side}`} type="checkbox">
                        {({ input }) => (
                            <Checkbox checked={!!input.checked} onChange={(event) => input.onChange(event.target.checked)}>
                                {side.charAt(0).toUpperCase() + side.slice(1)}
                            </Checkbox>
                        )}
                    </Field>
                </Col>
            ))}
        </Row>
        <Row gutter={[10, 10]}>
            <Col span={7}>
                <FormField
                    name={name ? `${name}.styles.border.style` : `styles.border.style`}
                    type="select"
                    label="Style"
                    options={[
                        { label: 'Solid', value: 'solid' },
                        { label: 'Dashed', value: 'dashed' },
                        { label: 'Dotted', value: 'dotted' },
                    ]}
                />
            </Col>
            <Col span={6}><FormField name={name ? `${name}.styles.border.width` : `styles.border.width`} label="Thickness" type="number" /></Col>
            <Col span={6}><FormField name={name ? `${name}.styles.border.radius` : `styles.border.radius`} label="Radius" type="number" /></Col>
            <Col>
                <FormField name={name ? `${name}.styles.border.color` : `styles.border.color`} type="color" label="Color" />
            </Col>
        </Row>

        </>}

        <ComponentBackground name={name} bgTypeName={bgTypeName} bgDirName={bgDirName} bgColor1Name={bgColor1Name} bgColor2Name={bgColor2Name} />

    </>)
}

