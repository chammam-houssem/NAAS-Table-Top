import { equal, rejects } from './helpers/assert.js';

declare const process: { exit(code: number): void; stderr: any };
import { store } from '../src/state/store.js';
import { resetMemoryStorage } from '../src/data/storage.js';

async function runStoreTests() {
  resetMemoryStorage();
  store.setState({
    ...store.getState(),
    projects: [],
    nodes: [],
    actors: [],
    links: [],
    activeProjectId: null,
  });
  const project = await store.createProject('Test', {
    allowedLinkTypes: ['AUTHORIZES'],
    layout: 'force',
    arena: { initialWidth: 1200, initialHeight: 800 },
    autosave: true,
  });
  const nodeA = await store.createNode({ title: 'Node A' });
  const nodeB = await store.createNode({ title: 'Node B' });
  const link = await store.createLink({
    projectId: project.id,
    fromNodeId: nodeA.id,
    toNodeId: nodeB.id,
    type: 'AUTHORIZES',
    label: 'Test',
    notes: '',
    evidence: '',
  } as any);
  equal(store.getState().links.length, 1);
  equal(link.fromNodeId, nodeA.id);

  await rejects(() =>
    store.createLink({
      projectId: project.id,
      fromNodeId: nodeA.id,
      toNodeId: nodeB.id,
      type: 'REGULATED_BY',
      label: '',
      notes: '',
      evidence: '',
    } as any)
  );
}

runStoreTests()
  .then(() => console.log('store tests passed'))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
