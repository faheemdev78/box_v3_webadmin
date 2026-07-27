'use client'

import { useState } from 'react';
import { Row, Col, Space, Typography, Modal, Input, message, Tag, Tooltip } from 'antd';
import BarcodePackage from 'react-barcode';
import { useAppSelector } from '@/rStore/hooks';
import { getSettings } from '@/rStore/slices/systemSlice';
import { svgIcons } from '@/configs';
import { IconButton, Icon, PopMenu } from '@/components';
import { useMarkOrderItemMissing, useDropOrderItem } from '@/hooks/useTillVerification';
import { __success, __yellow } from '@/lib/consoleHelper';

const { Title, Text } = Typography;
const { TextArea } = Input;


// const getPickedItem = (orderData: any, item: any) => {
//     return orderData?.processing_stages?.picking?.items?.find(
//         (stageItem: any) => String(stageItem._id_product) === String(item._id_product)
//     );
// };

/**
 * Helper function to map backend item.status to frontend verification status
 * Backend uses: confirmed, out_of_stock, damaged, requested, picked
 * Frontend needs: verified, missing, damaged, mismatch, pending
 */
const mapItemStatusToVerificationStatus = (item: any): 'verified' | 'missing' | 'damaged' | 'mismatch' | 'pending' => {
    switch (item.status) {
        case 'confirmed':
            // If there's an issue_reason, it's a mismatch, otherwise verified
            return item.issue_reason ? 'mismatch' : 'verified';
        case 'out_of_stock':
            return 'missing';
        case 'damaged':
            return 'damaged';
        case 'requested':
        case 'picked':
        default:
            return 'pending';
    }
};

/**
 * Helper function to create verification status object from item
 */
const getVerificationStatusFromItem = (item: any) => ({
    status: mapItemStatusToVerificationStatus(item),
    qty_expected: Number(item?.qty ?? 0),
    qty_verified: item.processed_qty ?? 0,
    notes: item.issue_reason || '',
    verified_at: item.verified_at || null,
});

const getPickedQtyFromProcessingStage = (orderData: any, item: any) => {
    const pickedItem = orderData?.processing_stages?.picking?.items?.find(
        (stageItem: any) => String(stageItem._id_product) === String(item._id_product)
    );

    return pickedItem?.processed_qty ?? 0;
};

const ReceiptIcon = ({ src, alt, size }: {
    src: string;
    alt: string;
    size: number;
}) => (
    <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        style={{
            display: 'block',
            width: `${size}px`,
            height: `${size}px`,
            objectFit: 'contain',
            filter: 'grayscale(1) brightness(0)',
        }}
    />
);


