import React from "react";
import Routes from "./Routes";
import { ThemeProvider } from "./utils/ThemeContext";

function App() {
 return (
  <ThemeProvider>
   <Routes />
  </ThemeProvider>
 );
}

export default App;
