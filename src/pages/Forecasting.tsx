import { useEffect, useMemo, useState, useCallback } from "react";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  Trophy,
  Flame,
  Brain,
  Sparkles,
  BarChart3,
  PieChart,
  Lightbulb,
  Rocket,
  RefreshCw,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Bar,
  Area,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

/* ---------------- TYPES ---------------- */
type Transaction = {
  amount: number;
  date: string;
  category: string;
  type: "CREDIT" | "DEBIT";
  source?: "manual" | "csv" | "bank";
};

type MonthData = {
  month: string;
  actual?: number;
  predicted?: number;
  optimistic?: number;
  pessimistic?: number;
  realistic?: number;
  isPrediction: boolean;
  confidence: number;
};

type Scenario = "optimistic" | "pessimistic" | "realistic";

type CategoryPrediction = {
  category: string;
  amount: number;
  growth: string;
};

type CategorySavings = CategoryPrediction & {
  monthlySave: number;
  totalSave: number;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Forecasting() {
  const [monthsAhead, setMonthsAhead] = useState([3]);
  const [scenario, setScenario] = useState<Scenario>("realistic");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userGoals] = useState({ savingsTarget: 5000, maxSpend: 20000 });
  const [isLoading, setIsLoading] = useState(true);

  // New states for interactivity
  const [spendReduction, setSpendReduction] = useState([0]);
  const [seasonalityMultiplier, setSeasonalityMultiplier] = useState([1.2]);
  const [growthOverride, setGrowthOverride] = useState([0]);
  const [confidenceThreshold, setConfidenceThreshold] = useState([70]);

  /* ---------------- FETCH TRANSACTIONS (WITH REFETCH CAPABILITY) ---------------- */
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const fromDate = oneYearAgo.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("transactions")
        .select("amount, date, category, type, source")
        .eq("user_id", user.id)
        .gte("date", fromDate)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error);
        return;
      }

      // Log data for debugging
      console.log("Fetched transactions:", data?.length);
      if (data) {
        data.forEach(t => {
          console.log(`Transaction: ${t.date}, ${t.category}, ${t.type}, ${t.amount}, source: ${t.source}`);
        });
      }

      setTransactions(data || []);
    } catch (error) {
      console.error("Error in fetchTransactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ---------------- SETUP REALTIME SUBSCRIPTION ---------------- */
  useEffect(() => {
    fetchTransactions();

    // Setup realtime subscription for new transactions
    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          console.log('New transaction inserted via realtime:', payload.new);
          fetchTransactions(); // Refetch when new transaction is added
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'transactions',
        },
        () => {
          fetchTransactions(); // Refetch when transaction is deleted
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions]);

  /* ---------------- DEBUG: CHECK TRANSACTION DATA ---------------- */
  const debugInfo = useMemo(() => {
    const expenses = transactions.filter(t => t.type === "DEBIT");
    const credits = transactions.filter(t => t.type === "CREDIT");
    const manualEntries = transactions.filter(t => t.source === "manual");
    const csvEntries = transactions.filter(t => t.source === "csv");
    
    return {
      totalTransactions: transactions.length,
      expenses: expenses.length,
      credits: credits.length,
      manualEntries: manualEntries.length,
      csvEntries: csvEntries.length,
      dateRange: transactions.length > 0 
        ? `${transactions[transactions.length - 1]?.date} to ${transactions[0]?.date}`
        : "No data",
    };
  }, [transactions]);

  /* ---------------- ADVANCED FORECAST LOGIC ---------------- */
  const {
    avgSpending = 0,
    growthRate = 0,
    predictedData = [],
    insights = {
      totalPredicted: 0,
      avgPredicted: 0,
      trend: "stable",
      potentialSavings: 0,
      volatility: 0,
    },
    categoryPredictions = [],
    forecastAccuracy = 0,
    gamification = {
      badges: [],
      streak: 0,
      challenges: [],
    },
    alerts = [],
  } = useMemo(() => {
    // Filter ONLY DEBIT transactions (expenses)
    const expenses = transactions.filter(t => t.type === "DEBIT");
    
    console.log("Forecast processing:", {
      totalTransactions: transactions.length,
      expenseTransactions: expenses.length,
      expenseAmounts: expenses.map(e => ({ amount: e.amount, date: e.date, category: e.category }))
    });

    if (expenses.length === 0) {
      console.log("No expense transactions found");
      return {
        avgSpending: 0,
        growthRate: 0,
        predictedData: [],
        insights: {
          totalPredicted: 0,
          avgPredicted: 0,
          trend: "stable",
          potentialSavings: 0,
          volatility: 0,
        },
        categoryPredictions: [],
        forecastAccuracy: 0,
        gamification: { badges: [], streak: 0, challenges: [] },
        alerts: [],
      };
    }

    /* -------- GROUP BY MONTH -------- */
    const monthlyMap: Record<string, { total: number; categories: Record<string, number> }> = {};
    expenses.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      if (!monthlyMap[key]) monthlyMap[key] = { total: 0, categories: {} };
      monthlyMap[key].total += Number(e.amount);
      monthlyMap[key].categories[e.category] = (monthlyMap[key].categories[e.category] || 0) + Number(e.amount);
    });

    /* -------- HISTORICAL DATA -------- */
    const historical: MonthData[] = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, value]) => {
        const [y, m] = key.split("-");
        return {
          month: `${MONTHS[Number(m)]} ${y}`,
          actual: value.total,
          isPrediction: false,
          confidence: 100,
        };
      });

    if (historical.length < 3) {
      console.log("Insufficient historical data for forecasting");
      return {
        avgSpending: historical.reduce((sum, h) => sum + (h.actual || 0), 0) / historical.length || 0,
        growthRate: 0,
        predictedData: historical,
        insights: {
          totalPredicted: 0,
          avgPredicted: 0,
          trend: "stable",
          potentialSavings: 0,
          volatility: 0,
        },
        categoryPredictions: [],
        forecastAccuracy: 0,
        gamification: { badges: [], streak: 0, challenges: [] },
        alerts: [],
      };
    }

    /* -------- LINEAR REGRESSION -------- */
    const n = historical.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    historical.forEach((d, i) => {
      sumX += i;
      sumY += d.actual || 0;
      sumXY += i * (d.actual || 0);
      sumXX += i * i;
    });
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const seasonality = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.2];

    const ma = historical.map((d, i) => {
      const window = historical.slice(Math.max(0, i - 2), i + 1);
      return window.reduce((s, v) => s + (v.actual || 0), 0) / window.length;
    });

    const mean = sumY / n;
    const variance = historical.reduce((s, d) => s + Math.pow((d.actual || 0) - mean, 2), 0) / n;
    const volatility = Math.sqrt(variance);

    /* -------- PREDICTIONS -------- */
    const predictions: MonthData[] = [];
    const lastIndex = n - 1;
    for (let i = 1; i <= monthsAhead[0]; i++) {
      const futureIndex = lastIndex + i;
      const trendValue = slope * futureIndex + intercept;
      const seasonalMultiplier = seasonality[(new Date().getMonth() + i) % 12] * seasonalityMultiplier[0];
      const smoothed = ma[lastIndex] || trendValue;
      const adjustedGrowth = (slope + growthOverride[0] / 100) * futureIndex + intercept;
      const base = (adjustedGrowth + smoothed) / 2 * seasonalMultiplier;

      const realistic = Math.max(0, base * (1 - spendReduction[0] / 100));
      const optimistic = realistic * 0.8;
      const pessimistic = realistic * 1.2;

      predictions.push({
        month: MONTHS[(new Date().getMonth() + i) % 12],
        predicted: Math.round(realistic),
        optimistic: Math.round(optimistic),
        pessimistic: Math.round(pessimistic),
        realistic: Math.round(realistic),
        isPrediction: true,
        confidence: Math.max(50, 100 - (volatility / (base || 1)) * 100),
      });
    }

    const totalPredicted = predictions.reduce((s, p) => s + (p[scenario] || 0), 0);

    /* -------- CATEGORY FORECAST -------- */
    const categoryTrends: Record<string, { total: number; growth: number }> = {};
    Object.keys(monthlyMap).forEach(key => {
      Object.entries(monthlyMap[key].categories).forEach(([cat, amt]) => {
        if (!categoryTrends[cat]) categoryTrends[cat] = { total: 0, growth: 0 };
        categoryTrends[cat].total += amt;
      });
    });
    
    Object.keys(categoryTrends).forEach(cat => {
      const monthKeys = Object.keys(monthlyMap).sort();
      if (monthKeys.length >= 6) {
        const firstThree = monthKeys.slice(0, 3);
        const lastThree = monthKeys.slice(-3);
        
        const earlyAvg = firstThree.reduce((sum, key) => 
          sum + (monthlyMap[key].categories[cat] || 0), 0) / 3;
        const lateAvg = lastThree.reduce((sum, key) => 
          sum + (monthlyMap[key].categories[cat] || 0), 0) / 3;
        
        categoryTrends[cat].growth = earlyAvg > 0 ? (lateAvg - earlyAvg) / earlyAvg : 0;
      }
    });

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const categoryPredictions = Object.entries(categoryTrends).map(([cat, data]) => ({
      category: cat,
      amount: Math.round((data.total / totalExpenses) * totalPredicted * (1 + data.growth)),
      growth: (data.growth * 100).toFixed(1),
    }));

    /* -------- INSIGHTS -------- */
    const insights = {
      totalPredicted,
      avgPredicted: predictions.length ? totalPredicted / predictions.length : 0,
      trend: slope > 0 ? "increasing" : slope < 0 ? "decreasing" : "stable",
      potentialSavings: Math.round(totalPredicted * 0.15),
      volatility: Math.round(volatility),
    };

    /* -------- FORECAST ACCURACY -------- */
    const lastMonth = historical[historical.length - 1];
    const forecastAccuracy = lastMonth && predictions[0] ? 
      Math.max(0, 100 - Math.abs((lastMonth.actual || 0) - (predictions[0]?.predicted || 0)) / (lastMonth.actual || 1) * 100) : 0;

    /* -------- GAMIFICATION -------- */
    const gamification = {
      badges: [
        forecastAccuracy > 90 ? "🔮 Prophet" : "",
        totalPredicted < userGoals.maxSpend ? "🛡️ Budget Guardian" : "",
        insights.potentialSavings > userGoals.savingsTarget ? "💰 Savings Champion" : "",
      ].filter(Boolean),
      streak: Math.floor(forecastAccuracy / 10),
      challenges: [
        { title: "Beat Your Prediction", progress: Math.round(forecastAccuracy), target: 100 },
        { title: "Save More Than Target", progress: insights.potentialSavings, target: userGoals.savingsTarget },
      ],
    };

    /* -------- ALERTS -------- */
    const alerts = [];
    if (totalPredicted > userGoals.maxSpend) alerts.push("🚨 Predicted spend exceeds your budget!");
    if (volatility > insights.avgPredicted * 0.5) alerts.push("⚠️ High volatility detected – review spending patterns.");
    if (insights.trend === "increasing") alerts.push("📈 Expenses are trending up – consider adjustments.");

    console.log("Forecast results:", {
      totalPredicted,
      forecastAccuracy,
      categoryCount: categoryPredictions.length,
      alerts: alerts.length
    });

    return {
      avgSpending: sumY / n,
      growthRate: slope * 100,
      predictedData: [...historical, ...predictions],
      insights,
      categoryPredictions,
      forecastAccuracy,
      gamification,
      alerts,
    };
  }, [transactions, monthsAhead, scenario, userGoals, spendReduction, seasonalityMultiplier, growthOverride]);

  const categorySavings: CategorySavings[] = useMemo(() => {
    return categoryPredictions.map(c => {
      const monthlySave = Math.round(c.amount * (spendReduction[0] / 100));
      const totalSave = monthlySave * monthsAhead[0];

      return {
        ...c,
        monthlySave,
        totalSave,
      };
    });
  }, [categoryPredictions, spendReduction, monthsAhead]);

  /* ---------------- DEBUG PANEL (Can be hidden in production) ---------------- */
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />

        <main className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Rocket className="w-6 h-6 text-primary" />
                AI-Powered Expense Forecast 🚀
              </h1>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchTransactions}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Loading...' : 'Refresh Data'}
              </Button>
            </div>
            <div className="flex gap-2">
              {gamification.badges.map((badge, idx) => (
                <Badge key={idx} variant="secondary">{badge}</Badge>
              ))}
              <Badge 
                variant="outline" 
                className="cursor-pointer" 
                onClick={() => setShowDebug(!showDebug)}
              >
                {transactions.length} transactions
              </Badge>
            </div>
          </div>

          {/* DEBUG PANEL */}
          {showDebug && (
            <div className="glass-card p-4 border border-yellow-400 bg-yellow-50">
              <h3 className="font-semibold mb-2 text-yellow-800">🔧 Debug Panel</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div>Total Transactions: <strong>{debugInfo.totalTransactions}</strong></div>
                <div>Expenses: <strong>{debugInfo.expenses}</strong></div>
                <div>Manual Entries: <strong>{debugInfo.manualEntries}</strong></div>
                <div>CSV Entries: <strong>{debugInfo.csvEntries}</strong></div>
                <div>Date Range: <strong>{debugInfo.dateRange}</strong></div>
                <div>Forecast Accuracy: <strong>{forecastAccuracy.toFixed(1)}%</strong></div>
              </div>
              <p className="text-xs mt-2 text-yellow-700">
                Transactions must have type: "DEBIT" and be within last 12 months.
              </p>
            </div>
          )}

          {/* LOADING STATE */}
          {isLoading && (
            <div className="glass-card p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading transaction data...</p>
            </div>
          )}

          {/* NO DATA STATE */}
          {!isLoading && transactions.length === 0 && (
            <div className="glass-card p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Transaction Data Found</h3>
              <p className="text-muted-foreground mb-4">
                Add transactions via CSV upload or manual entry to see AI-powered forecasts.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline">Upload CSV</Button>
                <Button>Add Manual Transaction</Button>
              </div>
            </div>
          )}

          {/* MAIN CONTENT (Only show when data exists) */}
          {!isLoading && transactions.length > 0 && (
            <>
              {/* GAMIFICATION DASHBOARD */}
              <div className="glass-card p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Gamified Insights
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <Flame className="w-8 h-8 mx-auto text-orange-500" />
                    <p className="text-sm">Forecast Streak</p>
                    <p className="text-2xl font-bold">{gamification.streak} days</p>
                  </div>
                  <div className="text-center">
                    <Brain className="w-8 h-8 mx-auto text-purple-500" />
                    <p className="text-sm">Accuracy Score</p>
                    <p className="text-2xl font-bold">{forecastAccuracy.toFixed(0)}%</p>
                  </div>
                  <div className="text-center">
                    <Sparkles className="w-8 h-8 mx-auto text-blue-500" />
                    <p className="text-sm">Challenges Completed</p>
                    <p className="text-2xl font-bold">{gamification.challenges.filter(c => c.progress >= c.target).length}</p>
                  </div>
                </div>
                <div className="mt-4">
                  {gamification.challenges.map((c, idx) => (
                    <div key={idx} className="mb-2">
                      <div className="flex justify-between text-sm">
                        <span>{c.title}</span>
                        <span>{c.progress}/{c.target}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (c.progress / c.target) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ALERTS */}
              {alerts.length > 0 && (
                <div className="glass-card p-6 border-l-4 border-red-500">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Smart Alerts
                  </h3>
                  <ul className="space-y-2">
                    {alerts.map((alert, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">• {alert}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CONTROLS */}
              <div className="glass-card p-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Months Ahead</span>
                      <b>{monthsAhead[0]}</b>
                    </div>
                    <Slider
                      value={monthsAhead}
                      onValueChange={setMonthsAhead}
                      min={1}
                      max={12}
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Scenario</label>
                    <select
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value as Scenario)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="optimistic">Optimistic</option>
                      <option value="realistic">Realistic</option>
                      <option value="pessimistic">Pessimistic</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* METRICS */}
              <div className="grid md:grid-cols-4 gap-4">
                <Metric
                  icon={DollarSign}
                  label="Avg Monthly Spend"
                  value={`₹${avgSpending.toFixed(0)}`}
                />
                <Metric
                  icon={growthRate > 0 ? ArrowUpRight : ArrowDownRight}
                  label="Trend"
                  value={`${growthRate.toFixed(1)}%`}
                  danger={growthRate > 0}
                />
                <Metric
                  icon={Target}
                  label="Predicted Total"
                  value={`₹${insights.totalPredicted.toLocaleString()}`}
                />
                <Metric
                  icon={Zap}
                  label="Volatility"
                  value={`₹${insights.volatility.toLocaleString()}`}
                />
              </div>
              
              {/* CHART */}
              <div className="glass-card p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Forecast Visualization
                </h2>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={predictedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => `₹${Number(value).toLocaleString()}`}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Area
                      dataKey="actual"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary)/0.3)"
                      name="Actual Spending"
                    />
                    <Area
                      dataKey={scenario}
                      stroke="#000000"
                      fill="#00ff40ff"
                      fillOpacity={0.5}
                      name={`${scenario.charAt(0).toUpperCase() + scenario.slice(1)} Prediction`}
                    />
                    <Bar
                      dataKey="confidence"
                      fill="hsl(var(--accent))"
                      opacity={0.4}
                      name="Confidence %"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground mt-2">
                  Hover over months to see actual, predicted, and confidence values. Predicted area is filled in black for future months.
                </p>
              </div>

              {/* CATEGORY FORECAST */}
              <div className="glass-card p-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-green-500" />
                  Category Forecast with Trends
                </h2>
                {categoryPredictions.map(c => (
                  <div key={c.category} className="flex justify-between items-center text-sm mb-2">
                    <span>{c.category}</span>
                    <div className="flex items-center gap-2">
                      <span>₹{c.amount.toLocaleString()}</span>
                      <Badge variant={parseFloat(c.growth) > 0 ? "destructive" : "secondary"}>
                        {parseFloat(c.growth) > 0 ? "+" : ""}{c.growth}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* ADDITIONAL FEATURES */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* WHAT-IF SCENARIO SIMULATOR */}
                <div className="glass-card p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    What-If Simulator
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adjust variables to see how your forecast changes.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm">Reduce Spending by (%)</label>
                      <Slider
                        value={spendReduction}
                        onValueChange={setSpendReduction}
                        min={0}
                        max={50}
                      />
                      <p className="text-xs text-muted-foreground">Current: {spendReduction[0]}%</p>
                    </div>

                    <Button variant="outline" size="sm">
                      Simulate
                    </Button>
                  </div>
                </div>

                {/* PERSONALIZED AI TIPS */}
                <div className="glass-card p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    AI-Powered Savings Plan
                  </h3>

                  <ul className="space-y-3 text-sm">
                    {categorySavings
                      .sort((a, b) => b.amount - a.amount)
                      .slice(0, 5)
                      .map((cat, idx) => {
                        let icon = "💡";
                        let action = "optimize spending";

                        if (cat.category.toLowerCase().includes("food")) {
                          icon = "🍽️";
                          action = "home cooking & fewer online orders";
                        }
                        if (cat.category.toLowerCase().includes("travel")) {
                          icon = "🚕";
                          action = "public transport & trip planning";
                        }
                        if (cat.category.toLowerCase().includes("health")) {
                          icon = "🩺";
                          action = "preventive care & regular checkups";
                        }
                        if (cat.category.toLowerCase().includes("shopping")) {
                          icon = "🛍️";
                          action = "avoiding impulse purchases";
                        }

                        return (
                          <li key={idx} className="p-3 rounded-lg bg-secondary/40 border">
                            {icon} <b>{cat.category}</b>:  
                            Reduce by <b>{spendReduction[0]}%</b> via {action}.  
                            <br />
                            ➜ Save <b>₹{cat.monthlySave.toLocaleString()}</b>/month  
                            ➜ <b>₹{cat.totalSave.toLocaleString()}</b> in {monthsAhead[0]} months
                          </li>
                        );
                      })}

                    {/* MASTER SUMMARY */}
                    <li className="p-3 rounded-lg bg-primary/10 border border-primary">
                      🏆 <b>AI Conclusion:</b>  
                      If you maintain a <b>{spendReduction[0]}%</b> reduction consistently,  
                      you can save up to <b>₹{categorySavings.reduce((s, c) => s + c.totalSave, 0).toLocaleString()}</b>  
                      in the next <b>{monthsAhead[0]}</b> months.
                    </li>

                    {/* CONFIDENCE */}
                    <li className="text-xs text-muted-foreground flex items-center gap-2">
                      🤖 Forecast confidence: <b>{forecastAccuracy.toFixed(0)}%</b>  
                      — Plan reliability is {forecastAccuracy > 80 ? "high" : "moderate"}.
                    </li>
                  </ul>
                </div>
              </div>

              {/* INTERACTIVE FORECAST ADJUSTMENT */}
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-4">Adjust Forecast Parameters</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm mb-2">🔄 Monthly Expense Variation</label>
                    <Slider
                      value={seasonalityMultiplier}
                      onValueChange={setSeasonalityMultiplier}
                      min={0.5}
                      max={2}
                      step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">Current: {seasonalityMultiplier[0]}</p>
                  </div>
                  <div>
                    <label className="block text-sm mb-2">🚀 Expected Spending Change</label>
                    <Slider
                      value={growthOverride}
                      onValueChange={setGrowthOverride}
                      min={-50}
                      max={50}
                    />
                    <p className="text-xs text-muted-foreground">Current: {growthOverride[0]}%</p>
                  </div>
                  <div>
                    <label className="block text-sm mb-2">🎯 Accuracy Sensitivity</label>
                    <Slider
                      value={confidenceThreshold}
                      onValueChange={setConfidenceThreshold}
                      min={0}
                      max={100}
                    />
                    <p className="text-xs text-muted-foreground">Current: {confidenceThreshold[0]}%</p>
                  </div>
                </div>
              </div>

              {/* FUTURE VISIONS */}
              <div className="glass-card p-6 text-center">
                <h3 className="font-semibold mb-4 flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-500" />
                  Future Vision
                </h3>
                <p className="text-muted-foreground">
                  In {monthsAhead[0]} months, if you follow the optimistic path, you'll have saved an extra ₹{Math.round(insights.totalPredicted * 0.2).toLocaleString()}! 🌟
                </p>
                <Button className="mt-4" variant="gradient">
                  Unlock Full AI Report
                </Button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

/* ---------------- METRIC COMPONENT ---------------- */
interface MetricProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  danger?: boolean;
}

const Metric = ({ icon: Icon, label, value, danger }: MetricProps) => (
  <div className="glass-card p-4">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className={`w-4 h-4 ${danger ? "text-destructive" : ""}`} />
      {label}
    </div>
    <p className="text-xl font-bold">{value}</p>
  </div>
);