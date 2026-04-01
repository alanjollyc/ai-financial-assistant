import { useState, useMemo, useEffect, useCallback } from "react";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  Lightbulb,
  PiggyBank,
  ArrowRight,
  Sparkles,
  Target,
  Wallet,
  Brain,
  Zap,
  Cpu,
  Eye,
  MessageCircle,
  BarChart3,
  Globe,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
  ScatterChart,
  Scatter,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

/* ---------------- ADVANCED ML HELPERS ---------------- */

// K-Means Clustering for Expense Pattern Recognition
const kMeansClustering = (data: number[], k: number = 3) => {
  if (data.length < k) return data.map(d => ({ avg: d, size: 1 }));
  
  // Initialize centroids with k-means++
  const centroids = [data[Math.floor(Math.random() * data.length)]];
  for (let i = 1; i < k; i++) {
    const distances = data.map(point => 
      Math.min(...centroids.map(c => Math.abs(point - c)))
    );
    const sum = distances.reduce((a, b) => a + b, 0);
    const rand = Math.random() * sum;
    let cumulative = 0;
    for (let j = 0; j < distances.length; j++) {
      cumulative += distances[j];
      if (cumulative >= rand) {
        centroids.push(data[j]);
        break;
      }
    }
  }

  // Iterate until convergence
  let clusters: number[][] = Array.from({ length: k }, () => []);
  let changed = true;
  let iterations = 0;
  const maxIterations = 100;

  while (changed && iterations < maxIterations) {
    changed = false;
    clusters = Array.from({ length: k }, () => []);
    
    data.forEach(value => {
      const distances = centroids.map(c => Math.abs(value - c));
      const clusterIndex = distances.indexOf(Math.min(...distances));
      clusters[clusterIndex].push(value);
    });

    const newCentroids = clusters.map(cluster => 
      cluster.length > 0 ? cluster.reduce((a, b) => a + b, 0) / cluster.length : centroids[clusters.indexOf(cluster)]
    );

    if (!centroids.every((c, i) => Math.abs(c - newCentroids[i]) < 0.01)) {
      centroids.splice(0, centroids.length, ...newCentroids);
      changed = true;
    }
    iterations++;
  }

  return clusters.map(cluster => ({
    avg: cluster.reduce((a, b) => a + b, 0) / cluster.length,
    size: cluster.length,
  }));
};

// Advanced Anomaly Detection using Modified Z-Score
const detectAnomalies = (data: number[]) => {
  if (data.length < 3) return data.map((val, idx) => ({ value: val, index: idx, zScore: 0, isAnomaly: false }));
  
  const median = [...data].sort((a, b) => a - b)[Math.floor(data.length / 2)];
  const mad = data.reduce((sum, val) => sum + Math.abs(val - median), 0) / data.length;
  
  return data.map((val, idx) => {
    const modifiedZScore = mad === 0 ? 0 : 0.6745 * (val - median) / mad;
    return {
      value: val,
      index: idx,
      zScore: modifiedZScore,
      isAnomaly: Math.abs(modifiedZScore) > 3.5, // Robust threshold
    };
  });
};

// Seasonal Decomposition for Trend Analysis
const seasonalDecomposition = (data: number[], period: number = 12) => {
  if (data.length < period * 2) return { trend: data, seasonal: new Array(data.length).fill(0), residual: data };
  
  // Simple moving average for trend
  const trend = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(period / 2));
    const end = Math.min(data.length, i + Math.floor(period / 2) + 1);
    const slice = data.slice(start, end);
    trend.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  
  // Seasonal component (simplified)
  const seasonal = new Array(data.length).fill(0);
  for (let i = 0; i < period; i++) {
    const indices = [];
    for (let j = i; j < data.length; j += period) {
      indices.push(j);
    }
    const avg = indices.reduce((sum, idx) => sum + (data[idx] - trend[idx]), 0) / indices.length;
    indices.forEach(idx => seasonal[idx] = avg);
  }
  
  const residual = data.map((val, i) => val - trend[i] - seasonal[i]);
  
  return { trend, seasonal, residual };
};

