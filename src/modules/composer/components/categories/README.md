# Categories

Body blocks. All six are placeholders built with `definePlaceholder`. The canvas shows an empty label. Props are the shared styling fields only. None of them have a `values` shape yet.

Styles live in `Categories.module.scss` (`.categories`). The names are row/column layouts: R1 is one row, C2 / C3 / C4 is the column count. The `_2`, `_3`, and `_4` suffixes are alternate layouts of the 1×3 grid, not extra rows.

| Folder | `type` | Palette label | Description |
|---|---|---|---|
| `cat_r1_c2` | `cat_r1_c2` | R1 / C2 | R1 / C2 |
| `cat_r1_c3` | `cat_r1_c3` | R1 / C3 | R1 / C3 |
| `cat_r1_c3_2` | `cat_r1_c3_2` | R1 / C3 | R1 / C3 (2) |
| `cat_r1_c3_3` | `cat_r1_c3_3` | R1 / C3 | R1 / C3 (3) |
| `cat_r1_c3_4` | `cat_r1_c3_4` | R1 / C3 | R1 / C3 (4) |
| `cat_r1_c4` | `cat_r1_c4` | R1 / C4 | R1 / C4 |

To build one, replace its `definePlaceholder` config with a real `Preview` and either `fields` or a `Props` file. Keep the existing `type`.
