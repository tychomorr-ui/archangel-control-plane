import { writeFileSync } from 'node:fs';

const core = [
  { name: 'Root-Gate', code: 'us-west-2', lat: 45.5231, lon: -122.6765 },
  { name: 'Tesseract-Terminus', code: 'eu-south-2', lat: 40.4168, lon: -3.7038 },
  { name: 'XinUS-Clarity', code: 'eu-west-1', lat: 53.3498, lon: -6.2603 },
  { name: 'Tesseract-A', code: 'eu-central-1', lat: 50.1109, lon: 8.6821 },
  { name: 'Kether-Gate', code: 'ap-southeast-1', lat: 1.3521, lon: 103.8198 },
  { name: 'KEIRA', code: 'sa-east-1', lat: -23.5505, lon: -46.6333 },
  { name: 'ARCHANGEL host', code: 'eu-west-2', lat: 51.5072, lon: -0.1276 },
];

const candidates = [
  { name: 'Cape Town', code: 'af-south-1', lat: -33.9249, lon: 18.4241, class: 'EC2' },
  { name: 'N. Virginia', code: 'us-east-1', lat: 38.9072, lon: -77.0369, class: 'Lightsail or EC2' },
  { name: 'Ohio', code: 'us-east-2', lat: 39.9612, lon: -82.9988, class: 'Lightsail or EC2' },
  { name: 'Montreal', code: 'ca-central-1', lat: 45.5017, lon: -73.5673, class: 'Lightsail or EC2' },
  { name: 'Calgary', code: 'ca-west-1', lat: 51.0447, lon: -114.0719, class: 'EC2' },
  { name: 'Mexico Central', code: 'mx-central-1', lat: 19.4326, lon: -99.1332, class: 'EC2' },
  { name: 'Stockholm', code: 'eu-north-1', lat: 59.3293, lon: 18.0686, class: 'Lightsail or EC2' },
  { name: 'Paris', code: 'eu-west-3', lat: 48.8566, lon: 2.3522, class: 'Lightsail or EC2' },
  { name: 'Zurich', code: 'eu-central-2', lat: 47.3769, lon: 8.5417, class: 'EC2' },
  { name: 'Milan', code: 'eu-south-1', lat: 45.4642, lon: 9.1900, class: 'EC2' },
  { name: 'Tel Aviv', code: 'il-central-1', lat: 32.0853, lon: 34.7818, class: 'EC2' },
  { name: 'UAE', code: 'me-central-1', lat: 24.4539, lon: 54.3773, class: 'EC2' },
  { name: 'Bahrain', code: 'me-south-1', lat: 26.2235, lon: 50.5876, class: 'EC2' },
  { name: 'Mumbai', code: 'ap-south-1', lat: 19.0760, lon: 72.8777, class: 'Lightsail or EC2' },
  { name: 'Hyderabad', code: 'ap-south-2', lat: 17.3850, lon: 78.4867, class: 'EC2' },
  { name: 'Hong Kong', code: 'ap-east-1', lat: 22.3193, lon: 114.1694, class: 'Lightsail or EC2' },
  { name: 'Taipei', code: 'ap-east-2', lat: 25.0330, lon: 121.5654, class: 'EC2' },
  { name: 'Seoul', code: 'ap-northeast-2', lat: 37.5665, lon: 126.9780, class: 'Lightsail or EC2' },
  { name: 'Tokyo', code: 'ap-northeast-1', lat: 35.6762, lon: 139.6503, class: 'Lightsail or EC2' },
  { name: 'Jakarta', code: 'ap-southeast-3', lat: -6.2088, lon: 106.8456, class: 'Lightsail or EC2' },
  { name: 'Malaysia', code: 'ap-southeast-5', lat: 3.1390, lon: 101.6869, class: 'Lightsail or EC2' },
  { name: 'Bangkok', code: 'ap-southeast-7', lat: 13.7563, lon: 100.5018, class: 'EC2' },
  { name: 'Melbourne', code: 'ap-southeast-4', lat: -37.8136, lon: 144.9631, class: 'EC2' },
  { name: 'Sydney', code: 'ap-southeast-2', lat: -33.8688, lon: 151.2093, class: 'Lightsail or EC2' },
  { name: 'Auckland', code: 'ap-southeast-6', lat: -36.8485, lon: 174.7633, class: 'EC2' },
];

