import { jsx, jsxs, useEffect, useState } from '../utils/mini-react.js';
import { useStore } from '../state/useStore.js';
import { store } from '../state/store.js';
import ProjectWizard from '../views/ProjectWizard.js';
import CanvasView from '../views/CanvasView.js';
import RelationalView from '../views/RelationalView.js';
import NodeInspector from '../components/NodeInspector.js';
import { ActionNode, Project } from '../schema/index.js';

export default function App() {
  const projects = useStore((state) => state.projects);
  const nodes = useStore((state) => state.nodes);
  const actors = useStore((state) => state.actors);
  const links = useStore((state) => state.links);
  const activeProjectId = useStore((state) => state.activeProjectId);
  const viewMode = useStore((state) => state.viewMode);
  const loading = useStore((state) => state.loading);
  const [wizardVisible, setWizardVisible] = useState(false);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

  useEffect(() => {
    store.load().then(() => {
      if (store.getState().projects.length === 0) {
        setWizardVisible(true);
      }
    });
  }, []);

  useEffect(() => {
    if (!activeProjectId) return;
    const projectNodes = nodes.filter((node) => node.projectId === activeProjectId);
    if (projectNodes.length > 0 && !focusNodeId) {
      setFocusNodeId(projectNodes[0].id);
    }
  }, [activeProjectId, nodes.length]);

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? null;
  const projectNodes = nodes.filter((node) => node.projectId === activeProjectId);
  const projectLinks = links.filter((link) => link.projectId === activeProjectId);
  const projectActors = actors.filter((actor) => actor.projectId === activeProjectId);
  const focusedNode = projectNodes.find((node) => node.id === focusNodeId) ?? null;

  if (loading) {
    return jsx('div', { style: 'padding:4rem;text-align:center;color:white;', children: 'Loading…' });
  }

  return jsxs('div', {
    style: 'display:flex;height:100vh;gap:1rem;padding:1.5rem;box-sizing:border-box;',
    children: [
      jsxs('div', {
        style: 'flex:1;display:flex;flex-direction:column;gap:1rem;',
        children: [
          jsxs('header', {
            style: 'display:flex;justify-content:space-between;align-items:center;color:white;',
            children: [
              jsx('h1', { children: 'Action Situations' }),
              jsxs('div', {
                style: 'display:flex;gap:0.5rem;',
                children: [
                  jsx('button', {
                    class: `tab-button ${viewMode === 'canvas' ? 'active' : ''}`,
                    onclick: () => store.setViewMode('canvas'),
                    children: 'Canvas View',
                  }),
                  jsx('button', {
                    class: `tab-button ${viewMode === 'relational' ? 'active' : ''}`,
                    onclick: () => store.setViewMode('relational'),
                    children: 'Relational View',
                  }),
                  jsx('button', {
                    class: 'tab-button',
                    onclick: () => {
                      const data = store.exportActiveProject();
                      if (data) {
                        const blob = new Blob([data], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'project.json';
                        a.click();
                        URL.revokeObjectURL(url);
                      }
                    },
                    children: 'Export JSON',
                  }),
                  jsx('label', {
                    class: 'tab-button',
                    children: [
                      'Import JSON',
                      jsx('input', {
                        type: 'file',
                        accept: 'application/json',
                        style: 'display:none;',
                        onchange: async (e: any) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const text = await file.text();
                          await store.importProject(text);
                        },
                      }),
                    ],
                  }),
                  jsx('button', {
                    class: 'tab-button',
                    onclick: () => setWizardVisible(true),
                    children: 'New Project',
                  }),
                ],
              }),
            ],
          }),
          activeProject && viewMode === 'canvas'
            ? jsx(CanvasView, {
                project: activeProject,
                nodes: projectNodes,
                links: projectLinks,
                focusedNodeId: focusNodeId,
                onSelectNode: (id: string) => setFocusNodeId(id),
              })
            : null,
          activeProject && viewMode === 'relational'
            ? jsx(RelationalView, {
                nodes: projectNodes,
                actors: projectActors,
                links: projectLinks,
                onFocus: (id: string) => {
                  setFocusNodeId(id);
                  store.setViewMode('canvas');
                },
              })
            : null,
        ],
      }),
      focusedNode && activeProject
        ? jsx(NodeInspector, {
            node: focusedNode,
            actors: projectActors,
            allowedLinks: activeProject.config.allowedLinkTypes as any,
            onCreateLink: (newNode: ActionNode | null) => setFocusNodeId(newNode?.id ?? null),
          })
        : null,
      wizardVisible
        ? jsx(ProjectWizard, {
            onClose: (project: Project) => {
              store.selectProject(project.id);
              setWizardVisible(false);
            },
          })
        : null,
    ],
  });
}
