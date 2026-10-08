# Scene blueprints

Generated from `packages/core/src/redesign/blueprints.ts` by `npm run skill:catalog`. Do not edit by hand.

Every redesign is assigned one blueprint in `content.json → designDirection.blueprint` (chosen from the business's
category and words in its content, e.g. pizza, burger, saree, dental, and rotated so consecutive redesigns differ).
Build its **signature moment** as the home page's centrepiece and follow its **storyboard**, filling every beat with
the site's own content. Recipe numbers refer to [motion-recipes.md](motion-recipes.md).

Chapter motions: **explode**: parts pull apart from the centre and come back; **stack**: layers lift apart along one axis, one caption per layer, then lock back; **orbit**: the camera circles the object; particles form a ring; **turntable**: the name is split in giant type with the object turning between the halves.

## Restaurants

### Exploded burger (`burger-stack`)
- **For:** restaurant, cafe; picked first when the site mentions "burger", "smash", "grill", "diner", "bbq", "barbecue", "fries", "hot dog", "street food"
- **Object and motion:** burger, stack
- **Signature moment:** A burger rises into view, then every layer lifts apart (bun, cheese, patty, lettuce, tomato) as captions name what makes the food theirs, and snaps back together.
- **Storyboard:** 1. Hook: name in huge type, the burger drops in and settles 2. Pinned stack: layers separate one by one, a caption per layer from the menu 3. Menu: priced list with category tabs, items rise in 4. Story: about text in blur-to-sharp words 5. Visit: hours, map, call button
- **Recipes:** 2, 16, 3, 4, 15

### Slice pull (`pizza-pull`)
- **For:** restaurant, cafe; picked first when the site mentions "pizza", "pizzeria", "napoli", "napoletana", "forno", "wood fired", "wood-fired", "slice", "calzone"
- **Object and motion:** pizza, explode
- **Signature moment:** A whole pizza turns under warm light, then the slices pull away from the centre as the menu headings appear, and close up again.
- **Storyboard:** 1. Hook: pizza spins in from above, title rises from a mask 2. Pull: slices draw outward in a pinned chapter, captions from the menu 3. Menu: two-column priced list, image mask reveals 4. Oven/story: pull quote from the about text 5. Visit: hours card, map, booking button
- **Recipes:** 2, 7, 5, 4, 15

### Cellar orbit (`cellar-orbit`)
- **For:** restaurant, cafe; picked first when the site mentions "wine", "bar", "bistro", "trattoria", "osteria", "cocktail", "tapas", "brasserie", "enoteca", "pub"
- **Object and motion:** glass, orbit
- **Signature moment:** The camera circles a glass of wine in a dark room while the venue's own words sharpen from blur.
- **Storyboard:** 1. Hook: cinematic dark hero, slow photo zoom 2. Orbit: camera circles the glass, three captions 3. Menu or wine list with thin rules 4. Gallery: pinned horizontal sequence of their photos 5. Reserve: hours and map
- **Recipes:** 2, 7, 8, 6, 4

### Brass rings (`brass-rings`)
- **For:** restaurant
- **Object and motion:** rings, orbit
- **Signature moment:** Brass rings turn around a pearl like a table setting seen from above; the camera drifts around them through three captions.
- **Storyboard:** 1. Hook: editorial headline and photo 2. Orbit chapter with brass rings 3. Menu as an editorial list 4. Story with image mask reveals 5. Visit
- **Recipes:** 2, 7, 8, 5, 3

### Candlelit turntable (`candle-turntable`)
- **For:** restaurant, cafe; picked first when the site mentions "restaurant", "kitchen", "cuisine", "dining"
- **Object and motion:** rings, turntable
- **Signature moment:** The business name is split in giant type with the object turning slowly between the halves, like a product launch.
- **Storyboard:** 1. Hook: type-sandwich hero, object between the halves of the name 2. Specs strip: hours, location, call, small labels 3. Menu reveal one category at a time 4. Photo gallery with parallax 5. Visit
- **Recipes:** 2, 17, 3, 5, 15

## Cafés and bakeries

### Steam rising (`steam-cup`)
- **For:** cafe; picked first when the site mentions "coffee", "espresso", "café", "cafe", "roast", "latte", "tea"
- **Object and motion:** cup, explode
- **Signature moment:** A cup on its saucer with beans around it; on scroll the beans scatter and steam particles rise while the headline sharpens.
- **Storyboard:** 1. Hook: warm hero, headline sharpens from blur 2. Cup chapter: beans scatter, steam rises, three captions 3. Drinks board as a priced list 4. Pastry or space gallery 5. Visit with hours
- **Recipes:** 2, 7, 9, 4, 5

