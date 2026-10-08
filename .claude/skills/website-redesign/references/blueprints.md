# Layout templates

Generated from `packages/core/src/redesign/blueprints.ts` by `npm run skill:catalog`. Do not edit by hand.

Every redesign is assigned one template in `content.json → designDirection.layoutTemplate`, chosen from the
business's category and words in its name and content (pizza, dental, barber…) and rotated so consecutive
redesigns differ. Follow its hero layout, mood and home-page sections, filling every section with the site's own
content. Pattern numbers refer to [patterns.md](patterns.md).

## Restaurants

### Chef's table (`chefs-table`)
- **For:** restaurant; picked first when the site mentions "restaurant", "kitchen", "cuisine", "dining", "chef", "tasting"
- **Hero and mood:** fullbleed, dark
- **First impression:** A full-screen photograph of the food or dining room, the restaurant's name set large in a refined serif, one booking button.
- **Home page:** 1. Full-bleed photo hero with name, one line from the site and a reservation button 2. Short introduction in large type 3. Menu: categories as headings, dishes with descriptions and prices in two clean columns 4. Story or chef section: photo beside text 5. Opening hours and location with map 6. Reservation band and footer
- **Patterns:** 1, 2, 3, 4, 6, 8

### Neighbourhood bistro (`neighbourhood-bistro`)
- **For:** restaurant, cafe; picked first when the site mentions "bistro", "brasserie", "wine", "bar", "tapas", "trattoria", "osteria", "pub"
- **Hero and mood:** split, any
- **First impression:** Name, opening hours and address on the left; a large photograph on the right. Feels like a well-kept local favourite.
- **Home page:** 1. Split hero: name, hours and address beside a large photo 2. Menu by category with prices 3. Photo grid of the room and dishes 4. About text in a single readable column 5. Visit: map, hours, phone
- **Patterns:** 1, 2, 3, 5, 6

### Pizzeria (`pizzeria`)
- **For:** restaurant; picked first when the site mentions "pizza", "pizzeria", "napoli", "napoletana", "forno", "wood fired", "wood-fired", "calzone"
- **Hero and mood:** fullbleed, dark
- **First impression:** A warm full-bleed photograph of pizza or the oven, bold name, order and call buttons side by side.
- **Home page:** 1. Full-bleed hero with order and call buttons 2. Menu first: pizzas and prices, then other sections 3. Short story with photo 4. Hours and locations 5. Order band and footer
- **Patterns:** 1, 2, 3, 4, 6

### Burger joint (`burger-joint`)
- **For:** restaurant, cafe; picked first when the site mentions "burger", "smash", "grill", "diner", "bbq", "barbecue", "fries", "hot dog", "street food", "biscuit"
- **Hero and mood:** editorial, light
- **First impression:** A confident headline in a heavy sans, a big appetising photo beneath it, order buttons for each location.
- **Home page:** 1. Headline hero with a large photo and order buttons 2. Menu with clear prices; specials highlighted 3. Locations side by side with hours and phone 4. Photo strip 5. FAQ or notes from the site 6. Footer
- **Patterns:** 1, 3, 5, 6, 7

## Cafés and bakeries

### Morning café (`morning-cafe`)
- **For:** cafe; picked first when the site mentions "coffee", "espresso", "café", "cafe", "latte", "tea", "brunch", "breakfast"
- **Hero and mood:** split, light
- **First impression:** Soft daylight photography beside a calm serif headline, hours visible straight away.
- **Home page:** 1. Split hero with hours under the name 2. Drinks and food lists in columns 3. Photo grid of the space 4. About text 5. Visit
- **Patterns:** 1, 2, 3, 5, 6

### Bakery window (`bakery-window`)
- **For:** cafe, retail; picked first when the site mentions "bakery", "pastry", "patisserie", "croissant", "bread", "cake", "donut", "dessert", "ice cream", "gelato"
- **Hero and mood:** editorial, light
- **First impression:** An editorial headline above a wide photograph of the counter or bakes, like a shop window.
- **Home page:** 1. Editorial hero: headline above a wide photo 2. Today's bakes / menu with prices 3. Ordering or pickup information 4. Story 5. Visit
- **Patterns:** 1, 3, 5, 6

