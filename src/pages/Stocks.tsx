import { useState, useMemo, useEffect, useCallback } from "react";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  Activity,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  RefreshCw,
  Brain,
  Shield,
  Target,
  Users,
  Play,
  Pause,
  AlertCircle,
  BrainCircuit,
  CircuitBoard,
  Sparkles,
  Database,
  LineChart as LineChartIcon,
  BarChart as BarChartIcon,
  PieChart,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart as RechartsBarChart,
  Bar,
  ComposedChart,
  ReferenceLine,
  Brush,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
  Legend,
} from "recharts";

// Enhanced Stock/Crypto base prices with realistic values
const assetConfigs: Record<string, {
  name: string;
  sector: string;
  basePrice: number;
  currency: string;
  type: 'stock' | 'crypto';
  volatility: number;
  aiSentiment: number;
  marketCap: number;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  aiRating: number;
  currentTrend: 'up' | 'down' | 'sideways';
  trendStrength: number;
}> = {
  AAPL: {
    name: "Apple Inc.",
    sector: "Technology",
    basePrice: 185.50,
    currency: "$",
    type: 'stock',
    volatility: 0.018,
    aiSentiment: 0.75,
    marketCap: 2.8e12,
    description: "Consumer electronics and services",
    riskLevel: 'low',
    aiRating: 8.5,
    currentTrend: 'up',
    trendStrength: 0.7,
  },
  GOOGL: {
    name: "Alphabet Inc.",
    sector: "Technology",
    basePrice: 142.30,
    currency: "$",
    type: 'stock',
    volatility: 0.022,
    aiSentiment: 0.78,
    marketCap: 1.8e12,
    description: "Search engine and cloud computing",
    riskLevel: 'medium',
    aiRating: 8.2,
    currentTrend: 'up',
    trendStrength: 0.6,
  },
  MSFT: {
    name: "Microsoft Corp.",
    sector: "Technology",
    basePrice: 379.25,
    currency: "$",
    type: 'stock',
    volatility: 0.016,
    aiSentiment: 0.82,
    marketCap: 2.9e12,
    description: "Software and cloud services",
    riskLevel: 'low',
    aiRating: 8.8,
    currentTrend: 'up',
    trendStrength: 0.8,
  },
  AMZN: {
    name: "Amazon.com Inc.",
    sector: "E-Commerce",
    basePrice: 177.80,
    currency: "$",
    type: 'stock',
    volatility: 0.025,
    aiSentiment: 0.68,
    marketCap: 1.8e12,
    description: "Online retail and cloud computing",
    riskLevel: 'medium',
    aiRating: 7.8,
    currentTrend: 'sideways',
    trendStrength: 0.3,
  },
  TSLA: {
    name: "Tesla Inc.",
    sector: "Automotive",
    basePrice: 247.90,
    currency: "$",
    type: 'stock',
    volatility: 0.045,
    aiSentiment: 0.65,
    marketCap: 790e9,
    description: "Electric vehicles and clean energy",
    riskLevel: 'high',
    aiRating: 7.0,
    currentTrend: 'down',
    trendStrength: 0.6,
  },
  META: {
    name: "Meta Platforms",
    sector: "Technology",
    basePrice: 504.80,
    currency: "$",
    type: 'stock',
    volatility: 0.035,
    aiSentiment: 0.72,
    marketCap: 1.3e12,
    description: "Social media and metaverse",
    riskLevel: 'medium',
    aiRating: 7.5,
    currentTrend: 'up',
    trendStrength: 0.5,
  },
  NVDA: {
    name: "NVIDIA Corp.",
    sector: "Semiconductors",
    basePrice: 874.50,
    currency: "$",
    type: 'stock',
    volatility: 0.032,
    aiSentiment: 0.88,
    marketCap: 2.2e12,
    description: "Graphics processors and AI chips",
    riskLevel: 'medium',
    aiRating: 9.0,
    currentTrend: 'up',
    trendStrength: 0.9,
  },
  BTC: {
    name: "Bitcoin",
    sector: "Cryptocurrency",
    basePrice: 67420,
    currency: "$",
    type: 'crypto',
    volatility: 0.055,
    aiSentiment: 0.62,
    marketCap: 1.3e12,
    description: "Digital cryptocurrency",
    riskLevel: 'high',
    aiRating: 6.5,
    currentTrend: 'sideways',
    trendStrength: 0.4,
  },
  ETH: {
    name: "Ethereum",
    sector: "Cryptocurrency",
    basePrice: 3645,
    currency: "$",
    type: 'crypto',
    volatility: 0.048,
    aiSentiment: 0.70,
    marketCap: 438e9,
    description: "Smart contract platform",
    riskLevel: 'high',
    aiRating: 7.2,
    currentTrend: 'up',
    trendStrength: 0.5,
  },
  SOL: {
    name: "Solana",
    sector: "Cryptocurrency",
    basePrice: 144.90,
    currency: "$",
    type: 'crypto',
    volatility: 0.065,
    aiSentiment: 0.58,
    marketCap: 65e9,
    description: "High-performance blockchain",
    riskLevel: 'high',
    aiRating: 6.0,
    currentTrend: 'down',
    trendStrength: 0.7,
  },
};

