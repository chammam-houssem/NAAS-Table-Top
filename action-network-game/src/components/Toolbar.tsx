import React, { useRef } from 'react';
import { Download, Upload, RotateCcw, Settings, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { useGameState } from '../hooks/useGameState';

const Toolbar: React.FC = () => {
  const { state, exportGame, importGame, resetGame, updateViewport } = useGameState();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const gameData = exportGame();
    const blob = new Blob([gameData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `action-network-game-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const gameData = e.target?.result as string;
          importGame(gameData);
          alert('Game imported successfully!');
        } catch (error) {
          alert('Failed to import game data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the game? This will delete all nodes and edges.')) {
      resetGame();
    }
  };

  const handleZoomIn = () => {
    updateViewport({ zoom: Math.min(state.viewport.zoom * 1.2, 4) });
  };

  const handleZoomOut = () => {
    updateViewport({ zoom: Math.max(state.viewport.zoom / 1.2, 0.1) });
  };

  const handleZoomReset = () => {
    updateViewport({ zoom: 1, panX: 0, panY: 0 });
  };

  const nodeCount = state.nodes.length;
  const edgeCount = state.edges.length;
  const arenaExpanded = edgeCount > state.settings.maxLinksBeforeExpansion;

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <button className="toolbar-button" onClick={handleExport} title="Export Game">
          <Download size={16} />
          Export
        </button>
        
        <button className="toolbar-button" onClick={handleImport} title="Import Game">
          <Upload size={16} />
          Import
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        <button className="toolbar-button" onClick={handleReset} title="Reset Game">
          <RotateCcw size={16} />
          Reset
        </button>
      </div>

      <div className="toolbar-spacer" />

      <div className="toolbar-section">
        <div className="toolbar-info">
          <span className="node-count">{nodeCount} nodes</span>
          <span className="edge-count">{edgeCount} links</span>
          {arenaExpanded && <span className="arena-status">Arena Expanded</span>}
        </div>
      </div>

      <div className="toolbar-section">
        <button className="toolbar-button" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut size={16} />
        </button>
        
        <button className="toolbar-button" onClick={handleZoomReset} title="Reset Zoom">
          <RotateCw size={16} />
        </button>
        
        <button className="toolbar-button" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn size={16} />
        </button>
      </div>

      <div className="toolbar-section">
        <button className="toolbar-button" title="Settings">
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
