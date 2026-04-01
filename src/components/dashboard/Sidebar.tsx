import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  Target,
  Users,
  TrendingUp,
  MessageSquare,
  Trophy,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LineChart,
  PiggyBank,
  BarChart3,
  Receipt,
  Brain,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Wallet, label: "Expenses", href: "/dashboard/expenses" },
  { icon: Target, label: "Goals", href: "/dashboard/goals" },
  { icon: Users, label: "Group Savings", href: "/dashboard/groups" },
  { icon: TrendingUp, label: "Analytics", href: "/dashboard/analytics" },
  { icon: LineChart, label: "Forecasting", href: "/dashboard/forecasting" },
  { icon: PiggyBank, label: "Investment", href: "/dashboard/investment" },
  { icon: BarChart3, label: "Stock AI", href: "/stocks" },
  { icon: Brain, label: "Financial Wellness", href: "/dashboard/wellness" },
  { icon: MessageSquare, label: "AI Assistant", href: "/dashboard/assistant" },
  { icon: Trophy, label: "Achievements", href: "/dashboard/achievements" },
];

const bottomItems = [
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  const handleExpenseAdded = (expense: {
    description: string;
    amount: number;
    category: string;
    date: string;
    type: 'debit';
  }) => {
    // Store in localStorage for the Expenses page to pick up
    const pendingExpenses = JSON.parse(localStorage.getItem('pendingExpenses') || '[]');
    pendingExpenses.push({
      ...expense,
      id: Date.now(),
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('pendingExpenses', JSON.stringify(pendingExpenses));
    
    // Navigate to expenses page
    navigate('/dashboard/expenses');
  };

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-card border-r border-border flex flex-col transition-all duration-300 z-40",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <span className="font-display font-bold text-lg">FinanceAI</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "nav-link",
                  isActive && "active",
                  collapsed && "justify-center px-3"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Items */}
        <div className="p-4 border-t border-border space-y-2">
          {bottomItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "nav-link",
                  isActive && "active",
                  collapsed && "justify-center px-3"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
          

          
          <button
            onClick={handleSignOut}
            className={cn(
              "nav-link w-full text-destructive hover:bg-destructive/10 hover:text-destructive",
              collapsed && "justify-center px-3"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>


    </>
  );
}