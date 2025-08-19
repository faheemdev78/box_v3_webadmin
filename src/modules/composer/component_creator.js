'use client'
import React, { useState } from 'react'
import { Form as FinalForm, Field as FinalField } from 'react-final-form';
import { FormField, SubmitButton, rules, composeValidators, submitHandler } from '@_/components/form';
import { sleep } from "@_/lib/utill";
import { Alert, Row, Col, Space } from 'antd';


export default function ComponentCreator() {
  const [error, setError] = useState(null)

  const onSubmit = async (values) => {
    await sleep(1500)
    return false;
  }


  return (<>
    <div>ComponentCreator</div>

    <Row>
      <Col flex="300px">
        <Space direction='vertical'>
          <h3>Form</h3>
          <div>Text Field</div>
          <div>Text Area</div>
          
          <h3>Text</h3>
          <div>Simple Text</div>
          <div>Heading 1</div>
          <div>Heading 2</div>
          <div>Heading 3</div>
          <div>Heading 4</div>

          <h3>Image</h3>
          <div>Prod image 1</div>
        </Space>
      </Col>
      <Col flex="auto">
        <FinalForm onSubmit={onSubmit}
          render={(formargs) => {
            const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

            return (<>
              {error && <Alert message={error} showIcon type='error' />}
              <form id="component_creator_form" {...submitHandler(formargs)}><Row gutter={[10, 10]}>

                <Col span={24}><FormField name="title" label="title" type="text" validate={rules.required} /></Col>
                <Col span={24}><FormField name="pwd" label="Password" type="password" validate={rules.required} /></Col>
                <Col span={24} align="center"><SubmitButton loading={submitting} disabled={invalid} color="orange" label="Log-In" /></Col>

              </Row></form>
            </>)

          }}
        />
      </Col>
    </Row>



  </>)
}
