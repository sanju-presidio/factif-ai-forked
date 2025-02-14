import { memo, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import { INodeData } from "@/types/message.types.ts";

export default memo(
  ({ data, isConnectable }: { data: INodeData; isConnectable: boolean }) => {
    useEffect(() => {
      console.log("on data ===>", data, isConnectable);
    }, [data]);
    return (
      <>
        <Handle
          type="target"
          position={Position.Left}
          onConnect={(params) => console.log("handle onConnect", params)}
          isConnectable={isConnectable}
        />
        <div className="w-36 p-3 rounded-lg border-2 bg-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 border-blue-400">
          {data.imageData && (
            <img
              src={data.imageData}
              alt="page-screenshot"
              className="w-full"
            />
          )}
          <p className="break-words overflow-hidden text-sm mt-2">
            <a href={data.label} className="text-xs text-blue-600 hover:text-blue-800 hover:underline" target="_blank">
              {data.label}
            </a>
          </p>
        </div>
        {data.edges.map((edge) => (
          <Handle
            key={edge}
            type="source"
            position={Position.Bottom}
            id={edge}
            isConnectable={isConnectable}
          />
        ))}
      </>
    );
  },
);
