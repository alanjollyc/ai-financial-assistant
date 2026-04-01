import { useEffect, useState, useRef, useMemo } from "react";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Send, 
  User, 
  Bot, 
  Lightbulb, 
  Sparkles, 
  Brain, 
  Zap, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  PiggyBank,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  ThumbsUp,
  BarChart3,
  PieChart,
  Wallet,
  Shield,
  Rocket,
  Star,
  Crown,
  MessageSquare,
  Bot as BotIcon,
  Mic,
  MicOff,
  Download,
  Share2,
  Copy,
  MoreVertical,
  Search,
  Flame,
  Filter,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ---------------- TYPES ---------------- */
interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  analysis?: {
    confidence: number;
    dataPoints: string[];
    recommendation?: string;
    warning?: string;
  };
}

interface FinancialData {
  transactions: any[];
  goals: any[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  categoryBreakdown: Record<string, number>;
  savingStreak: number;
  anomalies: any[];
  financialHealth: number;
}

/* ---------------- ENHANCED TRAINING DATA ---------------- */
const FINANCIAL_PATTERNS = {
  // Affordability & Budgeting (20+ variations)
  affordability: [
    "can i afford", "should i buy", "is it safe to spend", "can i purchase",
    "buy worth", "spend on", "pay for", "affordable", "within budget",
    "financial capacity", "purchasing power", "budget limit", "safe to invest",
    "worth the money", "value for money", "price justified", "reasonable price",
    "overspending risk", "buy now or later", "wait for discount"
  ],
  
  // Spending Analysis (25+ variations)
  spending: [
    "how much spent", "where is my money", "spending habits", "expense pattern",
    "money going", "cost analysis", "expenditure", "financial leakage",
    "unnecessary expenses", "wasteful spending", "money drain", "cost breakdown",
    "daily spending", "weekly expenses", "monthly outflow", "annual expenditure",
    "compare spending", "spending vs income", "expense ratio", "burn rate",
    "cash outflow", "money tracking", "expense audit", "spending review"
  ],
  
  // Savings & Investments (20+ variations)
  savings: [
    "save money", "increase savings", "investment advice", "grow wealth",
    "financial growth", "wealth building", "money multiplication", "investment strategy",
    "savings plan", "retirement fund", "emergency fund", "future planning",
    "compound interest", "investment options", "risk management", "portfolio",
    "financial security", "passive income", "wealth preservation", "asset allocation"
  ],
  
  // Debt & Credit (15+ variations)
  debt: [
    "pay off debt", "credit card", "loan repayment", "emi management",
    "debt free", "interest rate", "borrowing cost", "debt consolidation",
    "credit score", "loan eligibility", "debt trap", "overdue payment",
    "financial burden", "debt reduction", "credit management"
  ],
  
  // Goals & Planning (20+ variations)
  goals: [
    "achieve goal", "target amount", "financial target", "milestone",
    "dream purchase", "future expense", "goal tracking", "progress check",
    "deadline", "timeline", "goal setting", "financial objective",
    "target date", "goal amount", "saving target", "investment goal",
    "retirement goal", "education fund", "house down payment", "vacation fund"
  ],
  
  // Analysis & Insights (25+ variations)
  insights: [
    "financial health", "money status", "economic situation", "fiscal position",
    "wealth status", "net worth", "asset liability", "financial standing",
    "performance review", "progress report", "monthly review", "quarterly analysis",
    "annual summary", "trend analysis", "pattern recognition", "anomaly detection",
    "risk assessment", "opportunity analysis", "strength weakness", "growth potential",
    "improvement areas", "success metrics", "kpi tracking", "benchmark comparison"
  ],
  
  // Forecasting & Prediction (15+ variations)
  forecast: [
    "future projection", "next month", "coming weeks", "quarter forecast",
    "annual projection", "growth prediction", "expense forecast", "income prediction",
    "savings estimate", "retirement projection", "wealth forecast", "market trend",
    "economic outlook", "financial future", "what if scenario"
  ],
  
  // Advice & Recommendations (20+ variations)
  advice: [
    "what should i do", "best approach", "optimal strategy", "smart move",
    "financial tip", "money hack", "wealth tip", "savings trick",
    "investment tip", "budgeting advice", "spending tip", "debt advice",
    "retirement planning", "tax saving", "financial planning", "wealth management",
    "money management", "cash flow", "liquidity management", "risk assessment"
  ],
  
  // Comparisons & Benchmarks (10+ variations)
  compare: [
    "compare with", "versus", "better than", "worse than",
    "above average", "below average", "industry standard", "peer comparison",
    "previous month", "last year", "year over year"
  ],
  
  // Emergency & Risk (10+ variations)
  emergency: [
    "emergency fund", "backup plan", "financial safety", "risk coverage",
    "insurance", "contingency", "crisis management", "unexpected expense",
    "financial shock", "income loss"
  ]
};

const RESPONSE_TEMPLATES = {
  // Rich response templates with dynamic data
  affordability: (data: FinancialData, amount?: number) => {
    const safeThreshold = data.monthlyIncome * 0.3;
    const remaining = data.monthlyIncome - data.monthlyExpense;
    
    if (amount) {
      if (amount <= remaining) {
        return `✅ **Yes, you can afford ₹${amount.toLocaleString()}!**\n\n📊 **Analysis:**\n• Monthly Remaining Balance: ₹${remaining.toLocaleString()}\n• Safe Spending Limit: ₹${safeThreshold.toLocaleString()}\n• After Purchase Balance: ₹${(remaining - amount).toLocaleString()}\n\n💡 **Recommendation:** This purchase is within your safe spending limit. Go ahead!`;
      } else {
        return `⚠️ **Think twice about ₹${amount.toLocaleString()}**\n\n📊 **Analysis:**\n• Monthly Remaining Balance: ₹${remaining.toLocaleString()}\n• Purchase Amount: ₹${amount.toLocaleString()}\n• Deficit if purchased: ₹${(amount - remaining).toLocaleString()}\n\n🚨 **Warning:** This exceeds your available funds. Consider:\n1. Waiting until next month\n2. Reducing other expenses\n3. Saving specifically for this`;
      }
    }
    
    return `📊 **Affordability Analysis:**\n• Safe Monthly Spending: ₹${safeThreshold.toLocaleString()}\n• Remaining this month: ₹${remaining.toLocaleString()}\n• Top 3 Expenses to review: ${Object.entries(data.categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amt]) => `${cat} (₹${amt.toLocaleString()})`)
      .join(", ")}`;
  },
  
  spending: (data: FinancialData) => {
    const topCategories = Object.entries(data.categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    return `💰 **Spending Analysis Report**\n\n📈 **Top Spending Categories:**\n${topCategories.map(([cat, amt], idx) => 
      `${idx + 1}. **${cat}**: ₹${amt.toLocaleString()} (${((amt / data.totalExpense) * 100).toFixed(1)}%)`
    ).join('\n')}\n\n📊 **Monthly Breakdown:**\n• Income: ₹${data.monthlyIncome.toLocaleString()}\n• Expense: ₹${data.monthlyExpense.toLocaleString()}\n• Savings Rate: ${((data.monthlyIncome - data.monthlyExpense) / data.monthlyIncome * 100).toFixed(1)}%\n\n🎯 **Insights:**\n${topCategories[0][1] > data.monthlyIncome * 0.3 ? 
      `• ⚠️ **${topCategories[0][0]}** exceeds 30% of income - consider reducing` : 
      '• ✅ Spending distribution looks balanced'}`;
  },
  
  savings: (data: FinancialData) => {
    const savingsRate = ((data.monthlyIncome - data.monthlyExpense) / data.monthlyIncome) * 100;
    const monthlySavings = data.monthlyIncome - data.monthlyExpense;
    
    return `🏦 **Savings & Investment Strategy**\n\n📊 **Current Status:**\n• Monthly Savings: ₹${monthlySavings.toLocaleString()}\n• Savings Rate: ${savingsRate.toFixed(1)}%\n• Saving Streak: ${data.savingStreak} days 🔥\n\n💡 **Recommendations:**\n${savingsRate >= 20 ? 
      '1. ✅ Excellent savings rate! Consider investing 50% of surplus' :
      '1. 🎯 Aim for 20% savings rate. Reduce discretionary spending'}\n2. 📈 Start SIP with ₹${Math.max(1000, monthlySavings * 0.3).toLocaleString()} monthly\n3. 🏦 Build emergency fund of 6 months expenses (₹${(data.monthlyExpense * 6).toLocaleString()})\n4. 📊 Review high-expense categories for optimization\n\n🚀 **Projection:**\nSaving ₹${monthlySavings.toLocaleString()}/month at 8% returns = ₹${(monthlySavings * 12 * 10 * 1.08).toLocaleString()} in 10 years`;
  },
  
  goals: (data: FinancialData) => {
    if (!data.goals || data.goals.length === 0) {
      return `🎯 **Goal Planning Guide**\n\nYou haven't set any financial goals yet. Here's how to start:\n\n1. **Short-term (1-12 months):**\n   • Emergency fund: ₹${(data.monthlyExpense * 3).toLocaleString()}\n   • Vacation fund\n   • Gadget upgrade\n\n2. **Medium-term (1-5 years):**\n   • Down payment for vehicle\n   • Higher education fund\n   • Home renovation\n\n3. **Long-term (5+ years):**\n   • Retirement corpus\n   • Children's education\n   • Dream home\n\n💡 **Smart Goal Formula:**\nSpecific + Measurable + Achievable + Relevant + Time-bound\n\nClick "Add Goal" to get started!`;
    }
    
    const goalsSummary = data.goals.map((goal, idx) => 
      `**${goal.name || `Goal ${idx + 1}`}:**\n   Target: ₹${goal.target.toLocaleString()}\n   Current: ₹${goal.current.toLocaleString()}\n   Progress: ${((goal.current / goal.target) * 100).toFixed(1)}%\n   Timeline: ${goal.deadline || 'No deadline'}\n`
    ).join('\n');
    
    return `🎯 **Goals Progress Report**\n\n${goalsSummary}\n\n📈 **Overall Progress:** ${((data.goals.reduce((sum, g) => sum + g.current, 0) / data.goals.reduce((sum, g) => sum + g.target, 0)) * 100).toFixed(1)}%\n\n💪 **Action Plan:**\n1. Focus on closest deadline\n2. Increase monthly contribution for lagging goals\n3. Celebrate small milestones\n4. Adjust goals as needed`;
  },
  
  forecast: (data: FinancialData) => {
    const growthRate = data.monthlyExpense > 0 ? ((data.monthlyExpense - (data.totalExpense / 12)) / (data.totalExpense / 12)) * 100 : 0;
    const projection = data.monthlyExpense * (1 + growthRate/100);
    
    return `🔮 **Financial Forecast**\n\n📊 **Current Trend:**\n• Monthly Growth Rate: ${growthRate.toFixed(1)}%\n• Last Month: ₹${data.monthlyExpense.toLocaleString()}\n\n📈 **Next 3 Months Projection:**\n1. **Month 1:** ₹${projection.toLocaleString()}\n2. **Month 2:** ₹${(projection * (1 + growthRate/100)).toLocaleString()}\n3. **Month 3:** ₹${(projection * Math.pow(1 + growthRate/100, 2)).toLocaleString()}\n\n💰 **Year-End Projection:**\n• Total Expense: ₹${(data.monthlyExpense * 12 * (1 + growthRate/100)).toLocaleString()}\n• Potential Savings: ₹${((data.monthlyIncome - projection) * 12).toLocaleString()}\n\n🎯 **Recommendation:**\n${growthRate > 10 ? 
      '⚠️ **High growth rate detected!** Consider expense optimization' :
      '✅ **Stable spending pattern.** Focus on increasing income'}`;
  },
  
  insights: (data: FinancialData) => {
    return `🧠 **AI Financial Insights**\n\n🏆 **Achievements:**\n• Financial Health Score: ${data.financialHealth}/100 ${data.financialHealth >= 80 ? '🌟' : data.financialHealth >= 60 ? '👍' : '💪'}\n• Saving Streak: ${data.savingStreak} days ${data.savingStreak >= 7 ? '🔥' : ''}\n• Anomalies Detected: ${data.anomalies.length}\n\n📊 **Key Metrics:**\n• Net Worth: ₹${data.balance.toLocaleString()}\n• Monthly Cashflow: ₹${(data.monthlyIncome - data.monthlyExpense).toLocaleString()}\n• Expense to Income Ratio: ${((data.monthlyExpense / data.monthlyIncome) * 100).toFixed(1)}%\n\n🎯 **Top Recommendations:**\n1. ${data.monthlyExpense > data.monthlyIncome * 0.7 ? 'Reduce expenses by 15%' : 'Maintain current spending level'}\n2. ${data.savingStreak < 7 ? 'Build consistent saving habit' : 'Increase savings amount'}\n3. ${data.anomalies.length > 0 ? 'Review unusual transactions' : 'No unusual activity detected'}\n\n🚀 **Next Level:**\nAim for financial health score of 90+ by optimizing savings rate and diversifying income`;
  }
};

/* ---------------- COMPONENT ---------------- */
export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "🌟 **Welcome to your AI Financial Advisor!**\n\nI'm equipped with advanced analysis of your financial data and ready to provide intelligent insights. I can help you with:\n\n• 💰 **Affordability checks** & budget analysis\n• 📊 **Spending patterns** & expense optimization\n• 🏦 **Savings strategies** & investment planning\n• 🎯 **Goal tracking** & progress monitoring\n• 🔮 **Financial forecasts** & future planning\n• 🧠 **Personalized advice** based on your data\n\nAsk me anything about your finances! I'll analyze your transactions, goals, and patterns to give you actionable insights.",
      timestamp: new Date(),
      analysis: {
        confidence: 95,
        dataPoints: ["Welcome message", "Capability overview"],
        recommendation: "Start by asking about your spending patterns or savings goals"
      }
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);

