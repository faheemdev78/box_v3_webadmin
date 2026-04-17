'use client'
import React, { useState, useEffect } from 'react'
import { message, Row, Col, Button, Card, Divider } from 'antd'
import { Icon } from '@/components';
import { __error } from '@/lib/consoleHelper';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { FormField, rules } from '@/components/form';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';

import GET_TYPE from '@/graphql/product_type/prodType.graphql'


export const ProductAttributesSelector = props => {
    // const [loading, setLoading] = useState(false);
    const [prodType, setProdType] = useState(null);
    const [attrOnDD, setAttrOnDD] = useState();
    const [attributesList, setAttributesList] = useState(props?.formValues?.attributes || []);

    const [get_prodType, { called, loading }] = useLazyQuery(GET_TYPE, { fetchPolicy: 'network-only' });

    const getProdType = async (_id_type) => {
        if (!_id_type) return;

        let results = await get_prodType({ variables: { id: _id_type } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.prodType }))
            .catch(catchApolloError)

        if (results && results.error) {
            message.error(results.error.message)
            setProdType(null)
            return false;
        }
        if (!results) return;
        setProdType(results)

        const _attr = props.defaultValues?.filter(o => {
            let found = results?.attributes?.find(oo => oo._id == o._id);
            if (!found) return false;
            return { ...found, value: o.value, id: o._id }
        })
        setAttributesList(_attr);
    }
    
    useEffect(() => {
        if (!prodType || props._id_type != prodType._id) {
            getProdType(props._id_type);
            // sleep(2000)
        }
        
    }, [props._id_type])

    const onAttributeSelection = (__1, __2) => {
        const item_data = __2["item-data"];
        setAttrOnDD(item_data);
    }

    const addAttribute = args => {
        if (attributesList?.find(o => o._id == props.formValues.attr_selector)) return;

        let _attributesList = attributesList?.slice() || [];
        _attributesList.push(attrOnDD);

        setAttributesList(_attributesList)
        props.updateAttributes(_attributesList)

    }

    const removeAttribute = __id => {
        const _attributesList = attributesList.filter(o => (o._id != __id));
        setAttributesList(_attributesList)
        props.updateAttributes(_attributesList)
    }

    if (loading) return <Card>
        <Divider>Attributes</Divider>
    </Card>

    return (<>
        <Card>

            <Row>
                <Col flex="auto" align="middle"><Divider>Attributes</Divider></Col>
                <Col align="middle" flex="150px">
                    <FormField compact
                        style={{ textAlign: "left" }}
                        data={prodType?.attributes?.map(o => ({ ...o, _id: o._id, id: o._id })) || []}
                        type="select"
                        placeholder="Add Attribute"
                        name="attr_selector"
                        onSelect={onAttributeSelection}
                    />
                </Col>
                <Col align="middle"><Button disabled={!props?.formValues?.attr_selector} onClick={() => addAttribute()} icon={<Icon icon="plus" />} /></Col>
            </Row>

            <div className="data-row-table">
                <Row>
                {attributesList && attributesList.map((item, i) => {
                    return <Col key={i} flex="33%" style={{ minWidth: "250px" }}>
                        <div style={{ backgroundColor: "#EEE", borderRadius: "5px", margin: "5px", padding: "5px 10px" }}>
                            <Row key={i} style={{ flexWrap: "nowrap" }} align="bottom">
                                <Col flex="auto">
                                    <FormField compact
                                        addonAfter={item.code}
                                        name={`attribute_values.val_${item._id}`}
                                        validate={item.required ? rules.required : undefined}
                                        label={item.title}
                                        defaultValue={item.value}
                                        width={"100%"} type="text" />
                                </Col>
                                <Col style={{ paddingLeft: "10px" }}><Button type="danger" onClick={() => removeAttribute(item._id)} icon={<Icon icon="times" />} /></Col>
                            </Row>
                        </div>
                    </Col>
                })}</Row>
            </div>

        </Card>
    </>)

}
// ProductAttributesSelector.propTypes = {
//     updateAttributes: PropTypes.func.isRequired, // mutator
//     attributes: PropTypes.array,
//     _id_type: PropTypes.string,
//     defaultValues: PropTypes.array,
// }
