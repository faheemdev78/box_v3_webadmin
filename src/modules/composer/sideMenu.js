'use client'
import React, { useState, useRef } from 'react'
import { useDrop, useDrag } from 'ahooks';
import { Col, Row, Space } from 'antd'
import { Button } from '@_/components'
import { textArray, categoriesArray, carouselArray, productsArray, animationsArray } from './components';
import styles from './Composer.module.scss';

const DragItem = ({ data }) => {
    const dragRef = useRef(null);

    const [dragging, setDragging] = useState(false);

    useDrag(data, dragRef, {
        onDragStart: () => {
            setDragging(true);
        },
        onDragEnd: () => {
            setDragging(false);
        },
    });

    return (
        <div className={`${styles.dragItem} ${dragging ? styles.dragging : ""}`} ref={dragRef}>
            <div>{data.label}</div>
            <div style={{ fontSize:"10px" }}>{data.desc}</div>
            {/* {dragging ? 'dragging' : `box-${data}`} */}
        </div>
    );
};



export function SideMenu() {
    const [selectedMenu, set_selectedMenu] = useState(null)

    var itemAray = null;
    if (selectedMenu == 'text') itemAray = textArray;
    if (selectedMenu == 'categories') itemAray = categoriesArray;
    if (selectedMenu == 'carousel') itemAray = carouselArray;
    if (selectedMenu == 'carousel') itemAray = carouselArray;
    if (selectedMenu == 'products') itemAray = productsArray;
    if (selectedMenu == 'animations') itemAray = animationsArray;

    return (<div className={`${styles.modules_list_wrapper} ${styles.custom_scroller}`}>
        <Row className="nowrap" style={{ height: "inherit" }}>
            <Col style={{ borderRight: "1px solid #D0DAE5", padding: "10px", height: "inherit" }}><div>
                <Space direction='vertical'>
                    <Button onClick={() => set_selectedMenu('text')} block>Text</Button>
                    <Button onClick={() => set_selectedMenu('categories')} block>Categories</Button>
                    <Button onClick={() => set_selectedMenu('carousel')} block>Carousel</Button>
                    <Button onClick={() => set_selectedMenu('products')} block>Products</Button>
                    <Button onClick={() => set_selectedMenu('animations')} block>Animations</Button>
                </Space>
            </div></Col>

            {selectedMenu !== null && <Col style={{ borderRight: "1px solid #D0DAE5", width: "400px" }}>

                <div style={{ padding: "5px 5px", borderBottom: "1px solid #D0DAE5" }}>
                    <Row align="middle">
                        <Col flex="auto"><h3 style={{ textTransform: "uppercase" }}>{selectedMenu}</h3></Col>
                        <Col><Button onClick={() => set_selectedMenu(null)}>Close</Button></Col>
                    </Row>
                </div>

                <div style={{ padding: "10px" }}>
                    <Space wrap size={10}>
                        {itemAray.map((item, i) => (<DragItem key={i} data={item} />))}
                    </Space>
                </div>

            </Col>}


        </Row>
    </div>)
}