### Roastery (`roastery`)
- **For:** cafe; picked first when the site mentions "roast", "roastery", "beans", "brew", "barista"
- **Hero and mood:** fullbleed, dark
- **First impression:** A dark full-bleed photograph of coffee, light type, quiet and premium.
- **Home page:** 1. Full-bleed hero 2. Coffees and brew methods as a list 3. Process (only if the site describes it in steps) 4. Café locations 5. Footer
- **Patterns:** 1, 2, 3, 6

## Gyms and studios

### Strength club (`strength-club`)
- **For:** gym; picked first when the site mentions "gym", "fitness", "strength", "training", "powerlifting", "barbell", "crossfit"
- **Hero and mood:** fullbleed, dark
- **First impression:** A high-contrast full-bleed training photograph, a strong condensed headline, join and timetable buttons.
- **Home page:** 1. Full-bleed hero with join and timetable buttons 2. What the gym offers in a three-column grid 3. Class timetable as a table 4. Coaches with portraits (only people named on the site) 5. Membership options as listed 6. Visit and footer
- **Patterns:** 1, 3, 4, 7, 6

### Calm studio (`calm-studio`)
- **For:** gym, salon; picked first when the site mentions "yoga", "pilates", "barre", "meditation", "stretch", "wellness"
- **Hero and mood:** split, light
- **First impression:** Airy split layout: a serene photograph beside generous whitespace and a light serif headline.
- **Home page:** 1. Split hero 2. Classes listed with times 3. Teachers 4. Pricing as listed 5. Studio location
- **Patterns:** 1, 2, 3, 5, 6

### Fight gym (`fight-gym`)
- **For:** gym; picked first when the site mentions "boxing", "martial", "mma", "jiu", "karate", "kickboxing"
- **Hero and mood:** editorial, dark
- **First impression:** A bold editorial headline over a gritty photograph, schedule front and centre.
- **Home page:** 1. Editorial hero 2. Schedule table 3. Programmes 4. Coaches 5. Join
- **Patterns:** 1, 3, 4, 7

## Salons and beauty

### Salon atelier (`salon-atelier`)
- **For:** salon; picked first when the site mentions "salon", "hair", "stylist", "colour", "color", "bridal", "blow"
- **Hero and mood:** editorial, light
- **First impression:** Fashion-magazine layout: a refined serif headline, a tall portrait photograph, services in an elegant price list.
- **Home page:** 1. Editorial hero with a tall photo 2. Services and prices in an elegant two-column list 3. Team portraits 4. Gallery of work 5. Book and visit
- **Patterns:** 1, 2, 3, 5, 6

### Spa retreat (`spa-retreat`)
- **For:** salon; picked first when the site mentions "spa", "massage", "facial", "skin", "skincare", "aesthetic", "beauty", "nails", "lash", "brow"
- **Hero and mood:** fullbleed, light
- **First impression:** A soft full-bleed photograph with a calm overlay, treatments listed clearly with durations and prices.
- **Home page:** 1. Full-bleed hero 2. Treatments with durations and prices 3. Packages (if listed) 4. About the space 5. Book
- **Patterns:** 1, 3, 2, 6

### Barber shop (`barber-shop`)
- **For:** salon; picked first when the site mentions "barber", "barbershop", "shave", "fade", "grooming"
- **Hero and mood:** split, dark
- **First impression:** Dark, classic split layout: photo of the shop, cuts and prices in a clean list, walk-in hours.
- **Home page:** 1. Split hero with hours 2. Cuts and prices 3. Barbers 4. Visit
- **Patterns:** 1, 3, 6

## Clothing and fashion

### Lookbook (`lookbook`)
- **For:** clothing; picked first when the site mentions "collection", "fashion", "apparel", "wear", "denim", "streetwear"
- **Hero and mood:** fullbleed, any
- **First impression:** Photography first: a full-bleed campaign image and minimal type, then a large photo grid.
- **Home page:** 1. Full-bleed campaign hero 2. Collection photo grid with captions 3. Brand story in a single column 4. Store information 5. Footer
- **Patterns:** 1, 5, 2, 6

