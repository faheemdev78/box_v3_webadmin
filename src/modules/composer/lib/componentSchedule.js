import React from 'react'
import { Card, Col, Row, Space } from 'antd'
import { Heading } from '../typography'
import { FormField } from '@_/components/form'
import { useForm } from 'react-final-form'
// import { IconButton } from '@_/components'

export function ComponentSchedule({ name }) {
    const form = useForm()
    const getFieldValue = (field_name) => form.getFieldState(`${name}.${field_name}`)

    return (<>
        <Card styles={{ body: { padding: "10px" } }}>
            <Heading>Schedule</Heading>
            <Row>
                <Col span={12}><FormField name={`${name}.schedule_start`} label="Start" type='date' /></Col>
                <Col span={12}><FormField name={`${name}.schedule_end`} label="End" type='date' /></Col>
            </Row>
        </Card>
    </>)
}

