import carModelsByFolder from "@/lib/generated/car-models.json";

export interface CarModel {
  name: string;
  /** Public path to the model's photo, or null if none was found under public/cars. */
  image: string | null;
}

export interface CarBrand {
  id: string;
  name: string;
  color: string;
  /** Filename inside public/BrandLogo. Empty string falls back to the generic icon. */
  logo: string;
  models: CarModel[];
}

interface BrandMeta {
  id: string;
  name: string;
  color: string;
  logo: string;
}

const BRAND_META: BrandMeta[] = [
  { id: "maruti", name: "Maruti Suzuki", color: "#0B6BB3", logo: "maruti-suzuki-india-seeklogo.png" },
  { id: "hyundai", name: "Hyundai", color: "#0B3C8A", logo: "hyundai-seeklogo.png" },
  { id: "tata", name: "Tata Motors", color: "#1E3A5F", logo: "tata-motors-seeklogo.png" },
  { id: "mahindra", name: "Mahindra", color: "#B32021", logo: "mahindra-suvs-seeklogo.png" },
  { id: "toyota", name: "Toyota", color: "#C8102E", logo: "toyota-seeklogo.png" },
  { id: "honda", name: "Honda", color: "#E4002B", logo: "honda-seeklogo.png" },
  { id: "kia", name: "Kia", color: "#05141F", logo: "kia-new-2021-seeklogo.png" },
  { id: "mg", name: "MG Motor", color: "#E4022A", logo: "mg-seeklogo.png" },
  { id: "skoda", name: "Skoda", color: "#0E3B2E", logo: "skoda-seeklogo.png" },
  { id: "vw", name: "Volkswagen", color: "#00437A", logo: "volkswagen-seeklogo.png" },
  { id: "renault", name: "Renault", color: "#FFCC00", logo: "renault-new-2021-seeklogo.png" },
  { id: "nissan", name: "Nissan", color: "#C3002F", logo: "nissan-seeklogo.png" },
  { id: "audi", name: "Audi", color: "#BB0A30", logo: "audi-seeklogo.png" },
  { id: "bentley", name: "Bentley", color: "#00594F", logo: "bentley-motors-seeklogo.png" },
  { id: "bmw", name: "BMW", color: "#0066B1", logo: "bmw-seeklogo.png" },
  { id: "citroen", name: "Citroën", color: "#C0111D", logo: "citroen-2009-seeklogo.png" },
  { id: "ferrari", name: "Ferrari", color: "#D40000", logo: "ferrari-seeklogo.png" },
  { id: "jeep", name: "Jeep", color: "#424E36", logo: "jeep-seeklogo.png" },
  { id: "land-rover", name: "Land Rover", color: "#005A2B", logo: "land-rover-seeklogo.png" },
  { id: "lexus", name: "Lexus", color: "#1A1A1A", logo: "lexus-seeklogo.png" },
  { id: "mercedes-benz", name: "Mercedes-Benz", color: "#1C1C1C", logo: "mercedes-benz-seeklogo.png" },
  { id: "maserati", name: "Maserati", color: "#041E42", logo: "maserati-seeklogo.png" },
  { id: "mini", name: "Mini Cooper", color: "#76BB43", logo: "mini-cooper-seeklogo.png" },
  { id: "porsche", name: "Porsche", color: "#000000", logo: "porsche-seeklogo.png" },
  { id: "rolls-royce", name: "Rolls-Royce", color: "#0B0B0B", logo: "rolls-royce-seeklogo.png" },
  { id: "volvo", name: "Volvo", color: "#003057", logo: "volvo-seeklogo.png" },
  { id: "aston-martin", name: "Aston Martin", color: "#00352F", logo: "aston-martin-seeklogo.png" },
  { id: "lamborghini", name: "Lamborghini", color: "#000000", logo: "lamborghini.jpeg" },
  { id: "jaguar", name: "Jaguar", color: "#00594A", logo: "jaguar-seeklogo.png" },
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const modelsByNormalizedFolder = new Map<string, CarModel[]>(
  Object.entries(carModelsByFolder as Record<string, CarModel[]>).map(([folder, models]) => [
    normalize(folder),
    models,
  ])
);

export const CAR_BRANDS: CarBrand[] = BRAND_META.map((meta) => ({
  ...meta,
  models:
    modelsByNormalizedFolder.get(normalize(meta.name)) ??
    modelsByNormalizedFolder.get(normalize(meta.id)) ??
    [],
}));

export const DEFAULT_BRAND_COLOR = "#6B7280";

export function findBrand(name: string): CarBrand | undefined {
  return CAR_BRANDS.find((b) => b.name.toLowerCase() === name.toLowerCase());
}

export function getBrandColor(name: string): string {
  return findBrand(name)?.color ?? DEFAULT_BRAND_COLOR;
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
 * Real model photos live in public/cars/{Brand}/{Model}/, indexed by
 * scripts/generate-car-catalog.mjs into lib/generated/car-models.json.
 * Returns undefined if the brand/model has no photo on disk.
 */
export function getModelImagePath(brand: string, model: string): string | undefined {
  const match = findBrand(brand)?.models.find(
    (m) => m.name.toLowerCase() === model.toLowerCase()
  );
  return match?.image ?? undefined;
}
