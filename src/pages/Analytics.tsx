import { useEffect, useState, useMemo } from "react";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Download,
  BarChart3,
  LineChart,
  DollarSign,
  Calendar,
  Wallet,
  Target,
  Zap,
  Brain,
  Filter,
  RefreshCw,
  Clock,
  Users,
  ShoppingBag,
  Home,
  Car,
  Coffee,
  CreditCard,
  PiggyBank,
  Lightbulb,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,  // Import PieChart directly
  Pie,  
  Cell,
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ---------------- TYPES ---------------- */
type Transaction = {
  id: string;
  amount: number;
  category: string;
  date: string;
  type: "DEBIT" | "CREDIT";
  narration: string;
};

type Range = "WEEK" | "MONTH" | "QUARTER" | "YEAR" | "ALL";

/* ---------------- COMPONENT ---------------- */
export default function Analytics() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("MONTH");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  /* ---------------- FETCH DATA ---------------- */
  const fetchAnalytics = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (!error) {
      setTransactions(data || []);
      toast.success("Analytics data loaded");
    }
    setLoading(false);
  };

  /* ---------------- TIME FILTER ---------------- */
  const filteredTransactions = useMemo(() => {
    const now = new Date();

    return transactions.filter(t => {
      const d = new Date(t.date);
      if (range === "WEEK")
        return d >= new Date(now.getTime() - 7 * 86400000);
      if (range === "MONTH")
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (range === "QUARTER")
        return Math.floor(d.getMonth() / 3) === Math.floor(now.getMonth() / 3) && d.getFullYear() === now.getFullYear();
      if (range === "YEAR")
        return d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [transactions, range]);

  /* ---------------- CATEGORY ANALYSIS ---------------- */
  const categoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    
    filteredTransactions
      .filter(t => t.type === "DEBIT")
      .forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      });

    const total = Object.values(categoryMap).reduce((a, b) => a + b, 0);
    
    return Object.entries(categoryMap)
      .map(([name, value]) => ({
        name,
        value,
        percentage: Math.round((value / total) * 100),
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  /* ---------------- SPENDING TRENDS ---------------- */
  const spendingTrends = useMemo(() => {
    const dailySpending: Record<string, number> = {};
    
    filteredTransactions
      .filter(t => t.type === "DEBIT")
      .forEach(t => {
        const date = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailySpending[date] = (dailySpending[date] || 0) + t.amount;
      });

    return Object.entries(dailySpending)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-15); // Last 15 days
  }, [filteredTransactions]);

  /* ---------------- MONTHLY COMPARISON ---------------- */
  const monthlyComparison = useMemo(() => {
    const monthlyData: Record<string, number> = {};
    const now = new Date();
    const currentMonth = now.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    
    filteredTransactions
      .filter(t => t.type === "DEBIT")
      .forEach(t => {
        const date = new Date(t.date);
        const month = date.getMonth();
        if (month === currentMonth || month === lastMonth) {
          const key = month === currentMonth ? "Current Month" : "Last Month";
          monthlyData[key] = (monthlyData[key] || 0) + t.amount;
        }
      });

    return Object.entries(monthlyData).map(([month, amount]) => ({ month, amount }));
  }, [filteredTransactions]);

  /* ---------------- KEY METRICS ---------------- */
  const keyMetrics = useMemo(() => {
    const debits = filteredTransactions.filter(t => t.type === "DEBIT");
    const credits = filteredTransactions.filter(t => t.type === "CREDIT");
    
    const totalSpent = debits.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = credits.reduce((sum, t) => sum + t.amount, 0);
    const avgTransaction = debits.length > 0 ? totalSpent / debits.length : 0;
    
    // Find most spent category
    const categoryMap: Record<string, number> = {};
    debits.forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });
    
    const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0];
    
    // Calculate savings rate (simple approximation)
    const savingsRate = totalIncome > 0 ? Math.max(0, ((totalIncome - totalSpent) / totalIncome) * 100) : 0;
    
    return {
      totalSpent: Math.round(totalSpent),
      totalIncome: Math.round(totalIncome),
      avgTransaction: Math.round(avgTransaction),
      transactionCount: debits.length,
      topCategory: topCategory ? topCategory[0] : "None",
      savingsRate: Math.round(savingsRate),
    };
  }, [filteredTransactions]);

  /* ---------------- CATEGORY ICONS ---------------- */
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      'Food & Dining': <Coffee className="w-4 h-4" />,
      'Shopping': <ShoppingBag className="w-4 h-4" />,
      'Transport': <Car className="w-4 h-4" />,
      'Entertainment': <Users className="w-4 h-4" />,
      'Bills & Utilities': <Home className="w-4 h-4" />,
      'Healthcare': <AlertTriangle className="w-4 h-4" />,
      'Education': <Lightbulb className="w-4 h-4" />,
      'Investment': <TrendingUp className="w-4 h-4" />,
      'Salary': <Wallet className="w-4 h-4" />,
      'Other': <DollarSign className="w-4 h-4" />,
    };
    
    return icons[category] || <DollarSign className="w-4 h-4" />;
  };

  /* ---------------- SPENDING INSIGHTS ---------------- */
  const spendingInsights = useMemo(() => {
    const insights = [];
    const { totalSpent, avgTransaction, topCategory, savingsRate } = keyMetrics;
    
    if (totalSpent > 50000) {
      insights.push({
        icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
        title: "High Spending Alert",
        description: "Your spending this month is above average. Consider reviewing your budget.",
        type: "warning"
      });
    }
    
    if (savingsRate < 20) {
      insights.push({
        icon: <PiggyBank className="w-4 h-4 text-yellow-500" />,
        title: "Low Savings Rate",
        description: `You're saving only ${savingsRate}% of your income. Aim for 20-30% savings.`,
        type: "advice"
      });
    }
    
    if (topCategory === "Food & Dining" || topCategory === "Shopping") {
      insights.push({
        icon: <Target className="w-4 h-4 text-blue-500" />,
        title: "Top Spending Category",
        description: `${topCategory} is your largest expense. Look for ways to optimize.`,
        type: "info"
      });
    }
    
    if (avgTransaction > 5000) {
      insights.push({
        icon: <Zap className="w-4 h-4 text-purple-500" />,
        title: "Large Transactions Detected",
        description: "Your average transaction size is high. Consider breaking large purchases.",
        type: "info"
      });
    }
    
    // Add positive insights
    if (savingsRate >= 30) {
      insights.push({
        icon: <Sparkles className="w-4 h-4 text-green-500" />,
        title: "Excellent Savings Rate!",
        description: `You're saving ${savingsRate}% - that's fantastic! Keep it up.`,
        type: "positive"
      });
    }
    
    return insights;
  }, [keyMetrics]);

  /* ---------------- CHART COLORS ---------------- */
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
    '#82CA9D', '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0'
  ];

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />

        <main className="p-6 space-y-6">
          {/* HEADER */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">📊 Financial Analytics</h1>
              <p className="text-muted-foreground">
                Understand your spending patterns and optimize your budget
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? "Loading..." : "Refresh Data"}
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* TIME RANGE SELECTOR */}
          <Card>
            <CardContent className="pt-6">
              <Tabs value={range} onValueChange={v => setRange(v as Range)} className="w-full">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="WEEK">
                    <Clock className="w-4 h-4 mr-2" />
                    This Week
                  </TabsTrigger>
                  <TabsTrigger value="MONTH">
                    <Calendar className="w-4 h-4 mr-2" />
                    This Month
                  </TabsTrigger>
                  <TabsTrigger value="QUARTER">
                    <Filter className="w-4 h-4 mr-2" />
                    This Quarter
                  </TabsTrigger>
                  <TabsTrigger value="YEAR">
                    <Calendar className="w-4 h-4 mr-2" />
                    This Year
                  </TabsTrigger>
                  <TabsTrigger value="ALL">
                    <Sparkles className="w-4 h-4 mr-2" />
                    All Time
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {/* KEY METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Spent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{keyMetrics.totalSpent.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {keyMetrics.transactionCount} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Average Transaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{keyMetrics.avgTransaction.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per spending transaction
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {getCategoryIcon(keyMetrics.topCategory)}
                  {keyMetrics.topCategory}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your largest spending area
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Savings Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{keyMetrics.savingsRate}%</div>
                <div className="mt-2">
                  <Progress value={keyMetrics.savingsRate} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: 20-30%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* CHARTS GRID */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* SPENDING TREND CHART */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Daily Spending Trend
                </CardTitle>
                <CardDescription>
                  Your spending pattern over the last 15 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={spendingTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* CATEGORY BREAKDOWN */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Spending by Category
                </CardTitle>
                <CardDescription>
                  Where your money is going this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={(entry) => `${entry.name}: ${entry.percentage}%`}
                      >
                        {categoryData.slice(0, 5).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`₹${value}`, 'Spent']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {categoryData.slice(0, 6).map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">₹{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MONTHLY COMPARISON */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Monthly Comparison
              </CardTitle>
              <CardDescription>
                Compare your spending with last month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyComparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value}`, 'Total Spent']} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* SPENDING INSIGHTS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Smart Insights & Recommendations
              </CardTitle>
              <CardDescription>
                Personalized tips to improve your financial health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {spendingInsights.length > 0 ? (
                  spendingInsights.map((insight, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        insight.type === 'warning' ? 'border-red-200 bg-red-50' :
                        insight.type === 'positive' ? 'border-green-200 bg-green-50' :
                        'border-blue-200 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {insight.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-6 text-center">
                    <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Your finances look great!</h3>
                    <p className="text-muted-foreground">
                      No major issues detected. Keep maintaining your healthy spending habits.
                    </p>
                  </div>
                )}
              </div>
              
              {/* ACTIONABLE TIPS */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Actionable Tips
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <PiggyBank className="w-4 h-4 text-green-500" />
                      <span className="font-medium">Set Savings Goals</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Aim to save 20-30% of your income each month for long-term financial security.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Filter className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">Review Subscriptions</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Check recurring subscriptions monthly. Cancel any you don't actively use.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      <span className="font-medium">Track Categories</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Monitor your top spending categories weekly to stay within budget limits.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}