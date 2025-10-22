import { useState } from 'react';
import { GameProvider } from './hooks/useGameState';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import NodeModal from './components/NodeModal';
import RelationshipConfigModal from './components/RelationshipConfigModal';
import { ActionNode } from './types';

function App() {
  const [selectedNode, setSelectedNode] = useState<ActionNode | null>(null);
  const [isNodeModalOpen, setIsNodeModalOpen] = useState(false);

  const handleNodeClick = (node: ActionNode) => {
    setSelectedNode(node);
    setIsNodeModalOpen(true);
  };

  const handleNodeCreate = () => {
    setSelectedNode(null);
    setIsNodeModalOpen(true);
  };

  const handleNodeModalClose = () => {
    setIsNodeModalOpen(false);
    setSelectedNode(null);
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
          onClose={handleNodeModalClose}
        />
        <RelationshipConfigModal />
      </div>
    </GameProvider>
  );
}

export default App;
