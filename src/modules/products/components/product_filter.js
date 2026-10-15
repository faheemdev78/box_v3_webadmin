import React, { useState } from 'react'
import { Row, Col, Divider, message, Alert, Space } from 'antd';
import { __error } from '@/lib/consoleHelper';
import { tempSensitivityArray } from '@/configs';
import { Loader, DevBlock, Button, Icon } from '@/components';
// import { ProdCatSelection } from '@/components/admin';
import { BrandsDD, ProdTypeDD, ProdCatsDD } from '@/components/dropdowns';
import { productFilterToFormValues, productFormValuesToFilter } from './productFilterValues';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
// import { FieldArray } from 'react-final-form-arrays'
import arrayMutators from 'final-form-arrays'
import { FormField, submitHandler } from '@/components/form';

// import LIST_CATS from '@/graphql/product_cat/productCats.graphql'


const productStatusOptions = [
    { label: 'Online', value: 'online' },
    { label: 'Offline', value: 'offline' },
    { label: 'Draft', value: 'draft' },
    { label: 'Out of stock', value: 'out-of-stock' },
]

const unfitForBoxOptions = [
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' },
]

export const ProductFilter = props => {
    const [error, setError] = useState(null)
    const exclude = props.exclude || [];

    const onSubmit = values => {
        const filter = productFormValuesToFilter(values)
        props.onChange({ filter })
    }

    if (props.loading) return <Loader loading={true} />

    return (<div style={{ border:"0px solid black"}}>
        <FinalForm onSubmit={onSubmit} initialValues={productFilterToFormValues(props.defaultValue)}
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
                                    name="categories*_id" placeholder="Category" label="Category" size="small"
                                    inputProps={{
                                        showSearch: true,
                                        filterOption: (input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
                                    }}
                                />
                            </div>}

                            {exclude.indexOf('_id_type') < 0 && <div style={{ width:"200px" }}>
                                <ProdTypeDD name="type*_id" placeholder="Product Type" label="Product Type" compact allowClear preload size="small"
                                    inputProps={{
                                        showSearch: true,
                                        filterOption: (input, option) =>
                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
                                    }}
                                />
                            </div>}

                            {exclude.indexOf('status') < 0 && <div style={{ width:"100px" }}>
                                <FormField type="select" options={productStatusOptions} name="status" placeholder="Any" label="Status" compact allowClear size="small" />
                            </div>}

                            {exclude.indexOf('brand') < 0 && <div style={{ width:"200px" }}>
                                <BrandsDD name="brand*_id" filter={{}} label="Brands" placeholder="Search Brands..." compact preload localsearch allowClear size="small" />
                            </div>}

                            {exclude.indexOf('temp_sensitivity') < 0 && <div style={{ width:"130px" }}>
                                <FormField
                                    type="select"
                                    options={tempSensitivityArray}
                                    name="temp_sensitivity"
                                    placeholder="Temp"
                                    label="Temperature"
                                    compact
                                    allowClear
                                    size="small"
                                />
                            </div>}

                            {exclude.indexOf('unfit_for_dispatch') < 0 && <div style={{ width:"130px" }}>
                                <FormField
                                    type="select"
                                    options={unfitForBoxOptions}
                                    name="unfit_for_dispatch"
                                    placeholder="Any"
                                    label="Not fit for box"
                                    compact
                                    allowClear
                                    size="small"
                                />
                            </div>}

                            {exclude.indexOf('out_of_stock') < 0 && <div style={{ width: "150px" }}>
                                <FormField type="switch" // prefix={<Icon icon="user" color="#CCC" />} 
                                    name="out_of_stock" label="Out Of Stock" compact size="small"
                                />
                            </div>}

                            <div style={{ paddingTop:"0px", paddingLeft:"16px", borderLeft:"1px solid #DDD" }}>
                                <Button className="send_button" loading={props.loading} htmlType="submit"><Icon icon="search" /></Button>
                            </div>
                        </Space>


                        {/* <DevBlock obj={values} /> */}

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
