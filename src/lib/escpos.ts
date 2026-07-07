// lib/escpos.ts
export const ESC = 0x1b;
export const GS = 0x1d;
export const FS = 0x1c;
export const DLE = 0x10;
export const EOT = 0x04;
export const LF = 0x0a;
export const HT = 0x09;

const concat = (...chunks: (string | number[])[]) => {
    const out: number[] = [];
    for (const c of chunks) {
        if (typeof c === "string") {
            for (let i = 0; i < c.length; i++) out.push(c.charCodeAt(i) & 0xff);
        } else {
            out.push(...c);
        }
    }
    return new Uint8Array(out);
};

export const escpos = {
    init: () => concat(ESC, "@"),
    cut: () => concat(GS, "V", 0x41, 0x10), // full cut (TM-m30II supports it)
    feed: (n = 1) => concat(LF.repeat(n)),
    align: (a: "left" | "center" | "right" = "left") =>
        concat(ESC, "a", a === "left" ? 0 : a === "center" ? 1 : 2),
    bold: (on = true) => concat(ESC, "E", on ? 0x01 : 0x00),
    doubleSize: (on = true) => concat(GS, "!", on ? 0x11 : 0x00),
    underline: (on = true) => concat(ESC, "-", on ? 0x01 : 0x00),
    invert: (on = true) => concat(GS, "B", on ? 0x01 : 0x00),
    text: (s: string) => concat(s),
};
