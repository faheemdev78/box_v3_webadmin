# Products

Body blocks. Registered from `registry.ts`.

## Product list (`prod_list_3_2`)

Config: `prod_list_3_2/config.ts`. Canvas: `Preview.tsx`. Props: `Props.tsx`. Thumbnails: `../RenderProduct.tsx`.

This form is custom. `fields` is empty because the panel is a product picker, not a list of single keys.

`values`:

| Key | Meaning |
|---|---|
| `title.text` / `title.show` | Heading above the grid |
| `theme` | Hex text color, for example `#FFFFFF`. Colors the heading, title, attributes, discount, currency, and price. Older `white`, `green`, and `black` values still resolve. |
| `num_products` | `"3"` (one row) or `"6"` (two rows), three columns |
| `products` | Selected products. The form keeps full product objects so the canvas can show titles and images |
| `all_btn.link` / `all_btn.show` | Optional "Show All" link |
| `open_as` | `popup` or `goto_screen` |

The row also has `status` (`online` / `offline`) and `schedule_start` / `schedule_end`. Offline rows render at half opacity. A schedule shows a clock icon. Those fields live on the module, not inside `values`.

`serialize` runs on save and stores the selected product, including title, picture, price, and store fields. Empty slots stay empty.

Defaults on drop: title hidden, theme `#FFFFFF`, 3 empty slots, show-all hidden, `open_as` `goto_screen`. The theme colors the list heading and each product's title, attributes, discount, and price.

## Product group (`prod_group_3_2`)

Config: `product_group/config.ts`. Placeholder only.

Palette label "Product Group (3 / 2)". The canvas shows "Empty ProductGroup" in the theme color. `values.theme` is a hex color. The phone does not render this block yet.
