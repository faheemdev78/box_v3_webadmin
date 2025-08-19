import catR1C2 from './cat_r1_c2'
import catR1C3 from './cat_r1_c3'
import catR1C3_2 from './cat_r1_c3_2'
import catR1C3_3 from './cat_r1_c3_3'
import catR1C3_4 from './cat_r1_c3_4'
import catR1C4 from './cat_r1_c4'

import { addComponent } from '../connector'


export const categoriesArray = [
    catR1C2, catR1C3, catR1C3_2, catR1C3_3, catR1C3_4, catR1C4
    // { type: "cat_r1_c2", label: "R1 / C2", desc: "R1 / C2", ...catR1C2 },
    // { type: "cat_r1_c3", label: "R1 / C3", desc: "R1 / C3", ...catR1C3 },
    // { type: "cat_r1_c3_2", label: "R1 / C3", desc: "R1 / C3 (2)", ...catR1C3_2 },
    // { type: "cat_r1_c3_3", label: "R1 / C3", desc: "R1 / C3 (3)", ...catR1C3_3 },
    // { type: "cat_r1_c3_4", label: "R1 / C3", desc: "R1 / C3 (4)", ...catR1C3_4 },
    // { type: "cat_r1_c4", label: "R1 / C4", desc: "R1 / C4", ...catR1C4 },
]

addComponent({ array: categoriesArray })

