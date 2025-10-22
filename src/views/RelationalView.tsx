import { jsx, jsxs, useState } from '../utils/mini-react.js';
import { ActionNode, Actor, Link } from '../schema/index.js';

interface RelationalViewProps {
  nodes: ActionNode[];
  actors: Actor[];
  links: Link[];
  onFocus(id: string): void;
}

type TabKey = 'nodes' | 'actors' | 'links';

export default function RelationalView({ nodes, actors, links, onFocus }: RelationalViewProps) {
  const [tab, setTab] = useState<TabKey>('nodes');
  return jsxs('div', {
    class: 'table-container',
    children: [
      jsxs('div', {
        style: 'display:flex;gap:0.5rem;margin-bottom:1rem;',
        children: [
          jsx('button', {
            class: `tab-button ${tab === 'nodes' ? 'active' : ''}`,
            onclick: () => setTab('nodes'),
            children: `Action Nodes (${nodes.length})`,
          }),
          jsx('button', {
            class: `tab-button ${tab === 'actors' ? 'active' : ''}`,
            onclick: () => setTab('actors'),
            children: `Actors (${actors.length})`,
          }),
          jsx('button', {
            class: `tab-button ${tab === 'links' ? 'active' : ''}`,
            onclick: () => setTab('links'),
            children: `Links (${links.length})`,
          }),
        ],
      }),
      jsx('div', {
        class: 'table-scroll',
        children: tab === 'nodes' ? nodeTable(nodes, onFocus) : tab === 'actors' ? actorTable(actors) : linkTable(links, onFocus),
      }),
    ],
  });
}

function nodeTable(nodes: ActionNode[], onFocus: (id: string) => void) {
  return jsxs('table', {
    children: [
      jsx('thead', {
        children: jsx('tr', {
          children: [
            'Title',
            'Completeness',
            'Authorizers',
            'Legal Bases',
          ].map((label) => jsx('th', { children: label })),
        }),
      }),
      jsx('tbody', {
        children: nodes.map((node) =>
          jsxs('tr', {
            style: 'cursor:pointer;',
            onclick: () => onFocus(node.id),
            children: [
              jsx('td', { children: node.title }),
              jsx('td', { children: `${Math.round(node.completenessScore)}%` }),
              jsx('td', { children: node.authorizers.length }),
              jsx('td', { children: node.legalBases.length }),
            ],
          })
        ),
      }),
    ],
  });
}

function actorTable(actors: Actor[]) {
  return jsxs('table', {
    children: [
      jsx('thead', {
        children: jsx('tr', {
          children: ['Name', 'Type', 'Notes'].map((label) => jsx('th', { children: label })),
        }),
      }),
      jsx('tbody', {
        children: actors.map((actor) =>
          jsxs('tr', {
            children: [
              jsx('td', { children: actor.name }),
              jsx('td', { children: actor.type }),
              jsx('td', { children: actor.notes ?? '' }),
            ],
          })
        ),
      }),
    ],
  });
}

function linkTable(links: Link[], onFocus: (id: string) => void) {
  return jsxs('table', {
    children: [
      jsx('thead', {
        children: jsx('tr', {
          children: ['From', 'To', 'Type', 'Label'].map((label) => jsx('th', { children: label })),
        }),
      }),
      jsx('tbody', {
        children: links.map((link) =>
          jsxs('tr', {
            onclick: () => onFocus(link.fromNodeId),
            children: [
              jsx('td', { children: link.fromNodeId }),
              jsx('td', { children: link.toNodeId }),
              jsx('td', { children: link.type }),
              jsx('td', { children: link.label ?? '' }),
            ],
          })
        ),
      }),
    ],
  });
}
