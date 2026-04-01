import { useEffect, useMemo, useState, useRef } from "react";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { GoalsProgress } from "@/components/dashboard/GoalsProgress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Papa from "papaparse";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  PiggyBank,
  Flame,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  PieChart,
  Lightbulb,
  Trophy,
  AlertTriangle,
  Sparkles,
  Brain,
  Zap,
  Plus,
  Upload,
  X,
  FileText,
  CreditCard,
  Calendar,
  DollarSign,
  RefreshCw,
  Eye,
  Download,
  Filter,
  ChevronRight,
  Shield,
  CheckCircle,
  AlertCircle,
  Rocket,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ---------------- TYPES ---------------- */
type Transaction = {
  id: string;
  narration: string;
  amount: number;
  date: string;
  type: "CREDIT" | "DEBIT";
  category?: string;
};

type Goal = {
  current: number;
  target: number;
};

/* ---------------- CATEGORIES ---------------- */
const BASE_CATEGORIES = [
  "Food",
  "Travel",
  "Rent",
  "Shopping",
  "Bills",
  "Entertainment",
  "Fuel",
  "Groceries",
  "Healthcare",
  "Subscriptions",
  "Education",
  "Salary"
];

/* ---------------- HELPERS ---------------- */
const normalize = (v?: string) =>
  v?.toString().trim().toLowerCase() || "";

const resolveCategoryFromReference = (ref?: string) => {
  const value = normalize(ref);
  for (const cat of BASE_CATEGORIES) {
    if (value === normalize(cat)) return cat;
  }
  return "Others";
};

// Helper to parse and normalize date to YYYY-MM-DD
const parseDate = (dateStr?: string): string | null => {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) return null; // Invalid date
  return parsed.toISOString().split("T")[0]; // Always YYYY-MM-DD
};

