import React from 'react';
import BarcodePackage from 'react-barcode';
import PropTypes from 'prop-types';


export const Barcode = ({ value, width, height, format, displayValue}) => {
    return <BarcodePackage 
        value={value} //{`doReadyForDispatch`}
        width={width || 2}
        height={height || 50}
        format={format || "CODE128"}
        displayValue={displayValue || false}
    />

}

Barcode.propTypes = {
    value: PropTypes.string.isRequired,
    width: PropTypes.number,
    height: PropTypes.number,
    format: PropTypes.string,
    displayValue: PropTypes.bool
}
