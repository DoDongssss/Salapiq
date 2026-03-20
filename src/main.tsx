import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { ToastProvider } from "@/components/customs/ToastProvider"
import { Toaster } from "@/components/customs/Toaster"

createRoot(document.getElementById("root")!).render(
  <ToastProvider>
    <App />
    <Toaster />
  </ToastProvider>
)