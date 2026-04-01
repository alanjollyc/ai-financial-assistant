
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Goals from "./pages/Goals";
import Groups from "./pages/Groups";
import Analytics from "./pages/Analytics";
import Forecasting from "./pages/Forecasting";
import Investment from "./pages/Investment";
import Stocks from "./pages/Stocks";
import FinancialWellness from "./pages/FinancialWellness";
import Assistant from "./pages/Assistant";
import Achievements from "./pages/Achievements";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/expenses" element={<Expenses />} />
          <Route path="/dashboard/goals" element={<Goals />} />
          <Route path="/dashboard/groups" element={<Groups />} />
          <Route path="/dashboard/analytics" element={<Analytics />} />
          <Route path="/dashboard/forecasting" element={<Forecasting />} />
          <Route path="/dashboard/investment" element={<Investment />} />
          <Route path="/stocks" element={<Stocks />} /> 
          <Route path="/dashboard/wellness" element={<FinancialWellness />} />
          <Route path="/dashboard/assistant" element={<Assistant />} />
          <Route path="/dashboard/achievements" element={<Achievements />} />
          <Route path="/dashboard/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
