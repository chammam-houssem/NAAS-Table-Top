import { Project, ActionNode, Actor, Link } from '../schema/index.js';
import { computeCompleteness } from '../utils/scoring.js';

export function createSeedProject() {
  const project: Project = {
    id: 'seed-project',
    name: 'Fisheries Pilot',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    config: {
      allowedLinkTypes: ['AUTHORIZES', 'REQUIRES', 'GOVERNED_BY'],
      layout: 'force',
      arena: { initialWidth: 1200, initialHeight: 800 },
      autosave: true,
    },
  };
  const actors: Actor[] = [
    {
      id: 'actor-fisheries',
      projectId: project.id,
      name: 'Fisheries Agency',
      type: 'Agency',
      notes: 'Issues permits and monitors compliance.',
    },
    {
      id: 'actor-municipal',
      projectId: project.id,
      name: 'Municipal Office',
      type: 'Municipal',
      notes: 'Local interface for citizens.',
    },
  ];
  const node: ActionNode = {
    id: 'node-permit',
    projectId: project.id,
    title: 'Get fishing permit',
    summary: 'Citizen requests fishing permit via municipal office with agency approval.',
    authorizers: actors.map((actor) => actor.id),
    isEndToEndOnline: true,
    onlineNotes: 'Available via national portal with in-person pickup option.',
    pppRole: 'Co-Management',
    pppNotes: 'Local cooperatives help operate service points.',
    legalBases: [
      {
        citation: 'Fisheries Regulation 2020',
        jurisdiction: 'National Government',
        url: 'https://example.gov/fisheries-regulation',
        effectiveFrom: undefined,
        effectiveTo: undefined,
      },
    ],
    rulesToFollow: [
      {
        label: 'Safety Course Completion',
        description: 'Citizen must complete mandatory safety course.',
        source: 'Regulatory Manual',
      },
    ],
    abuseExamples: [
      {
        title: 'Permit Bribery 2019',
        description: 'Reports of expedited permits for bribes.',
        source: 'Audit 2019',
        year: '2019',
      },
    ],
    tags: ['fisheries', 'pilot'],
    metadata: {},
    completenessScore: 0,
  };
  node.completenessScore = computeCompleteness(node);
  const links: Link[] = [];
  return { project, actors, nodes: [node], links };
}
