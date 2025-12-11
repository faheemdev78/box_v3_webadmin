import product_list from './product_list'
import product_group from './product_group'

import { addComponent } from '../connector'


export const productsArray = [
    // { type: "prod_list_3_2", label: "Product List (3 / 2)", desc: "list 2 by 3", ...product_list },
    // { type: "prod_group_3_2", label: "Product Group (3 / 2)", desc: "group 2 by 3", ...product_group },
    product_list, product_group
]

addComponent({ array: productsArray })

