# Carousel

Body blocks. Product carousels store up to 20 products and a theme. Picture carousels store gallery pictures.

Auto play is a number of seconds. `0` keeps it off. Any number above `0` advances the carousel after that many seconds. Scroll product does not auto play: the row moves freely and eases to a stop.

| Folder | `type` | Palette label | Behavior |
|---|---|---|---|
| (root `config`) | `carousel` | Product carousel | Slides, optional auto play |
| `scroll_product` | `scroll_product` | Scroll product | Free horizontal scroll with easing |
| picture / video | `picture_video` | Picture / Video | Slides, optional auto play |
| `picture_3d` | `picture_3d_carousel` | Picture 3D | Center picture larger, needs at least 3 pictures, optional auto play |

Product selection uses the shared `ProductSelectModal`. Drag products in the selector’s selected column to set their order. Save stores the same product fields as Product List, including title, picture, and price. Theme is a hex text color, for example `#FFFFFF`. Older `white`, `green`, and `black` values still resolve.

These older product carousels stay available for pages that already use them. They slide, and they take the same auto play setting.

| Folder | `type` | Palette label | Columns |
|---|---|---|---|
| `full_width_carousel` | `full_width_carousel` | Full Width | 1, edge to edge |
| `carousel_r1_c3_1` | `carousel_r1_c3_1` | R1 / C3 | 3 |
| `carousel_r1_c2` | `carousel_r1_c2` | R1 / C2 | 2 |
| `carousel_r1_c1` | `carousel_r1_c1` | R1 / C1 | 1 |

`pic_carousel_1` and `carousel_r1_c3_2` are no longer in the palette.
