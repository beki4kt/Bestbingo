import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "../src/styles.css"; // Added for custom styles

createRoot(document.getElementById("root")!).render(<App />);
