import { useEffect, useState, jsx, jsxs } from '../utils/mini-react.js';
import { linkTypes, Project } from '../schema/index.js';
import { store } from '../state/store.js';

interface WizardProps {
  onClose(project: Project): void;
}

const defaultConfig = {
  allowedLinkTypes: linkTypes.slice(0, 6),
  layout: 'force',
  arena: { initialWidth: 1200, initialHeight: 800 },
  autosave: true,
};

export default function ProjectWizard({ onClose }: WizardProps) {
  const [name, setName] = useState('New Project');
  const [allowed, setAllowed] = useState<string[]>(defaultConfig.allowedLinkTypes);
  const [layout, setLayout] = useState('force');
  const [autosave, setAutosave] = useState(true);

  useEffect(() => {
    if (allowed.length === 0) {
      setAllowed([linkTypes[0]]);
    }
  }, [allowed.length]);

  const toggleLinkType = (type: string) => {
    setAllowed((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleCreate = async () => {
    const project = await store.createProject(name, {
      allowedLinkTypes: allowed,
      layout,
      arena: { initialWidth: 1200, initialHeight: 800 },
      autosave,
    });
    onClose(project);
  };

  return jsxs('div', {
    class: 'wizard-backdrop',
    children: [
      jsxs('div', {
        class: 'card',
        style: 'max-width: 640px;margin: 6rem auto;',
        children: [
          jsx('h2', { children: 'Create Project' }),
          jsx('label', {
            children: jsxs('div', {
              class: 'field',
              children: [
                jsx('span', { children: 'Project name' }),
                jsx('input', {
                  value: name,
                  oninput: (e: any) => setName(e.target.value),
                  style: 'padding:0.75rem;border-radius:0.75rem;border:1px solid #cbd5f5;width:100%;',
                }),
              ],
            }),
          }),
          jsx('div', { children: 'Allowed link types' }),
          jsx('div', {
            style: 'display:flex;flex-wrap:wrap;gap:0.5rem;',
            children: allowedButtons(allowed, toggleLinkType),
          }),
          jsx('div', {
            children: jsxs('label', {
              style: 'display:flex;flex-direction:column;gap:0.5rem;margin-top:1rem;',
              children: [
                jsx('span', { children: 'Layout Engine' }),
                jsx('select', {
                  value: layout,
                  onchange: (e: any) => setLayout(e.target.value),
                  style: 'padding:0.75rem;border-radius:0.75rem;border:1px solid #cbd5f5;',
                  children: [
                    jsx('option', { value: 'force', children: 'Force Directed' }),
                    jsx('option', { value: 'layered', children: 'Layered' }),
                  ],
                }),
              ],
            }),
          }),
          jsx('label', {
            style: 'display:flex;align-items:center;gap:0.5rem;margin-top:1rem;',
            children: [
              jsx('input', {
                type: 'checkbox',
                checked: autosave,
                onchange: (e: any) => setAutosave(e.target.checked),
              }),
              jsx('span', { children: 'Enable autosave' }),
            ],
          }),
          jsx('button', {
            class: 'tab-button active',
            style: 'margin-top:1.5rem;align-self:flex-end;',
            onclick: handleCreate,
            children: 'Create project',
          }),
        ],
      }),
    ],
  });
}

function allowedButtons(selected: string[], toggle: (value: string) => void) {
  return linkTypes.map((type) =>
    jsx('button', {
      class: `tab-button ${selected.includes(type) ? 'active' : ''}`,
      onclick: () => toggle(type),
      children: type.replace(/_/g, ' '),
    })
  );
}
