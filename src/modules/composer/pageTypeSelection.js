'use client'
// import React from 'react'
import { Col, Row } from 'antd'
// import { Button } from '@/components'
import Image from 'next/image';
import styles from './Composer.module.scss'

// import mySvg from '../public/my-icon.svg';

const pageTypeArray = [
    { title: "Home Page", desc: "based on homepage template", type: "home_page", icon: "/images/home_page_icon.svg", },
    { title: "Category Page", desc: "based on category page", type: "category_page", icon: "/images/cat_page_icon.svg" },
    { title: "Store Page", desc: "based on store page", type: "store_page", icon: "/images/store_page_icon.svg" },
    { title: "Brand Page", desc: "based on brand page", type: "brand_page", icon: "/images/brand_page_icon.svg" },
    { title: "Product Details", desc: "based on product page", type: "prod_page", icon: "/images/prod_page_icon.svg" },
    { title: "Product Collection", desc: "free style custom product collection", type: "prod_collection_page", icon: "/images/collection_page_icon.svg" },
    { title: "Blank Page", desc: "empty page for custom build", type: "blank_page", icon: "/images/blank_page_icon.svg" },
]

export function PageTypeSelection({ onUpdate }) {
    return (<div align="center">
        <h2>Chose Your Page</h2>
        <p>What kind of page would you like to create?</p>

        <div style={{ textAlign: "center", maxWidth: "935px", margin: "20px 0", cursor: "pointer" }}>
            <Row gutter={[20, 20]} align="center">
                {pageTypeArray.map((item, i) => (<Col key={i}>
                    <div onClick={() => onUpdate(item)} className={styles.template_selection_block}>
                        {item.icon && <Image className={styles.icon} src={item.icon} width={80} height={62} alt={item.title} />}
                        <div>{item.title}</div>
                        <div style={{ color:"#89A3BE", fontSize: "11px" }}>{item.desc}</div>
                        {/* <Button onClick={() => onUpdate(item)}>{item.title}</Button> */}
                    </div>
                </Col>))}
            </Row>
        </div>
    </div>)
}
