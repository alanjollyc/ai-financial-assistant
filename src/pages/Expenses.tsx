// app/dashboard/expenses/page.tsx
import { useEffect, useState, useRef, useMemo } from "react";
import Papa from "papaparse";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Search,
  Upload,
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  FileText,
  X,
  AlertTriangle,
  Brain,
  Zap,
  Shield,
  TrendingUp,
  TrendingDown,
  Filter,
  Calendar,
  PieChart,
  BarChart3,
  Lightbulb,
  Eye,
  Download,
  RefreshCw,
  Clock,
  Sparkles,
  Bell,
  Target,
  DollarSign,
  ChevronRight,
  AlertCircle,
  Info,
  Flame,
  Siren,
  GitBranch,
  Activity,
  Camera,
  Scan,
  CheckCircle,
  Loader2,
  Receipt,
  Image as ImageIcon,
  Trash2,
  Edit,
  BarChart,
  LineChart,
  CreditCard,
  Smartphone,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Gift,
  BookOpen,
  Music,
  Film,
  Gamepad2,
  Wifi,
  Database,
  Server,
  Cloud,
  Save,
  Mic,
  MicOff,
  Volume2,
  MessageSquare,
  Headphones,
  Radio,
  VolumeX,
  Ear,
  Waves,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Tesseract from "tesseract.js";
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { useDropzone } from 'react-dropzone';

// Set worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/* ---------------- CATEGORIES ---------------- */
const BASE_CATEGORIES = [
  "Food & Dining",
  "Travel & Transport",
  "Rent & Mortgage",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Fuel",
  "Groceries",
  "Healthcare",
  "Subscriptions",
  "Education",
  "Salary",
  "Investment",
  "Gift & Donations",
  "Business",
  "Insurance",
  "Taxes",
  "Other"
];

const categories = ["All", ...BASE_CATEGORIES];

// Category icons mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Food & Dining": <Utensils className="w-4 h-4" />,
  "Travel & Transport": <Car className="w-4 h-4" />,
  "Rent & Mortgage": <Home className="w-4 h-4" />,
  "Shopping": <ShoppingBag className="w-4 h-4" />,
  "Bills & Utilities": <Wifi className="w-4 h-4" />,
  "Entertainment": <Film className="w-4 h-4" />,
  "Fuel": <Car className="w-4 h-4" />,
  "Groceries": <ShoppingBag className="w-4 h-4" />,
  "Healthcare": <Activity className="w-4 h-4" />,
  "Subscriptions": <Music className="w-4 h-4" />,
  "Education": <BookOpen className="w-4 h-4" />,
  "Salary": <DollarSign className="w-4 h-4" />,
  "Investment": <TrendingUp className="w-4 h-4" />,
  "Gift & Donations": <Gift className="w-4 h-4" />,
  "Business": <Database className="w-4 h-4" />,
  "Insurance": <Shield className="w-4 h-4" />,
  "Taxes": <FileText className="w-4 h-4" />,
  "Other": <CircleIcon className="w-4 h-4" />
};

/* ---------------- ML ANOMALY DETECTION ---------------- */
const detectAnomalies = (transactions: any[]) => {
  if (transactions.length < 10) return [];
  
  const categoryStats: Record<string, { amounts: number[], avg: number, std: number }> = {};
  const vendorStats: Record<string, number[]> = {};
  
  // Collect stats
  transactions.forEach(t => {
    if (t.type === "DEBIT") {
      // Category stats
      if (!categoryStats[t.category]) {
        categoryStats[t.category] = { amounts: [], avg: 0, std: 0 };
      }
      categoryStats[t.category].amounts.push(t.amount);
      
      // Vendor stats
      if (t.vendor) {
        if (!vendorStats[t.vendor]) {
          vendorStats[t.vendor] = [];
        }
        vendorStats[t.vendor].push(t.amount);
      }
    }
  });
  
  // Calculate statistics
  Object.keys(categoryStats).forEach(cat => {
    const amounts = categoryStats[cat].amounts;
    if (amounts.length >= 3) {
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance = amounts.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / amounts.length;
      categoryStats[cat].avg = avg;
      categoryStats[cat].std = Math.sqrt(variance);
    }
  });
  
  Object.keys(vendorStats).forEach(vendor => {
    const amounts = vendorStats[vendor];
    if (amounts.length >= 3) {
      const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance = amounts.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / amounts.length;
      vendorStats[vendor] = [avg, Math.sqrt(variance)];
    }
  });
  
  // Detect anomalies
  const anomalies: any[] = [];
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  
  transactions.forEach(transaction => {
    if (transaction.type !== "DEBIT") return;
    
    const category = transaction.category;
    const vendor = transaction.vendor;
    const catStats = categoryStats[category];
    const venStats = vendor && vendorStats[vendor];
    
    let anomalyScore = 0;
    const reasons: string[] = [];
    
    // Rule 1: Statistical outlier in category
    if (catStats && catStats.amounts.length >= 3) {
      const zScore = Math.abs((transaction.amount - catStats.avg) / catStats.std);
      if (zScore > 3) {
        anomalyScore += 85;
        reasons.push(`💰 Amount is ${zScore.toFixed(1)}x above category average`);
      }
    }
    
    // Rule 2: Statistical outlier with vendor
    if (venStats && venStats.length >= 2) {
      const [avg, std] = venStats;
      const zScore = Math.abs((transaction.amount - avg) / std);
      if (zScore > 2.5) {
        anomalyScore += 75;
        reasons.push(`🏪 Unusual amount for ${vendor}`);
      }
    }
    
    // Rule 3: Large absolute amount
    if (transaction.amount > 50000) {
      anomalyScore += 70;
      reasons.push(`💸 Very large transaction (₹${transaction.amount.toLocaleString()})`);
    }
    
    // Rule 4: Unusual time (weekend large spending)
    const date = new Date(transaction.date);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (isWeekend && transaction.amount > 10000) {
      anomalyScore += 60;
      reasons.push("📅 Large weekend spending");
    }
    
    // Rule 5: First time category in last 30 days
    const isRecent = new Date(transaction.date) > last30Days;
    const categoryTransactions = transactions.filter(t => 
      t.category === category && 
      t.id !== transaction.id &&
      new Date(t.date) > last30Days
    );
    if (categoryTransactions.length === 0 && isRecent) {
      anomalyScore += 50;
      reasons.push("🆕 First transaction in this category (30 days)");
    }
    
    // Rule 6: Time-based anomaly (unusual hour)
    const hour = new Date(transaction.transaction_timestamp).getHours();
    if ((hour < 6 || hour > 22) && transaction.amount > 5000) {
      anomalyScore += 40;
      reasons.push("🌙 Late night/early morning transaction");
    }
    
    // Rule 7: Sudden spike in frequency
    const recentTransactions = transactions.filter(t => 
      t.category === category && 
      new Date(t.date) > last30Days
    );
    if (recentTransactions.length > 5 && isRecent) {
      anomalyScore += 30;
      reasons.push("⚡ High frequency in this category");
    }
    
    // Rule 8: New vendor detection
    if (vendor && isRecent) {
      const vendorTransactions = transactions.filter(t => 
        t.vendor === vendor && 
        t.id !== transaction.id
      );
      if (vendorTransactions.length === 0) {
        anomalyScore += 35;
        reasons.push(`🏬 First purchase from ${vendor}`);
      }
    }
    
    if (anomalyScore >= 50) {
      anomalies.push({
        ...transaction,
        anomaly_score: Math.min(anomalyScore, 100),
        anomaly_reasons: reasons.slice(0, 3),
        confidence: Math.min(anomalyScore + 20, 100),
        severity: anomalyScore >= 80 ? "high" : anomalyScore >= 60 ? "medium" : "low"
      });
    }
  });
  
  // Sort by anomaly score (highest first)
  return anomalies.sort((a, b) => b.anomaly_score - a.anomaly_score);
};

/* ---------------- CATEGORY INSIGHTS ---------------- */
const generateCategoryInsights = (transactions: any[]) => {
  const categoryTotals: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const categoryTrends: Record<string, number[]> = {};
  
  transactions.filter(t => t.type === "DEBIT").forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    
    if (!categoryTrends[t.category]) {
      categoryTrends[t.category] = [];
    }
    categoryTrends[t.category].push(t.amount);
  });
  
  const insights = [];
  const totalExpense = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  
  // Generate spending pattern insights
  for (const [category, total] of Object.entries(categoryTotals)) {
    const percentage = (total / totalExpense) * 100;
    const avgTransaction = total / categoryCounts[category];
    const transactions = categoryTrends[category];
    
    if (percentage > 30) {
      insights.push({
        category,
        insight: `📊 ${category} consumes ${percentage.toFixed(1)}% of your expenses`,
        type: "warning",
        icon: "⚠️",
        recommendation: "Consider setting a budget for this category"
      });
    }
    
    if (avgTransaction > 10000) {
      insights.push({
        category,
        insight: `💸 High average transaction (₹${avgTransaction.toFixed(0)}) in ${category}`,
        type: "alert",
        icon: "🚨",
        recommendation: "Look for bulk buying or subscription alternatives"
      });
    }
    
    if (transactions.length >= 5) {
      const avgLast3 = transactions.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const avgPrev3 = transactions.slice(-6, -3).reduce((a, b) => a + b, 0) / 3;
      const growth = ((avgLast3 - avgPrev3) / avgPrev3) * 100;
      
      if (Math.abs(growth) > 50) {
        insights.push({
          category,
          insight: `📈 ${growth > 0 ? 'Spike' : 'Drop'} of ${Math.abs(growth).toFixed(0)}% in recent ${category} spending`,
          type: growth > 0 ? "alert" : "info",
          icon: growth > 0 ? "📈" : "📉",
          recommendation: growth > 0 ? "Monitor for unusual activity" : "Great job reducing expenses!"
        });
      }
    }
  }
  
  // Find top categories
  const topCategories = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([cat, total]) => ({
      category: cat,
      amount: total,
      percentage: (total / totalExpense) * 100,
      avgTransaction: total / categoryCounts[cat],
      transactionCount: categoryCounts[cat]
    }));
  
  return { insights: insights.slice(0, 5), topCategories };
};

