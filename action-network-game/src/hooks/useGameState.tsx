import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { GameState, GameAction, ActionNode, RelationshipEdge } from '../types';

const STORAGE_KEY = 'action-network-game-state';

const initialGameState: GameState = {
  nodes: [],
  edges: [],
  relationshipTypes: ['requires', 'enables', 'conflicts with', 'regulated by'],
  viewport: {
    zoom: 1,
    panX: 0,
    panY: 0,
    arenaSize: 800,
  },
  settings: {
    maxLinksBeforeExpansion: 6,
    autoLayout: true,
  },
};

function gameStateReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ADD_NODE': {
      const newNode: ActionNode = {
        id: action.payload.id,
        name: action.payload.name,
        position: action.payload.position,
        metadata: {
          authority: action.payload.authority || '',
          digitalAccessibility: action.payload.digitalAccessibility || 'in-person',
          pppRole: action.payload.pppRole || '',
          regulations: action.payload.regulations || [],
          caseStudies: action.payload.caseStudies || [],
          customFields: action.payload.customFields || {},
        },
        confidenceLevel: action.payload.confidenceLevel || 0,
        createdAt: Date.now(),
        lastModified: Date.now(),
      };
      return {
        ...state,
        nodes: [...state.nodes, newNode],
      };
    }

    case 'UPDATE_NODE': {
      const updatedNode = action.payload;
      return {
        ...state,
        nodes: state.nodes.map(node =>
          node.id === updatedNode.id
            ? { ...updatedNode, lastModified: Date.now() }
            : node
        ),
      };
    }

    case 'DELETE_NODE': {
      const nodeId = action.payload;
      return {
        ...state,
        nodes: state.nodes.filter(node => node.id !== nodeId),
        edges: state.edges.filter(
          edge => edge.sourceNodeId !== nodeId && edge.targetNodeId !== nodeId
        ),
      };
    }

    case 'ADD_EDGE': {
      const newEdge: RelationshipEdge = {
        id: action.payload.id,
        sourceNodeId: action.payload.sourceNodeId,
        targetNodeId: action.payload.targetNodeId,
        relationshipType: action.payload.relationshipType,
        metadata: action.payload.metadata,
        createdAt: Date.now(),
      };
      
      const newEdges = [...state.edges, newEdge];
      const newEdgeCount = newEdges.length;
      
      // Arena expansion logic
      let newArenaSize = state.viewport.arenaSize;
      if (newEdgeCount > state.settings.maxLinksBeforeExpansion) {
        // Expand arena progressively
        const expansionFactor = Math.ceil((newEdgeCount - state.settings.maxLinksBeforeExpansion) / 10) + 1;
        newArenaSize = Math.max(state.viewport.arenaSize, 800 * expansionFactor);
      }
      
      return {
        ...state,
        edges: newEdges,
        viewport: {
          ...state.viewport,
          arenaSize: newArenaSize,
        },
      };
    }

    case 'DELETE_EDGE': {
      const edgeId = action.payload;
      return {
        ...state,
        edges: state.edges.filter(edge => edge.id !== edgeId),
      };
    }

    case 'UPDATE_VIEWPORT': {
      return {
        ...state,
        viewport: { ...state.viewport, ...action.payload },
      };
    }

    case 'SET_RELATIONSHIP_TYPES': {
      return {
        ...state,
        relationshipTypes: action.payload,
      };
    }

    case 'RESET_GAME': {
      return initialGameState;
    }

    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  addNode: (nodeData: Partial<ActionNode>) => string;
  updateNode: (node: ActionNode) => void;
  deleteNode: (nodeId: string) => void;
  addEdge: (sourceId: string, targetId: string, relationshipType: string) => void;
  deleteEdge: (edgeId: string) => void;
  updateViewport: (viewport: Partial<GameState['viewport']>) => void;
  setRelationshipTypes: (types: string[]) => void;
  resetGame: () => void;
  exportGame: () => string;
  importGame: (gameData: string) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameStateReducer, initialGameState);

  // Load from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // Only restore if it has the expected structure
        if (parsedState.nodes && parsedState.edges) {
          dispatch({ type: 'RESET_GAME' });
          parsedState.nodes.forEach((node: ActionNode) => {
            dispatch({ type: 'ADD_NODE', payload: node });
          });
          parsedState.edges.forEach((edge: RelationshipEdge) => {
            dispatch({ type: 'ADD_EDGE', payload: edge });
          });
          if (parsedState.relationshipTypes) {
            dispatch({ type: 'SET_RELATIONSHIP_TYPES', payload: parsedState.relationshipTypes });
          }
        }
      } catch (error) {
        console.error('Failed to load saved game state:', error);
      }
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [state]);

  const addNode = (nodeData: Partial<ActionNode>) => {
    const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    dispatch({
      type: 'ADD_NODE',
      payload: { ...nodeData, id },
    });
    return id;
  };

  const updateNode = (node: ActionNode) => {
    dispatch({ type: 'UPDATE_NODE', payload: node });
  };

  const deleteNode = (nodeId: string) => {
    dispatch({ type: 'DELETE_NODE', payload: nodeId });
  };

  const addEdge = (sourceId: string, targetId: string, relationshipType: string) => {
    const id = `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    dispatch({
      type: 'ADD_EDGE',
      payload: { id, sourceNodeId: sourceId, targetNodeId: targetId, relationshipType },
    });
  };

  const deleteEdge = (edgeId: string) => {
    dispatch({ type: 'DELETE_EDGE', payload: edgeId });
  };

  const updateViewport = (viewport: Partial<GameState['viewport']>) => {
    dispatch({ type: 'UPDATE_VIEWPORT', payload: viewport });
  };

  const setRelationshipTypes = (types: string[]) => {
    dispatch({ type: 'SET_RELATIONSHIP_TYPES', payload: types });
  };

  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' });
    localStorage.removeItem(STORAGE_KEY);
  };

  const exportGame = () => {
    return JSON.stringify(state, null, 2);
  };

  const importGame = (gameData: string) => {
    try {
      const parsedState = JSON.parse(gameData);
      resetGame();
      parsedState.nodes.forEach((node: ActionNode) => {
        dispatch({ type: 'ADD_NODE', payload: node });
      });
      parsedState.edges.forEach((edge: RelationshipEdge) => {
        dispatch({ type: 'ADD_EDGE', payload: edge });
      });
      if (parsedState.relationshipTypes) {
        dispatch({ type: 'SET_RELATIONSHIP_TYPES', payload: parsedState.relationshipTypes });
      }
    } catch (error) {
      console.error('Failed to import game data:', error);
      throw new Error('Invalid game data format');
    }
  };

  const contextValue: GameContextType = {
    state,
    dispatch,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    deleteEdge,
    updateViewport,
    setRelationshipTypes,
    resetGame,
    exportGame,
    importGame,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameProvider');
  }
  return context;
}
