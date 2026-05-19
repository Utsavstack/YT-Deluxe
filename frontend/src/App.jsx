import React from "react";
import Routes from "./Routes";
import { ThemeProvider } from "./utils/ThemeContext";
import { PIPProvider } from "./context/PIPContext";
import { DownloadProvider } from "./context/DownloadContext";
import PermissionDialog from "./components/ui/PermissionDialog";

function App() {
 return (
  <ThemeProvider>
   <DownloadProvider>
    <PIPProvider>
     <Routes />
     {/* Global branded permission dialog — replaces "localhost wants to..." */}
     <PermissionDialog />
    </PIPProvider>
   </DownloadProvider>
  </ThemeProvider>
 );
}

export default App;
