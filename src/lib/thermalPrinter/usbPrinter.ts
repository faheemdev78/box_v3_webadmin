// lib/thermalPrinter/usbPrinter.ts
import { CMD, textToBytes, PRINTER_VENDORS, line, priceLine } from './escpos';
import type { ReceiptSize, PrinterStatus, PrinterDevice } from './types';

export class UsbThermalPrinter {
    private device: USBDevice | null = null;
    private endpointOut: number | null = null;
    private status: PrinterStatus = 'disconnected';
    private statusListeners: Set<(s: PrinterStatus) => void> = new Set();

    // For 3 receipt sizes, configure chars per line
    // 58mm printer = 32 chars, 80mm printer = 42 chars
    private readonly CHARS_PER_LINE = {
        small: 32,   // 58mm paper
        medium: 42,  // 80mm paper
        large: 42,   // 80mm paper with bigger font
    };

    onStatusChange(listener: (s: PrinterStatus) => void) {
        this.statusListeners.add(listener);
        return () => this.statusListeners.delete(listener);
    }

    private setStatus(status: PrinterStatus) {
        this.status = status;
        this.statusListeners.forEach((l) => l(status));
    }

    getStatus(): PrinterStatus {
        return this.status;
    }

    // Check if Web USB is supported
    static isSupported(): boolean {
        return typeof navigator !== 'undefined' && 'usb' in navigator;
    }

    // List previously authorized devices
    async listDevices(): Promise<USBDevice[]> {
        if (!UsbThermalPrinter.isSupported()) return [];
        return await navigator.usb.getDevices();
    }

    // Connect to a specific device or prompt user to select
    async connect(device?: USBDevice): Promise<boolean> {
        try {
            this.setStatus('connecting');

            // If no device passed, prompt user
            if (!device) {
                device = await navigator.usb.requestDevice({
                    filters: PRINTER_VENDORS.map((v) => ({ vendorId: v.vendorId })),
                });
            }

            this.device = device;
            await this.device.open();

            if (this.device.configuration === null) {
                await this.device.selectConfiguration(1);
            }

            // Find bulk OUT endpoint
            const interfaces = this.device.configuration?.interfaces || [];
            let endpointFound = false;

            for (const iface of interfaces) {
                const alternate = iface.alternate;
                for (const ep of alternate.endpoints) {
                    if (ep.direction === 'out' && ep.type === 'bulk') {
                        this.endpointOut = ep.endpointNumber;
                        endpointFound = true;
                        break;
                    }
                }
                if (endpointFound) break;
            }

            if (!endpointFound || this.endpointOut === null) {
                throw new Error('No bulk OUT endpoint found. Printer may not be compatible.');
            }

            try {
                await this.device.claimInterface(0);
            } catch (e) {
                // Interface may already be claimed
                console.warn('Interface claim warning:', e);
            }

            this.setStatus('connected');
            return true;
        } catch (e: any) {
            console.error('Connect failed:', e);
            this.setStatus('error');
            throw e;
        }
    }

    async disconnect() {
        if (this.device) {
            try {
                await this.device.close();
            } catch (e) {
                console.warn('Disconnect warning:', e);
            }
            this.device = null;
            this.endpointOut = null;
            this.setStatus('disconnected');
        }
    }

    private async send(data: Uint8Array): Promise<void> {
        if (!this.device || this.endpointOut === null) {
            throw new Error('Printer not connected');
        }
        const result = await this.device.transferOut(this.endpointOut, data);
        if (result.status !== 'ok') {
            throw new Error(`Print failed with status: ${result.status}`);
        }
    }

    private async text(text: string): Promise<void> {
        await this.send(textToBytes(text + '\n'));
    }

    private async cmd(command: Uint8Array): Promise<void> {
        await this.send(command);
    }

    // Set font size for the receipt
    private async setSize(size: ReceiptSize): Promise<void> {
        switch (size) {
            case 'small':
                await this.cmd(CMD.SIZE_NORMAL);
                break;
            case 'medium':
                await this.cmd(CMD.SIZE_2H); // 1x2 (tall, easier to read)
                break;
            case 'large':
                await this.cmd(CMD.SIZE_2X); // 2x2 (biggest)
                break;
        }
    }

    // Print a till receipt (small - 58mm)
    async printTillReceipt(orderData: any): Promise<void> {
        const width = this.CHARS_PER_LINE.small;
        await this.setSize('small');
        await this.cmd(CMD.INIT);

        // Header
        await this.cmd(CMD.ALIGN_CENTER);
        await this.cmd(CMD.BOLD_ON);
        await this.text('TILL RECEIPT');
        await this.cmd(CMD.BOLD_OFF);
        await this.text(line('-', width));
        await this.cmd(CMD.ALIGN_LEFT);

        // Order info
        await this.text(`Order: ${orderData.serial}`);
        await this.text(`Date: ${new Date().toLocaleString()}`);
        await this.text(`Slot: ${this.formatSlot(orderData)}`);
        await this.text(line('-', width));

        // Scanned items only
        const items = (orderData?.current_order?.items || []).filter(
            (i: any) => (i.processed_qty ?? 0) > 0
        );

        for (const item of items) {
            const qty = item.processed_qty ?? 0;
            const lineTotal = (qty * (item.price ?? 0)).toFixed(2);
            await this.text(item.title);
            await this.text(`  ${qty} x ${item.price?.toFixed(2)} = ${lineTotal}`);
        }

        await this.text(line('-', width));

        // Total
        const total = items.reduce(
            (s: number, i: any) => s + (i.processed_qty ?? 0) * (i.price ?? 0),
            0
        );
        await this.cmd(CMD.BOLD_ON);
        await this.text(priceLine('TOTAL', total.toFixed(2), width));
        await this.cmd(CMD.BOLD_OFF);

        await this.cmd(CMD.feed(3));
        await this.cmd(CMD.CUT_FULL);
    }

