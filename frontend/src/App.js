import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider, useAuth } from "@/hooks/useAuth";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import NewPrediction from "@/pages/NewPrediction";
import Result from "@/pages/Result";
import History from "@/pages/History";

function Protected({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

export default function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" richColors />
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<Protected><Dashboard /></Protected>} />
            <Route path="/predict" element={<Protected><NewPrediction /></Protected>} />
            <Route path="/result/:id" element={<Protected><Result /></Protected>} />
            <Route path="/history" element={<Protected><History /></Protected>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}
