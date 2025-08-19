'use client'
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types';
import { message, Row, Col, Button, Card, Divider } from 'antd'
// import { Heading, Loader, DevBlock, Icon } from 'Common/components'
import { Icon } from '@_/components';
// import { rules, Select, FormField } from 'Common/components/Form'
import { __error } from '@_/lib/consoleHelper';
import { useMutation, useLazyQuery } from '@apollo/client';

import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays'
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, FormFieldGroup } from '@_/components/form';

import GET_TYPE from '@_/graphql/product_type/prodType.graphql'


export const ProductAttributesSelector = props => {
    // const [loading, setLoading] = useState(false);
    const [prodType, setProdType] = useState(null);
    const [attrOnDD, setAttrOnDD] = useState();
    const [attributesList, setAttributesList] = useState(props?.formValues?.attributes || []);

    const [get_prodType, { called, loading }] = useLazyQuery(
        GET_TYPE,
        // { variables: { filter: JSON.stringify({}) } }
    );

    useEffect(() => {
        if (!prodType || props._id_type != prodType._id) {
            getProdType(props._id_type);
            // sleep(2000)
        }
    }, [props._id_type])

    const getProdType = async (_id_type) => {
        if (!_id_type) return;

        let results = await get_prodType({ variables: { id: _id_type } })
        .then(r => (r?.data?.prodType))
        .catch(err=>{
            console.log(__error("Error: "), err)
            return { error:{message:"Invalid response!"}}
        })

        if (results && results.error){
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
ProductAttributesSelector.propTypes = {
    updateAttributes: PropTypes.func.isRequired, // mutator
    attributes: PropTypes.array,
    _id_type: PropTypes.string,
    defaultValues: PropTypes.array,
}
