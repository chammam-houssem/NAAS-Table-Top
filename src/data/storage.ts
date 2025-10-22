import { ActionNode, Actor, Link, Project, schemaVersion } from '../schema/index.js';

type DBSnapshot = {
  projects: Project[];
  nodes: ActionNode[];
  actors: Actor[];
  links: Link[];
  activeProjectId: string | null;
  arenaSize: { width: number; height: number };
};

const DB_NAME = 'action-situations';
const DB_VERSION = schemaVersion;
const hasIndexedDB = typeof indexedDB !== 'undefined';

const memoryStore = {
  projects: [] as Project[],
  nodes: [] as ActionNode[],
  actors: [] as Actor[],
  links: [] as Link[],
  meta: new Map<string, any>(),
};

function openDB(): Promise<IDBDatabase> {
  if (!hasIndexedDB) {
    throw new Error('IndexedDB not available');
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('nodes')) {
        const store = db.createObjectStore('nodes', { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
      }
      if (!db.objectStoreNames.contains('actors')) {
        const store = db.createObjectStore('actors', { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
      }
      if (!db.objectStoreNames.contains('links')) {
        const store = db.createObjectStore('links', { keyPath: 'id' });
        store.createIndex('projectId', 'projectId', { unique: false });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function readAll<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as T[]);
  });
}

async function put<T>(db: IDBDatabase, storeName: string, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(value as any);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function putMany<T>(db: IDBDatabase, storeName: string, values: T[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const value of values) store.put(value as any);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function deleteByKey(db: IDBDatabase, storeName: string, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export const db = {
  async load(): Promise<DBSnapshot> {
    if (!hasIndexedDB) {
      const arena =
        memoryStore.meta.get('arenaSize') ?? {
          width: 1200,
          height: 800,
        };
      return {
        projects: [...memoryStore.projects],
        nodes: [...memoryStore.nodes],
        actors: [...memoryStore.actors],
        links: [...memoryStore.links],
        activeProjectId: memoryStore.meta.get('activeProjectId') ?? null,
        arenaSize: arena,
      };
    }
    const db = await openDB();
    const [projects, nodes, actors, links, meta] = await Promise.all([
      readAll<Project>(db, 'projects'),
      readAll<ActionNode>(db, 'nodes'),
      readAll<Actor>(db, 'actors'),
      readAll<Link>(db, 'links'),
      new Promise<{ key: string; value: any }[]>((resolve) => {
        const tx = db.transaction('meta', 'readonly');
        const store = tx.objectStore('meta');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result as any);
        req.onerror = () => resolve([]);
      }),
    ]);
    const arena = meta.find((entry) => entry.key === 'arenaSize')?.value ?? {
      width: 1200,
      height: 800,
    };
    const activeProjectId = meta.find((entry) => entry.key === 'activeProjectId')?.value ?? null;
    return { projects, nodes, actors, links, activeProjectId, arenaSize: arena };
  },
  async saveProject(project: Project) {
    if (!hasIndexedDB) {
      const index = memoryStore.projects.findIndex((p) => p.id === project.id);
      if (index >= 0) memoryStore.projects[index] = project;
      else memoryStore.projects.push(project);
      memoryStore.meta.set('activeProjectId', project.id);
      return;
    }
    const db = await openDB();
    await put(db, 'projects', project);
    await this.setMeta('activeProjectId', project.id);
  },
  async saveNode(node: ActionNode) {
    if (!hasIndexedDB) {
      const index = memoryStore.nodes.findIndex((n) => n.id === node.id);
      if (index >= 0) memoryStore.nodes[index] = node;
      else memoryStore.nodes.push(node);
      return;
    }
    const db = await openDB();
    await put(db, 'nodes', node);
  },
  async saveNodes(nodes: ActionNode[]) {
    if (!hasIndexedDB) {
      for (const node of nodes) {
        const index = memoryStore.nodes.findIndex((n) => n.id === node.id);
        if (index >= 0) memoryStore.nodes[index] = node;
        else memoryStore.nodes.push(node);
      }
      return;
    }
    const db = await openDB();
    await putMany(db, 'nodes', nodes);
  },
  async saveActors(actors: Actor[]) {
    if (!hasIndexedDB) {
      for (const actor of actors) {
        const index = memoryStore.actors.findIndex((a) => a.id === actor.id);
        if (index >= 0) memoryStore.actors[index] = actor;
        else memoryStore.actors.push(actor);
      }
      return;
    }
    const db = await openDB();
    await putMany(db, 'actors', actors);
  },
  async saveLink(link: Link) {
    if (!hasIndexedDB) {
      const index = memoryStore.links.findIndex((l) => l.id === link.id);
      if (index >= 0) memoryStore.links[index] = link;
      else memoryStore.links.push(link);
      return;
    }
    const db = await openDB();
    await put(db, 'links', link);
  },
  async saveLinks(links: Link[]) {
    if (!hasIndexedDB) {
      for (const link of links) {
        const index = memoryStore.links.findIndex((l) => l.id === link.id);
        if (index >= 0) memoryStore.links[index] = link;
        else memoryStore.links.push(link);
      }
      return;
    }
    const db = await openDB();
    await putMany(db, 'links', links);
  },
  async deleteNode(id: string) {
    if (!hasIndexedDB) {
      memoryStore.nodes = memoryStore.nodes.filter((node) => node.id !== id);
      memoryStore.links = memoryStore.links.filter((link) => link.fromNodeId !== id && link.toNodeId !== id);
      return;
    }
    const db = await openDB();
    await deleteByKey(db, 'nodes', id);
  },
  async deleteLinksForNode(id: string) {
    if (!hasIndexedDB) {
      memoryStore.links = memoryStore.links.filter((link) => link.fromNodeId !== id && link.toNodeId !== id);
      return;
    }
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('links', 'readwrite');
      const store = tx.objectStore('links');
      const request = store.openCursor();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const value = cursor.value as Link;
          if (value.fromNodeId === id || value.toNodeId === id) {
            store.delete(cursor.primaryKey);
          }
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  },
  async deleteLink(id: string) {
    if (!hasIndexedDB) {
      memoryStore.links = memoryStore.links.filter((link) => link.id !== id);
      return;
    }
    const db = await openDB();
    await deleteByKey(db, 'links', id);
  },
  async setMeta(key: string, value: any) {
    if (!hasIndexedDB) {
      memoryStore.meta.set(key, value);
      return;
    }
    const db = await openDB();
    await put(db, 'meta', { key, value });
  },
  async setArenaSize(width: number, height: number) {
    await this.setMeta('arenaSize', { width, height });
  },
};

export function resetMemoryStorage() {
  if (!hasIndexedDB) {
    memoryStore.projects = [];
    memoryStore.nodes = [];
    memoryStore.actors = [];
    memoryStore.links = [];
    memoryStore.meta.clear();
  }
}
