import { Controls, ReactFlow } from "@xyflow/react";
import { useExploreModeContext } from "@/contexts/ExploreModeContext.tsx";
import "@xyflow/react/dist/style.css";

export function ExploreGraph() {
  const { graphData } = useExploreModeContext();
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow nodes={graphData.nodes} edges={graphData.edges}>
        <Controls />
      </ReactFlow>
    </div>
  );
}
