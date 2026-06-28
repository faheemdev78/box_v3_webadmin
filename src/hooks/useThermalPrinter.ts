// hooks/useThermalPrinter.ts
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { UsbThermalPrinter } from '@/lib/thermalPrinter/usbPrinter';
import type { PrinterStatus } from '@/lib/thermalPrinter/types';

export function useThermalPrinter() {
    const printerRef = useRef<UsbThermalPrinter | null>(null);
    const [status, setStatus] = useState<PrinterStatus>('disconnected');
    const [error, setError] = useState<string | null>(null);
    const [supported, setSupported] = useState(false);

    useEffect(() => {
        setSupported(UsbThermalPrinter.isSupported());
        return () => {
            printerRef.current?.disconnect();
        };
    }, []);

    const ensurePrinter = useCallback(() => {
        if (!printerRef.current) {
            printerRef.current = new UsbThermalPrinter();
            printerRef.current.onStatusChange(setStatus);
        }
        return printerRef.current;
    }, []);

    const connect = useCallback(async () => {
        setError(null);
        try {
            const printer = ensurePrinter();
            await printer.connect();
            return true;
        } catch (e: any) {
            setError(e.message || 'Failed to connect to printer');
            return false;
        }
    }, [ensurePrinter]);

    const autoConnect = useCallback(async () => {
        setError(null);
        try {
            const printer = ensurePrinter();
            const devices = await printer.listDevices();
            if (devices.length > 0) {
                await printer.connect(devices[0]);
                return true;
            }
            return false;
        } catch (e: any) {
            setError(e.message || 'Auto-connect failed');
            return false;
        }
    }, [ensurePrinter]);

    const printTillReceipt = useCallback(async (orderData: any) => {
        const printer = ensurePrinter();
        await printer.printTillReceipt(orderData);
    }, [ensurePrinter]);

    const printOrderReceipt = useCallback(async (orderData: any) => {
        const printer = ensurePrinter();
        await printer.printOrderReceipt(orderData);
    }, [ensurePrinter]);

    const printBoxLabel = useCallback(async (orderData: any, basketInfo?: any) => {
        const printer = ensurePrinter();
        await printer.printBoxLabel(orderData, basketInfo);
    }, [ensurePrinter]);

    return {
        status,
        error,
        supported,
        connect,
        autoConnect,
        printTillReceipt,
        printOrderReceipt,
        printBoxLabel,
    };
}
