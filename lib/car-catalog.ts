export interface CarBrand {
  id: string;
  name: string;
  color: string;
  /** Filename inside public/BrandLogo. Empty string falls back to the generic icon. */
  logo: string;
  models: string[];
}

export const CAR_BRANDS: CarBrand[] = [
  { id: "maruti", name: "Maruti Suzuki", color: "#0B6BB3", logo: "maruti-suzuki-india-seeklogo.png", models: ["Swift", "Baleno", "Brezza", "Ertiga", "WagonR", "Fronx"] },
  { id: "hyundai", name: "Hyundai", color: "#0B3C8A", logo: "hyundai-seeklogo.png", models: ["i20", "Creta", "Venue", "Verna", "Exter", "Alcazar"] },
  { id: "tata", name: "Tata Motors", color: "#1E3A5F", logo: "tata-motors-seeklogo.png", models: ["Nexon", "Punch", "Harrier", "Altroz", "Tiago", "Safari"] },
  { id: "mahindra", name: "Mahindra", color: "#B32021", logo: "mahindra-suvs-seeklogo.png", models: ["XUV700", "Scorpio-N", "Thar", "Bolero", "XUV300"] },
  { id: "toyota", name: "Toyota", color: "#C8102E", logo: "toyota-seeklogo.png", models: ["Urban Cruiser", "Glanza", "Innova Crysta", "Fortuner", "Camry"] },
  { id: "honda", name: "Honda", color: "#E4002B", logo: "honda-seeklogo.png", models: ["City", "Amaze", "Elevate"] },
  { id: "kia", name: "Kia", color: "#05141F", logo: "kia-new-2021-seeklogo.png", models: ["Seltos", "Sonet", "Carens"] },
  { id: "mg", name: "MG Motor", color: "#E4022A", logo: "mg-seeklogo.png", models: ["Hector", "Astor", "Comet EV", "ZS EV"] },
  { id: "skoda", name: "Skoda", color: "#0E3B2E", logo: "skoda-seeklogo.png", models: ["Slavia", "Kushaq", "Kodiaq"] },
  { id: "vw", name: "Volkswagen", color: "#00437A", logo: "volkswagen-seeklogo.png", models: ["Virtus", "Taigun", "Tiguan"] },
  { id: "renault", name: "Renault", color: "#FFCC00", logo: "renault-new-2021-seeklogo.png", models: ["Kwid", "Triber", "Kiger"] },
  { id: "nissan", name: "Nissan", color: "#C3002F", logo: "nissan-seeklogo.png", models: ["Magnite"] },
  { id: "audi", name: "Audi", color: "#BB0A30", logo: "audi-seeklogo.png", models: ["A4", "A6", "Q3", "Q5", "Q7"] },
  { id: "bentley", name: "Bentley", color: "#00594F", logo: "bentley-motors-seeklogo.png", models: ["Continental GT", "Flying Spur", "Bentayga"] },
  { id: "bmw", name: "BMW", color: "#0066B1", logo: "bmw-seeklogo.png", models: ["3 Series", "5 Series", "X1", "X5", "X7"] },
  { id: "citroen", name: "Citroën", color: "#C0111D", logo: "citroen-2009-seeklogo.png", models: ["C3", "C5 Aircross", "eC3"] },
  { id: "ferrari", name: "Ferrari", color: "#D40000", logo: "ferrari-seeklogo.png", models: ["Roma", "Portofino", "296 GTB", "SF90 Stradale"] },
  { id: "jeep", name: "Jeep", color: "#424E36", logo: "jeep-seeklogo.png", models: ["Compass", "Meridian", "Wrangler"] },
  { id: "land-rover", name: "Land Rover", color: "#005A2B", logo: "land-rover-seeklogo.png", models: ["Defender", "Discovery", "Range Rover", "Range Rover Evoque"] },
  { id: "lexus", name: "Lexus", color: "#1A1A1A", logo: "lexus-seeklogo.png", models: ["ES", "NX", "RX", "LX"] },
  { id: "mercedes-benz", name: "Mercedes-Benz", color: "#1C1C1C", logo: "mercedes-benz-seeklogo.png", models: ["C-Class", "E-Class", "GLA", "GLC", "S-Class"] },
  { id: "maserati", name: "Maserati", color: "#041E42", logo: "meserati.jpeg", models: ["Ghibli", "Levante", "Grecale"] },
  { id: "mini", name: "Mini Cooper", color: "#76BB43", logo: "mini-cooper-seeklogo.png", models: ["Cooper", "Countryman", "Clubman"] },
  { id: "porsche", name: "Porsche", color: "#000000", logo: "porsche-seeklogo.png", models: ["911", "Cayenne", "Macan", "Panamera", "Taycan"] },
  { id: "rolls-royce", name: "Rolls-Royce", color: "#0B0B0B", logo: "rolls-royce-seeklogo.png", models: ["Ghost", "Phantom", "Cullinan"] },
  { id: "volvo", name: "Volvo", color: "#003057", logo: "volvo-seeklogo.png", models: ["XC40", "XC60", "XC90", "S60"] },
];

export const DEFAULT_BRAND_COLOR = "#6B7280";

export function findBrand(name: string): CarBrand | undefined {
  return CAR_BRANDS.find((b) => b.name.toLowerCase() === name.toLowerCase());
}

export function getBrandColor(name: string): string {
  return findBrand(name)?.color ?? DEFAULT_BRAND_COLOR;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Real brand logos live in public/BrandLogo, named per CarBrand.logo.
 * BrandIcon falls back to the generic colored icon if a brand has no logo set.
 */
export function getBrandLogoPath(brandId: string): string | undefined {
  const logo = CAR_BRANDS.find((b) => b.id === brandId)?.logo;
  return logo ? `/BrandLogo/${logo}` : undefined;
}

/**
 * Expected drop-in location for a model's real photo:
 * public/car-photos/{brandId}/{slugified-model}.jpg. CarPhoto renders
 * nothing if the file isn't there.
 */
export function getCarPhotoPath(brandId: string, model: string): string {
  return `/car-photos/${brandId}/${slugify(model)}.jpg`;
}
