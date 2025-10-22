import React, { useState, useEffect } from 'react';
import { ActionNode } from '../types';
import { useGameState } from '../hooks/useGameState';

interface NodeModalProps {
  node: ActionNode | null;
  isOpen: boolean;
  onClose: () => void;
}

const NodeModal: React.FC<NodeModalProps> = ({ node, isOpen, onClose }) => {
  const { updateNode, addNode } = useGameState();
  const [formData, setFormData] = useState<{
    name?: string;
    authority?: string;
    digitalAccessibility?: 'online' | 'hybrid' | 'in-person';
    pppRole?: string;
    regulations?: string[];
    caseStudies?: string[];
    customFields?: Record<string, any>;
    confidenceLevel?: number;
  }>({});
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (node) {
      setFormData({
        name: node.name,
        authority: node.metadata.authority,
        digitalAccessibility: node.metadata.digitalAccessibility,
        pppRole: node.metadata.pppRole,
        regulations: node.metadata.regulations,
        caseStudies: node.metadata.caseStudies,
        customFields: node.metadata.customFields,
        confidenceLevel: node.confidenceLevel,
      });
    } else {
      setFormData({
        name: '',
        authority: '',
        digitalAccessibility: 'in-person',
        pppRole: '',
        regulations: [],
        caseStudies: [],
        customFields: {},
        confidenceLevel: 0,
      });
    }
  }, [node]);

  useEffect(() => {
    const valid = !!(formData.name && formData.authority);
    setIsValid(valid);
  }, [formData.name, formData.authority]);

  const handleSave = () => {
    if (!isValid) return;

    const nodeData: ActionNode = {
      id: node?.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name!,
      position: node?.position || { x: 400, y: 300 },
      metadata: {
        authority: formData.authority!,
        digitalAccessibility: formData.digitalAccessibility || 'in-person',
        pppRole: formData.pppRole || '',
        regulations: formData.regulations || [],
        caseStudies: formData.caseStudies || [],
        customFields: formData.customFields || {},
      },
      confidenceLevel: formData.confidenceLevel || 0,
      createdAt: node?.createdAt || Date.now(),
      lastModified: Date.now(),
    };

    if (node) {
      updateNode(nodeData);
    } else {
      addNode(nodeData);
    }

    onClose();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayChange = (field: 'regulations' | 'caseStudies', value: string) => {
    const items = value.split('\n').filter(item => item.trim());
    setFormData(prev => ({
      ...prev,
      [field]: items,
    }));
  };

  const getStatusIndicator = () => {
    if (!formData.name || !formData.authority) return 'empty';
    if (formData.confidenceLevel && formData.confidenceLevel >= 30) return 'complete';
    return 'incomplete';
  };

  const canCreateLinks = formData.confidenceLevel && formData.confidenceLevel >= 30;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <span className={`status-indicator ${getStatusIndicator()}`}></span>
            {node ? 'Edit Action' : 'Create New Action'}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Action Name *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name || ''}
              onChange={e => handleInputChange('name', e.target.value)}
              placeholder="e.g., Get Fishing Permit"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Authority *</label>
            <input
              type="text"
              className="form-input"
              value={formData.authority || ''}
              onChange={e => handleInputChange('authority', e.target.value)}
              placeholder="e.g., Department of Fish and Wildlife"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Digital Accessibility</label>
            <div className="form-radio-group">
              <div className="form-radio">
                <input
                  type="radio"
                  id="online"
                  name="digitalAccessibility"
                  value="online"
                  checked={formData.digitalAccessibility === 'online'}
                  onChange={e => handleInputChange('digitalAccessibility', e.target.value)}
                />
                <label htmlFor="online">Online</label>
              </div>
              <div className="form-radio">
                <input
                  type="radio"
                  id="hybrid"
                  name="digitalAccessibility"
                  value="hybrid"
                  checked={formData.digitalAccessibility === 'hybrid'}
                  onChange={e => handleInputChange('digitalAccessibility', e.target.value)}
                />
                <label htmlFor="hybrid">Hybrid</label>
              </div>
              <div className="form-radio">
                <input
                  type="radio"
                  id="in-person"
                  name="digitalAccessibility"
                  value="in-person"
                  checked={formData.digitalAccessibility === 'in-person'}
                  onChange={e => handleInputChange('digitalAccessibility', e.target.value)}
                />
                <label htmlFor="in-person">In-Person Only</label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Public-Private Partnership Role</label>
            <textarea
              className="form-input form-textarea"
              value={formData.pppRole || ''}
              onChange={e => handleInputChange('pppRole', e.target.value)}
              placeholder="Describe any private sector involvement..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Regulations</label>
            <textarea
              className="form-input form-textarea"
              value={(formData.regulations || []).join('\n')}
              onChange={e => handleArrayChange('regulations', e.target.value)}
              placeholder="List relevant laws, rules, or regulations (one per line)..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Case Studies</label>
            <textarea
              className="form-input form-textarea"
              value={(formData.caseStudies || []).join('\n')}
              onChange={e => handleArrayChange('caseStudies', e.target.value)}
              placeholder="Examples of abuse, misuse, or notable implementations (one per line)..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confidence Level</label>
            <input
              type="range"
              min="0"
              max="100"
              className="form-slider"
              value={formData.confidenceLevel || 0}
              onChange={e => handleInputChange('confidenceLevel', parseInt(e.target.value))}
            />
            <div className="confidence-display">
              {formData.confidenceLevel || 0}% - {canCreateLinks ? 'Can create links' : 'Need 30%+ to create links'}
            </div>
          </div>

          <div className="button-group">
            <button className="button secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="button primary" 
              onClick={handleSave}
              disabled={!isValid}
            >
              {node ? 'Update' : 'Create'} Action
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeModal;