/* ---------------- COMPONENT ---------------- */
export default function Dashboard() {
  const [username, setUsername] = useState("User");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New states for modals and forms
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    narration: "",
    amount: "",
    category: "Food",
    date: "",
    type: "DEBIT",
  });

  /* ---------------- FETCH DATA ---------------- */
  const fetchTransactions = async () => {
    setRefreshing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUsername(user.email?.split("@")[0] ?? "User");

      /* TRANSACTIONS */
      const { data: txnData, error: txnError } = await supabase
        .from("transactions")
        .select("id, narration, amount, date, type, category")
        .eq("user_id", user.id);

      if (txnError) {
        console.error("Error fetching transactions:", txnError);
        toast.error("Failed to load transactions");
        return;
      }
      setTransactions(txnData || []);

      /* GOALS */
      const { data: goalsData, error: goalsError } = await supabase
        .from("goals")
        .select("current, target")
        .eq("user_id", user.id);

      if (goalsError) {
        console.error("Error fetching goals:", goalsError);
        toast.error("Failed to load goals");
        return;
      }
      setGoals(goalsData || []);
      
      toast.success("Data refreshed successfully!");
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  /* ---------------- FIXED CALCULATIONS ---------------- */
  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "CREDIT")
        .reduce((s, t) => s + Number(t.amount), 0),
    [transactions]
  );

  const totalExpense = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "DEBIT")
        .reduce((s, t) => s + Number(t.amount), 0),
    [transactions]
  );

  // CORRECT: Simple balance calculation (Income - Expense)
  const balance = totalIncome - totalExpense;

  // Get current month and year for monthly calculations
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyExpense = useMemo(() => {
    return transactions
      .filter((t) => {
        if (t.type !== "DEBIT") return false;
        if (!t.date) return false;
        const d = new Date(t.date);
        if (isNaN(d.getTime())) return false;
        return (
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear
        );
      })
      .reduce((s, t) => s + Number(t.amount), 0);
  }, [transactions, currentMonth, currentYear]);

  const monthlyIncome = useMemo(() => {
    return transactions
      .filter((t) => {
        if (t.type !== "CREDIT") return false;
        if (!t.date) return false;
        const d = new Date(t.date);
        if (isNaN(d.getTime())) return false;
        return (
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear
        );
      })
      .reduce((s, t) => s + Number(t.amount), 0);
  }, [transactions, currentMonth, currentYear]);

  const monthlyGrowth = useMemo(() => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const lastMonthExpense = transactions
      .filter(
        (t) =>
          t.type === "DEBIT" &&
          new Date(t.date).getMonth() === lastMonth.getMonth() &&
          new Date(t.date).getFullYear() === lastMonth.getFullYear()
      )
      .reduce((s, t) => s + Number(t.amount), 0);
    
    if (lastMonthExpense === 0) return 0;
    return ((monthlyExpense - lastMonthExpense) / lastMonthExpense) * 100;
  }, [transactions, monthlyExpense]);

  /* ---------------- RECENT TRANSACTIONS ---------------- */
  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => +new Date(b.date) - +new Date(a.date))
        .slice(0, 5),
    [transactions]
  );

  /* ---------------- GOALS PROGRESS ---------------- */
  const goalsProgress = useMemo(() => {
    if (goals.length === 0) return 0;
    const saved = goals.reduce((s, g) => s + Number(g.current), 0);
    const target = goals.reduce((s, g) => s + Number(g.target), 0);
    return target > 0 ? Math.min((saved / target) * 100, 100) : 0;
  }, [goals]);

  /* ---------------- MONTHLY CASHFLOW CHART ---------------- */
  const monthlyChartData = useMemo(() => {
    const map: Record<string, { income: number; expense: number; net: number }> = {};
    transactions.forEach((t) => {
      const month = new Date(t.date).toLocaleString("default", {
        month: "short",
      });
      if (!map[month]) map[month] = { income: 0, expense: 0, net: 0 };
      if (t.type === "CREDIT") {
        map[month].income += Number(t.amount);
        map[month].net += Number(t.amount);
      } else {
        map[month].expense += Number(t.amount);
        map[month].net -= Number(t.amount);
      }
    });
    return Object.entries(map).map(([month, v]) => ({
      month,
      income: v.income,
      expense: v.expense,
      net: v.net,
    }));
  }, [transactions]);

  /* ---------------- EXPENSE CATEGORY PIE CHART ---------------- */
  const expenseCategoryData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "DEBIT")
      .forEach((t) => {
        const cat = t.category || "Other";
        map[cat] = (map[cat] || 0) + Number(t.amount);
      });
    return Object.entries(map).map(([category, value]) => ({
      name: category,
      value,
    }));
  }, [transactions]);

  const COLORS = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8",
    "#82ca9d", "#ffc658", "#8dd1e1", "#a4de6c", "#d0ed57"
  ];

  /* ---------------- BALANCE OVER TIME LINE CHART ---------------- */
  const balanceOverTimeData = useMemo(() => {
    const sortedTxns = [...transactions].sort((a, b) => +new Date(a.date) - +new Date(b.date));
    let runningBalance = 0;
    return sortedTxns.map((t) => {
      runningBalance += t.type === "CREDIT" ? Number(t.amount) : -Number(t.amount);
      return {
        date: new Date(t.date).toLocaleDateString(),
        balance: runningBalance,
      };
    });
  }, [transactions]);

  /* ---------------- GAMIFIED STATUS ---------------- */
  const cashflowStatus =
    monthlyIncome - monthlyExpense > 0
      ? "✅ Positive Cashflow"
      : "⚠️ Overspending";

  /* ---------------- AI/ML SIMULATED ALGORITHMS ---------------- */
  const estimatedSavings = useMemo(() => {
    const now = new Date();
    const pastMonths = [];
    for (let i = 1; i <= 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const income = transactions
        .filter(
          (t) =>
            t.type === "CREDIT" &&
            new Date(t.date).getMonth() === date.getMonth() &&
            new Date(t.date).getFullYear() === date.getFullYear()
        )
        .reduce((s, t) => s + Number(t.amount), 0);
      const expense = transactions
        .filter(
          (t) =>
            t.type === "DEBIT" &&
            new Date(t.date).getMonth() === date.getMonth() &&
            new Date(t.date).getFullYear() === date.getFullYear()
        )
        .reduce((s, t) => s + Number(t.amount), 0);
      const savings = Math.max(income - expense, 0);
      if (income > 0) pastMonths.push(savings / income);
    }
    const avgSavingsRate = pastMonths.length > 0 ? pastMonths.reduce((a, b) => a + b, 0) / pastMonths.length : 0.3;
    return Math.max((monthlyIncome - monthlyExpense) * avgSavingsRate, 0);
  }, [transactions, monthlyIncome, monthlyExpense]);

  const savingStreak = useMemo(() => {
    const now = new Date();
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dayTxns = transactions.filter(t => new Date(t.date).toDateString() === date.toDateString());
      const dayIncome = dayTxns.filter(t => t.type === "CREDIT").reduce((s, t) => s + Number(t.amount), 0);
      const dayExpense = dayTxns.filter(t => t.type === "DEBIT").reduce((s, t) => s + Number(t.amount), 0);
      if (dayIncome > dayExpense) streak++;
      else break;
    }
    return streak;
  }, [transactions]);

  const financialHealthScore = useMemo(() => {
    let score = 0;
    if (balance > 0) score += 30;
    if (monthlyIncome - monthlyExpense > 0) score += 25;
    if (goalsProgress >= 50) score += 20;
    if (savingStreak >= 7) score += 15;
    if (balance > totalExpense * 0.5) score += 10;
    return Math.min(score, 100);
  }, [balance, monthlyIncome, monthlyExpense, goalsProgress, savingStreak, totalExpense]);

  const anomalies = useMemo(() => {
    const avgMonthlyExpense = totalExpense / Math.max(1, new Date().getMonth() + 1);
    return transactions.filter(t => t.type === "DEBIT" && Number(t.amount) > avgMonthlyExpense * 2);
  }, [transactions, totalExpense]);

  const budgetRecommendations = useMemo(() => {
    const recs = [];
    const foodExpense = transactions.filter(t => t.category === "Food" && t.type === "DEBIT").reduce((s, t) => s + Number(t.amount), 0);
    if (foodExpense > monthlyIncome * 0.2) recs.push("🍕 Reduce food expenses to under 20% of income.");
    const entertainmentExpense = transactions.filter(t => t.category === "Entertainment" && t.type === "DEBIT").reduce((s, t) => s + Number(t.amount), 0);
    if (entertainmentExpense > monthlyIncome * 0.1) recs.push("🎬 Cut back on entertainment for better savings.");
    if (recs.length === 0) recs.push("✅ Your spending is balanced! Keep it up.");
    return recs;
  }, [transactions, monthlyIncome]);

  const goalPrediction = useMemo(() => {
    if (goals.length === 0) return "No goals set.";
    const avgProgress = goalsProgress;
    const daysInMonth = 30;
    const projectedProgress = avgProgress + (avgProgress / daysInMonth) * 30;
    if (projectedProgress >= 100) return "🎯 High chance of achieving goals this month!";
    else if (projectedProgress >= 75) return "📈 Good progress, keep saving!";
    else return "⚠️ Slow progress, consider increasing contributions.";
  }, [goals, goalsProgress]);

  const badges = useMemo(() => {
    const b = [];
    if (savingStreak >= 7) b.push({ text: "🔥 7-Day Saver", color: "bg-orange-500/20 text-orange-600" });
    if (goalsProgress >= 100) b.push({ text: "🏆 Goal Achiever", color: "bg-purple-500/20 text-purple-600" });
    if (balance > 10000) b.push({ text: "💰 Wealth Builder", color: "bg-green-500/20 text-green-600" });
    if (financialHealthScore >= 80) b.push({ text: "🌟 Financial Guru", color: "bg-yellow-500/20 text-yellow-600" });
    return b;
  }, [savingStreak, goalsProgress, balance, financialHealthScore]);

  /* ---------------- HANDLERS ---------------- */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    toast.loading("Processing CSV file...");
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        const rows = res.data as any[];
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          toast.error("Please login again");
          return;
        }
        const payload = rows.map((r) => ({
          user_id: user.id,
          narration: r.narration || r.reference || "Bank Transaction",
          amount: Number(r.amount),
          category: resolveCategoryFromReference(r.reference),
          type: r.type?.toUpperCase() === "CREDIT" ? "CREDIT" : "DEBIT",
          date: parseDate(r.valueDate || r.date || r.transactionTimestamp?.split("T")[0]) || new Date().toISOString().split("T")[0],
          transaction_timestamp: r.transactionTimestamp || new Date().toISOString(),
          source: "BANK",
          is_anomaly: false,
        }));
        const { error } = await supabase.from("transactions").insert(payload);
        if (error) {
          toast.error("Upload failed: " + error.message);
        } else {
          toast.success(`Uploaded ${rows.length} transactions`);
          setShowUploadModal(false);
          fetchTransactions();
        }
        setIsLoading(false);
      },
    });
  };

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please login again");
      return;
    }
    const payload = {
      user_id: user.id,
      narration: form.narration,
      amount: Number(form.amount),
      category: form.category,
      type: form.type,
      date: form.date,
      transaction_timestamp: new Date().toISOString(),
      source: "MANUAL",
      is_anomaly: false,
    };
    const { error } = await supabase.from("transactions").insert(payload);
    if (error) {
      toast.error("Failed to add transaction");
    } else {
      toast.success("Transaction added successfully!");
      setShowAddModal(false);
      setForm({
        narration: "",
        amount: "",
        category: "Food",
        date: "",
        type: "DEBIT",
      });
      fetchTransactions();
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "Description", "Category", "Type", "Amount"];
    const csvData = [
      headers.join(","),
      ...transactions.map(t => 
        [t.date, t.narration, t.category, t.type, t.amount].join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast.success("Report exported successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-gray-50 to-background dark:via-gray-900/20">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />

        <main className="p-6 space-y-6">
          {/* ENHANCED HEADER */}
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-gradient-to-r from-primary/20 to-blue-500/20">
                  <Rocket className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-3xl font-bold">
                  Welcome back, <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">{username}</span>! 👋
                </h1>
              </div>
              <p className="text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Your AI-powered financial command center
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowInsightsModal(true)}
                className="border-primary/30 hover:bg-primary/10"
              >
                <Brain className="w-4 h-4 mr-2" />
                AI Insights
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowUploadModal(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={fetchTransactions}
                disabled={refreshing}
                className="hover:bg-primary/10"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* ENHANCED BADGES & STREAKS */}
          <div className="glass-card p-5 border border-primary/10 bg-gradient-to-r from-primary/5 to-blue-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Saving Streak</p>
                    <p className="text-xl font-bold">{savingStreak} days 🔥</p>
                  </div>
                </div>
                
                <div className="h-8 w-px bg-border"></div>
                
                <div className="flex gap-2">
                  {badges.map((badge, idx) => (
                    <Badge key={idx} className={badge.color + " border-0 shadow-sm"}>
                      {badge.text}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Financial Health</p>
                <div className="flex items-center gap-2">
                  <Progress value={financialHealthScore} className="w-32 h-2" />
                  <span className="font-bold">{financialHealthScore}/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* ENHANCED STATS CARDS */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="glass-card p-5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <Badge variant="outline" className={balance >= 0 ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30" : "bg-red-500/20 text-red-600 border-red-500/30"}>
                  {balance >= 0 ? "Positive" : "Negative"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
              <p className="text-2xl font-bold">
                ₹{balance.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Total Income - Total Expenses</p>
            </div>

            <div className="glass-card p-5 border border-blue-500/20 hover:border-blue-500/40 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div className={`text-sm font-medium ${monthlyIncome - monthlyExpense >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {monthlyIncome - monthlyExpense >= 0 ? '📈' : '📉'}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">This Month Flow</p>
              <p className={`text-2xl font-bold ${monthlyIncome - monthlyExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {monthlyIncome - monthlyExpense >= 0 ? '+' : ''}₹{(monthlyIncome - monthlyExpense).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-2">{cashflowStatus}</p>
            </div>

            <div className="glass-card p-5 border border-purple-500/20 hover:border-purple-500/40 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
                  <PiggyBank className="w-6 h-6 text-white" />
                </div>
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">Estimated Savings</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{estimatedSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground mt-2">AI-powered prediction</p>
            </div>

            <div className="glass-card p-5 border border-orange-500/20 hover:border-orange-500/40 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="text-sm font-medium">
                  {goalsProgress >= 50 ? '🎯' : '📊'}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Goals Progress</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold">{goalsProgress.toFixed(0)}%</p>
                <Progress value={goalsProgress} className="h-2 flex-1" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Across {goals.length} goals</p>
            </div>
          </div>

          {/* ENHANCED AI INSIGHTS */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-6 border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-lg">🤖 AI Financial Advisor</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm mb-1">Goal Prediction</p>
                    <p className="text-sm text-muted-foreground">{goalPrediction}</p>
                  </div>
                </div>
                {budgetRecommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                    {rec.includes("✅") ? (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : rec.includes("⚠️") ? (
                      <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-lg">⚡ Financial Health Score</h3>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-primary/20 to-blue-500/20 mb-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold">{financialHealthScore}</div>
                    <div className="text-sm text-muted-foreground">/100</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {financialHealthScore >= 80 ? "Excellent! 🏆 You're a financial wizard!" : 
                   financialHealthScore >= 60 ? "Good! 👍 Keep up the momentum!" : 
                   "Needs Improvement 😅 Let's work on your finances!"}
                </p>
              </div>
            </div>
          </div>

          {/* ENHANCED ANOMALIES ALERT */}
          {anomalies.length > 0 && (
            <div className="glass-card p-6 border-l-4 border-red-500 bg-gradient-to-r from-red-500/10 to-red-500/5 hover:from-red-500/15 hover:to-red-500/10 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-red-500/20 animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">🚨 Unusual Expenses Detected</h3>
                    <p className="text-sm text-muted-foreground">
                      {anomalies.length} transaction{anomalies.length > 1 ? 's' : ''} exceed category averages
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowInsightsModal(true)}
                  className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Review Details
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
                {anomalies.slice(0, 5).map((txn, idx) => (
                  <div key={idx} className="p-3 bg-red-500/10 rounded-lg">
                    <p className="text-sm font-medium truncate">{txn.narration}</p>
                    <p className="text-xs text-red-600 font-bold">₹{txn.amount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(txn.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ENHANCED CHARTS ROW */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* ENHANCED MONTHLY CASHFLOW CHART */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold">📊 Monthly Cashflow</h3>
                </div>
                <Button variant="ghost" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="net" 
                    name="Net Cashflow"
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.1}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    name="Income"
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.1}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expense" 
                    name="Expense"
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* ENHANCED EXPENSE CATEGORY PIE CHART */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                    <PieChart className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold">🥧 Expense Breakdown</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={exportToCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={expenseCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {expenseCategoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Amount']} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ENHANCED BALANCE OVER TIME */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold">📈 Balance Over Time</h3>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {balanceOverTimeData.length} data points
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={balanceOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Balance']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* ENHANCED RECENT TRANSACTIONS */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold">💳 Recent Transactions</h3>
              </div>
              <Badge variant="outline">
                {recentTransactions.length} transactions
              </Badge>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading transactions...</p>
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">😴</div>
                <p className="text-muted-foreground">No transactions yet</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add your first transaction
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 hover:bg-secondary/30 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        t.type === "CREDIT" 
                          ? "bg-green-500/20 text-green-600" 
                          : "bg-red-500/20 text-red-600"
                      }`}>
                        {t.type === "CREDIT" ? (
                          <ArrowDownCircle className="w-4 h-4" />
                        ) : (
                          <ArrowUpCircle className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{t.narration}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {t.category || "Uncategorized"}
                          </Badge>
                          <span>•</span>
                          <span>{new Date(t.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`font-bold ${
                        t.type === "CREDIT" ? "text-green-600" : "text-red-600"
                      }`}>
                        {t.type === "CREDIT" ? "+" : "-"}₹
                        {Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.type === "CREDIT" ? "Income" : "Expense"}
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" className="w-full" onClick={() => window.location.href = "/dashboard/expenses"}>
                  View All Transactions
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>

          {/* GOALS */}
          <GoalsProgress />
        </main>
      </div>

      {/* MODALS */}
      {/* UPLOAD CSV MODAL */}
      {showUploadModal && (
        <Modal title="📤 Upload Bank Statement" onClose={() => setShowUploadModal(false)}>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-4 rounded-lg border border-blue-500/20">
              <h4 className="font-medium flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" /> Required CSV Format
              </h4>
              <code className="text-xs block bg-background/50 p-3 rounded font-mono">
                type, amount, narration, reference, date, transactionTimestamp
              </code>
            </div>

            <div className="border-2 border-dashed border-primary/30 p-8 text-center rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                 onClick={() => fileInputRef.current?.click()}>
              <Upload className="mx-auto mb-3 w-12 h-12 text-primary/50" />
              <p className="text-lg font-medium mb-2">Drop CSV file here</p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <Button variant="outline" disabled={isLoading}>
                {isLoading ? "Processing..." : "Select CSV File"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                hidden
                onChange={handleFileChange}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ADD TRANSACTION MODAL */}
      {showAddModal && (
        <Modal title="➕ Add Transaction" onClose={() => setShowAddModal(false)}>
          <form onSubmit={addTransaction} className="space-y-4">
            <div>
              <Label htmlFor="narration">Description</Label>
              <Input
                id="narration"
                placeholder="What was this transaction for?"
                value={form.narration}
                onChange={(e) => setForm({ ...form, narration: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full p-2 border rounded mt-1"
                  required
                >
                  <option value="DEBIT">Expense</option>
                  <option value="CREDIT">Income</option>
                </select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full p-2 border rounded mt-1"
                required
              >
                {BASE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Transaction
                </>
              )}
            </Button>
          </form>
        </Modal>
      )}

      {/* AI INSIGHTS MODAL */}
      {showInsightsModal && (
        <Modal title="🤖 AI Financial Insights" onClose={() => setShowInsightsModal(false)}>
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 mb-4">
                <Brain className="w-8 h-8 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold">Smart Analysis Report</h3>
              <p className="text-sm text-muted-foreground">
                Powered by AI algorithms
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg">
                <h4 className="font-medium mb-2">📊 Financial Summary</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-xl font-bold">₹{balance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Cashflow</p>
                    <p className={`text-xl font-bold ${monthlyIncome - monthlyExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{(monthlyIncome - monthlyExpense).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              
              {anomalies.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-lg border border-red-500/20">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    🚨 Anomaly Detection
                  </h4>
                  <p className="text-sm">{anomalies.length} unusual transaction{anomalies.length > 1 ? 's' : ''} detected</p>
                </div>
              )}
              
              <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg">
                <h4 className="font-medium mb-2">💡 Recommendations</h4>
                <ul className="space-y-2">
                  {budgetRecommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Button 
                className="w-full"
                onClick={() => setShowInsightsModal(false)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ENHANCED MODAL COMPONENT */
const Modal = ({ title, children, onClose }: any) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div 
      className="glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border border-primary/20 shadow-2xl"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">{title}</h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-secondary rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);