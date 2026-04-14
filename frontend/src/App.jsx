import React from "react";
import Routes from "./Routes";
import { ThemeProvider } from "./utils/ThemeContext";
import { PIPProvider } from "./context/PIPContext";

function App() {
 return (
  <ThemeProvider>
   <PIPProvider>
    <Routes />
   </PIPProvider>
  </ThemeProvider>
 );
}

export default App;
