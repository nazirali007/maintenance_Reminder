#!/usr/bin/env node
// Scans public/cars/{Brand}/{Model}/*.jpg and writes lib/generated/car-models.json.
// Re-run this (`node scripts/generate-car-catalog.mjs`) whenever images are added to public/cars.

import { readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".bmp"]);

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const carsDir = path.join(rootDir, "..", "public", "cars");
const outFile = path.join(rootDir, "..", "lib", "generated", "car-models.json");

function listDirs(dir) {
  return readdirSync(dir)
    .filter((name) => !name.startsWith("."))
    .filter((name) => statSync(path.join(dir, name)).isDirectory())
    .sort((a, b) => a.localeCompare(b));
}

function pickImage(modelDir, modelName) {
  const files = readdirSync(modelDir)
    .filter((name) => !name.startsWith("."))
    .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) return null;

  const exact = files.find(
    (f) => path.parse(f).name.toLowerCase() === modelName.toLowerCase()
  );
  return exact ?? files[0];
}

function toPublicPath(...segments) {
  return "/" + segments.map(encodeURIComponent).join("/");
}

const catalog = {};

for (const brand of listDirs(carsDir)) {
  const brandDir = path.join(carsDir, brand);
  const models = [];

  for (const model of listDirs(brandDir)) {
    const modelDir = path.join(brandDir, model);
    const file = pickImage(modelDir, model);
    models.push({
      name: model,
      image: file ? toPublicPath("cars", brand, model, file) : null,
    });
  }

  catalog[brand] = models;
}

writeFileSync(outFile, JSON.stringify(catalog, null, 2) + "\n");

const totalModels = Object.values(catalog).reduce((sum, m) => sum + m.length, 0);
const withImages = Object.values(catalog)
  .flat()
  .filter((m) => m.image).length;
console.log(
  `Wrote ${outFile}: ${Object.keys(catalog).length} brands, ${totalModels} models (${withImages} with images).`
);
