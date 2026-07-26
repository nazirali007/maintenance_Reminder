export interface MaintenanceCatalogItem {
  key: string;
  label: string;
  hint: string;
  defaultIntervalKm: number;
}

export interface MaintenanceCatalogSection {
  title: string;
  items: MaintenanceCatalogItem[];
}

export const MAINTENANCE_CATALOG: MaintenanceCatalogSection[] = [
  {
    title: "Fluids & Filters",
    items: [
      { key: "engine-oil", label: "Engine Oil", hint: "Lubricates the engine — the most frequent service item", defaultIntervalKm: 5000 },
      { key: "oil-filter", label: "Oil Filter", hint: "Traps contaminants from the engine oil", defaultIntervalKm: 5000 },
      { key: "air-filter", label: "Air Filter", hint: "Keeps dust and debris out of the engine's air intake", defaultIntervalKm: 10000 },
      { key: "cabin-filter", label: "Cabin/AC Filter", hint: "Filters the air coming into the cabin", defaultIntervalKm: 10000 },
      { key: "fuel-filter", label: "Fuel Filter", hint: "Keeps debris out of the fuel system", defaultIntervalKm: 20000 },
      { key: "coolant", label: "Coolant (Radiator Fluid)", hint: "Prevents engine overheating", defaultIntervalKm: 40000 },
      { key: "brake-fluid", label: "Brake Fluid", hint: "Transfers pedal pressure to the brakes — degrades over time", defaultIntervalKm: 40000 },
      { key: "transmission-fluid", label: "Transmission Fluid", hint: "Lubricates and cools the gearbox", defaultIntervalKm: 60000 },
    ],
  },
  {
    title: "Tyres & Brakes",
    items: [
      { key: "tyres", label: "Tyres", hint: "Worn tyres reduce grip and increase stopping distance", defaultIntervalKm: 40000 },
      { key: "brake-pads", label: "Brake Pads", hint: "Wear down with use — affects stopping power", defaultIntervalKm: 30000 },
      { key: "wheel-alignment", label: "Wheel Alignment & Balancing", hint: "Prevents uneven tyre wear and steering pull", defaultIntervalKm: 10000 },
    ],
  },
  {
    title: "Electrical & Ignition",
    items: [
      { key: "battery", label: "Battery", hint: "Powers the electrical system — replace if starting weakens", defaultIntervalKm: 40000 },
      { key: "spark-plugs", label: "Spark Plugs", hint: "Ignite the engine's fuel — worn plugs hurt mileage and power", defaultIntervalKm: 20000 },
      { key: "wiper-blades", label: "Wiper Blades", hint: "Wear out and streak over time", defaultIntervalKm: 15000 },
    ],
  },
  {
    title: "Belts & Suspension",
    items: [
      { key: "drive-belt", label: "Drive/Timing Belt", hint: "Keeps engine components in sync — critical if it fails", defaultIntervalKm: 60000 },
      { key: "suspension", label: "Suspension Check", hint: "Shocks and struts wear down, affecting ride and handling", defaultIntervalKm: 20000 },
      { key: "ac-gas", label: "AC Gas Refill", hint: "Refrigerant depletes slowly over time", defaultIntervalKm: 20000 },
    ],
  },
];
