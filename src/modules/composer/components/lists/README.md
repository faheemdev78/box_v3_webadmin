# Lists

`best_seller/config.ts` defines `box_list`, which appears as Lists → Best Seller. It copies Category List's defaults, props, preview, and serialization, including category selection, custom pictures, Upload/Gallery controls, grid layout, title, styling, and schedule. Category List remains available under Categories.

The web client renders `box_list` with the same category grid as `cat_list`.

The saved component type remains `box_list` so existing pages continue to load.

`brands_icon_list` appears as Lists → Brands Icon List. It selects brands with Choose brands, uses their saved icons, and labels the title switch Brand title. Its saved type and behavior are unchanged.

`store_list/config.tsx` defines `shop_by_store`, which appears as Lists → Store List. It copies Category List, selects non-draft pages with Choose pages, keeps custom picture Upload/Gallery controls per page, and uses a Page title switch. Selected page IDs, slugs, titles, and pictures are saved under `values.pages`.

Store List keeps the saved type `shop_by_store` for compatibility with existing pages.
