import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Target,
  Calendar,
  DollarSign,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Brain,
  TrendingUp,
  TrendingDown,
  Rocket,
  Trophy,
  Flame,
  Zap,
  Clock,
  Coins,
  Gift,
  Award,
  Crown,
  Star,
  Bell,
  Target as TargetIcon,
  LineChart,
  PieChart,
  Wallet,
  Shield,
  Lock,
  Unlock,
  RefreshCw,
  Share2,
  Download,
  Eye,
  EyeOff,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  CalendarDays,
  Users,
  Lightbulb,
  Gem,
  Heart,
  Bolt,
  Rainbow,
  Moon,
  Sun,
  Cloud,
  Wind,
  Droplets,
  Trees,
  Mountain,
  Sparkle,
  Target as TargetIcon2,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  Hourglass,
  Package,
  Crown as CrownIcon,
  TrendingUp as TrendingUpIcon,
  Gift as GiftIcon,
  Timer,
  History,
  Receipt,
  IndianRupee,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ---------------- IMPROVED ML LOGIC ---------------- */
function predictGoalSuccess(
  current: number,
  target: number,
  daysRemaining: number,
  consistency: number,
  historicalData: any[] = []
) {
  // Calculate progress ratio (0 to 1)
  const progressRatio = Math.min(current / target, 1);
  
  // Normalize days remaining (cap at 365 days for stability)
  const normalizedDays = Math.min(daysRemaining, 365);
  const timePressure = daysRemaining <= 0 ? 0 : Math.min(1, 365 / normalizedDays);
  
  // Calculate historical performance
  let historicalScore = 0.5; // Default neutral score
  if (historicalData.length > 0) {
    const totalSaved = historicalData.reduce((sum, entry) => sum + entry.amount, 0);
    const avgDaily = totalSaved / historicalData.length;
    const requiredDaily = (target - current) / Math.max(daysRemaining, 1);
    
    // Historical performance ratio
    historicalScore = avgDaily > 0 ? Math.min(1, requiredDaily / avgDaily) : 0;
  }
  
  // Calculate savings velocity (how fast they need to save vs how fast they can)
  const requiredDaily = (target - current) / Math.max(daysRemaining, 1);
  const feasibilityScore = requiredDaily <= 0 ? 1 : 
    Math.min(1, 1000 / requiredDaily); // Normalize - smaller amounts are easier
  
  // Enhanced consistency factor
  const consistencyFactor = consistency * 0.7 + 0.3; // Scale to 0.3-1.0
  
  // Time factor - more weight when deadline is closer
  const timeFactor = daysRemaining <= 7 ? 0.3 : 
                    daysRemaining <= 30 ? 0.5 : 
                    daysRemaining <= 90 ? 0.7 : 1.0;
  
  // Progress factor - exponential reward for higher progress
  const progressFactor = Math.pow(progressRatio, 0.7); // S-curve effect
  
  // New weighted model with better logic
  const weights = {
    progress: 0.35,        // Current progress (most important)
    timePressure: 0.25,    // Deadline pressure
    feasibility: 0.20,     // How realistic is daily target
    consistency: 0.15,     // Historical consistency
    historical: 0.05,      // Past performance
  };
  
  // Calculate score components
  const score = 
    weights.progress * progressFactor +
    weights.timePressure * (1 - timePressure) + // Inverse - less time = lower score
    weights.feasibility * feasibilityScore +
    weights.consistency * consistencyFactor +
    weights.historical * historicalScore;
  
  // Apply sigmoid function for probability
  const probability = 1 / (1 + Math.exp(-(score * 6 - 3))); // Adjusted for better distribution
  
  // Calculate realistic success probability
  let finalProbability = Math.min(0.99, Math.max(0.01, probability));
  
  // Adjust based on extreme scenarios
  if (daysRemaining <= 0 && current < target) {
    finalProbability = 0.01; // Expired goals have minimal chance
  } else if (current >= target) {
    finalProbability = 0.99; // Already completed
  } else if (requiredDaily > 10000 && daysRemaining < 30) {
    // Unrealistic daily savings (>10k per day)
    finalProbability *= 0.3;
  } else if (progressRatio > 0.9 && daysRemaining > 0) {
    // Almost there with time left
    finalProbability *= 1.2;
  }
  
  // Clamp between 1% and 99%
  finalProbability = Math.min(0.99, Math.max(0.01, finalProbability));
  
  // Generate insights
  const insights: string[] = [];
  
  if (progressRatio >= 0.95) {
    insights.push("🎯 Almost there! Just one more push!");
  } else if (progressRatio >= 0.75) {
    insights.push("📈 Excellent progress! Maintain the momentum.");
  } else if (progressRatio >= 0.5) {
    insights.push("⚡ Halfway there! You're on the right track.");
  } else if (progressRatio >= 0.25) {
    insights.push("🌱 Good start! Keep adding regularly.");
  } else {
    insights.push("🚀 Beginning your journey! Consistency is key.");
  }
  
  if (daysRemaining <= 0) {
    insights.push("⌛ Deadline passed! Consider extending or cracking.");
  } else if (daysRemaining <= 7) {
    insights.push("⏰ Critical timeline! Consider if goal needs adjustment.");
  } else if (daysRemaining <= 30) {
    insights.push("📅 One month left! Stay focused.");
  } else if (daysRemaining >= 180) {
    insights.push("🗓️ Long-term goal! Steady saving works best.");
  }
  
  if (requiredDaily > 5000) {
    insights.push("💸 High daily target! Consider adjusting goal or timeline.");
  } else if (requiredDaily > 1000) {
    insights.push("💰 Moderate daily savings needed. Stay disciplined!");
  } else {
    insights.push("💪 Achievable daily target! You can do this!");
  }
  
  if (consistency >= 0.8) {
    insights.push("✅ Exceptional saving discipline!");
  } else if (consistency >= 0.6) {
    insights.push("👍 Good consistency! Keep it up.");
  } else {
    insights.push("📱 Try setting reminders for regular contributions.");
  }
  
  // Determine achievement level
  const probabilityPercent = Math.round(finalProbability * 100);
  let achievementLevel = "Needs Boost";
  let color = "text-red-500";
  let badgeColor = "bg-red-500/20 text-red-500";
  let icon = "🎯";
  
  if (probabilityPercent >= 90) {
    achievementLevel = "Legendary";
    color = "text-green-500";
    badgeColor = "bg-green-500/20 text-green-500";
    icon = "🏆";
  } else if (probabilityPercent >= 75) {
    achievementLevel = "Excellent";
    color = "text-green-400";
    badgeColor = "bg-green-400/20 text-green-400";
    icon = "⚡";
  } else if (probabilityPercent >= 60) {
    achievementLevel = "Good";
    color = "text-yellow-500";
    badgeColor = "bg-yellow-500/20 text-yellow-500";
    icon = "📈";
  } else if (probabilityPercent >= 40) {
    achievementLevel = "Fair";
    color = "text-orange-500";
    badgeColor = "bg-orange-500/20 text-orange-500";
    icon = "📊";
  }

  return {
    probability: probabilityPercent,
    willAchieve: probabilityPercent >= 50,
    achievementLevel,
    insights: insights.slice(0, 4),
    requiredDaily: Math.round(requiredDaily),
    daysToComplete: daysRemaining,
    color,
    badgeColor,
    icon,
    progressRatio: Math.round(progressRatio * 100),
    timePressure: Math.round(timePressure * 100),
    feasibilityScore: Math.round(feasibilityScore * 100),
  };
}

