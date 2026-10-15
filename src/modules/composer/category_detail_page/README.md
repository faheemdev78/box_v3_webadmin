# Category Detail Page composer

`category_detail_page` is the former category-backed Store Page type. It has the dedicated category detail canvas, conditional subcategory rail, automatic product grid, and separate Picture Banner (`picture_banner`) registry. Its composer is button-based; it does not use the standard drag-and-drop palette.

`category_page` and the new `store_page` share the existing standard composer, component registry, property editors, serialization, and smart-app page parser. Store Pages still use a category source for their path/icon and the Stores directory.

Category Detail Pages must link to a level 2 category. The category picker and backend enforce this on creation, editing and publishing. Store Pages may link to any category level.

Run the backend `scripts/migrate-store-pages-to-category-details.js` before creating fresh Store Pages. It snapshots the old Store Page IDs once, renames both draft and live records, and records completion. Reruns cannot capture newly created stores. Page IDs, page titles, sources, modules, schedules and publication state are preserved. Only the type and type label change.