### Bean orbit (`bean-orbit`)
- **For:** cafe; picked first when the site mentions "beans", "roastery", "brew", "barista"
- **Object and motion:** cup, orbit
- **Signature moment:** The camera orbits the cup while beans circle it like planets.
- **Storyboard:** 1. Hook 2. Orbit chapter 3. Menu list 4. Story in blur-to-sharp words 5. Visit
- **Recipes:** 2, 7, 8, 4

### Bakery turntable (`bakery-turntable`)
- **For:** cafe, retail; picked first when the site mentions "bakery", "pastry", "patisserie", "croissant", "bread", "cake", "donut", "dessert", "ice cream", "gelato"
- **Object and motion:** cup, turntable
- **Signature moment:** The name in huge type with the cup turning between the halves, captions at the corners like a product spec sheet.
- **Storyboard:** 1. Hook: type sandwich 2. Specs strip 3. Menu tiles that lift on hover 4. Gallery with mask reveals 5. Visit
- **Recipes:** 2, 17, 5, 15

## Gyms and studios

### Kinetic iron (`kinetic-iron`)
- **For:** gym; picked first when the site mentions "gym", "fitness", "training", "strength"
- **Object and motion:** dumbbell, explode
- **Signature moment:** Letters slam into place, then a chrome dumbbell bursts apart and reassembles as the classes appear.
- **Storyboard:** 1. Hook: kinetic headline, letters slam in 2. Dumbbell chapter: plates burst apart 3. Timetable or classes list 4. Trainers grid 5. Join: membership list and call button
- **Recipes:** 11, 7, 13, 3, 14

### Plate slide (`plate-slide`)
- **For:** gym; picked first when the site mentions "powerlifting", "weightlifting", "barbell", "lifting"
- **Object and motion:** dumbbell, stack
- **Signature moment:** The plates slide out along the bar one by one as you scroll, each carrying a caption, then lock back on.
- **Storyboard:** 1. Hook: bold poster type 2. Plate slide chapter 3. Velocity marquee of class names 4. Membership list 5. Visit
- **Recipes:** 11, 16, 13, 3

### Kettlebell launch (`kettlebell-turntable`)
- **For:** gym; picked first when the site mentions "crossfit", "kettlebell", "functional", "bootcamp", "hiit"
- **Object and motion:** kettlebell, turntable
- **Signature moment:** A kettlebell turns between the halves of the gym's name, like a sneaker launch page.
- **Storyboard:** 1. Hook: type sandwich with the kettlebell 2. Specs strip: hours, location, call 3. Classes revealed one at a time 4. Velocity marquee 5. Join
- **Recipes:** 17, 11, 13, 15

### Kettlebell orbit (`kettlebell-orbit`)
- **For:** gym; picked first when the site mentions "yoga", "pilates", "boxing", "martial", "studio"
- **Object and motion:** kettlebell, orbit
- **Signature moment:** The camera circles a kettlebell while particles gather into a ring.
- **Storyboard:** 1. Hook 2. Orbit chapter 3. Classes 4. Coaches 5. Join
- **Recipes:** 2, 7, 9, 3

## Salons and beauty

### Facet light (`facet-gem`)
- **For:** salon, retail, services; picked first when the site mentions "salon", "beauty", "nails", "lash", "brow", "jewel", "jewelry", "jewellery"
- **Object and motion:** gem, orbit
- **Signature moment:** A faceted gem turns in soft light while services fade in from blur.
- **Storyboard:** 1. Hook: quiet luxury hero 2. Gem orbit chapter 3. Services and prices list 4. Gallery of work 5. Book
- **Recipes:** 2, 7, 4, 6

### Bottle launch (`perfume-turntable`)
- **For:** salon, retail; picked first when the site mentions "spa", "perfume", "fragrance", "cosmetic", "skincare", "skin", "aesthetic", "wellness", "massage"
- **Object and motion:** perfume, turntable
- **Signature moment:** A glass bottle turns slowly between the halves of the name, spec-sheet captions at its sides.
- **Storyboard:** 1. Hook: type sandwich with the bottle 2. Specs strip 3. Treatments list one at a time 4. Gallery 5. Book
- **Recipes:** 17, 4, 5, 15

