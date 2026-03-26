import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import LocalityAnalysis from "./pages/LocalityAnalysis";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import AdminJustificativas from "./pages/AdminJustificativas";
import JustificarAusencia from "./pages/JustificarAusencia";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="overflow-x-hidden">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/analise-localidade" element={<LocalityAnalysis />} />
              <Route path="/login" element={<Login />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/admin" element={<AdminJustificativas />} />
              <Route path="/justificar/:eventId" element={<JustificarAusencia />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
