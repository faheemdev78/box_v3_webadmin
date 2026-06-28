// lib/thermalPrinter/types.ts
export type ReceiptSize = 'small' | 'medium' | 'large';

export type PrinterStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface PrinterDevice {
    vendorId: number;
    productId: number;
    productName?: string;
    manufacturerName?: string;
}

