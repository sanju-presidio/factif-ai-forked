import { KeyboardEvent, useRef, useState } from "react";
import { ChatInputProps } from "../../types/chat.types";
import { SendIcon } from "../Icons/SendIcon";
import { StopIcon } from "../Icons/StopIcon";
import { Input, Button } from "@nextui-org/react";
import { useAppContext } from "../../contexts/AppContext";

export const ChatInput = ({ onSendMessage, isStreaming, onStopStreaming }: ChatInputProps) => {
  const { hasActiveAction } = useAppContext();
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isStreaming) {
      onSendMessage(trimmedMessage);
      setMessage("");
      // Refocus the input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="py-4">
      <div className="flex gap-2 items-center">
        <Input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isStreaming ? "Waiting for response..." : "Type a message..."}
          classNames={{
            base: "h-12",
            input: [
              "text-foreground",
              "placeholder:text-foreground-500",
              "!text-base"
            ],
            inputWrapper: [
              "h-12",
              "bg-content2/50",
              "hover:bg-content2",
              "group-data-[focused=true]:bg-content2",
              "!cursor-text",
              "transition-colors",
              "!border-content3",
              isStreaming ? "opacity-50" : "",
            ],
          }}
          variant="bordered"
          radius="lg"
          isDisabled={isStreaming}
          fullWidth
        />
        <Button
          onPress={isStreaming ? onStopStreaming : handleSendMessage}
          isDisabled={(!isStreaming && !message.trim()) || (isStreaming && hasActiveAction)}
          className={`h-12 w-12 min-w-[48px] ${
            isStreaming
              ? "bg-danger/20 hover:bg-danger/30 text-danger border border-danger/50"
              : ""
          }`}
          color={isStreaming ? "danger" : "primary"}
          variant={isStreaming ? "flat" : "solid"}
          isIconOnly
          radius="lg"
          title={isStreaming ? (hasActiveAction ? "Cannot stop during action execution" : "Stop generating") : "Send message"}
          size="lg"
        >
          {isStreaming ? <StopIcon /> : <SendIcon />}
        </Button>
      </div>
    </div>
  );
};
