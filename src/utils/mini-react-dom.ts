import { VNode, render as renderVNode } from './mini-react.js';

export function render(vnode: VNode | null, container: HTMLElement) {
  renderVNode(vnode, container);
}

export default { render };
