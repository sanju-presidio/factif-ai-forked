import { memo, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";

export default memo(
  ({
    data,
    isConnectable,
  }: {
    data: { label: string; edges: string[] };
    isConnectable: boolean;
  }) => {
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
        <div className="w-36 p-2 rounded border bg-white">
          <p className="break-words overflow-hidden text-sm">
            <a href={data.label}>{data.label}</a>
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
