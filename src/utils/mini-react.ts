export type Key = string | number | null;
export type Component<P = any> = (props: P & { children?: any }) => VNode | null;
export type VNodeType = string | Component<any> | typeof Fragment;
export interface VNode<P = any> {
  type: VNodeType;
  props: P & { children?: any };
  key?: Key;
}

export const Fragment = Symbol('Fragment');

interface HookState {
  value: any;
  cleanup?: (() => void) | null;
  deps?: any[];
}

interface ComponentInstance {
  hooks: HookState[];
  effects: (() => void)[];
  vnode: VNode | null;
  parentDom: Node | null;
  dom: Node | null;
  hookIndex: number;
  pendingRerender: boolean;
}

const instanceMap = new WeakMap<VNode, ComponentInstance>();
let currentInstance: ComponentInstance | null = null;
let currentContext = new Map<symbol, any>();
const contextStack: Array<Map<symbol, any>> = [];

function createInstance(vnode: VNode, parentDom: Node): ComponentInstance {
  const instance: ComponentInstance = {
    hooks: [],
    effects: [],
    vnode,
    parentDom,
    dom: null,
    hookIndex: 0,
    pendingRerender: false,
  };
  instanceMap.set(vnode, instance);
  return instance;
}

function areDepsEqual(a?: any[], b?: any[]): boolean {
  if (!a || !b || a.length !== b.length) return false;
  return a.every((value, index) => Object.is(value, b[index]));
}

function cleanupEffects(instance: ComponentInstance) {
  for (const hook of instance.hooks) {
    if (hook.cleanup) {
      try {
        hook.cleanup();
      } catch (error) {
        console.error('Effect cleanup failed', error);
      }
    }
    hook.cleanup = null;
  }
}

export function useState<T>(initial: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void] {
  if (!currentInstance) throw new Error('useState must be used within a component');
  const index = currentInstance.hookIndex++;
  const hooks = currentInstance.hooks;
  if (!(index in hooks)) {
    const value = typeof initial === 'function' ? (initial as () => T)() : initial;
    hooks[index] = { value };
  }
  const setState = (value: T | ((prev: T) => T)) => {
    const old = hooks[index].value;
    const next = typeof value === 'function' ? (value as (prev: T) => T)(old) : value;
    if (!Object.is(old, next)) {
      hooks[index].value = next;
      scheduleRerender(currentInstance!);
    }
  };
  return [hooks[index].value as T, setState];
}

export function useRef<T>(initial: T | null): { current: T | null } {
  if (!currentInstance) throw new Error('useRef must be used within a component');
  const index = currentInstance.hookIndex++;
  if (!(index in currentInstance.hooks)) {
    currentInstance.hooks[index] = { value: { current: initial } };
  }
  return currentInstance.hooks[index].value;
}

export function useMemo<T>(factory: () => T, deps: any[]): T {
  if (!currentInstance) throw new Error('useMemo must be used within a component');
  const index = currentInstance.hookIndex++;
  const hooks = currentInstance.hooks;
  const hook = hooks[index];
  if (hook && hook.deps && areDepsEqual(hook.deps, deps)) {
    return hook.value;
  }
  const value = factory();
  hooks[index] = { value, deps };
  return value;
}

export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T {
  return useMemo(() => callback, deps);
}

export function useEffect(effect: () => void | (() => void), deps?: any[]): void {
  if (!currentInstance) throw new Error('useEffect must be used within a component');
  const index = currentInstance.hookIndex++;
  const hooks = currentInstance.hooks;
  const previous = hooks[index];
  if (!deps || !previous || !previous.deps || !areDepsEqual(previous.deps, deps)) {
    hooks[index] = { value: null, deps, cleanup: previous?.cleanup ?? null };
    currentInstance.effects.push(() => {
      if (hooks[index].cleanup) {
        try {
          hooks[index].cleanup?.();
        } catch (error) {
          console.error('Effect cleanup failed', error);
        }
      }
      const cleanup = effect();
      if (cleanup && typeof cleanup === 'function') {
        hooks[index].cleanup = cleanup;
      }
    });
  }
}

export function createContext<T>(defaultValue: T) {
  const contextSymbol = Symbol('Context');
  return {
    $$typeof: contextSymbol,
    defaultValue,
    Provider: ({ value, children }: { value: T; children?: any }) => {
      contextStack.push(currentContext);
      const map = new Map(currentContext);
      map.set(contextSymbol, value);
      currentContext = map;
      const fragment = { type: Fragment, props: { children } } as VNode;
      currentContext = contextStack.pop() ?? new Map();
      return fragment;
    },
  } as const;
}

export function useContext<T>(context: ReturnType<typeof createContext<T>>): T {
  if (currentContext.has(context.$$typeof)) {
    return currentContext.get(context.$$typeof) as T;
  }
  return context.defaultValue;
}