  /* ---------------- FETCH FINANCIAL DATA ---------------- */
  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch transactions
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id);

      // Fetch goals
      const { data: goals } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id);

      // Calculate metrics
      const totalIncome = transactions?.filter(t => t.type === "CREDIT")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const totalExpense = transactions?.filter(t => t.type === "DEBIT")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const balance = totalIncome - totalExpense;

      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyIncome = transactions?.filter(t => 
        t.type === "CREDIT" && 
        new Date(t.date).getMonth() === currentMonth &&
        new Date(t.date).getFullYear() === currentYear
      ).reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const monthlyExpense = transactions?.filter(t => 
        t.type === "DEBIT" && 
        new Date(t.date).getMonth() === currentMonth &&
        new Date(t.date).getFullYear() === currentYear
      ).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Category breakdown
      const categoryBreakdown: Record<string, number> = {};
      transactions?.filter(t => t.type === "DEBIT").forEach(t => {
        const cat = t.category || "Other";
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + Number(t.amount);
      });

      // Calculate saving streak
      const savingStreak = calculateSavingStreak(transactions || []);

      // Detect anomalies
      const anomalies = detectAnomalies(transactions || []);

      // Financial health score
      const financialHealth = calculateFinancialHealth({
        balance,
        monthlyIncome,
        monthlyExpense,
        totalExpense,
        savingStreak,
        goals: goals || []
      });

      const data: FinancialData = {
        transactions: transactions || [],
        goals: goals || [],
        totalIncome,
        totalExpense,
        balance,
        monthlyIncome,
        monthlyExpense,
        categoryBreakdown,
        savingStreak,
        anomalies,
        financialHealth
      };

      setFinancialData(data);
      
      // Generate personalized suggestions
      generateSuggestions(data);

    } catch (error) {
      console.error("Error fetching financial data:", error);
      toast.error("Failed to load financial data");
    } finally {
      setLoading(false);
    }
  };

  const calculateSavingStreak = (transactions: any[]): number => {
    let streak = 0;
    const now = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTxns = transactions.filter(t => t.date === dateStr);
      const dayBalance = dayTxns.reduce((sum, t) => 
        t.type === 'CREDIT' ? sum + t.amount : sum - t.amount, 0
      );
      
      if (dayBalance > 0) streak++;
      else break;
    }
    return streak;
  };

  const detectAnomalies = (transactions: any[]): any[] => {
    const categoryAverages: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    
    transactions.forEach(t => {
      if (t.type === 'DEBIT' && t.category) {
        categoryAverages[t.category] = (categoryAverages[t.category] || 0) + t.amount;
        categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
      }
    });
    
    Object.keys(categoryAverages).forEach(cat => {
      if (categoryCounts[cat] > 0) {
        categoryAverages[cat] = categoryAverages[cat] / categoryCounts[cat];
      }
    });
    
    return transactions.filter(t => 
      t.type === 'DEBIT' && 
      t.category && 
      categoryAverages[t.category] && 
      t.amount > categoryAverages[t.category] * 2
    ).slice(0, 5);
  };

  const calculateFinancialHealth = (data: any): number => {
    let score = 100;
    
    // Emergency fund (3-6 months expense)
    const emergencyFundRatio = data.balance / (data.monthlyExpense * 3);
    score += Math.min(emergencyFundRatio * 10, 20);
    
    // Debt to income ratio
    const debtRatio = data.monthlyExpense / (data.monthlyIncome || 1);
    score -= debtRatio * 20;
    
    // Savings rate
    const savingsRate = (data.monthlyIncome - data.monthlyExpense) / (data.monthlyIncome || 1);
    score += savingsRate * 30;
    
    // Spending diversity
    const categories = Object.keys(data.categoryBreakdown || {});
    score += Math.min(categories.length * 2, 10);
    
    // Goal progress
    const avgGoalProgress = data.goals.length > 0 
      ? data.goals.reduce((sum: number, g: any) => sum + (g.current / g.target), 0) / data.goals.length * 20
      : 10;
    score += avgGoalProgress;
    
    // Saving streak bonus
    score += Math.min(data.savingStreak, 10);
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const generateSuggestions = (data: FinancialData) => {
    const newSuggestions = [];
    
    // Personalized suggestions based on data
    if (data.monthlyExpense > data.monthlyIncome * 0.7) {
      newSuggestions.push("How can I reduce expenses by 15% this month?");
    }
    
    if (data.balance < 10000) {
      newSuggestions.push("What's the fastest way to reach ₹10,000 savings?");
    }
    
    if (data.savingStreak < 7) {
      newSuggestions.push("How to build a daily saving habit?");
    }
    
    if (data.anomalies.length > 0) {
      newSuggestions.push("Review unusual transactions from last month");
    }
    
    if (data.goals.length === 0) {
      newSuggestions.push("How to set my first financial goal?");
    }
    
    // Add category-specific suggestions
    const topCategory = Object.entries(data.categoryBreakdown)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (topCategory) {
      newSuggestions.push(`How much did I spend on ${topCategory[0]}?`);
    }
    
    // Add generic smart suggestions
    const genericSuggestions = [
      "Can I afford ₹10,000 this month?",
      "What's my financial health score?",
      "5-year savings projection",
      "Best way to save for a vacation",
      "Monthly expense breakdown",
      "Investment options for beginners",
      "Emergency fund recommendations",
      "Budgeting strategies that work"
    ];
    
    setSuggestions([...newSuggestions, ...genericSuggestions.slice(0, 8 - newSuggestions.length)]);
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /* ---------------- ENHANCED INTENT DETECTION ---------------- */
  const detectIntent = (question: string): string => {
    const q = question.toLowerCase().trim();
    
    // Enhanced pattern matching with better coverage
    if (q.match(/afford|buy|purchase|spend.*\d+|worth.*buying|should.*buy|can.*afford/)) {
      return "affordability";
    }
    
    if (q.match(/spend|expense|where.*money|how much.*spent|spending|expenditure|money.*going|reduce.*expense|cut.*cost|lower.*spending/)) {
      return "spending";
    }
    
    if (q.match(/save|saving|investment|invest|wealth|grow.*money|compound|emergency.*fund|habit/)) {
      return "savings";
    }
    
    if (q.match(/goal|target|dream|achieve|milestone|deadline|progress/)) {
      return "goals";
    }
    
    if (q.match(/forecast|project|future|next.*month|coming.*year|5.*year|10.*year|projection/)) {
      return "forecast";
    }
    
    if (q.match(/health.*score|insight|analy|report|summary|overview|status/)) {
      return "insights";
    }
    
    if (q.match(/travel|food|shopping|entertainment|rent|utilit|category/)) {
      return "spending"; // Category-specific questions
    }
    
    if (q.match(/hello|hi|hey|greeting/)) {
      return "greeting";
    }
    
    if (q.match(/thank|thanks|appreciate/)) {
      return "thanks";
    }
    
    if (q.match(/help|assist|what.*can.*do|capabilit/)) {
      return "help";
    }
    
    return "general";
  };

  const extractAmount = (question: string): number | null => {
    const match = question.match(/₹?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:lakh|lac|thousand|k|cr|crore)?/i);
    if (!match) return null;
    
    let amount = parseFloat(match[1].replace(/,/g, ''));
    
    // Handle Indian number system
    if (question.toLowerCase().includes('lakh') || question.toLowerCase().includes('lac')) {
      amount *= 100000;
    } else if (question.toLowerCase().includes('thousand') || question.toLowerCase().includes('k')) {
      amount *= 1000;
    } else if (question.toLowerCase().includes('cr') || question.toLowerCase().includes('crore')) {
      amount *= 10000000;
    }
    
    return amount;
  };

  /* ---------------- NEW HELPER FUNCTIONS ---------------- */
  const generateExpenseReductionResponse = (data: FinancialData): string => {
    const topCategories = Object.entries(data.categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    const monthlyTotal = data.monthlyExpense;
    const reductionPotential = Math.round(monthlyTotal * 0.15); // 15% reduction
    
    return `💰 **Expense Reduction Strategy**\n\n**Current Monthly Expense:** ₹${monthlyTotal.toLocaleString()}\n\n**Top 3 Areas to Reduce:**\n${topCategories.map(([cat, amt], idx) => 
      `${idx + 1}. **${cat}**: ₹${amt.toLocaleString()} (${((amt / monthlyTotal) * 100).toFixed(1)}%)\n   *Potential Savings:* ₹${Math.round(amt * 0.15).toLocaleString()} by reducing 15%`
    ).join('\n')}\n\n**Total Potential Monthly Savings:** ₹${reductionPotential.toLocaleString()}\n\n**Action Plan:**\n1. Review ${topCategories[0][0]} expenses for unnecessary subscriptions\n2. Create a budget for ${topCategories[1][0]} spending\n3. Track ${topCategories[2][0]} expenses daily for a week\n\n**Projected Annual Savings:** ₹${(reductionPotential * 12).toLocaleString()} 🎯`;
  };

  const generateSavingHabitResponse = (data: FinancialData): string => {
    const currentSaving = data.monthlyIncome - data.monthlyExpense;
    const targetSaving = data.monthlyIncome * 0.2; // 20% target
    
    return `💰 **Building Consistent Saving Habits**\n\n**Current Status:**\n• Monthly Income: ₹${data.monthlyIncome.toLocaleString()}\n• Monthly Expense: ₹${data.monthlyExpense.toLocaleString()}\n• Current Savings: ₹${currentSaving.toLocaleString()}\n• Target Savings (20%): ₹${targetSaving.toLocaleString()}\n\n**Your Saving Streak:** ${data.savingStreak} days ${data.savingStreak >= 30 ? '🏆' : data.savingStreak >= 7 ? '🔥' : '💪'}\n\n**7-Step Habit Building Plan:**\n1. **Automate First:** Set up auto-transfer of ₹${Math.max(1000, targetSaving).toLocaleString()} on payday\n2. **Start Small:** Begin with 5% of income, increase by 1% each month\n3. **Round-Up Savings:** Save the change from every transaction\n4. **Weekly Check-ins:** Review progress every Sunday\n5. **Visual Tracking:** Use goal trackers in your dashboard\n6. **Celebrate Milestones:** Reward yourself at ₹10K, ₹50K, ₹1L saved\n7. **Accountability:** Share goals with a trusted friend\n\n**30-Day Challenge:** Save ₹${Math.max(500, targetSaving/4).toLocaleString()} this month and increase by 10% next month!`;
  };

  const generateFiveYearProjection = (data: FinancialData): string => {
    const monthlySavings = data.monthlyIncome - data.monthlyExpense;
    const annualSavings = monthlySavings * 12;
    const annualReturnRate = 0.08; // 8% annual return
    
    // Compound interest calculation
    let futureValue = 0;
    for (let year = 1; year <= 5; year++) {
      futureValue = (futureValue + annualSavings) * (1 + annualReturnRate);
    }
    
    const totalInvested = annualSavings * 5;
    const totalReturns = futureValue - totalInvested;
    
    return `🔮 **5-Year Financial Projection**\n\n**Current Monthly Savings:** ₹${monthlySavings.toLocaleString()}\n**Annual Savings Rate:** ₹${annualSavings.toLocaleString()}\n\n**Projection at 8% Annual Returns:**\n\n**Year 1:** ₹${(annualSavings * 1.08).toLocaleString()}\n**Year 2:** ₹${(annualSavings * (1 + 1.08 + 1.08*1.08)).toLocaleString()}\n**Year 3:** ₹${(annualSavings * (1 + 1.08 + 1.08*1.08 + Math.pow(1.08, 3))).toLocaleString()}\n**Year 4:** ₹${(annualSavings * (1 + 1.08 + 1.08*1.08 + Math.pow(1.08, 3) + Math.pow(1.08, 4))).toLocaleString()}\n**Year 5:** ₹${futureValue.toLocaleString()}\n\n**Totals after 5 years:**\n• Total Amount Invested: ₹${totalInvested.toLocaleString()}\n• Total Returns Earned: ₹${totalReturns.toLocaleString()}\n• Final Corpus: ₹${futureValue.toLocaleString()}\n\n**Key Assumptions:**\n• Consistent monthly savings\n• 8% average annual returns\n• No major financial emergencies\n\n💡 **To accelerate:** Increase savings by 10% annually for ₹${(futureValue * 1.1).toLocaleString()} corpus`;
  };

  const generateSmartGeneralResponse = (question: string, data: FinancialData): string => {
    const q = question.toLowerCase();
    
    // Try to extract category from question
    const categories = Object.keys(data.categoryBreakdown);
    const mentionedCategory = categories.find(cat => 
      q.includes(cat.toLowerCase())
    );
    
    if (mentionedCategory) {
      const amount = data.categoryBreakdown[mentionedCategory];
      const percentage = data.totalExpense > 0 ? ((amount / data.totalExpense) * 100).toFixed(1) : '0';
      return `📊 **${mentionedCategory} Spending Analysis**\n\n**Total Spent on ${mentionedCategory}:** ₹${amount.toLocaleString()}\n**Percentage of Total Expenses:** ${percentage}%\n**Monthly Average:** ₹${(amount / 12).toLocaleString()}\n\n**Comparison:**\n• This is ${parseFloat(percentage) > 15 ? 'above' : 'below'} the recommended 15% limit for discretionary categories\n• ${parseFloat(percentage) > 20 ? 'Consider reducing this category to save more' : 'Good job keeping this category under control'}`;
    }
    
    // Check if it's a how-to question
    if (q.startsWith("how ") || q.startsWith("what ") || q.startsWith("where ")) {
      return `🤔 **I can help you analyze that!**\n\nBased on your current financial data:\n• **Total Balance:** ₹${data.balance.toLocaleString()}\n• **Monthly Cashflow:** ₹${(data.monthlyIncome - data.monthlyExpense).toLocaleString()}\n• **Financial Health Score:** ${data.financialHealth}/100\n\n**Try asking more specifically about:**\n1. "Can I afford [amount] this month?"\n2. "What's my spending on [category]?"\n3. "How to save for [goal]?"\n4. "Projection for next [time period]"\n\nI'll provide detailed, data-driven insights for specific questions!`;
    }
    
    return `📈 **Financial Overview**\n\nI've analyzed your finances and here's your current standing:\n\n**💰 Balance:** ₹${data.balance.toLocaleString()}\n**📊 Monthly Cashflow:** ₹${(data.monthlyIncome - data.monthlyExpense).toLocaleString()}\n**🏆 Financial Health:** ${data.financialHealth}/100 ${data.financialHealth >= 80 ? '🌟' : data.financialHealth >= 60 ? '👍' : '💪'}\n**🔥 Saving Streak:** ${data.savingStreak} days\n**🎯 Active Goals:** ${data.goals.length}\n\n**Top Spending Categories:**\n${Object.entries(data.categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([cat, amt]) => `• ${cat}: ₹${amt.toLocaleString()}`)
      .join('\n')}\n\n**Ask me about:**\n• Affordability of purchases\n• Spending patterns\n• Savings strategies\n• Goal progress\n• Future projections`;
  };

  /* ---------------- ENHANCED RESPONSE GENERATION ---------------- */
  const generateEnhancedResponse = async (question: string): Promise<Message> => {
    if (!financialData) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        content: "📊 **Loading Financial Data...**\n\nI'm analyzing your transactions and financial patterns. Please wait a moment while I gather all the insights!",
        timestamp: new Date(),
        analysis: {
          confidence: 80,
          dataPoints: ["Data loading in progress"],
          recommendation: "Try again in a few seconds"
        }
      };
    }

    const intent = detectIntent(question);
    const amount = extractAmount(question);
    let content = "";
    let confidence = 85;
    const dataPoints: string[] = [];
    
    // Generate response based on intent
    switch (intent) {
      case "affordability":
        content = RESPONSE_TEMPLATES.affordability(financialData, amount || undefined);
        confidence = amount ? 92 : 88;
        dataPoints.push("Monthly income analysis", "Expense pattern", "Remaining balance calculation");
        break;
        
      case "spending":
        // Check for specific category queries
        const q = question.toLowerCase();
        if (q.includes("travel")) {
          const travelAmount = financialData.categoryBreakdown["Travel"] || 0;
          const totalExpense = financialData.totalExpense;
          content = `✈️ **Travel Spending Analysis**\n\n**Total Travel Expenses:** ₹${travelAmount.toLocaleString()}\n**Percentage of Total Spending:** ${totalExpense > 0 ? ((travelAmount / totalExpense) * 100).toFixed(1) : 0}%\n**Monthly Average:** ₹${(travelAmount / 12).toLocaleString()}\n\n💡 **Recommendation:** ${travelAmount > financialData.monthlyIncome * 0.1 ? "Consider reducing travel expenses as they exceed 10% of income" : "Your travel spending is within healthy limits"}`;
        } else if (q.includes("reduce") || q.includes("cut") || q.includes("lower")) {
          content = generateExpenseReductionResponse(financialData);
        } else if (q.includes("top") || q.includes("biggest") || q.includes("largest") || q.includes("category")) {
          content = RESPONSE_TEMPLATES.spending(financialData);
        } else {
          content = RESPONSE_TEMPLATES.spending(financialData);
        }
        confidence = 90;
        dataPoints.push("Category breakdown", "Monthly comparison", "Expense distribution");
        break;
        
      case "savings":
        if (question.toLowerCase().includes("habit")) {
          content = generateSavingHabitResponse(financialData);
        } else {
          content = RESPONSE_TEMPLATES.savings(financialData);
        }
        confidence = 87;
        dataPoints.push("Savings rate analysis", "Investment potential", "Compound growth projection");
        break;
        
      case "goals":
        content = RESPONSE_TEMPLATES.goals(financialData);
        confidence = financialData.goals.length > 0 ? 89 : 85;
        dataPoints.push("Goal progress tracking", "Timeline analysis", "Contribution planning");
        break;
        
      case "forecast":
        if (question.toLowerCase().includes("5 year") || question.toLowerCase().includes("5 years")) {
          content = generateFiveYearProjection(financialData);
        } else {
          content = RESPONSE_TEMPLATES.forecast(financialData);
        }
        confidence = 83;
        dataPoints.push("Trend analysis", "Growth projection", "Scenario planning");
        break;
        
      case "insights":
        content = RESPONSE_TEMPLATES.insights(financialData);
        confidence = 91;
        dataPoints.push("Health score calculation", "Achievement tracking", "Performance metrics");
        break;
        
      case "greeting":
        content = `👋 **Hello! Welcome back!**\n\nI've analyzed ₹${financialData.totalExpense.toLocaleString()} across ${financialData.transactions.length} transactions.\n\n**Quick Snapshot:**\n• Current Balance: ₹${financialData.balance.toLocaleString()}\n• Financial Health Score: ${financialData.financialHealth}/100\n• Saving Streak: ${financialData.savingStreak} days ${financialData.savingStreak >= 7 ? '🔥' : ''}\n\nWhat would you like to know about your finances today?`;
        confidence = 95;
        break;
        
      case "thanks":
        content = `🙏 **You're welcome!**\n\nI'm glad I could help with your financial questions. Remember, consistent tracking leads to better financial outcomes!\n\n**Pro Tip:** Check in with me every week to stay on top of your spending habits.`;
        confidence = 95;
        break;
        
      case "help":
        content = `🆘 **How I Can Help You:**\n\n**💰 Budget & Spending**\n• "Can I afford a ₹10,000 purchase?"\n• "Where is my money going?"\n• "How can I reduce my travel expenses?"\n• "What's my biggest spending category?"\n\n**🏦 Savings & Investments**\n• "How do I build a saving habit?"\n• "What's my projected savings in 5 years?"\n• "How much should I invest monthly?"\n• "Emergency fund recommendations"\n\n**🎯 Goals & Planning**\n• "Am I on track for my goals?"\n• "How to save for a vacation?"\n• "Retirement planning advice"\n• "Goal setting strategies"\n\n**📊 Analysis & Insights**\n• "What's my financial health score?"\n• "Monthly spending report"\n• "Expense pattern analysis"\n• "Future projections"\n\nTry asking any of these questions!`;
        confidence = 95;
        break;
        
      default:
        // Enhanced general response
        content = generateSmartGeneralResponse(question, financialData);
        confidence = 75;
        dataPoints.push("General financial guidance", "Best practices", "Educational content");
    }
    
    // Add disclaimer for low confidence
    if (confidence < 80) {
      content += `\n\n*Note: For personalized investment advice, please consult with a certified financial advisor.*`;
    }
    
    // Clean HTML tags
    content = content.replace(/<[^>]*>/g, '');
    
    return {
      id: Date.now().toString(),
      role: "assistant",
      content,
      timestamp: new Date(),
      analysis: {
        confidence,
        dataPoints,
        recommendation: generateRecommendation(intent, financialData),
        warning: confidence < 70 ? "Low confidence response based on limited data patterns" : undefined
      }
    };
  };

  const generateRecommendation = (intent: string, data: FinancialData): string => {
    switch (intent) {
      case "affordability":
        return "Review discretionary spending for 15% savings potential";
      case "spending":
        return "Set category-wise budgets using 50/30/20 rule";
      case "savings":
        return "Automate ₹5000 monthly investment for long-term growth";
      case "goals":
        return "Break large goals into weekly/monthly milestones";
      case "forecast":
        return "Create contingency fund for unexpected expenses";
      default:
        return "Regular expense tracking leads to 23% better financial outcomes";
    }
  };

  /* ---------------- MESSAGE HANDLING ---------------- */
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const response = await generateEnhancedResponse(text);
    setMessages(prev => [...prev, response]);
    setIsTyping(false);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "refresh":
        fetchFinancialData();
        toast.success("Financial data refreshed!");
        break;
      case "export":
        exportChatHistory();
        break;
      case "clear":
        setMessages([messages[0]]);
        toast.success("Chat history cleared");
        break;
    }
  };

  const exportChatHistory = () => {
    const chatText = messages.map(msg => 
      `${msg.role.toUpperCase()} (${msg.timestamp.toLocaleTimeString()}):\n${msg.content}\n${'-'.repeat(50)}`
    ).join('\n\n');
    
    const blob = new Blob([chatText], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial_chat_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    
    toast.success("Chat history exported!");
  };

  const copyLastResponse = () => {
    const lastAssistantMsg = messages.filter(m => m.role === "assistant").pop();
    if (lastAssistantMsg) {
      navigator.clipboard.writeText(lastAssistantMsg.content);
      toast.success("Response copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-gray-50 to-background dark:via-gray-900/20">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />

        <main className="p-6 h-[calc(100vh-80px)] flex flex-col gap-4">
          {/* HEADER */}
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                  <Brain className="w-7 h-7 text-purple-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">AI Financial Advisor</h1>
                  <p className="text-sm text-muted-foreground">
                    {loading ? "Analyzing your financial data..." : `Analyzing ₹${financialData?.totalExpense.toLocaleString()} across ${financialData?.transactions.length} transactions`}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickAction("refresh")}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickAction("export")}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Chat
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleQuickAction("clear")}
              >
                <X className="w-4 h-4 mr-2" />
                Clear Chat
              </Button>
            </div>
          </div>

          {/* FINANCIAL SNAPSHOT */}
          {financialData && (
            <div className="grid grid-cols-4 gap-3">
              <div className="glass-card p-3 border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm">Balance</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {financialData.balance >= 0 ? "Positive" : "Negative"}
                  </Badge>
                </div>
                <p className="text-lg font-bold mt-1">₹{financialData.balance.toLocaleString()}</p>
              </div>
              
              <div className="glass-card p-3 border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Health Score</span>
                  </div>
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={financialData.financialHealth} className="h-2 flex-1" />
                  <span className="text-lg font-bold">{financialData.financialHealth}/100</span>
                </div>
              </div>
              
              <div className="glass-card p-3 border border-orange-500/20">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">Saving Streak</span>
                </div>
                <p className="text-lg font-bold mt-1">{financialData.savingStreak} days</p>
              </div>
              
              <div className="glass-card p-3 border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Goals</span>
                </div>
                <p className="text-lg font-bold mt-1">{financialData.goals.length} active</p>
              </div>
            </div>
          )}

          {/* MAIN CHAT INTERFACE */}
          <div className="flex-1 grid grid-cols-4 gap-6">
            {/* CHAT MESSAGES */}
            <div className="col-span-3 flex flex-col">
              <div className="glass-card flex-1 flex flex-col border border-primary/10">
                {/* MESSAGES CONTAINER */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                      {/* AVATAR */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.role === "user" 
                          ? "bg-gradient-to-r from-primary to-blue-600" 
                          : "bg-gradient-to-r from-purple-500 to-pink-500"
                      }`}>
                        {msg.role === "user" ? (
                          <User className="w-5 h-5 text-white" />
                        ) : (
                          <Bot className="w-5 h-5 text-white" />
                        )}
                      </div>

                      {/* MESSAGE BUBBLE */}
                      <div className={`max-w-[80%] rounded-2xl p-4 ${
                        msg.role === "user" 
                          ? "bg-gradient-to-r from-primary to-blue-600 text-white" 
                          : "bg-secondary border border-purple-500/20"
                      }`}>
                        {/* TIMESTAMP */}
                        <div className="text-xs opacity-70 mb-2">
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        
                        {/* CONTENT */}
                        <div className="whitespace-pre-line">
                          {msg.content.split('\n').map((line, idx) => (
                            <p key={idx} className="mb-2 last:mb-0">
                              {line}
                            </p>
                          ))}
                        </div>
                        
                        {/* ANALYSIS INFO FOR ASSISTANT */}
                        {msg.role === "assistant" && msg.analysis && (
                          <div className="mt-3 pt-3 border-t border-white/20">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="opacity-70">Confidence:</span>
                                <Badge variant="outline" className={
                                  msg.analysis.confidence >= 90 ? "bg-green-500/20 text-green-600" :
                                  msg.analysis.confidence >= 80 ? "bg-yellow-500/20 text-yellow-600" :
                                  "bg-orange-500/20 text-orange-600"
                                }>
                                  {msg.analysis.confidence}%
                                </Badge>
                              </div>
                              {msg.analysis.warning && (
                                <AlertCircle className="w-3 h-3 text-orange-500" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-purple-500" />
                      </div>
                      <div className="bg-secondary rounded-2xl p-4">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Analyzing your finances...
                        </p>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* SUGGESTED QUESTIONS */}
                <div className="p-4 border-t border-primary/10">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Lightbulb className="w-4 h-4" />
                    <span>Try asking...</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((q, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => sendMessage(q)}
                        className="text-xs h-auto py-2 px-3 rounded-full hover:bg-primary/10 transition-all"
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* INPUT FORM */}
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    sendMessage(input);
                  }}
                  className="p-4 border-t border-primary/10"
                >
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask anything about your finances... (e.g., 'Can I afford ₹5000 this month?')"
                        className="pr-24"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={copyLastResponse}
                          disabled={messages.filter(m => m.role === "assistant").length === 0}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isTyping || !input.trim()}
                      className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700"
                    >
                      {isTyping ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Thinking...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Press Enter to send • I analyze your transactions, goals, and spending patterns
                  </p>
                </form>
              </div>
            </div>

            {/* SIDEBAR - FINANCIAL INSIGHTS */}
            <div className="flex flex-col gap-4">
              <div className="glass-card p-4 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-purple-500" />
                  <h3 className="font-semibold">Quick Insights</h3>
                </div>
                {financialData ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Top Expense</p>
                      <p className="font-medium">
                        {Object.entries(financialData.categoryBreakdown)
                          .sort((a, b) => b[1] - a[1])[0]?.[0] || "No data"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Cashflow</p>
                      <p className={`font-medium ${financialData.monthlyIncome - financialData.monthlyExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{(financialData.monthlyIncome - financialData.monthlyExpense).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Anomalies</p>
                      <p className="font-medium">{financialData.anomalies.length} detected</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading insights...</p>
                )}
              </div>

              <div className="glass-card p-4 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Rocket className="w-4 h-4 text-blue-500" />
                  <h3 className="font-semibold">Pro Tips</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Star className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <p>Review expenses every Sunday evening</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <p>Save 20% before spending each month</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-3 h-3 text-purple-500 mt-0.5 flex-shrink-0" />
                    <p>Automate investments for consistency</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 border border-orange-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-orange-500" />
                  <h3 className="font-semibold">Chat Stats</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Messages</span>
                    <span className="font-medium">{messages.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your Questions</span>
                    <span className="font-medium">{messages.filter(m => m.role === "user").length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Response Time</span>
                    <span className="font-medium">0.8s</span>
                  </div>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = "/dashboard"}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}