// Realistic news events
const newsEvents = [
  { symbol: "TSLA", event: "Q4 deliveries miss estimates", impact: -0.04, sentiment: 0.3 },
  { symbol: "NVDA", event: "New AI chip announcement", impact: 0.035, sentiment: 0.85 },
  { symbol: "AAPL", event: "Vision Pro pre-orders strong", impact: 0.025, sentiment: 0.75 },
  { symbol: "MSFT", event: "Azure growth exceeds expectations", impact: 0.03, sentiment: 0.80 },
  { symbol: "BTC", event: "ETF approval speculation", impact: 0.02, sentiment: 0.65 },
];

// Generate realistic historical data with proper trends
const generateHistoricalData = (basePrice: number, config: any) => {
  const data: Array<{
    date: string;
    price: number;
    volume: number;
    timestamp: number;
    rsi: number;
    macd: number;
    sentiment: number;
    bollingerUpper: number;
    bollingerLower: number;
    stochastic: number;
    obv: number;
    atr: number;
    vwap: number;
  }> = [];
  
  let currentPrice = basePrice;
  let prices: number[] = [];
  let cumulativeVolume = 0;
  
  // Determine trend direction
  const trendDirection = config.currentTrend === 'up' ? 1 : config.currentTrend === 'down' ? -1 : 0;
  const dailyTrend = (trendDirection * config.trendStrength * 0.001); // 0.1% daily trend
  
  for (let i = 89; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Realistic price movement: trend + mean reversion + noise
    const meanReversion = (basePrice - currentPrice) * 0.0005; // Slight mean reversion
    const noise = (Math.random() - 0.5) * config.volatility;
    
    // Add some cyclical patterns
    const cycle = Math.sin(i / 20) * config.volatility * 0.5;
    
    // Random news impact
    const newsImpact = newsEvents
      .filter(e => e.symbol === config.symbol)
      .reduce((sum, e) => sum + e.impact * (Math.random() > 0.7 ? 1 : 0), 0);
    
    const dailyChange = dailyTrend + meanReversion + noise + cycle + newsImpact;
    
    // Ensure reasonable daily changes (typically ±5%)
    const boundedChange = Math.max(-0.05, Math.min(0.05, dailyChange));
    currentPrice = currentPrice * (1 + boundedChange);
    
    // Ensure price stays positive and reasonable
    currentPrice = Math.max(basePrice * 0.3, Math.min(basePrice * 3, currentPrice));
    
    prices.push(currentPrice);
    const volume = Math.floor(1000000 + Math.random() * 2000000);
    cumulativeVolume += volume;
    
    // Calculate technical indicators
    const rsi = 40 + Math.sin(i / 10) * 15 + (Math.random() - 0.5) * 10;
    const macd = Math.sin(i / 15) * 5 + (Math.random() - 0.5) * 2;
    const stochastic = 40 + Math.sin(i / 12) * 25 + (Math.random() - 0.5) * 15;
    
    // Bollinger Bands
    let bollingerUpper, bollingerLower;
    if (prices.length >= 20) {
      const slice = prices.slice(-20);
      const mean = slice.reduce((a, b) => a + b) / slice.length;
      const std = Math.sqrt(slice.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / slice.length);
      bollingerUpper = mean + 2 * std;
      bollingerLower = mean - 2 * std;
    } else {
      bollingerUpper = currentPrice * 1.02;
      bollingerLower = currentPrice * 0.98;
    }
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: Math.round(currentPrice * 100) / 100,
      volume,
      timestamp: date.getTime(),
      rsi: Math.round(rsi * 100) / 100,
      macd: Math.round(macd * 100) / 100,
      sentiment: config.aiSentiment,
      bollingerUpper: Math.round(bollingerUpper * 100) / 100,
      bollingerLower: Math.round(bollingerLower * 100) / 100,
      stochastic: Math.round(stochastic * 100) / 100,
      obv: cumulativeVolume,
      atr: Math.round(config.volatility * currentPrice * 100) / 100,
      vwap: Math.round(cumulativeVolume / data.length * 100) / 100,
    });
  }
  
  return data;
};

