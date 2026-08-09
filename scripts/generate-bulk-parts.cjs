#!/usr/bin/env node
/**
 * Regenerates the `partsBulk` array in parts.json — a large synthetic dataset
 * used only by the "Virtual scroll" view (PartsVirtualList) to demonstrate
 * CDK virtual scrolling at a data volume where it actually matters. The
 * curated `parts`/`suppliers` arrays used by the main Parts Manager screen
 * are untouched.
 *
 * Usage:
 *   node scripts/generate-bulk-parts.js [count]
 *   npm run generate:bulk-parts -- [count]
 *
 * Defaults to 5000 rows if no count is given.
 */
const fs = require('fs');
const path = require('path');

const PARTS_JSON_PATH = path.join(__dirname, '..', 'parts.json');
const COUNT = Number(process.argv[2]) || 5000;

const categories = ['Brakes', 'Engine', 'Suspension', 'Electrical', 'Filters', 'Transmission'];

const nounsByCategory = {
  Brakes: ['Brake Pad Set', 'Brake Rotor', 'Brake Caliper', 'Brake Line', 'Brake Fluid', 'Handbrake Cable'],
  Engine: ['Timing Belt', 'Water Pump', 'Spark Plug', 'Piston Ring Set', 'Oil Pump', 'Drive Belt'],
  Suspension: ['Shock Absorber', 'Control Arm', 'Sway Bar Link', 'Strut Mount', 'Coil Spring', 'Wheel Bearing'],
  Electrical: ['Starter Battery', 'Alternator', 'Ignition Coil', 'Headlight Bulb', 'Wiring Harness', 'Oxygen Sensor'],
  Filters: ['Oil Filter', 'Air Filter', 'Cabin Pollen Filter', 'Fuel Filter', 'Transmission Filter'],
  Transmission: ['Clutch Kit', 'CV Joint Boot Kit', 'Gearbox Mount', 'Transmission Fluid', 'Drive Shaft'],
};

const adjectives = ['Premium', 'Standard', 'Heavy-Duty', 'OEM-Spec', 'Performance', 'Economy', 'Reinforced'];

function pad(n, width) {
  return String(n).padStart(width, '0');
}

function generate(count) {
  const parts = [];
  for (let i = 1; i <= count; i++) {
    const category = categories[i % categories.length];
    const nouns = nounsByCategory[category];
    const noun = nouns[i % nouns.length];
    const adjective = adjectives[i % adjectives.length];
    const price = Number((8 + ((i * 37) % 480) + 0.99).toFixed(2));
    const stock = (i * 13) % 320;
    const active = i % 11 !== 0;
    const dayOffset = i % 200;
    const updatedAt = new Date(2026, 0, 1 + dayOffset, i % 24, i % 60).toISOString();

    parts.push({
      id: `blk-${i}`,
      sku: `BLK-${pad(i, 6)}`,
      name: `${adjective} ${noun}`,
      category,
      price,
      stock,
      active,
      updatedAt,
    });
  }
  return parts;
}

function main() {
  const parts = generate(COUNT);
  const raw = fs.readFileSync(PARTS_JSON_PATH, 'utf8');
  const data = JSON.parse(raw);
  data.partsBulk = parts;
  fs.writeFileSync(PARTS_JSON_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');

  console.log(`Wrote ${parts.length} synthetic parts to partsBulk in ${PARTS_JSON_PATH}`);
  console.log('First:', JSON.stringify(parts[0]));
  console.log('Last: ', JSON.stringify(parts[parts.length - 1]));
}

main();
