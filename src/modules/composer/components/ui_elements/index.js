import HeaderUi from './headerUi'
import { addComponent } from '../connector'


export const ui_elementsArray = [
    HeaderUi
    // { type: "h1", label: "Heading 1", desc:"Heading one", ...h1 },
    // { type: "h2", label: "Heading 2", desc: "Heading two", ...h2 },
    // { type: "h3", label: "Heading 3", desc: "Heading three", ...h3 },
    // { type: "text", label: "Text", desc: "Simple text", ...text },
]

addComponent({ array: ui_elementsArray })

