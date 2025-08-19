import h1 from './h1'
import h2 from './h2'
import h3 from './h3'
import text from './text'
import { addComponent } from '../connector'


export const textArray = [
    h1, h2, h3, text
    // { type: "h1", label: "Heading 1", desc:"Heading one", ...h1 },
    // { type: "h2", label: "Heading 2", desc: "Heading two", ...h2 },
    // { type: "h3", label: "Heading 3", desc: "Heading three", ...h3 },
    // { type: "text", label: "Text", desc: "Simple text", ...text },
]

addComponent({ array: textArray })

