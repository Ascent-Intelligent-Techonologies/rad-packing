-- The catalogue now follows RAD's own company profile ("Company Introduction & Website Content"):
-- five lines (Wooden Pallets, Industrial Packaging, Heat Shrink Wrapping, Preservation & VCI
-- Packaging, Export Packaging Solutions) holding only what the profile lists. Starter items the
-- profile does not mention are removed, and so are the fictional CRM demo records.
--
-- Every statement is written so it cannot fail on a database staff have already edited:
-- inserts skip rows that exist, moves only happen when the target exists, and a category is only
-- deleted once it is empty (so anything staff added themselves is left alone).

-- ───────────────────────── 1. The five lines ─────────────────────────

INSERT INTO "CatalogCategory" ("id","updatedAt","slug","name","summary","description","icon","position","published","parentId") VALUES
  ('cat_p_wooden_pallets', CURRENT_TIMESTAMP, 'wooden-pallets', 'Wooden Pallets', 'Standard, custom-made, Euro and CP pallets, new or used, with recycling, pooling and rental.', 'Wooden pallets for storage, handling and transport: standard and custom-made sizes, Euro and CP pallets, supplied new or used. We also take pallets back for recycling and run pooling and rental for recurring flows.', 'layers', 0, true, NULL),
  ('cat_p_industrial_packaging', CURRENT_TIMESTAMP, 'industrial-packaging', 'Industrial Packaging', 'Wooden crates and boxes, heavy-duty skids and custom packaging, packed on-site or off-site.', 'Durable, customized packaging that protects industrial goods, machinery and materials during transportation and storage: wooden crates and boxes, heavy-duty skids and made-to-measure packaging, with packing carried out on-site at your premises or off-site at ours.', 'package', 1, true, NULL),
  ('cat_p_heat_shrink_wrapping', CURRENT_TIMESTAMP, 'heat-shrink-wrapping', 'Heat Shrink Wrapping', 'Industrial shrink wrapping that shields equipment from weather, UV, dust and moisture.', 'Industrial shrink wrapping for machinery, equipment and materials in transport or storage. The heat-shrunk cover fits tightly around the load and protects it from weather and UV, dust and moisture.', 'scroll', 2, true, NULL),
  ('cat_p_export_packaging', CURRENT_TIMESTAMP, 'export-packaging', 'Export Packaging Solutions', 'ISPM-15 heat-treated, export-ready wooden packaging that protects cargo in international transit.', 'Export packaging built for the journey: ISPM-15 heat-treated timber, export-ready wooden crates, cases, pallets and skids, and protection against the handling, humidity and salt air of international transit.', 'container', 4, true, NULL)
ON CONFLICT DO NOTHING;

UPDATE "CatalogCategory" SET
  "name" = 'Preservation & VCI Packaging',
  "summary" = 'VCI, vacuum and moisture barrier packaging that stops corrosion before it starts.',
  "description" = 'Specialized industrial preservation packaging that protects valuable machinery, equipment, components and materials against corrosion, moisture, humidity, dust and environmental deterioration. VCI packaging, vacuum packaging and moisture barrier materials maintain asset integrity and extend product lifespan during storage, handling and transportation.',
  "position" = 3,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'cat_preservation';

-- Sub-categories of Industrial Packaging (existing rows, moved and renamed)
UPDATE "CatalogCategory" SET
  "parentId" = 'cat_p_industrial_packaging',
  "name" = 'Wooden Crates & Boxes',
  "position" = 0,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'cat_crates_and_boxes'
  AND EXISTS (SELECT 1 FROM "CatalogCategory" WHERE "id" = 'cat_p_industrial_packaging');

UPDATE "CatalogCategory" SET
  "parentId" = 'cat_p_industrial_packaging',
  "name" = 'On-Site & Off-Site Packaging',
  "summary" = 'Packing carried out at your premises or at ours, from first assessment to finished pack.',
  "description" = 'We pack industrial goods and machinery where it suits the job: on-site at your facility, workshop or port, or off-site at our own premises. Either way the work starts with an assessment and ends with goods that are packed, protected and ready to move.',
  "position" = 1,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'cat_turnkey'
  AND EXISTS (SELECT 1 FROM "CatalogCategory" WHERE "id" = 'cat_p_industrial_packaging');

