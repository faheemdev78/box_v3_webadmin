"use client";

import { escpos } from "./escpos";
// import type { USBDevice } from '@types/w3c-web-usb'

const EPSON_VENDOR = 0x04b8;
const KNOWN_PRODUCTS = [0x0202, 0x0e03, 0x0e15]; // TM-m30II / TM-m10 / TM-m30

let device: USBDevice | null = null;

export async function connectEpson(): Promise<USBDevice> {
    if (typeof navigator === "undefined" || !("usb" in navigator)) {
        throw new Error("Web USB not supported in this browser");
    }

    // 1) Ask the user to pick the printer
    const dev = await navigator.usb.requestDevice({
        filters: [
            { vendorId: EPSON_VENDOR },
            // Fallback: if Windows shows it as a generic "USB Printing Support",
            // the vendor-specific class filter helps find it.
            { vendorId: EPSON_VENDOR, classCode: 0x07 },
        ],
    });

    // 2) Open the device
    await dev.open();
    if (dev.configuration === null) await dev.selectConfiguration(1);

    // 3) Claim the first interface (printer class)
    const iface = dev.configuration!.interfaces[0];
    await dev.claimInterface(iface.interfaceNumber);

    device = dev;
    return dev;
}

export async function getAuthorizedEpson(): Promise<USBDevice | null> {
    if (typeof navigator === "undefined" || !("usb" in navigator)) return null;
    const list = await navigator.usb.getDevices();
    return (
        list.find(
            (d) =>
                d.vendorId === EPSON_VENDOR &&
                KNOWN_PRODUCTS.includes(d.productId)
        ) || null
    );
}

export async function printReceipt(lines: string[]): Promise<void> {
    if (!device) throw new Error("Printer not connected. Call connectEpson() first.");

    // Find the bulk OUT endpoint
    const endpoint = device.configuration!.interfaces[0]
        .alternate.endpoints.find((e) => e.direction === "out" && e.type === "bulk");
    if (!endpoint) throw new Error("Bulk OUT endpoint not found");

    const payload: number[] = [];
    const push = (...c: any) => payload.push(...c);

    // Header
    push(escpos.init());
    push(escpos.align("center"));
    push(escpos.bold(true), escpos.doubleSize(true));
    push(escpos.text("MY STORE\n"));
    push(escpos.doubleSize(false), escpos.bold(false));
    push(escpos.text("123 Example Street\n"));
    push(escpos.text("Tel: 555-1234\n"));
    push(escpos.feed(1));
    push(escpos.align("left"));

    // Body
    for (const line of lines) {
        push(escpos.text(line + "\n"));
    }

    push(escpos.feed(3));
    push(escpos.cut());

    // Send in chunks (some printers choke on large transfers)
    const data = new Uint8Array(payload);
    const CHUNK = 16384;
    for (let i = 0; i < data.length; i += CHUNK) {
        await device.transferOut(endpoint.endpointNumber, data.slice(i, i + CHUNK));
    }
}
