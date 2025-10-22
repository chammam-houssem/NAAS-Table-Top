import { useState } from 'react';
import { GameProvider } from './hooks/useGameState';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import NodeModal from './components/NodeModal';
import RelationshipConfigModal from './components/RelationshipConfigModal';
import { ActionNode } from './types';

type Position = { x: number; y: number };

function App() {
  const [selectedNode, setSelectedNode] = useState<ActionNode | null>(null);
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);
  const [pendingNodePosition, setPendingNodePosition] = useState<Position | null>(null);

  const handleNodeClick = (node: ActionNode) => {
    setSelectedNode(node);
    setPendingNodePosition(null);
    setIsNodeModalOpen(true);
  };

  const handleNodeCreate = (position: Position) => {
    setSelectedNode(null);
    setPendingNodePosition(position);
    setIsNodeModalOpen(true);
  };

  const handleNodeModalClose = () => {
    setIsNodeModalOpen(false);
    setSelectedNode(null);
    setPendingNodePosition(null);
  };

  const handleNodeSave = () => {
    // Node is saved through the context
    setIsNodeModalOpen(false);
    setSelectedNode(null);
  };

  return (
    <GameProvider>
      <div className="app">
        <Toolbar />
        <Canvas 
          onNodeClick={handleNodeClick}
          onNodeCreate={handleNodeCreate}
          onNodeUpdate={handleNodeSave}
          onEdgeCreate={() => {}}
        />
        <NodeModal
          node={selectedNode}
          isOpen={isNodeModalOpen}
          pendingPosition={pendingNodePosition}
          onClose={handleNodeModalClose}
        />
        <RelationshipConfigModal />
      </div>
    </GameProvider>
  );
}

export default App;
