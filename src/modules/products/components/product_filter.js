import React, { useState } from 'react'
import { Row, Col, Divider, message, Alert, Space } from 'antd';
import { __error } from '@/lib/consoleHelper';
import { publishStatus } from '@/configs';
import { Loader, DevBlock, Button, Icon } from '@/components';
// import { ProdCatSelection } from '@/components/admin';
import { BrandsDD, ProdTypeDD, ProdCatsDD } from '@/components/dropdowns';
import { formToFilter } from '@/lib/utill';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
// import { FieldArray } from 'react-final-form-arrays'
import arrayMutators from 'final-form-arrays'
import { FormField, submitHandler } from '@/components/form';

// import LIST_CATS from '@/graphql/product_cat/productCats.graphql'


const defaultFilter = { status: 'online' }

export const ProductFilter = props => {
    const [error, setError] = useState(null)
    const exclude = props.exclude || [];

    const onSubmit = values => {
        let filter = formToFilter(values)
        props.onChange({ filter })
    }

    if (props.loading) return <Loader loading={true} />

    return (<div style={{ border:"0px solid black"}}>
        <FinalForm onSubmit={onSubmit} initialValues={{ ...defaultFilter, ...props.defaultValue }}
            mutators={{ ...arrayMutators }}
            render={(formargs) => {
                const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;

                return (<>
                    {error && <Alert title="Error" description={error} showIcon type='error' />}
                    <form id="ProductFilterForm" {...submitHandler(formargs)}>
                        {/* <FormField name="username" label="Email / Login ID" type="text" validate={rules.required} /> */}

                        <Space style={{ marginBottom:"5px" }}>
                            {exclude.indexOf('search.keywords') < 0 && <div style={{ width:"200px" }}>
                                <FormField type="text" // prefix={<Icon icon="user" color="#CCC" />} 
                                    name="search.keywords" placeholder="keyword to search..." label="Keyword search" compact allowClear size="small"
                                />
                            </div>}

                            {exclude.indexOf('_id_cat') < 0 && <div style={{ width:"200px" }}>
                                <ProdCatsDD compact allowClear preload
                                    name="_id_cat" placeholder="Category" label="Category" size="small"
                                    inputProps={{
                                        showSearch: true,
                                        filterOption: (input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
                                    }}
                                />
                            </div>}

                            {exclude.indexOf('_id_type') < 0 && <div style={{ width:"200px" }}>
                                <ProdTypeDD name="_id_type" placeholder="Product Type" label="Product Type" compact allowClear preload size="small"
                                    inputProps={{
                                        showSearch: true,
                                        filterOption: (input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
                                    }}
                                />
                            </div>}

                            {exclude.indexOf('status') < 0 && <div style={{ width:"100px" }}>
                                <FormField type="select" options={publishStatus} name="status" placeholder="Status" label="Status" compact allowClear size="small" />
                            </div>}

                            {exclude.indexOf('brand') < 0 && <div style={{ width:"200px" }}>
                                <BrandsDD name="brand*_id" filter={{}} label="Brands" placeholder="Search Brands..." compact preload localsearch allowClear size="small" />
                            </div>}
                            
                            <div style={{ paddingTop:"16px"}}>
                                <Button className="send_button" loading={props.loading} htmlType="submit"><Icon icon="search" /></Button>
                            </div>
                        </Space>

                    </form>
                </>)

            }}
        />

    </div>)

}

// ProductFilter.propTypes = {
//     onChange: PropTypes.func.isRequired,
//     // onSearch: PropTypes.func.isRequired,
//     exclude: PropTypes.array,
// }
export default ProductFilter;