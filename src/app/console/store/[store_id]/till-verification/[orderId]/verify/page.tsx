'use client'
/**
 * Till Verification POS Component
 * Main POS-style verification screen for item-by-item verification
 * Updated for shift-based order verification system
 */

import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { Card, Row, Col, Space, Typography, Modal, Input, message, Progress, Tag, Alert, InputNumber, Tooltip } from 'antd';
import BarcodePackage from 'react-barcode';
import { 
  CloseCircleOutlined, WarningOutlined, ClockCircleOutlined, EditOutlined,
  CheckCircleOutlined, LeftOutlined, ExclamationCircleOutlined, PrinterOutlined } from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/rStore/hooks';
import { getActiveShift, getCurrentOrder, getTillVerification, setCurrentOrder
} from '@/rStore/slices/tillVerificationSlice';
import { removeHeldOrder } from '@/rStore/slices/tillVerificationSlice';
import { getSettings } from '@/rStore/slices/systemSlice';
import { useStartOrderVerification, useCompleteOrderVerification,
  useMyActiveTillShift, usePrintTillReceipt, useOpenTillShift, useUpdateTillVerificationBaskets, useUpdateTillVerificationBags, useRemoveOrderFromTillSession
} from '@/hooks/useTillVerification';
import { adminRoot } from '@/configs';
import { Avatar, DevBlock, Button, IconButton, Loader, Table, usePageProps, Icon, Drawer, PopMenu, BarcodeScanner } from '@/components';
import { Page } from '@/template';
// import { ItemVerificationRow } from '@/modules/orders/tillVerification/ItemVerificationRow';
import dayjs from 'dayjs';
import { useVerifyOrderItem, useMarkOrderItemMissing, useMarkOrderItemDamaged, useMarkOrderItemMismatch, useDropOrderItem } from '@/hooks/useTillVerification';
import { __success, __yellow } from '@/lib/consoleHelper';
import Link from 'next/link';
import { utcToDate } from '@/lib/utill';
import { AddBaskets } from './components/AddBaskets';
import AddBags from './components/AddBags';

const { Title, Text } = Typography;
const { TextArea } = Input;

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

