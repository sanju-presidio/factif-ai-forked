import { useEffect, useRef, useState } from "react";
import { getCurrentUrl, sendExploreChatMessage } from "../services/api";
import { ChatMessage, OmniParserResult } from "../types/chat.types";
import { useAppContext } from "../contexts/AppContext";
import { MessageProcessor } from "../services/messageProcessor";
import { IExploreGraphData, IExploreQueueItem } from "@/types/message.types.ts";
import { v4 as uuid } from "uuid";

export const useExploreChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [latestOmniParserResult, setLatestOmniParserResult] =
    useState<OmniParserResult | null>(null);

  const {
    isChatStreaming,
    setIsChatStreaming,
    setHasActiveAction,
    folderPath,
    currentChatId,
    streamingSource,
    saveScreenshots,
    setType,
  } = useAppContext();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasPartialMessage = useRef(false);
  const activeMessageId = useRef<string | null>(null);
  const isProcessing = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const exploreQueue = useRef<{ [key in string]: IExploreQueueItem[] }>({});
  const exploreRoute = useRef<string[]>([]);
  const exploreGraphData = useRef<IExploreGraphData>({
    nodes: [],
    edges: [],
  });
  const currentlyExploring = useRef<{
    url: string;
    id: string;
    nodeId: string;
  } | null>(null);

  // Initialize MessageProcessor
  useEffect(() => {
    MessageProcessor.initialize(setHasActiveAction);
  }, [setHasActiveAction]);

  // Keep messagesRef in sync with messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Reset streaming state only on unmount
  useEffect(() => {
    return () => {
      hasPartialMessage.current = false;
      activeMessageId.current = null;
      setIsChatStreaming(false);
    };
  }, [setIsChatStreaming]);

  // Scroll management
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Message management functions
  const addMessage = (newMessage: ChatMessage) => {
    setMessages((prev) => {
      const messageExists = prev.some(
        (msg) =>
          msg.text === newMessage.text &&
          msg.isUser === newMessage.isUser &&
          msg.timestamp.getTime() === newMessage.timestamp.getTime(),
      );
      if (messageExists) return prev;
      return [...prev, newMessage];
    });
  };

  const updateLastMessage = (
    updater: (message: ChatMessage) => ChatMessage,
  ) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const newMessages = [...prev];
      const lastMessage = newMessages[newMessages.length - 1];
      const updatedMessage = updater(lastMessage);

      if (JSON.stringify(lastMessage) === JSON.stringify(updatedMessage)) {
        return prev;
      }

      newMessages[newMessages.length - 1] = updatedMessage;
      return newMessages;
    });
  };

  // Error handling
  const handleError = (messageId: string, error: Error) => {
    console.error("Explore Chat Error:", error);
    if (activeMessageId.current === messageId) {
      setIsChatStreaming(false);
      hasPartialMessage.current = false;
      activeMessageId.current = null;
      isProcessing.current = false;

      if (messagesRef.current.some((m) => m.isPartial)) {
        updateLastMessage((msg) => ({ ...msg, isPartial: false }));
      }

      addMessage({
        text: "Sorry, there was an error processing your message.",
        timestamp: new Date(),
        isUser: false,
        isHistory: false,
      });
    }
  };

  const createConstructNode = (currentNodeId: string, url: string) => {
    exploreGraphData.current.nodes.push({
      id: currentNodeId,
      position: { x: 0, y: 0 },
      data: { label: url },
    });
    localStorage.setItem("MAP", JSON.stringify(exploreGraphData.current));
  };

  const createEdge = (sourceId: string, targetId: string, edgeId: string) => {
    exploreGraphData.current.edges.push({
      id: edgeId,
      source: sourceId,
      target: targetId,
    });
    localStorage.setItem("MAP", JSON.stringify(exploreGraphData.current));
  };

  // Process explore output
  const processExploreOutput = async (
    fullResponse: string,
    parent: { url: string; id: string; nodeId: string } | null = null,
  ) => {
    const processedExploreMessage =
      MessageProcessor.processExploreMessage(fullResponse) || [];
    let url: string | null = null;
    const routeSet = new Set(exploreRoute.current);
    Object.keys(exploreQueue.current)
      .filter((key) => exploreQueue.current[key].length === 0)
      .forEach((key) => {
        routeSet.delete(key);
      });
    if (processedExploreMessage.length > 0) {
      url = await getCurrentUrl();
      console.log("url ===>", url);
      if (url && !routeSet.has(url as string)) {
        routeSet.add(url as string);
        const nodeId = uuid();
        createConstructNode(nodeId, url);
        if (currentlyExploring.current) {
          createEdge(
            currentlyExploring.current.nodeId,
            nodeId,
            currentlyExploring.current.id,
          );
        }

        exploreQueue.current[url] = [];
        for (const element of processedExploreMessage) {
          if (element.text && element.coordinates) {
            const elementId = uuid();
            const exploredOutput: IExploreQueueItem = {
              text: element.text,
              coordinates: element.coordinates,
              aboutThisElement: element.aboutThisElement || "",
              source: fullResponse,
              url,
              id: elementId,
              nodeId,
              parent: {
                url: (parent?.url as string) || url,
                nodeId: (parent?.nodeId as string) || nodeId,
                id: (parent?.id as string) || elementId,
              },
            };
            exploreQueue.current[url].push(exploredOutput);
          }
        }
        localStorage.setItem(
          "started_explore",
          JSON.stringify(exploreQueue.current),
        );
      }
    }

    exploreRoute.current = [...routeSet];

    return processedExploreMessage.length > 0
      ? processedExploreMessage[0]
      : null;
  };

  const getNextToExplore = () => {
    const route =
      exploreRoute.current.length > 0 ? exploreRoute.current[0] : null;
    console.log("route ===>", route);
    console.log("route ===>", exploreRoute.current);
    console.log("route ===>", exploreQueue.current);
    const nextItem = route ? exploreQueue.current[route].shift() : null;
    if (route && nextItem) {
      currentlyExploring.current = {
        url: route,
        id: nextItem.id,
        nodeId: nextItem.parent.nodeId,
      };
    }
    return nextItem;
  };

  // Handle message completion
  const handleMessageCompletion = async (
    messageId: string,
    fullResponse: string,
    imageData?: string,
    _omniParserResult?: OmniParserResult,
  ) => {
    if (activeMessageId.current !== messageId) return;

    hasPartialMessage.current = false;
    updateLastMessage((msg) => ({ ...msg, isPartial: false }));

    const processedResponse = await MessageProcessor.processMessage(
      fullResponse,
      streamingSource,
    );

    const exploredOutput = await processExploreOutput(
      fullResponse,
      currentlyExploring.current,
    );

    if (
      processedResponse.actionResult ||
      fullResponse.includes("<complete_task>")
    ) {
      if (processedResponse.omniParserResult) {
        setLatestOmniParserResult(processedResponse.omniParserResult);
      }

      updateLastMessage((msg) => ({
        ...msg,
        isPartial: false,
        isHistory: true,
      }));

      processedResponse.actionResult &&
        addMessage({
          text: processedResponse.actionResult,
          timestamp: new Date(),
          isUser: false,
          isHistory: false,
        });

      isProcessing.current = false;
      console.log("====", fullResponse);

      if (fullResponse.includes("<complete_task>")) {
        setType("explore");
      }

      await handleExploreMessage(
        processedResponse.text,
        fullResponse.includes("<complete_task>") ? "explore" : "action",
        imageData,
        processedResponse.omniParserResult,
      );
    } else if (exploredOutput) {
      const nextElementToVisit = getNextToExplore();
      console.log("nextElementToVisit ===>", nextElementToVisit);
      isProcessing.current = false;
      setType("action");
      setMessages([]);
      if (nextElementToVisit) {
        const message = `In ${nextElementToVisit.url} \n Visit ${nextElementToVisit.text} on coordinate : ${nextElementToVisit.coordinates} with about this element : ${nextElementToVisit.aboutThisElement}. You can decide what to do prior to it.`;
        addMessage({
          text: message,
          timestamp: new Date(),
          isUser: true,
          isHistory: false,
        });
        await handleExploreMessage(message, "action", imageData);
      }
    } else {
      updateLastMessage((msg) => ({
        ...msg,
        isPartial: false,
        isHistory: true,
      }));
      setIsChatStreaming(false);
      activeMessageId.current = null;
      isProcessing.current = false;
    }
  };

  // Handle message chunks
  const handleMessageChunk = (
    messageId: string,
    chunk: string,
    fullResponse: string,
  ) => {
    if (!chunk.trim() || activeMessageId.current !== messageId) return;

    if (!hasPartialMessage.current && activeMessageId.current === messageId) {
      hasPartialMessage.current = true;
      addMessage({
        text: fullResponse,
        timestamp: new Date(),
        isUser: false,
        isPartial: true,
        isHistory: false,
      });
    } else {
      updateLastMessage((msg) => ({
        ...msg,
        text: fullResponse,
      }));
    }
  };

  // Main message handling function
  const handleExploreMessage = async (
    currentMessage: string,
    type: string,
    imageData?: string,
    omniParserResult?: OmniParserResult,
  ) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    const messageId = `msg_${Date.now()}`;
    activeMessageId.current = messageId;
    setIsChatStreaming(true);

    let fullResponse = "";

    try {
      await sendExploreChatMessage(
        currentMessage,
        imageData,
        messagesRef.current.filter((msg) => !msg.isPartial),
        type,
        folderPath,
        currentChatId,
        streamingSource,
        (chunk: string) => {
          fullResponse += chunk;
          handleMessageChunk(messageId, chunk, fullResponse);
        },
        () =>
          handleMessageCompletion(
            messageId,
            fullResponse,
            imageData,
            omniParserResult,
          ),
        (error: Error) => handleError(messageId, error),
        omniParserResult || latestOmniParserResult,
        saveScreenshots,
      );
    } catch (error) {
      handleError(messageId, error as Error);
    }
  };

  // Public interface functions
  const sendMessage = async (
    message: string,
    sendToBackend: boolean = true,
    type: string,
    imageData?: string,
  ) => {
    if (!message.trim() || isChatStreaming) return;

    addMessage({
      text: message,
      timestamp: new Date(),
      isUser: true,
      isHistory: true,
    });

    if (sendToBackend) {
      await handleExploreMessage(message, type, imageData);
      setLatestOmniParserResult(null);
    }
  };

  const clearChat = () => {
    if (!isChatStreaming) {
      hasPartialMessage.current = false;
      activeMessageId.current = null;
      isProcessing.current = false;
      messagesRef.current = [];
      setMessages([]);
    }
  };

  const stopStreaming = () => {
    if (isChatStreaming) {
      activeMessageId.current = null;
      hasPartialMessage.current = false;
      isProcessing.current = false;
      setIsChatStreaming(false);

      if (messagesRef.current.some((m) => m.isPartial)) {
        updateLastMessage((msg) => ({
          ...msg,
          isPartial: false,
          isHistory: true,
        }));
      }
    }
  };

  return {
    messages,
    sendMessage,
    clearChat,
    messagesEndRef,
    stopStreaming,
    latestOmniParserResult,
  };
};
