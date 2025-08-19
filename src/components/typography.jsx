'use client'

// import { EditFilled } from '@ant-design/icons';
import { BackButton, IconButton } from './button';
import { Col, Row } from 'antd';
import { useRouter } from "next/navigation";

export const PageHeading = ({ children, sub, style, onEdit, className, onBackClick, backLink, backButton, alowBack, rightColumn }) => {
    let router = useRouter()

    let backBtn = null;
    if (alowBack){
        if (onBackClick) backBtn  = <Col><BackButton type="dashed" onClick={onBackClick} /></Col>
        else if (backLink) backBtn = <Col><BackButton type="dashed" href={backLink} /></Col>
        else if (backButton) backBtn = <Col><BackButton type="dashed">{backButton}</BackButton></Col>
        else backBtn = <Col><BackButton type="dashed" onClick={() => router.back()} /></Col>
    }

    return (<div style={{ marginBottom: "20px", lineHeight: 1.3, ...style }}>
        <Row gutter={[5]} align="middle">
            {backBtn}
            {/* {(alowBack && onBackClick) && <Col><BackButton type="dashed" onClick={onBackClick} /></Col>}    
            {(alowBack && backLink) && <Col><BackButton type="dashed" href={backLink} /></Col>}    
            {(alowBack && backButton) && <Col><BackButton type="dashed">{backButton}</BackButton></Col>}     */}
            <Col flex="auto">
                {/* <span className={className || "heading1"} style={{ position: "relative" }}>{children} {onEdit && <span onClick={onEdit} className="edit_float_button" style={{ right: "-30px" }}><EditFilled /></span>}</span> */}
                <span className={className || "heading1"} style={{ position: "relative" }}>{children} 
                    {onEdit && <IconButton onClick={onEdit} icon='edit' shape='circle' size="small" />}
                    {/* {onEdit && <span onClick={onEdit} style={{ right: "-30px" }}><EditFilled /></span>} */}
                </span>
                {sub && <div>{sub}</div>}
            </Col>
            {rightColumn && <Col>{rightColumn}</Col>}
        </Row>
    </div>)
}

export const ListHeader = ({ title, sub, right }) => {
    return (<>
        <Row>
            <Col flex="auto">
                <h5>
                    <div>{title}<div style={{ fontSize: "12px", color: "#000" }}>{sub}</div></div>
                </h5>
            </Col>
            {right && <Col>{right}</Col>}
        </Row>
    </>)
}







