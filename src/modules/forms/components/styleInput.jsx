import React, { useState } from 'react'
import { Col, Input, Row, Space, Tag } from 'antd';
import { Button, IconButton } from '@_/components';
import { CloseOutlined } from '@ant-design/icons';

export const StyleInput = ({ stylesArray, set_stylesArray }) => {
    const [show, setShow] = useState(false);
    const [newStyle, set_newStyle] = useState({});
    // const [stylesArray, set_stylesArray] = useState([]);

    const deleteStyle = (index) => {
        set_stylesArray(stylesArray.filter((o, i) => !(i == index)))
    }

    return (<>
        <Space style={{ border: "1px solid #EEE", borderRadius: "5px", width: "100%", minHeight: "30px", padding: "3px" }} wrap size={3}>
            {stylesArray?.map((itm, i) => (<Tag style={{ padding: "2px" }} key={i}>{`${itm.s}:"${itm.v}"`} <span onClick={() => deleteStyle(i)} style={{ border: "1px solid #EEE", padding: "2px", backgroundColor: "#EEE" }}><CloseOutlined /></span></Tag>))}
        </Space>

        {!show && <Button onClick={() => setShow(true)} block type="dashed" size="small">Add Style</Button>}

        {show && <Row gutter={[0]}>
            <Col span={10}><Input placeholder='Style' onChange={(e) => set_newStyle({ ...newStyle, s: e.target.value })} /></Col>
            <Col span={10}><Input placeholder='Value' onChange={(e) => set_newStyle({ ...newStyle, v: e.target.value })} /></Col>
            <Col span={4}><IconButton onClick={() => {
                let _stylesArray = (stylesArray && stylesArray?.slice()) || [];
                _stylesArray.push(newStyle)
                set_stylesArray(_stylesArray);
                set_newStyle({})
                setShow(false)
            }} color="blue" icon="check" /></Col>
        </Row>}
    </>)
}