export function jsx(type: VNodeType, props: any, key?: Key): VNode {
  return createVNode(type, props ?? {}, key ?? null);
}

export const jsxs = jsx;
export const jsxDEV = jsx;

export function createElement(type: VNodeType, props: any, ...children: any[]): VNode {
  return createVNode(type, { ...(props || {}), children }, props?.key ?? null);
}

function createVNode(type: VNodeType, props: any, key: Key | null): VNode {
  const normalizedProps = { ...props };
  if (Array.isArray(props?.children)) {
    normalizedProps.children = props.children.flat();
  }
  return { type, props: normalizedProps, key: key ?? null };
}

function scheduleRerender(instance: ComponentInstance) {
  if (instance.pendingRerender) return;
  instance.pendingRerender = true;
  queueMicrotask(() => {
    instance.pendingRerender = false;
    if (instance.vnode && instance.parentDom) {
      renderVNode(instance.vnode, instance.parentDom, instance.dom ?? undefined, instance);
    }
  });
}

function setCurrentInstance(instance: ComponentInstance | null) {
  currentInstance = instance;
}

function renderChildren(children: any, parentDom: Node) {
  if (Array.isArray(children)) {
    for (const child of children) {
      mount(child, parentDom);
    }
  } else {
    mount(children, parentDom);
  }
}

function updateProps(dom: HTMLElement, prevProps: any, nextProps: any) {
  const prevKeys = new Set(Object.keys(prevProps || {}));
  for (const key of Object.keys(nextProps || {})) {
    const value = nextProps[key];
    if (key === 'children') continue;
    if (key.startsWith('on') && typeof value === 'function') {
      const event = key.slice(2).toLowerCase();
      const prev = prevProps?.[key];
      if (prev) dom.removeEventListener(event, prev);
      dom.addEventListener(event, value as EventListener);
    } else if (value === false || value === null || value === undefined) {
      dom.removeAttribute(key);
    } else {
      dom.setAttribute(key, value as string);
    }
    prevKeys.delete(key);
  }
  for (const key of prevKeys) {
    if (key === 'children') continue;
    if (key.startsWith('on') && typeof prevProps[key] === 'function') {
      dom.removeEventListener(key.slice(2).toLowerCase(), prevProps[key]);
    } else {
      dom.removeAttribute(key);
    }
  }
}

function mount(node: any, parentDom: Node): Node | null {
  if (node === null || node === undefined || node === false) return null;
  if (typeof node === 'string' || typeof node === 'number') {
    const text = document.createTextNode(String(node));
    parentDom.appendChild(text);
    return text;
  }
  if ((node as VNode)?.type) {
    const vnode = node as VNode;
    const dom = renderVNode(vnode, parentDom);
    return dom;
  }
  return null;
}

export function renderVNode(vnode: VNode, parentDom: Node, existing?: Node, instance?: ComponentInstance): Node {
  if (typeof vnode.type === 'function') {
    const component = vnode.type as Component<any>;
    const componentInstance = instance ?? instanceMap.get(vnode) ?? createInstance(vnode, parentDom);
    setCurrentInstance(componentInstance);
    componentInstance.hookIndex = 0;
    componentInstance.effects = [];
    contextStack.push(currentContext);
    const rendered = component({ ...(vnode.props || {}), children: vnode.props?.children });
    currentContext = contextStack.pop() ?? new Map();
    setCurrentInstance(null);
    const dom = renderVNode(rendered as VNode, parentDom, componentInstance.dom ?? undefined);
    componentInstance.dom = dom;
    componentInstance.vnode = vnode;
    componentInstance.parentDom = parentDom;
    for (const effect of componentInstance.effects) {
      try {
        effect();
      } catch (error) {
        console.error('Effect execution failed', error);
      }
    }
    return dom;
  }
  if (vnode.type === Fragment) {
    const fragment = document.createDocumentFragment();
    renderChildren(vnode.props?.children, fragment);
    if (existing && existing.parentNode === parentDom) {
      parentDom.replaceChild(fragment, existing);
    } else {
      parentDom.appendChild(fragment);
    }
    return fragment;
  }
  const dom = (existing as HTMLElement) ?? document.createElement(vnode.type as string);
  updateProps(dom, (instance as any)?.props ?? {}, vnode.props ?? {});
  dom.innerHTML = '';
  renderChildren(vnode.props?.children, dom);
  if (!existing || existing !== dom) {
    parentDom.appendChild(dom);
  }
  return dom;
}

export const MiniReact = {
  createElement,
  Fragment,
  jsx,
  jsxs,
  jsxDEV,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  createContext,
  useContext,
  renderVNode,
};

export default MiniReact;

export function render(vnode: VNode | null, container: HTMLElement) {
  if (!vnode) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = '';
  renderVNode(vnode, container);
}
