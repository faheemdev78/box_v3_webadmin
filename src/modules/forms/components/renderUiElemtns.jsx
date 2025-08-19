import React, { useState } from 'react'
import { Alert, Col, Divider, Row } from 'antd';


export const RenderUiElemtns = ({ data, fieldValues, style }) => {
    let child = <Alert message="Invalid Field!" type='warning' showIcon />

    let fieldStyle = { minWidth: "50px", minHeight: "30px", backgroundColor: "#EEE", ...style }
    if (fieldValues && fieldValues.style) Object.assign(fieldStyle, { ...fieldValues.style })
    if (fieldValues && fieldValues?.attributes?.width) Object.assign(fieldStyle, { width: `${fieldValues.attributes.width}px` })

    if (data.type == 'simple-text') child = <p style={fieldStyle}>{data.defaultValue}</p>
    if (data.type == 'heading1') child = <h1 style={fieldStyle}>{data.defaultValue}</h1>
    if (data.type == 'heading2') child = <h2 style={fieldStyle}>{data.defaultValue}</h2>
    if (data.type == 'heading3') child = <h3 style={fieldStyle}>{data.defaultValue}</h3>
    if (data.type == 'divider') child = <Divider>{data.defaultValue}</Divider>
    if (data.type == 'hr') child = <hr style={fieldValues && fieldValues.style || {}} />

    return (<div style={fieldStyle}>{child}</div>)

}