UPDATE "CatalogCategory" SET "slug" = 'on-site-off-site-packaging'
WHERE "id" = 'cat_turnkey'
  AND "parentId" = 'cat_p_industrial_packaging'
  AND NOT EXISTS (SELECT 1 FROM "CatalogCategory" WHERE "slug" = 'on-site-off-site-packaging');

-- ───────────────────── 2. Starter items the profile does not list ─────────────────────
-- (their photos go with them: CatalogImage and CatalogImageBlob cascade)

DELETE FROM "CatalogProduct" WHERE "id" IN (
  'prd_rust_preventive_oil', 'prd_neutral_rust_remover',
  'prd_rad_dry_desiccants', 'prd_rad_c_dry_desiccants', 'prd_temperature_humidity_indicator',
  'prd_rad_honeycomb_paper', 'prd_rad_air_cushion_pillow_film', 'prd_rad_paper_mailers', 'prd_paper_cushion_pads', 'prd_protective_foams',
  'prd_stretch_film', 'prd_water_activated_kraft_paper_tape', 'prd_strapping_materials', 'prd_corrugated_cartons',
  'prd_nailless_collapsible_plywood_box', 'prd_e1_grade_nailless_box'
);

-- ───────────────────── 3. Products that stay, in their new place ─────────────────────

UPDATE "CatalogProduct" SET "categoryId" = 'cat_p_wooden_pallets', "position" = 0, "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'prd_industrial_wooden_pallets'
  AND EXISTS (SELECT 1 FROM "CatalogCategory" WHERE "id" = 'cat_p_wooden_pallets');
UPDATE "CatalogProduct" SET "title" = 'Standard & Custom-Made Wooden Pallets'
WHERE "id" = 'prd_industrial_wooden_pallets' AND "title" = 'Industrial Wooden Pallets';

UPDATE "CatalogProduct" SET "categoryId" = 'cat_preservation', "position" = 0, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = 'prd_rad_vci_film' AND EXISTS (SELECT 1 FROM "CatalogCategory" WHERE "id" = 'cat_preservation');
UPDATE "CatalogProduct" SET "categoryId" = 'cat_preservation', "position" = 1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = 'prd_rad_vci_paper' AND EXISTS (SELECT 1 FROM "CatalogCategory" WHERE "id" = 'cat_preservation');
UPDATE "CatalogProduct" SET "categoryId" = 'cat_preservation', "position" = 2, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = 'prd_rad_vci_emitter' AND EXISTS (SELECT 1 FROM "CatalogCategory" WHERE "id" = 'cat_preservation');
UPDATE "CatalogProduct" SET "categoryId" = 'cat_preservation', "position" = 3, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = 'prd_high_barrier_foil_bags' AND EXISTS (SELECT 1 FROM "CatalogCategory" WHERE "id" = 'cat_preservation');

UPDATE "CatalogProduct" SET
  "title" = 'Vacuum & Moisture Barrier Packaging',
  "summary" = 'Multi-layer barrier bags and roll stock, heat-sealed or vacuum-sealed around the goods to keep moisture and oxygen out.',
  "description" = E'Barrier bags block moisture and oxygen. The goods are enclosed in the bag, which is then heat-sealed or vacuum-sealed so they travel and store in a dry, protected atmosphere.\n\nAvailable as ready-made bags, custom pouches and roll stock.',
  "highlights" = ARRAY['Moisture and oxygen barrier', 'Heat-seal or vacuum-seal', 'Ready-made, custom pouches or roll stock', 'Used with VCI for corrosion protection']::TEXT[],
  "tags" = ARRAY['vacuum packaging', 'moisture barrier', 'barrier bag', 'foil']::TEXT[]
WHERE "id" = 'prd_high_barrier_foil_bags' AND "title" = 'High-Barrier Foil & Vacuum Bags';