// Predictive Optimization using ARIMA-like Model
const predictiveOptimization = (historicalData: number[], futureMonths: number = 12) => {
  if (historicalData.length < 6) {
    // Fallback to simple linear regression
    const n = historicalData.length;
    const xMean = (n - 1) / 2;
    const yMean = historicalData.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (historicalData[i] - yMean);
      denominator += (i - xMean) ** 2;
    }
    
    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;
    
    const predictions = [];
    for (let i = 0; i < futureMonths; i++) {
      const predicted = slope * (n + i) + intercept;
      const optimal = Math.max(0, predicted * 0.75); // Conservative reduction
      predictions.push({ month: i + 1, predicted, optimal, savings: predicted - optimal });
    }
    return predictions;
  }

  // ARIMA-inspired prediction
  const { trend, seasonal } = seasonalDecomposition(historicalData);
  
  // Fit trend line
  const n = trend.length;
  const xMean = (n - 1) / 2;
  const yMean = trend.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (trend[i] - yMean);
    denominator += (i - xMean) ** 2;
  }
  
  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;
  
  const predictions = [];
  for (let i = 0; i < futureMonths; i++) {
    const trendValue = slope * (n + i) + intercept;
    const seasonalValue = seasonal[i % seasonal.length] || 0;
    const predicted = trendValue + seasonalValue;
    
    // ML-optimized reduction based on historical patterns
    const historicalReductions = historicalData.map((val, idx) => 
      idx > 0 ? Math.max(0, historicalData[idx - 1] - val) : 0
    ).filter(r => r > 0);
    
    const avgReduction = historicalReductions.length > 0 
      ? historicalReductions.reduce((a, b) => a + b, 0) / historicalReductions.length
      : predicted * 0.2;
    
    const optimal = Math.max(0, predicted - avgReduction);
    predictions.push({ month: i + 1, predicted, optimal, savings: predicted - optimal });
  }
  
  return predictions;
};

// Enhanced Waste Detection with Multiple ML Techniques
const detectWasteML = (current: number, historical: number[], category: string) => {
  if (historical.length === 0) {
    return { reducible: Math.round(current * 0.15), wasteScore: 0.5, optimal: Math.round(current * 0.85), isAnomaly: false };
  }

  const anomalies = detectAnomalies(historical);
  const clusters = kMeansClustering(historical);
  
  // Determine optimal based on cluster analysis and trend
  const sortedClusters = clusters.sort((a, b) => a.avg - b.avg);
  const optimalCluster = sortedClusters[Math.floor(sortedClusters.length / 2)]; // Median cluster
  const trendAdjustment = historical.length > 1 ? (historical[historical.length - 1] - historical[0]) / historical.length : 0;
  
  let optimal = Math.max(0, optimalCluster.avg + trendAdjustment);
  
  // Adjust based on category type (domain knowledge)
  const categoryMultipliers: Record<string, number> = {
    'Food': 0.85,
    'Transportation': 0.9,
    'Entertainment': 0.75,
    'Shopping': 0.8,
    'Utilities': 0.95,
    'Healthcare': 0.9,
    'Education': 0.85,
  };
  
  const multiplier = categoryMultipliers[category] || 0.85;
  optimal = Math.max(0, optimal * multiplier);
  
  const deviation = current - optimal;
  const wasteScore = optimal > 0 ? Math.max(0, deviation / optimal) : 0;
  const reducible = Math.round(Math.max(0, current - optimal));
  
  return { 
    reducible, 
    wasteScore, 
    optimal: Math.round(optimal), 
    isAnomaly: anomalies[anomalies.length - 1]?.isAnomaly || false 
  };
};

// Calculate Optimization with Confidence Intervals
const calculateOptimizationML = (current: number, optimal: number, historical: number[]) => {
  const reduction = current - optimal;
  const percentage = current > 0 ? Math.round((reduction / current) * 100) : 0;
  
  // Confidence based on data quality and consistency
  let confidence = 50;
  if (historical.length > 12) confidence += 20;
  if (historical.length > 6) confidence += 15;
  
  const std = historical.length > 1 ? Math.sqrt(
    historical.reduce((sum, val) => sum + Math.pow(val - (historical.reduce((a, b) => a + b, 0) / historical.length), 2), 0) / historical.length
  ) : 0;
  
  const cv = std / (historical.reduce((a, b) => a + b, 0) / historical.length); // Coefficient of variation
  confidence += Math.max(0, 20 - cv * 100);
  
  confidence = Math.min(95, Math.max(45, confidence));
  
  return { reduction, percentage, confidence };
};

