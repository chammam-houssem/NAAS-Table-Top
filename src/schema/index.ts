import { z } from './zod.js';

export const linkTypes = [
  'AUTHORIZES',
  'REQUIRES',
  'GOVERNED_BY',
  'FUNDED_BY',
  'ENABLED_BY_PPP',
  'REGULATED_BY',
  'ABUSES_REPORTED',
  'INFORMATION_FLOW',
  'ENFORCES',
  'DUPLICATES',
  'DEPENDS_ON',
] as const;

export type LinkType = typeof linkTypes[number];

export const ArenaLayout = ['force', 'layered'] as const;
export type LayoutType = typeof ArenaLayout[number];

export const legalBasisSchema = z.object({
  citation: z.string(),
  jurisdiction: z.string(),
  url: z.optional(z.string()),
  effectiveFrom: z.optional(z.string()),
  effectiveTo: z.optional(z.string()),
});

export const ruleSchema = z.object({
  label: z.string(),
  description: z.string(),
  source: z.optional(z.string()),
});

export const abuseSchema = z.object({
  title: z.string(),
  description: z.string(),
  source: z.optional(z.string()),
  year: z.optional(z.string()),
});

export const actorSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string(),
  type: z.string(),
  notes: z.optional(z.string()),
});

export const actionNodeSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  summary: z.string(),
  authorizers: z.array(z.string()),
  isEndToEndOnline: z.boolean(),
  onlineNotes: z.optional(z.string()),
  pppRole: z.string(),
  pppNotes: z.optional(z.string()),
  legalBases: z.array(legalBasisSchema),
  rulesToFollow: z.array(ruleSchema),
  abuseExamples: z.array(abuseSchema),
  tags: z.array(z.string()),
  metadata: z.record(z.string()),
  completenessScore: z.number(),
});

export const linkSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  fromNodeId: z.string(),
  toNodeId: z.string(),
  type: z.string(),
  label: z.optional(z.string()),
  notes: z.optional(z.string()),
  evidence: z.optional(z.string()),
});

export const projectConfigSchema = z.object({
  allowedLinkTypes: z.array(z.string()),
  layout: z.string(),
  arena: z.object({
    initialWidth: z.number(),
    initialHeight: z.number(),
  }),
  autosave: z.boolean(),
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  config: projectConfigSchema,
});

export type LegalBasis = ReturnType<typeof legalBasisSchema['parse']>;
export type Rule = ReturnType<typeof ruleSchema['parse']>;
export type Abuse = ReturnType<typeof abuseSchema['parse']>;
export type Actor = ReturnType<typeof actorSchema['parse']>;
export type ActionNode = ReturnType<typeof actionNodeSchema['parse']>;
export type Link = ReturnType<typeof linkSchema['parse']>;
export type Project = ReturnType<typeof projectSchema['parse']>;

export interface DatabaseSchema {
  projects: Project[];
  actionNodes: ActionNode[];
  actors: Actor[];
  links: Link[];
}

export const schemaVersion = 1;