UPDATE "CatalogProduct" SET
  "description" = replace("description", 'Combined with barrier film, desiccant and internal blocking', 'Combined with VCI or barrier packaging and internal blocking'),
  "highlights" = array_replace("highlights", 'Combine with barrier film and desiccant', 'Combine with VCI and barrier packaging')
WHERE "id" = 'prd_export_crates';

UPDATE "CatalogProduct" SET "position" = 0, "description" = replace("description", 'Every turnkey job starts', 'Every packing job starts') WHERE "id" = 'prd_site_assessment_packing_plan';
UPDATE "CatalogProduct" SET "position" = 1 WHERE "id" = 'prd_onsite_mobile_packing';

-- wording that pointed at the old structure or at markets the profile does not mention
UPDATE "CatalogProduct" SET "tags" = array_remove("tags", 'turnkey')
WHERE "id" IN ('prd_site_assessment_packing_plan', 'prd_onsite_mobile_packing', 'prd_crating_export_preparation');
UPDATE "CatalogProduct" SET "summary" = replace("summary", 'metal and electronic parts', 'metal parts and components')
WHERE "id" = 'prd_rad_vci_emitter';

UPDATE "CatalogProduct" SET "categoryId" = 'cat_p_heat_shrink_wrapping', "position" = 1, "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'prd_rad_shrink_films'
  AND EXISTS (SELECT 1 FROM "CatalogCategory" WHERE "id" = 'cat_p_heat_shrink_wrapping');

UPDATE "CatalogProduct" SET "categoryId" = 'cat_p_export_packaging', "position" = 1, "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'prd_crating_export_preparation'
  AND EXISTS (SELECT 1 FROM "CatalogCategory" WHERE "id" = 'cat_p_export_packaging');
UPDATE "CatalogProduct" SET "title" = 'Export-Ready Wooden Packaging'
WHERE "id" = 'prd_crating_export_preparation' AND "title" = 'Crating & Export Preparation';

-- ───────────────────── 4. Items from the profile that had no page yet ─────────────────────

