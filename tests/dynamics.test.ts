import { ok } from './helpers/assert.js';
import { expandArenaIfNeeded } from '../src/canvas/dynamics.js';
import { layoutNodes } from '../src/views/CanvasView.js';

const arena = { initialWidth: 1200, initialHeight: 800 };

const expanded = expandArenaIfNeeded(arena, 8);
ok(expanded.initialWidth > arena.initialWidth);
ok(expanded.initialHeight > arena.initialHeight);

const nodes = Array.from({ length: 8 }).map((_, index) => ({
  id: `node_${index}`,
  projectId: 'proj',
  title: `Node ${index}`,
  summary: '',
  authorizers: [],
  isEndToEndOnline: false,
  onlineNotes: '',
  pppRole: 'None',
  pppNotes: '',
  legalBases: [],
  rulesToFollow: [],
  abuseExamples: [],
  tags: [],
  metadata: {},
  completenessScore: 0,
}));

const positioned = layoutNodes(nodes as any, arena);
for (const node of positioned) {
  ok(node.x <= arena.initialWidth && node.x >= 0);
  ok(node.y <= arena.initialHeight && node.y >= 0);
}

console.log('dynamics tests passed');
