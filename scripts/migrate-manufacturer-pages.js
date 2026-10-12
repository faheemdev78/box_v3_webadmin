// Run with mongosh against the Box database before enabling the new Store Page.
// Preview: mongosh "$MONGO_URI" --file scripts/migrate-manufacturer-pages.js
// Apply:   APPLY_MIGRATION=1 mongosh "$MONGO_URI" --file scripts/migrate-manufacturer-pages.js
// Both draft and published copies are included. New category-backed stores are excluded.
const manufacturerIds = db.manufacturers.distinct('_id');
const categoryIds = db.product_cats.distinct('_id');
const filter = {
    'page_type.type': 'store_page',
    'page_type.page_source._id': { $in: manufacturerIds, $nin: categoryIds },
};
const count = db.app_pages.countDocuments(filter);
print(`Manufacturer-backed Store pages to rename: ${count}`);

if (process.env.APPLY_MIGRATION === '1') {
    const result = db.app_pages.updateMany(filter, {
        $set: { 'page_type.type': 'manufacturer_page', 'page_type.title': 'Manufacturer Page' },
    });
    print(`Renamed ${result.modifiedCount} page records.`);
} else {
    print('Preview only. Set APPLY_MIGRATION=1 to rename these records.');
}
