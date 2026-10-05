# Text

Body blocks. Each one stores a single string and uses the shared text field plus styling. `defineText` builds the config; `TextBlockPreview` draws it.

`values.value` is the string. `values.color` is the text color, default `#000000`. An empty string renders the empty label on the canvas.

| Folder | `type` | Palette label | Canvas class |
|---|---|---|---|
| `h1` | `h1` | Heading 1 | `comp_h1` |
| `h2` | `h2` | Heading 2 | `comp_h2` |
| `h3` | `h3` | Heading 3 | `comp_h3` |
| `text` | `text` | Text | `comp_text` |

No custom props panel and no `serialize`. The saved value is `{ "value": "...", "color": "#000000" }`.
