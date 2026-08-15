import { writeFileSync } from 'node:fs';

// Tentative core placement: Tesseract-Terminus is shown in Spain so the core triangles
// occupy six distinct regions. This remains a planning assumption until the user approves it.
const core = [
  { name: 'Root-Gate', code: 'us-west-2', lat: 45.5231, lon: -122.6765 },
  { name: 'Tesseract-Terminus', code: 'eu-south-2', lat: 40.4168, lon: -3.7038 },
  { name: 'XinUS-Clarity', code: 'eu-west-1', lat: 53.3498, lon: -6.2603 },
  { name: 'Tesseract-A', code: 'eu-central-1', lat: 50.1109, lon: 8.6821 },
  { name: 'Kether-Gate', code: 'ap-southeast-1', lat: 1.3521, lon: 103.8198 },
  { name: 'KEIRA', code: 'sa-east-1', lat: -23.5505, lon: -46.6333 },
];

const candidates = [
  { name: 'Virginia', code: 'us-east-1', lat: 38.9072, lon: -77.0369 },
  { name: 'Ohio', code: 'us-east-2', lat: 39.9612, lon: -82.9988 },
  { name: 'Montreal', code: 'ca-central-1', lat: 45.5017, lon: -73.5673 },
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
const distance = (a, b) => {
  const latDelta = radians(b.lat - a.lat);
  const lonDelta = radians(b.lon - a.lon);
  const h = Math.sin(latDelta / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(lonDelta / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};
const combinations = values => {
  const output = [];
  for (let i = 0; i < values.length; i++) for (let j = i + 1; j < values.length; j++) for (let k = j + 1; k < values.length; k++) output.push([values[i], values[j], values[k]]);
  return output;
};
const coreNearestDistance = point => Math.min(...core.map(node => distance(point, node)));
const pairwiseMinimum = nodes => Math.min(distance(nodes[0], nodes[1]), distance(nodes[0], nodes[2]), distance(nodes[1], nodes[2]));
const averageCoreSeparation = nodes => nodes.reduce((sum, node) => sum + coreNearestDistance(node), 0) / nodes.length;

const ranked = combinations(candidates).map(nodes => ({
  nodes,
  minPairKm: Math.round(pairwiseMinimum(nodes)),
  averageCoreGapKm: Math.round(averageCoreSeparation(nodes)),
  // Weighted score favors spaced outer-ring nodes while avoiding nodes that merely duplicate a core location.
  score: Math.round(pairwiseMinimum(nodes) * 0.62 + averageCoreSeparation(nodes) * 0.38),
})).sort((a, b) => b.score - a.score).slice(0, 12);

const lines = [
  '# Outer-Circle Expansion Analysis',
  '',
  'The six core vertices are assumed to be Oregon, Spain, Ireland, Frankfurt, Singapore, and São Paulo. Three outer-circle candidates must be unused Regions. The score is a transparent geographic-diversity heuristic: 62% minimum separation among the three added nodes, and 38% average distance from the nearest core node. It is not a network-latency measurement or an automatic deployment decision.',
  '',
  '| Rank | Three-node outer-circle set | Minimum distance between added nodes (km) | Average nearest-core separation (km) | Diversity score |',
  '|---:|---|---:|---:|---:|',
  ...ranked.map((row, index) => `| ${index + 1} | ${row.nodes.map(node => `${node.name} (${node.code})`).join(' · ')} | ${row.minPairKm.toLocaleString()} | ${row.averageCoreGapKm.toLocaleString()} | ${row.score.toLocaleString()} |`),
  '',
  '## Interpretation',
  '',
  'A pure geographic-diversity score tends to favor an eastern North American node, a Pacific node, and a South Asian node. Role assignment should override this score when a node has a more specific operating purpose. Project Reclaim should be assigned to the outer-circle location closest to its actual field partnerships and physical programs; a central control or witness role should not be assigned to it merely because a point scores well on separation.',
];

writeFileSync('/home/ubuntu/archangel-control-plane/outer-circle-expansion-analysis.md', `${lines.join('\n')}\n`);
console.log(JSON.stringify(ranked.map(row => ({ ...row, nodes: row.nodes.map(node => node.code) })), null, 2));
