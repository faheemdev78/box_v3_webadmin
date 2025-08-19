'use client'
import React from 'react'
import { Alert, Col, Row } from 'antd'
import { Button, DevBlock } from '@_/components'
import { components } from './components';
import styles from './Composer.module.scss';


const RenderProps = ({ item, item: { name, data, value } }) => {
    // Render Text Components
    let found = components.find(o => o.type == data?.type)
    if (!found) return <Alert type="error" message="Props not deifned" />

    return found.propsRender({ item })
}

export const PropsWindow = ({ item, onClose }) => {

    return (<div style={{ width: "420px", backgroundColor:"#D0DAE5" }}>
        <div className={styles.props_view_header}>
            <Row align="middle">
                <Col flex="auto">{item?.data?.label}</Col>
                <Col><Button onClick={onClose}>Close</Button></Col>
            </Row>
        </div>
        <div className={`${styles.props_view_wrapper} ${styles.custom_scroller}`}>
            <div style={{ textAlign:"left", width:"100%" }}>
                <div style={{ padding:"15px" }}><RenderProps item={item} /></div>
            </div>
        </div>
    </div>)
}
