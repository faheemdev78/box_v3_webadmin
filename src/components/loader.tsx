// 'use client'

// import React from 'react'
import { Spin, Avatar, List, Skeleton, Switch, Space, Row, Col } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import React from 'react';

export const Loader = ({ loading, children, style, className, size, center } : {
    loading: boolean;
    children?: React.ReactNode;
    style?: object;
    className?: string;
    size?: string | number;
    center?: boolean;
}) => {
    if (!loading) return children;

    let _style = {...style}
    if (center) Object.assign(_style, { width:"100%" })

    return (<Spin spinning={loading} size={size} delay={500} indicator={<LoadingOutlined />} style={_style} wrapperClassName={className}>
        {children}
    </Spin>)

    // return (<div style={{ position:"relative" }}>
    //     <div>{children}</div>
    //     <div style={{ backgroundColor:"rgba(255, 255, 255, 0.5)", width:"100%", height:"100%", position:"absolute", top:0, left:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
    //         <div>Loading....</div>
    //     </div>
    // </div>)
}

export const ProdSkeleton_ListItem = ({ loading, count=1, gutter=[10, 10], children }: {
    loading: boolean;
    count: number;
    gutter: number[] | [10, 10];
    children: React.ReactNode;
}) => {
    if (!loading) return children;
    
    let items = new Array(count).fill({})
    return (<Row gutter={0}>
        {items.map((item, i) => {
            return (<Col key={i} span={8} align="center">
                <Space direction='vertical' align='center'>
                    <Skeleton.Avatar active={loading} shape="square" size={120} />
                    <Skeleton.Node active={loading} style={{ width:"120px", height:"15px" }} />
                    <Skeleton.Node active={loading} style={{ width:"120px", height:"15px" }} />
                    <Skeleton.Node active={loading} style={{ width:"120px", height:"15px" }} />
                </Space>
            </Col>)
        })}
    </Row>)

    return (<Space direction='vertical'>
        <Skeleton.Avatar active shape="square" size={120} />
        <Skeleton.Input />
        <Skeleton.Input />
    </Space>)


    return (<Skeleton 
        loading={loading} 
        active 
        avatar={{
            active: true,
            shape: 'square',
            size: 100
        }} 
        paragraph={{
            rows: 4,
            width: 'auto'
        }} 
        round={false} 
        // title="Product"
        >
    </Skeleton>)
}