    // Print an order summary (medium - 80mm)
    async printOrderReceipt(orderData: any): Promise<void> {
        const width = this.CHARS_PER_LINE.medium;
        await this.setSize('medium');
        await this.cmd(CMD.INIT);

        // Header
        await this.cmd(CMD.ALIGN_CENTER);
        await this.cmd(CMD.BOLD_ON);
        await this.text('ORDER SUMMARY');
        await this.cmd(CMD.BOLD_OFF);
        await this.text(line('=', width));
        await this.cmd(CMD.ALIGN_LEFT);

        // Order details
        await this.text(priceLine('Order:', orderData.serial, width));
        await this.text(priceLine('Customer:', orderData.customer?.name || 'N/A', width));
        await this.text(priceLine('Phone:', orderData.customer?.phone || 'N/A', width));
        await this.text(priceLine('Slot:', this.formatSlot(orderData), width));
        await this.text(line('-', width));

        // All items
        await this.cmd(CMD.BOLD_ON);
        await this.text('ITEMS');
        await this.cmd(CMD.BOLD_OFF);

        const items = orderData?.current_order?.items || [];
        for (const item of items) {
            const qty = item.qty ?? 0;
            const processed = item.processed_qty ?? 0;
            const status = processed === qty ? 'OK' : processed === 0 ? 'OUT' : 'PART';
            const lineTotal = (processed * (item.price ?? 0)).toFixed(2);

            await this.text(item.title);
            await this.text(
                `  [${status}] ${processed}/${qty} = ${lineTotal}`
            );
        }

        await this.text(line('=', width));

        // Totals
        const subtotal = items.reduce(
            (s: number, i: any) => s + (i.processed_qty ?? 0) * (i.price ?? 0),
            0
        );
        const original = orderData?.original_order?.totals?.grandTotal ?? subtotal;

        await this.text(priceLine('Subtotal:', subtotal.toFixed(2), width));
        await this.text(priceLine('Original:', original.toFixed(2), width));
        await this.text(line('-', width));

        await this.cmd(CMD.BOLD_ON);
        await this.text(priceLine('TOTAL:', subtotal.toFixed(2), width));
        await this.cmd(CMD.BOLD_OFF);

        // Baskets & bags
        const baskets = orderData?.current_order?.baskets || [];
        if (baskets.length > 0) {
            await this.text(line('-', width));
            await this.text(`Baskets: ${baskets.length}`);
        }

        await this.cmd(CMD.feed(3));
        await this.cmd(CMD.CUT_FULL);
    }

    // Print a large detail receipt (large - 80mm, big font)
    async printBoxLabel(orderData: any, basketInfo?: any): Promise<void> {
        const width = this.CHARS_PER_LINE.large;
        await this.setSize('large');
        await this.cmd(CMD.INIT);

        // Big header
        await this.cmd(CMD.ALIGN_CENTER);
        await this.cmd(CMD.BOLD_ON);
        await this.text('BOX LABEL');
        await this.cmd(CMD.BOLD_OFF);
        await this.text(line('*', width));
        await this.cmd(CMD.ALIGN_LEFT);

        // Big order number
        await this.cmd(CMD.BOLD_ON);
        await this.text(priceLine('Order:', orderData.serial, width));
        await this.cmd(CMD.BOLD_OFF);
        await this.text(priceLine('Customer:', orderData.customer?.name || 'N/A', width));
        await this.text(priceLine('Zone:', orderData.zone?.title || 'N/A', width));
        await this.text(priceLine('Slot:', this.formatSlot(orderData), width));

        if (basketInfo) {
            await this.text(line('*', width));
            await this.text(priceLine('Basket:', basketInfo.title || '', width));
        }

        // Big item count
        await this.text(line('*', width));
        const itemCount = (orderData?.current_order?.items || []).length;
        await this.cmd(CMD.BOLD_ON);
        await this.text(`Items: ${itemCount}`);
        await this.cmd(CMD.BOLD_OFF);

        await this.cmd(CMD.feed(4));
        await this.cmd(CMD.CUT_FULL);
    }

    // Open cash drawer (bonus)
    async openCashDrawer(): Promise<void> {
        await this.cmd(CMD.OPEN_DRAWER);
    }

    private formatSlot(orderData: any): string {
        try {
            const start = new Date(orderData.delivery_slot?.start_date);
            const end = new Date(orderData.delivery_slot?.end_date);
            return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } catch {
            return 'N/A';
        }
    }
}

