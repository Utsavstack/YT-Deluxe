import React from "react";
import Routes from "./Routes";
import { ThemeProvider } from "./utils/ThemeContext";
import { PIPProvider } from "./context/PIPContext";
import { DownloadProvider } from "./context/DownloadContext";

function App() {
 return (
  <ThemeProvider>
   <DownloadProvider>
    <PIPProvider>
     <Routes />
    </PIPProvider>
   </DownloadProvider>
  </ThemeProvider>
 );
}

export default App;
