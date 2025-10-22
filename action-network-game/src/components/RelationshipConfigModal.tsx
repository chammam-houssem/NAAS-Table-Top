import React, { useState, useEffect } from 'react';
import { useGameState } from '../hooks/useGameState';

const RelationshipConfigModal: React.FC = () => {
  const { state, setRelationshipTypes } = useGameState();
  const [relationshipTypes, setRelationshipTypesLocal] = useState<string[]>(state.relationshipTypes);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show config modal if no relationship types are set or if this is a new game
    if (state.relationshipTypes.length === 0 || (state.nodes.length === 0 && state.edges.length === 0)) {
      setIsOpen(true);
    }
  }, [state.relationshipTypes.length, state.nodes.length, state.edges.length]);

  const handleAddType = () => {
    setRelationshipTypesLocal(prev => [...prev, '']);
  };

  const handleRemoveType = (index: number) => {
    setRelationshipTypesLocal(prev => prev.filter((_, i) => i !== index));
  };

  const handleTypeChange = (index: number, value: string) => {
    setRelationshipTypesLocal(prev => 
      prev.map((type, i) => i === index ? value : type)
    );
  };

  const handleSave = () => {
    const validTypes = relationshipTypes.filter(type => type.trim().length > 0);
    if (validTypes.length >= 2) {
      setRelationshipTypes(validTypes);
      setIsOpen(false);
    } else {
      alert('Please provide at least 2 relationship types.');
    }
  };

  const handleSkip = () => {
    // Use default relationship types
    setRelationshipTypes(['requires', 'enables', 'conflicts with', 'regulated by']);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Configure Relationship Types</h2>
        </div>

        <div className="modal-body">
          <p style={{ marginBottom: '20px', color: '#6b7280' }}>
            Define the types of relationships that can exist between actions in your network. 
            You need at least 2 types to start playing.
          </p>

          <div className="form-group">
            <label className="form-label">Relationship Types</label>
            {relationshipTypes.map((type, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  value={type}
                  onChange={e => handleTypeChange(index, e.target.value)}
                  placeholder={`Relationship type ${index + 1}`}
                />
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => handleRemoveType(index)}
                  style={{ padding: '8px 12px' }}
                >
                  Remove
                </button>
              </div>
            ))}
            
            <button
              type="button"
              className="button secondary"
              onClick={handleAddType}
              style={{ marginTop: '8px' }}
            >
              Add Type
            </button>
          </div>

          <div className="form-group">
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              <strong>Examples:</strong> requires, enables, conflicts with, regulated by, 
              depends on, facilitates, prevents, supersedes
            </p>
          </div>

          <div className="button-group">
            <button className="button secondary" onClick={handleSkip}>
              Use Defaults
            </button>
            <button 
              className="button primary" 
              onClick={handleSave}
              disabled={relationshipTypes.filter(t => t.trim().length > 0).length < 2}
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelationshipConfigModal;
