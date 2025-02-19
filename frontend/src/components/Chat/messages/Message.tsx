import { MessagePatterns, MessagePart } from "../../../utils/messagePatterns";
import ReactMarkdown from "react-markdown";
import { markdownComponents } from "../../../utils/markdownConfig";
import { useState } from "react";
import { ImageModal } from "../../Modal/ImageModal";

interface MessageProps {
  text: string;
  isUser: boolean;
  isPartial?: boolean;
}

const MessagePartRenderer = ({ part }: { part: MessagePart }) => {
  switch (part.type) {
    case "text":
      return (
        <ReactMarkdown components={markdownComponents}>
          {part.content}
        </ReactMarkdown>
      );

    case "followup_question":
      return (
        <div className="my-2 pl-2 border-l-4 border-warning bg-warning/10 p-2 rounded">
          <p className="text-warning font-medium mb-1">Question:</p>
          <ReactMarkdown components={markdownComponents}>
            {part.question}
          </ReactMarkdown>
        </div>
      );

    case "complete_task":
      return (
        <div className="mb-2 text-success pt-3 rounded">
          <p className="font-medium mb-1">Task Complete</p>
          <ReactMarkdown components={markdownComponents}>
            {part.result}
          </ReactMarkdown>
          {part.command && (
            <div className="mt-2 bg-content1 p-2 rounded">
              <code className="text-sm font-mono text-success">
                {part.command}
              </code>
            </div>
          )}
        </div>
      );

    case "perform_action":
      return (
        <div className="mt-2 bg-content1 rounded-lg p-3 border border-border">
          <div className="space-y-2">
            <div>
              <span className="text-foreground/60 text-sm">
                Action:{" "}
                <span className="text-warning font-medium">{part.action}</span>
              </span>
            </div>
            {part.url && (
              <div>
                <span className="text-foreground/60 text-sm">
                  URL:{" "}
                  <span className="text-foreground font-mono">{part.url}</span>
                </span>
              </div>
            )}
            {part.coordinate && (
              <div>
                <span className="text-foreground/60 text-sm">
                  Coordinate:{" "}
                  <span className="text-foreground font-mono">
                    {part.coordinate}
                  </span>
                </span>
              </div>
            )}
            {part.text && (
              <div>
                <span className="text-foreground/60 text-sm">
                  Text:{" "}
                  <span className="text-foreground font-mono">{part.text}</span>
                </span>
              </div>
            )}
            {part.key && (
              <div>
                <span className="text-foreground/60 text-sm">
                  Key:{" "}
                  <span className="text-foreground font-mono">{part.key}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      );

    case "action_result":
      const [showProcessed, setShowProcessed] = useState(true);
      const [showElements, setShowElements] = useState(false);
      const [isImageModalOpen, setIsImageModalOpen] = useState(false);
      const imageData =
        showProcessed && part.omniParserResult
          ? part.omniParserResult.processedImage
          : part.screenshot;

      return (
        <div className="mb-3 pl-1">
          <div
            className={`${
              part.status === "success" ? "text-success" : "text-danger"
            }`}
          >
            <div>
              <span className="text-md">{part.message}</span>
            </div>
          </div>
          {part.screenshot && (
            <div className="mt-3">
              <div className="bg-content1 rounded-lg border border-border overflow-hidden">
                {part.omniParserResult && (
                  <div className="grid grid-cols-2 border-b border-border">
                    <div
                      onClick={() => setShowProcessed(true)}
                      className={`py-2 text-sm text-center cursor-pointer transition-colors ${
                        showProcessed
                          ? "text-primary border-b-2 border-primary"
                          : "text-foreground/60 hover:text-primary"
                      }`}
                    >
                      Processed
                    </div>
                    <div
                      onClick={() => setShowProcessed(false)}
                      className={`py-2 text-sm text-center cursor-pointer transition-colors ${
                        !showProcessed
                          ? "text-primary border-b-2 border-primary"
                          : "text-foreground/60 hover:text-primary"
                      }`}
                    >
                      Unprocessed
                    </div>
                  </div>
                )}

                {/* Image Display */}
                <div>
                  <img
                    src={`data:image/png;base64,${imageData}`}
                    alt="Action Result"
                    className="max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setIsImageModalOpen(true)}
                  />
                  <ImageModal
                    isOpen={isImageModalOpen}
                    onClose={() => setIsImageModalOpen(false)}
                    imageUrl={`data:image/png;base64,${imageData}`}
                    omniParserResult={
                      showProcessed ? part.omniParserResult : undefined
                    }
                  />
                </div>

                {/* Collapsible Elements Section */}
                {showProcessed &&
                  part.omniParserResult &&
                  part.omniParserResult.parsed_content && (
                    <div className="border-t border-border">
                      <div
                        onClick={() => setShowElements(!showElements)}
                        className="p-3 flex items-center justify-between cursor-pointer hover:bg-content2 transition-colors"
                      >
                        <span className="text-sm text-foreground/60">
                          {part.omniParserResult.parsed_content.length} elements
                          detected
                        </span>
                        <svg
                          className={`w-4 h-4 text-foreground/60 transform transition-transform ${showElements ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                      {showElements && (
                        <div className="p-3 space-y-1 border-t border-border">
                          {part.omniParserResult.parsed_content.map(
                            (element, idx) => (
                              <div key={idx} className="text-sm p-2 rounded">
                                <span className="text-foreground">
                                  {element}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      );
  }
};

export const Message = ({ text, isUser, isPartial }: MessageProps) => {
  // User messages get a bubble style
  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[90%] p-3 bg-primary text-white rounded-lg rounded-br-none text-left">
          <ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>
        </div>
      </div>
    );
  }

  // Assistant messages get a clean layout with special formatting for tags
  const parts = MessagePatterns.parseMessage(text);

  return (
    <div className="flex justify-start animate-fade-in">
      <div
        className={`max-w-[90%] text-white text-left ${isPartial ? "animate-pulse" : ""}`}
      >
        {parts.map((part, index) => (
          <MessagePartRenderer key={index} part={part} />
        ))}
      </div>
    </div>
  );
};