const getStatusTag = (status:string) => {
  switch (status) {
    case 'verified':
      return (<Tag icon={<CheckCircleOutlined />} color="success">Verified</Tag>);
    case 'missing':
      return (<Tag icon={<CloseCircleOutlined />} color="error">Missing</Tag>);
    case 'mismatch':
      return (<Tag icon={<WarningOutlined />} color="warning">Qty Mismatch</Tag>);
    case 'pending':
    default:
      return (<Tag icon={<ClockCircleOutlined />} color="default">Pending</Tag>);
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
const getPickedItem = (orderData: any, item: any) => {
  return orderData?.processing_stages?.picking?.items?.find(
    (stageItem: any) => String(stageItem._id_product) === String(item._id_product)
  );
};

const formatMoney = (value: number | undefined | null) => Number(value || 0).toFixed(2);

function ErrorComp({ title, description, buttons }: { title:string, description:string, buttons?:ReactNode }){
  return (<div style={{ textAlign: 'center', padding: '100px 0' }}><Card><Space orientation="vertical">
    <ExclamationCircleOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
    <Title level={4}>{title}</Title>
    <Text>{description}</Text>
    <Space>
      <Button onClick={() => window.location.reload()}>Reload Page</Button>
      {buttons}
      {/* <Button type="primary" onClick={() => router.push(`${adminRoot}/store/${store_id}/till-verification`)}>Back to Queue</Button> */}
    </Space>
  </Space></Card></div>)
}

const VerificationColumn = ({ item, orderId }: { item:any, orderId:string }) => {
  // Use shared helper function
  const verificationStatus = getVerificationStatusFromItem(item);

  const settings = useAppSelector(getSettings);

  const { verifyItem, loading: verifyLoading } = useVerifyOrderItem();
  const { markMissing, loading: missingLoading } = useMarkOrderItemMissing();
  const { markDamaged, loading: damagedLoading } = useMarkOrderItemDamaged();
  const { markMismatch, loading: mismatchLoading } = useMarkOrderItemMismatch();
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [missingNotes, setMissingNotes] = useState('');
  const [mismatchQty, setMismatchQty] = useState(verificationStatus.qty_verified || 0);
  const [mismatchNotes, setMismatchNotes] = useState('');


  const handleVerify = async () => {
    try {
      await verifyItem(orderId, item._id_product, verificationStatus.qty_expected);
      message.success(`${item.title} verified`);
    } catch (error: any) {
      message.error(error.message || 'Failed to verify item');
    }
  };

  const handleMissing = () => setShowMissingModal(true);

  const confirmMissing = async () => {
    try {
      await markMissing(orderId, item._id_product, missingNotes || 'Item not found');
      message.warning(`${item.title} marked as missing`);
      setShowMissingModal(false);
      setMissingNotes('');
    } catch (error: any) {
      message.error(error.message || 'Failed to mark item as missing');
    }
  };

  const confirmMismatch = async () => {
    if (mismatchQty >= 0 && mismatchQty !== verificationStatus.qty_expected) {
      try {
        await markMismatch(orderId, item._id_product, mismatchQty, mismatchNotes || 'Quantity mismatch');
        message.warning(`${item.title} quantity updated to ${mismatchQty}`);
        setShowMismatchModal(false);
        setMismatchNotes('');
      } catch (error: any) {
        message.error(error.message || 'Failed to mark quantity mismatch');
      }
    }
  };

  const handleMismatch = () => {
    setMismatchQty(0);
    setShowMismatchModal(true);
  };

  // const getCardStyle = () => {
  //   const baseStyle = { marginBottom: 12 };
  //   switch (verificationStatus.status) {
  //     case 'verified':
  //       return { ...baseStyle, backgroundColor: '#f6ffed', borderColor: '#b7eb8f' };
  //     case 'missing':
  //       return { ...baseStyle, backgroundColor: '#fff1f0', borderColor: '#ffa39e' };
  //     case 'mismatch':
  //       return { ...baseStyle, backgroundColor: '#fffbe6', borderColor: '#ffe58f' };
  //     default:
  //       return baseStyle;
  //   }
  // };



  return (<>
    {/* Verification Timestamp */}
    {verificationStatus.verified_at && (<Text type="secondary" style={{ fontSize: 12 }}>Verified at {dayjs(verificationStatus.verified_at).format('HH:mm:ss')}</Text>)}
    {/* <div style={{ textAlign: "center", paddingBottom: "5px" }}>{getStatusTag(verificationStatus.status)}</div> */}

    {/* Action Buttons */}
    <Space style={{ width: '100%' }}>
      <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleVerify} size="large" block style={{ flex: 1 }}>Verify</Button>
      <Button danger icon={<CloseCircleOutlined />} onClick={handleMissing} size="large">Missing</Button>
      <Button icon={<WarningOutlined />} onClick={handleMismatch} size="large">Qty Issue</Button>
    </Space>

    {/* Notes */}
    {verificationStatus.notes && (<Alert title="Error" description={verificationStatus.notes} style={{ padding:"0px 5px", fontSize:"11px", marginTop:"5px" }} type="info" />)}


    {/* Missing Item Modal */}
    <Modal title={<Text>Mark <Text strong>{item && item.title}</Text> as missing?</Text>}
      open={showMissingModal}
      onOk={confirmMissing}
      onCancel={() => setShowMissingModal(!!missingLoading)}
      okText="Confirm Missing"
      okButtonProps={{ danger: true }}
      loading={missingLoading}
    >
      <Space orientation="vertical" style={{ width: '100%' }}>
        {/* <Text>Mark <Text strong>{item.title}</Text> as missing?</Text> */}
        <TextArea placeholder="Optional: Reason for missing item..."
          value={missingNotes}
          onChange={(e) => setMissingNotes(e.target.value)}
          rows={3}
        />
      </Space>
    </Modal>

    {/* Quantity Mismatch Modal */}
    <Modal title="Quantity Mismatch"
      open={showMismatchModal}
      onOk={confirmMismatch}
      onCancel={() => setShowMismatchModal(!!mismatchLoading)}
      okText="Confirm Quantity"
      okButtonProps={{ disabled: mismatchQty === verificationStatus.qty_expected }}
      loading={mismatchLoading}
    >
      <Space orientation="vertical" style={{ width: '100%' }}>
        <Text>Expected quantity: <Text strong>{verificationStatus.qty_expected}</Text></Text>
        <Space>
          <Text>Actual quantity found:</Text>
          <InputNumber
            min={0}
            max={verificationStatus.qty_expected}
            value={mismatchQty}
            onChange={(value) => setMismatchQty(value || 0)}
            size="large"
            style={{ width: 100 }}
          />
        </Space>
        <TextArea
          placeholder="Optional: Notes about the quantity mismatch..."
          value={mismatchNotes}
          onChange={(e) => setMismatchNotes(e.target.value)}
          rows={3}
        />
      </Space>
    </Modal>

  </>)

}



const ProductHolder = ({ item, orderData }: {
  item:any;
  orderData: any;
}) => {
  const settings = useAppSelector(getSettings);
  const verificationStatus = getVerificationStatusFromItem(item);
  const pickedItem = getPickedItem(orderData, item);
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

  // console.log({ pickedItem })

  return (<div className='relative flex flex-col overflow-hidden w-full h-[230px] bg-white border border-gray-200 rounded-2xl shadow-md'>
    <div className='absolute top-2 right-2 z-999'><PopMenu orientation="vertical" placement="leftTop"
      items={[
        { onClick: handleDropItem, label: "Drop Item", confirm: "Are you sure to drop this item?", hide: item.processed_qty < 1 && !!item.issue_reason==false },
        { onClick: () => setShowMissingModal(true), label: 'Unavailable' }
      ]}
    ></PopMenu></div>
    <div className='flex-full flex flex-col flex-1 min-w-0 p-10'>
      <Row className='nowrap'>
        <Col flex="130px">
          <div className='bg-blue-300 w-[130px] h-[150px] flex justify-center' style={{ marginRight:"10px" }}>pic</div>
          <BarcodePackage
            value={item.barcode} //{`doReadyForDispatch`}
            width={1.2}
            height={20}
            format={"CODE128"}
            displayValue={item.barcode}
          />
          {/* <Tag color={item.status =='out_of_stock' ? "red" : "gray"} variant="solid">{item.status}</Tag> */}
          {/* <div style={{ padding:"2px 0 0 0"}}>{!!item.issue_reason && <Tooltip trigger='click' title={item.issue_reason} placement='top'><Button size="small" color="red" icon={<Icon icon="exclamation" />}>Mismatch</Button></Tooltip>}</div> */}
        </Col>
        <Col flex="auto">
          {/* <div className='ellipsis w-[200px]'>The longest product title taken from any category from somwhere category from somwhere...</div> */}
          <div className='h-13 overflow-hidden font-bold'>{item.title}</div>
          <div className='text-xs h-4 overflow-hidden flex gap-1 flex-wrap grow-0'>
            {/* {item?.attributes?.map((atr: any, i: number) => (<Tag key={i}>{atr.val}{atr.title}</Tag>))} */}
            {item?.attributes?.map((atr: any, i: number) => (<div className='bg-gray-200 rounded-sm' style={{ padding:"0px 3px", display:"inline-block" }} key={i}>{atr.val}{atr.title}</div>))}
          </div>
          <div><Tag color="#E7F6EC" style={{ color: "#166534" }}><Icon icon="check-circle" color="#2DA44E" />000 in Stock</Tag></div>
          
          <div className='border-b border-gray-300' style={{ margin:"5px 0" }} />
          
          <Row>
            <Col flex="auto">
              <div className='text-base'>{settings.currency} <span className='font-bold text-2xl' style={{ color: "#DC2626" }}>{item.price}</span> <span className='text-base text-gray-500 line-through' style={{ color: "#9CA3AF" }}>{settings.currency} {item.price_was}</span></div>
              <div className='text-sm'>Qty received: {item.qty}</div>
            </Col>
            {/* <Col><div>{!!item.issue_reason && <Tooltip trigger='click' title={item.issue_reason} placement='top'><Button size="small" color="red" icon={<Icon icon="exclamation" />}>Mismatch</Button></Tooltip>}</div></Col> */}
            <Col>{!!item.issue_reason && <Tooltip trigger='click' title={item.issue_reason} placement='top'><IconButton shape="round" color="red" icon="exclamation" /></Tooltip>}</Col>
          </Row>

          {/* <div style={{ margin: "5px 0" }} /> */}
          <Row gutter={[10, 10]}>
            {/* <Col flex={8}>
              <div className='border-gray-300 rounded-md p-10 leading-5' style={{ padding: "5px 5px", backgroundColor:"#F5F5F5" }}>
                <Space>
                  <Icon icon="shopping-cart" size='2x' color='#4B5563' />
                  <div style={{ color:"#374151"}}>
                    <div className='text-sm' style={{ lineHeight: 1.2 }}>Requested</div>
                    <div className='text-lg font-bold' style={{ lineHeight: 1.2 }}>{item.qty}</div>
                  </div>
                </Space>
              </div>
            </Col> */}
            <Col flex={8}>
              <div className='border-gray-300 rounded-md p-10 leading-5' style={{ padding: "5px 5px", backgroundColor:"#FFF3E8" }}>
                <Space>
                  <Icon icon="shopping-basket" size='2x' color='#C2410C' />
                  <div style={{ color:"#7C2D12"}}>
                    <div className='text-sm' style={{ lineHeight: 1.2 }}>Picked</div>
                    <div className='text-lg font-bold' style={{ lineHeight: 1.2 }}>{pickedQty}</div>
                  </div>
                </Space>
              </div>
            </Col>
            <Col flex={8}>
              <div className='border-gray-300 rounded-md leading-5' style={{ padding: "5px 5px", backgroundColor:"#E8F1FD" }}>
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
    <div className='text-xs' style={{ padding: "0 10px", color:"#418895" }}>
      <Row>
        <Col span={12}><span className='text-xs'>#{item.barcode}</span></Col>
        <Col span={12} className='text-right'><Tag>SKU: 000000</Tag></Col>
      </Row>
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
  </div>)
}
const LeftColumn = ({ onNavClick }: { onNavClick: (key: string) => void }) => {
  {/* C1: 100px fixed width */}
  return (<div className='w-[100px] flex flex-col shrink-0 border-r border-gray-300 bg-white'>
    <div className="flex-1 bg-gray-50/50">
      <div className='flex flex-col'><Space orientation='vertical' size={1}>
        {/* <div>LOGO</div> */}
        <div onClick={() => onNavClick('orders')} className='cursor-pointer border-b-1 border-gray-200 hover:bg-sky-100 p-10'>Orders</div>
        <div onClick={() => onNavClick('products')} className='cursor-pointer border-b-1 border-gray-200 hover:bg-sky-100 p-10'>Products</div>
        <div onClick={() => onNavClick('baskets')} className='cursor-pointer border-b-1 border-gray-200 hover:bg-sky-100 p-10'>Baskets</div>
        <div onClick={() => onNavClick('wrong_item')} className='cursor-pointer border-b-1 border-gray-200 hover:bg-sky-100 p-10'>Wrong Item</div>
        <div onClick={() => onNavClick('excessive_item')} className='cursor-pointer border-b-1 border-gray-200 hover:bg-sky-100 p-10'>Excessive Item</div>
        <div onClick={() => onNavClick('Supervisor Mode')} className='cursor-pointer border-b-1 border-gray-200 hover:bg-sky-100 p-10'>Supervisor Mode</div>
        <div onClick={() => onNavClick('Redy to dispatch')} className='cursor-pointer border-b-1 border-gray-200 hover:bg-sky-100 p-10'>Redy to dispatch</div>
      </Space>
      </div>
    </div>
    <div className="h-[100px] border-gray-300 flex flex-col flex-center item-center justify-center bg-white">
      <div className="flex flex-center item-center justify-center">Notification</div>
      <div className='flex flex-center item-center justify-center'><Avatar>F</Avatar></div>
    </div>
  </div>)
}
const RightColumn = ({
  showBags,
  showBaskets,
  showPrint,
  orderData,
  orderId,
  onShowExcessiveItem
}: {
  showBags: () => void;
  showBaskets: () => void;
  showPrint: () => void;
  orderData: any;
  orderId: string;
  onShowExcessiveItem: (item: any, qty: number) => void;
}) => {
  {/* C4: 300px fixed width */}
  // flex flex-1 flex-col items-start w-full bg-gray-50/50 overflow-y-auto
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [scaned, setScaned] = useState<string | null>(null)
  const [selectedQty, setSelectedQty] = useState(0);
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [mismatchQty, setMismatchQty] = useState(0);
  const [mismatchNotes, setMismatchNotes] = useState('');
  const [mismatchItem, setMismatchItem] = useState<any>(null);
  const [mismatchExpectedQty, setMismatchExpectedQty] = useState(0);
  const { verifyItem, loading: verifyLoading } = useVerifyOrderItem();
  const { markMissing, loading: missingLoading } = useMarkOrderItemMissing();
  const { markMismatch, loading: mismatchLoading } = useMarkOrderItemMismatch();


  const orderItems = orderData?.current_order?.items || [];
  const totalBaskets = (orderData?.current_order?.baskets || []).length;
  const totalBags = (orderData?.current_order?.bags || []).reduce(
    (sum: number, bag: any) => sum + (bag.qty || 0),
    0
  );
  const scannedItemTotal = orderItems.reduce(
    (sum: number, item: any) => sum + ((item.processed_qty ?? 0) * (item.price ?? 0)),
    0
  );
  const scannedItemQty = orderItems.reduce(
    (sum: number, item: any) => sum + (item.processed_qty ?? 0),
    0
  );
  const unavailableItemCount = orderItems.filter(
    (item: any) => item.status === 'out_of_stock'
  ).length;
  const originalOrderTotal = orderData?.original_order?.totals?.grandTotal ?? orderData?.current_order?.totals?.grandTotal ?? 0;
  const originalOrderQty = orderData?.original_order?.totals?.totalQuantity ?? orderData?.current_order?.totals?.totalQuantity ?? 0;
  const normalizedQuery = barcodeQuery.trim().toLowerCase();
  const matchedItems = normalizedQuery
    ? orderItems.filter((item: any) => {
        const barcode = String(item.barcode || '').toLowerCase();
        const title = String(item.title || '').toLowerCase();
        return barcode.includes(normalizedQuery) || title.includes(normalizedQuery);
      })
    : [];

  const selectedItem = orderItems.find(
    (item: any) => String(item._id_product) === String(selectedProductId)
  ) || null;
  const selectedVerificationStatus = selectedItem ? getVerificationStatusFromItem(selectedItem) : null;
  const pickedQty = selectedItem ? getPickedQtyFromProcessingStage(orderData, selectedItem) : 0;
  const requestedQty = selectedItem?.qty ?? 0;
  const imageSrc =
    selectedItem?.picture_thumb ||
    selectedItem?.picture?.thumb ||
    selectedItem?.picture?.thumbnails?.[0] ||
    null;
  const actionLoading = verifyLoading || missingLoading || mismatchLoading;

  useEffect(() => {
    if (!selectedItem) {
      setSelectedQty(0);
      return;
    }

    setSelectedQty(selectedItem.processed_qty ?? 0);
  }, [selectedItem?.processed_qty, selectedProductId]);

  const selectItem = (item: any) => {
    setSelectedProductId(String(item._id_product));
    setSelectedQty(item.processed_qty ?? 0);
  };

  const clearBarcodeSelection = () => {
    setBarcodeQuery('');
    setSelectedProductId(null);
    setSelectedQty(0);
  };

  const handleBarcodeSearch = () => {
    if (!normalizedQuery) {
      setSelectedProductId(null);
      return;
    }

    const exactMatch = matchedItems.find(
      (item: any) => String(item.barcode || '').toLowerCase() === normalizedQuery
    );
    const nextItem = exactMatch || matchedItems[0];

    if (!nextItem) {
      message.error('No item in this order matches that barcode');
      setSelectedProductId(null);
      return;
    }

    selectItem(nextItem);
  };

  const updateSelectedQty = (delta: number) => {
    if (!selectedItem) return;
    setSelectedQty((prev) => Math.max(0, prev + delta));
  };

  const applySelectedQty = async () => {
    if (!selectedItem) {
      message.error('Select an item first');
      return;
    }

    try {
      if (selectedQty > requestedQty) {
        onShowExcessiveItem(selectedItem, selectedQty);
        clearBarcodeSelection();
        return;
      }

      if (selectedQty === requestedQty) {
        await verifyItem(orderId, selectedItem._id_product, selectedQty);
        message.success(`${selectedItem.title} verified`);
        clearBarcodeSelection();
        return;
      }

      setMismatchItem(selectedItem);
      setMismatchExpectedQty(requestedQty);
      setMismatchQty(selectedQty);
      setShowMismatchModal(true);
      clearBarcodeSelection();
    } catch (error: any) {
      message.error(error.message || 'Failed to update scanned quantity');
    }
  };

  const handleMismatch = () => {
    if (!selectedItem) {
      message.error('Select an item first');
      return;
    }

    setMismatchItem(selectedItem);
    setMismatchExpectedQty(requestedQty);
    setMismatchQty(selectedQty || selectedItem.processed_qty || 0);
    setShowMismatchModal(true);
  };

  const confirmMismatch = async () => {
    if (!mismatchItem) {
      message.error('Select an item first');
      return;
    }

    if (mismatchQty >= 0 && mismatchQty !== mismatchExpectedQty) {
      try {
        await markMismatch(orderId, mismatchItem._id_product, mismatchQty, mismatchNotes || 'Quantity mismatch');
        message.warning(`${mismatchItem.title} quantity updated to ${mismatchQty}`);
        setShowMismatchModal(false);
        setMismatchQty(0);
        setMismatchNotes('');
        setMismatchItem(null);
        setMismatchExpectedQty(0);
      } catch (error: any) {
        message.error(error.message || 'Failed to mark quantity mismatch');
      }
    }
  };

  const handleScan = (barcode:string) => {
    console.log("********** Till List Scanned *******", barcode);
    if (barcode) setScaned(barcode)
    const item = orderItems.find((o:any) => o.barcode === barcode)
    if (!item) {
      console.log("Item not found: ", barcode)
      return;
    }
    selectItem(item)
  }

  return (<div className='w-120 border-l border-gray-300 flex flex-col items-start shrink-0 bg-white'>
    <div className="flex-1 w-full p-4 bg-gray-50/50 overflow-y-auto">
      <div className='flex flex-col p-10'>
        <div className=''>
          <Input
            placeholder="Search barcode of items in order"
            value={barcodeQuery}
            onChange={(e) => setBarcodeQuery(e.target.value)}
            onPressEnter={handleBarcodeSearch}
          />
          <BarcodeScanner onScan={handleScan} onError={console.log} />
          {/* <div>scaned: {scaned}</div> */}
        </div>
        {normalizedQuery && (
          <div className='flex flex-wrap gap-2 mt-10'>
            {matchedItems.length > 0 ? matchedItems.map((item: any) => (
              <Button
                key={String(item._id_product)}
                type={String(selectedProductId) === String(item._id_product) ? 'primary' : 'default'}
                onClick={() => selectItem(item)}
              >
                {item.barcode || item.title}
              </Button>
            )) : (
              <Text type="secondary">No matching item found in this order.</Text>
            )}
          </div>
        )}
        <div className='flex flex-col items-center justify-center' style={{ marginTop:"10px" }}>
          <div className='text-xl font-semibold mt-10 text-center' style={{ color:"#111827" }}>
            {selectedItem?.title || 'Scan or search an item'}
          </div>
          <div className='w-[200px] h-[250px] bg-gray-200 overflow-hidden flex items-center justify-center rounded-md' style={{margin:"10px"}}>
            {imageSrc ? (
              <img src={imageSrc} alt={selectedItem?.title || 'Product'} className='h-full w-full object-cover' />
            ) : (
              <Text type="secondary">Product Picture</Text>
            )}
          </div>
          <Space orientation="vertical" size={2} align="center">
            <Text>Scanned / Order Qty</Text>
            <Text strong style={{ fontSize: 24 }}>
              {selectedQty}/{requestedQty}
            </Text>
            <Text type="secondary">Saved scanned: {selectedVerificationStatus?.qty_verified ?? 0}</Text>
            <Text type="secondary">Picked: {pickedQty}</Text>
          </Space>
          <div style={{ marginTop: '10px' }}>
            <Space>
              <IconButton icon="minus" onClick={() => updateSelectedQty(-1)} disabled={!selectedItem || actionLoading} />
              <div className='text-2xl border border-gray-300 rounded-sm min-w-[72px] text-center' style={{ padding:"0 5px"}}>
                {selectedQty}/{requestedQty}
              </div>
              <IconButton icon="plus" onClick={() => updateSelectedQty(1)} disabled={!selectedItem || actionLoading} />
              <Button icon={<WarningOutlined />} onClick={handleMismatch} disabled={!selectedItem || actionLoading}>Qty Issue</Button>
              <Button color='green' onClick={applySelectedQty} loading={actionLoading} disabled={!selectedItem}>OK</Button>
            </Space>
          </div>
        </div>
      </div>
      <div className='border-t border-gray-300 p-10'>
        <div style={{ marginBottom:"10px"}}><Space>
          {orderData?.current_order?.baskets?.map((basket:any, index:number) => (<Tag color="gray" key={index}>{basket.title}</Tag>))}
        </Space></div>
        <div style={{ marginBottom: "0px" }}><Space>
          <Button onClick={showBags}>Bags ({totalBags})</Button>
          <Button onClick={showBaskets}>Baskets ({totalBaskets})</Button>
          <Button onClick={showPrint}>Print</Button>
        </Space></div>
      </div>
      <div className='border-t border-gray-300 p-10'>
        <div>Area: <b>{orderData.zone.title}</b></div>
        <div>Time: <b>{utcToDate(orderData.delivery_slot.start_date).format("ddd Do MMM YYYY - HH:mm")} - {utcToDate(orderData.delivery_slot.end_date).format("HH:mm")} </b></div>
      </div>
    </div>
    <div className="h-[80px] border-t border-gray-300 w-full flex flex-col p-10 font-semibold">
      <Row>
        <Col span={12}>Total Bill</Col><Col span={12}>{scannedItemTotal.toFixed(2)}/{originalOrderTotal.toFixed(2)}</Col>
        <Col span={12}>Total Items</Col><Col span={12}>{scannedItemQty}/{originalOrderQty}</Col>
        <Col span={12}>Out of stock items</Col><Col span={12}>{unavailableItemCount}</Col>
      </Row>
    </div>

    <Modal title="Quantity Mismatch"
      open={showMismatchModal}
      onOk={confirmMismatch}
      onCancel={() => {
        setShowMismatchModal(false);
        setMismatchQty(0);
        setMismatchItem(null);
        setMismatchExpectedQty(0);
      }}
      okText="Confirm Quantity"
      okButtonProps={{ disabled: !mismatchItem || mismatchQty === mismatchExpectedQty }}
      loading={mismatchLoading}
    >
      <Space orientation="vertical" style={{ width: '100%' }}>
        <Text>Expected quantity: <Text strong>{mismatchExpectedQty}</Text></Text>
        <Space>
          <Text>Actual quantity found:</Text>
          <InputNumber
            min={0}
            max={mismatchExpectedQty}
            value={mismatchQty}
            onChange={(value) => setMismatchQty(value || 0)}
            size="large"
            style={{ width: 100 }}
          />
        </Space>
        <TextArea
          placeholder="Optional: Notes about the quantity mismatch..."
          value={mismatchNotes}
          onChange={(e) => setMismatchNotes(e.target.value)}
          rows={3}
        />
      </Space>
    </Modal>
  </div>)
}
const PageFooter = ({ orderData }: { orderData:any }) => {
  {/* C3: 100px height */}
  return (<div className="h-[80px] border-t border-gray-300 flex bg-white">
    <Row className='w-full p-20' align="middle">
      <Col flex='auto'>
        <Space>
          <div className='font-bold'>Picker Basket</div> 
          {orderData?.processing_stages?.picking?.baskets?.map((basket:any, index:number) => (<Tag color="gray" key={index}>{basket.title}</Tag>))}
        </Space>
      </Col>
      <Col flex='250px' className='text-right'>
        <div>{orderData?.processing_stages?.picking?.handled_by.name} <span className='text-gray-400'>(picker)</span></div>
        <div><span className='text-gray text-gray-400'>{utcToDate(orderData.processing_stages.updated_at).format("ddd Do MMM YYYY - HH:mm")}</span></div>
      </Col>
    </Row>
  </div>)
}
const ContentArea = ({ orderData, orderItems }: { orderData: any, orderItems: any }) => {
  return (<div className="flex-1 flex flex-col items-start w-full bg-gray-50/50 overflow-y-auto">
    <div className='p-10 flex-1 flex w-full'><div className='w-full'>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-[16px]">
        {orderItems.map((item:any, index:number) => (
          <div key={index} className="w-full flex items-center justify-center">
            <ProductHolder item={item} orderData={orderData} />
          </div>
        ))}
        {/* {Array(10).fill(null).map((_, index) => (
          <div key={index} className="w-full flex items-center justify-center">
            <ProductHolder index={index} />
          </div>
        ))} */}
      </div>
    </div></div>

  </div>)
}
const WrongItem = () => {
  return (<div className='bg-white rounded-lg'>
    <div className='' style={{ padding: "20px" }}>
      <Row align="middle">
        <Col span={12}><div style={{ padding: "10px" }} className='flex flex-col w-full items-center justify-center'>
          <div>title</div>
          <div className='h-[150px] w-[100px] bg-blue-300'>picture</div>
          <div>attributes</div>
          <div>123456789</div>
        </div></Col>
        <Col span={12} className='border-l border-gray-200'><div style={{ padding: "10px" }} className='text-center'>
          <Space vertical align="center">
            <div className="flex flex-col w-full items-center justify-center">
              <div className='flex flex-col items-center justify-center bg-red-500 h-[50px] w-[50px] text-white text-2xl font-bold rounded-full'>X</div>
            </div>
            <div className='text-2xl text-red-500 font-bold'>Wrong Item</div>
            <p>Current order does not contain this item. Please remove this item from order.</p>
            <Button color="red">Acknoledge</Button>
          </Space>
        </div></Col>
      </Row>
    </div>
  </div>)
}
const ExcessiveItem = ({ item, selectedQty, onAcknowledge }: { item?: any, selectedQty?: number, onAcknowledge: () => void }) => {
  const imageSrc =
    item?.picture_thumb ||
    item?.picture?.thumb ||
    item?.picture?.thumbnails?.[0] ||
    null;

  return (<div className='bg-white rounded-lg'>
    <div className='' style={{ padding: "20px" }}>
      <Row align="middle">
        <Col span={12}><div style={{ padding: "10px" }} className='flex flex-col w-full items-center justify-center'>
          <div>{item?.title || 'title'}</div>
          <div className='h-[150px] w-[100px] bg-blue-300 overflow-hidden flex items-center justify-center'>
            {imageSrc ? <img src={imageSrc} alt={item?.title || 'Item'} className='h-full w-full object-cover' /> : 'picture'}
          </div>
          <div>{item?.attributes?.map((atr: any) => `${atr.val}${atr.title}`).join(', ') || 'attributes'}</div>
          <div>{item?.barcode || 'N/A'}</div>
        </div></Col>
        <Col span={12} className='border-l border-gray-200'><div style={{ padding: "10px" }} className='text-center'>
          <Space vertical align="center">
            <div className="flex flex-col w-full items-center justify-center">
              <div className='flex flex-col items-center justify-center bg-red-700 h-[50px] w-[50px] text-white text-2xl font-bold rounded-full'>X</div>
            </div>
            <div className='text-2xl text-red-700 font-bold'>Excessive Item</div>
            <p>Selected quantity {selectedQty || 0} is more than required {item?.qty || 0}.</p>
            <Button color="red" onClick={onAcknowledge}>Acknowledge</Button>
          </Space>
        </div></Col>
      </Row>
    </div>
  </div>)
}
const SupervisorLogin = () => {
  return (<div className='' style={{ padding: "20px" }}>
    <div style={{ padding: "10px" }} className='text-center'>
      <div className="flex flex-col w-full items-center justify-center">
        <div className='flex flex-col items-center justify-center bg-yellow-300 h-[60px] w-[60px] text-red-500 text-2xl font-bold rounded-full'>Alert</div>
      </div>
      <div className='text-lg font-bold'>Scan Supervisor Card or Enter Security Key</div>
      <div style={{ padding: "10px 0" }}><Input placeholder="************" type={'password'} /></div>
      <Button color="green">Approve</Button>
    </div>
  </div>)
}
// const AddBags = () => {
//   return (<div className='p-10 flex-1 flex w-full'><div className='w-full'>
//     <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-[10px]">
//       {Array(8).fill(null).map((_, index) => (
//         <div key={index} className="flex flex-col w-full items-center justify-center">
//           <div className='flex flex-col items-center justify-center overflow-hidden w-full h-[200px] bg-white border border-gray-200 rounded-md p-5'>
//             <div className='h-[100px] w-[70px] bg-blue-300'>pic</div>
//             <div>{index}x{index} Size</div>
//             <div className='text-2xl font-bold'>10 RS</div>
//             <Button color='green' block>Add</Button>
//           </div>
//         </div>
//       ))}
//     </div>
//   </div></div>)
// }

const ReadyToDispatchWizard = ({
  currentBaskets,
  showBags,
  showBaskets,
  showPrint,
  onReadyToDispatch,
  loading,
}: {
  currentBaskets: Array<{ _id: string }>;
  showBags: () => void;
  showBaskets: () => void;
  showPrint: () => void;
  onReadyToDispatch: () => void;
  loading?: boolean;
}) => {
  const hasSelectedBaskets = (currentBaskets?.length || 0) > 0;

  return (<div className="flex-1 flex flex-col items-start w-full bg-gray-50/50 overflow-y-auto">
    <div className='p-10 flex-1 flex w-full'>
      <div className='w-full flex flex-1 flex-row flex-center item-center justify-center self-center'>
        <div className='bg-white border border-gray-200 rounded-lg w-200 shadow-sm' style={{ padding: "20px" }}>
          <div style={{ padding: "10px" }} className='text-center'>
            {!hasSelectedBaskets && (
              <Space orientation="vertical" align="center" size={12}>
                <div className='text-2xl font-semibold'>Select baskets to continue</div>
                <Text type="secondary">Please assign at least one dispatch basket before moving this order to ready to dispatch.</Text>
                <Button size="large" onClick={showBaskets} color="blue">Select Baskets</Button>
              </Space>
            )}

            {hasSelectedBaskets && (
              <Space orientation="vertical" align="center" size={16}>
                <div className='text-2xl font-semibold'>Order is ready for dispatch</div>
                <Space>
                  <Button onClick={showBaskets}>Baskets</Button>
                  <Button onClick={showBags}>Bags</Button>
                  <Button onClick={showPrint}>Print</Button>
                </Space>
                <Button size="large" onClick={onReadyToDispatch} color="green" loading={loading}>Ready to Dispatch</Button>
              </Space>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>)

}

const ThermalInvoicePreview = React.forwardRef<HTMLDivElement, { orderData: any; settings: any }>(
  ({ orderData, settings }, ref) => {
    const processedItems = (orderData?.current_order?.items || []).filter(
      (item: any) => (item.processed_qty ?? 0) > 0
    );
    const unavailableItems = (orderData?.current_order?.items || []).filter(
      (item: any) => item.status === 'out_of_stock'
    );
    const bagItems = orderData?.current_order?.bags || [];
    const itemSubtotal = processedItems.reduce(
      (sum: number, item: any) => sum + ((item.processed_qty ?? 0) * (item.price ?? 0)),
      0
    );
    const bagTotal = bagItems.reduce(
      (sum: number, bag: any) => sum + ((bag.qty || 0) * (bag.price || 0)),
      0
    );
    const discountTotal = orderData?.current_order?.totals?.discountTotal ?? 0;
    const shipping = orderData?.current_order?.totals?.shipping ?? 0;
    const taxAmount = orderData?.current_order?.totals?.taxAmount ?? 0;
    const grandTotal = itemSubtotal + bagTotal + shipping + taxAmount - discountTotal;

    return (
      <div
        ref={ref}
        style={{
          width: 320,
          margin: '0 auto',
          padding: 16,
          backgroundColor: '#fff',
          color: '#111',
          fontFamily: '"Courier New", monospace',
          fontSize: 12,
          lineHeight: 1.5,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{orderData?.store?.title || orderData?.store?.name || 'Store Invoice'}</div>
          <div>{orderData?.store?.address || orderData?.shippingAddress?.address || ''}</div>
          <div>Order #{orderData?.serial}</div>
        </div>

        <div style={{ borderTop: '1px dashed #111', borderBottom: '1px dashed #111', padding: '8px 0', marginBottom: 12 }}>
          <div>Customer: {orderData?.customer?.name || 'Walk-in Customer'}</div>
          <div>Phone: {orderData?.customer?.phone || 'N/A'}</div>
          <div>Date: {dayjs().format('DD MMM YYYY HH:mm')}</div>
          <div>Slot: {utcToDate(orderData?.delivery_slot?.start_date).format('DD MMM HH:mm')} - {utcToDate(orderData?.delivery_slot?.end_date).format('HH:mm')}</div>
        </div>

        <div style={{ fontWeight: 700, marginBottom: 8 }}>ITEMS</div>
        {processedItems.map((item: any) => {
          const qty = item.processed_qty ?? 0;
          const lineTotal = qty * (item.price ?? 0);

          return (
            <div key={String(item._id_product)} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>{item.title}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span>{qty} x {formatMoney(item.price)}</span>
                <span>{formatMoney(lineTotal)}</span>
              </div>
            </div>
          );
        })}

        {bagItems.length > 0 && (
          <>
            <div style={{ fontWeight: 700, margin: '12px 0 8px' }}>BAGS</div>
            {bagItems.map((bag: any) => {
              const lineTotal = (bag.qty || 0) * (bag.price || 0);

              return (
                <div key={String(bag._id)} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <span>Bag {bag.size} ({bag.qty})</span>
                  <span>{formatMoney(lineTotal)}</span>
                </div>
              );
            })}
          </>
        )}

        {unavailableItems.length > 0 && (
          <>
            <div style={{ fontWeight: 700, margin: '12px 0 8px' }}>UNAVAILABLE</div>
            {unavailableItems.map((item: any) => (
              <div key={String(item._id_product)} style={{ marginBottom: 4 }}>
                {item.title} ({item.qty})
              </div>
            ))}
          </>
        )}

        <div style={{ borderTop: '1px dashed #111', marginTop: 12, paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Items</span>
            <span>{formatMoney(itemSubtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Bags</span>
            <span>{formatMoney(bagTotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Shipping</span>
            <span>{formatMoney(shipping)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tax</span>
            <span>{formatMoney(taxAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Discount</span>
            <span>-{formatMoney(discountTotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, marginTop: 8 }}>
            <span>TOTAL</span>
            <span>{settings?.currency}{formatMoney(grandTotal)}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, borderTop: '1px dashed #111', paddingTop: 12 }}>
          <div>Scanned items invoice</div>
          <div>Thank you</div>
        </div>
      </div>
    );
  }
);

ThermalInvoicePreview.displayName = 'ThermalInvoicePreview';

const TillVerificationPOS = ({ shiftSession }: { shiftSession: any }) => {
  const { store, store_id }: any = usePageProps();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useParams()

  const orderId = params.orderId as string

  const settings = useAppSelector(getSettings);
  // const tillVerification = useAppSelector(getTillVerification);
  const activeShift = useAppSelector(getActiveShift);
  const orderData = useAppSelector(getCurrentOrder);

  const [activeTab, setActiveTab] = useState('unscanned');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeNotes, setCompleteNotes] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptText, setReceiptText] = useState<string>('');
  const [fatelError, setFatelError] = useState<string | null>(null);
  const [openDrawer, set_openDrawer] = useState<string | false>(false);

  const [showWrongItem, set_showWrongItem] = useState<boolean>(false);
  const [showExcessiveItem, set_showExcessiveItem] = useState<boolean>(false);
  const [excessiveItemData, setExcessiveItemData] = useState<any>(null);
  const [excessiveQty, setExcessiveQty] = useState<number>(0);
  const [showSupervisorLogin, set_showSupervisorLogin] = useState<boolean>(false);
  const [showReadyToDispatch, set_showReadyToDispatch] = useState<boolean>(false);

  const [showBags, set_showBags] = useState<boolean>(false);
  const [showBaskets, set_showBaskets] = useState<boolean>(false);
  const [showPrint, set_showPrint] = useState<boolean>(false);

  const initializedOrderIdRef = useRef<string | null>(null);
  const invoicePreviewRef = useRef<HTMLDivElement | null>(null);

  // Mutations
  const { startOrder, called: calledStart } = useStartOrderVerification();
  const { completeOrder, loading: completingOrder } = useCompleteOrderVerification();
  const { removeOrderFromSession, loading: removingOrderFromSession } = useRemoveOrderFromTillSession();
  const { updateTillVerificationBaskets, loading: updatingBaskets } = useUpdateTillVerificationBaskets();
  const { updateTillVerificationBags, loading: updatingBags } = useUpdateTillVerificationBags();
  const { printReceipt, loading: printingReceipt } = usePrintTillReceipt();


  const initializeOrder = async (targetOrderId: string) => {
    console.log(__yellow("initializeOrder()"))
    initializedOrderIdRef.current = targetOrderId;

    try {
      // Always re-sync from backend on page load/refresh so persisted Redux
      // does not hide external order changes from another device/session.
      const result = await startOrder(targetOrderId);

      if (result?.success?.message?.includes('Resuming')) message.info('Resuming order verification');
      else message.success('Order verification started');

    } catch (error: any) {
      console.error('Failed to start order:', error);
      initializedOrderIdRef.current = null;
      setFatelError(error.message || 'Failed to start order verification');
    }
  };

  const handleCompleteWithReceipt = async () => {
    if (!orderData) return;

    const attachedDeliveryBaskets = orderData?.current_order?.baskets || [];
    if (attachedDeliveryBaskets.length === 0) {
      message.error('Please attach at least one delivery basket');
      return;
    }

    try {
      await completeOrder(orderId, completeNotes);
      message.success('Order verification completed successfully!');
      setShowCompleteModal(false);
      setCompleteNotes('');

      // Offer to print receipt
      Modal.confirm({
        title: 'Print Receipt?',
        content: 'Would you like to print the till receipt for this order?',
        okText: 'Print Receipt',
        cancelText: 'Skip',
        icon: <PrinterOutlined />,
        onOk: async () => {
          try {
            const result = await printReceipt(orderId);
            if (result?.receiptText) {
              setReceiptText(result.receiptText);
              setShowReceiptModal(true);
            }
            navigateToTillQueue();
          } catch (error: any) {
            message.error(error.message || 'Failed to print receipt');
            // Still navigate away
            navigateToTillQueue();
          }
        },
        onCancel: () => {
          navigateToTillQueue();
        },
      });
    } catch (error: any) {
      message.error(error.message || 'Failed to complete verification');
    }
  };

  const handleLiveBasketAction = async (
    basket: { _id: string; title: string },
    action: 'add' | 'remove'
  ) => {
    const response = await updateTillVerificationBaskets(orderId, basket._id, action);
    message.success(response?.success?.message || `Basket ${action}ed successfully`);
  };

  const handleLiveBagAction = async (
    bag: { _id: string; size: string },
    action: 'add' | 'remove'
  ) => {
    const response = await updateTillVerificationBags(orderId, bag._id, action);
    message.success(response?.success?.message || `Bag ${action}ed successfully`);
  };

  const handleBack = () => {
    dispatch(setCurrentOrder(null));
    router.push(`${adminRoot}/store/${store_id}/till-verification`);
  };

  const navigateToTillQueue = () => {
    dispatch(removeHeldOrder(orderId));
    dispatch(setCurrentOrder(null));
    router.push(`${adminRoot}/store/${store_id}/till-verification`);
  };

  const handleRemoveStuckOrder = async () => {
    try {
      await removeOrderFromSession(orderId, 'Order removed from till session after stale verification state');
      message.success('Order removed from till session and reverted to picking complete');
      navigateToTillQueue();
    } catch (error: any) {
      message.error(error.message || 'Failed to remove order from till session');
    }
  };

  const onNavClick = (nav: string) => {
    if (nav == 'wrong_item') {
      set_showWrongItem(true)
      return;
    }
    if (nav == 'excessive_item') {
      set_showExcessiveItem(true);
      return;
    }
    if (nav == 'Supervisor Mode') {
      set_showSupervisorLogin(true);
      return;
    }
    if (nav == 'Redy to dispatch') {
      set_showReadyToDispatch(true);
      return;
    }

    set_openDrawer(nav)
  }

  const handleShowExcessiveItem = (item: any, qty: number) => {
    setExcessiveItemData(item);
    setExcessiveQty(qty);
    set_showExcessiveItem(true);
  }

  const handlePrintInvoice = () => {
    if (!invoicePreviewRef.current) return;

    const printWindow = window.open('', '_blank', 'width=420,height=800');
    if (!printWindow) {
      message.error('Unable to open print window');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${orderData?.serial || ''}</title>
          <style>
            body { margin: 0; padding: 0; background: #fff; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>${invoicePreviewRef.current.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Initialize order verification on mount
  useEffect(() => {
    if (!orderId) return;
    if (initializedOrderIdRef.current === orderId) return;

    initializeOrder(orderId);
  }, [orderId, orderData?._id]);


  if (fatelError) {
    const canRemoveFromSession = fatelError.includes('Order is not ready for till verification');

    return <ErrorComp
      title="Error"
      description={fatelError}
      buttons={<>
        {canRemoveFromSession && (
          <Button
            type="primary"
            danger
            loading={removingOrderFromSession}
            onClick={handleRemoveStuckOrder}
          >
            Remove From Session
          </Button>
        )}
        <Button type="primary" onClick={() => router.push(`${adminRoot}/store/${store_id}/till-verification`)}>Go to Queue</Button>
      </>}
    />
  }
  if (!orderId || !activeShift) {
    let eInfo = { title: "", description: "" }
    if (!orderId) Object.assign(eInfo, {
      title: "Missing order ID", description: "Unable to find target order ID"
    })
    if (!activeShift && !orderId) Object.assign(eInfo, {
      title: "No Active Shift", description: "You must have an active shift to verify orders."
    })

    return <ErrorComp {...eInfo}
      buttons={<><Button type="primary" onClick={() => router.push(`${adminRoot}/store/${store_id}/till-verification`)}>Go to Queue</Button></>}
    />
  }

  // Loading state - show what's happening
  if (!orderData) {
    if (!calledStart) return (<div style={{ textAlign: 'center', padding: '100px 0' }}><Loader loading={true}>Initializing...</Loader></div>);

    return <ErrorComp title="Failed to Load Order" description="Could not load order data. The order might not be available for verification."
      buttons={<><Button type="primary" onClick={() => router.push(`${adminRoot}/store/${store_id}/till-verification`)}>Back to Queue</Button></>}
    />
  }

  const orderItems = orderData?.current_order?.items || [];
  const customer = orderData?.customer;
  const picker = orderData?.processing_stages?.picking?.handled_by;

  // Calculate verification progress
  const totalItems = orderItems.length;
  const processedItems = orderItems.filter((item: any) =>
    item.processed_qty > 0 || item.status === 'confirmed' || item.status === 'out_of_stock' || item.status === 'damaged'
  );
  const unscannedItems = orderItems.filter((item: any) =>
    (item.processed_qty < 1 || item.qty !== item.processed_qty) && !!item.issue_reason==false && item.status !== 'out_of_stock' && item.status !== 'damaged'
  );
  const scannedItems = orderItems.filter((item: any) =>
    item.processed_qty > 0 && item.qty == item.processed_qty && item.status === 'confirmed'
  );
  const missingItems = orderItems.filter((item: any) => !!item.issue_reason);
  const progressPercent = totalItems > 0 ? (processedItems.length / totalItems) * 100 : 0;

  let displayItems = (activeTab === 'unscanned') ? unscannedItems : orderItems;
  if (activeTab === 'scanned') displayItems = scannedItems;
  if (activeTab === 'unavailable') displayItems = missingItems;

  return (<>
    <div className="flex h-[calc(100vh-50px)] w-full overflow-hidden">
      {/* <LeftColumn onNavClick={onNavClick} /> */}

      {/* Middle Column Wrapper (C2 + C3) */}
      <div className="flex flex-col flex-1 min-w-0">
        <div>
          <div className='p-10 w-full'><Space wrap>
            <IconButton onClick={() => router.back()} icon='arrow-left' />
            <div>Order {orderData.serial}</div>
            <Button onClick={() => setActiveTab('unscanned')} color={activeTab ==='unscanned' ? 'blue' : undefined}>Unscanned ({unscannedItems.length})</Button>
            <Button onClick={() => setActiveTab('scanned')} color={activeTab === 'scanned' ? 'blue' : undefined}>Scanned ({scannedItems.length})</Button>
            <Button onClick={() => setActiveTab('unavailable')} color={activeTab === 'unavailable' ? 'blue' : undefined}>Unavailable ({missingItems.length})</Button>
          </Space></div>
        </div>

        {/* {(unscannedItems.length > 0 && activeTab === 'unscanned') ? <ContentArea orderData={orderData} orderItems={displayItems} /> : <><ReadyToDispatchWizard orderData={orderData} /></>} */}
        {(activeTab === 'unscanned' && unscannedItems.length==0) ? (
          <ReadyToDispatchWizard
            currentBaskets={orderData?.current_order?.baskets || []}
            showBags={() => set_showBags(true)}
            showBaskets={() => set_showBaskets(true)}
            showPrint={() => set_showPrint(true)}
            onReadyToDispatch={handleCompleteWithReceipt}
            loading={completingOrder}
          />
        ) : <ContentArea orderData={orderData} orderItems={displayItems} />}

        <PageFooter orderData={orderData} />
      </div>

      <RightColumn orderData={orderData} orderId={orderId} onShowExcessiveItem={handleShowExcessiveItem} showBags={() => set_showBags(true)} showBaskets={() => set_showBaskets(true)} showPrint={() => set_showPrint(true)} />
    </div>



    <Modal open={showBags} onCancel={() => set_showBags(false)} title='Add Bags' footer={false} confirmLoading={updatingBags}>
      {/* <h1>Add Bags</h1> */}
      <AddBags currentBags={orderData?.current_order?.bags || []} onBagAction={handleLiveBagAction} />
    </Modal>
    <Modal open={showBaskets} onCancel={() => set_showBaskets(false)} title='Add Baskets' footer={false} destroyOnHidden confirmLoading={updatingBaskets}>
      {showBaskets && (
        <AddBaskets
          _id_store={store_id}
          category='dispatch'
          currentBaskets={orderData?.current_order?.baskets || []}
          onBasketAction={handleLiveBasketAction}
        />
      )}
    </Modal>
    <Modal
      open={showPrint}
      onCancel={() => set_showPrint(false)}
      title='Final Invoice'
      width={420}
      footer={[
        <Button key="close" onClick={() => set_showPrint(false)}>Close</Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrintInvoice}>Print</Button>,
      ]}
    >
      <ThermalInvoicePreview ref={invoicePreviewRef} orderData={orderData} settings={settings} />
    </Modal>

    <Modal open={showWrongItem} onCancel={() => set_showWrongItem(false)} title="Wrong Item" footer={false}
      styles={{
        container: {
          backgroundColor: '#EC1C24'
        },
        title: {
          color: "white"
        }
      }}
    >
      <WrongItem />
    </Modal>
    <Modal open={showExcessiveItem} onCancel={() => set_showExcessiveItem(false)} title='Excessive Item' footer={false}
      styles={{
        container: {
          backgroundColor: 'yellow'
        }
      }}
    >
      <ExcessiveItem item={excessiveItemData} selectedQty={excessiveQty} onAcknowledge={() => set_showExcessiveItem(false)} />
    </Modal>

    <Modal open={showSupervisorLogin} onCancel={() => set_showSupervisorLogin(false)} title='Supervisor Login' footer={false}>
      <SupervisorLogin />
    </Modal>

    {/* <DevBlock obj={orderData} title="orderData" /> */}

  </>)

}



function TillVerificationPOS_Wrapper() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string
  const { store, store_id }: any = usePageProps();

  const [activity, setActivity] = useState("Loading session...")
  const [fatelError, setFatelError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  const { session: shiftSession, loading: shiftLoading, error: shiftError, refetch: refetchShift } = useMyActiveTillShift();
  const { openShift, loading: openingShift } = useOpenTillShift();

  useEffect(() => {
    if(shiftSession){
      console.log(__success("shiftSession FOUND"))
      // setReady(true)
    }
    
    if (!shiftSession && !shiftLoading){
      console.log("Shift Sesson not found!!")
      attemptOpenShift();
    }

  }, [shiftSession, shiftLoading]);


  const attemptOpenShift = async () => {
    console.log(__yellow("attemptOpenShift()"))
    if (openingShift || shiftSession || shiftLoading) return;
    setActivity("Starting a new session...")

    // setOpenAttempted(true);
    try {
      await openShift(store_id);
      // console.log('✅ Shift opened successfully, refetching...');
      // message.success('Shift started automatically');
      // await refetchShift();
    } catch (error) {
      console.error('❌ Failed to open shift:', error);
      setFatelError((error as Error).message || 'Failed to open shift automatically');
    } finally {
      // setActivity("New session started....")
      // setIsOpeningShift(false);
    }
  };



  if (fatelError) return (<Page><div style={{ textAlign: 'center', padding: '100px 0' }}><Card>
    <Space orientation="vertical" align="center">
      <ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />
      <Title level={4}>Session Required</Title>
      <Text>{fatelError}</Text>
      <Button type="primary" onClick={() => router.push(`${adminRoot}/store/${store_id}/till-verification`)}>Go to Till Queue</Button>
    </Space>
  </Card></div></Page>);

  if (shiftLoading || openingShift) return <Loader loading={true}><div style={{ textAlign: "center" }}>{activity || "Loading..."}</div></Loader>
  // if (!ready) return <Loader loading={true}><div style={{ textAlign: "center" }}>Preparing...</div></Loader>

  if (!shiftSession) return (<Page><div style={{ textAlign: 'center', padding: '100px 0' }}><Card>
    <Space orientation="vertical" align="center">
      <ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />
      <Title level={4}>No active shift found!</Title>
      <Button type="primary" onClick={() => router.push(`${adminRoot}/store/${store_id}/till-verification`)}>Go to Till Queue</Button>
    </Space>
  </Card></div></Page>);

  if (!orderId) return (<Page><div style={{ textAlign: 'center', padding: '100px 0' }}><Card>
    <Space orientation="vertical" align="center">
      <ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />
      <Title level={4}>Order ID not found!</Title>
      <Button type="primary" onClick={() => router.push(`${adminRoot}/store/${store_id}/till-verification`)}>Go to Till Queue</Button>
    </Space>
  </Card></div></Page>);


  return (<>
    <TillVerificationPOS 
      shiftSession={shiftSession}
    />
  </>)
}

export default TillVerificationPOS_Wrapper;
