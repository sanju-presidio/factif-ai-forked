import React, { createContext, useContext, useState } from "react";
import { StreamingSource } from "@/types/api.types.ts";

interface AppContextType {
  isChatStreaming: boolean;
  setIsChatStreaming: React.Dispatch<React.SetStateAction<boolean>>;
  hasActiveAction: boolean;
  setHasActiveAction: React.Dispatch<React.SetStateAction<boolean>>;
  folderPath: string;
  setFolderPath: React.Dispatch<React.SetStateAction<string>>;
  currentChatId: string;
  setCurrentChatId: React.Dispatch<React.SetStateAction<string>>;
  streamingSource: StreamingSource;
  setStreamingSource: React.Dispatch<React.SetStateAction<StreamingSource>>;
  saveScreenshots: boolean;
  setSaveScreenshots: React.Dispatch<React.SetStateAction<boolean>>;
  stopCurrentStreaming: boolean;
  setStopCurrentStreaming: React.Dispatch<React.SetStateAction<boolean>>;
  isExplorerCollapsed: boolean;
  setIsExplorerCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isChatStreaming, setIsChatStreaming] = useState(false);
  const [hasActiveAction, setHasActiveAction] = useState(false);
  const [folderPath, setFolderPath] = useState("");
  const [currentChatId, setCurrentChatId] = useState("");
  const [streamingSource, setStreamingSource] =
    useState<StreamingSource>("chrome-puppeteer");
  const [saveScreenshots, setSaveScreenshots] = useState(false);
  const [stopCurrentStreaming, setStopCurrentStreaming] = useState(false);
  const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(true);

  const value = {
    isChatStreaming,
    setIsChatStreaming,
    hasActiveAction,
    setHasActiveAction,
    folderPath,
    setFolderPath,
    currentChatId,
    setCurrentChatId,
    streamingSource,
    setStreamingSource,
    saveScreenshots,
    setSaveScreenshots,
    stopCurrentStreaming,
    setStopCurrentStreaming,
    isExplorerCollapsed,
    setIsExplorerCollapsed,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
