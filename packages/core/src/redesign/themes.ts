import type { CategoryId } from "../types";

/** Which category-specific 3D object the feature scene renders. */
export type ObjectKind =
  | "rings" | "dumbbell" | "capsules" | "coins" | "globe" | "cup" | "gem"
  | "burger" | "pizza" | "glass" | "kettlebell" | "perfume" | "parcel" | "ribbon";

export interface Service {
  title: string;
  text: string;
  icon: string; // inline SVG path data, 24x24 stroke icon
}

export interface Theme {
  label: string;
  fonts: string; // Google Fonts css2 family query
  display: string;
  body: string;
  displayWeight: number;
  displayTracking: string;
  dark: boolean;
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  accentInk: string;
  object: ObjectKind;
  photos: string[]; // Unsplash photo ids (license allows hotlinking via images.unsplash.com)
  tagline: string;
  statement: string;
  cta: string;
  services: Service[];
}

const I = {
  plate: "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0M7.5 12a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0",
  leaf: "M5 19c0-8 6-14 14-14c0 8-6 14-14 14zM5 19l7-7",
  glass: "M8 3h8l-1 7a3 3 0 0 1-6 0zM12 13v8M8 21h8",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  bolt: "M13 2L4 14h7l-1 8l9-12h-7z",
  dumbbell: "M2 12h20M5 8v8M8 6v12M16 6v12M19 8v8",
  users: "M9 11a4 4 0 1 0 0-8a4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7M18 14a6 6 0 0 1 4 6v1",
  heart: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z",
  stetho: "M6 3v6a4 4 0 0 0 8 0V3M10 13v3a5 5 0 0 0 10 0v-2M20 12a2 2 0 1 0 0-4a2 2 0 0 0 0 4",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9c-4.5-1-8-4-8-9V6z M9 12l2 2l4-4",
  clock: "M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18zM12 7v5l3 2",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  doc: "M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h6",
  coins: "M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3s-8 1.3-8 3s3.6 3 8 3zM4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  handshake: "M2 12l5-5l4 2l4-2l7 5M7 14l3 3a2 2 0 0 0 3 0l4-4M2 12l5 5",
  globe: "M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18zM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18",
  box: "M3 7l9-4l9 4v10l-9 4l-9-4zM3 7l9 4l9-4M12 11v10",
  truck: "M2 6h12v10H2zM14 10h4l4 4v2h-8M6 19a2 2 0 1 0 0-4a2 2 0 0 0 0 4zM18 19a2 2 0 1 0 0-4a2 2 0 0 0 0 4",
  check: "M4 12l5 5L20 6",
  cup: "M5 8h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 10h2a2 2 0 0 1 0 4h-2M8 3v2M11 3v2",
  scissors: "M6 9a3 3 0 1 0 0-6a3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6a3 3 0 0 0 0 6zM8.1 7.9L20 20M8.1 16.1L20 4",
  tag: "M3 12V4h8l10 10l-8 8zM7.5 7.5h.01",
  bag: "M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0",
  star: "M12 3l2.7 5.6l6.1.9l-4.4 4.3l1 6.1L12 17l-5.4 2.9l1-6.1L3.2 9.5l6.1-.9z",
};

