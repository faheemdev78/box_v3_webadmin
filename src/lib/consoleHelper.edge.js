// Edge Runtime compatible version without ansi-colors
// Plain text console helpers for Edge Runtime (middleware, edge functions)

export const __error    = (str) => `❌ ${str}`;
export const __success  = (str) => `✔ ${str}`;
export const __hilight  = (str) => str;
export const __warning  = (str) => `⚠️ ${str}`;
export const __info     = (str) => `ℹ ${str}`;

export const __red    = (str) => str;
export const __yellow = (str) => str;
export const __green  = (str) => str;
export const __blue   = (str) => str;

export const __dim              = (str) => str;
export const __bold             = (str) => str;
export const __hidden           = (str) => str;
export const __italic           = (str) => str;
export const __underline        = (str) => str;
export const __inverse          = (str) => str;
export const __reset            = (str) => str;
export const __strikethrough    = (str) => str;

export const SetColor = (_color, str) => str;
export const SetBackground = (_color, str) => str;