const getMotivationalQuote = (progress: number) => {
  const quotes = [
    { text: "🚀 Small steps every day lead to giant leaps!", progress: 0.1 },
    { text: "💎 Your future self will thank you!", progress: 0.3 },
    { text: "🔥 Consistency is the key to success!", progress: 0.5 },
    { text: "🏆 You're closer than you think!", progress: 0.7 },
    { text: "👑 Victory is within reach!", progress: 0.9 },
  ];
  return quotes.find(q => progress <= q.progress)?.text || "🌟 Start your journey today!";
};

const getGoalCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('car') || lower.includes('vehicle')) return '🚗';
  if (lower.includes('house') || lower.includes('home') || lower.includes('apartment')) return '🏠';
  if (lower.includes('vacation') || lower.includes('travel') || lower.includes('trip')) return '✈️';
  if (lower.includes('education') || lower.includes('course') || lower.includes('study')) return '🎓';
  if (lower.includes('emergency') || lower.includes('safety') || lower.includes('fund')) return '🛡️';
  if (lower.includes('wedding') || lower.includes('marriage')) return '💍';
  if (lower.includes('gadget') || lower.includes('phone') || lower.includes('laptop')) return '📱';
  if (lower.includes('investment') || lower.includes('stock') || lower.includes('crypto')) return '📈';
  if (lower.includes('health') || lower.includes('medical') || lower.includes('fitness')) return '💊';
  if (lower.includes('gift') || lower.includes('present')) return '🎁';
  return '🎯';
};

/* ---------------- AI CELEBRATION MESSAGES ---------------- */
const getAICelebration = (amount: number, goalName: string, isSuccess: boolean) => {
  const successMessages = [
    `🎉 CONGRATULATIONS! You've successfully saved ₹${amount.toLocaleString()} for "${goalName}"! Your discipline paid off!`,
    `🏆 VICTORY! Goal "${goalName}" achieved! ₹${amount.toLocaleString()} transferred to your balance. You're a savings champion!`,
    `💎 MISSION ACCOMPLISHED! "${goalName}" completed successfully. ₹${amount.toLocaleString()} added to your account. Financial wizard!`,
    `👑 GOAL CONQUERED! Your patience and consistency with "${goalName}" earned you ₹${amount.toLocaleString()}. Legendary!`,
    `⚡ BULLSEYE! Target reached for "${goalName}". ₹${amount.toLocaleString()} now available. Your future self is proud!`,
  ];
  
  const crackedMessages = [
    `🔓 POT CRACKED! ₹${amount.toLocaleString()} from "${goalName}" released early. Sometimes flexibility is key!`,
    `💫 EARLY ACCESS! "${goalName}" savings of ₹${amount.toLocaleString()} unlocked. Life happens - wise decision!`,
    `🎪 CIRCUS OF SAVINGS! The "${goalName}" pot is open! ₹${amount.toLocaleString()} now in your balance. Smart move!`,
    `🔮 FORTUNE UNLOCKED! You've accessed ₹${amount.toLocaleString()} from "${goalName}". Future opportunities await!`,
    `✨ FINANCIAL FLEXIBILITY! "${goalName}" savings of ₹${amount.toLocaleString()} released. Adapt and conquer!`,
  ];
  
  return isSuccess 
    ? successMessages[Math.floor(Math.random() * successMessages.length)]
    : crackedMessages[Math.floor(Math.random() * crackedMessages.length)];
};

/* ---------------- AI SAVINGS ADVICE ---------------- */
const getAISavingsAdvice = (goal: any) => {
  const progress = goal.current / goal.target;
  const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000);
  
  if (goal.status === "claimed") return "🏆 Goal claimed! Money added to your balance.";
  
  if (progress >= 1) return "🎯 Goal achieved! Click 'Claim' to add money to your balance!";
  
  if (progress > 0.8) return "🔥 Almost there! Just a little more push to victory!";
  
  if (daysLeft < 7) {
    return "⏰ Deadline approaching! Consider extending or adjusting your goal.";
  }
  
  if (progress < 0.3) {
    return "🌱 Great start! Consistent small contributions build big savings.";
  }
  
  return "⚡ You're on track! Keep up the momentum toward your goal.";
};

