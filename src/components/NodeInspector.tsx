import { jsx, jsxs, useEffect, useMemo, useState } from '../utils/mini-react.js';
import { ActionNode, Actor, LinkType } from '../schema/index.js';
import { store } from '../state/store.js';
import { completenessColor } from '../utils/scoring.js';

interface NodeInspectorProps {
  node: ActionNode;
  actors: Actor[];
  allowedLinks: LinkType[];
  onCreateLink(target: ActionNode | null): void;
}

export default function NodeInspector({ node, actors, allowedLinks, onCreateLink }: NodeInspectorProps) {
  const [draft, setDraft] = useState<ActionNode>(node);

  useEffect(() => {
    setDraft(node);
  }, [node.id]);

  const completeness = useMemo(() => Math.round(node.completenessScore), [node.completenessScore]);

  const handleSave = () => {
    store.updateNode(node.id, draft);
  };

  const handleCreate = async () => {
    const newNode = await store.createNode({ title: 'New Action' });
    await store.createLink({
      projectId: node.projectId,
      fromNodeId: node.id,
      toNodeId: newNode.id,
      type: allowedLinks[0] ?? 'AUTHORIZES',
      label: 'Next action',
      notes: '',
      evidence: '',
    } as any);
    onCreateLink(newNode);
  };

  return jsxs('div', {
    class: 'card',
    style: 'width:360px;position:sticky;top:2rem;height:calc(100vh - 4rem);overflow:auto;',
    children: [
      jsx('h3', { children: 'Inspector' }),
      jsxs('div', {
        style: 'display:flex;align-items:center;gap:0.5rem;font-size:0.875rem;',
        children: [
          jsx('div', {
            style: `width:12px;height:12px;border-radius:999px;background:${completenessColor(node.completenessScore)};`,
          }),
          jsx('span', { children: `${completeness}% complete` }),
        ],
      }),
      field('Title', jsx('input', {
        value: draft.title,
        oninput: (e: any) => setDraft({ ...draft, title: e.target.value }),
      })),
      field('Summary', jsx('textarea', {
        value: draft.summary,
        oninput: (e: any) => setDraft({ ...draft, summary: e.target.value }),
        rows: 4,
      })),
      field('Authorizers', jsx('textarea', {
        value: draft.authorizers.join('\n'),
        oninput: (e: any) => setDraft({ ...draft, authorizers: e.target.value.split('\n').filter(Boolean) }),
        rows: 3,
      })),
      field('PPP Role', jsx('select', {
        value: draft.pppRole,
        onchange: (e: any) => setDraft({ ...draft, pppRole: e.target.value }),
        children: ['None', 'Financing', 'Operation', 'Co-Management', 'Other'].map((role) =>
          jsx('option', { value: role, children: role })
        ),
      })),
      field('Legal Bases', jsx('textarea', {
        value: draft.legalBases.map((basis) => basis.citation).join('\n'),
        oninput: (e: any) => {
          const entries = (e.target.value as string)
            .split('\n')
            .filter(Boolean)
            .map((citation: string) => ({
              citation,
              jurisdiction: node.projectId,
              url: undefined,
              effectiveFrom: undefined,
              effectiveTo: undefined,
            }));
          setDraft({
            ...draft,
            legalBases: entries,
          });
        },
        rows: 3,
      })),
      field('Rules to Follow', jsx('textarea', {
        value: draft.rulesToFollow.map((rule) => rule.label).join('\n'),
        oninput: (e: any) => {
          const entries = (e.target.value as string)
            .split('\n')
            .filter(Boolean)
            .map((label: string) => ({ label, description: label, source: '' }));
          setDraft({
            ...draft,
            rulesToFollow: entries,
          });
        },
        rows: 3,
      })),
      field('Abuse Examples', jsx('textarea', {
        value: draft.abuseExamples.map((abuse) => abuse.title).join('\n'),
        oninput: (e: any) => {
          const entries = (e.target.value as string)
            .split('\n')
            .filter(Boolean)
            .map((title: string) => ({ title, description: title, source: '', year: undefined }));
          setDraft({
            ...draft,
            abuseExamples: entries,
          });
        },
        rows: 3,
      })),
      jsx('button', {
        class: 'tab-button active',
        style: 'align-self:flex-end;',
        onclick: handleSave,
        children: 'Save Changes',
      }),
      completeness >= 70
        ? jsx('button', {
            class: 'tab-button',
            style: 'margin-top:1rem;background:#2563eb;color:white;',
            onclick: handleCreate,
            children: 'Link to new action',
          })
        : null,
    ],
  });
}

function field(label: string, input: any) {
  return jsxs('label', {
    style: 'display:flex;flex-direction:column;gap:0.5rem;margin-top:1rem;',
    children: [jsx('span', { style: 'font-size:0.75rem;text-transform:uppercase;color:#64748b;', children: label }), input],
  });
}
