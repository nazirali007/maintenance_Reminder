export interface MaintenanceCatalogItem {
  key: string;
  label: string;
  hint: string;
  defaultIntervalKm: number;
  /**
   * Ballpark cost range in INR (parts + labour) for a mass-market
   * hatchback/sedan. Stored as a range, not a single figure, because the real
   * price swings widely with model, city, and whether it's an authorised
   * service centre or a local workshop — a single number would look precise
   * in a way this data isn't. Always presented to the user as an estimate.
   */
  priceMinInr: number;
  priceMaxInr: number;
}

export interface MaintenanceCatalogSection {
  title: string;
  items: MaintenanceCatalogItem[];
}

export const MAINTENANCE_CATALOG: MaintenanceCatalogSection[] = [
  {
    title: "Fluids & Filters",
    items: [
      { key: "engine-oil", label: "Engine Oil", hint: "Lubricates the engine — the most frequent service item", defaultIntervalKm: 5000, priceMinInr: 1500, priceMaxInr: 4000 },
      { key: "oil-filter", label: "Oil Filter", hint: "Traps contaminants from the engine oil", defaultIntervalKm: 5000, priceMinInr: 200, priceMaxInr: 700 },
      { key: "air-filter", label: "Air Filter", hint: "Keeps dust and debris out of the engine's air intake", defaultIntervalKm: 10000, priceMinInr: 300, priceMaxInr: 900 },
      { key: "cabin-filter", label: "Cabin/AC Filter", hint: "Filters the air coming into the cabin", defaultIntervalKm: 10000, priceMinInr: 400, priceMaxInr: 1200 },
      { key: "fuel-filter", label: "Fuel Filter", hint: "Keeps debris out of the fuel system", defaultIntervalKm: 20000, priceMinInr: 500, priceMaxInr: 1800 },
      { key: "coolant", label: "Coolant (Radiator Fluid)", hint: "Prevents engine overheating", defaultIntervalKm: 40000, priceMinInr: 500, priceMaxInr: 1500 },
      { key: "brake-fluid", label: "Brake Fluid", hint: "Transfers pedal pressure to the brakes — degrades over time", defaultIntervalKm: 40000, priceMinInr: 400, priceMaxInr: 1200 },
      { key: "transmission-fluid", label: "Transmission Fluid", hint: "Lubricates and cools the gearbox", defaultIntervalKm: 60000, priceMinInr: 1500, priceMaxInr: 5000 },
    ],
  },
  {
    title: "Tyres & Brakes",
    items: [
      { key: "tyres", label: "Tyres", hint: "Worn tyres reduce grip and increase stopping distance", defaultIntervalKm: 40000, priceMinInr: 12000, priceMaxInr: 30000 },
      { key: "brake-pads", label: "Brake Pads", hint: "Wear down with use — affects stopping power", defaultIntervalKm: 30000, priceMinInr: 1500, priceMaxInr: 5000 },
      { key: "wheel-alignment", label: "Wheel Alignment & Balancing", hint: "Prevents uneven tyre wear and steering pull", defaultIntervalKm: 10000, priceMinInr: 500, priceMaxInr: 1500 },
    ],
  },
  {
    title: "Electrical & Ignition",
    items: [
      { key: "battery", label: "Battery", hint: "Powers the electrical system — replace if starting weakens", defaultIntervalKm: 40000, priceMinInr: 4000, priceMaxInr: 9000 },
      { key: "spark-plugs", label: "Spark Plugs", hint: "Ignite the engine's fuel — worn plugs hurt mileage and power", defaultIntervalKm: 20000, priceMinInr: 400, priceMaxInr: 2000 },
      { key: "wiper-blades", label: "Wiper Blades", hint: "Wear out and streak over time", defaultIntervalKm: 15000, priceMinInr: 500, priceMaxInr: 1500 },
    ],
  },
  {
    title: "Belts & Suspension",
    items: [
      { key: "drive-belt", label: "Drive/Timing Belt", hint: "Keeps engine components in sync — critical if it fails", defaultIntervalKm: 60000, priceMinInr: 3000, priceMaxInr: 9000 },
      { key: "suspension", label: "Suspension Check", hint: "Shocks and struts wear down, affecting ride and handling", defaultIntervalKm: 20000, priceMinInr: 500, priceMaxInr: 2500 },
      { key: "ac-gas", label: "AC Gas Refill", hint: "Refrigerant depletes slowly over time", defaultIntervalKm: 20000, priceMinInr: 1500, priceMaxInr: 3500 },
    ],
  },
];

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatInr(amount: number): string {
  return inrFormatter.format(amount);
}

export function formatPriceRange(minInr: number, maxInr: number): string {
  return `${formatInr(minInr)} – ${formatInr(maxInr)}`;
}