### Boutique (`boutique`)
- **For:** clothing, retail; picked first when the site mentions "boutique", "clothing", "dress", "accessories", "shoes"
- **Hero and mood:** editorial, light
- **First impression:** Editorial headline with an asymmetric pair of photographs, like a printed magazine spread.
- **Home page:** 1. Editorial hero with two photos 2. Categories as image tiles 3. About the shop 4. Visit
- **Patterns:** 1, 5, 2, 6

### Tailor's atelier (`tailor-atelier`)
- **For:** clothing, services; picked first when the site mentions "tailor", "bespoke", "suit", "made to measure", "alterations", "saree", "sari", "lehenga", "ethnic", "textile", "fabric"
- **Hero and mood:** split, dark
- **First impression:** Dark, crafted split layout: a close-up of fabric or tailoring beside a serif headline; the craft explained in steps only when the site describes them.
- **Home page:** 1. Split hero 2. Services or garments with prices if listed 3. Craft or process (only if sequential on the site) 4. Gallery 5. Appointment
- **Patterns:** 1, 2, 5, 3, 6

## Retail shops

### Shopfront (`shopfront`)
- **For:** retail; picked first when the site mentions "shop", "store", "market", "goods", "home", "books", "toys", "gift", "flowers", "florist"
- **Hero and mood:** split, light
- **First impression:** A friendly split hero with the shop photo, opening hours and address immediately visible.
- **Home page:** 1. Split hero with hours 2. Product categories as photo tiles 3. Featured items from the site 4. About 5. Visit
- **Patterns:** 1, 5, 3, 6

### Jeweller (`jeweller`)
- **For:** retail, salon; picked first when the site mentions "jewel", "jewelry", "jewellery", "watch", "gold", "diamond", "ring"
- **Hero and mood:** centered, dark
- **First impression:** Quiet luxury: a centred serif headline, lots of space, one beautiful product photograph.
- **Home page:** 1. Centred hero 2. Collections 3. Craft / about 4. Appointment and visit
- **Patterns:** 1, 2, 5, 6

### Supply store (`supply-store`)
- **For:** retail, import_export; picked first when the site mentions "hardware", "supply", "supplies", "electronics", "tools", "parts", "delivery", "online"
- **Hero and mood:** editorial, light
- **First impression:** Practical and clear: headline, category list, delivery and contact details up top.
- **Home page:** 1. Editorial hero with key contact details 2. Categories list 3. Brands or products from the site 4. Delivery / service info 5. Contact
- **Patterns:** 1, 3, 7, 6

## Healthcare

### Family practice (`family-practice`)
- **For:** healthcare; picked first when the site mentions "clinic", "medical", "health", "doctor", "practice", "family", "care", "physio", "therapy", "rehab"
- **Hero and mood:** split, light
- **First impression:** Reassuring split layout: a calm photo, the practice name, phone and booking in the first screen.
- **Home page:** 1. Split hero with phone and booking 2. Services as a clear list 3. First visit / patient information 4. Team (only named on the site) 5. Location, hours, contact
- **Patterns:** 1, 3, 7, 6

### Dental clinic (`dental-clinic`)
- **For:** healthcare; picked first when the site mentions "dental", "dentist", "orthodont", "teeth", "implant", "smile", "optician", "vision", "eye"
- **Hero and mood:** editorial, light
- **First impression:** Clean and bright: a light editorial headline, one clinical-quality photo, treatments in clear groups.
- **Home page:** 1. Editorial hero 2. Treatments grouped by type 3. Insurance / payment information if listed 4. Team 5. Book and visit
- **Patterns:** 1, 3, 7, 6

### Therapy room (`therapy-room`)
- **For:** healthcare; picked first when the site mentions "psycholog", "counsel", "therapist", "mental", "kinder", "child", "vet", "veterinary"
- **Hero and mood:** centered, light
- **First impression:** Calm and personal: a centred headline, warm muted palette, the practitioner's own words up front.
- **Home page:** 1. Centred hero 2. Approach / about in readable prose 3. Services 4. Fees if listed 5. Contact
- **Patterns:** 1, 2, 3, 6

## Accounting and finance