/* ---------------- VOICE ENTRY COMPONENT ---------------- */
/* ---------------- VOICE ENTRY COMPONENT ---------------- */
interface VoiceCommand {
  text: string;
  amount: number;
  category: string;
  vendor?: string;
  confidence: number;
  type: 'DEBIT' | 'CREDIT';
  date: string;
}

const VoiceEntry = ({ onVoiceTransaction, onClose }: {
  onVoiceTransaction: (transaction: any) => void;
  onClose: () => void;
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [recognition, setRecognition] = useState<any>(null);
  const [volume, setVolume] = useState(0);
  const [extractedData, setExtractedData] = useState<VoiceCommand | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([
    "I spent 500 rupees on groceries",
    "Paid 1500 for electricity bill",
    "Received 25000 salary",
    "Spent 1200 at Starbucks",
    "Paid 800 for movie tickets"
  ]);
  const [error, setError] = useState<string>("");
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Voice command patterns
  const VOICE_PATTERNS = {
    amount: /(\d+)\s*(?:rupees|rs|₹|inr)/gi,
    categories: {
      'Food & Dining': ['food', 'dining', 'restaurant', 'cafe', 'lunch', 'dinner', 'breakfast'],
      'Groceries': ['groceries', 'vegetables', 'fruits', 'supermarket', 'mart'],
      'Travel & Transport': ['travel', 'transport', 'bus', 'train', 'flight', 'taxi', 'uber', 'ola'],
      'Bills & Utilities': ['bill', 'electricity', 'water', 'internet', 'mobile', 'utility'],
      'Shopping': ['shopping', 'clothes', 'electronics', 'amazon', 'flipkart'],
      'Entertainment': ['movie', 'cinema', 'entertainment', 'game', 'concert'],
      'Fuel': ['petrol', 'diesel', 'fuel', 'gas'],
      'Healthcare': ['hospital', 'doctor', 'medicine', 'healthcare', 'medical'],
      'Subscriptions': ['subscription', 'netflix', 'spotify', 'youtube'],
      'Salary': ['salary', 'income', 'received', 'credited'],
      'Other': ['other', 'miscellaneous', 'general']
    },
    keywords: {
      spent: 'DEBIT',
      paid: 'DEBIT',
      bought: 'DEBIT',
      purchased: 'DEBIT',
      received: 'CREDIT',
      earned: 'CREDIT',
      got: 'CREDIT',
      credited: 'CREDIT'
    },
    vendors: {
      'Swiggy': ['swiggy'],
      'Zomato': ['zomato'],
      'Amazon': ['amazon'],
      'Flipkart': ['flipkart'],
      'Uber': ['uber'],
      'Ola': ['ola'],
      'Starbucks': ['starbucks'],
      'Netflix': ['netflix'],
      'Spotify': ['spotify'],
      'Airtel': ['airtel'],
      'Jio': ['jio']
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        console.log('SpeechRecognition API available');
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-IN';
        
        recognitionInstance.onstart = () => {
          console.log('Voice recognition started successfully');
          setIsListening(true);
          setTranscript("");
          setExtractedData(null);
          setError("");
          setupAudioVisualization();
        };
        
        recognitionInstance.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }
          
          if (finalTranscript.trim()) {
            console.log('Final transcript:', finalTranscript);
            setTranscript(finalTranscript.trim());
            analyzeVoiceCommand(finalTranscript.trim());
          } else if (interimTranscript.trim()) {
            console.log('Interim transcript:', interimTranscript);
            setTranscript(interimTranscript.trim());
          }
        };
        
        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          cleanupAudioVisualization();
          
          if (event.error === 'not-allowed') {
            setError("Microphone access denied. Please allow microphone access in your browser settings.");
          } else if (event.error === 'no-speech') {
            setError("No speech detected. Please try speaking louder or closer to the microphone.");
          } else if (event.error === 'audio-capture') {
            setError("No microphone found. Please check your microphone connection.");
          } else {
            setError(`Voice recognition error: ${event.error}`);
          }
        };
        
        recognitionInstance.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
          cleanupAudioVisualization();
        };
        
        setRecognition(recognitionInstance);
      } else {
        console.error('SpeechRecognition API not available');
        setError("Your browser doesn't support speech recognition. Try Chrome, Edge, or Safari 14.1+.");
      }
    }
    
    return () => {
      cleanupAudioVisualization();
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const setupAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: false 
      });
      
      mediaStreamRef.current = stream;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      microphone.connect(analyser);
      analyser.fftSize = 256;
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      microphoneRef.current = microphone;
      
      const updateVolume = () => {
        if (!isListening || !analyserRef.current) {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          return;
        }
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        setVolume(Math.min(100, average * 0.5));
        
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      
      animationFrameRef.current = requestAnimationFrame(updateVolume);
    } catch (err) {
      console.error('Microphone setup error:', err);
      setError("Could not access microphone. Please check permissions.");
    }
  };

  const cleanupAudioVisualization = () => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Stop microphone stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }
    
    // Clean up audio context
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    setVolume(0);
  };

  const analyzeVoiceCommand = (text: string) => {
    setProcessing(true);
    const lowerText = text.toLowerCase();
    let confidenceScore = 0;
    
    console.log('Analyzing voice command:', text);
    
    // Extract amount - improved regex
    const amountMatch = text.match(/(\d+(?:,\d+)*(?:\.\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
    if (amount > 0) {
      confidenceScore += 40;
      console.log('Extracted amount:', amount);
    }
    
    // Determine transaction type
    let type: 'DEBIT' | 'CREDIT' = 'DEBIT';
    for (const [keyword, t] of Object.entries(VOICE_PATTERNS.keywords)) {
      if (lowerText.includes(keyword)) {
        type = t as 'DEBIT' | 'CREDIT';
        confidenceScore += 20;
        console.log('Detected transaction type:', type, 'from keyword:', keyword);
        break;
      }
    }
    
    // Detect category
    let category = 'Other';
    for (const [cat, keywords] of Object.entries(VOICE_PATTERNS.categories)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        category = cat;
        confidenceScore += 20;
        console.log('Detected category:', category);
        break;
      }
    }
    
    // Detect vendor
    let vendor = '';
    for (const [vendorName, patterns] of Object.entries(VOICE_PATTERNS.vendors)) {
      if (patterns.some(pattern => lowerText.includes(pattern))) {
        vendor = vendorName;
        confidenceScore += 10;
        console.log('Detected vendor:', vendor);
        break;
      }
    }
    
    // Extract description
    let description = text;
    if (vendor) {
      description = `${type === 'DEBIT' ? 'Spent' : 'Received'} at ${vendor}`;
    }
    
    confidenceScore = Math.min(100, confidenceScore);
    console.log('Final confidence score:', confidenceScore);
    
    const voiceCommand: VoiceCommand = {
      text,
      amount,
      category,
      vendor,
      confidence: confidenceScore,
      type,
      date: new Date().toISOString().split('T')[0]
    };
    
    setExtractedData(voiceCommand);
    setConfidence(confidenceScore);
    setProcessing(false);
  };

  const toggleListening = async () => {
    console.log('Toggle listening called, current state:', isListening);
    
    if (!recognition) {
      console.error("SpeechRecognition not available");
      setError("Speech recognition not supported in your browser. Try Chrome or Edge.");
      return;
    }
    
    try {
      if (isListening) {
        console.log("Stopping speech recognition");
        recognition.stop();
        setIsListening(false);
        cleanupAudioVisualization();
      } else {
        console.log("Starting speech recognition");
        setTranscript("");
        setExtractedData(null);
        setError("");
        
        // Request microphone permission first
        try {
          // Test microphone access first
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Stop the test stream immediately
          stream.getTracks().forEach(track => track.stop());
          
          // Start recognition
          recognition.start();
          console.log("Speech recognition started");
        } catch (err) {
          console.error("Microphone permission denied:", err);
          setError("Microphone permission denied. Please allow microphone access.");
          toast.error("Microphone permission denied. Please allow microphone access.");
        }
      }
    } catch (err) {
      console.error('Failed to toggle listening:', err);
      setError("Failed to access microphone. Please check permissions.");
      toast.error("Failed to access microphone. Please check permissions.");
      setIsListening(false);
      cleanupAudioVisualization();
    }
  };

  const handleSave = () => {
    if (extractedData) {
      onVoiceTransaction({
        narration: extractedData.text,
        amount: extractedData.amount,
        category: extractedData.category,
        type: extractedData.type,
        vendor: extractedData.vendor,
        date: extractedData.date,
        source: 'VOICE',
        voice_confidence: extractedData.confidence
      });
      onClose();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setTranscript(suggestion);
    analyzeVoiceCommand(suggestion);
  };

  // Add a stop function that can be called externally
  const stopListening = () => {
    if (recognition && isListening) {
      console.log('Force stopping recognition');
      recognition.stop();
      setIsListening(false);
      cleanupAudioVisualization();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
          isListening 
            ? 'bg-gradient-to-br from-red-500 to-pink-600 animate-pulse' 
            : 'bg-gradient-to-br from-purple-500 to-pink-600'
        }`}>
          {isListening ? (
            <Waves className="w-10 h-10 text-white" />
          ) : (
            <Mic className="w-10 h-10 text-white" />
          )}
        </div>
        <h3 className="text-lg font-semibold mb-2">
          {isListening ? "Listening... Speak Now" : "Speak Your Expense"}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Say something like "I spent 500 rupees on groceries"
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Volume Visualizer */}
      {isListening && (
        <div className="flex items-center justify-center gap-2 mb-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 h-6 rounded-full transition-all duration-100 ${
                i < Math.floor(volume / 10) 
                  ? 'bg-gradient-to-t from-red-500 to-pink-600' 
                  : 'bg-secondary'
              }`}
              style={{
                height: `${(i + 1) * 3}px`,
                opacity: i < Math.floor(volume / 10) ? 1 : 0.3,
                animation: i < Math.floor(volume / 10) ? 'pulse 1s infinite' : 'none'
              }}
            />
          ))}
        </div>
      )}

      {/* Transcript */}
      {(transcript || processing) && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">You said:</div>
                <div className="text-sm bg-secondary/30 p-3 rounded-lg min-h-[60px]">
                  {processing ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    `"${transcript}"`
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extracted Data */}
      {extractedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              AI Understanding
              <Badge className={`ml-2 ${
                confidence > 80 ? 'bg-green-500' :
                confidence > 60 ? 'bg-yellow-500' : 'bg-orange-500'
              }`}>
                {confidence}% Confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary/30 rounded-lg">
                <div className="text-xs text-muted-foreground">Amount</div>
                <div className="text-xl font-bold text-primary">
                  ₹{extractedData.amount.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg">
                <div className="text-xs text-muted-foreground">Type</div>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  extractedData.type === "CREDIT" 
                    ? "bg-green-500/20 text-green-700" 
                    : "bg-red-500/20 text-red-700"
                }`}>
                  {extractedData.type === "CREDIT" ? "Income" : "Expense"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-secondary/30 rounded-lg">
                <div className="text-xs text-muted-foreground">Category</div>
                <div className="flex items-center gap-2 mt-1">
                  {CATEGORY_ICONS[extractedData.category]}
                  <span className="font-medium">{extractedData.category}</span>
                </div>
              </div>
              {extractedData.vendor && (
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <div className="text-xs text-muted-foreground">Vendor</div>
                  <div className="font-medium">{extractedData.vendor}</div>
                </div>
              )}
            </div>

            <Alert className={
              confidence > 80 ? 'border-green-500/30 bg-green-500/10' :
              confidence > 60 ? 'border-yellow-500/30 bg-yellow-500/10' :
              'border-orange-500/30 bg-orange-500/10'
            }>
              {confidence > 80 ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <AlertDescription>
                    High confidence understanding. Ready to save.
                  </AlertDescription>
                </>
              ) : confidence > 60 ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <AlertDescription>
                    Medium confidence. Please verify details.
                  </AlertDescription>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <AlertDescription>
                    Low confidence. Some details may need correction.
                  </AlertDescription>
                </>
              )}
            </Alert>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={toggleListening}
                className="flex-1"
              >
                <Mic className="w-4 h-4 mr-2" />
                Speak Again
              </Button>
              <Button
                onClick={handleSave}
                disabled={confidence < 50}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Expense
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {!extractedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Try Saying
            </CardTitle>
            <CardDescription>
              Click on a suggestion to try it out
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left p-3 hover:bg-secondary/50 rounded-lg transition-colors group"
                  disabled={isListening}
                >
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    <span className="text-sm">{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start/Stop Button */}
      {!extractedData && (
        <div className="space-y-4">
          <Button
            onClick={toggleListening}
            size="lg"
            className={`w-full h-14 text-lg ${
              isListening 
                ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 animate-pulse' 
                : 'bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-6 h-6 mr-3" />
                Stop Recording
                <div className="ml-2 flex items-center">
                  <div className="w-2 h-2 bg-red-300 rounded-full animate-ping mr-1"></div>
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-ping mr-1"></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                </div>
              </>
            ) : (
              <>
                <Mic className="w-6 h-6 mr-3" />
                Start Speaking
              </>
            )}
          </Button>
          
          {!isListening && !recognition && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Voice entry requires microphone access. Please allow when prompted.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Instructions */}
      <Alert>
        <Headphones className="h-4 w-4" />
        <AlertTitle>How to use voice entry</AlertTitle>
        <AlertDescription className="text-sm space-y-1">
          <div>• Speak clearly and naturally</div>
          <div>• Include amount and purpose</div>
          <div>• Example: "Spent 1500 on groceries at BigBasket"</div>
          <div>• The AI will automatically categorize your expense</div>
        </AlertDescription>
      </Alert>
    </div>
  );
};
/* ---------------- ENHANCED OCR COMPONENT ---------------- */
interface ExtractedInvoiceData {
  vendor: string;
  date: string;
  total: number;
  subtotal?: number;
  tax?: number;
  items: Array<{
    description: string;
    amount: number;
    quantity: number;
    unitPrice?: number;
  }>;
  category: string;
  confidence: number;
  rawText: string;
  paymentMethod?: string;
  invoiceNumber?: string;
  address?: string;
}

