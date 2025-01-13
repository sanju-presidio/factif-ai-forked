import { PreviewContentProps } from "./PreviewTypes";
import { useAppContext } from "@/contexts/AppContext";

export const PreviewContent = ({
  error,
  screenshot,
  streamingSource,
  interactiveMode,
  handleInteraction,
  previewRef,
  imageRef,
}: PreviewContentProps) => {
  const { isExplorerCollapsed } = useAppContext();

  return (
    <div
      ref={previewRef}
      className="h-full flex items-center justify-center overflow-auto"
      onClick={interactiveMode ? handleInteraction : undefined}
      onKeyDown={interactiveMode ? handleInteraction : undefined}
      tabIndex={interactiveMode ? 0 : undefined}
    >
      <div className="text-gray-300 h-full flex items-center justify-center p-4">
        {error ? (
          <div className="text-red-500 text-center">
            <p>Error: {error}</p>
          </div>
        ) : streamingSource === "ubuntu-docker-vnc" ? (
          <div
            className="relative w-[900px] h-[600px]"
            style={{
              pointerEvents: interactiveMode ? "auto" : "none",
              transform: isExplorerCollapsed ? "scale(1)" : "scale(0.85)",
              transformOrigin: "center center",
              transition: "transform 0.3s ease-in-out",
            }}
          >
            <iframe
              src="http://localhost:6080/vnc.html?autoconnect=1&resize=scale&quality=9"
              className="w-full h-full border-0"
              allow="fullscreen"
            />
          </div>
        ) : screenshot ? (
          <div
            className="relative flex items-center justify-center"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
            }}
          >
            <img
              ref={imageRef}
              src={screenshot}
              alt="Preview"
              width={900}
              height={600}
              className="object-contain w-full h-full"
              style={{
                pointerEvents: interactiveMode ? "auto" : "none",
              }}
            />
          </div>
        ) : (
          <div className="text-center">
            <p>No preview available</p>
            <p className="text-sm text-gray-500 mt-2">
              Preview will be available once the streaming starts
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
