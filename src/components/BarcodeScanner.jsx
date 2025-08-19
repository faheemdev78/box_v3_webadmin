import React, { Component } from 'react'
import PropTypes from 'prop-types';
import BarcodeReader from 'react-barcode-reader'
import { __error } from '@_/lib/consoleHelper';
import _ from 'lodash'

export const BarcodeScanner = ({ onScan, onError }) => {
    const handleScan = data => {
        console.log("handleScan()", data);

        if (!data || !_.isString(data)) {
            console(__error('Invalid data received: '), data);
            if (onError) onError(data);
            return;
        }

        if (onScan) onScan(data);
    }

    const handleError = err => {
        console.log(__error(err))
        // console.error(err)
    }

    return <BarcodeReader
        // onError={this.handleError}
        onError={handleScan}
        onScan={handleScan}
    />;
}

BarcodeScanner.propTypes = {
    onScan: PropTypes.func.isRequired,
    onError: PropTypes.func
}
