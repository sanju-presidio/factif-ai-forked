import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  BackgroundVariant,
  ReactFlowInstance,
} from "@xyflow/react";
import html2canvas, { Options } from 'html2canvas';
import { useExploreModeContext } from "@/contexts/ExploreModeContext.tsx";
import "@xyflow/react/dist/style.css";
import { useCallback, useState, useRef, useEffect } from "react";
import PageNode from "@/components/ExploreMode/PageNode.tsx";
import { IExploredNode, IExploredEdge, INodeData } from "@/types/message.types";
import { saveGraph } from "@/services/graphService";

export function ExploreGraph() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance<Node<INodeData>, Edge> | null>(null);
  const { graphData } = useExploreModeContext();
  const prevNodesLength = useRef(graphData.nodes.length);
  const prevEdgesLength = useRef(graphData.edges.length);

  const [nodes, setNodes] = useState<Node<INodeData>[]>(() => 
    graphData.nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        label: node.data.label || '',
        edges: node.data.edges || [],
      }
    }))
  );
  const [edges, setEdges] = useState<Edge[]>(() => 
    graphData.edges.map(edge => ({
      ...edge,
      animated: true,
    }))
  );

  const saveGraphImage = useCallback(async () => {
    if (reactFlowWrapper.current && reactFlowInstance.current) {
      // First zoom out to ensure all nodes are visible
      reactFlowInstance.current.zoomTo(0.1);
      reactFlowInstance.current.fitView({ padding: 0.5, duration: 800 });
      
      // Wait for zoom and fit animations to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const flowElement = reactFlowWrapper.current.querySelector('.react-flow');
      if (flowElement) {
        // Get the full viewport size including all nodes
        const viewport = reactFlowInstance.current.getViewport();
        const { nodes: visibleNodes } = reactFlowInstance.current.toObject();
        const nodesBounds = visibleNodes.reduce((bounds, node) => {
          bounds.minX = Math.min(bounds.minX, node.position.x);
          bounds.maxX = Math.max(bounds.maxX, node.position.x + (node.width || 0));
          bounds.minY = Math.min(bounds.minY, node.position.y);
          bounds.maxY = Math.max(bounds.maxY, node.position.y + (node.height || 0));
          return bounds;
        }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
        
        const width = Math.abs(nodesBounds.maxX - nodesBounds.minX) + 800;
        const height = Math.abs(nodesBounds.maxY - nodesBounds.minY) + 800;
        
        const options: Partial<Options> = {
          backgroundColor: '#f9fafb',
          scale: 2,
          logging: true,
          useCORS: true,
          allowTaint: true,
          foreignObjectRendering: true,
          width: width,
          height: height,
          windowWidth: width,
          windowHeight: height,
          x: nodesBounds.minX - 400,
          y: nodesBounds.minY - 400,
          scrollX: -nodesBounds.minX + 400,
          scrollY: -nodesBounds.minY + 400
        };
        
        try {
          const canvas = await html2canvas(flowElement as HTMLElement, options);
          const result = await saveGraph(canvas.toDataURL());
          
          if (!result.success) {
            console.error('Failed to save graph:', result.error);
          }
          
          // Reset zoom after saving
          reactFlowInstance.current.fitView({ padding: 0.5 });
        } catch (error) {
          console.error('Error generating/saving graph image:', error);
        }
      }
    }
  }, []);

  // Effect to detect new nodes or edges in graphData
  useEffect(() => {
    if (graphData.nodes.length > prevNodesLength.current || 
        graphData.edges.length > prevEdgesLength.current) {
      setTimeout(saveGraphImage, 1000);
    }
    prevNodesLength.current = graphData.nodes.length;
    prevEdgesLength.current = graphData.edges.length;
  }, [graphData, saveGraphImage]);

  const nodeTypes = {
    pageNode: PageNode,
  };

  const onNodesChange = useCallback<OnNodesChange>(
    (changes) => {
      setNodes((nds) => {
        const newNodes = applyNodeChanges(changes, nds) as Node<INodeData>[];
        setTimeout(saveGraphImage, 1000);
        return newNodes;
      });
    },
    [setNodes, saveGraphImage],
  );

  const onEdgesChange = useCallback<OnEdgesChange>(
    (changes) => {
      setEdges((eds) => {
        const newEdges = applyEdgeChanges(changes, eds);
        setTimeout(saveGraphImage, 1000);
        return newEdges;
      });
    },
    [setEdges, saveGraphImage],
  );

  const onConnect = useCallback<OnConnect>(
    (connection) => {
      setEdges((eds) => {
        const newEdges = addEdge(connection, eds);
        setTimeout(saveGraphImage, 1000);
        return newEdges;
      });
    },
    [setEdges, saveGraphImage],
  );

  return (
    <ReactFlowProvider>
      <div ref={reactFlowWrapper} className="w-full h-full bg-gray-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={(instance: ReactFlowInstance<Node<INodeData>, Edge>) => {
            reactFlowInstance.current = instance;
            instance.fitView({ padding: 0.5 });
          }}
          fitView
          fitViewOptions={{ padding: 0.5 }}
          nodeTypes={nodeTypes}
          snapToGrid={true}
          defaultEdgeOptions={{
            style: { stroke: '#94a3b8', strokeWidth: 2 },
            animated: true,
          }}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          minZoom={0.1}
          maxZoom={4}
        >
          <Controls />
          <Background
            gap={12}
            size={3}
            color="#e2e8f0"
            variant={BackgroundVariant.Lines}
          />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
}