// Initialize stocks data
const initializeStocksData = () => {
  const data: Record<string, ReturnType<typeof generateHistoricalData>> = {};
  
  Object.entries(assetConfigs).forEach(([symbol, config]) => {
    data[symbol] = generateHistoricalData(config.basePrice, { ...config, symbol });
  });
  
  return data;
};

// Realistic prediction model
const realisticPrediction = (prices: number[], sentiment: number, volatility: number, currentTrend: string, trendStrength: number) => {
  const lastPrice = prices[prices.length - 1];
  const recentPrices = prices.slice(-20);
  
  // Calculate momentum
  const momentum = recentPrices.length > 1 
    ? (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0]
    : 0;
  
  // Simple moving average trend
  const sma10 = recentPrices.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, recentPrices.length);
  const sma20 = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
  
  // Determine trend continuation probability
  let trendProbability = 0.6; // Base probability
  
  if (currentTrend === 'up') {
    trendProbability = 0.7 * trendStrength;
  } else if (currentTrend === 'down') {
    trendProbability = 0.3 * trendStrength;
  } else {
    trendProbability = 0.5;
  }
  
  // Calculate expected return (realistic range: ±15% max)
  const maxReturn = 0.15 * trendStrength;
  const minReturn = -0.15 * trendStrength;
  
  // Weighted prediction: 40% trend, 30% momentum, 20% sentiment, 10% random
  const trendComponent = (currentTrend === 'up' ? maxReturn : currentTrend === 'down' ? minReturn : 0) * 0.4;
  const momentumComponent = Math.max(minReturn, Math.min(maxReturn, momentum * 2)) * 0.3;
  const sentimentComponent = ((sentiment - 0.5) * 0.1) * 0.2;
  const randomComponent = (Math.random() - 0.5) * volatility * 0.1;
  
  const expectedReturn = trendComponent + momentumComponent + sentimentComponent + randomComponent;
  
  // Bound the return realistically
  const boundedReturn = Math.max(minReturn, Math.min(maxReturn, expectedReturn));
  
  // Calculate confidence based on trend strength and recent volatility
  const recentVolatility = Math.sqrt(
    recentPrices.slice(1).reduce((sum, price, i) => {
      const change = (price - recentPrices[i]) / recentPrices[i];
      return sum + change * change;
    }, 0) / (recentPrices.length - 1)
  );
  
  const confidence = Math.max(40, Math.min(90, 
    (trendStrength * 70) + 
    ((1 - recentVolatility / volatility) * 20) +
    (sentiment * 10)
  ));
  
  return {
    predictedPrice: lastPrice * (1 + boundedReturn),
    changePercent: boundedReturn * 100,
    confidence,
    trend: boundedReturn > 0.02 ? "up" : boundedReturn < -0.02 ? "down" : "neutral",
    momentum: momentum * 100,
    supportLevel: lastPrice * 0.95,
    resistanceLevel: lastPrice * 1.05,
  };
};

// Calculate volume profile data
const calculateVolumeProfile = (data: any[]) => {
  const priceLevels: Record<number, number> = {};
  
  data.forEach(item => {
    const priceLevel = Math.round(item.price);
    priceLevels[priceLevel] = (priceLevels[priceLevel] || 0) + item.volume;
  });
  
  return Object.entries(priceLevels)
    .map(([price, volume]) => ({
      price: parseFloat(price),
      volume,
    }))
    .sort((a, b) => a.price - b.price)
    .slice(0, 20); // Top 20 price levels
};