INSERT INTO "CatalogProduct" ("id","updatedAt","slug","title","summary","description","highlights","specs","tags","published","featured","position","categoryId")
SELECT v."id", CURRENT_TIMESTAMP, v."slug", v."title", v."summary", v."description", v."highlights", NULL::jsonb, v."tags", true, false, v."position", v."categoryId"
FROM (VALUES
  ('prd_p_euro_cp_pallets', 'euro-cp-pallets', 'Euro & CP Pallets',
   'Euro pallets and CP chemical-industry pallets in the standard sizes your supply chain asks for.',
   'Euro pallets (1200 x 800 mm) and the CP range used by the chemical industry are built to fixed, standard dimensions, so they work with racking, conveyors and trucks wherever the goods travel. Tell us which type and quantity you need and whether the pallets are for export.',
   ARRAY['Euro pallets, 1200 x 800 mm', 'CP pallets for the chemical industry', 'New or used', 'Heat-treated for export on request']::TEXT[],
   ARRAY['euro pallet', 'cp pallet', 'chemical pallet', 'pallet']::TEXT[], 1, 'cat_p_wooden_pallets'),
  ('prd_p_new_used_pallets', 'new-used-pallets', 'New & Used Pallets',
   'New pallets where the load or the customer demands it, used pallets where cost matters most.',
   'We supply both new and used wooden pallets. New pallets suit export, heavy loads and automated handling; used pallets are a cost-effective choice for storage and local distribution. We can advise which fits your load and budget.',
   ARRAY['New wooden pallets', 'Used wooden pallets', 'Standard and custom sizes', 'A cost-effective option for storage and local distribution']::TEXT[],
   ARRAY['new pallet', 'used pallet', 'second-hand pallet', 'pallet']::TEXT[], 2, 'cat_p_wooden_pallets'),
  ('prd_p_pallet_recycling_pooling_rental', 'pallet-recycling-pooling-rental', 'Pallet Recycling, Pooling & Rental',
   'We take pallets back for recycling, and offer pooling and rental so you only pay for the pallets you use.',
   'Not every pallet needs to be bought. With pooling and rental you draw pallets as you need them and return them afterwards; with recycling we take back pallets you no longer need so the timber is reused. Tell us your volumes and how the pallets move, and we will propose an arrangement.',
   ARRAY['Pallet recycling', 'Pallet pooling', 'Pallet rental', 'Suited to regular, recurring flows']::TEXT[],
   ARRAY['pallet recycling', 'pallet pooling', 'pallet rental', 'pallet']::TEXT[], 3, 'cat_p_wooden_pallets'),
  ('prd_p_heavy_duty_skids', 'heavy-duty-skids', 'Heavy-Duty Skids',
   'Timber skids built to carry heavy machinery and equipment and to take forklift or crane handling.',
   'A skid is a heavy timber base that the load is fixed to, so machinery and equipment can be lifted, moved and transported as one unit. We build skids to the weight, footprint and lifting points of your equipment, on their own or as the base of a crate.',
   ARRAY['Built to the weight and footprint of the load', 'Forklift and crane handling', 'Used alone or as a crate base', 'Heat-treated timber for export on request']::TEXT[],
   ARRAY['skid', 'industrial skid', 'machinery base', 'heavy duty']::TEXT[], 0, 'cat_p_industrial_packaging'),
  ('prd_p_custom_industrial_packaging', 'custom-industrial-packaging', 'Custom Industrial Packaging',
   'Packaging designed around the size, weight and handling of your goods when standard sizes do not fit.',
   'When standard packaging does not fit, we design and build it around your goods: the right combination of pallet, skid, crate or box, with the internal protection and wrapping the journey calls for.',
   ARRAY['Made to the size and weight of your goods', 'Pallets, skids, crates and boxes combined as needed', 'For transport and storage', 'One-off items or repeat orders']::TEXT[],
   ARRAY['custom packaging', 'made to measure', 'industrial packaging', 'heavy duty']::TEXT[], 1, 'cat_p_industrial_packaging'),
  ('prd_p_off_site_packing', 'off-site-packing', 'Off-Site Packing',
   'Send the goods to us and we pack them at our own premises, ready for collection or shipment.',
   'When packing at your own site is not practical, the goods can be delivered to our premises. We pack, preserve and crate them there and have them ready for collection or onward shipment.',
   ARRAY['Packing at our premises', 'Preservation and crating in one place', 'Ready for collection or shipment', 'An alternative to on-site packing']::TEXT[],
   ARRAY['off-site packing', 'packing service', 'crating']::TEXT[], 2, 'cat_turnkey'),
  ('prd_p_industrial_shrink_wrapping', 'industrial-shrink-wrapping', 'Industrial Shrink Wrapping',
   'Machinery, equipment and materials sealed in a heat-shrunk cover for transport or storage.',
   'We wrap the load in shrink film and apply heat so the film tightens into a close-fitting, sealed cover. It keeps weather, UV, dust and moisture off machinery, equipment and materials while they are transported or stored, including outdoors.',
   ARRAY['Industrial shrink wrapping', 'Weather and UV protection', 'Dust and moisture protection', 'For transport and storage']::TEXT[],
   ARRAY['shrink wrapping', 'heat shrink', 'weather protection', 'uv protection']::TEXT[], 0, 'cat_p_heat_shrink_wrapping'),
  ('prd_p_ispm_15_heat_treated_packaging', 'ispm-15-heat-treated-packaging', 'ISPM-15 Heat-Treated Packaging',
   'Heat-treated wooden packaging for export, as the ISPM-15 standard requires for timber in international trade.',
   'ISPM 15 is the international standard for wood packaging used in export: the timber must be heat-treated so it cannot carry pests across borders. We supply heat-treated pallets, crates, boxes and skids for shipments that need it.',
   ARRAY['ISPM-15 heat-treated timber', 'Pallets, crates, boxes and skids', 'For export shipments', 'Protection in international transit']::TEXT[],
   ARRAY['ispm 15', 'heat treated', 'export crate', 'export pallet']::TEXT[], 0, 'cat_p_export_packaging')
) AS v("id","slug","title","summary","description","highlights","tags","position","categoryId")
WHERE EXISTS (SELECT 1 FROM "CatalogCategory" c WHERE c."id" = v."categoryId")
ON CONFLICT DO NOTHING;

