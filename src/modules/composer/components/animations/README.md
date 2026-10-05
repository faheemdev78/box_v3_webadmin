# Animations

Body blocks. Both are placeholders built with `definePlaceholder`. The canvas shows an empty label. Props are the shared styling fields only. Neither has a `values` shape yet.

Styles live in `Animation.module.scss` (`.animations`).

| Folder | `type` | Palette label | Description | Intended asset |
|---|---|---|---|---|
| `ani_video` | `ani_video` | Video | .mp4 | Video file |
| `ani_script` | `ani_script` | Script | .zip | Packaged animation script |

To build one, replace its `definePlaceholder` config with a real `Preview` and either `fields` or a `Props` file. Keep the existing `type`.
