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
| `columns` / `rows` | Grid size. Columns 1–6, rows 1–4 |
| `gutter` | Pixels between columns and rows, 0–80. Missing values use 8 |
| `num_products` | Slot count, kept as a string of columns times rows |
| `products` | Selected products. The form keeps full product objects so the canvas can show titles and images |
| `all_btn.show` / `all_btn.text` | Optional button with custom text (defaults to "Show All") |
| `all_btn.attachment` | Category, product, brand, or page target; draft pages are excluded |
| `all_btn.link` | Preserved legacy raw link; a selected attachment takes precedence |
| `open_as` | Navigate to page (`goto_screen`, default) or open as bottom drawer (`popup`) |

The row also has `status` (`online` / `offline`) and `schedule_start` / `schedule_end`. Offline rows render at half opacity. A schedule shows a clock icon. Those fields live on the module, not inside `values`.

`serialize` runs on save and stores the selected product, including title, picture, price, and store fields. Empty slots stay empty.

Defaults on drop: title hidden, theme `#FFFFFF`, 3 empty slots, show-all hidden, `open_as` `goto_screen`. The theme colors the list heading and each product's title, attributes, discount, and price.

Product Group (`prod_group_3_2`) is no longer in the palette. Use Product List.
