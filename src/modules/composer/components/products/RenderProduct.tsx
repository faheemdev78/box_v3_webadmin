'use client'
import { cdnImageUrl } from '@/lib/cdnImageUrl';
import React from 'react'
import { Col, Row, Skeleton, Space } from 'antd';
import cssStyles from './productList.module.scss'
import { Image, Icon } from '@/components';
import { __error } from '@/lib/consoleHelper';

interface ComposerProduct {
    _id?: string;
    title?: string;
    picture?: { thumbnails?: string[] } | null;
    attributes?: { val?: React.ReactNode; title?: React.ReactNode }[] | null;
    price?: number | null;
    price_was?: number | null;
}

interface RenderProductProps {
    item: ComposerProduct;
    off_percent: number;
    currency: string;
}

export function RenderProduct({ item, off_percent, currency }: RenderProductProps) {
    return (<>
        <div className={cssStyles.thumb} style={{}}>
            {item?.picture?.thumbnails ?
                <Image src={cdnImageUrl(item.picture.thumbnails[0])} width={142} height={142} alt={item.title} style={{ width: "100%", height: "140px", overflow:"hidden", border:"1px solid #EEE" }} /> :
                <Icon style={{ fontSize: "64px", color: "#999999" }} icon="image" />
            }
        </div>

        {(item?.attributes?.length ?? 0) > 0 && <Space size={2}>
            {item?.attributes?.map((o, ii) => (<div style={{ border: "1px solid #EDEFF3", borderRadius: "3px", backgroundColor: "#F5F6FB", fontSize: "11px" }} key={ii}>{o.val}{o.title}</div>))}
        </Space>}

        <div style={{ fontSize: "18px", color: "#3D3D3D" }}>{item.title || <Skeleton.Node style={{ width: "120px", height: "15px" }} />}</div>
        {off_percent > 0 && <div style={{ fontSize: "12px", color: "#1155CB" }}>{off_percent}% OFF</div>}

        <Row>
            <Col flex="auto" style={{ color: "#3D3D3D", fontSize: "14px", fontWeight: "bold" }}>{currency}<Skeleton.Node style={{ width: "50px", height: "15px" }} /></Col>
            <Col style={{ color: "#9097A9", fontSize: "14px" }}><Skeleton.Node style={{ width: "50px", height: "15px" }} /></Col>
        </Row>
    </>)
}
