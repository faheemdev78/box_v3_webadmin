import React from 'react'
import { basketCategories } from '@_/configs'
import { Row, Col, Divider, message } from 'antd';
import { FormField, submitHandler, SubmitButton } from '@/components/form'
import { Form as FinalForm, useForm } from 'react-final-form';
import { Icon } from '@/components'
import { __error } from '@_/lib/consoleHelper';
import { formToFilter } from '@_/lib/utill';


const BasketFilter = props => {
    const onSubmit = values => {
        let filter = formToFilter(values)
        props.onSearch(filter);
    }

    return (<div>
        <FinalForm onSubmit={onSubmit} initialValues={props.defaultValue}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;
                return (<>
                    <form id="BasketFilterForm" {...submitHandler(formargs)}>
                        <Row gutter={[10, 10]} align="bottom">
                            <Col flex="200px"><FormField type="select" options={basketCategories} name="category" placeholder="Category" label="Category" compact allowClear size="small" /></Col>
                            <Col><SubmitButton loading={props.loading || submitting} label={<Icon icon="search" />} /></Col>
                        </Row>
                        {/* <DevBlock obj={values} title="values" /> */}
                    </form>
                </>)

            }}
        />
    </div>)
}

export default BasketFilter;