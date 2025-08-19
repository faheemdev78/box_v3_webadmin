// 'use client'
// import React from 'react'
import { Col, Row } from 'antd'

export const DataRow = ({ label, children, horizontal }) => {
    return (<>
        <Row gutter={[10]}>
            {label && <Col className='label' span={!horizontal ? 24 : undefined}>{label}</Col>}
            <Col span={!horizontal ? 24 : undefined}>{children}</Col>
        </Row>
    </>)
}