// Pattern recognition simulation
const detectPatterns = (data: any[]) => {
  const patterns = [];
  const prices = data.map(d => d.price);
  
  // Check for double top/bottom
  if (prices.length >= 10) {
    const recent = prices.slice(-10);
    const max = Math.max(...recent);
    const min = Math.min(...recent);
    
    // Check if price is near recent high/low multiple times
    const nearHigh = recent.filter(p => p > max * 0.98).length;
    const nearLow = recent.filter(p => p < min * 1.02).length;
    
    if (nearHigh >= 2) {
      patterns.push({
        name: "Resistance Test",
        confidence: 70,
        implication: "Potential reversal if resistance holds",
      });
    }
    
    if (nearLow >= 2) {
      patterns.push({
        name: "Support Test",
        confidence: 70,
        implication: "Potential bounce if support holds",
      });
    }
  }
  
  // Add trend-based patterns
  const last5 = prices.slice(-5);
  const trend = last5[4] - last5[0];
  
  if (Math.abs(trend / last5[0]) > 0.05) {
    patterns.push({
      name: trend > 0 ? "Strong Uptrend" : "Strong Downtrend",
      confidence: 75,
      implication: trend > 0 ? "Continue long positions" : "Consider short positions",
    });
  }
  
  return patterns.length > 0 ? patterns : [{
    name: "No clear pattern",
    confidence: 50,
    implication: "Market in consolidation phase",
  }];
};

