// lib/thermalPrinter/escpos.ts
const ESC = 0x1B;
const GS = 0x1D;
// const LF = 0x0A;
// const HT = 0x09;

export const CMD = {
    // Initialization
    INIT: new Uint8Array([ESC, 0x40]),

    // Alignment
    ALIGN_LEFT: new Uint8Array([ESC, 0x61, 0x00]),
    ALIGN_CENTER: new Uint8Array([ESC, 0x61, 0x01]),
    ALIGN_RIGHT: new Uint8Array([ESC, 0x61, 0x02]),

    // Text style
    BOLD_ON: new Uint8Array([ESC, 0x45, 0x01]),
    BOLD_OFF: new Uint8Array([ESC, 0x45, 0x00]),
    UNDERLINE_ON: new Uint8Array([ESC, 0x2D, 0x01]),
    UNDERLINE_OFF: new Uint8Array([ESC, 0x2D, 0x00]),

    // Font size (GS ! n) - bits 0-2 height, 4-7 width
    SIZE_NORMAL: new Uint8Array([GS, 0x21, 0x00]),      // 1x1
    SIZE_2H: new Uint8Array([GS, 0x21, 0x01]),          // 1x2 (tall)
    SIZE_2W: new Uint8Array([GS, 0x21, 0x10]),          // 2x1 (wide)
    SIZE_2X: new Uint8Array([GS, 0x21, 0x11]),          // 2x2

    // Line feed
    feed: (n: number) => new Uint8Array([ESC, 0x64, n]),

    // Cut
    CUT_FULL: new Uint8Array([GS, 0x56, 0x00]),
    CUT_PARTIAL: new Uint8Array([GS, 0x56, 0x01]),

    // Cash drawer kick
    OPEN_DRAWER: new Uint8Array([ESC, 0x70, 0x00, 0x19, 0xFA]),
};

// Common thermal printer vendor IDs
export const PRINTER_VENDORS = [
    { vendorId: 0x04b8, name: 'Epson' },
    { vendorId: 0x0519, name: 'Star Micronics' },
    { vendorId: 0x0fe6, name: 'ICS Advent' },
    { vendorId: 0x1504, name: 'Bixolon' },
    { vendorId: 0x0416, name: 'Winbond' },
    { vendorId: 0x0dd4, name: 'Generic' },
    { vendorId: 0x0b1b, name: 'Sewoo' },
    { vendorId: 0x0e8d, name: 'MediaTek' },
    { vendorId: 0x0416, name: 'Zjiang' },
    { vendorId: 0x1a86, name: 'QinHeng' },
    { vendorId: 0x0525, name: 'Netchip' },
];

// Convert string to ESC/POS bytes
export const textToBytes = (text: string): Uint8Array => {
    return new TextEncoder().encode(text);
};

// Build a horizontal line
export const line = (char: string = '-', width: number = 32): string => {
    return char.repeat(width);
};

// Format price line: "Item name     $10.00"
export const priceLine = (left: string, right: string, width: number = 32): string => {
    const gap = Math.max(1, width - left.length - right.length);
    return left + ' '.repeat(gap) + right;
};
