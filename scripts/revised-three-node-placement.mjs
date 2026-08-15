import { writeFileSync } from 'node:fs';

const existing = [
  { name: 'Root-Gate', code: 'us-west-2', lat: 45.5231, lon: -122.6765 },
  { name: 'XinUS-Clarity', code: 'eu-west-1', lat: 53.3498, lon: -6.2603 },
  { name: 'Tesseract-A', code: 'eu-central-1', lat: 50.1109, lon: 8.6821 },
  { name: 'Kether-Gate', code: 'ap-southeast-1', lat: 1.3521, lon: 103.8198 },
  { name: 'KEIRA', code: 'sa-east-1', lat: -23.5505, lon: -46.6333 },
];

const candidates = [
  { name: 'Virginia', code: 'us-east-1', lat: 38.9072, lon: -77.0369 },
  { name: 'Ohio', code: 'us-east-2', lat: 39.9612, lon: -82.9988 },
  { name: 'Montreal', code: 'ca-central-1', lat: 45.5017, lon: -73.5673 },
  { name: 'Spain', code: 'eu-south-2', lat: 40.4168, lon: -3.7038 },
  { name: 'Paris', code: 'eu-west-3', lat: 48.8566, lon: 2.3522 },
  { name: 'London', code: 'eu-west-2', lat: 51.5072, lon: -0.1276 },
  { name: 'Stockholm', code: 'eu-north-1', lat: 59.3293, lon: 18.0686 },
  { name: 'Mumbai', code: 'ap-south-1', lat: 19.0760, lon: 72.8777 },
  { name: 'Malaysia', code: 'ap-southeast-5', lat: 3.1390, lon: 101.6869 },
  { name: 'Jakarta', code: 'ap-southeast-3', lat: -6.2088, lon: 106.8456 },
  { name: 'Sydney', code: 'ap-southeast-2', lat: -33.8688, lon: 151.2093 },
  { name: 'Hong Kong', code: 'ap-east-1', lat: 22.3193, lon: 114.1694 },
  { name: 'Tokyo', code: 'ap-northeast-1', lat: 35.6762, lon: 139.6503 },
  { name: 'Seoul', code: 'ap-northeast-2', lat: 37.5665, lon: 126.9780 },
];

const radians = degree => degree * Math.PI / 180;
const kmBetween = (a, b) => {
  const earthRadiusKm = 6371;
  const latDelta = radians(b.lat - a.lat);
  const lonDelta = radians(b.lon - a.lon);
  const h = Math.sin(latDelta / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(lonDelta / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
};
const centroidOf = points => {
  const vector = points.reduce((sum, point) => {
    const lat = radians(point.lat); const lon = radians(point.lon);
    return { x: sum.x + Math.cos(lat) * Math.cos(lon), y: sum.y + Math.cos(lat) * Math.sin(lon), z: sum.z + Math.sin(lat) };
  }, { x: 0, y: 0, z: 0 });
  return { lat: Math.atan2(vector.z, Math.hypot(vector.x, vector.y)) * 180 / Math.PI, lon: Math.atan2(vector.y, vector.x) * 180 / Math.PI };
};
const averageDistance = (point, points) => points.reduce((sum, candidate) => sum + kmBetween(point, candidate), 0) / points.length;

const scenarios = candidates.map(terminus => {
  const core = [...existing, terminus];
  const centroid = centroidOf(core);
  const available = candidates.filter(candidate => candidate.code !== terminus.code);
  const byCenter = available.map(candidate => ({ ...candidate, centerKm: Math.round(kmBetween(candidate, centroid)), meanKm: Math.round(averageDistance(candidate, core)) })).sort((a, b) => a.centerKm - b.centerKm || a.meanKm - b.meanKm);
  const archangel = byCenter[0];
  const projectReclaim = byCenter.find(candidate => candidate.code !== archangel.code);
  return {
    terminus: `${terminus.name} (${terminus.code})`,
    rootToTerminusKm: Math.round(kmBetween(existing[0], terminus)),
    centroid: `${centroid.lat.toFixed(2)}°, ${centroid.lon.toFixed(2)}°`,
    archangel: `${archangel.name} (${archangel.code})`,
    archangelCenterKm: archangel.centerKm,
    projectReclaim: `${projectReclaim.name} (${projectReclaim.code})`,
    reclaimCenterKm: projectReclaim.centerKm,
  };
}).sort((a, b) => a.archangelCenterKm - b.archangelCenterKm || b.rootToTerminusKm - a.rootToTerminusKm);

const lines = [
  '# Revised Three-Node Placement Analysis',
  '',
  'This calculation treats Root-Gate, XinUS-Clarity, Tesseract-A, Kether-Gate, and KEIRA as fixed. Tesseract-Terminus, ARCHANGEL, and Project Reclaim must all occupy **different, currently unused Regions**. It uses approximate city-level great-circle distance as a geographic proxy, not measured network latency.',
  '',
  '| Tesseract-Terminus candidate | Distance from Root-Gate (km) | Resulting geographic center | Nearest unused ARCHANGEL candidate | Distance to center (km) | Next distinct Project Reclaim candidate | Distance to center (km) |',
  '|---|---:|---|---|---:|---|---:|',
  ...scenarios.map(row => `| ${row.terminus} | ${row.rootToTerminusKm.toLocaleString()} | ${row.centroid} | ${row.archangel} | ${row.archangelCenterKm.toLocaleString()} | ${row.projectReclaim} | ${row.reclaimCenterKm.toLocaleString()} |`),
  '',
  '## Interpretation',
  '',
  'The table is an input to architecture judgment rather than an automatic placement decision. Tesseract-Terminus is a provenance and attestation role, so the preferred move should add a meaningful failure domain away from Root-Gate while preserving reasonable control-message distances. ARCHANGEL should then use the nearest remaining region to the revised center, and Project Reclaim should take the next distinct candidate unless field-program geography dictates otherwise.',
];

writeFileSync('/home/ubuntu/archangel-control-plane/revised-three-node-placement.md', `${lines.join('\n')}\n`);
console.log(JSON.stringify(scenarios, null, 2));