export default function Investment() {
  const navigate = useNavigate();
  const [showOptimized, setShowOptimized] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [predictiveData, setPredictiveData] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  /* ---------------- FETCH TRANSACTIONS ---------------- */
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsAnalyzing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("transactions")
        .select("amount, category, date, type")
        .eq("user_id", user.id)
        .eq("type", "DEBIT");

      if (error) {
        console.error(error);
        return;
      }

      setTransactions(data || []);
      setIsAnalyzing(false);
    };

    fetchTransactions();
  }, []);

  /* ---------------- PREP DATA WITH ENHANCED ML ---------------- */
  const expenseHistory = useMemo(() => {
    const categoryMap: Record<string, number[]> = {};

    transactions.forEach(t => {
      if (!categoryMap[t.category]) categoryMap[t.category] = [];
      categoryMap[t.category].push(Number(t.amount));
    });

    return Object.entries(categoryMap).map(([category, amounts]) => {
      const sortedAmounts = amounts.sort((a, b) => a - b);
      const current = amounts[amounts.length - 1] || 0;
      const historical = amounts.slice(0, -1);
      const median = sortedAmounts[Math.floor(sortedAmounts.length / 2)] || current;
      
      return { category, current, historical, median };
    });
  }, [transactions]);

  /* ---------------- ADVANCED ML ANALYSIS ---------------- */
  const wasteAnalysis = useMemo(() => {
    return expenseHistory.map(item => {
      const waste = detectWasteML(item.current, item.historical, item.category);
      const opt = calculateOptimizationML(item.current, waste.optimal, item.historical);
      return { ...item, ...waste, ...opt };
    });
  }, [expenseHistory]);

  const totalReducible = wasteAnalysis.reduce((s, i) => s + i.reducible, 0);
  const totalCurrent = wasteAnalysis.reduce((s, i) => s + i.current, 0);
  const avgConfidence = wasteAnalysis.reduce((s, i) => s + i.confidence, 0) / wasteAnalysis.length;
  const anomalyCount = wasteAnalysis.filter(i => i.isAnomaly).length;

  // Predictive Analytics
  useEffect(() => {
    if (wasteAnalysis.length > 0) {
      const allHistorical = wasteAnalysis.flatMap(i => i.historical);
      const predictions = predictiveOptimization(allHistorical, 12);
      setPredictiveData(predictions);
      
      // Generate AI Insights
      const insights = [
        `ML Analysis: ${anomalyCount} anomalous spending patterns detected using modified Z-score`,
        `Optimization Confidence: ${Math.round(avgConfidence)}% based on historical data consistency`,
        `Predictive Savings: ₹${predictions.reduce((s, p) => s + p.savings, 0).toLocaleString()} over next year using ARIMA-inspired model`,
        `Top Waste Category: ${wasteAnalysis.sort((a, b) => b.reducible - a.reducible)[0]?.category || 'N/A'} with ${wasteAnalysis.sort((a, b) => b.reducible - a.reducible)[0]?.percentage || 0}% optimization potential`,
        `Data Quality: ${wasteAnalysis.filter(i => i.historical.length > 6).length} categories have sufficient historical data for accurate predictions`,
      ];
      setAiInsights(insights);
    }
  }, [wasteAnalysis, avgConfidence, anomalyCount]);

  const chartData = wasteAnalysis.map(i => ({
    category: i.category,
    "Current Spending": i.current,
    "Optimized Spending": i.optimal,
    "Confidence": i.confidence,
  }));

  const predictiveChartData = predictiveData.map(p => ({
    month: `Month ${p.month}`,
    "Predicted Spending": p.predicted,
    "Optimized Spending": p.optimal,
    "Monthly Savings": p.savings,
  }));

  const categoryDetail = selectedCategory ? wasteAnalysis.find(i => i.category === selectedCategory) : null;
  const categoryChartData = categoryDetail ? categoryDetail.historical.map((val, idx) => ({
    month: idx + 1,
    spending: val,
    isAnomaly: detectAnomalies(categoryDetail.historical)[idx].isAnomaly,
  })) : [];

  /* ---------------- UI ---------------- */
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* HEADER */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Investment Insights</h1>
                <p className="text-muted-foreground">
                  Advanced ML-powered expense optimization & predictive investment planning
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  <Brain className="w-3 h-3 mr-1" />
                  Advanced ML
                </Badge>
                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-primary">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </div>
                )}
              </div>
            </div>

            {/* AI INSIGHTS ALERT */}
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                <strong>Advanced ML Analysis:</strong> Using K-means clustering, modified Z-score anomaly detection, seasonal decomposition, and ARIMA-inspired predictive modeling for crystal-clear optimization recommendations.
              </AlertDescription>
            </Alert>

            {/* TOTAL INVESTABLE */}
            <Card className="bg-gradient-to-r from-primary/10 to-background">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Monthly Investable Amount (ML-Optimized)
                  </p>

                  <h2 className="text-4xl font-bold text-primary">
                    ₹{totalReducible.toLocaleString()}
                  </h2>

                  <p className="text-emerald-500 text-sm flex items-center">
                    <TrendingUp className="inline w-4 h-4 mr-1" />
                    {totalCurrent > 0
                      ? Math.round((totalReducible / totalCurrent) * 100)
                      : 0}
                    % savings potential detected | Confidence: {Math.round(avgConfidence)}%
                  </p>
                </div>

                <Button size="lg" onClick={() => navigate("/stocks")}>
                  <PiggyBank className="w-5 h-5 mr-2" />
                  Invest ₹{totalReducible.toLocaleString()}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            {/* AI INSIGHTS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {aiInsights.map((insight, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-primary" />
                      <p className="text-sm">{insight}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* GRID */}
            <div className="grid lg:grid-cols-2 gap-6">

              {/* CATEGORY WASTE WITH ML */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex gap-2">
                    <Target className="text-primary" />
                    Neural Waste Detection
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Advanced ML: Clustering + Anomaly Detection + Regression
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {wasteAnalysis
                    .sort((a, b) => b.reducible - a.reducible)
                    .map(item => (
                      <div
                        key={item.category}
                        className="space-y-2 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => setSelectedCategory(item.category)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{item.category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-500 font-semibold">
                              ₹{item.reducible.toLocaleString()} reducible
                            </span>
                            {item.isAnomaly && <Badge variant="destructive">Anomaly</Badge>}
                          </div>
                        </div>

                        <div className="flex gap-2 text-sm text-muted-foreground">
                          <span>Current ₹{item.current}</span>
                          <span>→</span>
                          <span>Optimal ₹{item.optimal}</span>
                          <span className="text-primary">
                            ({item.percentage}%) | Conf: {item.confidence}%
                          </span>
                        </div>

                        <Progress value={100 - item.percentage} className="h-2" />
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* SMART STRATEGY WITH PREDICTIVE */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex gap-2">
                    <Lightbulb className="text-amber-500" />
                    Predictive Saving Strategy
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded">
                    <p>
                      ML-driven optimization suggests investing{" "}
                      <span className="font-bold text-emerald-500">
                        ₹{totalReducible.toLocaleString()}
                      </span>{" "}
                      monthly, with predictive models forecasting{" "}
                      <span className="font-bold text-purple-500">
                        ₹{predictiveData.reduce((s, p) => s + p.savings, 0).toLocaleString()}
                      </span>{" "}
                      annual savings.
                    </p>
                  </div>

                  {wasteAnalysis.slice(0, 3).map(i => (
                    <div
                      key={i.category}
                      className="flex justify-between p-3 bg-muted rounded"
                    >
                      <span>{i.category}</span>
                      <span className="text-emerald-500">
                        Save ₹{i.reducible}
                      </span>
                    </div>
                  ))}

                  <div className="p-4 bg-emerald-500/10 rounded">
                    <Wallet className="inline mr-2" />
                    <span>
                      Annual Potential: ₹{(totalReducible * 12).toLocaleString()} | 
                      Predictive: ₹{(predictiveData.reduce((s, p) => s + p.savings, 0)).toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CATEGORY DETAIL VIEW */}
            {selectedCategory && categoryDetail && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span className="flex gap-2">
                      <Eye className="text-primary" />
                      Deep Analysis: {selectedCategory}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                    >
                      Close
                    </Button>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Historical spending patterns with anomaly detection
                  </p>
                </CardHeader>

                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Spending Trend</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={categoryChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="spending"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={(props: any) => (
                              <circle
                                cx={props.cx}
                                cy={props.cy}
                                r={props.payload.isAnomaly ? 6 : 4}
                                fill={props.payload.isAnomaly ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                              />
                            )}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-4">
                      <div className="p-3 bg-muted/50 rounded">
                        <p className="text-sm">
                          <strong>Current:</strong> ₹{categoryDetail.current}
                        </p>
                        <p className="text-sm">
                          <strong>Optimal:</strong> ₹{categoryDetail.optimal}
                        </p>
                        <p className="text-sm">
                          <strong>Reduction:</strong> {categoryDetail.percentage}%
                        </p>
                        <p className="text-sm">
                          <strong>Confidence:</strong> {categoryDetail.confidence}%
                        </p>
                      </div>

                      {categoryDetail.isAnomaly && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Anomalous spending detected! This month's expense is significantly higher than historical patterns.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* PREDICTIVE CHART */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Predictive Savings Trajectory (12 Months)
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  ARIMA-inspired forecasting with seasonal adjustments
                </p>
              </CardHeader>

              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={predictiveChartData}>
                    <defs>
                      <linearGradient id="predictiveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="Predicted Spending"
                      stroke="hsl(var(--primary))"
                      fill="url(#predictiveGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="Optimized Spending"
                      stroke="hsl(var(--chart-2))"
                      fill="url(#predictiveGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* COMPARATIVE CHART */}
            <Card>
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Before vs After Optimization</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setShowOptimized(!showOptimized)}
                >
                  {showOptimized ? "Show Current" : "Show Optimized"}
                </Button>
              </CardHeader>

              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="Current Spending"
                      fill="hsl(var(--destructive))"
                      opacity={showOptimized ? 0.3 : 1}
                    />
                    <Bar
                      dataKey="Optimized Spending"
                      fill="hsl(var(--primary))"
                      opacity={showOptimized ? 1 : 0.3}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-2">
                  Ready to Grow Your Wealth?
                </h3>
                <p className="mb-6 opacity-90">
                  Explore AI-powered stock predictions and investment strategies
                </p>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate("/stocks")}
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Explore Stock Market AI
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </div>
  );
};