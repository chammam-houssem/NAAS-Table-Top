export interface ActionNode {
  id: string;
  name: string;
  position: { x: number; y: number };
  metadata: {
    authority: string;
    digitalAccessibility: 'online' | 'hybrid' | 'in-person';
    pppRole: string;
    regulations: string[];
    caseStudies: string[];
    customFields: Record<string, any>;
  };
  confidenceLevel: number;
  createdAt: number;
  lastModified: number;
  // D3.js simulation properties
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface RelationshipEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: string;
  metadata?: Record<string, any>;
  createdAt: number;
  // D3.js simulation properties
  source?: ActionNode | string;
  target?: ActionNode | string;
}

export interface GameState {
  nodes: ActionNode[];
  edges: RelationshipEdge[];
  relationshipTypes: string[];
  viewport: {
    zoom: number;
    panX: number;
    panY: number;
    arenaSize: number;
  };
  settings: {
    maxLinksBeforeExpansion: number;
    autoLayout: boolean;
  };
}

export interface GameAction {
  type: 'ADD_NODE' | 'UPDATE_NODE' | 'DELETE_NODE' | 'ADD_EDGE' | 'DELETE_EDGE' | 'UPDATE_VIEWPORT' | 'SET_RELATIONSHIP_TYPES' | 'RESET_GAME';
  payload?: any;
}

export interface NodeModalProps {
  node: ActionNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: ActionNode) => void;
}

export interface CanvasProps {
  nodes: ActionNode[];
  edges: RelationshipEdge[];
  relationshipTypes: string[];
  onNodeClick: (node: ActionNode) => void;
  onNodeCreate: (position: { x: number; y: number }) => void;
  onNodeUpdate: (node: ActionNode) => void;
  onEdgeCreate: (sourceId: string, targetId: string, relationshipType: string) => void;
}
