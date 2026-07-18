import React from 'react';
import Barcode from 'react-barcode';
import { utcToDate } from '@/lib/utill';
import { Styles } from '@/types/styles';
import { useAppSelector } from '@/rStore/hooks';
import { getSettings } from '@/rStore/slices/systemSlice';
import { svgIcons } from '@/configs';
import { Icon } from '@/components';

const receiptIcons = svgIcons;

const ReceiptIcon = ({
    src,
    alt,
    size,
}: {
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

type ReceiptCalculations = {
    scannedItemTotal: number;
    bagPrice: number;
    totalBagQuantity: number;
    fbrFee: number;
    deliveryFee: number;
    customerPayable: number;
};

const asAmount = (value: unknown) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
};

const OrderReceipt = React.forwardRef<HTMLDivElement, {
    orderData: any;
    orderCalculations?: ReceiptCalculations;
}>(
    ({ orderData, orderCalculations }, ref) => {
        const settings = useAppSelector(getSettings);
        const { current_order, zone, shippingAddress, customer, delivery_slot, barcode } = orderData;

        const items = current_order?.items || [];
        const frozenItems = items.filter((item: any) => item.temp_sensitivity === 'freezer').length;
        const coldItems = items.filter((item: any) => item.temp_sensitivity === 'fridge').length;
        const unfitForBoxItems = items.filter((item: any) => item.unfit_for_dispatch).length;
        const currentTotals = current_order?.totals || {};
        const scannedItemTotal = asAmount(orderCalculations?.scannedItemTotal ?? currentTotals.subtotal);
        const bagPrice = asAmount(orderCalculations?.bagPrice ?? currentTotals.bagTotal);
        const totalBagQuantity = orderCalculations?.totalBagQuantity ?? (current_order?.bags || []).reduce(
            (sum: number, bag: any) => sum + Math.max(0, Math.trunc(asAmount(bag.qty))),
            0
        );
        const fbrFee = asAmount(orderCalculations?.fbrFee ?? currentTotals.fbrFee);
        const deliveryFee = asAmount(orderCalculations?.deliveryFee ?? currentTotals.deliveryFee);
        const customerPayable = asAmount(orderCalculations?.customerPayable ?? currentTotals.grandTotal);
        const deliverySlot = `${utcToDate(delivery_slot.start_date).format('hh:mm A')} – ${utcToDate(delivery_slot.end_date).format('hh:mm A')}`;
        const totalBoxes = current_order?.baskets?.length || 0;
        const receiptCount = Math.max(totalBoxes, 1);
        const boxCodes = current_order?.baskets?.map((item: any) => item.title).filter(Boolean) || [];
        const barcodeModuleWidth = Math.max(0.55, Math.min(0.86, 15 / Math.max(String(barcode || '').length, 1)));
        const currency = String(settings.currency || 'RS').toUpperCase();

        const DetailRow = ({ iconSrc, iconAlt, label, value }: {
            iconSrc: string;
            iconAlt: string;
            label: string;
            value: React.ReactNode;
        }) => (
            <div style={styles.detailRow}>
                <span style={styles.detailIcon}>
                    <ReceiptIcon src={iconSrc} alt={iconAlt} size={20} />
                </span>
                <span style={styles.detailLabel}>{label}</span>
                <span style={styles.detailColon}>:</span>
                <span style={styles.detailValue}>{value}</span>
            </div>
        );

        return (
            <div className='scrollbar-thin overflow-auto h-full max-h-100'>
                <div ref={ref}>
                    {Array.from({ length: receiptCount }).map((_, pageIndex) => (
                        <div style={styles.receipt} key={pageIndex}>
                            <div style={styles.dashedDivider} />

                            <div style={styles.topRow}>
                                <div style={styles.zoneBlock} title={zone?.title || 'Zone'}>
                                    <span style={styles.zoneIcon}>
                                        <ReceiptIcon src={receiptIcons.location} alt='Location' size={28} />
                                    </span>
                                    <span style={styles.zoneName}>{zone?.title || 'Zone'}</span>
                                </div>

                                {/* <div style={styles.thankYouBlock}>
                                    <div style={styles.thankYou}>
                                        Thank you!
                                        <ReceiptIcon src={receiptIcons.heart} alt='Heart' size={13} />
                                    </div>
                                    <div style={styles.thankYouCaption}>We appreciate your trust.</div>
                                </div> */}

                                <div style={styles.pageInfo}>{pageIndex + 1} of {receiptCount}</div>
                            </div>

                            <div style={styles.dashedDivider} />

                            <div style={styles.detailsSection}>
                                <DetailRow iconSrc={receiptIcons.home} iconAlt='Home' label='ADDRESS' value={shippingAddress?.full_address + " " + shippingAddress?.full_address || '—'} />
                                <DetailRow iconSrc={receiptIcons.user} iconAlt='User' label='CUSTOMER' value={customer?.name || '—'} />
                                <DetailRow iconSrc={receiptIcons.phone} iconAlt='Phone' label='PHONE' value={customer?.phone || '—'} />
                                <DetailRow iconSrc={receiptIcons.clock} iconAlt='Clock' label='DELIVERY SLOT' value={deliverySlot} />
                            </div>

                            <div style={styles.solidDivider} />

                            <div style={styles.summaryHeading}>
                                <span style={styles.summaryIcon}>
                                    <ReceiptIcon src={receiptIcons.cart} alt='Shopping cart' size={21} />
                                </span>
                                <span>ORDER SUMMARY</span>
                            </div>

                            <div style={styles.totalsSection}>
                                <div style={styles.totalLine}>
                                    <span>Confirmed Items</span>
                                    <span>{currency} {scannedItemTotal.toFixed(2)}</span>
                                </div>
                                <div style={styles.totalLine}>
                                    <span>FBR Fee</span>
                                    <span>{currency} {fbrFee.toFixed(2)}</span>
                                </div>
                                <div style={styles.totalLine}>
                                    <span>Bags ({totalBagQuantity})</span>
                                    <span>{currency} {bagPrice.toFixed(2)}</span>
                                </div>
                                <div style={styles.totalLine}>
                                    <span>Delivery Fee</span>
                                    <span>{currency} {deliveryFee.toFixed(2)}</span>
                                </div>
                            </div>

                            <div style={styles.payableRow}>
                                <span>CUSTOMER PAYABLE</span>
                                <span>{currency} {customerPayable.toFixed(2)}</span>
                            </div>

                            <div style={styles.barcodeColumn}>
                                {/* <div style={styles.scanLabel}>SCAN TO RECEIVE ORDER</div> */}
                                <div style={styles.barcodeBox}>
                                    <Barcode
                                        value={String(barcode || '')}
                                        format='CODE128'
                                        // width={barcodeModuleWidth}
                                        width={1.7}
                                        height={45}
                                        fontSize={11}
                                        margin={0}
                                        displayValue
                                    />
                                </div>
                            </div>
                            <div style={styles.scanAndConditions}>
                                {/* {[1, 2, 3, 4, 5, 6, 7].map((item, i) => (<div style={styles.conditionItem} key={i}>
                                    <span style={styles.conditionCircle}>
                                        <ReceiptIcon src={receiptIcons.snow} alt='Snowflake' size={35} />
                                    </span>
                                    <span style={styles.conditionTitle}>{frozenItems} FROZEN {i}</span>
                                    <span style={styles.conditionCaption}>Keep Frozen</span>
                                </div>))} */}
                                
                                {/* <div style={styles.verticalDashedDivider} /> */}

                                {/* <div style={styles.conditionsColumn}> */}
                                    {frozenItems > 0 && (
                                        <div style={styles.conditionItem}>
                                            <span style={styles.conditionCircle}>
                                                <ReceiptIcon src={receiptIcons.snow} alt='Snowflake' size={35} />
                                            </span>
                                            <span style={styles.conditionTitle}>{frozenItems} FROZEN</span>
                                            <span style={styles.conditionCaption}>Keep Frozen</span>
                                        </div>
                                    )}
                                    {coldItems > 0 && (
                                        <div style={styles.conditionItem}>
                                            <span style={styles.conditionCircle}>
                                                <ReceiptIcon src={receiptIcons.chilled} alt='Chilled' size={25} />
                                            </span>
                                            <span style={styles.conditionTitle}>{coldItems} CHILLED</span>
                                            <span style={styles.conditionCaption}>Keep Chilled</span>
                                        </div>
                                    )}
                                    {unfitForBoxItems > 0 && (
                                        <div style={styles.conditionItem}>
                                            <span style={styles.conditionCircle}>
                                                <ReceiptIcon src={receiptIcons.box} alt='NOT FIT BOX' size={35} />
                                                <span style={styles.notFitSlash} aria-hidden='true' />
                                            </span>
                                            <span style={styles.conditionTitle}>{unfitForBoxItems} NOT FIT BOX</span>
                                            <span style={styles.conditionCaption}>May not fit in box</span>
                                        </div>
                                    )}
                                {/* </div> */}
                            </div>

                            <div style={styles.boxesRow}>
                                <span style={styles.boxesIcon}>
                                    <ReceiptIcon src={receiptIcons.box} alt='Box' size={30} />
                                </span>
                                <span style={styles.boxesLabel}>BOXES: {totalBoxes}</span>
                                <span style={styles.boxesDivider} />
                                <span style={styles.boxCodes}>
                                    {boxCodes.length > 0 ? boxCodes.join(', ') : '—'}
                                </span>
                            </div>

                            <div style={styles.solidDivider} />
                            {/* {receiptCount - 1 > pageIndex && <div style={styles.cutDivider}>cut here</div>} */}
                            {receiptCount - 1 > pageIndex && <div style={styles.cutDivider}>
                                <div style={styles.cutDividerText}>cut here <Icon icon="cut" /></div>
                                <div style={styles.curDividerLine} />
                                </div>}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
);
OrderReceipt.displayName = 'OrderReceipt';

const styles: Styles = {
    receipt: {
        width: '72mm',
        minHeight: '50mm',
        padding: '1.5mm 2mm 1mm',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '12px',
        lineHeight: 1.25,
        background: '#fff',
        color: '#000',
        boxSizing: 'border-box',
        margin: '0 auto',
        overflow: 'hidden',
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
    },
    topRow: {
        display: 'grid',
        // gridTemplateColumns: 'minmax(0, 1.35fr) minmax(24mm, 0.9fr) auto',
        gridTemplateColumns: 'minmax(0, 1.35fr) auto',
        alignItems: 'center',
        gap: '1.5mm',
        minHeight: '13mm',
        padding: '1mm 0',
    },
    zoneBlock: {
        // border: '1px solid black',
        display: 'flex',
        alignItems: 'center',
        minWidth: 0,
        overflow: 'hidden',
        gap: '0mm',
    },
    zoneIcon: {
        display: 'inline-flex',
        flex: '0 0 auto',
        lineHeight: 1,
    },
    zoneName: {
        // border: '1px solid black',
        display: 'block',
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontSize: '22px',
        fontWeight: 900,
        lineHeight: 1,
        textTransform: 'uppercase',
    },
    thankYouBlock: { minWidth: 0, textAlign: 'left' },
    thankYou: {
        display: 'flex',
        alignItems: 'center',
        gap: '1mm',
        whiteSpace: 'nowrap',
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: '15px',
        fontStyle: 'italic',
        lineHeight: 1.1,
    },
    thankYouCaption: { marginTop: '1mm', whiteSpace: 'nowrap', fontSize: '7.5px' },
    pageInfo: { whiteSpace: 'nowrap', fontSize: '16px', fontWeight:'bold', textAlign: 'right' },
    dashedDivider: { borderTop: '1px dashed #000', margin: '0.5mm 0' },
    solidDivider: { borderTop: '1px solid #000', margin: '1.5mm 0' },
    cutDivider: { 
        // borderTop: '1px dashed #000', margin: '5mm 0',
        // border: '1px solid green',
        marginTop: '15px',
        display: 'flex',
        width: '100%',
        flexDirection: 'row'
    },
    cutDividerText: {
        flexShrink: 0,
        width: '70px',
        textAlign: 'left',
        backgroundColor:'#FFF'
    },
    curDividerLine:{
        flex: 1,
        marginTop: '7px',
        borderBottom: '1px dashed black',
        maxHeight: '1px',
        overflow:'hidden',
    },
    detailsSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5mm',
        padding: '2mm 0 1mm',
    },
    detailRow: {
        display: 'grid',
        gridTemplateColumns: '8mm 24mm 3mm minmax(0, 1fr)',
        alignItems: 'center',
        minWidth: 0,
    },
    detailIcon: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
    detailLabel: { fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap' },
    detailColon: { fontSize: '12px', fontWeight: 800, textAlign: 'center' },
    detailValue: { minWidth: 0, fontSize: '12px', overflowWrap: 'anywhere' },
    summaryHeading: {
        display: 'flex',
        alignItems: 'center',
        gap: '0mm',
        padding: '1mm 0 0.5mm',
        fontSize: '13px',
        fontWeight: 800,
    },
    summaryIcon: { display: 'inline-flex', width: '8mm', justifyContent: 'center' },
    totalsSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3mm',
        padding: '1mm 0 1.5mm 8mm',
    },
    totalLine: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '3mm',
        fontSize: '11.5px',
    },
    payableRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: '3mm',
        borderTop: '1px dashed #000',
        borderBottom: '1px solid #000',
        padding: '1.5mm 1mm',
        fontSize: '13px',
        fontWeight: 900,
    },
    scanAndConditions: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        rowGap: '2mm',
        padding: '2mm 0',
        alignItems: 'flex-start',
    },
    barcodeColumn: { minWidth: 0, textAlign: 'center', marginTop: '5px' },
    scanLabel: { marginBottom: '1mm', fontSize: '8px', fontWeight: 800, whiteSpace: 'nowrap' },
    barcodeBox: { display: 'flex', justifyContent: 'center', maxWidth: '100%', overflow: 'hidden' },
    verticalDashedDivider: { width: 0, borderLeft: '1px dashed #000' },
    conditionsColumn: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-evenly',
        flexWrap: 'wrap',
        gap: '1.5mm',
        minWidth: 0,
    },
    conditionItem: {
        display: 'flex',
        flex: '0 0 25%',
        maxWidth: '25%',
        minWidth: 0,
        boxSizing: 'border-box',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
    },
    conditionCircle: {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '12mm',
        height: '12mm',
        marginBottom: '1mm',
        border: '1.5px solid #000',
        borderRadius: '50%',
    },
    notFitSlash: {
        position: 'absolute',
        left: '50%',
        top: '50%',
        zIndex: 1,
        width: '11mm',
        height: '1.5px',
        background: '#000',
        transform: 'translate(-50%, -50%) rotate(-45deg)',
        transformOrigin: 'center',
        pointerEvents: 'none',
    },
    conditionTitle: { fontSize: '8.5px', fontWeight: 900, whiteSpace: 'nowrap' },
    conditionCaption: { fontSize: '7.5px', whiteSpace: 'nowrap' },
    boxesRow: {
        display: 'grid',
        gridTemplateColumns: '8mm auto 0 minmax(0, 1fr)',
        alignItems: 'center',
        gap: '2mm',
        minHeight: '5mm',
        padding: '1.5mm 0 0 0',
        borderTop: '1px dashed #000',
    },
    boxesIcon: { display: 'inline-flex', justifyContent: 'center' },
    boxesLabel: { fontSize: '12px', fontWeight: 900, whiteSpace: 'nowrap', marginLeft: '-2mm' },
    boxesDivider: { alignSelf: 'stretch', width: 0, borderLeft: '1px dashed #000' },
    boxCodes: {
        minWidth: 0,
        fontSize: '11px',
        lineHeight: 1.45,
        textAlign: 'center',
        overflowWrap: 'anywhere',
    },
};

export default OrderReceipt;
