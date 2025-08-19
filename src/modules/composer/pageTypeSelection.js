'use client'
import React from 'react'
import { Col, Row } from 'antd'
import { Button } from '@_/components'

const pageTypeArray = [
    { title: "Home Page", type: "home_page" },
    { title: "Category Page", type: "category_page" },
    { title: "Store Page", type: "store_page" },
    { title: "Brand Page", type: "brand_page" },
    { title: "Product Details", type: "prod_page" },
    { title: "Product Collection", type: "prod_collection_page" },
    { title: "Blank Page", type: "blank_page" },
]

export function PageTypeSelection({ onUpdate }) {
    return (<div align="center">
        <h2>Chose Your Page</h2>
        <p>What kind of page would you like to create?</p>

        <div style={{ textAlign: "center", maxWidth: "935px", margin: "20px 0" }}>
            <Row gutter={[20, 20]} align="center">
                {pageTypeArray.map((item, i) => (<Col key={i}>
                    <div style={{ border: "1px solid #7FD1DE", width: "218px", height: "260px" }}>
                        <Button onClick={() => onUpdate(item)}>{item.title}</Button>
                    </div>
                </Col>))}
            </Row>
        </div>
    </div>)
}