### Silk ribbon (`silk-ribbon`)
- **For:** salon, clothing; picked first when the site mentions "hair", "stylist", "barber", "silk", "bridal"
- **Object and motion:** ribbon, orbit
- **Signature moment:** Silk ribbons flow and twist around the frame while the camera drifts; headings rise from masks.
- **Storyboard:** 1. Hook: editorial serif headline 2. Ribbon orbit chapter 3. Services list 4. Team portraits 5. Book
- **Recipes:** 2, 7, 3, 5

## Clothing and fashion

### Type sandwich (`type-sandwich`)
- **For:** clothing, retail; picked first when the site mentions "boutique", "fashion", "collection", "apparel", "clothing", "wear"
- **Object and motion:** ribbon, turntable
- **Signature moment:** The brand name split in giant type with flowing fabric turning between the halves, model-number style captions at the corners.
- **Storyboard:** 1. Hook: type sandwich 2. Collection one at a time, product-launch reveals 3. Lookbook as a pinned horizontal gallery 4. Brand story 5. Store
- **Recipes:** 17, 6, 3, 5

### Deconstructed (`deconstructed`)
- **For:** clothing, services; picked first when the site mentions "tailor", "bespoke", "suit", "atelier", "denim", "made to measure"
- **Object and motion:** ribbon, explode
- **Signature moment:** Dark spotlit stage with fog: the piece comes apart into its panels as captions describe the craft, then reassembles.
- **Storyboard:** 1. Hook: dark spotlight hero, serif headline 2. Deconstruct chapter: panels pull apart 3. Craft story in blur-to-sharp words 4. Collection grid 5. Fitting / visit
- **Recipes:** 18, 7, 4, 3

### Scene lookbook (`lookbook-scenes`)
- **For:** clothing, salon, retail; picked first when the site mentions "saree", "sari", "lehenga", "kurta", "ethnic", "textile", "fabric"
- **Object and motion:** ribbon, stack
- **Signature moment:** Scenes like a film: a floating product card with fabric ribbons flowing around it, a scene counter, the next look sliding in on scroll.
- **Storyboard:** 1. Hook: layered photo cut-outs at different depths 2. Scenes: a pinned card per look with ribbons, scene counter 3. Collection grid 4. Story 5. Store
- **Recipes:** 19, 20, 6, 5

## Retail shops

### Gift box (`gift-turntable`)
- **For:** retail; picked first when the site mentions "gift", "shop", "store", "toys", "books", "flowers", "florist", "home"
- **Object and motion:** parcel, turntable
- **Signature moment:** A wrapped box turns between the halves of the shop's name.
- **Storyboard:** 1. Hook: type sandwich 2. Categories as tiles 3. Featured items from the content 4. Store hours 5. Visit
- **Recipes:** 17, 3, 5, 15

### Unboxing (`unboxing`)
- **For:** retail, import_export; picked first when the site mentions "delivery", "online", "electronics", "hardware", "supply"
- **Object and motion:** parcel, explode
- **Signature moment:** The box opens on scroll: lid lifts, sides fall away, ribbon unwraps.
- **Storyboard:** 1. Hook 2. Unboxing chapter 3. Categories 4. Brands or products from the content 5. Visit
- **Recipes:** 2, 7, 3, 5

## Healthcare

### Calm capsules (`capsule-calm`)
- **For:** healthcare; picked first when the site mentions "clinic", "medical", "health", "doctor", "pharmacy", "physio", "therapy"
- **Object and motion:** capsules, explode
- **Signature moment:** Capsules and a cross float apart and reassemble, slowly, with plenty of air.
- **Storyboard:** 1. Hook: calm hero, soft photo 2. Capsule chapter 3. Services list 4. First visit info 5. Contact
- **Recipes:** 2, 7, 3, 4

### Care orbit (`capsule-orbit`)
- **For:** healthcare; picked first when the site mentions "care", "family", "practice", "wellbeing"
- **Object and motion:** capsules, orbit
- **Signature moment:** The camera circles the cross while capsules drift around it.
- **Storyboard:** 1. Hook 2. Orbit chapter 3. Services 4. Team 5. Contact
- **Recipes:** 2, 7, 8, 3

### Clean turntable (`clean-turntable`)
- **For:** healthcare; picked first when the site mentions "dental", "dentist", "orthodont", "optician", "vision", "eye", "vet", "veterinary"
- **Object and motion:** capsules, turntable
- **Signature moment:** The practice name in large, light type with the object turning between the halves; captions like spec labels.
- **Storyboard:** 1. Hook: type sandwich, light palette 2. Specs strip: hours, call, location 3. Treatments list 4. Team 5. Contact
- **Recipes:** 17, 3, 15

