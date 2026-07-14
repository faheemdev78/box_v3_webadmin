'use client'
/**
 * Till Verification POS Component
 * Main POS-style verification screen for item-by-item verification
 * Updated for shift-based order verification system
 */

import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Card, Row, Col, Space, Typography, Modal, Input, message, Progress, Tag, Alert, InputNumber, Tooltip, Popover } from 'antd';
import BarcodePackage from 'react-barcode';
import { useQuery } from '@apollo/client/react';
import { 
  CloseCircleOutlined, WarningOutlined, ClockCircleOutlined, EditOutlined,
  CheckCircleOutlined, LeftOutlined, ExclamationCircleOutlined, PrinterOutlined } from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/rStore/hooks';
import { getActiveShift, getCurrentOrder, getTillVerification, setCurrentOrder, updateOrderTotals
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
import { playBeep } from '@/lib/utill';
import { Styles } from '@/types/styles';
// import UsbTest from './components/UsbTest';

import GET_AVAILABLE_BASKETS from '@/graphql/baskets/getAvailableBaskets.graphql';
import GET_BAGS from '@/graphql/bags/bags.graphql';
import ProductReceipt from './components/productRreceipt';
import OrderReceipt from './components/orderReceipt';

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

// const getStatusTag = (status:string) => {
//   switch (status) {
//     case 'verified':
//       return (<Tag icon={<CheckCircleOutlined />} color="success">Verified</Tag>);
//     case 'missing':
//       return (<Tag icon={<CloseCircleOutlined />} color="error">Missing</Tag>);
//     case 'mismatch':
//       return (<Tag icon={<WarningOutlined />} color="warning">Qty Mismatch</Tag>);
//     case 'pending':
//     default:
//       return (<Tag icon={<ClockCircleOutlined />} color="default">Pending</Tag>);
//   }
// };


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

const normalizeBarcode = (barcode: any) => String(barcode || '').trim();

type ScannableRecord = {
  _id?: string;
  barcode?: string;
  title?: string;
  size?: string;
  [key: string]: any;
};

const findByBarcode = <T extends ScannableRecord>(items: T[] = [], barcode: string) => {
  const targetBarcode = normalizeBarcode(barcode);
  if (!targetBarcode) return undefined;

  return items.find((item) => normalizeBarcode(item?.barcode) === targetBarcode);
};

const getScanLabel = (item: any, fallback = 'item') => {
  return item?.title || item?.size || item?.barcode || fallback;
};

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

const toAmount = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

const roundAmount = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const formatMoney = (value: number | undefined | null) => roundAmount(toAmount(value)).toFixed(2);

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

  return (<div className='relative flex flex-col overflow-hidden w-full  h-[230px] min-w-fit bg-white border border-gray-200 rounded-2xl shadow-md'>
    <div className='absolute top-2 right-2 z-999'>
      <PopMenu orientation="vertical" placement="leftTop" shape="round"
        items={[
          { onClick: handleDropItem, label: "Drop Item", confirm: "Are you sure to drop this item?", hide: item.processed_qty < 1 && !!item.issue_reason==false },
          { onClick: () => setShowMissingModal(true), label: 'Unavailable' },
        ]}
      ></PopMenu>
      {/* <Popover content={<BarcodePackage
        value={item.barcode} //{`doReadyForDispatch`}
        width={2.0}
        height={30}
        format={"CODE128"}
        displayValue={item.barcode}
      />} title={false}><IconButton icon={<Icon icon="barcode" />} /></Popover> */}
    </div>
    <div className='flex-full flex flex-col flex-1 min-w-0 p-10'>
      <Row className='nowrap'>
        <Col flex="130px">
          <div className='bg-blue-300 w-[130px] h-[150px] flex justify-center' style={{ marginRight:"10px" }}>pic</div>
          {/* <BarcodePackage
            value={item.barcode} //{`doReadyForDispatch`}
            width={1.2}
            height={20}
            format={"CODE128"}
            displayValue={item.barcode}
          /> */}
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
          <div>
            <Space size={1}>
              <Tag color="#E7F6EC" style={{ color: "#166534" }}><Icon icon="check-circle" color="#2DA44E" />{item?.store?.available_qty > 999 ? '1K+' : (item?.store?.available_qty || 0)} in Stock</Tag>
              {item.temp_sensitivity === 'freezer' && <Tooltip title='Freezer'>
                <span className='relative'>
                  <Icon icon='box' color='#8e8e8e' fontSize={18} />
                  <Icon icon="snowflake" fontSize={10} color='#FFFFFF' className='absolute right-0 bottom-0' />
                </span>
              </Tooltip>}
              {item.temp_sensitivity === 'fridge' && <Tooltip title='Fridge'>
                <span className='relative'>
                  <Icon icon='box' color='#8e8e8e' fontSize={18} />
                  <Icon icon="temperature-low" fontSize={10} color='#FFFFFF' className='absolute right-0 bottom-0' />
                </span>
              </Tooltip>}
              {/* <span className='relative'>
                <Icon icon='box' color='#8e8e8e' fontSize={18} />
                <Icon icon="exclamation-circle" fontSize={10} color='#FFFFFF' className='absolute right-0 bottom-0' />
              </span> */}
              {item.unfit_for_dispatch && <Tooltip title='Not fit for box'>
                <span className='relative'>
                  <Icon icon='box' color='#8e8e8e' fontSize={18} />
                  <div className='absolute bg-black-500 h-1 w-full left-0 right-0 top-1.5 rounded-md border-1 border-white rotate-45' />
                </span>
              </Tooltip>}
            </Space>

            {/* {item.unfit_for_dispatch && <Tag>Fit for dispatch</Tag>} */}
            {/* {item.is_expirable && <Tag>expireable</Tag>} */}
            {/* <Tag>{item.temp_sensitivity === 'freezer' && <Icon icon="snowflake" />}</Tag> */}
          </div>

          
          <div className='border-b border-gray-300' style={{ margin:"5px 0" }} />
          
          <Row>
            <Col flex="auto">
              <div className='text-base'>{settings.currency} <span className='font-bold text-2xl' style={{ color: "#DC2626" }}>{item.price}</span> <span className='text-base text-gray-500 line-through' style={{ color: "#9CA3AF" }}>{settings.currency} {item.price_was}</span></div>
              <div className='text-sm'>Qty received: {item.qty}</div>
            </Col>
            {/* <Col><div>{!!item.issue_reason && <Tooltip trigger='click' title={item.issue_reason} placement='top'><Button size="small" color="red" icon={<Icon icon="exclamation" />}>Mismatch</Button></Tooltip>}</div></Col> */}
            <Col>{!!item.issue_reason && <Tooltip trigger='click' title={<div>
              <div>Unavailable: {Number(pickedQty - verificationStatus.qty_verified)}</div>
              <div>{item.issue_reason}</div>
            </div>}  placement='top'><IconButton shape="round" color="red" icon="exclamation" /></Tooltip>}</Col>
          </Row>

          <Row gutter={[5, 0]} className='nowrap'>
            <Col flex={12}>
              <div className='border-gray-300 rounded-md p-5' style={{ backgroundColor:"#FFF3E8" }}>
                <Space>
                  <Icon icon="shopping-basket" size='2x' color='#C2410C' />
                  <div style={{ color:"#7C2D12"}}>
                    <div className='text-sm' style={{ lineHeight: 1.2 }}>Picked</div>
                    <div className='text-lg font-bold' style={{ lineHeight: 1.2 }}>{pickedQty}</div>
                  </div>
                </Space>
              </div>
            </Col>
            <Col flex={12}>
              <div className='border-gray-300 rounded-md p-5' style={{ backgroundColor:"#E8F1FD" }}>
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
        <Col span={12}><Tooltip title={<BarcodePackage value={item.barcode} width={1.5} height={30} format={"CODE128"} displayValue={item.barcode} />} placement='topLeft'>
          <span className='text-xs'>#{item.barcode}</span>
        </Tooltip></Col>
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

const RightColumn = ({
  showBags,
  showBaskets,
  // showPrint,
  openPrintWindow,
  orderData,
  orderCalculations,
  orderId,
  productScanRequest,
  onShowExcessiveItem,
  unscannedItems
}: {
  showBags: () => void;
  showBaskets: () => void;
  // showPrint: () => void;
  openPrintWindow: (txt:string) => void;
  orderData: any;
  orderCalculations: any;
  orderId: string;
  productScanRequest?: { barcode: string; key: number } | null;
  onShowExcessiveItem: (item: any, qty: number) => void;
  unscannedItems: any;
}) => {

  {/* C4: 300px fixed width */}
  // flex flex-1 flex-col items-start w-full bg-gray-50/50 overflow-y-auto
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [submittedBarcodeQuery, setSubmittedBarcodeQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [scaned, setScaned] = useState<string | null>(null)
  const [selectedQty, setSelectedQty] = useState(0);
  const [showMismatchModal, setShowMismatchModal] = useState(false);
  const [mismatchQty, setMismatchQty] = useState(0);
  const [mismatchNotes, setMismatchNotes] = useState('');
  const [mismatchItem, setMismatchItem] = useState<any>(null);
  const [mismatchExpectedQty, setMismatchExpectedQty] = useState(0);
  const selectedProductIdRef = useRef<string | null>(null);
  const selectedQtyRef = useRef(0);
  const { verifyItem, loading: verifyLoading } = useVerifyOrderItem();
  const { markMissing, loading: missingLoading } = useMarkOrderItemMissing();
  const { markMismatch, loading: mismatchLoading } = useMarkOrderItemMismatch();

  const settings = useAppSelector(getSettings);

  const orderItems = orderCalculations.orderItems || [];
  const totalBaskets = (orderData?.current_order?.baskets || []).length;
  const totalBags = (orderData?.current_order?.bags || []).reduce(
    (sum: number, bag: any) => sum + (bag.qty || 0),
    0
  );
  // const scannedItemQty = orderItems.reduce(
  //   (sum: number, item: any) => sum + (item.processed_qty ?? 0),
  //   0
  // );
  // const originalOrderQty = orderData?.original_order?.totals?.totalQuantity ?? orderData?.current_order?.totals?.totalQuantity ?? 0;
  const normalizedQuery = submittedBarcodeQuery.trim().toLowerCase();
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
  // const selectedVerificationStatus = selectedItem ? getVerificationStatusFromItem(selectedItem) : null;
  // const pickedQty = selectedItem ? getPickedQtyFromProcessingStage(orderData, selectedItem) : 0;
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
      selectedQtyRef.current = 0;
      return;
    }

    if (selectedProductIdRef.current === String(selectedItem._id_product)) {
      return;
    }

    const nextQty = selectedItem.processed_qty ?? 0;
    setSelectedQty(nextQty);
    selectedQtyRef.current = nextQty;
  }, [selectedItem?.processed_qty, selectedProductId]);

  const selectItem = (item: any) => {
    const productId = String(item._id_product);
    const nextQty = item.processed_qty ?? 0;
    selectedProductIdRef.current = productId;
    selectedQtyRef.current = nextQty;
    setSelectedProductId(productId);
    setSelectedQty(nextQty);
  };

  const handleBarcodeSearch = () => {
    const nextQuery = barcodeQuery.trim();
    const nextNormalizedQuery = nextQuery.toLowerCase();

    setSubmittedBarcodeQuery(nextQuery);

    if (!nextNormalizedQuery) {
      setSelectedProductId(null);
      return;
    }

    if (nextNormalizedQuery.length < 5) return;

    const nextMatchedItems = orderItems.filter((item: any) => {
      const barcode = String(item.barcode || '').toLowerCase();
      const title = String(item.title || '').toLowerCase();
      return barcode.includes(nextNormalizedQuery) || title.includes(nextNormalizedQuery);
    });
    const exactMatch = nextMatchedItems.find(
      (item: any) => String(item.barcode || '').toLowerCase() === nextNormalizedQuery
    );
    const nextItem = exactMatch || nextMatchedItems[0];

    if (!nextItem) {
      message.error('No item in this order matches that barcode');
      setSelectedProductId(null);
      return;
    }

    selectItem(nextItem);
  };

  const updateSelectedQty = (delta: number) => {
    if (!selectedItem) return;
    setSelectedQty((prev) => {
      const nextQty = Math.max(0, prev + delta);
      selectedQtyRef.current = nextQty;
      return nextQty;
    });
  };

  const applySelectedQty = async (_selectedItem?:any) => {
    if (!_selectedItem) {
      message.error('Select an item first');
      return;
    }

    const _requestedQty = _selectedItem?.qty ?? 0;
    const _selectedQty = _selectedItem?.selectedQty ?? 0;

    try {
      if (_selectedQty > _requestedQty) {
        onShowExcessiveItem(_selectedItem, _selectedQty);
        // clearBarcodeSelection();
        return;
      }

      if (_selectedQty === _requestedQty) {
        await verifyItem(orderId, _selectedItem._id_product, _selectedQty);
        message.success(`${_selectedItem.title} verified`);
        // clearBarcodeSelection();
        return;
      }

      await verifyItem(orderId, _selectedItem._id_product, _selectedQty);

      // setMismatchItem(_selectedItem);
      // setMismatchExpectedQty(_requestedQty);
      // setMismatchQty(_selectedQty);
      // setShowMismatchModal(true);
      // clearBarcodeSelection();
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
    const scannedBarcode = normalizeBarcode(barcode);

    console.log("********** Till List Scanned *******", scannedBarcode);
    if (scannedBarcode) setScaned(scannedBarcode)

    const item = orderItems.find((o:any) => String(o.barcode || '').trim() === scannedBarcode)
    if (!item) {
      console.log("Item not found: ", scannedBarcode)
      return;
    }

    const productId = String(item._id_product);
    const requestedQty = Number(item.qty ?? 0);
    const currentQty = selectedProductIdRef.current === productId
      ? selectedQtyRef.current
      : Number(item.processed_qty ?? 0);
    const nextQty = currentQty + 1;

    selectedProductIdRef.current = productId;
    selectedQtyRef.current = nextQty;
    setSelectedProductId(productId);

    if (requestedQty < nextQty){
      onShowExcessiveItem(item, nextQty);
      return;
    }

    setSelectedQty(nextQty);
    applySelectedQty({ ...item, selectedQty: nextQty });

    // if (requestedQty <= 1 || nextQty >= requestedQty) {
    //   applySelectedQty({ ...item, selectedQty: nextQty });
    // }
  }

  useEffect(() => {
    if (!productScanRequest?.barcode) return;

    handleScan(productScanRequest.barcode);
  }, [productScanRequest?.key]);


  const iconBgMap = {
    'text-green-700': 'bg-green-100',
    'text-blue-500': 'bg-blue-100',
    'text-violet-500': 'bg-violet-100',
    'text-amber-500': 'bg-amber-100',
    'text-red-500': 'bg-red-100',
    'text-teal-600': 'bg-teal-100',
  };
  const Icon2 = ({ children, bgColor, iconColor }) => (
    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${bgColor}`}>
      <div className={`text-3xl ${iconColor}`}>{children}</div>
    </div>
  );
  // Reusable StatCard component
  const StatCard = ({ icon, bgColor, iconColor, label, value, subValue, valueColor }) => (
    <div className={`rounded-2xl p-6 flex items-center gap-4 ${bgColor}`}>
      <Icon2 bgColor={iconBgMap[iconColor]} iconColor={iconColor}>
        {icon}
      </Icon2>
      <div className="border-l border-dashed border-gray-300 pl-4 flex-1">
        <div className="text-sm font-semibold text-gray-700 mb-1">{label}</div>
        <div className={`text-3xl font-bold ${valueColor}`}>
          {value} {subValue && <span className="text-gray-400 text-lg">/ {subValue}</span>}
        </div>
      </div>
    </div>
  );

  const OrderSummary = ({ order, orderCalculations }: { order:any; orderCalculations: any }) => {
    const {
      missingItems,
      scannedItems,
      missingItems_total,
      scannedItemTotal,
      originalOrderTotal,
      customerPayable,
      bagPrice,
      totalBagQuantity,
      deliveryFee,
      fbrFee,
    } = orderCalculations;

    const Card1 = ({ children, icon, color = 'gray' }: { children: any; icon?: ReactNode; color?:string; }) => {

      return (<div 
        className={`
          w-full rounded-md text-base/3
          ${color === 'gray' ? 'bg-gray-100' : ''}
          ${color === 'red' ? 'bg-red-100' : ''}
          ${color === 'green' ? 'bg-green-100' : ''}
        `}
        style={{ padding:"5px 10px", paddingBottom: '0px' }}>
        <Space>
          {icon}          
          <div>
            {children}
          </div>
        </Space>
      </div>)
    }   
 
    return (<div className='w-full text-base/4'>
      {/* <div className='w-full bg-green-100 rounded-md p-10'>
        <Row align="middle">
          <Col flex="auto"><span className='text-3xl font-bold text-gray-900'>Order Received</span></Col>
          <Col className='text-center'>
            <div>Total Order Amount</div>
            <div><span className="text-3xl font-extrabold text-green-700">{originalOrderTotal.toFixed(2)}</span></div>
          </Col>
        </Row>
      </div> */}

      <div className='h-1' />

      <Row gutter={[5, 5]} align="middle">
        <Col span={8}>
          <Card1>
            <div>Order Received</div>
            <div><span className='text-2xl font-bold'>{originalOrderTotal.toFixed(2)}</span></div>
          </Card1>
        </Col>
        <Col span={8}>
          <Card1>
            <div>Total Items</div>
            <div><span className='text-2xl font-bold'>{scannedItems.length || '0'}</span> / {order?.current_order.items?.length || '0'}</div>
          </Card1>
        </Col>
        <Col span={8}>
          <Card1>
            <div>Current Bill</div>
            <div><span className='text-2xl font-bold'>{scannedItemTotal.toFixed(2)}</span> / {Number(originalOrderTotal).toFixed(2)}</div>
          </Card1>
        </Col>

        <Col span={8}>
          <Card1 icon={<Icon icon="plus" size='2x' color={totalBagQuantity > 0 ? "green" : 'gray'} />}>
            <div>Bags</div>
            <div><span className='text-2xl font-bold'>{totalBagQuantity}</span> / {bagPrice.toFixed(2)}</div>
          </Card1>
        </Col>
        <Col span={8}>
          <Card1 icon={<Icon icon="plus" size='2x' color={fbrFee > 0 ? "green" : 'gray'} />}>
            <div>FBR Fee</div>
            <div><span className='text-2xl font-bold'>{Number(fbrFee).toFixed(2)}</span></div>
          </Card1>
        </Col>
        <Col span={8}>
          <Card1 icon={<Icon icon="plus" size='2x' color={deliveryFee > 0 ? "green" : 'gray'} />}>
            <div>Delivery Fee</div>
            <div><span className='text-2xl font-bold'>{Number(deliveryFee).toFixed(2)}</span></div>
          </Card1>
        </Col>
        <Col span={8}>
          <Card1 icon={<Icon icon="minus" size='2x' color={missingItems.length > 0 ? "red" : 'gray'} />} color="red">
            <div>Out of Stock
              {/* <span className='text-[9px]'>Items/Amnt</span> */}
            </div>
            <div><span className='text-2xl font-bold'>{missingItems.length || 0}</span> / {missingItems_total.toFixed(2)}</div>
          </Card1>
        </Col>
        <Col span={8} className='text-center'>
          <Icon icon="equals" size="2x" />
        </Col>
        <Col span={8}>
          <Card1 color="green">
            <div>Customer Payable</div>
            <div><span className='text-2xl font-bold'>{customerPayable.toFixed(2)}</span></div>
          </Card1>
        </Col>
      </Row>

      <div className="w-full border-t border-gray-200 p-4 text-center text-gray-500 text-sm">All amounts are in Pakistani Rupees ({settings.currency})</div>
    </div>)

  };

  // const itemIsUnscanned = selectedItem && selectedItem.status == 'picked';
  const itemIsUnscanned = selectedItem && !!unscannedItems.find((item:any) => item._id_product === selectedItem._id_product)

  return (<>
    <div className='w-150 border-l border-gray-300 flex flex-col items-start shrink-0 bg-white'>

      <div className="flex-1 w-full p-4 bg-gray-50/50 overflow-y-auto">
        <div className='flex flex-col p-10'>
          <div className=''>
            <Input
              allowClear
              placeholder="Search barcode of items in order"
              value={barcodeQuery}
              onChange={(e) => setBarcodeQuery(e.target.value)}
              onClear={()=>{
                // handleBarcodeSearch();
                setSelectedProductId(null)
                setSubmittedBarcodeQuery('')
              }}
              onPressEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleBarcodeSearch();
              }}
            />
            {/* <div>scaned: {scaned}</div> */}
          </div>
          {normalizedQuery && (<div className='flex flex-wrap gap-2 mt-10'>
              {matchedItems.length > 0 ? matchedItems.map((item: any,) => (
                <Button size="small"
                  key={String(item._id_product)}
                  type={String(selectedProductId) === String(item._id_product) ? 'primary' : 'default'}
                  onClick={() => selectItem(item)}
                >
                  {item.barcode || item.title}
                </Button>
              )) : (
                <Text type="secondary">No matching item found in this order.</Text>
              )}
          </div>)}

          <div className='flex flex-col items-center justify-center' style={{ marginTop:"10px" }}>
            <div className='text-xl font-semibold mt-10 text-center' style={{ color:"#111827", lineHeight:1 }}>
              {selectedItem?.title || 'Scan or search an item'}
            </div>
            <div className='w-[300px] h-[300px] bg-gray-200 overflow-hidden flex items-center justify-center rounded-md' style={{margin:"10px"}}>
              {imageSrc ? (
                <img src={imageSrc} alt={selectedItem?.title || 'Product'} className='h-full w-full object-cover' />
              ) : (
                <Text type="secondary">Product Picture</Text>
              )}
            </div>
            <Space orientation="horizontal" size={2} align="center" className='text-lg/1'>
              <Text>Scanned</Text>
              <Text strong style={{ fontSize: 24, lineHeight:1 }}>{selectedQty}/{requestedQty}</Text>
              <Text>Order Qty</Text>
            </Space>
            <div style={{ marginTop: '10px' }}>
              <Space>
                <IconButton icon="minus" onClick={() => updateSelectedQty(-1)} disabled={!selectedItem || actionLoading || !itemIsUnscanned} />
                <div className='text-2xl border border-gray-300 rounded-sm min-w-[72px] text-center' style={{ padding:"0 5px"}}>
                  {selectedQty}/{requestedQty}
                </div>
                <IconButton icon="plus" onClick={() => updateSelectedQty(1)} disabled={!selectedItem || actionLoading || !itemIsUnscanned} />
                <Button icon={<WarningOutlined />} onClick={handleMismatch} disabled={!selectedItem || actionLoading || !itemIsUnscanned}>Qty Issue</Button>
                <Button color='green' onClick={() => applySelectedQty({ ...selectedItem, selectedQty })} loading={actionLoading} disabled={!selectedItem || !itemIsUnscanned}>OK</Button>
              </Space>
            </div>
          </div>
        </div>
        <div className='border-t border-gray-300 p-10'>
          <div className='maxh-12 scrollbar-thin overflow-auto' style={{ marginBottom: '5px' }}>
            <div><Space>
              {orderData?.current_order?.baskets?.map((basket:any, index:number) => (<Tag color="gray" key={index}>{basket.title}</Tag>))}
            </Space></div>
          </div>
          <div style={{ marginBottom: "0px" }}><Space>
            <Button onClick={showBags}>Bags ({totalBags})</Button>
            <Button onClick={showBaskets}>Baskets ({totalBaskets})</Button>
            <Button onClick={() => openPrintWindow('product')}>Product Receipt Print</Button>
          </Space></div>
        </div>

        <div className='border-t border-gray-300 p-10'>
          <div>Area: <b>{orderData.zone.title}</b></div>
          <div>Time: <b>{utcToDate(orderData.delivery_slot.start_date).format("ddd Do MMM YYYY - HH:mm")} - {utcToDate(orderData.delivery_slot.end_date).format("HH:mm")} </b></div>
        </div>

      </div>

      <OrderSummary 
        order={orderData}
        orderCalculations={orderCalculations}
      />

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
  </>)
}


const PageFooter = ({ orderData }: { orderData:any }) => {
  {/* C3: 100px height */}
  return (<div className="h-[80px] border-t border-gray-300 flex bg-white">
    <Row className='w-full p-20' align="middle">
      <Col flex='auto'>
        <Space>
          <div className='font-bold'>Picker Basket</div> 
          {orderData?.processing_stages?.picking?.baskets?.map((basket:any, index:number) => (<Tag style={{ fontSize:"20px" }} color="gray" key={index}>{basket.title}</Tag>))}
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

const ReadyToDispatchWizard = ({
  currentBaskets,
  showBags,
  showBaskets,
  showPrint,
  onReadyToDispatch,
  loading,
  orderData,
}: {
  currentBaskets: Array<{ _id: string }>;
  showBags: () => void;
  showBaskets: () => void;
  showPrint: () => void;
  onReadyToDispatch: () => void;
  loading?: boolean;
  orderData: any;
}) => {
  const hasSelectedBaskets = (currentBaskets?.length || 0) > 0;

  const totalBaskets = (orderData?.current_order?.baskets || []).length;
  const totalBags = (orderData?.current_order?.bags || []).reduce(
    (sum: number, bag: any) => sum + (bag.qty || 0),
    0
  );
  


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
                  <Button onClick={showBaskets}>Baskets ({totalBaskets})</Button>
                  <Button onClick={showBags}>Bags ({totalBags})</Button>
                  <Button onClick={showPrint}>Box Receipt Prints</Button>
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

// const ThermalInvoicePreview = React.forwardRef<HTMLDivElement, { orderData: any; settings: any }>(
//   ({ orderData, settings }, ref) => {
//     const processedItems = (orderData?.current_order?.items || []).filter(
//       (item: any) => (item.processed_qty ?? 0) > 0
//     );
//     const unavailableItems = (orderData?.current_order?.items || []).filter(
//       (item: any) => item.status === 'out_of_stock'
//     );
//     const bagItems = orderData?.current_order?.bags || [];
//     const itemSubtotal = processedItems.reduce(
//       (sum: number, item: any) => sum + ((item.processed_qty ?? 0) * (item.price ?? 0)),
//       0
//     );
//     const bagTotal = bagItems.reduce(
//       (sum: number, bag: any) => sum + ((bag.qty || 0) * (bag.price || 0)),
//       0
//     );
//     const discountTotal = orderData?.current_order?.totals?.discountTotal ?? 0;
//     const shipping = orderData?.current_order?.totals?.shipping ?? 0;
//     const taxAmount = orderData?.current_order?.totals?.taxAmount ?? 0;
//     const grandTotal = itemSubtotal + bagTotal + shipping + taxAmount - discountTotal;

//     return (
//       <div
//         ref={ref}
//         style={{
//           width: 320,
//           margin: '0 auto',
//           padding: 16,
//           backgroundColor: '#fff',
//           color: '#111',
//           fontFamily: '"Courier New", monospace',
//           fontSize: 12,
//           lineHeight: 1.5,
//         }}
//       >
//         <div style={{ textAlign: 'center', marginBottom: 12 }}>
//           <div style={{ fontSize: 16, fontWeight: 700 }}>{orderData?.store?.title || orderData?.store?.name || 'Store Invoice'}</div>
//           <div>{orderData?.store?.address || orderData?.shippingAddress?.address || ''}</div>
//           <div>Order #{orderData?.serial}</div>
//         </div>

//         <div style={{ borderTop: '1px dashed #111', borderBottom: '1px dashed #111', padding: '8px 0', marginBottom: 12 }}>
//           <div>Customer: {orderData?.customer?.name || 'Walk-in Customer'}</div>
//           <div>Phone: {orderData?.customer?.phone || 'N/A'}</div>
//           <div>Date: {dayjs().format('DD MMM YYYY HH:mm')}</div>
//           <div>Slot: {utcToDate(orderData?.delivery_slot?.start_date).format('DD MMM HH:mm')} - {utcToDate(orderData?.delivery_slot?.end_date).format('HH:mm')}</div>
//         </div>

//         <div style={{ fontWeight: 700, marginBottom: 8 }}>ITEMS</div>
//         {processedItems.map((item: any) => {
//           const qty = item.processed_qty ?? 0;
//           const lineTotal = qty * (item.price ?? 0);

//           return (
//             <div key={String(item._id_product)} style={{ marginBottom: 8 }}>
//               <div style={{ fontWeight: 700 }}>{item.title}</div>
//               <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
//                 <span>{qty} x {formatMoney(item.price)}</span>
//                 <span>{formatMoney(lineTotal)}</span>
//               </div>
//             </div>
//           );
//         })}

//         {bagItems.length > 0 && (
//           <>
//             <div style={{ fontWeight: 700, margin: '12px 0 8px' }}>BAGS</div>
//             {bagItems.map((bag: any) => {
//               const lineTotal = (bag.qty || 0) * (bag.price || 0);

//               return (
//                 <div key={String(bag._id)} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
//                   <span>Bag {bag.size} ({bag.qty})</span>
//                   <span>{formatMoney(lineTotal)}</span>
//                 </div>
//               );
//             })}
//           </>
//         )}

//         {unavailableItems.length > 0 && (
//           <>
//             <div style={{ fontWeight: 700, margin: '12px 0 8px' }}>UNAVAILABLE</div>
//             {unavailableItems.map((item: any) => (
//               <div key={String(item._id_product)} style={{ marginBottom: 4 }}>
//                 {item.title} ({item.qty})
//               </div>
//             ))}
//           </>
//         )}

//         <div style={{ borderTop: '1px dashed #111', marginTop: 12, paddingTop: 12 }}>
//           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//             <span>Items</span>
//             <span>{formatMoney(itemSubtotal)}</span>
//           </div>
//           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//             <span>Bags</span>
//             <span>{formatMoney(bagTotal)}</span>
//           </div>
//           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//             <span>Shipping</span>
//             <span>{formatMoney(shipping)}</span>
//           </div>
//           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//             <span>Tax</span>
//             <span>{formatMoney(taxAmount)}</span>
//           </div>
//           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
//             <span>Discount</span>
//             <span>-{formatMoney(discountTotal)}</span>
//           </div>
//           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, marginTop: 8 }}>
//             <span>TOTAL</span>
//             <span>{settings?.currency}{formatMoney(grandTotal)}</span>
//           </div>
//         </div>

//         <div style={{ textAlign: 'center', marginTop: 16, borderTop: '1px dashed #111', paddingTop: 12 }}>
//           <div>Scanned items invoice</div>
//           <div>Thank you</div>
//         </div>
//       </div>
//     );
//   }
// );
// ThermalInvoicePreview.displayName = 'ThermalInvoicePreview';

const TillVerificationPOS = ({ shiftSession }: { shiftSession: any }) => {
  const { store, store_id }: any = usePageProps();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useParams()

  const orderBarcode = String(params.orderBarcode || '').trim()

  const settings = useAppSelector(getSettings);
  // const tillVerification = useAppSelector(getTillVerification);
  const activeShiftFromStore = useAppSelector(getActiveShift);
  const activeShift = activeShiftFromStore || shiftSession;
  const reduxOrderData = useAppSelector(getCurrentOrder);

  const [activeTab, setActiveTab] = useState('unscanned');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeNotes, setCompleteNotes] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptText, setReceiptText] = useState<string>('');
  const [fatelError, setFatelError] = useState<string | null>(null);

  const [showWrongItem, set_showWrongItem] = useState<boolean>(false);
  const [showExcessiveItem, set_showExcessiveItem] = useState<boolean>(false);
  const [excessiveItemData, setExcessiveItemData] = useState<any>(null);
  const [excessiveQty, setExcessiveQty] = useState<number>(0);
  const [showSupervisorLogin, set_showSupervisorLogin] = useState<boolean>(false);

  const [showPrintPreview, set_showPrintPreview] = useState<string | boolean>(false);

  const [showBags, set_showBags] = useState<boolean>(false);
  const [showBaskets, set_showBaskets] = useState<boolean>(false);
  const [initializingOrderBarcode, setInitializingOrderBarcode] = useState<string | null>(null);
  const [initialOrderData, setInitialOrderData] = useState<any>(null);

  const initializedOrderBarcodeRef = useRef<string | null>(null);
  const invoicePreviewRef = useRef<HTMLDivElement | null>(null);
  const productScanSeqRef = useRef(0);
  const liveAttachmentScanRef = useRef<Set<string>>(new Set());
  const [productScanRequest, setProductScanRequest] = useState<{ barcode: string; key: number } | null>(null);

  const { data: availableBasketsData, loading: availableBasketsLoading, error: availableBasketsError, refetch: refetchAvailableBaskets } = useQuery<any>(GET_AVAILABLE_BASKETS, {
    variables: { _id_store: store_id, category: 'dispatch', limit: 100 },
    skip: !store_id,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
  });

  const { data: bagsData, loading: bagsLoading, error: bagsError, refetch: refetchBags } = useQuery<any>(GET_BAGS, {
    variables: { filter: JSON.stringify({ status: 'active' }) },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
  });

  // Mutations
  const { startOrder, called: calledStart, loading: verificationLoading } = useStartOrderVerification();
  const { completeOrder, loading: completingOrder } = useCompleteOrderVerification();
  const { removeOrderFromSession, loading: removingOrderFromSession } = useRemoveOrderFromTillSession();
  const { updateTillVerificationBaskets, loading: updatingBaskets } = useUpdateTillVerificationBaskets();
  const { updateTillVerificationBags, loading: updatingBags } = useUpdateTillVerificationBags();
  const { printReceipt, loading: printingReceipt } = usePrintTillReceipt();

  const matchesRouteOrder = (order: any) => !!order && (
    String(order?.serial || '').trim() === orderBarcode ||
    String(order?.barcode || '').trim() === orderBarcode
  );

  const settingsDeliveryFee = roundAmount(toAmount(settings.default_delivery_charges));
  const settingsFbrFee = roundAmount(toAmount(settings.fbr_fee));

  const rawOrderData = matchesRouteOrder(reduxOrderData)
    ? reduxOrderData
    : matchesRouteOrder(initialOrderData)
      ? initialOrderData
      : null;

  const orderCalculations = useMemo(() => {
    const orderItems = rawOrderData?.current_order?.items || [];
    const totals = rawOrderData?.current_order?.totals || {};
    const deliveryFee = settingsDeliveryFee;
    const fbrFee = settingsFbrFee;

    const processedItems = orderItems.filter((item: any) =>
      item.processed_qty > 0 || item.status === 'confirmed' || item.status === 'out_of_stock' || item.status === 'damaged'
    );
    const unscannedItems = orderItems.filter((item: any) =>
      (item.processed_qty < 1 || item.qty !== item.processed_qty) && !!item.issue_reason == false && item.status !== 'out_of_stock' && item.status !== 'damaged'
    );
    const scannedItems = orderItems.filter((item: any) =>
      item.processed_qty > 0 && item.qty == item.processed_qty && item.status === 'confirmed'
    );
    const missingItems = orderItems.filter((item: any) => !!item.issue_reason);

    const totalItems = orderItems.length;
    const progressPercent = totalItems > 0 ? (processedItems.length / totalItems) * 100 : 0;
    const missingItems_total = missingItems.reduce(
      (sum: number, item: any) => sum + (Number(item.qty || 0) * Number(item.price || 0)),
      0
    );
    const scannedItemTotal = roundAmount(orderItems.reduce(
      (sum: number, item: any) => item.status === 'confirmed'
        ? sum + (Math.max(0, toAmount(item.processed_qty)) * toAmount(item.price))
        : sum,
      0
    ));
    const orderBags = rawOrderData?.current_order?.bags || [];
    const totalBagQuantity = orderBags.reduce(
      (sum: number, bag: any) => sum + Math.max(0, Math.trunc(toAmount(bag.qty))),
      0
    );
    const bagPrice = roundAmount(orderBags.reduce(
      (sum: number, bag: any) => {
        const quantity = Math.max(0, Math.trunc(toAmount(bag.qty)));
        return sum + (toAmount(bag.price) * quantity);
      },
      0
    ));
    const customerPayable = roundAmount(scannedItemTotal + fbrFee + bagPrice + deliveryFee);
    const originalOrderTotal = rawOrderData?.original_order?.totals?.grandTotal ?? totals.grandTotal ?? 0;
    const unavailableItemCount = orderItems.filter((item: any) => item.status === 'out_of_stock').length;

    return {
      orderItems,
      processedItems,
      unscannedItems,
      scannedItems,
      missingItems,
      totalItems,
      progressPercent,
      missingItems_total,
      scannedItemTotal,
      bagPrice,
      totalBagQuantity,
      deliveryFee,
      fbrFee,
      customerPayable,
      originalOrderTotal,
      unavailableItemCount,
    };
  }, [rawOrderData, settingsDeliveryFee, settingsFbrFee]);

  const orderData = useMemo(() => {
    if (!rawOrderData?.current_order) return rawOrderData;

    const totals = rawOrderData.current_order.totals || {};
    const nextTotals = {
      ...totals,
      subtotal: orderCalculations.scannedItemTotal,
      bagTotal: orderCalculations.bagPrice,
      deliveryFee: orderCalculations.deliveryFee,
      fbrFee: orderCalculations.fbrFee,
      grandTotal: orderCalculations.customerPayable,
    };

    if (
      Number(totals.subtotal || 0) === nextTotals.subtotal &&
      Number(totals.bagTotal || 0) === nextTotals.bagTotal &&
      Number(totals.deliveryFee || 0) === nextTotals.deliveryFee &&
      Number(totals.fbrFee || 0) === nextTotals.fbrFee &&
      Number(totals.grandTotal || 0) === nextTotals.grandTotal
    ) {
      return rawOrderData;
    }

    return {
      ...rawOrderData,
      current_order: {
        ...rawOrderData.current_order,
        totals: nextTotals,
      },
    };
  }, [rawOrderData, orderCalculations.scannedItemTotal, orderCalculations.bagPrice, orderCalculations.customerPayable, orderCalculations.deliveryFee, orderCalculations.fbrFee]);

  useEffect(() => {
    if (!rawOrderData?._id || !rawOrderData?.current_order?.totals) return;

    const totals = rawOrderData.current_order.totals;
    const nextTotals = {
      ...totals,
      subtotal: orderCalculations.scannedItemTotal,
      bagTotal: orderCalculations.bagPrice,
      deliveryFee: orderCalculations.deliveryFee,
      fbrFee: orderCalculations.fbrFee,
      grandTotal: orderCalculations.customerPayable,
    };

    if (
      Number(totals.subtotal || 0) === nextTotals.subtotal &&
      Number(totals.bagTotal || 0) === nextTotals.bagTotal &&
      Number(totals.deliveryFee || 0) === nextTotals.deliveryFee &&
      Number(totals.fbrFee || 0) === nextTotals.fbrFee &&
      Number(totals.grandTotal || 0) === nextTotals.grandTotal
    ) return;

    dispatch(updateOrderTotals({
      orderId: rawOrderData._id,
      totals: nextTotals,
    }));
  }, [dispatch, rawOrderData?._id, rawOrderData?.current_order?.totals, orderCalculations.scannedItemTotal, orderCalculations.bagPrice, orderCalculations.customerPayable, orderCalculations.deliveryFee, orderCalculations.fbrFee]);

  const initializeOrder = async (targetOrderBarcode: string) => {
    console.log(__yellow("initializeOrder()"))
    const normalizedOrderBarcode = String(targetOrderBarcode || '').trim();
    initializedOrderBarcodeRef.current = normalizedOrderBarcode;
    setInitializingOrderBarcode(normalizedOrderBarcode);
    setInitialOrderData(null);
    setFatelError(null);

    try {
      // Always re-sync from backend on page load/refresh so persisted Redux
      // does not hide external order changes from another device/session.
      const result = await startOrder(undefined, normalizedOrderBarcode);

      if (initializedOrderBarcodeRef.current !== normalizedOrderBarcode) return;
      if (!result?.order) throw new Error('Order data was not returned from till verification');

      setInitialOrderData(result.order);

      if (result?.success?.message?.includes('Resuming')) message.info('Resuming order verification');
      else message.success('Order verification started');

    } catch (error: any) {
      if (initializedOrderBarcodeRef.current !== normalizedOrderBarcode) return;
      console.error('Failed to start order:', error);
      initializedOrderBarcodeRef.current = null;
      setFatelError(error.message || 'Failed to start order verification');
    } finally {
      if (initializedOrderBarcodeRef.current === normalizedOrderBarcode) {
        setInitializingOrderBarcode(null);
      }
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
      const currentTotals = orderData?.current_order?.totals || {};
      const completionTotals = {
        saved: Number(currentTotals.saved || 0),
        totalQuantity: Number(currentTotals.totalQuantity || 0),
        subtotal: orderCalculations.scannedItemTotal,
        discountTotal: Number(currentTotals.discountTotal || 0),
        bagTotal: orderCalculations.bagPrice,
        shipping: Number(currentTotals.shipping || 0),
        taxRate: Number(currentTotals.taxRate || 0),
        taxAmount: Number(currentTotals.taxAmount || 0),
        fbrFee: orderCalculations.fbrFee,
        deliveryFee: orderCalculations.deliveryFee,
        grandTotal: orderCalculations.customerPayable,
      };

      await completeOrder(orderData._id, completeNotes, completionTotals);
      dispatch(updateOrderTotals({ orderId: orderData._id, totals: completionTotals }));
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
            const result = await printReceipt(orderData._id);
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
    basket: ScannableRecord,
    action: 'add' | 'remove'
  ) => {
    if (!orderData) return;
    if (!basket?._id) {
      message.error('Basket record is missing ID');
      return;
    }

    const response = await updateTillVerificationBaskets(orderData._id, basket._id, action);
    message.success(response?.success?.message || `Basket ${action}ed successfully`);
  };

  const handleLiveBagAction = async (
    bag: ScannableRecord,
    action: 'add' | 'remove'
  ) => {
    if (!orderData) return;
    if (!bag?._id) {
      message.error('Bag record is missing ID');
      return;
    }

    const response = await updateTillVerificationBags(orderData._id, bag._id, action);
    message.success(response?.success?.message || `Bag ${action}ed successfully`);
    return response;
  };

  const queueProductScan = (barcode: string) => {
    productScanSeqRef.current += 1;
    setProductScanRequest({ barcode, key: productScanSeqRef.current });
  };

  const runAttachmentScan = async (scanKey: string, task: () => Promise<void>) => {
    if (liveAttachmentScanRef.current.has(scanKey)) return;

    liveAttachmentScanRef.current.add(scanKey);
    try {
      await task();
    } finally {
      liveAttachmentScanRef.current.delete(scanKey);
    }
  };

  const handleVerificationScan = async (rawBarcode: string) => {
    const barcode = normalizeBarcode(rawBarcode);
    if (!barcode) return;
    // console.log('Till verification scanned:', barcode);

    if (!orderData?._id) {
      message.error('Order is not loaded yet');
      return;
    }

    try {
      const product = findByBarcode(orderData?.current_order?.items || [], barcode);
      if (product) {
        queueProductScan(barcode);
        return;
      }

      const attachedBasket = findByBarcode(orderData?.current_order?.baskets || [], barcode);
      if (attachedBasket) {
        message.info(`Basket ${getScanLabel(attachedBasket, 'basket')} is already attached`);
        return;
      }

      if (availableBasketsLoading || bagsLoading) {
        message.info('Basket and bag scanner data is still loading');
        return;
      }

      if (availableBasketsError || bagsError) {
        playBeep()
        message.error(availableBasketsError?.message || bagsError?.message || 'Failed to load basket or bag scanner data');
        return;
      }

      const availableBasket = findByBarcode(availableBasketsData?.getAvailableBaskets?.baskets || [], barcode);
      if (availableBasket) {
        await runAttachmentScan(`basket:${availableBasket._id}`, async () => {
          await handleLiveBasketAction(availableBasket, 'add');
          await refetchAvailableBaskets();
        });
        return;
      }

      const bag = findByBarcode(bagsData?.bags || [], barcode);
      if (bag) {
        await runAttachmentScan(`bag:${bag._id}`, async () => {
          await handleLiveBagAction(bag, 'add');
          await refetchBags();
        });
        return;
      }

      playBeep()
      set_showWrongItem(true)
      // message.error(`No product, delivery basket, or bag found for ${barcode}`);
    } catch (error: any) {
      message.error(error.message || `Failed to process scan ${barcode}`);
    }
  };

  const navigateToTillQueue = () => {
    if (!orderData?._id) return;

    dispatch(removeHeldOrder(orderData._id));
    dispatch(setCurrentOrder(null));
    router.push(`${adminRoot}/store/${store_id}/till-verification`);
  };

  const handleRemoveStuckOrder = async () => {
    if (!orderData?._id) {
      message.error('Order is not loaded yet');
      return;
    }

    try {
      await removeOrderFromSession(orderData._id, 'Order removed from till session after stale verification state');
      message.success('Order removed from till session and reverted to picking complete');
      navigateToTillQueue();
    } catch (error: any) {
      message.error(error.message || 'Failed to remove order from till session');
    }
  };

  const handleShowExcessiveItem = (item: any, qty: number) => {
    playBeep();
    setExcessiveItemData(item);
    setExcessiveQty(qty);
    set_showExcessiveItem(true);
  }

  const handlePrintAllReceipts = async () => {
    if (!orderData) return;

    try {
      await handlePrintInvoice()
      message.success('Receipt printed successfully');
    } catch (e: any) {
      message.error(e.message || 'Print failed');
    }
  };

  const handlePrintInvoice = async () => {
    if (!invoicePreviewRef.current) return;

    const printWindow = window.open(
      '',
      '_blank',
      'width=420,height=700,scrollbars=yes'
    );

    if (!printWindow) {
      message.error('Unable to open print window');
      return;
    }

    const receiptHTML = invoicePreviewRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${orderData?.serial || ''}</title>
          <style>
            :root {
              --receipt-width: 80mm;
            }

            * {
              box-sizing: border-box;
            }

            /* Font Awesome's runtime stylesheet is not copied into this window. */
            .awsom-icon {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              line-height: 1;
              color: #000;
            }

            .awsom-icon > svg {
              display: block;
              width: 1em;
              height: 1em;
              overflow: visible;
              fill: currentColor;
            }

            html, body {
              background: #fff;
              width: var(--receipt-width);
              margin: 0;
              padding: 0;
            }

            body {
              overflow: visible;
            }

            /*
             * Let the Epson roll driver provide the page length. Giving Chrome a
             * short fixed page makes it landscape and rotates the receipt.
             */
            @page {
              margin: 0;
              size: auto;
            }

            @media print {
              html, body {
                width: var(--receipt-width) !important;
                min-width: var(--receipt-width) !important;
                height: auto !important;
                min-height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: visible !important;
              }

              body > * {
                margin-top: 0 !important;
                margin-bottom: 0 !important;
              }

              body > div > div {
                break-inside: avoid;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>${receiptHTML}</body>
      </html>
    `);

    printWindow.document.close();

    printWindow.addEventListener('load', () => {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    });

    printWindow.addEventListener('afterprint', () => {
      printWindow.close();
    }, { once: true });
  };

  // Initialize order verification on mount
  useEffect(() => {
    if (!orderBarcode) return;
    if (initializedOrderBarcodeRef.current === orderBarcode) return;

    initializeOrder(orderBarcode);
  }, [orderBarcode]);


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
  if (!orderBarcode || !activeShift) {
    let eInfo = { title: "", description: "" }
    if (!orderBarcode) Object.assign(eInfo, {
      title: "Missing order barcode", description: "Unable to find target order barcode"
    })
    if (!activeShift && !orderBarcode) Object.assign(eInfo, {
      title: "No Active Shift", description: "You must have an active shift to verify orders."
    })

    return <ErrorComp {...eInfo}
      buttons={<><Button type="primary" onClick={() => router.push(`${adminRoot}/store/${store_id}/till-verification`)}>Go to Queue</Button></>}
    />
  }

  // Loading state - show what's happening
  if (!orderData) {
    if (initializingOrderBarcode === orderBarcode || !calledStart || verificationLoading) {
      return (<div style={{ textAlign: 'center', padding: '100px 0' }}><Loader loading={true}>Initializing...</Loader></div>);
    }

    return <ErrorComp title="Failed to Load Order" description="Could not load order data. The order might not be available for verification."
      buttons={<><Button type="primary" onClick={() => router.push(`${adminRoot}/store/${store_id}/till-verification`)}>Back to Queue</Button></>}
    />
  }

  const openPrintWindow = (type: string) => {
    if (type == 'product') {
      set_showPrintPreview('product')
    }
    if (type == 'order') {
      set_showPrintPreview('order')
    }
  }


  const {
    orderItems,
    unscannedItems,
    scannedItems,
    missingItems,
  } = orderCalculations;
  // const customer = orderData?.customer;
  // const picker = orderData?.processing_stages?.picking?.handled_by;

  let displayItems = (activeTab === 'unscanned') ? unscannedItems : orderItems;
  if (activeTab === 'scanned') displayItems = scannedItems;
  if (activeTab === 'unavailable') displayItems = missingItems;

  return (<>
    <BarcodeScanner onScan={handleVerificationScan} debugLabel="TillVerificationScanner" />

    <div className="flex h-[calc(100vh-50px)] w-full overflow-hidden">

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
            orderData={orderData}
            currentBaskets={orderData?.current_order?.baskets || []}
            showBags={() => set_showBags(true)}
            showBaskets={() => set_showBaskets(true)}
            showPrint={() => openPrintWindow('order')}            
            onReadyToDispatch={handleCompleteWithReceipt}
            loading={completingOrder}
          />
        ) : <ContentArea orderData={orderData} orderItems={displayItems} />}


        {/* <UsbTest /> */}

        <PageFooter orderData={orderData} />
      </div>

      <RightColumn 
        orderData={orderData} 
        orderCalculations={orderCalculations}
        orderId={orderData._id} 
        productScanRequest={productScanRequest} 
        onShowExcessiveItem={handleShowExcessiveItem} 
        showBags={() => set_showBags(true)} 
        showBaskets={() => set_showBaskets(true)} 
        // showPrint={() => set_showPrint(true)}
        openPrintWindow={openPrintWindow}
        unscannedItems={unscannedItems}
      />
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

    <Modal title="Print Preview"
      open={!!showPrintPreview}
      onCancel={() => {
        set_showPrintPreview(false)
      }}
      width={420}
      footer={[
        <Button key="close" onClick={() => set_showPrintPreview(false)}>Close</Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrintAllReceipts}>Print</Button>,
      ]}
    >
      {showPrintPreview == 'product' && <ProductReceipt orderData={orderData} ref={invoicePreviewRef} />}
      {showPrintPreview == 'order' && <OrderReceipt
        orderData={orderData}
        orderCalculations={orderCalculations}
        ref={invoicePreviewRef}
      />}
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

    <DevBlock obj={orderData} title="orderData" />

  </>)

}



function TillVerificationPOS_Wrapper() {
  const router = useRouter();
  const params = useParams();
  const orderBarcode = params.orderBarcode as string
  const { store, store_id }: any = usePageProps();

  const [activity, setActivity] = useState("Loading session...")
  const [fatelError, setFatelError] = useState<string | null>(null)
  // const [ready, setReady] = useState(false)

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

  if (!orderBarcode) return (<Page><div style={{ textAlign: 'center', padding: '100px 0' }}><Card>
    <Space orientation="vertical" align="center">
      <ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />
      <Title level={4}>Order Barcode not found!</Title>
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