/* ---------------- MONTHLY INCOME VS SAVINGS CHART COMPONENT - FIXED ---------------- */
const MonthlyComparisonChart = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return null;
  
  // Find the maximum value for scaling
  const maxValue = Math.max(...data.map(item => Math.max(item.income, item.savings)));
  
  return (
    <div className="glass-card p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Income vs Savings
          </h3>
          <p className="text-sm text-muted-foreground">Last 4 months comparison</p>
        </div>
        <Badge variant="outline" className="bg-primary/10">
          Total Saved: ₹{data.reduce((sum, item) => sum + (item.savings || 0), 0).toLocaleString()}
        </Badge>
      </div>
      
      <div className="space-y-6">
        {/* Bars for each month */}
        <div className="space-y-4">
          {data.map((item, index) => {
            const incomePercentage = maxValue > 0 ? (item.income / maxValue) * 100 : 0;
            const savingsPercentage = maxValue > 0 ? (item.savings / maxValue) * 100 : 0;
            const savingsRatio = item.income > 0 ? (item.savings / item.income) * 100 : 0;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-12 text-sm font-medium">{item.month}</div>
                  
                  <div className="flex-1 ml-4 space-y-2">
                    {/* Income Bar */}
                    <div className="relative h-4 bg-blue-500/20 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${incomePercentage}%` }}
                      >
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-bold text-white">
                          ₹{item.income.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Savings Bar */}
                    <div className="relative h-3 bg-green-500/20 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-700 delay-100"
                        style={{ width: `${savingsPercentage}%` }}
                      >
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs font-bold text-white">
                          ₹{item.savings.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-20 text-right">
                    <div className="text-sm font-bold text-green-600">
                      {savingsRatio.toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Savings Rate</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-6 text-sm pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
            <span>Monthly Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"></div>
            <span>Goal Savings</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- COMPACT GOAL SUMMARY WIDGET ---------------- */
const GoalSummaryWidget = ({ goals, currentBalance, streak, level }: any) => {
  const activeGoals = goals.filter((g: any) => !g.is_deleted && !(g.current >= g.target) && !g.is_cracked && !g.status === "claimed");
  const completedGoals = goals.filter((g: any) => g.current >= g.target && !g.is_deleted && g.status !== "claimed");
  const totalLocked = goals.filter((g: any) => !g.is_deleted && !g.is_cracked && g.status !== "claimed").reduce((s: number, g: any) => s + Number(g.current), 0);
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div className="glass-card p-3 border border-green-500/20">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-green-500/10">
            <LockIcon className="w-4 h-4 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Locked</p>
            <p className="text-sm font-bold">₹{totalLocked.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <div className="glass-card p-3 border border-blue-500/20">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-sm font-bold">{activeGoals.length}</p>
          </div>
        </div>
      </div>
      
      <div className="glass-card p-3 border border-purple-500/20">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <Flame className="w-4 h-4 text-purple-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Streak</p>
            <p className="text-sm font-bold">{streak} days</p>
          </div>
        </div>
      </div>
      
      <div className="glass-card p-3 border border-orange-500/20">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <CrownIcon className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Level</p>
            <p className="text-sm font-bold">{level}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- QUICK ACTIONS WIDGET ---------------- */
const QuickActionsWidget = ({ goals, onAddMoney, onViewPredictor, onViewStats }: any) => {
  const completedGoals = goals.filter((g: any) => g.current >= g.target && !g.is_deleted && g.status !== "claimed");
  const totalReadyToClaim = completedGoals.reduce((sum: number, g: any) => sum + g.current, 0);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <button 
        onClick={() => completedGoals.length > 0 && onAddMoney(completedGoals[0])}
        className={`glass-card p-4 border transition-all hover:scale-[1.02] ${
          totalReadyToClaim > 0 
            ? 'border-green-500/30 bg-gradient-to-r from-green-500/5 to-green-500/10 hover:from-green-500/10 hover:to-green-500/15' 
            : 'border-blue-500/30'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${totalReadyToClaim > 0 ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
            <GiftIcon className={`w-5 h-5 ${totalReadyToClaim > 0 ? 'text-green-500' : 'text-blue-500'}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Ready to Claim</h3>
            <p className="text-xs text-muted-foreground">
              {totalReadyToClaim > 0 
                ? `₹${totalReadyToClaim.toLocaleString()} available` 
                : 'No goals ready'}
            </p>
          </div>
          {totalReadyToClaim > 0 && (
            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
              {completedGoals.length}
            </Badge>
          )}
        </div>
      </button>
      
      <button 
        onClick={onViewPredictor}
        className="glass-card p-4 border border-purple-500/30 hover:border-purple-500/50 transition-all hover:scale-[1.02]"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Brain className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Predictor</h3>
            <p className="text-xs text-muted-foreground">Goal success forecast</p>
          </div>
        </div>
      </button>
      
      <button 
        onClick={onViewStats}
        className="glass-card p-4 border border-yellow-500/30 hover:border-yellow-500/50 transition-all hover:scale-[1.02]"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/20">
            <LineChart className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Insights</h3>
            <p className="text-xs text-muted-foreground">View analytics</p>
          </div>
        </div>
      </button>
    </div>
  );
};

export default function Goals() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [goalTransactions, setGoalTransactions] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  /* Modals */
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPredictModal, setShowPredictModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<any>(null);
  const [showGoalDetails, setShowGoalDetails] = useState<any>(null);
  const [showCrackPotModal, setShowCrackPotModal] = useState<any>(null);
  const [showClaimModal, setShowClaimModal] = useState<any>(null);
  const [showExtendModal, setShowExtendModal] = useState<any>(null);

  /* Forms */
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("Personal");
  const [priority, setPriority] = useState(3);
  const [amount, setAmount] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  /* Prediction Inputs */
  const [pCurrent, setPCurrent] = useState("");
  const [pTarget, setPTarget] = useState("");
  const [pDeadline, setPDeadline] = useState("");
  const [pConsistency, setPConsistency] = useState([0.7]);
  const [prediction, setPrediction] = useState<any>(null);

  /* Gamification */
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(1);
  const [challenges, setChallenges] = useState([
    { id: 1, title: "First Goal", desc: "Create your first savings goal", completed: false, reward: 100, icon: "🎯" },
    { id: 2, title: "Consistent Saver", desc: "Add to a goal for 3 consecutive days", completed: false, reward: 200, icon: "🔥" },
    { id: 3, title: "Halfway Hero", desc: "Reach 50% on any goal", completed: false, reward: 300, icon: "⚡" },
    { id: 4, title: "Goal Master", desc: "Complete 3 goals", completed: false, reward: 500, icon: "👑" },
  ]);

  /* ---------------- FETCH MONTHLY INCOME VS SAVINGS DATA - FIXED ---------------- */
  const fetchMonthlyComparisonData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current date
      const today = new Date();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthData = [];
      
      // Get last 4 months (current month and previous 3)
      for (let i = 3; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthIndex = date.getMonth();
        const monthName = months[monthIndex];
        const year = date.getFullYear();
        
        // Format month for database query (YYYY-MM)
        const monthStr = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}`;
        
        try {
          // Fetch income for this month (CREDIT transactions)
          const { data: incomeData, error: incomeError } = await supabase
            .from("transactions")
            .select("amount")
            .eq("user_id", user.id)
            .eq("type", "CREDIT")
            .gte("date", `${monthStr}-01`)
            .lt("date", `${year}-${(monthIndex + 2).toString().padStart(2, '0')}-01`);
            
          if (incomeError) {
            console.error("Income fetch error:", incomeError);
          }
          
          const monthlyIncome = incomeData?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
          
          // Fetch savings contributions for this month (DEBIT transactions for goals)
          const { data: savingsData, error: savingsError } = await supabase
            .from("transactions")
            .select("amount")
            .eq("user_id", user.id)
            .eq("type", "DEBIT")
            .or(`narration.ilike.%savings%,narration.ilike.%goal%`)
            .gte("date", `${monthStr}-01`)
            .lt("date", `${year}-${(monthIndex + 2).toString().padStart(2, '0')}-01`);
            
          if (savingsError) {
            console.error("Savings fetch error:", savingsError);
          }
          
          const monthlySavings = savingsData?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;
          
          // Calculate savings percentage
          const savingsPercentage = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
          
          monthData.push({
            month: monthName,
            income: monthlyIncome,
            savings: monthlySavings,
            savingsPercentage: Math.round(savingsPercentage)
          });
          
        } catch (error) {
          console.error(`Error fetching data for ${monthName}:`, error);
          // Add placeholder data if there's an error
          monthData.push({
            month: monthName,
            income: 0,
            savings: 0,
            savingsPercentage: 0
          });
        }
      }
      
      setMonthlyData(monthData);
    } catch (error) {
      console.error("Error in fetchMonthlyComparisonData:", error);
      // Set default data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const today = new Date();
      const defaultData = [];
      
      for (let i = 3; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthIndex = date.getMonth();
        defaultData.push({
          month: months[monthIndex],
          income: Math.floor(Math.random() * 50000) + 30000,
          savings: Math.floor(Math.random() * 15000) + 5000,
          savingsPercentage: Math.floor(Math.random() * 30) + 10
        });
      }
      
      setMonthlyData(defaultData);
    }
  };

  /* ---------------- HELPERS ---------------- */
  const daysLeft = (d: string) =>
    Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

  const isCompleted = (g: any) => g.current >= g.target && !g.is_cracked && !g.is_deleted;
  const isClaimed = (g: any) => g.status === "claimed";
  const isExpired = (g: any) => daysLeft(g.deadline) < 0 && !isCompleted(g) && !g.is_cracked && !g.is_deleted && !isClaimed(g);
  const isCracked = (g: any) => g.is_cracked;
  const progressPercentage = (g: any) => Math.min((g.current / g.target) * 100, 100);
  const isLocked = (g: any) => !g.is_cracked && !g.is_deleted && !isCompleted(g) && !isClaimed(g);

  /* ---------------- FETCH GOAL TRANSACTIONS ---------------- */
  const fetchGoalTransactions = async (goalId: string, goalName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .or(`narration.ilike.%${goalName}%,narration.ilike.%Savings: ${goalName}%`)
        .order("transaction_timestamp", { ascending: false });

      if (error) {
        console.error("Error fetching goal transactions:", error);
        return [];
      }

      return transactions || [];
    } catch (error) {
      console.error("Error in fetchGoalTransactions:", error);
      return [];
    }
  };

  /* ---------------- FETCH GOALS & BALANCE ---------------- */
  const fetchGoals = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching goals:", error);
        toast.error("Failed to load goals");
        return;
      }

      setGoals(data || []);
      
      // Calculate user points based on goals
      let points = 0;
      (data || []).forEach(goal => {
        if (!goal.is_deleted) {
          points += Math.floor(goal.current / 100) * 10; // 10 points per ₹100 saved
          if (isCompleted(goal) && !isClaimed(goal)) points += 500;
          if (goal.status === "claimed") points += 1000; // Bonus for claiming
          if (goal.current >= goal.target * 0.5) points += 200;
          if (goal.is_cracked) points -= 100; // Penalty for cracking pot
        }
      });
      setUserPoints(points);
      setLevel(Math.floor(points / 1000) + 1);
      
      // Fetch current balance from transactions
      const { data: transactions } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", user.id);
      
      if (transactions) {
        const income = transactions
          .filter((t: any) => t.type === "CREDIT")
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        
        const expenses = transactions
          .filter((t: any) => t.type === "DEBIT")
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
        
        setCurrentBalance(income - expenses);
      }
      
      // Fetch monthly comparison data
      await fetchMonthlyComparisonData();
      
    } catch (error) {
      console.error("Error in fetchGoals:", error);
      toast.error("Failed to load goals");
    } finally {
      setLoading(false);
    }
  };

  const fetchAchievements = async () => {
    const completedGoals = goals.filter(g => isCompleted(g) && !g.is_deleted).length;
    const claimedGoals = goals.filter(g => g.status === "claimed").length;
    const newAchievements = [
      { id: 1, title: "Goal Starter", desc: "Create your first goal", unlocked: goals.length > 0, icon: "🎯", date: goals.length > 0 ? new Date().toLocaleDateString() : null },
      { id: 2, title: "Consistent Saver", desc: "Save for 5 consecutive days", unlocked: streak >= 5, icon: "🔥", date: streak >= 5 ? new Date().toLocaleDateString() : null },
      { id: 3, title: "Halfway Hero", desc: "Reach 50% on any goal", unlocked: goals.some(g => g.current >= g.target * 0.5), icon: "⚡", date: null },
      { id: 4, title: "Goal Crusher", desc: "Complete a goal", unlocked: completedGoals > 0, icon: "👑", date: completedGoals > 0 ? new Date().toLocaleDateString() : null },
      { id: 5, title: "Savings Master", desc: "Complete 5 goals", unlocked: completedGoals >= 5, icon: "🏆", date: completedGoals >= 5 ? new Date().toLocaleDateString() : null },
      { id: 6, title: "Iron Discipline", desc: "Never crack a pot", unlocked: !goals.some(g => g.is_cracked), icon: "🛡️", date: null },
      { id: 7, title: "Claim Champion", desc: "Claim 3 goals", unlocked: claimedGoals >= 3, icon: "💎", date: claimedGoals >= 3 ? new Date().toLocaleDateString() : null },
    ];
    setAchievements(newAchievements);
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [goals, streak]);

  /* ---------------- CREATE GOAL ---------------- */
  const createGoal = async (e: any) => {
    e.preventDefault();
    
    if (!name.trim() || !target || !deadline) {
      toast.error("Please fill in all required fields");
      return;
    }

    const targetNum = Number(target);
    if (isNaN(targetNum) || targetNum <= 0) {
      toast.error("Please enter a valid target amount");
      return;
    }

    const deadlineDate = new Date(deadline);
    if (deadlineDate < new Date()) {
      toast.error("Deadline must be in the future");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to create a goal");
      return;
    }

    try {
      const { error } = await supabase.from("goals").insert({
        user_id: user.id,
        name: name.trim(),
        target: targetNum,
        deadline,
        current: 0,
        category,
        priority,
        created_at: new Date().toISOString(),
        is_deleted: false,
        is_cracked: false,
        status: "active",
      });

      if (error) {
        const { error: simpleError } = await supabase.from("goals").insert({
          user_id: user.id,
          name: name.trim(),
          target: targetNum,
          deadline,
          current: 0,
          category,
        });

        if (simpleError) {
          toast.error("Failed to create goal. Please check database schema.");
          return;
        }
      }

      setShowAddModal(false);
      setName("");
      setTarget("");
      setDeadline("");
      setCategory("Personal");
      setPriority(3);
      
      setUserPoints(prev => prev + 50);
      
      toast.success("🎯 New savings pot created! Money added will be locked until completion.");
      fetchGoals();
      
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error("An unexpected error occurred");
    }
  };

  /* ---------------- ADD MONEY TO GOAL (LOCKED) ---------------- */
  const addContribution = async (e: any) => {
    e.preventDefault();
    const contribution = Number(amount);
    
    if (isNaN(contribution) || contribution <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (contribution > currentBalance) {
      toast.error(`Insufficient balance! You have ₹${currentBalance.toLocaleString()} available`);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !contributeGoal) return;

    try {
      const transactionData = {
        user_id: user.id,
        narration: `Savings: ${contributeGoal.name}`,
        amount: contribution,
        type: "DEBIT" as const,
        transaction_timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        category: "Goals",
        source: "GOAL_CONTRIBUTION",
        vendor: "Savings Pot"
      };

      const { error: expenseError } = await supabase
        .from("transactions")
        .insert(transactionData);

      if (expenseError) {
        const minimalData = {
          user_id: user.id,
          narration: `Savings: ${contributeGoal.name}`,
          amount: contribution,
          type: "DEBIT",
          transaction_timestamp: new Date().toISOString()
        };
        
        const { error: minimalError } = await supabase
          .from("transactions")
          .insert(minimalData);
          
        if (minimalError) {
          toast.error("Database constraint error. Please check table structure.");
          return;
        }
      }

      const { error: goalError } = await supabase
        .from("goals")
        .update({ 
          current: (contributeGoal.current || 0) + contribution,
          last_contribution: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", contributeGoal.id);

      if (goalError) {
        toast.error("Failed to add to goal");
        return;
      }

      setContributeGoal(null);
      setAmount("");
      
      setUserPoints(prev => prev + Math.floor(contribution / 100) * 10);
      setStreak(prev => prev + 1);
      setCurrentBalance(prev => prev - contribution);
      
      toast.success(`💰 ₹${contribution} locked in "${contributeGoal.name}"!`, {
        description: "Money is now safely stored until goal completion",
      });
      
      await fetchGoals();
      
    } catch (error) {
      console.error("Unexpected error in addContribution:", error);
      toast.error("An unexpected error occurred");
    }
  };

  /* ---------------- CLAIM COMPLETED GOAL ---------------- */
  const claimGoal = async (goal: any) => {
    if (!confirm(`Claim ₹${goal.current.toLocaleString()} from "${goal.name}"?`)) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error: goalError } = await supabase
        .from("goals")
        .update({ 
          status: "claimed",
          completed_at: new Date().toISOString(),
          claimed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", goal.id);

      if (goalError) {
        toast.error("Failed to mark goal as claimed");
        return;
      }

      const { error: incomeError } = await supabase.from("transactions").insert({
        user_id: user.id,
        narration: `Goal Claimed: ${goal.name}`,
        category: "Goals",
        amount: goal.current,
        type: "CREDIT",
        date: new Date().toISOString().split('T')[0],
        transaction_timestamp: new Date().toISOString(),
        source: "GOAL_CLAIMED",
        vendor: "Savings Pot"
      });

      if (incomeError) {
        const { error: simpleError } = await supabase.from("transactions").insert({
          user_id: user.id,
          narration: `Goal Claimed: ${goal.name}`,
          amount: goal.current,
          type: "CREDIT",
          transaction_timestamp: new Date().toISOString()
        });

        if (simpleError) {
          await supabase
            .from("goals")
            .update({ 
              status: "active",
              completed_at: null,
              claimed_at: null,
              updated_at: new Date().toISOString()
            })
            .eq("id", goal.id);
            
          toast.error("Failed to record transaction");
          return;
        }
      }

      const celebration = getAICelebration(goal.current, goal.name, true);
      
      toast.success("🎉 GOAL CLAIMED!", {
        description: celebration,
        duration: 10000,
      });

      setShowClaimModal(null);
      setCurrentBalance(prev => prev + goal.current);
      setUserPoints(prev => prev + 1000);
      fetchGoals();
      
    } catch (error) {
      console.error("Error claiming goal:", error);
      toast.error("Failed to claim goal");
    }
  };

  /* ---------------- CRACK POT (EARLY WITHDRAWAL) ---------------- */
  const crackPot = async (goal: any, reason: string = "early_withdrawal") => {
    if (!confirm(`Crack "${goal.name}" pot and release ₹${goal.current.toLocaleString()}?`)) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error: goalError } = await supabase
        .from("goals")
        .update({ 
          is_cracked: true,
          cracked_at: new Date().toISOString(),
          cracked_reason: reason,
          status: "cracked",
          updated_at: new Date().toISOString()
        })
        .eq("id", goal.id);

      if (goalError) {
        const { error: simpleError } = await supabase
          .from("goals")
          .update({ 
            is_cracked: true,
            updated_at: new Date().toISOString()
          })
          .eq("id", goal.id);

        if (simpleError) throw simpleError;
      }

      const { error: incomeError } = await supabase.from("transactions").insert({
        user_id: user.id,
        narration: `Goal Cracked: ${goal.name}`,
        category: "Goals",
        amount: goal.current,
        type: "CREDIT",
        date: new Date().toISOString().split("T")[0],
        transaction_timestamp: new Date().toISOString(),
        source: "GOAL_CRACKED",
        goal_id: goal.id,
        vendor: "Savings Pot",
        is_anomaly: false,
        created_at: new Date().toISOString(),
      });

      if (incomeError) {
        const { error: altError } = await supabase.from("transactions").insert({
          user_id: user.id,
          narration: `Goal Cracked: ${goal.name}`,
          amount: goal.current,
          type: "CREDIT",
          date: new Date().toISOString().split("T")[0],
          transaction_timestamp: new Date().toISOString(),
        });

        if (altError) throw altError;
      }

      const celebration = getAICelebration(goal.current, goal.name, false);
      
      toast.warning("🔓 POT CRACKED!", {
        description: celebration,
        duration: 10000,
      });

      setShowCrackPotModal(null);
      setCurrentBalance(prev => prev + goal.current);
      setUserPoints(prev => Math.max(0, prev - 100));
      fetchGoals();
      
    } catch (error) {
      console.error("Error cracking pot:", error);
      toast.error("Failed to crack pot");
    }
  };

  /* ---------------- EXTEND DEADLINE ---------------- */
  const extendDeadline = async (goal: any) => {
    if (!newDeadline) {
      toast.error("Please select a new deadline");
      return;
    }

    if (new Date(newDeadline) <= new Date(goal.deadline)) {
      toast.error("New deadline must be after current deadline");
      return;
    }

    try {
      const { error } = await supabase
        .from("goals")
        .update({ 
          deadline: newDeadline,
          extended_count: (goal.extended_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", goal.id);

      if (error) {
        const { error: simpleError } = await supabase
          .from("goals")
          .update({ 
            deadline: newDeadline,
            updated_at: new Date().toISOString()
          })
          .eq("id", goal.id);

        if (simpleError) throw simpleError;
      }

      toast.success(`⏰ Deadline extended to ${new Date(newDeadline).toLocaleDateString()}`);
      setShowExtendModal(null);
      setNewDeadline("");
      fetchGoals();
      
    } catch (error) {
      console.error("Error extending deadline:", error);
      toast.error("Failed to extend deadline");
    }
  };

  /* ---------------- DELETE GOAL ---------------- */
  const deleteGoal = async (goal: any) => {
    const confirmMessage = goal.current > 0 
      ? `This will release ₹${goal.current.toLocaleString()} back to your balance. Are you sure?`
      : "Are you sure you want to delete this goal?";
    
    if (!confirm(confirmMessage)) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (goal.current > 0) {
        const { error: incomeError } = await supabase.from("transactions").insert({
          user_id: user.id,
          narration: `Goal Deleted: ${goal.name}`,
          category: "Goals",
          amount: goal.current,
          type: "CREDIT",
          date: new Date().toISOString().split("T")[0],
          transaction_timestamp: new Date().toISOString(),
          source: "GOAL_DELETED",
          goal_id: goal.id,
          vendor: "Savings Pot",
          is_anomaly: false,
          created_at: new Date().toISOString(),
        });

        if (incomeError) {
          const { error: altError } = await supabase.from("transactions").insert({
            user_id: user.id,
            narration: `Goal Deleted: ${goal.name}`,
            amount: goal.current,
            type: "CREDIT",
            date: new Date().toISOString().split("T")[0],
            transaction_timestamp: new Date().toISOString(),
          });

          if (altError) throw altError;
        }
        
        setCurrentBalance(prev => prev + goal.current);
      }

      const { error: goalError } = await supabase
        .from("goals")
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", goal.id);

      if (goalError) {
        const { error: simpleError } = await supabase
          .from("goals")
          .update({ 
            is_deleted: true,
            updated_at: new Date().toISOString()
          })
          .eq("id", goal.id);

        if (simpleError) throw simpleError;
      }

      toast.warning(`Goal "${goal.name}" deleted${goal.current > 0 ? ` - ₹${goal.current.toLocaleString()} returned to balance` : ''}`);
      fetchGoals();
      
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete goal");
    }
  };

  /* ---------------- HANDLE GOAL DETAILS ---------------- */
  const handleGoalDetails = async (goal: any) => {
    setShowGoalDetails(goal);
    const transactions = await fetchGoalTransactions(goal.id, goal.name);
    setGoalTransactions(transactions);
  };

  /* ---------------- SORT GOALS ---------------- */
  const sortedGoals = [...goals].sort((a, b) => {
    if (a.is_deleted !== b.is_deleted) return a.is_deleted ? 1 : -1;
    if (isClaimed(a) !== isClaimed(b)) return isClaimed(a) ? 1 : -1;
    if (isCompleted(a) !== isCompleted(b)) return isCompleted(a) ? 1 : -1;
    if (isExpired(a) !== isExpired(b)) return isExpired(a) ? 1 : -1;
    if (isCracked(a) !== isCracked(b)) return isCracked(a) ? 1 : -1;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  /* ---------------- STATS ---------------- */
  const activeGoals = goals.filter(g => !g.is_deleted && !isCompleted(g) && !isExpired(g) && !isCracked(g) && !isClaimed(g));
  const completedGoals = goals.filter(g => isCompleted(g) && !g.is_deleted && !isClaimed(g));
  const claimedGoals = goals.filter(g => isClaimed(g) && !g.is_deleted);
  const crackedGoals = goals.filter(g => g.is_cracked && !g.is_deleted);
  const totalLocked = goals.filter(g => isLocked(g)).reduce((s, g) => s + Number(g.current), 0);
  const totalTarget = goals.reduce((s, g) => s + Number(g.target), 0);
  const overallProgress = totalTarget ? (totalLocked / totalTarget) * 100 : 0;
  const avgGoalCompletion = goals.length > 0 ? (completedGoals.length / goals.length) * 100 : 0;

  /* ---------------- GAMIFICATION ---------------- */
  const getLevelTitle = (level: number) => {
    if (level >= 10) return "Savings Legend 👑";
    if (level >= 7) return "Goal Master 💎";
    if (level >= 5) return "Pro Saver ⚡";
    if (level >= 3) return "Savings Enthusiast 🔥";
    return "Goal Starter 🌱";
  };

  const getNextLevelPoints = () => level * 1000;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-gray-50 to-background dark:via-gray-900/20">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />

        <main className="p-6 space-y-6">
          {/* 🎮 HEADER WITH GAMIFICATION */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <LockIcon className="w-6 h-6 text-yellow-500" />
                🔒 Smart Savings Pots
                <Badge variant="secondary" className="ml-2">
                  Level {level}
                </Badge>
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                {getMotivationalQuote(overallProgress / 100)}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span className="font-bold">₹{currentBalance.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">Available</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {getLevelTitle(level)} • {userPoints} points
                </div>
              </div>
              <Button 
                variant="gradient" 
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Pot
              </Button>
            </div>
          </div>

          {/* 📊 REORGANIZED LAYOUT - 2 COLUMN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Monthly Chart - Now smaller and more compact */}
              {monthlyData.length > 0 && (
                <div className="glass-card p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Income vs Savings
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      Last 4 months
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {monthlyData.map((item, index) => {
                      const savingsRate = item.income > 0 ? (item.savings / item.income) * 100 : 0;
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <div className="w-10 text-sm font-medium">{item.month}</div>
                          
                          <div className="flex-1 mx-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-blue-500/20 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                                  style={{ width: `${Math.min(100, (item.income / 100000) * 100)}%` }}
                                />
                              </div>
                              <div className="text-xs font-medium">₹{item.income.toLocaleString()}</div>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1.5 bg-green-500/20 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full"
                                  style={{ width: `${Math.min(100, (item.savings / 50000) * 100)}%` }}
                                />
                              </div>
                              <div className="text-xs font-medium text-green-600">₹{item.savings.toLocaleString()}</div>
                            </div>
                          </div>
                          
                          <div className="w-16 text-right">
                            <div className={`text-sm font-bold ${
                              savingsRate > 20 ? 'text-green-600' : 
                              savingsRate > 10 ? 'text-yellow-600' : 
                              'text-orange-600'
                            }`}>
                              {savingsRate.toFixed(0)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Rate</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 🔓 Quick Summary Widget */}
              <GoalSummaryWidget 
                goals={goals} 
                currentBalance={currentBalance} 
                streak={streak} 
                level={level} 
              />

              {/* ⚡ Quick Actions Widget */}
              <QuickActionsWidget 
                goals={goals}
                onAddMoney={(goal: any) => setContributeGoal(goal)}
                onViewPredictor={() => setShowPredictModal(true)}
                onViewStats={() => setShowStatsModal(true)}
              />

              {/* 🎯 GOALS GRID */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Your Savings Pots
                  <Badge variant="outline" className="ml-2">
                    {sortedGoals.filter(g => !g.is_deleted).length} pots
                  </Badge>
                </h2>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading your savings pots...</p>
                </div>
              ) : sortedGoals.filter(g => !g.is_deleted).length === 0 ? (
                <div className="text-center py-12 glass-card">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-primary/20 to-purple-500/20 flex items-center justify-center">
                    <LockIcon className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Savings Pots Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first locked savings pot. Money will be safe until you reach your goal!
                  </p>
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Pot
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {sortedGoals.map(goal => {
                    const progress = progressPercentage(goal);
                    const completed = isCompleted(goal);
                    const claimed = isClaimed(goal);
                    const expired = isExpired(goal);
                    const cracked = isCracked(goal);
                    const locked = isLocked(goal);
                    const days = daysLeft(goal.deadline);
                    const categoryIcon = getGoalCategoryIcon(goal.name);
                    const aiAdvice = getAISavingsAdvice(goal);
                    
                    return (
                      <div
                        key={goal.id}
                        className={`glass-card p-5 hover:shadow-lg transition-all duration-300 border relative overflow-hidden
                          ${goal.is_deleted
                            ? "opacity-40 grayscale"
                            : claimed
                            ? "opacity-60 border-gray-400/30 bg-gray-400/5"
                            : cracked
                            ? "border-red-500/30 bg-red-500/5"
                            : completed
                            ? "border-green-500/30 bg-green-500/5"
                            : expired
                            ? "border-orange-500/30 bg-orange-500/5"
                            : "border-primary/20"}`}
                      >
                        {/* Status Badges */}
                        <div className="absolute top-3 right-3 flex flex-col gap-1">
                          {claimed && (
                            <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30 text-xs">
                              <Check className="w-3 h-3 mr-1" />
                              Claimed
                            </Badge>
                          )}
                          {cracked && (
                            <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-xs">
                              <UnlockIcon className="w-3 h-3 mr-1" />
                              Cracked
                            </Badge>
                          )}
                          {completed && !claimed && (
                            <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">
                              <GiftIcon className="w-3 h-3 mr-1" />
                              Ready!
                            </Badge>
                          )}
                          {expired && (
                            <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              Expired
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{categoryIcon}</div>
                            <div className="flex-1">
                              <h3 className={`font-semibold ${claimed ? "line-through text-gray-500" : ""}`}>
                                {goal.name}
                              </h3>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {claimed
                                  ? `Claimed`
                                  : cracked
                                  ? "Cracked"
                                  : completed
                                  ? "Ready to claim!"
                                  : expired
                                  ? "Deadline passed"
                                  : `${days} days left`}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Progress Section */}
                        <div className="mb-4">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                              ₹{goal.current.toLocaleString()} of ₹{goal.target.toLocaleString()}
                            </span>
                            <span className={`font-semibold ${
                              claimed ? 'text-gray-500' :
                              completed ? 'text-green-500' :
                              cracked ? 'text-red-500' :
                              expired ? 'text-orange-500' : ''
                            }`}>
                              {progress.toFixed(1)}%
                            </span>
                          </div>
                          <Progress 
                            value={progress} 
                            className={`h-2 ${
                              claimed ? 'bg-gray-500/20' :
                              completed ? 'bg-green-500/20' :
                              cracked ? 'bg-red-500/20' :
                              expired ? 'bg-orange-500/20' : ''
                            }`}
                          />
                          
                          {locked && !expired && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              Save ₹{Math.ceil((goal.target - goal.current) / Math.max(days, 1)).toLocaleString()}/day
                            </div>
                          )}
                        </div>

                        {/* AI Advice */}
                        <div className="text-xs p-2 bg-secondary/20 rounded mb-3">
                          <p>{aiAdvice}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {completed && !claimed && !goal.is_deleted && (
                            <Button
                              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-xs h-8"
                              onClick={() => setShowClaimModal(goal)}
                            >
                              <GiftIcon className="w-3 h-3 mr-1" />
                              Claim
                            </Button>
                          )}
                          
                          {expired && !goal.is_deleted && (
                            <>
                              <Button
                                variant="outline"
                                className="flex-1 text-xs h-8"
                                onClick={() => setShowExtendModal(goal)}
                              >
                                <CalendarDays className="w-3 h-3 mr-1" />
                                Extend
                              </Button>
                              <Button
                                variant="destructive"
                                className="flex-1 text-xs h-8"
                                onClick={() => setShowCrackPotModal(goal)}
                              >
                                <UnlockIcon className="w-3 h-3 mr-1" />
                                Crack
                              </Button>
                            </>
                          )}
                          
                          {locked && !expired && !goal.is_deleted && (
                            <>
                              <Button
                                className="flex-1 bg-gradient-to-r from-primary to-blue-600 text-xs h-8"
                                onClick={() => setContributeGoal(goal)}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 text-xs h-8"
                                onClick={() => handleGoalDetails(goal)}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column - Sidebar Stats */}
            <div className="space-y-6">
              {/* Balance & Stats Card */}
              <div className="glass-card p-5 border border-primary/20">
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">💰</div>
                  <h3 className="font-semibold">Your Savings Status</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Available Balance</span>
                    <span className="font-bold">₹{currentBalance.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Locked</span>
                    <span className="font-bold text-green-600">₹{totalLocked.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Pots</span>
                    <Badge>{activeGoals.length}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500">
                      {completedGoals.length}
                    </Badge>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Savings Streak</span>
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="font-bold">{streak} days</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      Add to any goal daily to maintain streak
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="glass-card p-5 border border-blue-500/20">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  Saving Tips
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <div className="p-1 bg-blue-500/10 rounded mt-0.5">
                      <Target className="w-3 h-3 text-blue-500" />
                    </div>
                    <span>Start with small, achievable amounts</span>
                  </div>
                  
                  <div className="flex items-start gap-2 text-sm">
                    <div className="p-1 bg-green-500/10 rounded mt-0.5">
                      <Calendar className="w-3 h-3 text-green-500" />
                    </div>
                    <span>Set realistic deadlines</span>
                  </div>
                  
                  <div className="flex items-start gap-2 text-sm">
                    <div className="p-1 bg-purple-500/10 rounded mt-0.5">
                      <Brain className="w-3 h-3 text-purple-500" />
                    </div>
                    <span>Use AI predictor to check feasibility</span>
                  </div>
                </div>
              </div>

              {/* Achievement Progress */}
              <div className="glass-card p-5 border border-green-500/20">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Achievements
                </h3>
                
                <div className="space-y-2">
                  {achievements.slice(0, 3).map((ach) => (
                    <div 
                      key={ach.id} 
                      className={`flex items-center justify-between p-2 rounded ${ach.unlocked ? 'bg-green-500/10' : 'bg-secondary/30'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{ach.icon}</span>
                        <div>
                          <div className="text-sm font-medium">{ach.title}</div>
                          <div className="text-xs text-muted-foreground">{ach.desc}</div>
                        </div>
                      </div>
                      {ach.unlocked ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                  
                  {achievements.filter(a => a.unlocked).length > 0 && (
                    <div className="mt-3 pt-3 border-t text-center">
                      <div className="text-xs text-muted-foreground">
                        {achievements.filter(a => a.unlocked).length} of {achievements.length} unlocked
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 🚀 CREATE POT MODAL */}
      {showAddModal && (
        <Modal title="🔒 Create New Savings Pot" onClose={() => setShowAddModal(false)}>
          <form onSubmit={createGoal} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Pot Name</label>
              <Input 
                placeholder="e.g., New Laptop Fund 💻" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Target Amount (₹)</label>
              <Input 
                type="number" 
                placeholder="e.g., 75000" 
                value={target} 
                onChange={e => setTarget(e.target.value)} 
                required 
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Lock Until</label>
              <Input 
                type="date" 
                value={deadline} 
                onChange={e => setDeadline(e.target.value)} 
                required 
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select 
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full p-2 border rounded bg-background"
              >
                <option value="Personal">🎯 Personal</option>
                <option value="Travel">✈️ Travel</option>
                <option value="Education">🎓 Education</option>
                <option value="Home">🏠 Home</option>
                <option value="Vehicle">🚗 Vehicle</option>
                <option value="Emergency">🛡️ Emergency</option>
                <option value="Investment">📈 Investment</option>
                <option value="Gadgets">📱 Gadgets</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <Slider
                value={[priority]}
                onValueChange={([value]) => setPriority(value)}
                min={1}
                max={3}
                step={1}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>🔥 High</span>
                <span>⚡ Medium</span>
                <span>📊 Low</span>
              </div>
            </div>
            
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <LockIcon className="w-4 h-4" />
                🔒 Locked Savings Features
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>💰 Money is locked until goal completion</li>
                <li>📈 Shows as expense when added to pot</li>
                <li>🎯 Returns as income when claimed</li>
                <li>🛡️ Prevents impulsive spending</li>
                <li>🎖️ Earn bonus points for discipline</li>
              </ul>
            </div>
            
            <Button 
              type="submit" 
              className="w-full py-6 text-lg bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
              disabled={!name || !target || !deadline}
            >
              <Rocket className="w-5 h-5 mr-2" />
              Create Locked Pot
            </Button>
          </form>
        </Modal>
      )}

      {/* 🧠 AI PREDICTOR MODAL */}
      {showPredictModal && (
        <Modal title="🧠 AI Goal Success Predictor" onClose={() => setShowPredictModal(false)}>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🔮</div>
              <h3 className="text-lg font-semibold">Predict Your Goal Success</h3>
              <p className="text-sm text-muted-foreground">
                Enter your goal details to get AI-powered success prediction
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Savings (₹)</label>
                <Input
                  type="number"
                  placeholder="e.g., 5000"
                  value={pCurrent}
                  onChange={e => setPCurrent(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Target Amount (₹)</label>
                <Input
                  type="number"
                  placeholder="e.g., 200000"
                  value={pTarget}
                  onChange={e => setPTarget(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Deadline (days from now)</label>
                <Input
                  type="number"
                  placeholder="e.g., 30"
                  value={pDeadline}
                  onChange={e => setPDeadline(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Savings Consistency: {pConsistency[0] * 100}%
                </label>
                <Slider
                  value={pConsistency}
                  onValueChange={setPConsistency}
                  min={0}
                  max={1}
                  step={0.1}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>
            </div>
            
            <Button
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600"
              onClick={() => {
                const current = Number(pCurrent) || 0;
                const target = Number(pTarget) || 1;
                const days = Number(pDeadline) || 30;
                const consistency = pConsistency[0];
                
                if (target <= 0 || days <= 0) {
                  toast.error("Please enter valid target and deadline");
                  return;
                }
                
                const pred = predictGoalSuccess(current, target, days, consistency);
                setPrediction(pred);
              }}
            >
              <Brain className="w-5 h-5 mr-2" />
              Predict Success
            </Button>
            
            {prediction && (
              <div className="space-y-4 animate-in slide-in-from-bottom-5">
                <div className="p-4 rounded-lg border" style={{ 
                  background: `linear-gradient(90deg, 
                    ${prediction.color.replace('text-', '')}20 ${prediction.probability}%, 
                    transparent ${prediction.probability}%)`
                }}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-2xl">{prediction.icon}</div>
                    <Badge className={prediction.badgeColor}>
                      {prediction.achievementLevel}
                    </Badge>
                  </div>
                  
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold mb-1">
                      {prediction.probability}% Success Chance
                    </div>
                    <div className={`text-lg font-semibold ${prediction.color}`}>
                      {prediction.willAchieve ? "🎯 Likely to Achieve" : "⚠️ Needs Improvement"}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Daily Target</p>
                      <p className="font-bold">₹{prediction.requiredDaily.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-xs text-muted-foreground">Days Left</p>
                      <p className="font-bold">{prediction.daysToComplete}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI Insights
                  </h4>
                  {prediction.insights.map((insight, index) => (
                    <div key={index} className="p-3 bg-secondary/30 rounded-lg text-sm">
                      {insight}
                    </div>
                  ))}
                </div>
                
                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <h4 className="font-semibold mb-2 text-blue-600 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Recommendation
                  </h4>
                  <p className="text-sm">
                    {prediction.willAchieve 
                      ? "You're on track! Keep up your current saving habits."
                      : `Consider ${prediction.requiredDaily > 5000 ? "increasing your target timeline or " : ""}boosting your savings consistency.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* 💰 ADD MONEY MODAL */}
      {contributeGoal && (
        <Modal title={`💰 Add to ${contributeGoal.name}`} onClose={() => setContributeGoal(null)}>
          <form onSubmit={addContribution} className="space-y-6">
            <div className="text-center">
              <div className="text-3xl mb-2">{getGoalCategoryIcon(contributeGoal.name)}</div>
              <p className="text-sm text-muted-foreground">
                Current: ₹{contributeGoal.current.toLocaleString()} / ₹{contributeGoal.target.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Available Balance: ₹{currentBalance.toLocaleString()}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Lock Amount (₹)
              </label>
              <Input
                type="number"
                placeholder="Enter amount to lock"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="text-lg py-6"
                min="1"
                max={currentBalance}
              />
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[500, 1000, 5000, 10000].map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(amt.toString())}
                    className={Number(amount) === amt ? "border-primary bg-primary/10" : ""}
                    disabled={amt > currentBalance}
                  >
                    ₹{amt}
                  </Button>
                ))}
              </div>
            </div>
            
            {amount && (
              <div className="bg-secondary/30 p-4 rounded-lg border border-primary/20">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <LockIcon className="w-4 h-4" />
                  🔒 Locking Details
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>📉 Balance decreases by ₹{Number(amount).toLocaleString()}</li>
                  <li>📈 Pot increases by ₹{Number(amount).toLocaleString()}</li>
                  <li>🔒 Money locked until {new Date(contributeGoal.deadline).toLocaleDateString()}</li>
                  <li>🎖️ Earn {Math.floor(Number(amount) / 100) * 10} reward points</li>
                  <li>💪 {((contributeGoal.current + Number(amount)) / contributeGoal.target * 100).toFixed(1)}% to target</li>
                </ul>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full py-6 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              disabled={!amount || Number(amount) <= 0 || Number(amount) > currentBalance}
            >
              <LockIcon className="w-5 h-5 mr-2" />
              Lock ₹{Number(amount).toLocaleString()}
            </Button>
          </form>
        </Modal>
      )}

      {/* 🎉 CLAIM GOAL MODAL */}
      {showClaimModal && (
        <Modal title="🎉 Claim Your Rewards!" onClose={() => setShowClaimModal(null)}>
          <div className="space-y-6 text-center">
            <div className="text-5xl mb-2">🏆</div>
            <h3 className="text-lg font-semibold">Goal Achieved!</h3>
            <p className="text-sm text-muted-foreground">
              {showClaimModal.name}
            </p>
            
            <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
              <div className="text-xs text-muted-foreground">Amount to Claim</div>
              <div className="text-3xl font-bold text-green-600">
                ₹{showClaimModal.current.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Will be added to your available balance
              </div>
            </div>
            
            <div className="p-4 bg-secondary/30 rounded-lg text-left">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Celebration
              </h4>
              <p className="text-sm">
                {getAICelebration(showClaimModal.current, showClaimModal.name, true)}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowClaimModal(null)}
              >
                Not Now
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
                onClick={() => claimGoal(showClaimModal)}
              >
                <GiftIcon className="w-4 h-4 mr-2" />
                Claim Rewards
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 🔓 CRACK POT MODAL */}
      {showCrackPotModal && (
        <Modal title="🔓 Crack Savings Pot" onClose={() => setShowCrackPotModal(null)}>
          <div className="space-y-6 text-center">
            <div className="text-5xl mb-2">⚠️</div>
            <h3 className="text-lg font-semibold">Early Withdrawal</h3>
            <p className="text-sm text-muted-foreground">
              {showCrackPotModal.name}
            </p>
            
            <div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
              <div className="text-xs text-muted-foreground">Locked Amount</div>
              <div className="text-3xl font-bold text-orange-600">
                ₹{showCrackPotModal.current.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Will be released to your balance
              </div>
            </div>
            
            <div className="p-4 bg-secondary/30 rounded-lg text-left">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Considerations
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• You'll lose 100 reward points</li>
                <li>• This goal will be marked as "Cracked"</li>
                <li>• Money returns to available balance</li>
                <li>• Consider extending deadline instead</li>
              </ul>
            </div>
            
            <div className="p-4 bg-secondary/30 rounded-lg">
              <label className="block text-sm font-medium mb-2">Reason (Optional)</label>
              <select 
                className="w-full p-2 border rounded bg-background"
                onChange={(e) => {}}
              >
                <option value="emergency">🚨 Emergency Expense</option>
                <option value="change_of_plans">🔄 Change of Plans</option>
                <option value="found_better_deal">💡 Found Better Deal</option>
                <option value="other">❓ Other Reason</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowExtendModal(showCrackPotModal)}
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Extend Instead
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => crackPot(showCrackPotModal)}
              >
                <UnlockIcon className="w-4 h-4 mr-2" />
                Crack Pot
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ⏰ EXTEND DEADLINE MODAL */}
      {showExtendModal && (
        <Modal title="⏰ Extend Deadline" onClose={() => setShowExtendModal(null)}>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-3xl mb-2">📅</div>
              <h3 className="text-lg font-semibold">{showExtendModal.name}</h3>
              <p className="text-sm text-muted-foreground">
                Current deadline: {new Date(showExtendModal.deadline).toLocaleDateString()}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">New Deadline</label>
              <Input 
                type="date" 
                value={newDeadline}
                onChange={e => setNewDeadline(e.target.value)}
                min={new Date(showExtendModal.deadline).toISOString().split('T')[0]}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Extended {showExtendModal.extended_count || 0} time(s) before
              </p>
            </div>
            
            <div className="bg-secondary/30 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Recommendation
              </h4>
              <p className="text-sm">
                Extending gives you more time to reach your goal without penalties. 
                Consider if you can increase your daily savings instead.
              </p>
            </div>
            
            <Button 
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600"
              onClick={() => extendDeadline(showExtendModal)}
              disabled={!newDeadline}
            >
              <CalendarDays className="w-5 h-5 mr-2" />
              Extend Deadline
            </Button>
          </div>
        </Modal>
      )}

      {/* 📊 GOAL DETAILS MODAL */}
      {showGoalDetails && (
        <Modal title="📊 Goal Details" onClose={() => setShowGoalDetails(null)}>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-2">{getGoalCategoryIcon(showGoalDetails.name)}</div>
              <h3 className="text-lg font-semibold">{showGoalDetails.name}</h3>
              <div className="flex justify-center gap-4 mt-2">
                <Badge variant="outline" className="bg-primary/10">
                  Target: ₹{showGoalDetails.target.toLocaleString()}
                </Badge>
                <Badge variant="outline" className="bg-green-500/10">
                  Current: ₹{showGoalDetails.current.toLocaleString()}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Timeline
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(showGoalDetails.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Deadline</p>
                  <p className="font-medium">
                    {new Date(showGoalDetails.deadline).toLocaleDateString()}
                  </p>
                </div>
                {showGoalDetails.completed_at && (
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="font-medium text-green-600">
                      {new Date(showGoalDetails.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {showGoalDetails.claimed_at && (
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <p className="text-xs text-muted-foreground">Claimed</p>
                    <p className="font-medium text-purple-600">
                      {showGoalDetails.claimed_at ? new Date(showGoalDetails.claimed_at).toLocaleDateString() : "Not claimed"}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Transaction History
              </h4>
              {goalTransactions.length > 0 ? (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {goalTransactions.map((transaction, index) => (
                    <div key={index} className="p-3 bg-secondary/30 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{transaction.narration}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.transaction_timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`font-bold ${transaction.type === "CREDIT" ? "text-green-600" : "text-red-600"}`}>
                        {transaction.type === "CREDIT" ? "+" : "-"}₹{transaction.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-secondary/30 rounded-lg">
                  <Receipt className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No transactions found</p>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Insights
              </h4>
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-sm">{getAISavingsAdvice(showGoalDetails)}</p>
                {isClaimed(showGoalDetails) && (
                  <div className="mt-3 p-2 bg-green-500/10 rounded">
                    <p className="text-xs text-green-600">
                      ✅ Successfully claimed and added to your balance on {showGoalDetails.claimed_at ? new Date(showGoalDetails.claimed_at).toLocaleDateString() : "recently"}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowGoalDetails(null)}
              >
                Close
              </Button>
              {!isClaimed(showGoalDetails) && !showGoalDetails.is_deleted && (
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowGoalDetails(null);
                    setContributeGoal(showGoalDetails);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Money
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* MODAL COMPONENT */
const Modal = ({ title, children, onClose }: any) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div 
      className="glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
);