const radians = degree => degree * Math.PI / 180;
const distance = (a, b) => {
  const latDelta = radians(b.lat - a.lat); const lonDelta = radians(b.lon - a.lon);
  const h = Math.sin(latDelta / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(lonDelta / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};
const combinations = points => {
  const output = [];
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) for (let k = j + 1; k < points.length; k++) output.push([points[i], points[j], points[k]]);
  return output;
};
const pairs = points => {
  const output = [];
  for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) output.push([points[i], points[j]]);
  return output;
};
const nearestCore = point => Math.min(...core.map(node => distance(point, node)));
const minPair = points => Math.min(distance(points[0], points[1]), distance(points[0], points[2]), distance(points[1], points[2]));
const averageNearestCore = points => points.reduce((sum, point) => sum + nearestCore(point), 0) / points.length;

const ranked = combinations(candidates).map(nodes => ({ nodes, minPairKm: Math.round(minPair(nodes)), averageCoreGapKm: Math.round(averageNearestCore(nodes)), score: Math.round(minPair(nodes) * .62 + averageNearestCore(nodes) * .38) })).sort((a, b) => b.score - a.score).slice(0, 12);
const capeTownSets = ranked.filter(row => row.nodes.some(node => node.code === 'af-south-1'));
const projectReclaimCapeTown = pairs(candidates.filter(node => node.code !== 'af-south-1')).map(rest => {
  const nodes = [candidates.find(node => node.code === 'af-south-1'), ...rest];
  return { nodes, minPairKm: Math.round(minPair(nodes)), averageCoreGapKm: Math.round(averageNearestCore(nodes)), score: Math.round(minPair(nodes) * .62 + averageNearestCore(nodes) * .38) };
}).sort((a, b) => b.score - a.score).slice(0, 8);

const formatRows = rows => rows.map((row, index) => `| ${index + 1} | ${row.nodes.map(node => `${node.name} (${node.code}; ${node.class})`).join(' · ')} | ${row.minPairKm.toLocaleString()} | ${row.averageCoreGapKm.toLocaleString()} | ${row.score.toLocaleString()} |`);
const lines = [
  '# All-Enabled-Region Outer-Circle Analysis',
  '',
  'The core is assumed to be Oregon, Spain, Ireland, Frankfurt, Singapore, São Paulo, with ARCHANGEL hosted in London. The new candidates include every enabled Region supplied by the user. Locations marked **EC2** are not currently supported by Lightsail, but are valid for a node created from scratch on EC2/VPC infrastructure. The score is a transparent geographic-diversity heuristic: 62% minimum separation among the three outer nodes and 38% average distance from the nearest core/control host.',
  '',
  '## Highest geographic-diversity combinations',
  '',
  '| Rank | Outer-circle set | Minimum pair separation (km) | Average nearest-core separation (km) | Score |',
  '|---:|---|---:|---:|---:|',
  ...formatRows(ranked),
  '',
  '## If Project Reclaim is assigned to Cape Town',
  '',
  '| Rank | Outer-circle set | Minimum pair separation (km) | Average nearest-core separation (km) | Score |',
  '|---:|---|---:|---:|---:|',
  ...formatRows(projectReclaimCapeTown),
  '',
  '## Interpretation',
  '',
  'The pure score should not choose a human- and field-facing role by itself. Cape Town is a strategically strong Project Reclaim candidate because it establishes an Africa and southern-hemisphere outer-ring point, far from all six core Regions and London. If Cape Town is selected for Project Reclaim, the strongest complementary future sites should be chosen from North America and the Pacific/Asia to prevent the ring from becoming Europe-heavy.',
];

writeFileSync('/home/ubuntu/archangel-control-plane/all-enabled-outer-circle-analysis.md', `${lines.join('\n')}\n`);
console.log(JSON.stringify({ ranked, projectReclaimCapeTown }, null, 2));