-- ───────────────────── 5. Old categories, once they are empty ─────────────────────

DELETE FROM "CatalogCategory" c
WHERE c."id" IN ('cat_anti_corrosion', 'cat_anti_humidity', 'cat_cushioning_handling', 'cat_films_tapes_strapping', 'cat_pallets')
  AND NOT EXISTS (SELECT 1 FROM "CatalogProduct" p WHERE p."categoryId" = c."id")
  AND NOT EXISTS (SELECT 1 FROM "CatalogCategory" k WHERE k."parentId" = c."id");

DELETE FROM "CatalogCategory" c
WHERE c."id" IN ('cat_nailless_boxes', 'cat_wooden', 'cat_traditional')
  AND NOT EXISTS (SELECT 1 FROM "CatalogProduct" p WHERE p."categoryId" = c."id")
  AND NOT EXISTS (SELECT 1 FROM "CatalogCategory" k WHERE k."parentId" = c."id");

-- ───────────────────── 6. Back office: fictional demo records ─────────────────────
-- The removed "Load demo data" button recorded every id it created in Setting "demoIds" (and gave
-- them a demo_ prefix). Only those rows are deleted; real customers, enquiries and quotes stay.

DELETE FROM "Quote" WHERE "id" LIKE 'demo\_%' OR "id" IN (SELECT jsonb_array_elements_text(s."value" -> 'quotes') FROM "Setting" s WHERE s."key" = 'demoIds');
DELETE FROM "Task" WHERE "id" LIKE 'demo\_%' OR "id" IN (SELECT jsonb_array_elements_text(s."value" -> 'tasks') FROM "Setting" s WHERE s."key" = 'demoIds');
DELETE FROM "Activity" WHERE "id" LIKE 'demo\_%' OR "id" IN (SELECT jsonb_array_elements_text(s."value" -> 'activities') FROM "Setting" s WHERE s."key" = 'demoIds');
DELETE FROM "Lead" WHERE "id" LIKE 'demo\_%' OR "id" IN (SELECT jsonb_array_elements_text(s."value" -> 'leads') FROM "Setting" s WHERE s."key" = 'demoIds');
DELETE FROM "Contact" WHERE "id" LIKE 'demo\_%' OR "id" IN (SELECT jsonb_array_elements_text(s."value" -> 'contacts') FROM "Setting" s WHERE s."key" = 'demoIds');
DELETE FROM "Company" WHERE "id" LIKE 'demo\_%' OR "id" IN (SELECT jsonb_array_elements_text(s."value" -> 'companies') FROM "Setting" s WHERE s."key" = 'demoIds');
DELETE FROM "Product" WHERE "id" LIKE 'demo\_%' OR "id" IN (SELECT jsonb_array_elements_text(s."value" -> 'products') FROM "Setting" s WHERE s."key" = 'demoIds');

-- give the demo quotes' numbers back, but only if no real quote has been raised since
UPDATE "Counter" c SET "value" = (s."value" -> 'quoteCounter' ->> 'before')::int
FROM "Setting" s
WHERE s."key" = 'demoIds'
  AND c."key" = 'quote'
  AND jsonb_typeof(s."value" -> 'quoteCounter') = 'object'
  AND c."value" = (s."value" -> 'quoteCounter' ->> 'after')::int;

DELETE FROM "Setting" WHERE "key" = 'demoIds';

-- the enquiry created while testing the live site
DELETE FROM "Lead"
WHERE "name" ILIKE '%RAD smoke test (delete me)%'
   OR "company" ILIKE '%RAD smoke test (delete me)%'
   OR "title" ILIKE '%RAD smoke test (delete me)%';

-- ───────────────────── 7. Company name on quotes ─────────────────────
-- Only when the saved setting still holds the old default.

UPDATE "Setting" SET "value" = jsonb_set("value", '{legalName}', '"RAD Packing Solutions L.L.C"')
WHERE "key" = 'company' AND "value" ->> 'legalName' = 'RAD Packing LLC';
