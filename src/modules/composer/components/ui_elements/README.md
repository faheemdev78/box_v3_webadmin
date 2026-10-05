# UI elements

Registered from `registry.ts`.

The header is chrome and a singleton. Spacer, Divider, and Horizontal Line are body blocks. They can be added more than once. Each of those three has status, styling, background, and schedule. None of them has a theme.

## header (`header`)

Config: `header/config.ts`. Preview: `header/Preview.tsx`.

Props are generated from `fields`. There is no custom `Props` file.

`values`:

| Key | Control | Meaning |
|---|---|---|
| `theme` | color | Hex text color for the address and category rows, for example `#FFFFFF`. Older `white`, `green`, and `black` values still resolve. |
| `logo` | select | `white` (Logo white) or `green` (Logo green). Chooses the top-bar image. If a saved header has no logo, a green theme still uses the green logo. |
| `top_bar` | switch | Logo and avatar row |
| `address_bar` | switch | Address row |
| `search_bar` | switch | Search row |
| `cat_bar` | switch | Category chips |

Defaults turn every bar on, set the theme to `#FFFFFF`, and set the logo to white. The admin preview hides a bar when its switch is off. The smart app reads these flags, the theme color, and the logo on the existing template header. It does not render a second header.

Saved `values` is the theme, the logo, and the four booleans. No `serialize` step.

## spacer (`spacer`)

Config: `spacer/config.tsx`. Body block. `values.height` is the component height in pixels. Default is `24`.

## divider (`divider`)

Config: `divider/config.tsx`. Body block. Renders an Ant Design divider. `values.text` is the optional label in the line. `values.link` is optional and can point at a category, product, or brand.

## horizontal line (`horizontal_line`)

Config: `horizontal_line/config.tsx`. Body block. A plain horizontal line with no text.

## picture / video (`picture_video`)

Config: `picture_video/config.tsx`. Body block. Add pictures and videos together from this page’s gallery, or upload new files. Each file’s type is read from the upload or the gallery record. One item shows on its own. Two or more show as a carousel. Each item can optionally link to a category, product, or brand. Uploads go to the CDN and are saved on the page gallery. Deleting the composer page deletes that gallery first.
