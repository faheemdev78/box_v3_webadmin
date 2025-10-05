import React from 'react';
import BarcodePackage from 'react-barcode';


export const Barcode = ({ value, width, height, format, displayValue, background = '#FFFFFF', lineColor='#000000' }:{
    value: string,
    width?: number, 
    height?: number, 
    format?: string, 
    displayValue?: string | number,
    background?: string,
    lineColor?: string
}) => {
    return <BarcodePackage 
        value={value} //{`doReadyForDispatch`}
        width={width || 2}
        height={height || 50}
        format={format || "CODE128"}
        displayValue={displayValue || false}
        background={background}
        lineColor={lineColor}        
    />

}