export const ProductHolder = ({ item, orderData }: {
  item:any;
  orderData: any;
}) => {
  const settings = useAppSelector(getSettings);
  const verificationStatus = getVerificationStatusFromItem(item);
//   const pickedItem = getPickedItem(orderData, item);
  const pickedQty = getPickedQtyFromProcessingStage(orderData, item);
  const { dropOrderItem } = useDropOrderItem();
  const { markMissing, loading: missingLoading } = useMarkOrderItemMissing();
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [missingNotes, setMissingNotes] = useState('');

  const handleDropItem = async () => {
    try {
      await dropOrderItem(orderData._id, item._id_product);
      message.success(`${item.title} moved back to picked state`);
    } catch (error: any) {
      message.error(error.message || 'Failed to drop item');
    }
  };

  const confirmMissing = async () => {
    try {
      await markMissing(orderData._id, item._id_product, missingNotes || 'Item not found');
      message.warning(`${item.title} marked as missing`);
      setShowMissingModal(false);
      setMissingNotes('');
    } catch (error: any) {
      message.error(error.message || 'Failed to mark item as missing');
    }
  };

  return (<>
        <div className='relative flex flex-col overflow-hidden w-full  h-[230px] min-w-fit bg-white border border-gray-200 rounded-2xl shadow-md'>
            <div className='absolute top-2 right-2 z-999'>
                {!(item.processed_qty < 1 && !!item.issue_reason == false) &&
                    <PopMenu orientation="vertical" placement="leftTop" shape="round"
                        items={[
                            { onClick: handleDropItem, label: "Drop Item", confirm: "Are you sure to drop this item?", hide: item.processed_qty < 1 && !!item.issue_reason == false },
                            // { onClick: () => setShowMissingModal(true), label: 'Unavailable' },
                        ]}
                    ></PopMenu>
                }
            </div>
            <div className='flex-full flex flex-col flex-1 min-w-0 p-10'>
                <Row className='nowrap'>
                    <Col flex="130px">
                        <div className='bg-blue-300 w-[130px] h-[150px] flex justify-center' style={{ marginRight: "10px" }}>pic</div>
                    </Col>
                    <Col flex="auto">
                        <div className='h-13 overflow-hidden font-bold'>{item.title}</div>
                        <div className='text-xs h-4 overflow-hidden flex gap-1 flex-wrap grow-0'>
                            {item?.attributes?.map((atr: any, i: number) => (<div className='bg-gray-200 rounded-sm' style={{ padding: "0px 3px", display: "inline-block" }} key={i}>{atr.val}{atr.title}</div>))}
                        </div>
                        <div>
                            <Space size={1}>
                                <Tag color="#E7F6EC" style={{ color: "#166534" }}><Icon icon="check-circle" color="#2DA44E" />{item?.store?.available_qty > 999 ? '1K+' : (item?.store?.available_qty || 0)} in Stock</Tag>
                                {item.temp_sensitivity === 'freezer' && <Tooltip title='Freezer'>
                                    <span className='relative'><ReceiptIcon src={svgIcons.snow} alt='Freezer' size={20} /></span>
                                </Tooltip>}
                                {item.temp_sensitivity === 'fridge' && <Tooltip title='Fridge'>
                                    <span className='relative'><ReceiptIcon src={svgIcons.chilled} alt='Fridge' size={20} /></span>
                                </Tooltip>}
                                {item.unfit_for_dispatch && <Tooltip title='Not fit for box'>
                                    <span className='relative'>
                                        <Icon icon='box' color='#000000' fontSize={18} />
                                        <div className='absolute bg-black-500 h-1 w-full left-0 right-0 top-1.5 rounded-md border-1 border-white rotate-45' />
                                    </span>
                                </Tooltip>}
                            </Space>
                        </div>

                        <div className='border-b border-gray-300' style={{ margin: "5px 0" }} />

                        <Row>
                            <Col flex="auto">
                                {/* <Space size={3} className='text-base'>{settings.currency} 
                                    <span className='font-bold text-2xl' style={{ color: "#DC2626" }}>{item.price}</span> 
                                    <span className='text-base text-gray-500 line-through' style={{ color: "#9CA3AF" }}>{settings.currency} {item.price_was}</span>
                                </Space> */}
                                <div className='text-base'>{settings.currency} <span className='font-bold text-2xl' style={{ color: "#DC2626" }}>{item.price}</span> <span className='text-base text-gray-500 line-through' style={{ color: "#9CA3AF" }}>{settings.currency} {item.price_was}</span></div>
                                <div className='text-sm'>In order qty: {item.qty}</div>
                            </Col>
                            <Col>{!!item.issue_reason && <Tooltip trigger='click' title={<div>
                                <div>Unavailable: {Number(pickedQty - verificationStatus.qty_verified)}</div>
                                <div>{item.issue_reason}</div>
                            </div>} placement='top'><IconButton shape="round" color="red" icon="exclamation" /></Tooltip>}</Col>
                        </Row>

                        <Row gutter={[5, 0]} className='nowrap'>
                            <Col flex={12}>
                                <div className='border-gray-300 rounded-md p-5' style={{ backgroundColor: "#FFF3E8" }}>
                                    <Space>
                                        <Icon icon="shopping-basket" size='2x' color='#C2410C' />
                                        <div style={{ color: "#7C2D12" }}>
                                            <div className='text-sm' style={{ lineHeight: 1.2 }}>Picked</div>
                                            <div className='text-lg font-bold' style={{ lineHeight: 1.2 }}>{pickedQty}</div>
                                        </div>
                                    </Space>
                                </div>
                            </Col>
                            <Col flex={12}>
                                <div className='border-gray-300 rounded-md p-5' style={{ backgroundColor: "#E8F1FD" }}>
                                    <Space wrap={false}>
                                        <Icon icon="barcode" size='2x' color="#2563EB" />
                                        <div style={{ color: "#1E3A8A" }}>
                                            <div className='text-sm' style={{ lineHeight: 1.2 }}>Scanned</div>
                                            <div className='text-lg font-bold' style={{ lineHeight: 1.2 }}>{verificationStatus.qty_verified}</div>
                                        </div>
                                    </Space>
                                </div>
                            </Col>
                        </Row>

                    </Col>
                </Row>
            </div>
            <div className='text-xs' style={{ padding: "0 10px", color: "#418895" }}>
                <Row>
                    <Col span={12}><Tooltip title={<BarcodePackage value={item.barcode} width={1.5} height={30} format={"CODE128"} displayValue={item.barcode} />} placement='topLeft'>
                        <span className='text-xs'>#{item.barcode}</span>
                    </Tooltip></Col>
                    <Col span={12} className='text-right'><Tag>SKU: 000000</Tag></Col>
                </Row>
            </div>
        </div>

        <Modal title={<Text>Mark <Text strong>{item && item.title}</Text> as missing?</Text>}
            open={showMissingModal}
            onOk={confirmMissing}
            onCancel={() => setShowMissingModal(false)}
            okText="Confirm Missing"
            okButtonProps={{ danger: true }}
            loading={missingLoading}
        >
            <Space orientation="vertical" style={{ width: '100%' }}>
                <TextArea placeholder="Optional: Reason for missing item..."
                    value={missingNotes}
                    onChange={(e) => setMissingNotes(e.target.value)}
                    rows={3}
                />
            </Space>
        </Modal>
    </>)
}

