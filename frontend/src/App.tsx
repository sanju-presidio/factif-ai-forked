import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header/Header";
import { Chat } from "./components/Chat/Chat";
import { Preview } from "./components/Preview/Preview";
import { Console } from "./components/Console/Console";
import { Explorer } from "./components/Explorer/Explorer";
import { AppProvider } from "./contexts/AppContext";
import { NextUIProvider } from "@nextui-org/react";
import "./App.css";

function App() {
  return (
    <NextUIProvider>
      <AppProvider>
        <BrowserRouter>
          <div className="fixed inset-0 flex flex-col bg-[#1e1e1e] overflow-hidden dark">
            {/* Header - fixed height */}
            <div className="h-14 flex-none border-b border-[#2d2d2d]">
              <Header />
            </div>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left panel - Chat/Browser Use */}
              <div className="w-[450px] flex-shrink-0 border-r border-[#2d2d2d]">
                <Routes>
                  <Route path="/" element={<Chat />} />
                </Routes>
              </div>

              {/* Middle panel - Preview and Console */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex-1 min-h-0 overflow-hidden">
                  <Preview />
                </div>
                <Console />
              </div>
              {/* Right panel - Explorer */}
              <Explorer />
            </div>
          </div>
        </BrowserRouter>
      </AppProvider>
    </NextUIProvider>
  );
}

export default App;
