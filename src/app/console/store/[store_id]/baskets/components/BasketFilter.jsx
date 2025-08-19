import React from 'react'
import { basketCategories } from '@_/configs'
import { Row, Col, Divider, message } from 'antd';
import { FormField, FormComponent, FormFieldGroup, DateField } from '@/components/form'
import { DevBlock, Icon, Button, Loader, IconButton } from '@/components'
import { __error } from '@_/lib/consoleHelper';
import { formToFilter } from '@_/lib/utill';


const BasketFilter = props => {
    const onSubmit = values => {
        let filter = formToFilter(values)
        props.onSearch(filter);
    }

    return (<div className="pagination-filter">
        <FormComponent onSubmit={onSubmit} id='BasketFilterForm' hideDevBlock={true} fields={props.defaultValue} style={{ padding: 0 }} 
            form_render={({ values })=>{
                return(<>
                    <Row className="pagination-filter-row">
                        <Col flex="auto" className="filters-column">
                            {/* <FormFieldGroup compact style={{ padding: 0, margin: 0 }}> */}
                                <FormField type="select" data={basketCategories} name="category" placeholder="Category" label="Category" width="200px" compact allowClear size="small" />
                            {/* </FormFieldGroup> */}
                        </Col>
                        <Col className="go-column">
                            <Button className="send_button" loading={props.loading} htmlType="submit"><Icon icon="search" /></Button>
                        </Col>
                    </Row>
                </>)
            }}
        />
    </div>)

}

export default BasketFilter;