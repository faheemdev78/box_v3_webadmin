import { Col, Row, Space, Tag } from "antd";
import { utcToDate } from '@/lib/utill';

export const PageFooter = ({ orderData }: { orderData: any }) => {
    {/* C3: 100px height */ }
    return (<div className="h-[62px] border-t border-gray-300 flex bg-white">
        <Row className='w-full p-10 nowrap' align="middle" gutter={[10, 10]}>
            <Col flex='330px' className='border-r border-gray-300'>
                <div>Area: <b>{orderData.zone.title}</b></div>
                <div>Time slot: <b>{utcToDate(orderData.delivery_slot.start_date).format("ddd Do MMM YYYY - HH:mm")} - {utcToDate(orderData.delivery_slot.end_date).format("HH:mm")} </b></div>
            </Col>
            <Col flex='auto' className='border-r border-gray-300'>
                <Space>
                    <div className='font-bold'>Picker Basket</div>
                    <div style={{ border: "0px solid blue", maxHeight: '50px', overflow: 'auto' }}>
                        <Space wrap className='w-full'>
                            {orderData?.processing_stages?.picking?.baskets?.map((basket: any, index: number) => (<Tag style={{ fontSize: "20px" }} color="gray" key={index}>{basket.title}</Tag>))}
                            {/* {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((item => (<Tag style={{ fontSize: "20px" }} color="gray" key={item}>Basket {item}</Tag>)))} */}
                        </Space>
                    </div>
                </Space>
            </Col>
            <Col flex='200px' className='text-right'>
                <div>{orderData?.processing_stages?.picking?.handled_by.name} <span className='text-gray-400'>(picker)</span></div>
                <div><span className='text-gray text-gray-400'>{utcToDate(orderData.processing_stages.updated_at).format("ddd Do MMM YYYY - HH:mm")}</span></div>
            </Col>
        </Row>
    </div>)
}
