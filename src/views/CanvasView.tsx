import { useEffect, useMemo, useState, jsx, jsxs } from '../utils/mini-react.js';
import { ActionNode, Link, Project } from '../schema/index.js';
import { linkStyles } from '../canvas/styles.js';
import { expandArenaIfNeeded } from '../canvas/dynamics.js';
import { completenessColor } from '../utils/scoring.js';
import { store } from '../state/store.js';

interface CanvasViewProps {
  project: Project;
  nodes: ActionNode[];
  links: Link[];
  onSelectNode(id: string | null): void;
  focusedNodeId: string | null;
}

export interface PositionedNode extends ActionNode {
  x: number;
  y: number;
}

export default function CanvasView({ project, nodes, links, onSelectNode, focusedNodeId }: CanvasViewProps) {
  const [arena, setArena] = useState(project.config.arena);

  useEffect(() => {
    setArena(project.config.arena);
  }, [project.id]);

  const positioned = useMemo(() => layoutNodes(nodes, arena), [nodes, arena.initialWidth, arena.initialHeight]);
  const focus = nodes.find((node) => node.id === focusedNodeId) ?? null;

  useEffect(() => {
    if (!focus) return;
    const outgoing = links.filter((link) => link.fromNodeId === focus.id).length;
    const expanded = expandArenaIfNeeded(arena, outgoing);
    if (expanded.initialWidth !== arena.initialWidth || expanded.initialHeight !== arena.initialHeight) {
      setArena(expanded);
      store.setArenaSize(expanded.initialWidth, expanded.initialHeight);
    }
  }, [focus?.id, links.length]);

  return jsxs('div', {
    class: 'shadow-zone',
    style: `position:relative;padding:2rem;overflow:auto;`,
    children: [
      jsxs('div', {
        class: 'grid-background',
        style: `background-color:#fff;border-radius:32px;width:${arena.initialWidth}px;height:${arena.initialHeight}px;position:relative;margin:auto;`,
        children: [
          jsx('svg', {
            width: arena.initialWidth,
            height: arena.initialHeight,
            style: 'position:absolute;inset:0;pointer-events:none;',
            children: links
              .filter((link) => project.config.allowedLinkTypes.includes(link.type))
              .map((link) => {
                const from = positioned.find((node) => node.id === link.fromNodeId);
                const to = positioned.find((node) => node.id === link.toNodeId);
                if (!from || !to) return null;
                const style = linkStyles[link.type as keyof typeof linkStyles] ?? linkStyles.AUTHORIZES;
                return jsx('line', {
                  x1: from.x,
                  y1: from.y,
                  x2: to.x,
                  y2: to.y,
                  stroke: style.color,
                  'stroke-width': style.width,
                  'stroke-dasharray': style.dash,
                });
              }),
          }),
          positioned.map((node) =>
            jsxs('div', {
              class: 'card',
              style: `position:absolute;left:${node.x - 120}px;top:${node.y - 80}px;width:240px;cursor:pointer;border:${
                node.id === focusedNodeId ? '2px solid #2563eb' : '1px solid #e2e8f0'
              };`,
              onclick: () => onSelectNode(node.id),
              children: [
                jsx('div', { style: 'font-weight:600;', children: node.title }),
                jsx('div', {
                  style: 'font-size:0.875rem;color:#475569;',
                  children: `${node.authorizers.length} authorizers • ${node.legalBases.length} legal bases`,
                }),
                jsxs('div', {
                  style: 'display:flex;align-items:center;gap:0.5rem;margin-top:0.5rem;',
                  children: [
                    jsx('div', {
                      style: `width:10px;height:10px;border-radius:999px;background:${completenessColor(
                        node.completenessScore
                      )};`,
                    }),
                    jsx('span', { style: 'font-size:0.75rem;text-transform:uppercase;letter-spacing:0.08em;', children: `${Math.round(node.completenessScore)}%` }),
                  ],
                }),
              ],
            })
          ),
        ],
      }),
    ],
  });
}

export function layoutNodes(nodes: ActionNode[], arena: { initialWidth: number; initialHeight: number }): PositionedNode[] {
  const count = nodes.length;
  if (count === 0) return [];
  const centerX = arena.initialWidth / 2;
  const centerY = arena.initialHeight / 2;
  const radius = Math.min(centerX, centerY) - 120;
  return nodes.map((node, index) => {
    const angle = (index / count) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    return { ...node, x, y };
  });
}
