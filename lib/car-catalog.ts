export interface CarBrand {
  id: string;
  name: string;
  color: string;
  models: string[];
}

export const CAR_BRANDS: CarBrand[] = [
  { id: "maruti", name: "Maruti Suzuki", color: "#0B6BB3", models: ["Swift", "Baleno", "Brezza", "Ertiga", "WagonR", "Fronx"] },
  { id: "hyundai", name: "Hyundai", color: "#0B3C8A", models: ["i20", "Creta", "Venue", "Verna", "Exter", "Alcazar"] },
  { id: "tata", name: "Tata Motors", color: "#1E3A5F", models: ["Nexon", "Punch", "Harrier", "Altroz", "Tiago", "Safari"] },
  { id: "mahindra", name: "Mahindra", color: "#B32021", models: ["XUV700", "Scorpio-N", "Thar", "Bolero", "XUV300"] },
  { id: "toyota", name: "Toyota", color: "#C8102E", models: ["Urban Cruiser", "Glanza", "Innova Crysta", "Fortuner", "Camry"] },
  { id: "honda", name: "Honda", color: "#E4002B", models: ["City", "Amaze", "Elevate"] },
  { id: "kia", name: "Kia", color: "#05141F", models: ["Seltos", "Sonet", "Carens"] },
  { id: "mg", name: "MG Motor", color: "#E4022A", models: ["Hector", "Astor", "Comet EV", "ZS EV"] },
  { id: "skoda", name: "Skoda", color: "#0E3B2E", models: ["Slavia", "Kushaq", "Kodiaq"] },
  { id: "vw", name: "Volkswagen", color: "#00437A", models: ["Virtus", "Taigun", "Tiguan"] },
  { id: "renault", name: "Renault", color: "#FFCC00", models: ["Kwid", "Triber", "Kiger"] },
  { id: "nissan", name: "Nissan", color: "#C3002F", models: ["Magnite"] },
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
 * Expected drop-in location for a brand's real logo: public/brand-logos/{id}.svg.
 * BrandIcon falls back to the generic colored icon if the file isn't there.
 */
export function getBrandLogoPath(brandId: string): string {
  return `/brand-logos/${brandId}.svg`;
}

/**
 * Expected drop-in location for a model's real photo:
 * public/car-photos/{brandId}/{slugified-model}.jpg. CarPhoto renders
 * nothing if the file isn't there.
 */
export function getCarPhotoPath(brandId: string, model: string): string {
  return `/car-photos/${brandId}/${slugify(model)}.jpg`;
}