## Accounting and finance

### Rising stacks (`coin-stack`)
- **For:** accounting; picked first when the site mentions "accounting", "accountant", "bookkeeping", "tax", "cpa"
- **Object and motion:** coins, stack
- **Signature moment:** Coin stacks rise and separate layer by layer as services appear; real numbers from the content count up.
- **Storyboard:** 1. Hook: precise headline 2. Stack chapter 3. Services list 4. Process timeline (only if sequential) 5. Contact
- **Recipes:** 2, 16, 3, 15

### Ledger orbit (`ledger-orbit`)
- **For:** accounting, services; picked first when the site mentions "finance", "financial", "advisory", "wealth", "insurance", "audit"
- **Object and motion:** coins, orbit
- **Signature moment:** The camera orbits coin stacks while thin lines draw across the page.
- **Storyboard:** 1. Hook 2. Orbit chapter 3. Services with SVG line drawing 4. Credentials 5. Contact
- **Recipes:** 2, 7, 12, 3

### Coin launch (`coin-turntable`)
- **For:** accounting; picked first when the site mentions "payroll", "consult"
- **Object and motion:** coins, turntable
- **Signature moment:** Giant split name with the coin stacks turning between the halves.
- **Storyboard:** 1. Hook: type sandwich 2. Specs strip 3. Services one at a time 4. Contact
- **Recipes:** 17, 3, 15

## Import and export

### Global routes (`globe-routes`)
- **For:** import_export; picked first when the site mentions "export", "import", "trading", "global", "international"
- **Object and motion:** globe, orbit
- **Signature moment:** The camera orbits a wire globe with containers circling it; route lines draw on scroll.
- **Storyboard:** 1. Hook 2. Globe orbit chapter 3. Services 4. Sectors or countries (only from the content) 5. Contact
- **Recipes:** 2, 7, 12, 3

### Container stack (`container-stack`)
- **For:** import_export, services; picked first when the site mentions "cargo", "freight", "container", "logistics", "shipping", "warehouse", "moving", "removals"
- **Object and motion:** parcel, stack
- **Signature moment:** Stacked crates lift apart level by level like a port crane at work, each with a caption.
- **Storyboard:** 1. Hook: bold headline 2. Stack chapter 3. Services 4. Process (only if sequential) 5. Contact
- **Recipes:** 11, 16, 3, 12

### Globe launch (`globe-turntable`)
- **For:** import_export; picked first when the site mentions "distribution", "wholesale", "sourcing"
- **Object and motion:** globe, turntable
- **Signature moment:** The company name split in giant type with the globe turning between the halves.
- **Storyboard:** 1. Hook: type sandwich 2. Specs strip 3. Services 4. Contact
- **Recipes:** 17, 3, 12

## Local services

### Swiss object (`swiss-gem`)
- **For:** services; picked first when the site mentions "law", "lawyer", "attorney", "notary", "architect", "studio", "agency", "real estate", "realty"
- **Object and motion:** gem, turntable
- **Signature moment:** Strict Swiss grid with one precise object turning in the middle of the name.
- **Storyboard:** 1. Hook: type sandwich 2. Services list 3. Cases or portfolio from the content 4. Contact
- **Recipes:** 17, 3, 5

### Tools apart (`tool-explode`)
- **For:** services; picked first when the site mentions "plumb", "electric", "repair", "construction", "builder", "roof", "clean", "garage", "mechanic", "auto"
- **Object and motion:** parcel, explode
- **Signature moment:** A toolbox-like stack of boxes pulls apart into its parts as the services appear.
- **Storyboard:** 1. Hook 2. Explode chapter 3. Services 4. Area served (only from the content) 5. Contact
- **Recipes:** 2, 7, 3

### Quiet orbit (`rings-orbit-services`)
- **For:** services; picked first when the site mentions "photograph", "wedding", "event", "travel", "school", "tutor"
- **Object and motion:** rings, orbit
- **Signature moment:** Rings turn slowly while the camera orbits, with a gallery of the business's photos after.
- **Storyboard:** 1. Hook 2. Orbit chapter 3. Gallery: pinned horizontal 4. Services 5. Contact
- **Recipes:** 2, 7, 6, 3

