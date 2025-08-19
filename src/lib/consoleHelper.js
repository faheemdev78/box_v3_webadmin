// export const config = {
//     runtime: 'nodejs',
// };

import _c from 'ansi-colors';
import _ from 'lodash';
/*
Colors: black, red, green, yellow, blue, magenta, cyan, white, gray, grey
Background Colors: bgBlack, bgRed, bgGreen, bgYellow, bgBlue, bgMagenta, bgCyan, bgWhite
Bright Colors: blackBright, redBright, greenBright, yellowBright, blueBright, magentaBright, cyanBright, whiteBright
Bright Background Colors: bgBlackBright, bgRedBright, bgGreenBright, bgYellowBright, bgBlueBright, bgMagentaBright, bgCyanBright, bgWhiteBright
Style modifiers: dim, bold, hidden, italic, underline, inverse, strikethrough, reset
*/
//⚠️/⛔️/➕/➖/❗️/❓/✔️/✖️/⏩/▶️/❌/✏️/💾/💼/📦/🗄/🚀/📬/🔄/🔁/✔/√/⚠/ℹ/✖/×/

export const SetColor  = (_color, str) => (   _c[_color](str)   );
export const SetBackground  = (_color, str) => (   _c[`bg${_.capitalize(_color)}`](str)   );

export const __error    = (str) => (   _c.bold.bgYellowBright.red(`❌ ${str}`)   );
export const __success  = (str) => (   _c.bold.green(`✔ ${str}`)   );
export const __hilight  = (str) => (   _c.blue(str)   );
export const __warning  = (str) => (   _c.bold.bgMagenta.yellow(`⚠️ ${str}`)   );
export const __info     = (str) => (   _c.bgYellow.black(`ℹ ${str}`)   );

export const __red    = (str) => ( _c.red(str) );
export const __yellow = (str) => ( _c.yellow(str) );
export const __green  = (str) => ( _c.green(str) );
export const __blue   = (str) => ( _c.blue(str) );

export const __dim   = (str) => ( _c.dim(str) );
export const __bold   = (str) => ( _c.bold(str) );
export const __hidden   = (str) => ( _c.hidden(str) );
export const __italic   = (str) => ( _c.italic(str) );
export const __underline   = (str) => ( _c.underline(str) );
export const __inverse   = (str) => ( _c.inverse(str) );
export const __strikethrough   = (str) => ( _c.strikethrough(str) );
export const __reset   = (str) => ( _c.reset(str) );