const Stocks = () => {
  const [selectedStock, setSelectedStock] = useState("AAPL");
  const [predictionDays, setPredictionDays] = useState(7);
  const [stocksData, setStocksData] = useState(initializeStocksData);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [alerts, setAlerts] = useState<any[]>([]);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [selectedTimeframe, setSelectedTimeframe] = useState("1D");

  const stockInfo = stocksData[selectedStock];
  const config = assetConfigs[selectedStock];
  
  // Realistic prediction
  const prediction = useMemo(() => {
    const prices = stockInfo.map(d => d.price);
    return realisticPrediction(
      prices, 
      config.aiSentiment, 
      config.volatility,
      config.currentTrend,
      config.trendStrength
    );
  }, [stockInfo, config]);

  // Volume profile data
  const volumeProfileData = useMemo(() => {
    return calculateVolumeProfile(stockInfo.slice(-30));
  }, [stockInfo]);

  // Pattern detection
  const patterns = useMemo(() => {
    return detectPatterns(stockInfo.slice(-20));
  }, [stockInfo]);

  // Technical indicators for display
  const technicalIndicators = useMemo(() => {
    const last = stockInfo[stockInfo.length - 1];
    const prev = stockInfo[stockInfo.length - 2];
    const change = ((last.price - prev.price) / prev.price) * 100;
    
    return {
      rsi: last.rsi,
      macd: last.macd,
      stochastic: last.stochastic,
      atr: last.atr,
      vwap: last.vwap,
      dailyChange: change,
      volume: last.volume,
      volumeChange: ((last.volume - prev.volume) / prev.volume) * 100,
    };
  }, [stockInfo]);

  // Realistic price updates
  const updatePrices = useCallback(() => {
    setStocksData(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(symbol => {
        const config = assetConfigs[symbol];
        const lastData = updated[symbol];
        const lastPrice = lastData[lastData.length - 1].price;
        
        // Realistic price change: ±2% max
        const trendEffect = config.currentTrend === 'up' ? 0.0005 : 
                          config.currentTrend === 'down' ? -0.0005 : 0;
        
        const noise = (Math.random() - 0.5) * config.volatility * 0.5;
        const meanReversion = (config.basePrice - lastPrice) * 0.0001;
        
        const change = trendEffect + noise + meanReversion;
        const boundedChange = Math.max(-0.02, Math.min(0.02, change));
        
        const newPrice = lastPrice * (1 + boundedChange);
        
        // Update data
        const newDate = new Date();
        const newDataPoint = {
          ...lastData[lastData.length - 1],
          date: newDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: Math.round(newPrice * 100) / 100,
          timestamp: newDate.getTime(),
          volume: Math.floor(lastData[lastData.length - 1].volume * (0.8 + Math.random() * 0.4)),
        };
        
        updated[symbol] = [...lastData.slice(1), newDataPoint];
        
        // Generate meaningful alerts only for significant moves (>1.5%)
        if (Math.abs(boundedChange) > 0.015) {
          const alert = {
            id: Date.now(),
            symbol,
            type: boundedChange > 0 ? "bullish" : "bearish",
            message: `${symbol} ${boundedChange > 0 ? "gained" : "lost"} ${Math.abs(boundedChange * 100).toFixed(2)}%`,
            change: boundedChange * 100,
            timestamp: new Date(),
          };
          setAlerts(prevAlerts => [alert, ...prevAlerts.slice(0, 5)]);
        }
      });
      return updated;
    });
    setLastUpdate(new Date());
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(updatePrices, 5000 / simulationSpeed);
    return () => clearInterval(interval);
  }, [isLive, updatePrices, simulationSpeed]);

  // Risk assessment
  const riskAssessment = useMemo(() => {
    const score = config.volatility * 100 + (1 - config.aiSentiment) * 30;
    if (score < 40) return { level: "Low", color: "text-emerald-500", score };
    if (score < 70) return { level: "Medium", color: "text-amber-500", score };
    return { level: "High", color: "text-destructive", score };
  }, [config]);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col ml-0 lg:ml-64 transition-all duration-300">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-[2000px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">AI Trading Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Real-time market analysis and predictions
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-muted'}`} />
                  <span className="text-sm font-medium">Live {isLive ? 'ACTIVE' : 'PAUSED'}</span>
                </div>
                
                <Button
                  variant={isLive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsLive(!isLive)}
                  className="gap-2"
                >
                  {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isLive ? "Pause" : "Resume"}
                </Button>
              </div>
            </div>

            {/* Asset Selection */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <Select value={selectedStock} onValueChange={setSelectedStock}>
                      <SelectTrigger className="w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[400px]">
                        {Object.entries(assetConfigs).map(([symbol, config]) => (
                          <SelectItem key={symbol} value={symbol}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  config.riskLevel === 'low' ? 'bg-emerald-500' : 
                                  config.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-destructive'
                                }`} />
                                <span>{symbol}</span>
                                <Badge variant="outline" className="text-xs">
                                  {config.type}
                                </Badge>
                              </div>
                              <span className="text-muted-foreground">
                                {config.currency}{stocksData[symbol][stocksData[symbol].length - 1].price.toFixed(2)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="flex items-center gap-2">
                      {["1D", "1W", "1M", "3M"].map((tf) => (
                        <Button
                          key={tf}
                          variant={selectedTimeframe === tf ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTimeframe(tf)}
                        >
                          {tf}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="simulation-speed" className="text-sm">Speed</Label>
                      <Input
                        id="simulation-speed"
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.5"
                        value={simulationSpeed}
                        onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
                        className="w-24"
                      />
                      <span className="text-sm font-medium">{simulationSpeed}x</span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={updatePrices}
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Update
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Alerts - Clean and Simple */}
            {alerts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Market Alerts
                  </h3>
                  <Badge variant="outline">{alerts.length} new</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {alerts.map((alert) => (
                    <Alert
                      key={alert.id}
                      className={`${alert.type === "bullish" ? "border-emerald-500/50 bg-emerald-500/10" : "border-destructive/50 bg-destructive/10"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{alert.symbol}</div>
                          <AlertDescription>{alert.message}</AlertDescription>
                        </div>
                        <Badge variant={alert.type === "bullish" ? "default" : "destructive"}>
                          {alert.type === "bullish" ? "↑" : "↓"} {Math.abs(alert.change).toFixed(2)}%
                        </Badge>
                      </div>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Price Chart */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {config.name} ({selectedStock})
                          <Badge variant="outline">{config.sector}</Badge>
                        </CardTitle>
                        <CardDescription>
                          {config.currency}{stockInfo[stockInfo.length - 1].price.toFixed(2)} • 
                          Last update: {lastUpdate.toLocaleTimeString()}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {prediction.trend === "up" ? (
                          <Badge className="bg-emerald-500">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Bullish
                          </Badge>
                        ) : prediction.trend === "down" ? (
                          <Badge variant="destructive">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Bearish
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Minus className="w-3 h-3 mr-1" />
                            Neutral
                          </Badge>
                        )}
                        <span className={`text-xl font-bold ${
                          prediction.changePercent >= 0 ? "text-emerald-500" : "text-destructive"
                        }`}>
                          {prediction.changePercent >= 0 ? "+" : ""}
                          {prediction.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 lg:h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stockInfo.slice(-30)}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="price"
                            fill="url(#priceGradient)"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                          />
                          <ReferenceLine 
                            y={prediction.supportLevel} 
                            stroke="#ef4444" 
                            strokeDasharray="3 3" 
                            label="Support" 
                          />
                          <ReferenceLine 
                            y={prediction.resistanceLevel} 
                            stroke="#10b981" 
                            strokeDasharray="3 3" 
                            label="Resistance" 
                          />
                          <defs>
                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Brush dataKey="date" height={30} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Prediction */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5" />
                      AI Prediction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">{predictionDays}-Day Forecast</h4>
                          <div className="text-3xl font-bold">
                            {config.currency}{prediction.predictedPrice.toFixed(2)}
                          </div>
                          <div className={`text-xl font-semibold ${
                            prediction.changePercent >= 0 ? "text-emerald-500" : "text-destructive"
                          }`}>
                            {prediction.changePercent >= 0 ? "+" : ""}
                            {prediction.changePercent.toFixed(2)}%
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="text-sm">Confidence:</div>
                            <Badge className={
                              prediction.confidence > 75 ? "bg-emerald-500" :
                              prediction.confidence > 60 ? "bg-amber-500" : "bg-destructive"
                            }>
                              {prediction.confidence.toFixed(0)}%
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Prediction Horizon</Label>
                          <div className="flex gap-2">
                            {[1, 7, 14, 30].map((days) => (
                              <Button
                                key={days}
                                variant={predictionDays === days ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPredictionDays(days)}
                              >
                                {days}d
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-medium">Key Levels</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Support</span>
                            <span className="font-medium">{config.currency}{prediction.supportLevel.toFixed(2)}</span>
                          </div>
                          <Progress value={30} className="h-2" />
                          
                          <div className="flex justify-between">
                            <span className="text-sm">Current</span>
                            <span className="font-medium">{config.currency}{stockInfo[stockInfo.length - 1].price.toFixed(2)}</span>
                          </div>
                          <Progress value={50} className="h-2" />
                          
                          <div className="flex justify-between">
                            <span className="text-sm">Resistance</span>
                            <span className="font-medium">{config.currency}{prediction.resistanceLevel.toFixed(2)}</span>
                          </div>
                          <Progress value={70} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* AI Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-blue-500" />
                        <h4 className="font-medium">Market Sentiment</h4>
                      </div>
                      <p className="text-sm">{(config.aiSentiment * 100).toFixed(0)}% positive sentiment detected</p>
                    </div>
                    
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        <h4 className="font-medium">Volume Analysis</h4>
                      </div>
                      <p className="text-sm">
                        {(technicalIndicators.volume / 1000000).toFixed(2)}M volume
                        {technicalIndicators.volumeChange > 0 ? " (+" : " ("}
                        {technicalIndicators.volumeChange.toFixed(2)}%)
                      </p>
                    </div>
                    
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className={`w-4 h-4 ${riskAssessment.color}`} />
                        <h4 className="font-medium">Risk Assessment</h4>
                      </div>
                      <p className="text-sm">{riskAssessment.level} risk level</p>
                    </div>
                    
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-purple-500" />
                        <h4 className="font-medium">Trend Strength</h4>
                      </div>
                      <p className="text-sm">
                        {config.currentTrend.charAt(0).toUpperCase() + config.currentTrend.slice(1)} trend
                        ({(config.trendStrength * 100).toFixed(0)}% strength)
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Risk Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Risk Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Risk Score</span>
                          <span className="text-sm font-medium">{riskAssessment.score.toFixed(0)}/100</span>
                        </div>
                        <Progress value={riskAssessment.score} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold">{(config.volatility * 100).toFixed(1)}%</div>
                          <div className="text-sm text-muted-foreground">Volatility</div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-2xl font-bold">{config.aiRating}/10</div>
                          <div className="text-sm text-muted-foreground">AI Rating</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Technical Analysis Tabs - Fixed and Working */}
            <Tabs defaultValue="indicators" className="space-y-4">
              <TabsList>
                <TabsTrigger value="indicators">Technical Indicators</TabsTrigger>
                <TabsTrigger value="volume">Volume Profile</TabsTrigger>
                <TabsTrigger value="patterns">Pattern Recognition</TabsTrigger>
              </TabsList>

              {/* Technical Indicators Tab */}
              <TabsContent value="indicators">
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{technicalIndicators.rsi.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">RSI</div>
                        <Badge variant="outline" className="mt-2">
                          {technicalIndicators.rsi > 70 ? "Overbought" : 
                           technicalIndicators.rsi < 30 ? "Oversold" : "Neutral"}
                        </Badge>
                      </div>
                      
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{technicalIndicators.macd.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">MACD</div>
                        <Badge variant="outline" className="mt-2">
                          {technicalIndicators.macd > 0 ? "Bullish" : "Bearish"}
                        </Badge>
                      </div>
                      
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{technicalIndicators.stochastic.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">Stochastic</div>
                        <Badge variant="outline" className="mt-2">
                          {technicalIndicators.stochastic > 80 ? "Overbought" : 
                           technicalIndicators.stochastic < 20 ? "Oversold" : "Neutral"}
                        </Badge>
                      </div>
                      
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold">{technicalIndicators.atr.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">ATR</div>
                        <Badge variant="outline" className="mt-2">Volatility</Badge>
                      </div>
                    </div>
                    
                    <div className="mt-6 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={stockInfo.slice(-30)}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="rsi"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="RSI"
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="macd"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            name="MACD"
                            dot={false}
                          />
                          <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
                          <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Volume Profile Tab */}
              <TabsContent value="volume">
                <Card>
                  <CardContent className="p-6">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={volumeProfileData}
                          layout="vertical"
                          margin={{ top: 20, right: 30, left: 50, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis type="number" />
                          <YAxis type="number" dataKey="price" />
                          <Tooltip />
                          <Bar dataKey="volume" fill="#3b82f6" name="Volume">
                            {volumeProfileData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`}
                                fill={entry.price <= stockInfo[stockInfo.length - 1].price ? "#60a5fa" : "#93c5fd"}
                              />
                            ))}
                          </Bar>
                          <ReferenceLine 
                            x={stockInfo[stockInfo.length - 1].volume} 
                            stroke="#ef4444" 
                            strokeDasharray="3 3" 
                            label="Current" 
                          />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-xl font-bold">
                          {(technicalIndicators.volume / 1000000).toFixed(2)}M
                        </div>
                        <div className="text-sm text-muted-foreground">Current Volume</div>
                      </div>
                      
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-xl font-bold">
                          {technicalIndicators.volumeChange > 0 ? "+" : ""}
                          {technicalIndicators.volumeChange.toFixed(2)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Volume Change</div>
                      </div>
                      
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-xl font-bold">
                          {Math.max(...volumeProfileData.map(v => v.volume)).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Peak Volume</div>
                      </div>
                      
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <div className="text-xl font-bold">
                          {volumeProfileData.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Price Levels</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pattern Recognition Tab */}
              <TabsContent value="patterns">
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {patterns.map((pattern, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">{pattern.name}</h4>
                            <Badge variant="outline">{pattern.confidence}%</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{pattern.implication}</p>
                          <div className="mt-3">
                            <Progress value={pattern.confidence} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Pattern Analysis</h4>
                      <p className="text-sm text-muted-foreground">
                        {patterns.length > 1 
                          ? "Multiple patterns detected. Consider taking a position only if patterns align."
                          : "Single pattern detected. Wait for confirmation before trading."
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Disclaimer */}
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-600 dark:text-amber-400">
                <strong>Simulation Only:</strong> This platform is for educational purposes only. 
                All predictions and data are simulated and should not be used for actual investment decisions.
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Stocks;