# Store Page composer

Store pages (`store_page`) use the category selector, path, and settings from Category Page. Manufacturer pages (`manufacturer_page`) use the manufacturer selector and the standard composer.

The Store Page composer has a separate component registry and a button-based left component bar. It does not mount the standard component palette, drop targets, or sortable rows. Components are added, configured, reordered with buttons, and removed here.

Picture Banner (`picture_banner`) reuses Carousel > Picture / Video, including gallery selection, uploads, links, navigation, autoplay, styling, scheduling, preview, and serialization. Its identity stays separate from the standard composer's `picture_video` component. Add future storefront components to `registry.ts`.

The supplied parser reference has category layouts with and without subcategories. This change prepares the admin configuration only; the product grid, subcategory rail, filters, and smart-app parser are outside this change.

## Existing pages

Before deploying the new Store Page option, run `scripts/migrate-manufacturer-pages.js` with mongosh against the Box database. It previews by default; `APPLY_MIGRATION=1` applies the rename to manufacturer-backed draft and published records. It leaves category-backed store records unchanged and can be rerun. This migration has not been run automatically.

The backend currently lists source-based scheduling types explicitly. Its `SOURCE_PAGE_TYPES` must include `manufacturer_page` when backend work resumes to retain shared-source schedule conflict checks and multiple variants for Manufacturer pages. The backend and smart app have not been modified here.
