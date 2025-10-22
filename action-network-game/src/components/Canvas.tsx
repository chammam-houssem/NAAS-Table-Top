import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useGameState } from '../hooks/useGameState';
import { ActionNode } from '../types';

interface CanvasProps {
  onNodeClick: (node: ActionNode) => void;
  onNodeCreate: (position: { x: number; y: number }) => void;
  onNodeUpdate: (node: ActionNode) => void;
  onEdgeCreate: (sourceId: string, targetId: string, relationshipType: string) => void;
}

const Canvas: React.FC<CanvasProps> = ({ onNodeClick, onNodeCreate }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const isApplyingViewportRef = useRef(false);
  const { state, addNode, updateNode, addEdge, updateViewport } = useGameState();
  const previousNodesRef = useRef(state.nodes);
  const previousEdgesRef = useRef(state.edges);
  const previousViewportRef = useRef(state.viewport);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [linkingMode, setLinkingMode] = useState<{ active: boolean; sourceId: string; relationshipType: string } | null>(null);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // D3 force simulation
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const onlyViewportChanged =
      previousNodesRef.current === state.nodes &&
      previousEdgesRef.current === state.edges &&
      (
        previousViewportRef.current.zoom !== state.viewport.zoom ||
        previousViewportRef.current.panX !== state.viewport.panX ||
        previousViewportRef.current.panY !== state.viewport.panY
      );

    previousNodesRef.current = state.nodes;
    previousEdgesRef.current = state.edges;
    previousViewportRef.current = state.viewport;

    if (onlyViewportChanged) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const arenaSize = Math.max(state.viewport.arenaSize, Math.min(width, height) * 0.8);

    // Create main group for zoom/pan
    const g = svg.append('g');

    // Set up zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        if (!isApplyingViewportRef.current) {
          const { k, x, y } = event.transform;
          if (k !== state.viewport.zoom || x !== state.viewport.panX || y !== state.viewport.panY) {
            updateViewport({ zoom: k, panX: x, panY: y });
          }
        }
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    const initialTransform = d3.zoomIdentity
      .translate(state.viewport.panX, state.viewport.panY)
      .scale(state.viewport.zoom);
    isApplyingViewportRef.current = true;
    svg.call(zoom.transform, initialTransform);
    isApplyingViewportRef.current = false;

    // Create arena boundary visualization
    const arenaGroup = g.append('g').attr('class', 'arena-boundary');
    arenaGroup.append('rect')
      .attr('x', -arenaSize / 2)
      .attr('y', -arenaSize / 2)
      .attr('width', arenaSize)
      .attr('height', arenaSize)
      .attr('fill', 'none')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .style('opacity', 0.3);

    // Create arrow markers for edges
    svg.append('defs').selectAll('marker')
      .data(['arrowhead'])
      .enter().append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#6b7280');

    // Create force simulation
    const simulation = d3.forceSimulation(state.nodes as any)
      .force('link', d3.forceLink(state.edges as any).id((d: any) => d.id).distance(200))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(0, 0)) // Center on origin for arena-based layout
      .force('collision', d3.forceCollide().radius(100))
      .force('x', d3.forceX(0).strength(0.1))
      .force('y', d3.forceY(0).strength(0.1));

    // Create edges
    const edges = g.append('g')
      .selectAll('line')
      .data(state.edges)
      .enter().append('line')
      .attr('class', 'edge-line')
      .attr('stroke', '#6b7280')
      .attr('stroke-width', 2);

    // Create edge labels
    const edgeLabels = g.append('g')
      .selectAll('text')
      .data(state.edges)
      .enter().append('text')
      .attr('class', 'edge-text')
      .text(d => d.relationshipType)
      .style('font-size', '12px')
      .style('fill', '#374151')
      .style('text-anchor', 'middle')
      .style('pointer-events', 'none');

    // Create nodes
    const nodes = g.append('g')
      .selectAll('g')
      .data(state.nodes)
      .enter().append('g')
      .attr('class', 'action-node')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, ActionNode>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add rectangles to nodes
    nodes.append('rect')
      .attr('class', 'node-rect')
      .attr('width', 160)
      .attr('height', 120)
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('fill', d => selectedNode === d.id ? '#dbeafe' : '#f9fafb')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2);

    // Add text to nodes
    nodes.append('text')
      .attr('class', 'node-text')
      .attr('x', 80)
      .attr('y', 40)
      .text(d => d.name || 'Untitled')
      .style('font-size', '14px')
      .style('font-weight', '500')
      .style('fill', '#1f2937')
      .style('text-anchor', 'middle')
      .style('pointer-events', 'none');

    // Add confidence indicator
    nodes.append('text')
      .attr('class', 'confidence-indicator')
      .attr('x', 80)
      .attr('y', 100)
      .text(d => `${d.confidenceLevel}%`)
      .style('font-size', '12px')
      .style('fill', '#6b7280')
      .style('text-anchor', 'middle')
      .style('pointer-events', 'none');

    // Add click handlers
    nodes.on('click', (event, d) => {
      event.stopPropagation();
      if (linkingMode?.active) {
        if (linkingMode.sourceId !== d.id) {
          addEdge(linkingMode.sourceId, d.id, linkingMode.relationshipType);
          setLinkingMode(null);
        }
      } else {
        setSelectedNode(d.id);
        onNodeClick(d);
      }
    });

    // Add right-click context menu for linking
    nodes.on('contextmenu', (event, d) => {
      event.preventDefault();
      event.stopPropagation();
      
      if (d.confidenceLevel >= 30) {
        // Show relationship type selection
        const rect = d3.select(event.target).node().getBoundingClientRect();
        const contextMenu = d3.select('body')
          .append('div')
          .attr('class', 'context-menu')
          .style('position', 'absolute')
          .style('left', `${rect.left}px`)
          .style('top', `${rect.bottom}px`)
          .style('background', 'white')
          .style('border', '1px solid #e5e7eb')
          .style('border-radius', '6px')
          .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)')
          .style('z-index', '1000')
          .style('padding', '8px 0');

        contextMenu.append('div')
          .style('padding', '8px 16px')
          .style('font-size', '12px')
          .style('color', '#6b7280')
          .style('border-bottom', '1px solid #e5e7eb')
          .text('Create Link:');

        state.relationshipTypes.forEach(relType => {
          contextMenu.append('div')
            .style('padding', '8px 16px')
            .style('cursor', 'pointer')
            .style('font-size', '14px')
            .text(relType)
            .on('click', () => {
              setLinkingMode({ active: true, sourceId: d.id, relationshipType: relType });
              contextMenu.remove();
            })
            .on('mouseenter', function() {
              d3.select(this).style('background', '#f3f4f6');
            })
            .on('mouseleave', function() {
              d3.select(this).style('background', 'white');
            });
        });

        // Remove context menu when clicking elsewhere
        d3.select('body').on('click.context-menu', () => {
          contextMenu.remove();
          d3.select('body').on('click.context-menu', null);
        });
      }
    });

    // Add canvas click handler for creating new nodes
    svg.on('click', (event) => {
      if (event.target === svg.node()) {
        const [x, y] = d3.pointer(event, svg.node());
        const transform = d3.zoomTransform(svg.node()!);
        const worldX = (x - transform.x) / transform.k;
        const worldY = (y - transform.y) / transform.k;
        
        if (linkingMode?.active) {
          // Create new node at click position
          const newNodeData = {
            name: 'New Action',
            position: { x: worldX, y: worldY },
            authority: '',
            digitalAccessibility: 'in-person' as const,
            pppRole: '',
            regulations: [],
            caseStudies: [],
            customFields: {},
            confidenceLevel: 0,
          };
          addNode(newNodeData);
          // The new node will be created and we can link to it
          setTimeout(() => {
            const newNode = state.nodes[state.nodes.length - 1];
            if (newNode) {
              addEdge(linkingMode.sourceId, newNode.id, linkingMode.relationshipType);
            }
            setLinkingMode(null);
          }, 100);
        } else {
          onNodeCreate({ x: worldX, y: worldY });
        }
      }
    });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      edges
        .attr('x1', (d: any) => d.source.x!)
        .attr('y1', (d: any) => d.source.y!)
        .attr('x2', (d: any) => d.target.x!)
        .attr('y2', (d: any) => d.target.y!);

      edgeLabels
        .attr('x', (d: any) => (d.source.x! + d.target.x!) / 2)
        .attr('y', (d: any) => (d.source.y! + d.target.y!) / 2);

      nodes
        .attr('transform', (d: any) => `translate(${d.x! - 80}, ${d.y! - 60})`);
    });

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
      // Update node position in state
      const updatedNode = { ...d, position: { x: d.x!, y: d.y! } };
      updateNode(updatedNode);
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [state.nodes, state.edges, dimensions, selectedNode, linkingMode, state.viewport.panX, state.viewport.panY, state.viewport.zoom, updateViewport]);

  useEffect(() => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;

    const svg = d3.select(svgRef.current);
    const transform = d3.zoomIdentity
      .translate(state.viewport.panX, state.viewport.panY)
      .scale(state.viewport.zoom);

    isApplyingViewportRef.current = true;
    svg.call(zoomBehaviorRef.current.transform, transform);
    isApplyingViewportRef.current = false;
  }, [state.viewport.panX, state.viewport.panY, state.viewport.zoom]);

  const cancelLinking = () => {
    setLinkingMode(null);
  };

  return (
    <div ref={containerRef} className="canvas-container">
      <svg ref={svgRef} className="canvas-svg" />
      {linkingMode && (
        <div className="linking-overlay">
          <div className="linking-message">
            Click on another node or empty space to create a "{linkingMode.relationshipType}" link
            <button onClick={cancelLinking} className="cancel-link-button">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Canvas;
