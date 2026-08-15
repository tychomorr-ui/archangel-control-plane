import { writeFileSync } from 'node:fs';

const existing = [
  { name: 'Oregon / Root-Gate', lat: 45.5231, lon: -122.6765 },
  { name: 'Oregon / Tesseract-Terminus', lat: 45.5231, lon: -122.6765 },
  { name: 'Ireland / XinUS-Clarity', lat: 53.3498, lon: -6.2603 },
  { name: 'Frankfurt / Tesseract-A', lat: 50.1109, lon: 8.6821 },
  { name: 'Singapore / Kether-Gate', lat: 1.3521, lon: 103.8198 },
  { name: 'São Paulo / KEIRA', lat: -23.5505, lon: -46.6333 },
];

const candidates = [
  { name: 'Virginia', code: 'us-east-1', lat: 38.9072, lon: -77.0369, existing: false },
  { name: 'Ohio', code: 'us-east-2', lat: 39.9612, lon: -82.9988, existing: false },
  { name: 'Montreal', code: 'ca-central-1', lat: 45.5017, lon: -73.5673, existing: false },
  { name: 'Spain', code: 'eu-south-2', lat: 40.4168, lon: -3.7038, existing: false },
  { name: 'Ireland', code: 'eu-west-1', lat: 53.3498, lon: -6.2603, existing: true },
  { name: 'Paris', code: 'eu-west-3', lat: 48.8566, lon: 2.3522, existing: false },
  { name: 'London', code: 'eu-west-2', lat: 51.5072, lon: -0.1276, existing: false },
  { name: 'Frankfurt', code: 'eu-central-1', lat: 50.1109, lon: 8.6821, existing: true },
  { name: 'Oregon', code: 'us-west-2', lat: 45.5231, lon: -122.6765, existing: true },
  { name: 'Stockholm', code: 'eu-north-1', lat: 59.3293, lon: 18.0686, existing: false },
  { name: 'Mumbai', code: 'ap-south-1', lat: 19.0760, lon: 72.8777, existing: false },
  { name: 'Malaysia', code: 'ap-southeast-5', lat: 3.1390, lon: 101.6869, existing: false },
  { name: 'Singapore', code: 'ap-southeast-1', lat: 1.3521, lon: 103.8198, existing: true },
  { name: 'Jakarta', code: 'ap-southeast-3', lat: -6.2088, lon: 106.8456, existing: false },
  { name: 'Sydney', code: 'ap-southeast-2', lat: -33.8688, lon: 151.2093, existing: false },
  { name: 'Hong Kong', code: 'ap-east-1', lat: 22.3193, lon: 114.1694, existing: false },
  { name: 'Tokyo', code: 'ap-northeast-1', lat: 35.6762, lon: 139.6503, existing: false },
  { name: 'Seoul', code: 'ap-northeast-2', lat: 37.5665, lon: 126.9780, existing: false },
];

const radians = degree => degree * Math.PI / 180;
const kmBetween = (a, b) => {
  const earthRadiusKm = 6371;
  const latDelta = radians(b.lat - a.lat);
  const lonDelta = radians(b.lon - a.lon);
  const sinLat = Math.sin(latDelta / 2);
  const sinLon = Math.sin(lonDelta / 2);
  const h = sinLat ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * sinLon ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
};

const geographicCentroid = points => {
  const vector = points.reduce((total, point) => {
    const latitude = radians(point.lat);
    const longitude = radians(point.lon);
    total.x += Math.cos(latitude) * Math.cos(longitude);
    total.y += Math.cos(latitude) * Math.sin(longitude);
    total.z += Math.sin(latitude);
    return total;
  }, { x: 0, y: 0, z: 0 });
  const longitude = Math.atan2(vector.y, vector.x);
  const hypotenuse = Math.sqrt(vector.x ** 2 + vector.y ** 2);
  const latitude = Math.atan2(vector.z, hypotenuse);
  return { lat: latitude * 180 / Math.PI, lon: longitude * 180 / Math.PI };
};

const centroid = geographicCentroid(existing);

const ranked = candidates.map(candidate => {
  const distances = existing.map(node => kmBetween(candidate, node));
  return {
    ...candidate,
    meanKm: Math.round(distances.reduce((total, value) => total + value, 0) / distances.length),
    maxKm: Math.round(Math.max(...distances)),
    centroidKm: Math.round(kmBetween(candidate, centroid)),
    toOregonKm: Math.round(distances[0]),
    toIrelandKm: Math.round(distances[2]),
    toFrankfurtKm: Math.round(distances[3]),
    toSingaporeKm: Math.round(distances[4]),
    toSaoPauloKm: Math.round(distances[5]),
  };
}).sort((a, b) => a.meanKm - b.meanKm);

const lines = [
  '# Regional Placement Analysis',
  '',
  'This comparison uses approximate city-level great-circle distance as a transparent geographic proxy. It is not a latency measurement: routing, network congestion, and service architecture affect actual round-trip time.',
  '',
  `The equal-weight geographic centroid of the six declared nodes is approximately **${centroid.lat.toFixed(2)}°, ${centroid.lon.toFixed(2)}°**. It is a conceptual point, not an AWS deployment location.`,
  '',
  '| Candidate | Region | Mean distance to six current nodes (km) | Distance to geographic centroid (km) | Furthest current node (km) | Existing-node region? |',
  '|---|---:|---:|---:|---:|---|',
  ...ranked.map(row => `| ${row.name} | ${row.code} | ${row.meanKm.toLocaleString()} | ${row.centroidKm.toLocaleString()} | ${row.maxKm.toLocaleString()} | ${row.existing ? 'Yes' : 'No'} |`),
  '',
  '## Selected interpretation',
  '',
  `The lowest mean-distance candidate is **${ranked[0].name} (${ranked[0].code})** at approximately ${ranked[0].meanKm.toLocaleString()} km. The ranking is a control-message placement heuristic only; user-facing workloads should remain local to their users.`,
  '',
  'For a new, non-duplicative Project Reclaim region, preference should go to a candidate that adds a failure domain and serves the planned physical work rather than merely minimizing the mean-distance score.',
];

writeFileSync('/home/ubuntu/archangel-control-plane/region-placement-analysis.md', `${lines.join('\n')}\n`);
console.log(JSON.stringify(ranked, null, 2));
