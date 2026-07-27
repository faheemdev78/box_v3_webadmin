import { Button } from "@/components";
import { Col, Row, Space } from "antd";

export const ExcessiveItem = ({ item, selectedQty, onAcknowledge }: { item?: any, selectedQty?: number, onAcknowledge: () => void }) => {
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
