import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { Row, Col, Divider, message, Alert } from 'antd';
import { __error } from '@_/lib/consoleHelper';
import { publishStatus } from '@_/configs';
import { Loader, DevBlock, Button, Icon } from '@_/components';
// import { ProdCatSelection } from '@_/components/admin';
import { BrandsDD, ProdTypeDD, ProdCatsDD } from '@_/components/dropdowns';

import { formToFilter } from '@_/lib/utill';

import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays'
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, FormFieldGroup } from '@_/components/form';

// import LIST_CATS from '@_/graphql/product_cat/productCats.graphql'

const defaultFilter = { status: 'online' }

export const ProductFilter = props => {
    const [error, setError] = useState(null)
    const exclude = props.exclude || [];

    const onSubmit = values => {
        let filter = formToFilter(values)
        props.onChange({ filter })
    }

    if (props.loading) return <Loader loading={true} />

    return (<div style={{ border:"1px solid black"}}>
        <FinalForm onSubmit={onSubmit} initialValues={{ ...defaultFilter, ...props.defaultValue }}
            mutators={{ ...arrayMutators }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                return (<>
                    {error && <Alert message={error} showIcon type='error' />}
                    <form id="ProductFilterForm" {...submitHandler(formargs)}>
                        {/* <FormField name="username" label="Email / Login ID" type="text" validate={rules.required} /> */}

                        <Row>
                            
                            {exclude.indexOf('search.keywords') < 0 && <Col>
                                <FormField type="text" // prefix={<Icon icon="user" color="#CCC" />} 
                                    name="search.keywords" placeholder="keyword to search..." label="Keyword search" width="200px" compact allowClear size="small" />
                            </Col>}
                            
                            {exclude.indexOf('_id_cat') < 0 && <Col>
                                <ProdCatsDD compact allowClear preload
                                    name="_id_cat" placeholder="Category" label="Category" width="200px" size="small"
                                    inputProps={{
                                        showSearch: true,
                                        filterOption: (input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
                                    }}
                                />
                            </Col>}
                            {exclude.indexOf('_id_type') < 0 && <Col>
                                <ProdTypeDD
                                    name="_id_type" placeholder="Product Type" label="Product Type" width="200px" compact allowClear preload size="small"
                                    inputProps={{
                                        showSearch: true,
                                        filterOption: (input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
                                    }}

                                />
                            </Col>}
                            {exclude.indexOf('status') < 0 && <Col>
                                <FormField type="select" options={publishStatus} name="status" placeholder="Status" label="Status" width="100px" compact allowClear size="small" />
                            </Col>}
                            {exclude.indexOf('brand') < 0 && <Col>
                                <BrandsDD name="brand*_id" filter={{}} label="Brands" placeholder="Search Brands..." width="150px" compact preload localsearch allowClear size="small" />
                            </Col>}

                            <Col className="go-column">
                                <Button className="send_button" loading={props.loading} htmlType="submit"><Icon icon="search" /></Button>
                            </Col>
                        </Row>

                    </form>
                </>)

            }}
        />

    </div>)

}

ProductFilter.propTypes = {
    onChange: PropTypes.func.isRequired,
    // onSearch: PropTypes.func.isRequired,
    exclude: PropTypes.array,
}
export default ProductFilter;