export const THEMES: Record<CategoryId, Theme> = {
  cafe: {
    label: "Café",
    fonts: "family=DM+Serif+Display&family=DM+Sans:wght@400;500;700",
    display: "'DM Serif Display', Georgia, serif",
    body: "'DM Sans', system-ui, sans-serif",
    displayWeight: 400, displayTracking: "-0.01em", dark: false,
    bg: "#f6efe8", surface: "#fffaf5", ink: "#2b1d16", muted: "#7c6556", line: "rgba(43,29,22,.12)", accent: "#b4532a", accentInk: "#fff6ef",
    object: "cup",
    photos: ["1501339847302-ac426a4a7cbb", "1495474472287-4d71bcdd2085", "1554118811-1e0d58224f24", "1509042239860-f550ce710b93", "1442512595331-e89e73853f31", "1447933601403-0c6688de566e"],
    tagline: "Good coffee, fresh bakes and a seat that's yours for as long as you like.",
    statement: "Every cup is made to order by people who care how it tastes.",
    cta: "Visit us today",
    services: [
      { title: "Specialty coffee", text: "Carefully sourced beans, brewed the way you like.", icon: I.cup },
      { title: "Fresh food", text: "Pastries and light meals prepared every day.", icon: I.leaf },
      { title: "Take away", text: "Order ahead or grab something on the go.", icon: I.bag },
      { title: "Open daily", text: "A comfortable place to meet, work or relax.", icon: I.clock },
    ],
  },
  salon: {
    label: "Salon",
    fonts: "family=Playfair+Display:wght@500;700&family=Source+Sans+3:wght@400;600",
    display: "'Playfair Display', Georgia, serif",
    body: "'Source Sans 3', system-ui, sans-serif",
    displayWeight: 500, displayTracking: "-0.015em", dark: false,
    bg: "#fbf3f2", surface: "#ffffff", ink: "#2a1418", muted: "#7f5f64", line: "rgba(42,20,24,.1)", accent: "#c2405a", accentInk: "#ffffff",
    object: "gem",
    photos: ["1560066984-138dadb4c035", "1522337360788-8b13dee7a37e", "1562322140-8baeececf3df", "1600948836101-f9ffda59d250", "1521590832167-7bcbfaa6381f"],
    tagline: "Expert hands, a calm space and a look you'll love leaving with.",
    statement: "Great work starts with listening, so every appointment begins with what you want.",
    cta: "Book an appointment",
    services: [
      { title: "Cuts & styling", text: "Precision cuts and styling for every occasion.", icon: I.scissors },
      { title: "Colour", text: "From subtle tones to bold changes.", icon: I.star },
      { title: "Treatments", text: "Care that keeps hair and skin healthy.", icon: I.heart },
      { title: "Easy booking", text: "Choose a time that suits you.", icon: I.calendar },
    ],
  },
  clothing: {
    label: "Fashion",
    fonts: "family=Bebas+Neue&family=Karla:wght@400;500;700",
    display: "'Bebas Neue', Impact, sans-serif",
    body: "'Karla', system-ui, sans-serif",
    displayWeight: 400, displayTracking: "0.01em", dark: true,
    bg: "#121212", surface: "#1c1c1c", ink: "#efefef", muted: "#a3a3a3", line: "rgba(239,239,239,.1)", accent: "#e8ff5a", accentInk: "#141600",
    object: "gem",
    photos: ["1441986300917-64674bd600d8", "1489987707025-afc232f7ea0f", "1445205170230-053b83016050", "1567401893414-76b7b1e5a7a5", "1490481651871-ab68de25d43d", "1555529669-e69e7aa0ba9a"],
    tagline: "Pieces chosen with care, for the way you actually live.",
    statement: "Fewer, better things: clothing picked for quality, fit and how long it will last.",
    cta: "Visit the store",
    services: [
      { title: "New arrivals", text: "Fresh pieces in store every season.", icon: I.tag },
      { title: "Styling help", text: "Advice on fit, size and what works together.", icon: I.star },
      { title: "Quality first", text: "Brands and fabrics we're proud to stock.", icon: I.check },
      { title: "Easy shopping", text: "Friendly service in store and over the phone.", icon: I.bag },
    ],
  },
  retail: {
    label: "Shop",
    fonts: "family=Syne:wght@600;700;800&family=Work+Sans:wght@400;500",
    display: "'Syne', system-ui, sans-serif",
    body: "'Work Sans', system-ui, sans-serif",
    displayWeight: 700, displayTracking: "-0.02em", dark: false,
    bg: "#fdfbf2", surface: "#ffffff", ink: "#1c1a0e", muted: "#6b6750", line: "rgba(28,26,14,.11)", accent: "#e05a00", accentInk: "#ffffff",
    object: "gem",
    photos: ["1528698827591-e19ccd7bc23d", "1472851294608-062f824d29cc", "1534452203293-494d7ddbf7e0", "1604719312566-8912e9227c6a", "1555529669-e69e7aa0ba9a"],
    tagline: "A local shop with things worth coming back for.",
    statement: "We choose every product ourselves, so you can trust what's on the shelf.",
    cta: "Visit the shop",
    services: [
      { title: "Carefully chosen range", text: "Products we know and recommend.", icon: I.tag },
      { title: "Local service", text: "Friendly advice from people who know the products.", icon: I.users },
      { title: "Gifts", text: "Ideas and wrapping for every occasion.", icon: I.box },
      { title: "Open daily", text: "Drop in whenever it suits you.", icon: I.clock },
    ],
  },
  services: {
    label: "Local services",
    fonts: "family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter+Tight:wght@400;500;600",
    display: "'Fraunces', Georgia, serif",
    body: "'Inter Tight', system-ui, sans-serif",
    displayWeight: 400, displayTracking: "-0.02em", dark: false,
    bg: "#f3f5fb", surface: "#ffffff", ink: "#0e1838", muted: "#56607f", line: "rgba(14,24,56,.1)", accent: "#2448d8", accentInk: "#ffffff",
    object: "gem",
    photos: ["1497366216548-37526070297c", "1497215728101-856f4ea42174", "1521737604893-d14cc237f11d", "1504384308090-c894fdcc538d", "1556761175-5973dc0f32e7"],
    tagline: "Reliable, professional service from people who answer the phone.",
    statement: "Clear advice, fair prices and work done properly the first time.",
    cta: "Get in touch",
    services: [
      { title: "Consultation", text: "We start by understanding exactly what you need.", icon: I.users },
      { title: "Clear quotes", text: "Transparent pricing before any work begins.", icon: I.doc },
      { title: "Quality work", text: "Done carefully and on schedule.", icon: I.check },
      { title: "Local and responsive", text: "Easy to reach when you need us.", icon: I.clock },
    ],
  },
  restaurant: {
    label: "Restaurant",
    fonts: "family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Manrope:wght@400;500;600",
    display: "'Cormorant Garamond', Georgia, serif",
    body: "'Manrope', system-ui, sans-serif",
    displayWeight: 500,
    displayTracking: "-0.01em",
    dark: true,
    bg: "#15110e", surface: "#1f1914", ink: "#f4ede3", muted: "#b6a893", line: "rgba(244,237,227,.12)",
    accent: "#d6a55c", accentInk: "#1b130b",
    object: "rings",
    photos: ["1517248135467-4c7edcad34c4", "1414235077428-338989a2e8c0", "1555396273-367ea4eb4db5", "1504674900247-0877df9cc836", "1559339352-11d035aa65de", "1600891964092-4316c288032e"],
    tagline: "Honest cooking, a warm room and a table that's ready when you are.",
    statement: "Good food is the reason people come. The way they feel at the table is the reason they come back.",
    cta: "Reserve a table",
    services: [
      { title: "Seasonal menu", text: "Dishes that change with what the market brings in each week.", icon: I.leaf },
      { title: "Private dining", text: "Space for birthdays, business dinners and family celebrations.", icon: I.glass },
      { title: "Made in our kitchen", text: "Sauces, breads and desserts prepared from scratch every day.", icon: I.plate },
      { title: "Easy reservations", text: "Call ahead or drop in. Walk-ins are always welcome.", icon: I.calendar },
    ],
  },
  gym: {
    label: "Fitness",
    fonts: "family=Archivo:wdth,wght@62..125,400..900",
    display: "'Archivo', Impact, sans-serif",
    body: "'Archivo', system-ui, sans-serif",
    displayWeight: 850,
    displayTracking: "-0.02em",
    dark: true,
    bg: "#0d0e11", surface: "#17191d", ink: "#f2f2ef", muted: "#9b9fa8", line: "rgba(242,242,239,.1)",
    accent: "#ff5b1f", accentInk: "#140600",
    object: "dumbbell",
    photos: ["1534438327276-14e5300c3a48", "1517836357463-d25dfeac3438", "1571019614242-c5c5dee9f50b", "1540497077202-7c8a3999166f", "1583454110551-21f2fa2afe61", "1576678927484-cc907957088c"],
    tagline: "Real equipment, real coaching and a floor that keeps you moving.",
    statement: "Progress isn't luck. It's a plan, the right equipment and people who notice when you show up.",
    cta: "Start training",
    services: [
      { title: "Strength floor", text: "Racks, platforms, free weights and machines for every level.", icon: I.dumbbell },
      { title: "Personal coaching", text: "Programs built around your goals, with check-ins that keep you honest.", icon: I.users },
      { title: "Group classes", text: "High-energy sessions on a weekly schedule you can plan around.", icon: I.bolt },
      { title: "Flexible membership", text: "Simple plans with no surprises. Try a session before you commit.", icon: I.calendar },
    ],
  },
  healthcare: {
    label: "Healthcare",
    fonts: "family=Plus+Jakarta+Sans:wght@400;500;600;700",
    display: "'Plus Jakarta Sans', system-ui, sans-serif",
    body: "'Plus Jakarta Sans', system-ui, sans-serif",
    displayWeight: 600,
    displayTracking: "-0.03em",
    dark: false,
    bg: "#f4f7f9", surface: "#ffffff", ink: "#0f2537", muted: "#566b7d", line: "rgba(15,37,55,.1)",
    accent: "#16798a", accentInk: "#ffffff",
    object: "capsules",
    photos: ["1631217868264-e5b90bb7e133", "1519494026892-80bbd2d6fd0d", "1629909613654-28e377c37b09", "1576091160399-112ba8d25d1d", "1584982751601-97dcc096659c"],
    tagline: "Attentive care from a team that takes the time to listen.",
    statement: "Good care starts with being heard. We take the time to understand you before we recommend anything.",
    cta: "Book an appointment",
    services: [
      { title: "Consultations", text: "Unhurried appointments focused on what matters to you.", icon: I.stetho },
      { title: "Treatment plans", text: "Clear next steps, explained in plain language.", icon: I.heart },
      { title: "Prevention", text: "Check-ups and advice that help you stay well.", icon: I.shield },
      { title: "Short waiting times", text: "Appointments that respect your schedule.", icon: I.clock },
    ],
  },
  accounting: {
    label: "Accounting",
    fonts: "family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter+Tight:wght@400;500;600",
    display: "'Fraunces', Georgia, serif",
    body: "'Inter Tight', system-ui, sans-serif",
    displayWeight: 400,
    displayTracking: "-0.02em",
    dark: false,
    bg: "#f1f3f5", surface: "#ffffff", ink: "#121d2c", muted: "#5a6577", line: "rgba(18,29,44,.11)",
    accent: "#235c4b", accentInk: "#ffffff",
    object: "coins",
    photos: ["1554224155-6726b3ff858f", "1460925895917-afdab827c52f", "1450101499163-c8848c66ca85", "1551836022-d5d88e9218df", "1521791136064-7986c2920216"],
    tagline: "Clear numbers, filings on time and advice you can act on.",
    statement: "You run the business. We make sure the numbers are right, the deadlines are met and nothing comes as a surprise.",
    cta: "Schedule a consultation",
    services: [
      { title: "Tax returns", text: "Personal and business filings prepared accurately and on time.", icon: I.doc },
      { title: "Bookkeeping", text: "Monthly books you can rely on when decisions need to be made.", icon: I.chart },
      { title: "Payroll", text: "Wages, contributions and reporting handled every cycle.", icon: I.coins },
      { title: "Advisory", text: "Planning that helps you keep more of what you earn.", icon: I.handshake },
    ],
  },
  import_export: {
    label: "Import & Export",
    fonts: "family=Sora:wght@400;600;700&family=Inter+Tight:wght@400;500",
    display: "'Sora', system-ui, sans-serif",
    body: "'Inter Tight', system-ui, sans-serif",
    displayWeight: 600,
    displayTracking: "-0.035em",
    dark: true,
    bg: "#0a1424", surface: "#111f35", ink: "#eaf0f7", muted: "#93a5bd", line: "rgba(234,240,247,.11)",
    accent: "#45aef5", accentInk: "#04121f",
    object: "globe",
    photos: ["1494412574643-ff11b0a5c1c3", "1605745341112-85968b19335b", "1578575437130-527eed3abbec", "1586528116311-ad8dd3c8310d", "1601584115197-04ecc0da31d7", "1566576721346-d4a3b4eaeb55"],
    tagline: "Dependable sourcing, shipping and customs across borders.",
    statement: "Every shipment carries someone's business. We treat it that way, from the first quote to the final delivery.",
    cta: "Request a quote",
    services: [
      { title: "Global sourcing", text: "A vetted network of suppliers across continents.", icon: I.globe },
      { title: "Freight & logistics", text: "Sea, air and road shipments planned end to end.", icon: I.truck },
      { title: "Customs clearance", text: "Documentation and compliance handled correctly.", icon: I.check },
      { title: "Warehousing", text: "Storage and distribution where you need it.", icon: I.box },
    ],
  },
};

export function photoUrl(id: string, w: number): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
}