const OCRReader = ({ onExtractedData, onClose }: {
  onExtractedData: (data: ExtractedInvoiceData) => void;
  onClose: () => void;
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<ExtractedInvoiceData | null>(null);
  const [error, setError] = useState<string>('');
  const [useCamera, setUseCamera] = useState(false);
  const [manualEditMode, setManualEditMode] = useState(false);
  const [manualData, setManualData] = useState({
    vendor: '',
    total: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Other'
  });

  // Enhanced vendor patterns
  const VENDOR_PATTERNS = {
    'Amazon': ['amazon', 'amzn', 'amazon.in'],
    'Swiggy': ['swiggy', 'swiggyinstamart'],
    'Zomato': ['zomato', 'zomatogold'],
    'Uber': ['uber', 'uber eats'],
    'Ola': ['ola', 'olacabs'],
    'Flipkart': ['flipkart'],
    'BigBasket': ['bigbasket', 'big basket'],
    'Dominos': ['dominos', 'domino\'s'],
    'McDonalds': ['mcdonalds', 'mcdonald\'s'],
    'Starbucks': ['starbucks'],
    'Netflix': ['netflix'],
    'Spotify': ['spotify'],
    'PhonePe': ['phonepe'],
    'Paytm': ['paytm'],
    'Google': ['google', 'google pay'],
    'Apple': ['apple', 'app store', 'itunes'],
    'Reliance': ['reliance', 'reliance digital'],
    'Jio': ['jio', 'jio mart'],
    'Airtel': ['airtel'],
    'Vodafone': ['vodafone', 'vi', 'idea'],
    'DMart': ['dmart'],
    'Croma': ['croma'],
    'Decathlon': ['decathlon'],
    'BookMyShow': ['bookmyshow'],
    'IRCTC': ['irctc'],
    'MakeMyTrip': ['makemytrip'],
    'Yatra': ['yatra'],
    'RedBus': ['redbus'],
    'Zerodha': ['zerodha'],
    'Upstox': ['upstox'],
  };

  // Enhanced category detection with weighted keywords
  const CATEGORY_DETECTION: Record<string, { keywords: string[], weight: number }[]> = {
    'Food & Dining': [
      { keywords: ['restaurant', 'cafe', 'food', 'dining', 'meal', 'coffee', 'tea', 'bakery', 'pizza', 'burger', 'swiggy', 'zomato', 'mcdonalds', 'dominos', 'starbucks'], weight: 10 },
      { keywords: ['lunch', 'dinner', 'breakfast', 'snack', 'ice cream', 'dessert'], weight: 5 }
    ],
    'Groceries': [
      { keywords: ['groceries', 'vegetables', 'fruits', 'milk', 'bread', 'supermarket', 'mart', 'bigbasket', 'dmart', 'jio mart'], weight: 10 },
      { keywords: ['dairy', 'eggs', 'meat', 'fish', 'poultry', 'beverage', 'snack'], weight: 5 }
    ],
    'Travel & Transport': [
      { keywords: ['travel', 'flight', 'train', 'bus', 'taxi', 'cab', 'metro', 'railway', 'uber', 'ola', 'irctc', 'makemytrip', 'yatra', 'redbus'], weight: 10 },
      { keywords: ['airport', 'railway', 'fuel', 'parking', 'toll'], weight: 7 }
    ],
    'Shopping': [
      { keywords: ['shopping', 'mall', 'store', 'clothing', 'apparel', 'electronics', 'fashion', 'amazon', 'flipkart', 'reliance digital', 'croma'], weight: 10 },
      { keywords: ['footwear', 'accessories', 'gadgets', 'appliances', 'furniture'], weight: 6 }
    ],
    'Bills & Utilities': [
      { keywords: ['bill', 'invoice', 'payment', 'due', 'utility', 'mobile', 'internet', 'electricity', 'water', 'gas', 'airtel', 'jio', 'vodafone'], weight: 10 },
      { keywords: ['recharge', 'broadband', 'wifi', 'cable'], weight: 7 }
    ],
    'Entertainment': [
      { keywords: ['movie', 'cinema', 'ott', 'streaming', 'game', 'concert', 'theater', 'netflix', 'spotify', 'bookmyshow'], weight: 10 },
      { keywords: ['music', 'video', 'subscription', 'ticket'], weight: 6 }
    ],
    'Fuel': [
      { keywords: ['petrol', 'diesel', 'fuel', 'gasoline', 'filling', 'station', 'bharat petroleum', 'hpcl', 'ioc'], weight: 10 }
    ],
    'Healthcare': [
      { keywords: ['hospital', 'doctor', 'medicine', 'healthcare', 'medical', 'pharmacy', 'clinic'], weight: 10 },
      { keywords: ['medicine', 'tablets', 'injection', 'test', 'checkup'], weight: 7 }
    ],
    'Subscriptions': [
      { keywords: ['subscription', 'monthly', 'yearly', 'renewal', 'membership', 'netflix', 'spotify', 'amazon prime'], weight: 10 }
    ],
    'Education': [
      { keywords: ['education', 'school', 'college', 'tuition', 'books', 'stationery', 'course'], weight: 10 }
    ],
    'Insurance': [
      { keywords: ['insurance', 'premium', 'policy', 'lic', 'health insurance', 'car insurance'], weight: 10 }
    ]
  };

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'image/webp', 'image/heic', 'image/heif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPEG, PNG, WebP, HEIC) or PDF file');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('File size should be less than 15MB');
      return;
    }

    setUploadedFile(file);
    setError('');
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview('');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic', '.heif'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
  });

  const extractTextFromImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      Tesseract.recognize(
        file,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round((m.progress || 0) * 100));
            }
          },
        }
      ).then(({ data: { text } }) => {
        resolve(text);
      }).catch(reject);
    });
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n';
          setProgress(Math.round((i / pdf.numPages) * 100));
        }
        
        resolve(fullText);
      } catch (err) {
        reject(err);
      }
    });
  };

  const extractInvoiceNumber = (text: string): string => {
    const patterns = [
      /invoice\s*#?\s*[:]?\s*([A-Za-z0-9\-]+)/i,
      /invoice\s*no\.?\s*[:]?\s*([A-Za-z0-9\-]+)/i,
      /bill\s*no\.?\s*[:]?\s*([A-Za-z0-9\-]+)/i,
      /order\s*#?\s*[:]?\s*([A-Za-z0-9\-]+)/i,
      /([A-Z]{2,}\d{4,})/,
      /(\d{4,}-\d{4,})/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return '';
  };

  const extractPaymentMethod = (text: string): string => {
    const patterns = [
      /(credit\s*card|debit\s*card|card\s*payment)/i,
      /(upi|google\s*pay|phonepe|paytm)/i,
      /(cash\s*payment|cash)/i,
      /(net\s*banking|bank\s*transfer)/i,
      /(paypal)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].toLowerCase();
      }
    }
    
    return '';
  };

  const extractAddress = (text: string): string => {
    const lines = text.split('\n');
    const addressLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Look for address indicators
      if (line.match(/\d+\s+[A-Za-z\s,]+(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr)/i) ||
          line.match(/^(?:flat|house|apartment|building)\s+[A-Za-z0-9\s]+/i) ||
          (line.includes('pin') || line.includes('pincode'))) {
        
        // Take this line and next 2-3 lines as address
        for (let j = i; j < Math.min(i + 4, lines.length); j++) {
          if (lines[j].trim().length > 5) {
            addressLines.push(lines[j].trim());
          }
        }
        break;
      }
    }
    
    return addressLines.join(', ');
  };

  const extractItems = (text: string): Array<{ description: string; amount: number; quantity: number; unitPrice?: number }> => {
    const lines = text.split('\n');
    const items: Array<{ description: string; amount: number; quantity: number; unitPrice?: number }> = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for item patterns
      const itemPatterns = [
        /([A-Za-z\s]+)\s+(\d+)\s*x?\s*₹?\s*(\d+(?:\.\d{2})?)\s*₹?\s*(\d+(?:\.\d{2})?)/i,
        /([A-Za-z\s]+)\s+₹?\s*(\d+(?:\.\d{2})?)/i,
        /(\d+)\s*x\s+([A-Za-z\s]+)\s+₹?\s*(\d+(?:\.\d{2})?)/i
      ];
      
      for (const pattern of itemPatterns) {
        const match = line.match(pattern);
        if (match) {
          if (match.length >= 4) {
            // Pattern with quantity and unit price
            items.push({
              description: match[1].trim(),
              quantity: parseInt(match[2]) || 1,
              unitPrice: parseFloat(match[3].replace(/[^\d.]/g, '')) || 0,
              amount: parseFloat(match[4]?.replace(/[^\d.]/g, '')) || parseFloat(match[3].replace(/[^\d.]/g, ''))
            });
          } else if (match.length >= 3) {
            // Pattern without quantity
            items.push({
              description: match[1].trim(),
              quantity: 1,
              amount: parseFloat(match[2].replace(/[^\d.]/g, ''))
            });
          }
          break;
        }
      }
    }
    
    return items;
  };

  const extractAmounts = (text: string): { total: number; subtotal?: number; tax?: number } => {
    const amounts = {
      total: 0,
      subtotal: 0,
      tax: 0
    };
    
    // Enhanced amount patterns
    const patterns = [
      { regex: /total\s*(?:amount|payable)?\s*[:]?\s*₹?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi, type: 'total' },
      { regex: /grand\s*total\s*[:]?\s*₹?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi, type: 'total' },
      { regex: /sub\s*total\s*[:]?\s*₹?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi, type: 'subtotal' },
      { regex: /tax\s*(?:amount)?\s*[:]?\s*₹?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi, type: 'tax' },
      { regex: /gst\s*[:]?\s*₹?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/gi, type: 'tax' },
      { regex: /₹\s*(\d+(?:,\d+)*(?:\.\d{2})?)\s*(?!\d)/g, type: 'total' } // Any standalone ₹ amount
    ];
    
    const foundAmounts: { type: string, value: number }[] = [];
    
    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern.regex)];
      matches.forEach(match => {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(amount) && amount > 0) {
          foundAmounts.push({ type: pattern.type, value: amount });
        }
      });
    }
    
    // Find the largest amount as total
    if (foundAmounts.length > 0) {
      amounts.total = Math.max(...foundAmounts.filter(a => a.type === 'total').map(a => a.value));
      
      // Try to find subtotal and tax
      const subtotalCandidates = foundAmounts.filter(a => a.type === 'subtotal');
      if (subtotalCandidates.length > 0) {
        amounts.subtotal = Math.max(...subtotalCandidates.map(a => a.value));
      }
      
      const taxCandidates = foundAmounts.filter(a => a.type === 'tax');
      if (taxCandidates.length > 0) {
        amounts.tax = Math.max(...taxCandidates.map(a => a.value));
      }
      
      // If we have subtotal and tax but no total, calculate it
      if (amounts.total === 0 && amounts.subtotal && amounts.tax) {
        amounts.total = amounts.subtotal + amounts.tax;
      }
    }
    
    return amounts;
  };

  const extractDate = (text: string): string => {
    const datePatterns = [
      /(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/g,
      /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/g,
      /Date\s*[:]?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/gi,
      /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/gi,
      /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}\s*,?\s*\d{4}/gi
    ];
    
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        try {
          const date = new Date(matches[0]);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.log('Date parsing error:', e);
        }
      }
    }
    
    return new Date().toISOString().split('T')[0];
  };

  const detectCategory = (text: string, vendor: string): { category: string, confidence: number } => {
    const lowerText = text.toLowerCase();
    const lowerVendor = vendor.toLowerCase();
    let bestCategory = 'Other';
    let bestScore = 0;
    
    // First check vendor-specific categorization
    for (const [vendorName, patterns] of Object.entries(VENDOR_PATTERNS)) {
      if (patterns.some(pattern => lowerVendor.includes(pattern))) {
        // Vendor matched, now find category
        for (const [category, detectionRules] of Object.entries(CATEGORY_DETECTION)) {
          for (const rule of detectionRules) {
            if (rule.keywords.some(keyword => lowerVendor.includes(keyword))) {
              if (rule.weight > bestScore) {
                bestScore = rule.weight;
                bestCategory = category;
              }
            }
          }
        }
      }
    }
    
    // If vendor didn't give good match, scan text
    if (bestScore < 8) {
      for (const [category, detectionRules] of Object.entries(CATEGORY_DETECTION)) {
        let categoryScore = 0;
        
        for (const rule of detectionRules) {
          for (const keyword of rule.keywords) {
            if (lowerText.includes(keyword)) {
              categoryScore += rule.weight;
              // Bonus for exact matches
              if (lowerText.includes(` ${keyword} `) || lowerText.startsWith(keyword) || lowerText.endsWith(keyword)) {
                categoryScore += 2;
              }
            }
          }
        }
        
        if (categoryScore > bestScore) {
          bestScore = categoryScore;
          bestCategory = category;
        }
      }
    }
    
    // Convert score to confidence percentage (0-100)
    const confidence = Math.min(100, Math.round((bestScore / 20) * 100));
    
    return { category: bestCategory, confidence };
  };

  const analyzeExtractedText = (text: string): ExtractedInvoiceData => {
    const lowerText = text.toLowerCase();
    let vendor = 'Unknown Vendor';
    let confidence = 0;
    
    // Detect Vendor
    let bestVendorMatch = '';
    let bestVendorScore = 0;
    
    for (const [vendorName, patterns] of Object.entries(VENDOR_PATTERNS)) {
      for (const pattern of patterns) {
        if (lowerText.includes(pattern)) {
          const score = pattern.length; // Longer patterns are more specific
          if (score > bestVendorScore) {
            bestVendorScore = score;
            bestVendorMatch = vendorName;
          }
          confidence += 25;
        }
      }
    }
    
    vendor = bestVendorMatch || 'Unknown Vendor';
    
    // Extract date
    const date = extractDate(text);
    if (date !== new Date().toISOString().split('T')[0]) {
      confidence += 15;
    }
    
    // Extract amounts
    const amounts = extractAmounts(text);
    if (amounts.total > 0) {
      confidence += 30;
    }
    
    // Extract items
    const items = extractItems(text);
    
    // Detect category
    const categoryDetection = detectCategory(text, vendor);
    const category = categoryDetection.category;
    confidence += categoryDetection.confidence * 0.2; // Add 20% of category confidence
    
    // Extract additional details
    const invoiceNumber = extractInvoiceNumber(text);
    const paymentMethod = extractPaymentMethod(text);
    const address = extractAddress(text);
    
    if (invoiceNumber) confidence += 5;
    if (paymentMethod) confidence += 5;
    if (address) confidence += 5;
    
    confidence = Math.min(100, Math.round(confidence));
    
    return {
      vendor,
      date,
      total: amounts.total,
      subtotal: amounts.subtotal,
      tax: amounts.tax,
      items,
      category,
      confidence,
      rawText: text.substring(0, 2000),
      paymentMethod,
      invoiceNumber,
      address
    };
  };

  const processFile = async () => {
    if (!uploadedFile) return;
    
    setProcessing(true);
    setProgress(0);
    setError('');
    
    try {
      let extractedText = '';
      
      if (uploadedFile.type === 'application/pdf') {
        extractedText = await extractTextFromPDF(uploadedFile);
      } else {
        extractedText = await extractTextFromImage(uploadedFile);
      }
      
      console.log('Extracted text length:', extractedText.length);
      
      if (extractedText.trim().length < 10) {
        throw new Error('No text could be extracted. Please try with a clearer image.');
      }
      
      const analyzedData = analyzeExtractedText(extractedText);
      setExtractedData(analyzedData);
      setManualData({
        vendor: analyzedData.vendor,
        total: analyzedData.total.toString(),
        date: analyzedData.date,
        category: analyzedData.category
      });
      
    } catch (err) {
      console.error('OCR Error:', err);
      setError(`Failed to process the file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
      setProgress(100);
    }
  };

  const handleSave = () => {
    if (extractedData) {
      onExtractedData(extractedData);
      onClose();
    }
  };

  const handleManualEdit = () => {
    if (!manualData.vendor.trim() || !manualData.total.trim()) {
      toast.error('Please fill in vendor and total amount');
      return;
    }
    
    const total = parseFloat(manualData.total);
    if (isNaN(total) || total <= 0) {
      toast.error('Please enter a valid total amount');
      return;
    }
    
    const manualExtractedData: ExtractedInvoiceData = {
      vendor: manualData.vendor,
      date: manualData.date,
      total: total,
      items: [],
      category: manualData.category,
      confidence: 100, // Manual entry has 100% confidence
      rawText: 'Manually entered'
    };
    
    setExtractedData(manualExtractedData);
    setManualEditMode(false);
    toast.success('Manual data saved for review');
  };

  const CameraCapture = ({ onClose }: { onClose: () => void }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string>('');

    useEffect(() => {
      startCamera();
      return () => {
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      };
    }, []);

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
      } catch (err) {
        console.error('Camera error:', err);
        toast.error('Unable to access camera. Please check permissions.');
        onClose();
      }
    };

    const captureImage = () => {
      if (!videoRef.current) return;
      
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          setUploadedFile(file);
          
          // Create preview
          const reader = new FileReader();
          reader.onloadend = () => {
            setCapturedImage(reader.result as string);
          };
          reader.readAsDataURL(file);
          
          toast.success('Image captured! Processing...');
          
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        }
      }, 'image/jpeg', 0.8);
    };

    return (
      <div className="space-y-4">
        {!capturedImage ? (
          <>
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-96 object-cover"
              />
              <div className="absolute inset-0 border-2 border-white/30 rounded-lg m-2" />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                Align bill within frame
              </div>
            </div>
            
            <div className="flex justify-center gap-4">
              <Button
                onClick={captureImage}
                size="lg"
                className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700"
              >
                <Camera className="w-6 h-6" />
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-16 h-16 rounded-full"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>• Ensure good lighting</p>
              <p>• Keep bill flat and centered</p>
              <p>• Avoid glare and shadows</p>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Image Captured!</h3>
              <img 
                src={capturedImage} 
                alt="Captured bill" 
                className="rounded-lg border shadow-sm max-h-64 mx-auto"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCapturedImage('');
                  startCamera();
                }}
                className="flex-1"
              >
                <Camera className="w-4 h-4 mr-2" />
                Retake
              </Button>
              <Button
                onClick={() => {
                  processFile();
                  setUseCamera(false);
                }}
                className="flex-1"
              >
                <Brain className="w-4 h-4 mr-2" />
                Process Image
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (useCamera) {
    return <CameraCapture onClose={() => setUseCamera(false)} />;
  }

  if (manualEditMode) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Manual Entry</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setManualEditMode(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="vendor">Vendor Name</Label>
            <Input
              id="vendor"
              value={manualData.vendor}
              onChange={(e) => setManualData({ ...manualData, vendor: e.target.value })}
              placeholder="e.g., Amazon, Starbucks, etc."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total">Total Amount (₹)</Label>
              <Input
                id="total"
                type="number"
                value={manualData.total}
                onChange={(e) => setManualData({ ...manualData, total: e.target.value })}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={manualData.date}
                onChange={(e) => setManualData({ ...manualData, date: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={manualData.category}
              onValueChange={(value) => setManualData({ ...manualData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BASE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    <div className="flex items-center gap-2">
                      {CATEGORY_ICONS[cat]}
                      {cat}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setManualEditMode(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleManualEdit}
            className="flex-1"
          >
            Save & Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={`border-3 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/30 hover:border-primary hover:bg-primary/5'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-primary/10">
                {isDragActive ? (
                  <Upload className="w-12 h-12 text-primary animate-bounce" />
                ) : (
                  <Camera className="w-12 h-12 text-primary" />
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {isDragActive ? 'Drop your bill here' : 'Upload Bill/Invoice'}
              </h3>
              <p className="text-muted-foreground mb-4">
                Take a photo or upload image/PDF of your receipt
              </p>
              <Button variant="outline">
                <Scan className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
            <Button
              onClick={() => setUseCamera(true)}
              variant="outline"
              className="w-full mt-4"
            >
              <Camera className="w-4 h-4 mr-2" />
              Use Camera
            </Button>
            <Button
              onClick={() => setManualEditMode(true)}
              variant="outline"
              className="w-full"
            >
              <Edit className="w-4 h-4 mr-2" />
              Enter Manually
            </Button>
          </div>
        </div>
      ) : !extractedData ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Uploaded File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
              <Receipt className="w-8 h-8 text-primary" />
              <div className="flex-1">
                <div className="font-medium">{uploadedFile.name}</div>
                <div className="text-sm text-muted-foreground">
                  {(uploadedFile.size / 1024).toFixed(0)} KB • {uploadedFile.type}
                </div>
              </div>
            </div>
            
            {preview && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Preview:</div>
                <img 
                  src={preview} 
                  alt="Invoice" 
                  className="rounded-lg border shadow-sm max-h-64 mx-auto"
                />
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setUploadedFile(null);
                  setPreview('');
                }}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Change File
              </Button>
              <Button
                onClick={processFile}
                disabled={processing}
                className="flex-1"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing... {progress}%
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Extract Details
                  </>
                )}
              </Button>
            </div>
            
            {!processing && (
              <Button
                onClick={() => setManualEditMode(true)}
                variant="outline"
                className="w-full"
              >
                <Edit className="w-4 h-4 mr-2" />
                Enter Details Manually
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              AI Extracted Details
              <Badge className={`ml-2 ${
                extractedData.confidence > 80 ? 'bg-green-500' :
                extractedData.confidence > 60 ? 'bg-yellow-500' : 'bg-orange-500'
              }`}>
                {extractedData.confidence}% Confidence
              </Badge>
            </CardTitle>
            <CardDescription>
              Review and edit the extracted information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Editable Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-vendor">Vendor</Label>
                <Input
                  id="edit-vendor"
                  value={extractedData.vendor}
                  onChange={(e) => setExtractedData({ ...extractedData, vendor: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={extractedData.date}
                  onChange={(e) => setExtractedData({ ...extractedData, date: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-total">Total Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">₹</span>
                  <Input
                    id="edit-total"
                    type="number"
                    className="pl-8"
                    value={extractedData.total}
                    onChange={(e) => setExtractedData({ 
                      ...extractedData, 
                      total: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>
              </div>
              
              {extractedData.subtotal && (
                <div>
                  <Label htmlFor="edit-subtotal">Subtotal</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">₹</span>
                    <Input
                      id="edit-subtotal"
                      type="number"
                      className="pl-8"
                      value={extractedData.subtotal}
                      onChange={(e) => setExtractedData({ 
                        ...extractedData, 
                        subtotal: parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>
                </div>
              )}
              
              {extractedData.tax && (
                <div>
                  <Label htmlFor="edit-tax">Tax</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">₹</span>
                    <Input
                      id="edit-tax"
                      type="number"
                      className="pl-8"
                      value={extractedData.tax}
                      onChange={(e) => setExtractedData({ 
                        ...extractedData, 
                        tax: parseFloat(e.target.value) || 0 
                      })}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={extractedData.category}
                onValueChange={(value) => setExtractedData({ ...extractedData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BASE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <div className="flex items-center gap-2">
                        {CATEGORY_ICONS[cat]}
                        {cat}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Additional Details */}
            {(extractedData.invoiceNumber || extractedData.paymentMethod || extractedData.address) && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Additional Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {extractedData.invoiceNumber && (
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <div className="text-xs text-muted-foreground">Invoice #</div>
                      <div className="font-medium">{extractedData.invoiceNumber}</div>
                    </div>
                  )}
                  {extractedData.paymentMethod && (
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <div className="text-xs text-muted-foreground">Payment Method</div>
                      <div className="font-medium capitalize">{extractedData.paymentMethod}</div>
                    </div>
                  )}
                  {extractedData.address && (
                    <div className="p-3 bg-secondary/30 rounded-lg md:col-span-1">
                      <div className="text-xs text-muted-foreground">Address</div>
                      <div className="font-medium text-sm truncate" title={extractedData.address}>
                        {extractedData.address.length > 30 
                          ? extractedData.address.substring(0, 30) + '...' 
                          : extractedData.address}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Items List */}
            {extractedData.items.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Items Detected</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {extractedData.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-secondary/20 rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.description}</div>
                        {item.quantity > 1 && (
                          <div className="text-xs text-muted-foreground">
                            {item.quantity} × ₹{item.unitPrice?.toFixed(2) || item.amount.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className="font-semibold">₹{item.amount.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Alert className={
              extractedData.confidence > 80 ? 'border-green-500/30 bg-green-500/10' :
              extractedData.confidence > 60 ? 'border-yellow-500/30 bg-yellow-500/10' :
              'border-orange-500/30 bg-orange-500/10'
            }>
              {extractedData.confidence > 80 ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <AlertDescription>
                    High confidence extraction. Review and save.
                  </AlertDescription>
                </>
              ) : extractedData.confidence > 60 ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <AlertDescription>
                    Medium confidence. Please verify details before saving.
                  </AlertDescription>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <AlertDescription>
                    Low confidence. Manual verification required.
                  </AlertDescription>
                </>
              )}
            </Alert>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setExtractedData(null);
                  setUploadedFile(null);
                }}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                Scan Another
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-primary to-blue-600"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Expense
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {processing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Zap className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold mb-2">AI is reading your bill</h3>
                <p className="text-sm text-muted-foreground">
                  Extracting details... {progress}%
                </p>
                <div className="text-xs text-muted-foreground mt-2">
                  This may take a few seconds
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

/* ---------------- MODAL COMPONENT ---------------- */
const Modal = ({ title, children, onClose, size = 'md' }: any) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div 
      className={`glass-card p-6 w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 ${
        size === 'lg' ? 'max-w-3xl' : 'max-w-md'
      }`}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors p-2"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

/* ---------------- MAIN COMPONENT ---------------- */
export default function Expenses() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [showAnomalyInsights, setShowAnomalyInsights] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState<any>(null);
  const [showAnomalyDetail, setShowAnomalyDetail] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'chart'>('list');
  const [timeRange, setTimeRange] = useState<'all' | 'month' | 'week' | 'today'>('month');
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const [form, setForm] = useState({
    narration: "",
    amount: "",
    category: "Food & Dining",
    date: new Date().toISOString().split("T")[0],
    type: "DEBIT",
    vendor: "",
  });

  const fileRef = useRef<HTMLInputElement>(null);

  /* ---------------- COMPUTED VALUES ---------------- */
  const anomalies = useMemo(() => detectAnomalies(transactions), [transactions]);
  const { insights, topCategories } = useMemo(() => 
    generateCategoryInsights(transactions), [transactions]);

  const filtered = useMemo(() => {
    let filteredTransactions = transactions;
    
    // Filter by time range
    const now = new Date();
    switch (timeRange) {
      case 'today':
        filteredTransactions = filteredTransactions.filter(t => 
          new Date(t.date).toDateString() === now.toDateString()
        );
        break;
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filteredTransactions = filteredTransactions.filter(t => 
          new Date(t.date) >= weekAgo
        );
        break;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filteredTransactions = filteredTransactions.filter(t => 
          new Date(t.date) >= monthAgo
        );
        break;
    }
    
    // Filter by category and search
    return filteredTransactions.filter((t) => {
      const matchCat =
        selectedCategory === "All" || t.category === selectedCategory;
      const matchSearch = t.narration?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.vendor?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [transactions, selectedCategory, searchQuery, timeRange]);

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

  const balance = totalIncome - totalExpense;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthIncome = transactions
    .filter(
      (t) =>
        t.type === "CREDIT" &&
        new Date(t.date).getMonth() === currentMonth &&
        new Date(t.date).getFullYear() === currentYear
    )
    .reduce((s, t) => s + Number(t.amount), 0);

  const thisMonthExpense = transactions
    .filter(
      (t) =>
        t.type === "DEBIT" &&
        new Date(t.date).getMonth() === currentMonth &&
        new Date(t.date).getFullYear() === currentYear
    )
    .reduce((s, t) => s + Number(t.amount), 0);

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
    return ((thisMonthExpense - lastMonthExpense) / lastMonthExpense) * 100;
  }, [transactions, thisMonthExpense]);

  /* ---------------- FETCH ---------------- */
  const fetchTransactions = async () => {
    setRefreshing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Failed to load transactions");
    } else {
      setTransactions(data || []);
      if (data && data.length > 0) {
        const newAnomalies = detectAnomalies(data);
        if (newAnomalies.length > 0) {
          toast.warning(`🚨 Detected ${newAnomalies.length} unusual transactions`, {
            description: "Click here to review",
            action: {
              label: "View",
              onClick: () => setShowAnomalyInsights(true)
            }
          });
        }
      }
    }
    
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  /* ---------------- ADD/MODIFY TRANSACTION ---------------- */
  const saveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      narration: form.narration,
      amount: Number(form.amount),
      category: form.category,
      type: form.type,
      date: form.date,
      vendor: form.vendor,
      transaction_timestamp: new Date().toISOString(),
      source: editingTransaction ? "MANUAL_EDIT" : "MANUAL",
      is_anomaly: false,
    };

    let error;
    if (editingTransaction) {
      const { error: updateError } = await supabase
        .from("transactions")
        .update(payload)
        .eq("id", editingTransaction.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("transactions").insert(payload);
      error = insertError;
    }

    if (error) {
      toast.error(`Failed to ${editingTransaction ? 'update' : 'add'} transaction`);
      return;
    }

    setShowAddModal(false);
    setEditingTransaction(null);
    setForm({
      narration: "",
      amount: "",
      category: "Food & Dining",
      date: new Date().toISOString().split("T")[0],
      type: "DEBIT",
      vendor: "",
    });

    toast.success(`Transaction ${editingTransaction ? 'updated' : 'added'} successfully!`);
    fetchTransactions();
  };

  /* ---------------- DELETE TRANSACTION ---------------- */
  const deleteTransaction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete transaction");
    } else {
      toast.success("Transaction deleted successfully!");
      fetchTransactions();
    }
  };

  /* ---------------- VOICE TRANSACTION HANDLER ---------------- */
  const handleVoiceTransaction = async (voiceData: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      narration: voiceData.narration,
      amount: Number(voiceData.amount),
      category: voiceData.category,
      type: voiceData.type,
      date: voiceData.date,
      vendor: voiceData.vendor || '',
      transaction_timestamp: new Date().toISOString(),
      source: "VOICE",
      is_anomaly: false,
      voice_confidence: voiceData.voice_confidence,
    };

    const { error } = await supabase.from("transactions").insert(payload);
    if (error) {
      toast.error("Failed to save voice transaction");
    } else {
      toast.success(`Voice transaction saved: ${voiceData.narration}`);
      setShowVoiceModal(false);
      fetchTransactions();
    }
  };

  /* ---------------- CSV UPLOAD ---------------- */
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.loading("Processing CSV file...");
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        const rows = res.data as any[];

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const payload = rows.map((r) => ({
          user_id: user.id,
          narration: r.narration || r.reference || "Bank Transaction",
          amount: Math.abs(Number(r.amount)),
          category: BASE_CATEGORIES.find(cat => 
            r.narration?.toLowerCase().includes(cat.toLowerCase()) || 
            r.reference?.toLowerCase().includes(cat.toLowerCase())
          ) || "Other",
          type: r.type?.toUpperCase() === "CREDIT" ? "CREDIT" : "DEBIT",
          date: r.valueDate || r.date || r.transactionTimestamp?.split("T")[0] || new Date().toISOString().split("T")[0],
          transaction_timestamp: r.transactionTimestamp || new Date().toISOString(),
          source: "BANK_CSV",
          is_anomaly: false,
        }));

        const { error } = await supabase.from("transactions").insert(payload);
        if (error) {
          toast.error("Failed to upload CSV");
        } else {
          toast.success(`Successfully imported ${rows.length} transactions`);
          setShowUploadModal(false);
          fetchTransactions();
        }
      },
      error: () => {
        toast.error("Error parsing CSV file");
      }
    });

    e.target.value = "";
  };

  /* ---------------- EXPORT CSV ---------------- */
  const exportToCSV = () => {
    const headers = ["Date", "Description", "Vendor", "Category", "Type", "Amount"];
    const csvData = [
      headers.join(","),
      ...transactions.map(t => 
        [t.date, t.narration, t.vendor || '', t.category, t.type, t.amount].join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    
    toast.success("CSV exported successfully!");
  };

  /* ---------------- ENHANCED OCR HANDLER ---------------- */
  const handleOCRExtractedData = async (data: ExtractedInvoiceData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    try {
      const payload = {
        user_id: user.id,
        narration: `${data.vendor} - ${data.items.length > 0 ? data.items[0].description : 'Bill Payment'}`,
        amount: data.total,
        category: data.category,
        type: "DEBIT",
        date: data.date,
        transaction_timestamp: new Date().toISOString(),
        source: "OCR_SCAN",
        is_anomaly: false,
      };
      
      console.log('Saving OCR transaction with payload:', payload);
      
      const { error } = await supabase
        .from("transactions")
        .insert(payload);
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      toast.success(`✅ Successfully added ₹${data.total.toLocaleString()} expense from ${data.vendor}`);
      fetchTransactions();
      setShowOCRModal(false);
      
    } catch (err: any) {
      console.error('Failed to save scanned bill:', err);
      toast.error(`Failed to save scanned bill: ${err.message || 'Unknown error'}`);
    }
  };

  /* ---------------- EDIT TRANSACTION ---------------- */
  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setForm({
      narration: transaction.narration,
      amount: transaction.amount.toString(),
      category: transaction.category,
      date: transaction.date,
      type: transaction.type,
      vendor: transaction.vendor || "",
    });
    setShowAddModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-gray-50 to-background dark:via-gray-900/20">
      <DashboardSidebar />
      <div className="ml-0 lg:ml-64 transition-all duration-300">
        <DashboardHeader />

        <main className="p-4 md:p-6 lg:p-8 space-y-6">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" />
                Expense Intelligence
                {anomalies.length > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    <Siren className="w-3 h-3 mr-1" />
                    {anomalies.length} Alerts
                  </Badge>
                )}
              </h1>
              <p className="text-muted-foreground">
                AI-powered expense tracking with enhanced OCR scanning & voice entry
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAnomalyInsights(true)}
                className={anomalies.length > 0 ? "border-red-500/30 bg-red-500/10 text-red-500" : ""}
              >
                <Brain className="w-4 h-4 mr-2" />
                AI Insights
                {anomalies.length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {anomalies.length}
                  </Badge>
                )}
              </Button>
              <Button 
                onClick={() => setShowVoiceModal(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                <Mic className="w-4 h-4 mr-2" />
                Voice Entry
              </Button>
              <Button 
                onClick={() => setShowOCRModal(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
              >
                <Camera className="w-4 h-4 mr-2" />
                Scan Bill
              </Button>
              <Button variant="outline" onClick={() => setShowUploadModal(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload CSV
              </Button>
              <Button 
                variant="gradient" 
                onClick={() => {
                  setEditingTransaction(null);
                  setShowAddModal(true);
                }}
                className="bg-gradient-to-r from-primary to-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={fetchTransactions}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {/* ANOMALY ALERT BANNER */}
          {anomalies.length > 0 && (
            <Alert className="border-l-4 border-red-500 bg-gradient-to-r from-red-500/10 to-red-500/5">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div className="flex-1">
                <AlertTitle className="flex items-center gap-2">
                  🚨 Unusual Activity Detected
                </AlertTitle>
                <AlertDescription className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <span>{anomalies.length} transactions flagged for review</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAnomalyInsights(true)}
                    className="border-red-500/30 text-red-500 hover:bg-red-500/10 w-full md:w-auto"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Review Now
                  </Button>
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* VOICE ENTRY BANNER */}
          <Alert className="border-l-4 border-purple-500 bg-gradient-to-r from-purple-500/10 to-purple-500/5">
            <Mic className="h-5 w-5 text-purple-500" />
            <div className="flex-1">
              <AlertTitle className="flex items-center gap-2">
                🎤 Try Voice Entry
              </AlertTitle>
              <AlertDescription className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <span>Quickly add expenses by speaking naturally</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowVoiceModal(true)}
                  className="border-purple-500/30 text-purple-500 hover:bg-purple-500/10 w-full md:w-auto"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Speak Now
                </Button>
              </AlertDescription>
            </div>
          </Alert>

          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-700">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Balance</p>
                      <p className="text-2xl font-bold text-primary">
                        ₹{balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <Progress 
                  value={Math.min(100, (balance / (totalIncome || 1)) * 100)} 
                  className="mt-2 h-1.5"
                />
              </CardContent>
            </Card>

            <Card className="border-blue-500/20 hover:border-blue-500/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-700">
                      <ArrowDownCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Income</p>
                      <p className="text-2xl font-bold text-green-600">
                        +₹{totalIncome.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-green-500">↑</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-500/20 hover:border-orange-500/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-700">
                      <ArrowUpCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">
                        -₹{totalExpense.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-500/20 hover:border-purple-500/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-700">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">This Month</p>
                      <p className="text-2xl font-bold">
                        -₹{thisMonthExpense.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className={`text-sm ${monthlyGrowth > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {monthlyGrowth > 0 ? '↑' : '↓'} {Math.abs(monthlyGrowth).toFixed(1)}%
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  vs last month
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CATEGORY INSIGHTS & FILTERS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Insights */}
            <div className="lg:col-span-2 space-y-6">
              {/* CATEGORY INSIGHTS */}
              {insights.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                        Spending Insights
                      </CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={exportToCSV}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {insights.slice(0, 3).map((insight, idx) => (
                        <div key={idx} className="p-4 bg-secondary/30 rounded-lg border border-yellow-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{insight.icon}</span>
                            <h3 className="font-medium">{insight.category}</h3>
                          </div>
                          <p className="text-sm mb-2">{insight.insight}</p>
                          {insight.recommendation && (
                            <p className="text-xs text-muted-foreground">
                              💡 {insight.recommendation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {topCategories.length > 0 && (
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="text-sm font-medium mb-3">Top Spending Categories</h4>
                        <div className="space-y-3">
                          {topCategories.map((cat, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  idx === 0 ? 'bg-red-500' :
                                  idx === 1 ? 'bg-orange-500' :
                                  idx === 2 ? 'bg-yellow-500' : 'bg-blue-500'
                                }`}></div>
                                <span className="text-sm flex items-center gap-2">
                                  {CATEGORY_ICONS[cat.category]}
                                  {cat.category}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  {cat.percentage.toFixed(1)}%
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  ₹{cat.amount.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* FILTERS & SEARCH */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          className="pl-10"
                          placeholder="Search transactions..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={viewMode} onValueChange={setViewMode}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="list">List View</SelectItem>
                          <SelectItem value="grid">Grid View</SelectItem>
                          <SelectItem value="chart">Chart View</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                    {categories.map((c) => (
                      <Button
                        key={c}
                        size="sm"
                        variant={selectedCategory === c ? "default" : "outline"}
                        onClick={() => setSelectedCategory(c)}
                        className="whitespace-nowrap"
                      >
                        {c === "All" ? c : CATEGORY_ICONS[c]}
                        {c}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Quick Stats */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg. Daily Spend</span>
                      <span className="font-medium">
                        ₹{Math.round(thisMonthExpense / 30).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Transactions</span>
                      <span className="font-medium">{filtered.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Categories Used</span>
                      <span className="font-medium">
                        {new Set(transactions.map(t => t.category)).size}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Spending Distribution</h4>
                    <div className="space-y-1">
                      {topCategories.slice(0, 3).map((cat, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-primary to-blue-600 h-2 rounded-full"
                              style={{ width: `${cat.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs w-12 truncate">{cat.category}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setShowVoiceModal(true)}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Voice Entry
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setShowOCRModal(true)}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Scan New Bill
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      setEditingTransaction(null);
                      setShowAddModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Quick Expense
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={exportToCSV}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* TRANSACTIONS */}
          <Card>
            <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Recent Transactions
                  <Badge variant="outline" className="ml-2">
                    {filtered.length} transactions
                  </Badge>
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Showing {selectedCategory === "All" ? "all" : selectedCategory} • {timeRange}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={totalExpense > totalIncome ? "destructive" : "secondary"}>
                  Expense Ratio: {(totalExpense / (totalIncome || 1) * 100).toFixed(0)}%
                </Badge>
              </div>
            </div>
            
            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading transactions...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || selectedCategory !== "All" 
                    ? "Try changing your search or filter"
                    : "Start by adding your first transaction"}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => setShowVoiceModal(true)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Add with Voice
                  </Button>
                  <Button 
                    onClick={() => setShowOCRModal(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-600"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Scan a Bill
                  </Button>
                  <Button 
                    onClick={() => {
                      setEditingTransaction(null);
                      setShowAddModal(true);
                    }}
                    className="bg-gradient-to-r from-primary to-blue-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Manually
                  </Button>
                </div>
              </div>
            ) : viewMode === 'list' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="p-4 text-left font-medium">Type</th>
                      <th className="p-4 text-left font-medium">Description</th>
                      <th className="p-4 text-left font-medium">Category</th>
                      <th className="p-4 text-left font-medium">Date</th>
                      <th className="p-4 text-right font-medium">Amount</th>
                      <th className="p-4 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => {
                      const isAnomaly = anomalies.some(a => a.id === t.id);
                      const isVoice = t.source === 'VOICE';
                      const isOCR = t.source === 'OCR_SCAN';
                      return (
                        <tr
                          key={t.id}
                          className={`border-t hover:bg-secondary/30 transition-colors ${
                            isAnomaly
                              ? "bg-red-500/10"
                              : isVoice
                              ? "bg-purple-500/5"
                              : isOCR
                              ? "bg-blue-500/5"
                              : ""
                          }`}
                        >
                          <td className="p-4">
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              t.type === "CREDIT" 
                                ? "bg-green-500/20 text-green-700" 
                                : "bg-red-500/20 text-red-700"
                            }`}>
                              {t.type === "CREDIT" ? (
                                <>
                                  <ArrowDownCircle className="w-3 h-3" />
                                  Credit
                                </>
                              ) : (
                                <>
                                  <ArrowUpCircle className="w-3 h-3" />
                                  Debit
                                </>
                              )}
                              {isVoice && <Mic className="w-3 h-3 ml-1" />}
                              {isOCR && <Camera className="w-3 h-3 ml-1" />}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <div className="font-medium">{t.narration}</div>
                              {t.vendor && (
                                <div className="text-xs text-muted-foreground">Vendor: {t.vendor}</div>
                              )}
                              {isAnomaly && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Flame className="w-3 h-3 text-red-500" />
                                  <span className="text-xs text-red-500">Unusual</span>
                                </div>
                              )}
                              {isVoice && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Mic className="w-3 h-3 text-purple-500" />
                                  <span className="text-xs text-purple-500">Voice Entry</span>
                                </div>
                              )}
                              {isOCR && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Camera className="w-3 h-3 text-blue-500" />
                                  <span className="text-xs text-blue-500">Scanned</span>
                                  {t.ocr_confidence && (
                                    <span className="text-xs text-blue-400 ml-1">
                                      ({t.ocr_confidence}%)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {CATEGORY_ICONS[t.category]}
                              <Badge variant="outline">{t.category}</Badge>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(t.date).toLocaleDateString()}
                          </td>
                          <td className={`p-4 text-right font-semibold ${
                            t.type === "CREDIT" ? "text-green-600" : "text-red-600"
                          }`}>
                            {t.type === "CREDIT" ? "+" : "-"}₹{t.amount.toLocaleString()}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              {isAnomaly && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 px-3"
                                  onClick={() => {
                                    setSelectedAnomaly(anomalies.find(a => a.id === t.id));
                                    setShowAnomalyDetail(true);
                                  }}
                                >
                                  <AlertTriangle className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3"
                                onClick={() => handleEdit(t)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-3 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                onClick={() => deleteTransaction(t.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((t) => {
                  const isAnomaly = anomalies.some(a => a.id === t.id);
                  const isVoice = t.source === 'VOICE';
                  const isOCR = t.source === 'OCR_SCAN';
                  return (
                    <div
                      key={t.id}
                      className={`p-4 rounded-lg border hover:border-primary/50 transition-colors ${
                        isAnomaly ? 'border-red-500/30 bg-red-500/5' :
                        isVoice ? 'border-purple-500/30 bg-purple-500/5' :
                        isOCR ? 'border-blue-500/30 bg-blue-500/5' :
                        'border-border'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          {CATEGORY_ICONS[t.category]}
                          <span className="text-sm font-medium">{t.category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            t.type === "CREDIT" 
                              ? "bg-green-500/20 text-green-700" 
                              : "bg-red-500/20 text-red-700"
                          }`}>
                            {t.type === "CREDIT" ? "Credit" : "Debit"}
                          </div>
                          {isVoice && (
                            <div className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-700">
                              <Mic className="w-3 h-3" />
                            </div>
                          )}
                          {isOCR && (
                            <div className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-700">
                              <Camera className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <h4 className="font-medium">{t.narration}</h4>
                        {t.vendor && (
                          <p className="text-sm text-muted-foreground">From: {t.vendor}</p>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          {new Date(t.date).toLocaleDateString()}
                        </div>
                        <div className={`font-semibold ${
                          t.type === "CREDIT" ? "text-green-600" : "text-red-600"
                        }`}>
                          {t.type === "CREDIT" ? "+" : "-"}₹{t.amount.toLocaleString()}
                        </div>
                      </div>
                      
                      {(isAnomaly || isVoice || isOCR) && (
                        <div className="mt-3 pt-3 border-t flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm">
                            {isAnomaly && (
                              <div className="flex items-center gap-1 text-red-500">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Unusual</span>
                              </div>
                            )}
                            {isVoice && (
                              <div className="flex items-center gap-1 text-purple-500">
                                <Mic className="w-3 h-3" />
                                <span>Voice</span>
                              </div>
                            )}
                            {isOCR && (
                              <div className="flex items-center gap-1 text-blue-500">
                                <Camera className="w-3 h-3" />
                                <span>Scanned</span>
                              </div>
                            )}
                          </div>
                          {isAnomaly && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => {
                                setSelectedAnomaly(anomalies.find(a => a.id === t.id));
                                setShowAnomalyDetail(true);
                              }}
                            >
                              Review
                            </Button>
                          )}
                        </div>
                      )}
                      
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-xs"
                          onClick={() => handleEdit(t)}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => deleteTransaction(t.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6">
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">Chart view coming soon...</p>
                </div>
              </div>
            )}
            
            {filtered.length > 0 && (
              <div className="p-4 border-t text-sm text-muted-foreground flex justify-between items-center">
                <div>
                  Showing {filtered.length} of {transactions.length} total transactions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={filtered.length === transactions.length}
                    onClick={() => {
                      setSelectedCategory("All");
                      setSearchQuery("");
                      setTimeRange("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </main>
      </div>

      {/* MODALS */}
      {/* UPLOAD CSV MODAL */}
      {showUploadModal && (
        <Modal title="📤 Upload Bank Statement" onClose={() => setShowUploadModal(false)}>
          <div className="space-y-4">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertTitle>CSV Format</AlertTitle>
              <AlertDescription>
                Your CSV should include columns: type, amount, narration, date
              </AlertDescription>
            </Alert>
            
            <div className="border-2 border-dashed border-primary/30 p-8 text-center rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                 onClick={() => fileRef.current?.click()}>
              <Upload className="mx-auto mb-3 w-12 h-12 text-primary/50" />
              <p className="text-lg font-medium mb-2">Drop CSV file here</p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <Button variant="outline">
                Select CSV File
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                hidden
                onChange={handleCSVUpload}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ADD/EDIT TRANSACTION MODAL */}
      {(showAddModal || editingTransaction) && (
        <Modal title={editingTransaction ? "✏️ Edit Transaction" : "➕ Add Transaction"} 
               onClose={() => {
                 setShowAddModal(false);
                 setEditingTransaction(null);
                 setForm({
                   narration: "",
                   amount: "",
                   category: "Food & Dining",
                   date: new Date().toISOString().split("T")[0],
                   type: "DEBIT",
                   vendor: "",
                 });
               }}>
          <form onSubmit={saveTransaction} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm({ ...form, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEBIT">Expense (Debit)</SelectItem>
                    <SelectItem value="CREDIT">Income (Credit)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="narration">Description</Label>
              <Input
                id="narration"
                placeholder="What was this transaction for?"
                value={form.narration}
                onChange={(e) => setForm({ ...form, narration: e.target.value })}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="vendor">Vendor (Optional)</Label>
              <Input
                id="vendor"
                placeholder="Store, website, or person"
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm({ ...form, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BASE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        <div className="flex items-center gap-2">
                          {CATEGORY_ICONS[cat]}
                          {cat}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <Alert>
              <Brain className="h-4 w-4" />
              <AlertTitle>AI Features</AlertTitle>
              <AlertDescription>
                This transaction will be analyzed for anomalies and included in spending insights
              </AlertDescription>
            </Alert>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
            </Button>
          </form>
        </Modal>
      )}

      {/* VOICE ENTRY MODAL */}
      {showVoiceModal && (
        <Modal title="🎤 Voice Entry" onClose={() => setShowVoiceModal(false)} size="lg">
          <VoiceEntry 
            onVoiceTransaction={handleVoiceTransaction}
            onClose={() => setShowVoiceModal(false)}
          />
        </Modal>
      )}

      {/* ENHANCED OCR MODAL */}
      {showOCRModal && (
        <Modal title="📸 Smart Bill Scanner" onClose={() => setShowOCRModal(false)} size="lg">
          <OCRReader 
            onExtractedData={handleOCRExtractedData}
            onClose={() => setShowOCRModal(false)}
          />
        </Modal>
      )}

      {/* ANOMALY DETAIL MODAL */}
      {showAnomalyDetail && selectedAnomaly && (
        <Modal title="🚨 Anomaly Details" onClose={() => setShowAnomalyDetail(false)}>
          <div className="space-y-6">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                selectedAnomaly.severity === "high" ? "bg-red-500/20" :
                selectedAnomaly.severity === "medium" ? "bg-orange-500/20" :
                "bg-yellow-500/20"
              }`}>
                <AlertTriangle className={`w-8 h-8 ${
                  selectedAnomaly.severity === "high" ? "text-red-500" :
                  selectedAnomaly.severity === "medium" ? "text-orange-500" :
                  "text-yellow-500"
                }`} />
              </div>
              <h3 className="text-lg font-semibold mt-4">Unusual Transaction Detected</h3>
              <Badge className={`mt-2 ${
                selectedAnomaly.severity === "high" ? "bg-red-500/20 text-red-500" :
                selectedAnomaly.severity === "medium" ? "bg-orange-500/20 text-orange-500" :
                "bg-yellow-500/20 text-yellow-500"
              }`}>
                {selectedAnomaly.severity.toUpperCase()} Risk
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/30 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">Amount</div>
                  <div className="text-lg font-bold text-red-600">
                    ₹{selectedAnomaly.amount.toLocaleString()}
                  </div>
                </div>
                <div className="bg-secondary/30 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground">Confidence</div>
                  <div className="text-lg font-bold">{selectedAnomaly.confidence}%</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Why this was flagged:</h4>
                <div className="space-y-2">
                  {selectedAnomaly.anomaly_reasons.map((reason: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Alert className="bg-gradient-to-r from-red-500/10 to-orange-500/10">
                <Lightbulb className="h-4 w-4 text-orange-500" />
                <AlertTitle>AI Recommendation</AlertTitle>
                <AlertDescription>
                  {selectedAnomaly.severity === "high" 
                    ? "Consider verifying this transaction immediately."
                    : "Monitor similar transactions for unusual patterns."}
                </AlertDescription>
              </Alert>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  toast.success("Marked as reviewed");
                  setShowAnomalyDetail(false);
                }}
              >
                Mark as Reviewed
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => {
                  toast.success("Reported for investigation");
                  setShowAnomalyDetail(false);
                }}
              >
                Report Issue
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* AI INSIGHTS MODAL */}
      {showAnomalyInsights && (
        <Modal title="🤖 AI Expense Insights" onClose={() => setShowAnomalyInsights(false)} size="lg">
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🔍</div>
              <h3 className="text-lg font-semibold">Smart Analysis Report</h3>
              <p className="text-sm text-muted-foreground">
                {anomalies.length} anomalies detected in your spending
              </p>
            </div>
            
            {anomalies.length > 0 ? (
              <>
                <div className="space-y-3">
                  {anomalies.slice(0, 5).map((anomaly, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg hover:bg-secondary/40 cursor-pointer"
                      onClick={() => {
                        setSelectedAnomaly(anomaly);
                        setShowAnomalyDetail(true);
                        setShowAnomalyInsights(false);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          anomaly.severity === "high" ? "bg-red-500/20" :
                          anomaly.severity === "medium" ? "bg-orange-500/20" :
                          "bg-yellow-500/20"
                        }`}>
                          <AlertTriangle className={`w-4 h-4 ${
                            anomaly.severity === "high" ? "text-red-500" :
                            anomaly.severity === "medium" ? "text-orange-500" :
                            "text-yellow-500"
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">{anomaly.narration}</p>
                          <p className="text-xs text-muted-foreground">
                            {anomaly.category} • {new Date(anomaly.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">-₹{anomaly.amount.toLocaleString()}</p>
                        <Badge className={`text-xs ${
                          anomaly.severity === "high" ? "bg-red-500/20 text-red-500" :
                          anomaly.severity === "medium" ? "bg-orange-500/20 text-orange-500" :
                          "bg-yellow-500/20 text-yellow-500"
                        }`}>
                          {anomaly.anomaly_score}% match
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertTitle>AI Summary</AlertTitle>
                  <AlertDescription>
                    {anomalies.length === 1 
                      ? "We detected 1 unusual transaction. Review it for accuracy."
                      : `We detected ${anomalies.length} unusual transactions. Consider reviewing your spending patterns.`}
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="text-lg font-semibold mb-2">No Anomalies Found</h3>
                <p className="text-sm text-muted-foreground">
                  Your spending patterns appear normal. Keep up the good financial habits!
                </p>
              </div>
            )}
            
            <div className="pt-4 border-t">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={exportToCSV}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => setShowAnomalyInsights(false)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Transactions
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* HELPER ICON COMPONENT */
function CircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}