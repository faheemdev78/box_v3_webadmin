'use client'

import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { Row, Col, Divider, message, Cascader, Input, AutoComplete, Avatar } from 'antd';
import { __error } from '@_/lib/consoleHelper';
import { DevBlock, Icon, Button, Loader, IconButton } from '@_/components';
import _ from 'lodash';
import { useMutation, useLazyQuery } from '@apollo/client';

import PRODUCTS from '@_/graphql/product/products.graphql'


const renderItem = (id, title, picture_thumb) => ({
    value: title,
    product: { _id: id, title, picture_thumb },
    label: (<Row align="middle">
        <Col style={{ paddingRight: 5 }}>{<Avatar src={picture_thumb ? `${process.env.NEXT_PUBLIC_CDN_ASSETS}/${picture_thumb}` : null} icon={<Icon icon="image" />} />}</Col>
        <Col flex="auto">{title}</Col>
    </Row>),
});


export const ProductBarcodeFilter = props => {
    const [busy, setBusy] = useState(false)
    const [results, setResults] = useState([])

    const [products, { called, loading }] = useLazyQuery(
        PRODUCTS,
        { variables: { filter: JSON.stringify({}) } }
    );

    const searchProduct = async(value) => {
        setResults([
            {
                disabled: true,
                label: <Row><Col flex="auto">Search Results</Col><Col><Loader loading={true} /></Col></Row>,
                // options: [renderItem('AntDesign', 10000), renderItem('AntDesign UI', 10600)],
            }
        ]);


        let results = await products({ 
            variables: { filter: JSON.stringify({ barcode: value }) },
            fetchPolicy: "no-cache",
        })
            .then(r => r?.data?.products)
            .catch(err=>{
                console.log(__error("Error: "), err)
                return { error:{message:"Invalid response!"}}
            })

        setResults([])

        if (results && results.error){
            message.error(results?.error?.message);
            return;
        }
        if (!results || results.length<1){
            message.error("Invalid barcode");
            return;
        }

        const product = results[0];
        setResults([
            {
                disabled: false,
                label: <b>Search results</b>,
                options: [renderItem(product._id, product.title, product.picture_thumb)],
            }
        ])

    }
    // const debounced = (value) => _.debounce((value) => searchProduct(value), 1000, { 'maxWait': 1000 });
    const debounced = _.debounce(searchProduct, 1000, { 'maxWait': 5000, trailing: true });

    const onTextUpdate = value => {
        if (!value || value.length < 3) return;
        debounced(value);
    }

    return (<div className="pagination-filter" style={{ borderRadius: 5 }}>
        <Row className="pagination-filter-row" align="middle" gutter={[5, 5]}>
            <Col><Icon icon="barcode" color="#999" size={"2x"} /></Col>
            <Col flex="auto">
                <AutoComplete
                    defaultActiveFirstOption
                    onSearch={onTextUpdate}
                    onSelect={(__, val) => props.onEditClick(val.product)}
                    // popupClassName="certain-category-search-dropdown"
                    classNames={{
                        popup: {
                            root: 'certain-category-search-dropdown'
                        }
                    }}
                    // dropdownClassName="certain-category-search-dropdown"
                    style={{ width: '100%' }}
                    // dropdownMatchSelectWidth={300}
                    popupMatchSelectWidth={300}
                    // placeholder="Search Barcode"
                    options={results}
                >
                    <Input.Search size="large" placeholder="Search Barcode" />
                </AutoComplete>
            </Col>
        </Row>
    </div>)

}
ProductBarcodeFilter.propTypes = {
    onEditClick: PropTypes.func.isRequired,
    // exclude: PropTypes.array,
}
