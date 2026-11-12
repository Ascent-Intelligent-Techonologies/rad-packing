-- CreateTable
CREATE TABLE "CatalogCategory" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,

    CONSTRAINT "CatalogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogProduct" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT,
    "highlights" TEXT[],
    "specs" JSONB,
    "tags" TEXT[],
    "published" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "CatalogProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogImage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" TEXT,
    "categoryId" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "alt" TEXT,
    "mime" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "bytes" INTEGER NOT NULL,

    CONSTRAINT "CatalogImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogImageBlob" (
    "imageId" TEXT NOT NULL,
    "full" BYTEA NOT NULL,
    "thumb" BYTEA NOT NULL,

    CONSTRAINT "CatalogImageBlob_pkey" PRIMARY KEY ("imageId")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogCategory_slug_key" ON "CatalogCategory"("slug");

-- CreateIndex
CREATE INDEX "CatalogCategory_parentId_position_idx" ON "CatalogCategory"("parentId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogProduct_slug_key" ON "CatalogProduct"("slug");

-- CreateIndex
CREATE INDEX "CatalogProduct_categoryId_published_idx" ON "CatalogProduct"("categoryId", "published");

-- CreateIndex
CREATE INDEX "CatalogProduct_published_featured_idx" ON "CatalogProduct"("published", "featured");

-- CreateIndex
CREATE INDEX "CatalogImage_productId_position_idx" ON "CatalogImage"("productId", "position");

-- CreateIndex
CREATE INDEX "CatalogImage_categoryId_position_idx" ON "CatalogImage"("categoryId", "position");

-- CreateIndex
CREATE INDEX "CatalogImage_productId_categoryId_createdAt_idx" ON "CatalogImage"("productId", "categoryId", "createdAt");

-- AddForeignKey
ALTER TABLE "CatalogCategory" ADD CONSTRAINT "CatalogCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CatalogCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogProduct" ADD CONSTRAINT "CatalogProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CatalogCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogImage" ADD CONSTRAINT "CatalogImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "CatalogProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogImage" ADD CONSTRAINT "CatalogImage_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CatalogCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogImageBlob" ADD CONSTRAINT "CatalogImageBlob_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "CatalogImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Starter catalogue.
-- Structure (category > sub-category > product) mirrors the catalogue on benzpackaging.com, mapped onto
-- RAD's five product lines. All wording is original and no photos are included: add real photos and edit
-- everything from /admin/catalogue.

INSERT INTO "CatalogCategory" ("id","updatedAt","slug","name","summary","description","icon","position","published","parentId") VALUES
  ('cat_preservation', CURRENT_TIMESTAMP, 'preservation', 'Preservation Packing Solutions', 'Barrier materials, corrosion inhibitors and desiccants engineered to stop degradation before it starts.', 'Specialized industrial preservation packaging that protects valuable machinery, equipment, components and materials against corrosion, moisture, humidity, dust and environmental deterioration.

Advanced barrier materials, corrosion-inhibiting technologies, desiccants and customized packaging systems maintain asset integrity and extend product lifespan during storage, handling and transportation.', 'shield', 0, true, NULL),
  ('cat_anti_corrosion', CURRENT_TIMESTAMP, 'anti-corrosion', 'Anti-Corrosion', 'Volatile corrosion inhibitor films, papers and emitters, plus rust preventives and removers.', 'Protection that works on the metal itself. Corrosion-inhibiting films, papers and emitters protect parts inside the pack, while preventive oils and rust removers handle surface preparation and coating.', 'flask', 0, true, 'cat_preservation'),
  ('cat_anti_humidity', CURRENT_TIMESTAMP, 'anti-humidity', 'Anti-Humidity', 'Desiccants, humidity indicators and high-barrier bags that keep moisture away from stored and shipped equipment.', 'Moisture control for crates, containers and sealed packs: desiccants to absorb what gets in, indicators to prove the pack stayed dry, and barrier bags to keep humidity out in the first place.', 'droplets', 1, true, 'cat_preservation'),
  ('cat_nailless_boxes', CURRENT_TIMESTAMP, 'nailless-boxes', 'Nail-Less Collapsible Boxes', 'Plywood boxes secured with galvanized steel strips, hinges and buckles. No nails, no splinters.', 'Typically constructed from high-quality plywood, including E1-grade options, in 6 mm, 9 mm and 12 mm thicknesses. Reinforced and secured with corrosion-resistant galvanized steel strips, hinges and fastening buckles for enhanced strength and durability.

The boxes assemble and dismantle without nails, so they can be opened, inspected and reused.', 'box', 1, true, NULL),
  ('cat_wooden', CURRENT_TIMESTAMP, 'wooden', 'Wooden Packaging', 'Export crates, plywood boxes, timber cases and industrial pallets for heavy and high-value cargo.', 'Durable, customized wooden packaging engineered to protect heavy machinery, equipment and valuable components during handling, storage and international transportation. Designed for strength, stability and cargo security, meeting diverse industrial requirements and export packaging standards.', 'package', 2, true, NULL),
  ('cat_pallets', CURRENT_TIMESTAMP, 'pallets', 'Pallets', 'Industrial wooden pallets built to your load and handling method.', 'Timber pallets for storage, forklift handling and export shipping.', 'layers', 0, true, 'cat_wooden'),
  ('cat_crates_and_boxes', CURRENT_TIMESTAMP, 'crates-and-boxes', 'Crates & Boxes', 'Export crates, plywood boxes and timber cases made to the size of the cargo.', 'Closed and open crates and cases for machinery, spares and fragile equipment.', 'box', 1, true, 'cat_wooden'),
  ('cat_traditional', CURRENT_TIMESTAMP, 'traditional', 'Traditional Packaging', 'Crates, cartons, pallets, stretch film, foams and strapping. The everyday essentials, supplied reliably.', 'A comprehensive range of conventional industrial packaging materials designed to provide structural support, cushioning, load stability and reliable protection for goods during handling, storage and transportation.', 'layers', 3, true, NULL),
  ('cat_cushioning_handling', CURRENT_TIMESTAMP, 'cushioning-handling', 'Cushioning & Handling', 'Paper and film cushioning, mailers and foams that stop products moving or getting damaged in transit.', 'Void fill and protective wrap for parcels, spares and fragile goods, including paper-based alternatives to plastic.', 'leaf', 0, true, 'cat_traditional'),
  ('cat_films_tapes_strapping', CURRENT_TIMESTAMP, 'films-tapes-strapping', 'Films, Tapes & Strapping', 'Shrink and stretch films, tapes, strapping and cartons for unitising and closing loads.', 'Everything used to wrap, bundle, close and secure a load for storage and shipping.', 'scroll', 1, true, 'cat_traditional'),
  ('cat_turnkey', CURRENT_TIMESTAMP, 'turnkey', 'Industrial Packing Turnkey Contracting', 'End-to-end: site assessment, materials, on-site packing, crating and export preparation.', 'End-to-end industrial packing services, from site assessment, planning and material supply to on-site packing, preservation, crating and export preparation. Complete, customized packaging solutions that ensure asset protection, operational efficiency and shipment readiness.', 'truck', 4, true, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO "CatalogProduct" ("id","updatedAt","slug","title","summary","description","highlights","specs","tags","published","featured","position","categoryId") VALUES
  ('prd_rad_vci_film', CURRENT_TIMESTAMP, 'rad-vci-film', 'RAD VCI Film — Anti-Corrosion Packaging Film', 'Multi-layer packaging film that releases a corrosion-inhibiting vapour inside the sealed pack, protecting metal parts without oil or grease.', 'RAD VCI Film wraps or lines metal parts and sealed packs. Volatile Corrosion Inhibitor (VCI) molecules released from the film settle on metal surfaces as an invisible protective layer, so components stay bright and rust-free through storage and transit.

It suits machinery spares, gearboxes, tooling and fabricated components that must arrive ready to use, with no degreasing step. Supplied as rolls, bags, sheets and custom-made liners to suit the asset. Tell us what you are protecting and we will recommend the right grade.', ARRAY['Protects ferrous and non-ferrous metals', 'No oils or greasy coatings to clean off', 'Rolls, bags, sheets and custom liners', 'Suited to long-term storage and sea freight']::TEXT[], NULL, ARRAY['VCI', 'anti-corrosion', 'packaging film', 'rust prevention']::TEXT[], true, true, 0, 'cat_anti_corrosion'),
  ('prd_rad_vci_paper', CURRENT_TIMESTAMP, 'rad-vci-paper', 'RAD VCI Paper', 'Corrosion-inhibiting paper for wrapping, interleaving and lining crates and cartons of metal parts.', 'RAD VCI Paper is kraft or poly-coated paper treated with a volatile corrosion inhibitor. Wrap individual parts, interleave stacked components or line a crate or carton, and the inhibitor protects the metal inside the enclosed space.

It is a practical choice for bearings, fasteners, tools and machined parts that are packed by hand in volume.', ARRAY['Wrap, interleave or line', 'Easy to cut and fold by hand', 'Clean, dry protection with no oil film', 'Works inside crates and cartons']::TEXT[], NULL, ARRAY['VCI', 'VCI paper', 'anti-corrosion', 'wrapping']::TEXT[], true, false, 1, 'cat_anti_corrosion'),
  ('prd_rad_vci_emitter', CURRENT_TIMESTAMP, 'rad-vci-emitter', 'RAD VCI Emitter', 'Small emitters placed inside enclosures, cabinets and sealed packs to protect the air space around metal and electronic parts.', 'RAD VCI Emitters release corrosion inhibitor into the volume of an enclosed space. Fit one inside an electrical cabinet, control panel, toolbox or sealed crate and it protects the surfaces inside, including those you cannot wrap.

Useful for equipment in storage, in transit or standing idle between jobs.', ARRAY['Protects enclosed air space', 'Drop in, no contact with parts needed', 'For cabinets, panels, crates and toolboxes', 'Sized to the volume being protected']::TEXT[], NULL, ARRAY['VCI', 'emitter', 'enclosure protection', 'anti-corrosion']::TEXT[], true, false, 2, 'cat_anti_corrosion'),
  ('prd_rust_preventive_oil', CURRENT_TIMESTAMP, 'rust-preventive-oil', 'Rust Preventive Oil', 'Oil and spray coatings that leave a thin protective film on bare metal for storage and shipment.', 'Rust preventive oils are applied by spray, brush or dip to leave a thin film that keeps moisture off bare metal. They are used on machined surfaces, tooling, shafts and fabricated parts that are stored or shipped uncovered or inside a pack.

We can advise on oil type for indoor or outdoor storage and how long the protection needs to last.', ARRAY['Spray, brush or dip application', 'Indoor and outdoor storage options', 'For machined and bare metal surfaces', 'Pairs with VCI film for double protection']::TEXT[], NULL, ARRAY['rust preventive', 'oil', 'spray', 'anti-corrosion']::TEXT[], true, false, 3, 'cat_anti_corrosion'),
  ('prd_neutral_rust_remover', CURRENT_TIMESTAMP, 'neutral-rust-remover', 'Neutral Rust Remover', 'A neutral-pH rust remover for cleaning light corrosion off metal parts before they are preserved and packed.', 'Parts should go into preservation packing clean. A neutral rust remover lifts light surface rust without the harshness of strong acids, so parts can be cleaned, dried, oiled and sealed in one workflow.

We supply it alongside our preservation materials for on-site and workshop teams.', ARRAY['Neutral formulation', 'Removes light surface rust', 'Prepares parts for preservation', 'Supplied with preservation materials']::TEXT[], NULL, ARRAY['rust remover', 'cleaning', 'surface preparation']::TEXT[], true, false, 4, 'cat_anti_corrosion'),
  ('prd_rad_dry_desiccants', CURRENT_TIMESTAMP, 'rad-dry-desiccants', 'RAD Dry Desiccants', 'Sachets of moisture-adsorbing clay or silica gel that keep humidity down inside sealed packs and crates.', 'RAD Dry Desiccants are breathable sachets filled with a moisture-adsorbing material such as clay or silica gel. Placed inside a sealed pack, they take up water vapour so humidity stays low and condensation, mould and corrosion are kept at bay.

Supplied in a range of sachet sizes. We calculate the quantity from the volume of the pack and the barrier material around it.', ARRAY['Clay and silica gel options', 'Range of sachet sizes', 'Quantity calculated for your pack', 'Non-contact moisture control']::TEXT[], NULL, ARRAY['desiccant', 'silica gel', 'clay desiccant', 'humidity control']::TEXT[], true, true, 0, 'cat_anti_humidity'),
  ('prd_rad_c_dry_desiccants', CURRENT_TIMESTAMP, 'rad-c-dry-desiccants', 'RAD C-Dry Container Desiccants', 'Large-capacity desiccants hung inside shipping containers to absorb moisture and prevent condensation damage.', 'Temperature changes at sea can make a closed container ''rain'' onto the cargo. C-Dry container desiccants are hung from the container walls to adsorb moisture from the air and help prevent condensation, mildew and rust on the goods.

Suitable for general cargo, machinery, textiles and packaged goods on long sea routes.', ARRAY['Hang-up format for shipping containers', 'Helps prevent condensation and mildew', 'Suits long sea routes', 'Sized per container']::TEXT[], NULL, ARRAY['container desiccant', 'condensation', 'shipping', 'humidity control']::TEXT[], true, false, 1, 'cat_anti_humidity'),
  ('prd_temperature_humidity_indicator', CURRENT_TIMESTAMP, 'temperature-humidity-indicator', 'Temperature & Humidity Indicator', 'Colour-change humidity indicator cards that show at a glance whether a sealed pack stayed dry.', 'Humidity indicator cards change colour as relative humidity rises past set points. Fixed to the inside of a barrier bag or crate with a viewing window, they let you confirm on arrival that the pack stayed dry without opening it.

A simple, low-cost way to give customers confidence in a preservation pack.', ARRAY['Colour change shows humidity level', 'Check without opening the pack', 'Multi-spot cards available', 'Fits behind viewing windows']::TEXT[], NULL, ARRAY['humidity indicator', 'indicator card', 'monitoring']::TEXT[], true, false, 2, 'cat_anti_humidity'),
  ('prd_high_barrier_foil_bags', CURRENT_TIMESTAMP, 'high-barrier-foil-bags', 'High-Barrier Foil & Vacuum Bags', 'Multi-layer barrier bags and roll stock, heat-sealed or vacuum-sealed around the asset together with desiccant.', 'High-barrier foil bags block moisture and oxygen. The asset and a measured amount of desiccant are enclosed in the bag, which is then heat-sealed or vacuum-sealed to create a protected micro-environment.

Available as ready-made bags, custom pouches and roll stock, including formats for electronics, pharmaceuticals and critical spares.', ARRAY['Moisture and oxygen barrier', 'Heat-seal or vacuum-seal', 'Ready-made, custom pouches or roll stock', 'Combines with desiccant and indicators']::TEXT[], NULL, ARRAY['barrier bag', 'vacuum packaging', 'foil', 'moisture barrier']::TEXT[], true, true, 3, 'cat_anti_humidity'),
  ('prd_nailless_collapsible_plywood_box', CURRENT_TIMESTAMP, 'nailless-collapsible-plywood-box', 'Nail-Less Collapsible Plywood Box', 'Plywood box secured with galvanized steel strips, hinges and buckles. Assembles and dismantles without nails.', 'Our nail-less collapsible boxes are made from high-quality plywood in 6 mm, 9 mm or 12 mm thickness and reinforced with corrosion-resistant galvanized steel strips, hinges and fastening buckles.

Because there are no nails, the box opens cleanly for inspection, can be reused, and has no splinters or protruding fasteners. Made to the size of your goods.', ARRAY['No nails, no splinters', 'Reusable: opens and closes repeatedly', '6 mm, 9 mm and 12 mm plywood', 'Made to size']::TEXT[], '[{"label":"Material","value":"Plywood"},{"label":"Thickness","value":"6 mm, 9 mm or 12 mm"},{"label":"Reinforcement","value":"Galvanized steel strips"},{"label":"Fastening","value":"Hinges and buckles"},{"label":"Sizing","value":"Made to order"}]'::jsonb, ARRAY['nail-less', 'collapsible box', 'plywood box', 'reusable']::TEXT[], true, true, 0, 'cat_nailless_boxes'),
  ('prd_e1_grade_nailless_box', CURRENT_TIMESTAMP, 'e1-grade-nailless-box', 'E1-Grade Nail-Less Collapsible Box', 'The same nail-less design in E1-grade plywood, for projects that call for low-emission board.', 'E1 is a low-emission class for wood panels. Where a customer, site or destination asks for it, we build our nail-less collapsible boxes from E1-grade plywood, with the same galvanized steel strips, hinges and buckles as the standard box.

Tell us the E1 requirement when you enquire so we can confirm material and thickness.', ARRAY['E1-grade plywood option', 'Same nail-less, reusable design', '6 mm, 9 mm and 12 mm', 'Made to size']::TEXT[], '[{"label":"Material","value":"E1-grade plywood"},{"label":"Thickness","value":"6 mm, 9 mm or 12 mm"},{"label":"Reinforcement","value":"Galvanized steel strips"},{"label":"Fastening","value":"Hinges and buckles"}]'::jsonb, ARRAY['E1 plywood', 'nail-less', 'collapsible box']::TEXT[], true, false, 1, 'cat_nailless_boxes'),
  ('prd_industrial_wooden_pallets', CURRENT_TIMESTAMP, 'industrial-wooden-pallets', 'Industrial Wooden Pallets', 'Heavy-duty timber pallets built to your load size and handling method.', 'Strong timber pallets for storage, forklift handling and export shipping, built to the footprint and weight of your load. Materials that comply with global shipping regulations such as ISPM 15 are available for export.

Standard and custom sizes, supplied in volume or as one-offs for heavy equipment.', ARRAY['Standard and custom sizes', 'Built for forklift and pallet-truck handling', 'ISPM 15-compliant materials available', 'Heavy and high-value loads']::TEXT[], NULL, ARRAY['pallet', 'timber', 'ISPM 15', 'export']::TEXT[], true, true, 0, 'cat_pallets'),
  ('prd_export_crates', CURRENT_TIMESTAMP, 'export-crates', 'Export Crates', 'Strong, closed timber crates made to the size of the cargo for international shipment.', 'Export crates are built around the cargo with a skid base, braced frame and sheathing to protect it through lifting, stacking and sea or air freight. Combined with barrier film, desiccant and internal blocking, they provide complete protection for machinery and equipment.

Built to export packaging standards.', ARRAY['Made to the size of the cargo', 'Skid base for forklift handling', 'Combine with barrier film and desiccant', 'Export-standard builds']::TEXT[], NULL, ARRAY['crate', 'export crate', 'timber', 'heavy machinery']::TEXT[], true, false, 0, 'cat_crates_and_boxes'),
  ('prd_plywood_boxes', CURRENT_TIMESTAMP, 'plywood-boxes', 'Plywood Boxes', 'Plywood boxes for machinery parts, spares and equipment that need a clean, strong enclosure.', 'Plywood boxes give a smooth, strong and relatively light enclosure for parts, spares and instruments. They can be built as fixed boxes or as our nail-less collapsible design, and fitted with foam, blocking or barrier packing inside.', ARRAY['Strong and relatively light', 'Made to size', 'Foam and blocking fitted inside', 'Fixed or nail-less collapsible']::TEXT[], NULL, ARRAY['plywood', 'box', 'spares']::TEXT[], true, false, 1, 'cat_crates_and_boxes'),
  ('prd_timber_cases', CURRENT_TIMESTAMP, 'timber-cases', 'Timber Cases', 'Timber cases for heavier or longer items that need a rigid, protective enclosure.', 'Timber cases are rigid, closed enclosures for heavy, long or high-value items such as shafts, motors and fabricated assemblies. The internal fit is blocked and braced so the item cannot move in transit.', ARRAY['Rigid, closed enclosure', 'Blocked and braced inside', 'Heavy and long items', 'Made to order']::TEXT[], NULL, ARRAY['timber case', 'case', 'heavy equipment']::TEXT[], true, false, 2, 'cat_crates_and_boxes'),
  ('prd_rad_honeycomb_paper', CURRENT_TIMESTAMP, 'rad-honeycomb-paper', 'RAD Honeycomb Paper — Eco-Friendly Cushioning Wrap', 'A paper alternative to bubble wrap: an expandable honeycomb pattern that cushions and wraps fragile goods.', 'RAD Honeycomb Paper is a kraft paper with a die-cut honeycomb pattern. Pulled open it forms a cushioning wrap that protects products from knocks and scratches, and it is made of paper, so it can be recycled with other paper packaging.

Supplied in rolls. A practical replacement for plastic bubble wrap in parcels, spares and e-commerce shipping.', ARRAY['Paper-based, recyclable', 'Wraps and cushions fragile items', 'Supplied in rolls', 'An alternative to bubble wrap']::TEXT[], NULL, ARRAY['honeycomb paper', 'cushioning', 'eco-friendly', 'void fill']::TEXT[], true, true, 0, 'cat_cushioning_handling'),
  ('prd_rad_air_cushion_pillow_film', CURRENT_TIMESTAMP, 'rad-air-cushion-pillow-film', 'RAD Air Cushion Pillow Film', 'Film that is inflated into air pillows to fill voids and cushion products in cartons.', 'Air cushion film is supplied flat on rolls and inflated on demand into air pillows by a small machine. The pillows fill empty space in cartons so products cannot shift, using a fraction of the storage space of ready-made fill.

Suitable for e-commerce, spares and general dispatch.', ARRAY['Supplied flat, inflated on demand', 'Saves storage space', 'Fills voids in cartons', 'Light and fast']::TEXT[], NULL, ARRAY['air pillow', 'air cushion', 'void fill', 'protective packaging']::TEXT[], true, false, 1, 'cat_cushioning_handling'),
  ('prd_rad_paper_mailers', CURRENT_TIMESTAMP, 'rad-paper-mailers', 'RAD Paper Mailers', 'Paper shipping bags for parcels, as a recyclable alternative to plastic mailers.', 'RAD Paper Mailers are made from kraft paper and available plain or with a cushioned lining for fragile items. Self-seal closures make packing quick, and the paper is recyclable.

For online sellers and companies that dispatch small items and documents.', ARRAY['Kraft paper construction', 'Plain and padded options', 'Self-seal closure', 'Recyclable']::TEXT[], NULL, ARRAY['paper mailer', 'shipping bag', 'e-commerce', 'recyclable']::TEXT[], true, false, 2, 'cat_cushioning_handling'),
  ('prd_paper_cushion_pads', CURRENT_TIMESTAMP, 'paper-cushion-pads', 'Paper Cushion Pads', 'Folded paper pads that cushion and fill voids, made from fan-fold paper on demand.', 'Fan-fold paper is crumpled by a compact machine into resilient cushion pads that wrap or fill around products. A fast, tidy and recyclable way to protect fragile goods in cartons on a packing line.

We can supply both the paper and the machines.', ARRAY['Made on demand from fan-fold paper', 'Wraps or fills', 'Recyclable', 'Machines available']::TEXT[], NULL, ARRAY['paper cushion', 'void fill', 'packing line']::TEXT[], true, false, 3, 'cat_cushioning_handling'),
  ('prd_protective_foams', CURRENT_TIMESTAMP, 'protective-foams', 'Protective Foams', 'Foam sheets, rolls and cut inserts for cushioning, blocking and protecting surfaces.', 'Protective foams cushion products against shock and vibration and keep surfaces from scratching. Supplied as sheets and rolls or cut to fit as inserts and blocking inside crates and boxes.', ARRAY['Sheets, rolls and cut-to-fit inserts', 'Shock and vibration protection', 'Surface protection', 'Fits inside crates and boxes']::TEXT[], NULL, ARRAY['foam', 'cushioning', 'inserts']::TEXT[], true, false, 4, 'cat_cushioning_handling'),
  ('prd_rad_shrink_films', CURRENT_TIMESTAMP, 'rad-shrink-films', 'RAD Shrink Films', 'Heat-shrink film that tightens around a product or load to bundle, seal and protect it.', 'RAD Shrink Films tighten snugly around a product or pallet load when heat is applied, bundling it, keeping dust and moisture out and showing if it has been disturbed. Available in a range of widths and gauges, with specialised grades such as VCI and UV-resistant shrink on request.', ARRAY['Bundles and seals products and loads', 'Range of widths and gauges', 'VCI and UV-resistant grades on request', 'Dust and moisture protection']::TEXT[], NULL, ARRAY['shrink film', 'shrink wrap', 'bundling']::TEXT[], true, false, 0, 'cat_films_tapes_strapping'),
  ('prd_stretch_film', CURRENT_TIMESTAMP, 'stretch-film', 'Stretch Film', 'Stretch wrap for securing pallet loads for storage and transit.', 'Stretch film is wound around a pallet load to hold it together and stable. Available for hand and machine application in a range of gauges and widths, clear or coloured.', ARRAY['Hand and machine rolls', 'Range of gauges and widths', 'Keeps loads stable', 'Clear and coloured']::TEXT[], NULL, ARRAY['stretch film', 'pallet wrap', 'load stability']::TEXT[], true, false, 1, 'cat_films_tapes_strapping'),
  ('prd_water_activated_kraft_paper_tape', CURRENT_TIMESTAMP, 'water-activated-kraft-paper-tape', 'Water-Activated Kraft Paper Tape', 'Paper tape that bonds to cartons when wetted, for strong, plastic-free closing.', 'Water-activated kraft paper tape has a starch-based adhesive that bonds into the carton fibre when wetted, creating a strong, tamper-evident seal. Made of paper, it is recyclable together with the carton.

Used with a manual or electric dispenser.', ARRAY['Bonds into the carton for a strong seal', 'Tamper-evident', 'Plastic-free, recyclable with the carton', 'Manual and electric dispensers']::TEXT[], NULL, ARRAY['kraft paper tape', 'gummed tape', 'carton sealing']::TEXT[], true, false, 2, 'cat_films_tapes_strapping'),
  ('prd_strapping_materials', CURRENT_TIMESTAMP, 'strapping-materials', 'Strapping Materials', 'Strapping and buckles for bundling, securing and unitising loads.', 'Strapping holds crates, pallets, bundles and heavy loads together and secures them to a base. We supply strapping materials and the buckles and tools needed to apply them, matched to the weight of the load.', ARRAY['For bundles, crates and pallets', 'Buckles and tools available', 'Matched to the load weight', 'Supplied in coils']::TEXT[], NULL, ARRAY['strapping', 'banding', 'load securing']::TEXT[], true, false, 3, 'cat_films_tapes_strapping'),
  ('prd_corrugated_cartons', CURRENT_TIMESTAMP, 'corrugated-cartons', 'Corrugated Cartons', 'Corrugated cartons and boxes in standard and custom sizes.', 'Corrugated cartons for dispatch, storage and export in standard sizes and made to order. Different board strengths are available depending on the weight of the contents and how they will be handled and stacked.', ARRAY['Standard and custom sizes', 'Choice of board strength', 'For dispatch, storage and export', 'Stackable']::TEXT[], NULL, ARRAY['carton', 'corrugated', 'box']::TEXT[], true, false, 4, 'cat_films_tapes_strapping'),
  ('prd_site_assessment_packing_plan', CURRENT_TIMESTAMP, 'site-assessment-packing-plan', 'Site Assessment & Packing Plan', 'We inspect your assets and site, then plan the protection each item needs.', 'Every turnkey job starts with a visit. We assess the assets, the site and the journey, then recommend the right preservation method, packaging and crating, and give you a plan and quotation.', ARRAY['Visit to your facility, workshop or port', 'Protection planned per asset', 'Clear plan and quotation', 'One accountable partner']::TEXT[], NULL, ARRAY['site assessment', 'packing plan', 'turnkey']::TEXT[], true, false, 0, 'cat_turnkey'),
  ('prd_onsite_mobile_packing', CURRENT_TIMESTAMP, 'onsite-mobile-packing', 'On-Site & Mobile Packing', 'Our teams come to your facility, workshop or port to preserve and pack machinery where it stands.', 'Specialised packing teams work at your site: cleaning, preserving, wrapping, sealing and packing equipment on location, so it does not have to be moved before it is protected.

We bring the materials and the know-how.', ARRAY['Teams come to you', 'Materials supplied', 'Preserve and pack on location', 'Facility, workshop or port']::TEXT[], NULL, ARRAY['on-site packing', 'mobile packing', 'turnkey']::TEXT[], true, false, 1, 'cat_turnkey'),
  ('prd_crating_export_preparation', CURRENT_TIMESTAMP, 'crating-export-preparation', 'Crating & Export Preparation', 'Custom crating and export-ready packing so shipments leave ready to move.', 'We build custom crates around preserved assets and prepare the shipment to export standards, with the marking and packing details needed for the next step of the journey.', ARRAY['Custom crating built for strength and stability', 'Export-standard packing', 'Documentation-ready shipments', 'Complete end-to-end service']::TEXT[], NULL, ARRAY['crating', 'export packing', 'turnkey']::TEXT[], true, false, 2, 'cat_turnkey')
ON CONFLICT DO NOTHING;
