import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Card, Skeleton, Avatar, Menu, Dropdown, Popconfirm, Row, Col, Modal, message, Space } from 'antd';
import { Icon, Button, Loader } from '@_/components';
import { __error } from '@_/lib/consoleHelper';

const { Meta } = Card;
const { confirm } = Modal;


function showDeleteConfirm(props) {
    confirm({
        title: 'Are you sure delete this record?',
        icon: <Icon icon="exclamation-triangle" />,
        // content: 'Some descriptions',
        okText: 'Yes',
        okType: 'danger',
        cancelText: 'No',
        onOk: props.onOk || console.log,
        onCancel() {
            console.log('Cancel');
        },
    });
}

export const ProductGridItem = props => {
    const [busy, setBusy] = React.useState(false)

    const onDeleteClick = async args => {

        showDeleteConfirm({
            onOk: () => {
                setBusy(true);
                props.onDeleteClick(props._id).then(r => {
                    setBusy(false);
                }).catch(err => {
                    setBusy(false);
                })
            }
        })

    }

    const onEditClick = args => props.onEditClick(props)

    const RenderDD = args => {
        if (props.ddMenu === false) return null;

        function renderDDMenu() {
            return (<Menu>
                {props.onEditClick && <Menu.Item onClick={onEditClick}>Edit</Menu.Item>}
                {props.onDeleteClick && <Menu.Item onClick={onDeleteClick}>Delete</Menu.Item>}
            </Menu>
            )
        }

        return (<div className='grid_item_moreDD'>
            <Dropdown className='moreDD' placement='bottomLeft' overlay={renderDDMenu()} trigger={['click']} arrow>
                <Button shape='circle' size="small" className='moreButton' icon={<Icon icon='ellipsis-v' />} />
            </Dropdown>
        </div>)

    }

    const onCardClick = args => {
        if (props.onCardClick) props.onCardClick(props)
    }

    const cardPropd = { size: 135, shape: "square" }




    return (
        <Loader loading={busy}><Card onClick={onCardClick} size='small' className={`_card card_status_${props.status}`} key={props._id} hoverable
        // actions={[
        //   <div onClick={()=>props.onEditClick(props)}><Icon icon="pen" /></div>,
        //   <div><Popconfirm title="Sure to delete?" onConfirm={() => props.onDeleteClick(props._id)}>
        //     <Icon icon="trash-alt" />
        //   </Popconfirm></div>,
        // ]}
        >
            <Skeleton loading={props.loading} avatar active>
                <RenderDD />
                <Row style={{ flexWrap: "nowrap" }} onClick={() => props.onEditClick ? props.onEditClick(props) : console.log}>
                    <Col flex="135px">
                        {<Avatar {...cardPropd} src={props.picture_thumb ? `${process.env.NEXT_PUBLIC_CDN_ASSETS}/${props.picture_thumb}` : null} icon={<Icon icon="image" />} />}
                        {props.available_qty < 1 && <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)', position: 'absolute', width: '100%', top: '-0px', left: '-0px', height: '135px', display: 'flex', alignItems: "center", justifyContent: "center" }}>
                            <div style={{ backgroundColor: '#CCC', borderRadius: '10px', margin: '10px', fontSize: '18px', padding: '0px 10px' }}>Sold Out</div>
                        </div>}
                    </Col>
                    <Col flex="auto">
                        <div className="card_body">
                            <div style={{ textAlign: "right", color: "#999", fontSize: 10 }}>{props._id}</div>
                            <div className='_title'>{props.title}</div>
                            <Row>
                                <Col span={12}><div className='_price'>{props.price} RS</div></Col>
                                <Col span={12} align="right"><div className='_price'>Qty: {props.available_qty}</div></Col>
                            </Row>
                            <div><Icon icon="barcode" /><span style={{ marginLeft: 5 }}>{props.barcode}</span></div>
                        </div>
                    </Col>
                </Row>

            </Skeleton>
        </Card></Loader>
    )
}