### Trusted advisor (`trusted-advisor`)
- **For:** accounting; picked first when the site mentions "accounting", "accountant", "cpa", "advisory", "consult"
- **Hero and mood:** split, light
- **First impression:** Professional services layout: a clear headline, a photo of the office or team, phone and email up top.
- **Home page:** 1. Split hero with contact details 2. Services in a two-column grid 3. Who they help (only from the site) 4. Credentials as listed 5. Contact
- **Patterns:** 1, 3, 7, 6

### Tax office (`tax-office`)
- **For:** accounting; picked first when the site mentions "tax", "bookkeeping", "payroll", "irs", "returns"
- **Hero and mood:** editorial, light
- **First impression:** Plain and efficient: headline, services list, opening hours and how to get started.
- **Home page:** 1. Editorial hero 2. Services list 3. How to start (only if the site gives steps) 4. Hours and contact
- **Patterns:** 1, 3, 4, 6

### Finance firm (`finance-firm`)
- **For:** accounting, services; picked first when the site mentions "finance", "financial", "wealth", "insurance", "audit", "investment"
- **Hero and mood:** fullbleed, dark
- **First impression:** Corporate and calm: a dark full-bleed city or office photograph, restrained serif headline.
- **Home page:** 1. Full-bleed hero 2. Services 3. Approach in prose 4. Team 5. Contact
- **Patterns:** 1, 2, 3, 6

## Import and export

### Trade house (`trade-house`)
- **For:** import_export; picked first when the site mentions "export", "import", "trading", "international", "global", "sourcing"
- **Hero and mood:** fullbleed, dark
- **First impression:** A full-bleed photograph of a port or warehouse, a confident headline, contact for enquiries.
- **Home page:** 1. Full-bleed hero with enquiry button 2. Products or services 3. Markets / countries (only from the site) 4. About the company 5. Contact
- **Patterns:** 1, 3, 7, 6

### Logistics (`logistics`)
- **For:** import_export, services; picked first when the site mentions "cargo", "freight", "container", "logistics", "shipping", "warehouse", "moving", "removals", "courier"
- **Hero and mood:** split, light
- **First impression:** Clear operational layout: headline and contact beside a photo, services in a clean grid.
- **Home page:** 1. Split hero 2. Services grid 3. Process (only if sequential on the site) 4. Coverage 5. Contact
- **Patterns:** 1, 3, 4, 7, 6

### Wholesale (`wholesale`)
- **For:** import_export, retail; picked first when the site mentions "wholesale", "distribution", "distributor", "bulk", "b2b"
- **Hero and mood:** editorial, light
- **First impression:** Catalogue feel: editorial headline, product categories as photo tiles, trade contact details.
- **Home page:** 1. Editorial hero 2. Product categories 3. Brands 4. Ordering information 5. Contact
- **Patterns:** 1, 5, 3, 6

## Local services

### Law office (`law-office`)
- **For:** services; picked first when the site mentions "law", "lawyer", "attorney", "legal", "notary", "solicitor"
- **Hero and mood:** centered, light
- **First impression:** Measured and authoritative: centred serif headline, practice areas in a clear list, direct contact.
- **Home page:** 1. Centred hero 2. Practice areas 3. Attorneys (only named on the site) 4. Contact
- **Patterns:** 1, 2, 3, 6

### Trades pro (`trades-pro`)
- **For:** services; picked first when the site mentions "plumb", "electric", "repair", "construction", "builder", "roof", "clean", "garage", "mechanic", "auto", "hvac", "landscap"
- **Hero and mood:** split, light
- **First impression:** Get-a-quote layout: phone number and service area in the first screen, a photo of real work.
- **Home page:** 1. Split hero with phone 2. Services list 3. Area served (only from the site) 4. Photos of work 5. Contact
- **Patterns:** 1, 3, 5, 7, 6

### Studio portfolio (`studio-portfolio`)
- **For:** services; picked first when the site mentions "architect", "design", "studio", "agency", "photograph", "wedding", "event", "real estate", "realty"
- **Hero and mood:** fullbleed, any
- **First impression:** Portfolio first: a full-bleed project image, minimal type, then a grid of work.
- **Home page:** 1. Full-bleed hero 2. Project grid with captions 3. Services 4. About 5. Contact
- **Patterns:** 1, 5, 3, 6

