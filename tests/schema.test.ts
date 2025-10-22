import { ok } from './helpers/assert.js';
import { actionNodeSchema, linkSchema, projectSchema } from '../src/schema/index.js';

const sampleProject = {
  id: 'proj_1',
  name: 'Fisheries Pilot',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  config: {
    allowedLinkTypes: ['AUTHORIZES', 'REQUIRES'],
    layout: 'force',
    arena: { initialWidth: 1200, initialHeight: 800 },
    autosave: true,
  },
};

const sampleNode = {
  id: 'node_1',
  projectId: 'proj_1',
  title: 'Get fishing permit',
  summary: 'Citizen obtains permit from municipal office.',
  authorizers: ['actor_1'],
  isEndToEndOnline: true,
  onlineNotes: 'Available via portal',
  pppRole: 'None',
  pppNotes: '',
  legalBases: [{
    citation: 'Law 123',
    jurisdiction: 'State',
    url: undefined,
    effectiveFrom: undefined,
    effectiveTo: undefined,
  }],
  rulesToFollow: [{ label: 'Safety rules', description: 'Follow safety guidelines', source: '' }],
  abuseExamples: [{ title: 'Fake permits', description: 'Reports of fake permits', source: '', year: undefined }],
  tags: ['pilot'],
  metadata: {},
  completenessScore: 80,
};

const sampleLink = {
  id: 'link_1',
  projectId: 'proj_1',
  fromNodeId: 'node_1',
  toNodeId: 'node_2',
  type: 'AUTHORIZES',
  label: 'Authorizes',
  notes: '',
  evidence: '',
};

ok(projectSchema.parse(sampleProject));
ok(actionNodeSchema.parse(sampleNode));
ok(linkSchema.parse(sampleLink));

console.log('schema tests passed');
