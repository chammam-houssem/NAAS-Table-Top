import { ActionNode, Actor, Link, Project, LinkType } from '../schema/index.js';
import { computeCompleteness } from '../utils/scoring.js';
import { createId } from '../utils/uid.js';
import { db } from '../data/storage.js';
import { createSeedProject } from '../data/seed.js';

type Listener = () => void;

type ViewMode = 'canvas' | 'relational';

type PersistenceMode = 'local' | 'supabase';

export interface StoreState {
  projects: Project[];
  nodes: ActionNode[];
  actors: Actor[];
  links: Link[];
  activeProjectId: string | null;
  viewMode: ViewMode;
  persistence: PersistenceMode;
  arenaSize: { width: number; height: number };
  loading: boolean;
  error: string | null;
}

export type Store = {
  getState(): StoreState;
  setState(partial: Partial<StoreState>): void;
  subscribe(listener: Listener): () => void;
  load(): Promise<void>;
  createProject(name: string, config: Project['config']): Promise<Project>;
  selectProject(id: string): void;
  createNode(data: Partial<ActionNode>): Promise<ActionNode>;
  updateNode(id: string, partial: Partial<ActionNode>): Promise<void>;
  createLink(data: Omit<Link, 'id'>): Promise<Link>;
  deleteNode(id: string): Promise<void>;
  deleteLink(id: string): Promise<void>;
  setViewMode(mode: ViewMode): void;
  setArenaSize(width: number, height: number): void;
  setPersistence(mode: PersistenceMode): void;
  exportActiveProject(): string | null;
  importProject(serialized: string): Promise<void>;
};

const listeners: Listener[] = [];

let state: StoreState = {
  projects: [],
  nodes: [],
  actors: [],
  links: [],
  activeProjectId: null,
  viewMode: 'canvas',
  persistence: 'local',
  arenaSize: { width: 1200, height: 800 },
  loading: false,
  error: null,
};

function setState(partial: Partial<StoreState>) {
  state = { ...state, ...partial };
  for (const listener of listeners) listener();
}

export const store: Store = {
  getState: () => state,
  setState,
  subscribe(listener) {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    };
  },
  async load() {
    setState({ loading: true });
    const snapshot = await db.load();
    if (snapshot.projects.length === 0) {
      const seed = createSeedProject();
      await db.saveProject(seed.project);
      await db.saveActors(seed.actors);
      for (const node of seed.nodes) {
        await db.saveNode(node);
      }
      snapshot.projects.push(seed.project);
      snapshot.actors.push(...seed.actors);
      snapshot.nodes.push(...seed.nodes);
      snapshot.activeProjectId = seed.project.id;
    }
    setState({ ...snapshot, loading: false });
  },
  async createProject(name, config) {
    const now = new Date().toISOString();
    const project: Project = {
      id: createId('proj'),
      name,
      createdAt: now,
      updatedAt: now,
      config,
    };
    await db.saveProject(project);
    setState({ projects: [...state.projects, project], activeProjectId: project.id });
    return project;
  },
  selectProject(id) {
    setState({ activeProjectId: id });
  },
  async createNode(partial) {
    if (!state.activeProjectId) throw new Error('No project selected');
    const node: ActionNode = {
      id: createId('node'),
      projectId: state.activeProjectId,
      title: partial.title ?? 'Untitled Action',
      summary: partial.summary ?? '',
      authorizers: partial.authorizers ?? [],
      isEndToEndOnline: partial.isEndToEndOnline ?? false,
      onlineNotes: partial.onlineNotes ?? '',
      pppRole: partial.pppRole ?? 'None',
      pppNotes: partial.pppNotes ?? '',
      legalBases: partial.legalBases ?? [],
      rulesToFollow: partial.rulesToFollow ?? [],
      abuseExamples: partial.abuseExamples ?? [],
      tags: partial.tags ?? [],
      metadata: partial.metadata ?? {},
      completenessScore: 0,
    };
    node.completenessScore = computeCompleteness(node);
    await db.saveNode(node);
    setState({ nodes: [...state.nodes, node] });
    return node;
  },
  async updateNode(id, partial) {
    const nodes = state.nodes.map((node) => {
      if (node.id === id) {
        const updated = { ...node, ...partial };
        updated.completenessScore = computeCompleteness(updated);
        return updated;
      }
      return node;
    });
    await db.saveNodes(nodes.filter((node) => node.projectId === state.activeProjectId));
    setState({ nodes });
  },
  async createLink(data) {
    if (!state.activeProjectId) throw new Error('No project selected');
    const project = state.projects.find((p) => p.id === state.activeProjectId);
    if (!project) throw new Error('Project not found');
    if (!project.config.allowedLinkTypes.includes(data.type)) {
      throw new Error('Link type not allowed');
    }
    const link: Link = { ...data, id: createId('link') };
    await db.saveLink(link);
    setState({ links: [...state.links, link] });
    return link;
  },
  async deleteNode(id) {
    const nodes = state.nodes.filter((node) => node.id !== id);
    const links = state.links.filter((link) => link.fromNodeId !== id && link.toNodeId !== id);
    await db.deleteNode(id);
    await db.deleteLinksForNode(id);
    setState({ nodes, links });
  },
  async deleteLink(id) {
    const links = state.links.filter((link) => link.id !== id);
    await db.deleteLink(id);
    setState({ links });
  },
  setViewMode(mode) {
    setState({ viewMode: mode });
  },
  setArenaSize(width, height) {
    setState({ arenaSize: { width, height } });
    db.setArenaSize(width, height);
  },
  setPersistence(mode) {
    setState({ persistence: mode });
  },
  exportActiveProject() {
    if (!state.activeProjectId) return null;
    const project = state.projects.find((p) => p.id === state.activeProjectId);
    if (!project) return null;
    const snapshot = {
      project,
      nodes: state.nodes.filter((node) => node.projectId === project.id),
      actors: state.actors.filter((actor) => actor.projectId === project.id),
      links: state.links.filter((link) => link.projectId === project.id),
      version: 1,
    };
    return JSON.stringify(snapshot, null, 2);
  },
  async importProject(serialized) {
    const data = JSON.parse(serialized);
    const project: Project = data.project;
    await db.saveProject(project);
    await db.saveNodes(data.nodes);
    await db.saveActors(data.actors);
    await db.saveLinks(data.links);
    setState({
      projects: [...state.projects.filter((p) => p.id !== project.id), project],
      nodes: [...state.nodes.filter((n) => n.projectId !== project.id), ...data.nodes],
      actors: [...state.actors.filter((a) => a.projectId !== project.id), ...data.actors],
      links: [...state.links.filter((l) => l.projectId !== project.id), ...data.links],
      activeProjectId: project.id,
    });
  },
};
