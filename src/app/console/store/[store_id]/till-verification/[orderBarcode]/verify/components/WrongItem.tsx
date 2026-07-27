import { Button } from "@/components"
import { Col, Row, Space } from "antd"

export const WrongItem = () => {
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
