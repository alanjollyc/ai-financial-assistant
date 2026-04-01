import { useEffect, useState, useRef } from "react";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Crown, Key, DollarSign, Trophy, Users, Target, 
  Flame, Star, Sparkles, Gift, Calendar, Copy, Check,
  Share2, Coins, TrendingUp, Zap, Award, Rocket, MessageSquare,
  RefreshCw, Brain, Wallet, TrendingDown, AlertTriangle, Lightbulb,
  Gem, Heart, Bolt, Timer, PartyPopper, Target as TargetIcon,
  LineChart, Users as UsersIcon, CheckCircle, Clock, IndianRupee,
  Rocket as RocketIcon, Sparkles as SparklesIcon, Zap as ZapIcon,
  Flame as FlameIcon, Crown as CrownIcon, BrainCircuit,
  Send, ChevronRight, ChevronLeft, Search, Filter, MoreVertical,
  Smile, Paperclip, Mic, Image, Video, FileText, X, Eye,
  Download, Trash2, Edit, Flag, Bell, BellOff, Volume2,
  VolumeX, Settings, HelpCircle, LogOut, User, Shield,
  Lock, Unlock, CreditCard, BarChart, PieChart, TrendingUp as TrendingUpIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ================= UTILS ================= */
const generateJoinCode = () =>
  Math.random().toString(36).substring(2, 6).toUpperCase() +
  "-" +
  Math.random().toString(36).substring(2, 6).toUpperCase();

const getDisplayName = (email?: string | null) => {
  if (!email) return "User";
  const username = email.split("@")[0];
  return username.charAt(0).toUpperCase() + username.slice(1);
};

const getEmailPrefix = (email?: string | null) => {
  if (!email) return "U";
  return email.split("@")[0].charAt(0).toUpperCase();
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/* ================= IMPROVED AI PREDICTOR ================= */
const predictGroupSuccess = (group: any) => {
  const total = group.group_members?.reduce(
    (s: number, m: any) => s + Number(m.contribution || 0),
    0
  ) || 0;
  
  const progress = Math.min((total / group.target) * 100, 100);
  const daysLeft = Math.ceil((new Date(group.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate daily contributions
  const daysActive = Math.max(1, Math.floor((new Date().getTime() - new Date(group.created_at).getTime()) / (1000 * 60 * 60 * 24)));
  const dailyRate = total / daysActive;
  
  // Calculate required daily rate to reach target
  const requiredDaily = Math.max(0, (group.target - total) / Math.max(daysLeft, 1));
  
  // Base probability starts with progress percentage
  let probability = progress;
  
  // Adjust based on time factor (more time = higher probability)
  if (daysLeft > 0) {
    const timeFactor = Math.min(1.5, daysLeft / 30 + 0.5); // 0.5 to 1.5 factor
    probability *= timeFactor;
  }
  
  // Adjust based on member participation
  const activeMembers = group.group_members?.filter((m: any) => m.contribution > 0).length || 0;
  const totalMembers = group.group_members?.length || 1;
  const participationRate = activeMembers / totalMembers;
  
  probability *= (0.7 + (participationRate * 0.3)); // 0.7 to 1.0 factor
  
  // Adjust based on consistency (if daily rate meets required rate)
  if (dailyRate > 0 && requiredDaily > 0) {
    const consistencyFactor = Math.min(1.3, dailyRate / requiredDaily);
    probability *= consistencyFactor;
  }
  
  // Bonus for groups with more members
  const memberFactor = Math.min(1.2, totalMembers / 5);
  probability *= memberFactor;
  
  // Cap probability between 0-100
  probability = Math.min(100, Math.max(0, Math.round(probability)));
  
  // Determine color based on realistic ranges
  let color, badgeColor;
  
  if (probability >= 85) {
    color = "text-green-500";
    badgeColor = "bg-green-500/20 text-green-500";
  } else if (probability >= 70) {
    color = "text-green-400";
    badgeColor = "bg-green-400/20 text-green-400";
  } else if (probability >= 50) {
    color = "text-yellow-500";
    badgeColor = "bg-yellow-500/20 text-yellow-500";
  } else if (probability >= 30) {
    color = "text-orange-500";
    badgeColor = "bg-orange-500/20 text-orange-500";
  } else {
    color = "text-red-500";
    badgeColor = "bg-red-500/20 text-red-500";
  }
  
  return {
    probability,
    willSucceed: probability >= 60,
    requiredDaily: Math.round(requiredDaily),
    status: probability >= 85 ? "Excellent" :
            probability >= 70 ? "Good" :
            probability >= 50 ? "Fair" :
            probability >= 30 ? "Needs Push" : "Critical",
    color,
    badgeColor
  };
};

const getAIGroupInsights = (group: any) => {
  const total = group.group_members?.reduce(
    (s: number, m: any) => s + Number(m.contribution || 0),
    0
  ) || 0;
  const progress = (total / group.target) * 100;
  const daysLeft = Math.ceil((new Date(group.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  const insights = [];
  
  if (progress >= 100) {
    insights.push("🎉 Mission Accomplished! This group has successfully reached its goal!");
    insights.push("🏆 Consider creating a new challenge to keep the momentum going!");
  } else if (progress >= 90) {
    insights.push("🔥 So close! Just a little more push to reach 100%!");
    insights.push("💡 Top contributors could help close the gap faster.");
  } else if (progress >= 70) {
    insights.push("📈 Great momentum! The group is on track to hit the target.");
    insights.push("🤝 Encourage members who haven't contributed recently.");
  } else if (progress >= 50) {
    insights.push("⚡ Halfway there! Consistent contributions will ensure success.");
    insights.push("🎯 Focus on reaching 70% in the next week.");
  } else if (progress >= 30) {
    insights.push("🌱 Good start! The foundation is set for success.");
    insights.push("📢 A group reminder could boost participation.");
  } else {
    insights.push("🚀 Just beginning! Every contribution counts towards the goal.");
    insights.push("💎 Early contributors set the pace for others.");
  }
  
  if (daysLeft <= 7) {
    insights.push("⏰ Deadline approaching! Consider extending or pushing harder.");
  } else if (daysLeft <= 14) {
    insights.push("📅 Two weeks left! Time to accelerate contributions.");
  }
  
  return insights.slice(0, 3);
};

const getMotivationalQuote = () => {
  const quotes = [
    "🚀 Together, we save faster! Every contribution brings us closer to our goal!",
    "💎 Your savings today create memories tomorrow. Keep going!",
    "🔥 Consistency is the secret sauce of successful group savings!",
    "🏆 The journey of a thousand rupees begins with a single contribution!",
    "👑 Leaders don't just create groups, they inspire action!",
    "⚡ Small contributions, when combined, create massive impact!",
    "🌟 Your discipline today fuels your dreams tomorrow!",
    "💪 Teamwork makes the dream work! Let's hit that target together!",
    "🎯 Focus on the goal, not the obstacles. We've got this!",
    "✨ Every rupee saved is a step closer to financial freedom!"
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
};

/* ================= TYPES ================= */
interface GroupMember {
  id: string;
  user_id: string;
  email: string;
  contribution: number;
  is_owner: boolean;
  displayName: string;
  initial: string;
}

interface Group {
  id: string;
  name: string;
  target: number;
  deadline: string;
  join_code: string;
  created_at: string;
  owner_id: string;
  group_members: GroupMember[];
  status?: 'active' | 'completed' | 'claimed';
  completed_at?: string;
}

interface ChatMessage {
  id: string;
  group_id: string;
  user_id: string;
  user_email: string;
  message: string;
  created_at: string;
}

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userPoints, setUserPoints] = useState<number>(0);
  const [currentBalance, setCurrentBalance] = useState<number>(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState<any>(null);
  const [showSuccessPredictor, setShowSuccessPredictor] = useState<any>(null);
  const [showClaimModal, setShowClaimModal] = useState<Group | null>(null);
  const [showGroupDetails, setShowGroupDetails] = useState<Group | null>(null);
  const [showChat, setShowChat] = useState<Group | null>(null);

  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [copiedCode, setCopiedCode] = useState<string>("");

  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Leaderboard states
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // AI Challenge states
  const [aiChallenges, setAiChallenges] = useState([
    { id: 1, title: "AI Weekly Target", desc: "Save ₹1000 this week", progress: 0, target: 1000, current: 0, reward: "🎖️", points: 100, aiTip: "Start by contributing to your groups" },
    { id: 2, title: "Group Dynamo", desc: "Complete 2 group contributions", progress: 0, target: 2, current: 0, reward: "⚡", points: 150, aiTip: "Join more groups to participate" },
    { id: 3, title: "Early Bird", desc: "Save before deadline in 3 groups", progress: 0, target: 3, current: 0, reward: "🌅", points: 200, aiTip: "Contribute early in new groups" },
  ]);

  /* 🔁 FETCH REAL USER BALANCE */
  const fetchUserBalance = async (userId: string) => {
    try {
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("amount, type")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching transactions:", error);
        return 0;
      }

      let balance = 0;
      transactions?.forEach(transaction => {
        if (transaction.type === "CREDIT") {
          balance += Number(transaction.amount);
        } else if (transaction.type === "DEBIT") {
          balance -= Number(transaction.amount);
        }
      });

      return balance > 0 ? balance : 0;
    } catch (error) {
      console.error("Error calculating balance:", error);
      return 0;
    }
  };

  /* 🔁 FETCH GROUPS WITH REAL BALANCE */
  const fetchGroups = async () => {
    setLoading(true);
    console.log("🔍 Starting to fetch groups...");

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      const user = userData?.user;
      if (!user) {
        console.log("❌ No user found");
        setLoading(false);
        return;
      }

      console.log("👤 User ID:", user.id);
      setUserEmail(user.email ?? "");
      setUserName(getDisplayName(user.email));
      setCurrentUserId(user.id);

      const userBalance = await fetchUserBalance(user.id);
      setCurrentBalance(userBalance);
      console.log("💰 User balance:", userBalance);

      const { data: memberships, error: membershipError } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (membershipError) {
        console.error("❌ Error fetching memberships:", membershipError);
        throw membershipError;
      }

      console.log("📋 User is member of groups:", memberships);

      if (!memberships || memberships.length === 0) {
        console.log("📭 User is not a member of any groups");
        setGroups([]);
        setLoading(false);
        return;
      }

      const groupIds = memberships.map(m => m.group_id);
      
      const { data: groupsData, error: groupsError } = await supabase
        .from("saving_groups")
        .select(`
          id,
          name,
          target,
          deadline,
          join_code,
          created_at,
          owner_id,
          status,
          completed_at,
          group_members (
            id,
            user_id,
            contribution,
            is_owner,
            email
          )
        `)
        .in("id", groupIds)
        .order("created_at", { ascending: false });

      if (groupsError) {
        console.error("❌ Error fetching groups:", groupsError);
        throw groupsError;
      }

      console.log("✅ Fetched groups data:", groupsData);

      let totalPoints = 0;
      const processedGroups: Group[] = (groupsData || []).map(group => {
        const userMember = group.group_members?.find((m: any) => m.user_id === user.id);
        
        if (userMember) {
          const contribution = userMember.contribution || 0;
          totalPoints += Math.floor(contribution / 100) * 5;
          if (userMember.is_owner) totalPoints += 50;
        }

        const processedMembers = (group.group_members || []).map((member: any) => {
          return {
            ...member,
            displayName: getDisplayName(member.email),
            initial: getEmailPrefix(member.email)
          };
        });

        return {
          ...group,
          group_members: processedMembers
        };
      });

      console.log("✅ Processed groups:", processedGroups);
      console.log("💰 Total points:", totalPoints);
      
      setGroups(processedGroups);
      setUserPoints(totalPoints);
      
      updateAiChallenges(processedGroups, user.id);
      
    } catch (error) {
      console.error("🔥 Error in fetchGroups:", error);
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const updateAiChallenges = (groupsData: Group[], userId: string) => {
    const totalWeekly = groupsData.reduce((sum, group) => {
      const userMember = group.group_members?.find((m: any) => m.user_id === userId);
      return sum + Number(userMember?.contribution || 0);
    }, 0);
    
    const contributedGroups = groupsData.filter(group => {
      const userMember = group.group_members?.find((m: any) => m.user_id === userId);
      return userMember && userMember.contribution > 0;
    }).length;
    
    const earlyContributions = groupsData.filter(group => {
      const userMember = group.group_members?.find((m: any) => m.user_id === userId);
      const daysLeft = Math.ceil((new Date(group.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return userMember && userMember.contribution > 0 && daysLeft > 7;
    }).length;
    
    setAiChallenges([
      { 
        id: 1, 
        title: "AI Weekly Target", 
        desc: "Save ₹1000 this week", 
        progress: Math.min(100, (totalWeekly / 1000) * 100), 
        target: 1000, 
        current: totalWeekly, 
        reward: "🎖️", 
        points: 100,
        aiTip: totalWeekly >= 1000 ? "🎯 Weekly target achieved!" : `Save ₹${1000 - totalWeekly} more to hit weekly target`
      },
      { 
        id: 2, 
        title: "Group Dynamo", 
        desc: "Complete 2 group contributions", 
        progress: Math.min(100, (contributedGroups / 2) * 100), 
        target: 2, 
        current: contributedGroups, 
        reward: "⚡", 
        points: 150,
        aiTip: contributedGroups >= 2 ? "✅ All groups contributed!" : `Contribute to ${2 - contributedGroups} more group${2 - contributedGroups > 1 ? 's' : ''}`
      },
      { 
        id: 3, 
        title: "Early Bird", 
        desc: "Save before deadline in 3 groups", 
        progress: Math.min(100, (earlyContributions / 3) * 100), 
        target: 3, 
        current: earlyContributions, 
        reward: "🌅", 
        points: 200,
        aiTip: earlyContributions >= 3 ? "🌟 Early bird master!" : `Make early contribution in ${3 - earlyContributions} more group${3 - earlyContributions > 1 ? 's' : ''}`
      },
    ]);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  /* 📊 FETCH REAL LEADERBOARD */
  const fetchRealLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      const { data: allGroupMembers, error } = await supabase
        .from("group_members")
        .select(`
          user_id,
          email,
          contribution,
          is_owner
        `);

      if (error) {
        console.error("Error fetching leaderboard data:", error);
        toast.error("Failed to load leaderboard");
        return [];
      }

      const userMap = new Map();
      
      allGroupMembers?.forEach((member: any) => {
        const userId = member.user_id;
        const current = userMap.get(userId) || {
          email: member.email,
          total: 0,
          groupCount: 0,
          isOwnerCount: 0
        };
        
        current.total += Number(member.contribution || 0);
        current.groupCount += 1;
        if (member.is_owner) current.isOwnerCount += 1;
        
        userMap.set(userId, current);
      });

      const leaderboard = Array.from(userMap.entries())
        .map(([userId, data]) => ({
          userId,
          email: data.email,
          displayName: getDisplayName(data.email),
          totalSaved: data.total,
          groupCount: data.groupCount,
          isOwnerCount: data.isOwnerCount,
          points: Math.floor(data.total / 100) * 5 + (data.isOwnerCount * 50)
        }))
        .sort((a, b) => b.totalSaved - a.totalSaved)
        .slice(0, 10);

      setLeaderboardData(leaderboard);
      return leaderboard;
    } catch (error) {
      console.error("Error in fetchRealLeaderboard:", error);
      toast.error("Failed to load leaderboard");
      return [];
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    if (showLeaderboard) {
      fetchRealLeaderboard();
    }
  }, [showLeaderboard]);

  /* 💬 FETCH CHAT MESSAGES */
  const fetchChatMessages = async (groupId: string) => {
    if (!groupId) return;
    
    setChatLoading(true);
    try {
      const { data: messages, error } = await supabase
        .from("group_chat_messages")
        .select("*")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching chat messages:", error);
        // If table doesn't exist, return empty array
        return [];
      }

      setChatMessages(messages || []);
      
      // Scroll to bottom after messages load
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
      
    } catch (error) {
      console.error("Error in fetchChatMessages:", error);
    } finally {
      setChatLoading(false);
    }
  };

  /* 💬 SEND CHAT MESSAGE */
  const sendMessage = async () => {
    if (!newMessage.trim() || !showChat || !currentUserId) return;

    try {
      const messageData = {
        group_id: showChat.id,
        user_id: currentUserId,
        user_email: userEmail,
        message: newMessage.trim()
      };

      // First try to insert into group_chat_messages table
      const { error: chatError } = await supabase
        .from("group_chat_messages")
        .insert(messageData);

      if (chatError) {
        // If table doesn't exist, create a temporary message
        console.log("Chat table might not exist, using temporary messages");
        const tempMessage: ChatMessage = {
          id: Date.now().toString(),
          ...messageData,
          created_at: new Date().toISOString()
        };
        
        setChatMessages(prev => [...prev, tempMessage]);
      } else {
        // Refresh messages if inserted successfully
        fetchChatMessages(showChat.id);
      }

      setNewMessage("");
      
      // Scroll to bottom
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  /* ➕ CREATE GROUP */
  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      toast.error("You must be logged in to create a group");
      return;
    }

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

    try {
      const { data: group, error: groupError } = await supabase
        .from("saving_groups")
        .insert({
          name: name.trim(),
          target: targetNum,
          deadline: deadlineDate.toISOString(),
          join_code: generateJoinCode(),
          owner_id: userData.user.id,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (groupError) {
        console.error("Group creation error:", groupError);
        
        const { data: altGroup, error: altError } = await supabase
          .from("saving_groups")
          .insert({
            name: name.trim(),
            target: targetNum,
            deadline: deadlineDate.toISOString(),
            join_code: generateJoinCode(),
          })
          .select()
          .single();

        if (altError) throw altError;

        const { error: memberError } = await supabase.from("group_members").insert({
          group_id: altGroup.id,
          user_id: userData.user.id,
          email: userData.user.email,
          is_owner: true,
          contribution: 0,
        });

        if (memberError) throw memberError;

        setShowCreate(false);
        setName("");
        setTarget("");
        setDeadline("");
        
        setUserPoints(prev => prev + 50);
        
        toast.success("🎉 Group created successfully!");
        fetchGroups();
        return;
      }

      const { error: memberError } = await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: userData.user.id,
        email: userData.user.email,
        is_owner: true,
        contribution: 0,
      });

      if (memberError) throw memberError;

      setShowCreate(false);
      setName("");
      setTarget("");
      setDeadline("");
      
      setUserPoints(prev => prev + 50);
      
      toast.success("🎉 Group created successfully!");
      fetchGroups();
      
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
    }
  };

  /* 🔑 JOIN GROUP */
  const joinGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      toast.error("You must be logged in to join a group");
      return;
    }

    if (!joinCode.trim()) {
      toast.error("Please enter a group code");
      return;
    }

    try {
      const { data: group, error: groupError } = await supabase
        .from("saving_groups")
        .select("id, name")
        .eq("join_code", joinCode.trim().toUpperCase())
        .single();

      if (groupError) {
        toast.error("Invalid group code. Please check and try again.");
        return;
      }

      const { data: existingMember } = await supabase
        .from("group_members")
        .select("id")
        .eq("group_id", group.id)
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (existingMember) {
        toast.warning("You are already a member of this group");
        return;
      }

      const { error: joinError } = await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: userData.user.id,
        email: userData.user.email,
        contribution: 0,
        is_owner: false,
      });

      if (joinError) throw joinError;

      setShowJoin(false);
      setJoinCode("");
      
      setUserPoints(prev => prev + 25);
      
      toast.success(`🎉 Successfully joined "${group.name}"!`);
      fetchGroups();
      
    } catch (error) {
      console.error("Error joining group:", error);
      toast.error("Failed to join group. Please try again.");
    }
  };

  /* 💰 ADD MONEY */
  const addMoney = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user || !activeGroup || amount <= 0) return;

    try {
      const currentBalance = await fetchUserBalance(userData.user.id);
      
      if (amount > currentBalance) {
        toast.error(`Insufficient balance! You have ${formatCurrency(currentBalance)} available`);
        return;
      }

      const member = activeGroup.group_members.find(
        (m: any) => m.user_id === userData.user.id
      );

      if (!member) {
        toast.error("You are not a member of this group");
        return;
      }

      const newAmount = Number(member.contribution || 0) + Number(amount);

      const { error: updateError } = await supabase
        .from("group_members")
        .update({ contribution: newAmount })
        .eq("group_id", activeGroup.id)
        .eq("user_id", userData.user.id);

      if (updateError) throw updateError;

      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: userData.user.id,
          narration: `Group Contribution: ${activeGroup.name}`,
          amount: amount,
          type: "DEBIT",
          transaction_timestamp: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
          category: "Group Savings",
          source: "GROUP_CONTRIBUTION",
          vendor: "Group Savings"
        });

      if (txError) {
        console.error("Transaction recording error:", txError);
        await supabase
          .from("group_members")
          .update({ contribution: member.contribution })
          .eq("group_id", activeGroup.id)
          .eq("user_id", userData.user.id);
        
        throw new Error("Failed to record transaction");
      }

      try {
        const { error: contribError } = await supabase
          .from("group_contributions")
          .insert({
            group_id: activeGroup.id,
            user_id: userData.user.id,
            amount: amount
          });

        if (contribError) {
          console.warn("Could not record in group_contributions table:", contribError);
        }
      } catch (contribError) {
        console.warn("Group contributions table might not exist:", contribError);
      }

      setActiveGroup(null);
      setAmount(0);
      
      const updatedBalance = await fetchUserBalance(userData.user.id);
      setCurrentBalance(updatedBalance);
      
      const pointsEarned = Math.floor(amount / 100) * 5;
      setUserPoints(prev => prev + pointsEarned);
      
      toast.success(`💰 ${formatCurrency(amount)} contributed successfully! Earned ${pointsEarned} points!`);
      fetchGroups();
      
    } catch (error) {
      console.error("Error adding money:", error);
      toast.error("Failed to add contribution. Please try again.");
    }
  };

  /* 🏆 CLAIM COMPLETED GROUP - ADMIN ONLY */
  const claimGroup = async (group: Group) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      toast.error("You must be logged in to claim a group");
      return;
    }

    // Check if user is the group admin/owner
    const isOwner = group.group_members?.some(
      (member: GroupMember) => member.user_id === userData.user.id && member.is_owner
    );

    if (!isOwner) {
      toast.error("Only group admin can claim the funds");
      return;
    }

    try {
      // Calculate total amount in the group
      const totalAmount = group.group_members?.reduce(
        (sum: number, member: GroupMember) => sum + Number(member.contribution || 0),
        0
      ) || 0;

      // Mark group as claimed
      const { error: updateError } = await supabase
        .from("saving_groups")
        .update({ 
          status: 'claimed',
          completed_at: new Date().toISOString()
        })
        .eq("id", group.id);

      if (updateError) throw updateError;

      // Add money back to each member's balance
      for (const member of group.group_members) {
        if (member.contribution > 0) {
          const { error: txError } = await supabase
            .from("transactions")
            .insert({
              user_id: member.user_id,
              narration: `Group Claimed: ${group.name}`,
              amount: member.contribution,
              type: "CREDIT",
              transaction_timestamp: new Date().toISOString(),
              date: new Date().toISOString().split('T')[0],
              category: "Group Savings",
              source: "GROUP_CLAIMED",
              vendor: "Group Savings"
            });

          if (txError) {
            console.error(`Error recording transaction for user ${member.user_id}:`, txError);
          }
        }
      }

      // Update current user's balance if they're in this group
      const userMember = group.group_members.find(m => m.user_id === userData.user.id);
      if (userMember && userMember.contribution > 0) {
        const updatedBalance = await fetchUserBalance(userData.user.id);
        setCurrentBalance(updatedBalance);
      }

      setShowClaimModal(null);
      
      // Add bonus points for claiming (admin only)
      setUserPoints(prev => prev + 100);
      
      toast.success(`🎉 Successfully claimed ${formatCurrency(totalAmount)} from "${group.name}"!`);
      fetchGroups();
      
    } catch (error) {
      console.error("Error claiming group:", error);
      toast.error("Failed to claim group. Please try again.");
    }
  };

  /* 📋 COPY GROUP CODE */
  const copyGroupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Group code copied!");
    setTimeout(() => setCopiedCode(""), 2000);
  };

  /* 🏆 CALCULATE STATS */
  const totalSpent = groups.reduce((sum, group) => {
    const userMember = group.group_members?.find((m: any) => m.user_id === currentUserId);
    return sum + Number(userMember?.contribution || 0);
  }, 0);

  const totalJoined = groups.length;
  const overallTotalSaved = groups.reduce((sum, group) => {
    return sum + (group.group_members?.reduce((s: number, m: any) => s + Number(m.contribution || 0), 0) || 0);
  }, 0);

  const overallTotalTarget = groups.reduce((sum, group) => sum + Number(group.target || 0), 0);
  const overallProgress = overallTotalTarget ? (overallTotalSaved / overallTotalTarget) * 100 : 0;

  /* EFFECT FOR CHAT */
  useEffect(() => {
    if (showChat) {
      fetchChatMessages(showChat.id);
      
      // Set up real-time subscription for chat messages
      const channel = supabase
        .channel(`group_chat_${showChat.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'group_chat_messages',
            filter: `group_id=eq.${showChat.id}`
          },
          (payload) => {
            setChatMessages(prev => [...prev, payload.new as ChatMessage]);
            
            // Scroll to bottom when new message arrives
            setTimeout(() => {
              if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
              }
            }, 100);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [showChat]);

  /* 📱 MODALS */
  
  // CREATE GROUP MODAL
  const CreateGroupModal = () => (
    <Modal title="Create New Group" onClose={() => setShowCreate(false)}>
      <form onSubmit={createGroup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Group Name</label>
          <Input 
            placeholder="e.g., Bali Trip 2024" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            required 
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Target Amount (₹)</label>
          <Input 
            type="number" 
            placeholder="e.g., 50000" 
            value={target} 
            onChange={e => setTarget(e.target.value)} 
            required 
            min="1"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Deadline</label>
          <Input 
            type="date" 
            value={deadline} 
            onChange={e => setDeadline(e.target.value)} 
            required 
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        
        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Group Features
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✅ You'll be the group admin (owner)</li>
            <li>✅ Invite friends with group code</li>
            <li>✅ Track everyone's contributions</li>
            <li>✅ Earn bonus points for creating group</li>
            <li>✅ AI insights and predictions</li>
          </ul>
        </div>
        
        <Button 
          type="submit" 
          className="w-full py-6 text-lg bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700"
          disabled={!name || !target || !deadline}
        >
          <Rocket className="w-5 h-5 mr-2" />
          Create Group
        </Button>
      </form>
    </Modal>
  );

  // JOIN GROUP MODAL
  const JoinGroupModal = () => (
    <Modal title="Join Existing Group" onClose={() => setShowJoin(false)}>
      <form onSubmit={joinGroup} className="space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">🔑</div>
          <h3 className="text-lg font-semibold">Enter Group Code</h3>
          <p className="text-sm text-muted-foreground">
            Ask your friend for the group code (format: ABCD-EFGH)
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Group Code</label>
          <Input
            placeholder="e.g., ABCD-EFGH"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            className="text-center text-lg tracking-widest uppercase"
            required
          />
          <p className="text-xs text-muted-foreground mt-2">
            Code is case-insensitive
          </p>
        </div>
        
        <div className="bg-secondary/30 p-4 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Group Benefits
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✅ Save together towards common goals</li>
            <li>✅ Friendly competition with leaderboards</li>
            <li>✅ Earn points for contributions</li>
            <li>✅ Get AI insights on group progress</li>
            <li>✅ Support each other's savings journey</li>
          </ul>
        </div>
        
        <Button 
          type="submit" 
          className="w-full py-6 text-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
          disabled={!joinCode.trim()}
        >
          <Key className="w-5 h-5 mr-2" />
          Join Group
        </Button>
      </form>
    </Modal>
  );

  // LEADERBOARD MODAL
  const LeaderboardModal = () => (
    <Modal title="🏆 Group Leaderboard" onClose={() => setShowLeaderboard(false)}>
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">👑</div>
          <h3 className="text-lg font-semibold">Top Contributors</h3>
          <p className="text-sm text-muted-foreground">
            Based on total contributions across all groups
          </p>
        </div>
        
        {loadingLeaderboard ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading leaderboard...</p>
          </div>
        ) : leaderboardData.length === 0 ? (
          <div className="text-center py-8 bg-secondary/30 rounded-lg">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No data yet. Be the first to contribute!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboardData.map((user, index) => (
              <div 
                key={user.userId} 
                className={`p-4 rounded-lg flex items-center justify-between ${
                  user.userId === currentUserId 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'bg-secondary/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-amber-700 text-white' :
                    'bg-secondary text-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{user.displayName}</div>
                    <div className="text-xs text-muted-foreground">
                      {user.groupCount} group{user.groupCount !== 1 ? 's' : ''}
                      {user.isOwnerCount > 0 && ` • ${user.isOwnerCount} created`}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatCurrency(user.totalSaved)}</div>
                  <div className="text-xs text-muted-foreground">{user.points} pts</div>
                </div>
              </div>
            ))}
            
            {!leaderboardData.some(user => user.userId === currentUserId) && currentUserId && (
              <div className="p-4 bg-secondary/30 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  Start contributing to appear on the leaderboard!
                </p>
              </div>
            )}
          </div>
        )}
        
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            How to Rank Higher
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Contribute regularly to your groups</li>
            <li>• Create new groups (50 bonus points)</li>
            <li>• Invite friends to join your groups</li>
            <li>• Reach group targets before deadlines</li>
            <li>• Be an active participant in all groups</li>
          </ul>
        </div>
      </div>
    </Modal>
  );

  // GROUP DETAILS MODAL
  const GroupDetailsModal = () => {
    if (!showGroupDetails) return null;
    
    const total = showGroupDetails.group_members?.reduce(
      (s: number, m: any) => s + Number(m.contribution || 0),
      0
    ) || 0;
    const progress = Math.min((total / showGroupDetails.target) * 100, 100);
    const isCompleted = progress >= 100;
    const isClaimed = showGroupDetails.status === 'claimed';
    const isOwner = showGroupDetails.group_members?.some(
      (m: any) => m.user_id === currentUserId && m.is_owner
    );
    
    return (
      <Modal title={`📊 ${showGroupDetails.name} Details`} onClose={() => setShowGroupDetails(null)}>
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-2">👥</div>
            <h3 className="text-lg font-semibold">{showGroupDetails.name}</h3>
            <p className="text-sm text-muted-foreground">
              Created on {formatDate(showGroupDetails.created_at)}
              {isOwner && ' • 👑 You are the admin'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-secondary/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Target</p>
              <p className="font-bold">{formatCurrency(showGroupDetails.target)}</p>
            </div>
            <div className="p-3 bg-secondary/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className="font-bold">{formatDate(showGroupDetails.deadline)}</p>
            </div>
            <div className="p-3 bg-secondary/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Collected</p>
              <p className="font-bold text-green-600">{formatCurrency(total)}</p>
            </div>
            <div className="p-3 bg-secondary/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className={`font-bold ${
                isClaimed ? 'text-purple-600' :
                isCompleted ? 'text-green-600' : 'text-blue-600'
              }`}>
                {isClaimed ? 'Claimed' : isCompleted ? 'Completed' : 'Active'}
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Group Members ({showGroupDetails.group_members?.length || 0})
            </h4>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {showGroupDetails.group_members?.map((member, index) => (
                <div key={member.id} className="p-3 bg-secondary/30 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                      {member.initial}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {member.displayName}
                        {member.is_owner && <Crown className="w-3 h-3 text-yellow-500" />}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {member.email}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(member.contribution)}</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((member.contribution / showGroupDetails.target) * 100)}% of target
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              Contribution Distribution
            </h4>
            <div className="space-y-2">
              {showGroupDetails.group_members?.map((member, index) => {
                const percentage = Math.round((member.contribution / total) * 100);
                return (
                  <div key={member.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{member.displayName}</span>
                      <span>{formatCurrency(member.contribution)} ({percentage}%)</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowGroupDetails(null);
                setShowChat(showGroupDetails);
              }}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Open Chat
            </Button>
            {isCompleted && !isClaimed && isOwner && (
              <Button
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600"
                onClick={() => {
                  setShowGroupDetails(null);
                  setShowClaimModal(showGroupDetails);
                }}
              >
                <Gift className="w-4 h-4 mr-2" />
                Claim Funds
              </Button>
            )}
          </div>
        </div>
      </Modal>
    );
  };

  // CLAIM MODAL
  const ClaimModal = () => {
    if (!showClaimModal) return null;
    
    const totalAmount = showClaimModal.group_members?.reduce(
      (sum: number, member: GroupMember) => sum + Number(member.contribution || 0),
      0
    ) || 0;
    
    const isOwner = showClaimModal.group_members?.some(
      (member: GroupMember) => member.user_id === currentUserId && member.is_owner
    );
    
    return (
      <Modal title="🎉 Claim Group Funds" onClose={() => setShowClaimModal(null)}>
        <div className="space-y-6">
          <div className="text-center">
            <div className="text-5xl mb-2">🏆</div>
            <h3 className="text-lg font-semibold">Congratulations!</h3>
            <p className="text-sm text-muted-foreground">
              {showClaimModal.name} has reached its target!
            </p>
          </div>
          
          <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
            <div className="text-xs text-muted-foreground">Total Amount to Claim</div>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(totalAmount)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Will be distributed to all members
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-3">Distribution Details</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {showClaimModal.group_members?.map((member, index) => (
                <div key={member.id} className="p-2 bg-secondary/30 rounded flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                      {member.initial}
                    </div>
                    <span className="text-sm">{member.displayName}</span>
                    {member.is_owner && <Crown className="w-3 h-3 text-yellow-500" />}
                  </div>
                  <div className="font-semibold">{formatCurrency(member.contribution)}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Important Note
            </h4>
            <p className="text-sm text-muted-foreground">
              {isOwner 
                ? "Claiming will distribute funds back to each member's account based on their contributions. This action can only be performed by the group admin."
                : "Only the group admin can claim the funds. Please ask the group admin to claim the funds for distribution."}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowClaimModal(null)}
            >
              Cancel
            </Button>
            {isOwner ? (
              <Button
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600"
                onClick={() => claimGroup(showClaimModal)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Claim Now
              </Button>
            ) : (
              <Button
                className="flex-1 bg-gray-500"
                disabled
              >
                <Lock className="w-4 h-4 mr-2" />
                Admin Only
              </Button>
            )}
          </div>
        </div>
      </Modal>
    );
  };

  // CHAT MODAL
  const ChatModal = () => {
    if (!showChat) return null;
    
    const totalMembers = showChat.group_members?.length || 0;
    const isOwner = showChat.group_members?.some(m => 
      m.user_id === currentUserId && m.is_owner
    );
    
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-card w-full max-w-2xl h-[80vh] flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowChat(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="font-semibold">{showChat.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {totalMembers} member{totalMembers !== 1 ? 's' : ''}
                  {isOwner && ' • 👑 You are the admin'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowChat(null);
                  setShowGroupDetails(showChat);
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Details
              </Button>
              <button
                onClick={() => setShowChat(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Chat Messages */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {chatLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading messages...</p>
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                <p className="text-muted-foreground">Be the first to send a message!</p>
              </div>
            ) : (
              chatMessages.map((message, index) => {
                const isCurrentUser = message.user_id === currentUserId;
                const displayName = getDisplayName(message.user_email);
                const showHeader = index === 0 || 
                  chatMessages[index - 1].user_id !== message.user_id ||
                  new Date(message.created_at).getTime() - new Date(chatMessages[index - 1].created_at).getTime() > 300000; // 5 minutes
                
                return (
                  <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                      {!isCurrentUser && showHeader && (
                        <div className="flex items-center gap-2 mb-1 ml-1">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                            {getEmailPrefix(message.user_email)}
                          </div>
                          <span className="text-xs font-medium">{displayName}</span>
                        </div>
                      )}
                      <div className={`rounded-2xl px-4 py-2 ${
                        isCurrentUser 
                          ? 'bg-primary text-primary-foreground rounded-br-none' 
                          : 'bg-secondary rounded-bl-none'
                      }`}>
                        <p className="text-sm">{message.message}</p>
                      </div>
                      <div className={`text-xs text-muted-foreground mt-1 ${
                        isCurrentUser ? 'text-right mr-1' : 'ml-1'
                      }`}>
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                    {isCurrentUser && showHeader && (
                      <div className="order-1 ml-2">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
                          {getEmailPrefix(userEmail)}
                        </div>
                      </div>
                    )}
                    {!isCurrentUser && !showHeader && (
                      <div className="order-1 w-8"></div>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          {/* Chat Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-gradient-to-r from-primary to-blue-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Smile className="w-3 h-3" />
                Emoji
              </button>
              <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                Attach
              </button>
              <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Image className="w-3 h-3" />
                Image
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />

        <main className="p-6 space-y-6">
          {/* HEADER */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <UsersIcon className="w-6 h-6 text-primary" />
                🚀 Group Savings
                <Badge variant="secondary" className="ml-2">
                  {Math.floor(userPoints / 100) + 1}
                </Badge>
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-primary" />
                {getMotivationalQuote()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="font-semibold text-lg flex items-center gap-1">
                  <Wallet className="w-4 h-4 text-primary" />
                  {formatCurrency(currentBalance)}
                </p>
              </div>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                  {getEmailPrefix(userEmail)}
                </div>
                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {userPoints}
                </div>
              </div>
            </div>
          </div>

          {/* 🏆 STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-4 border border-green-500/20 hover:border-green-500/40 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-700">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-xl font-bold">{formatCurrency(currentBalance)}</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                Ready to invest in groups
              </div>
            </div>

            <div className="glass-card p-4 border border-blue-500/20 hover:border-blue-500/40 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-700">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Contributions</p>
                  <p className="text-xl font-bold">{formatCurrency(totalSpent)}</p>
                </div>
              </div>
              <Badge variant="outline" className="mt-2 bg-blue-500/10 text-blue-500">
                {totalJoined} joined
              </Badge>
            </div>

            <div className="glass-card p-4 border border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-700">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reward Points</p>
                  <p className="text-xl font-bold">{userPoints}</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Level {Math.floor(userPoints / 100) + 1}
              </div>
            </div>

            <div className="glass-card p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-700">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Group Savings</p>
                  <p className="text-xl font-bold">{formatCurrency(overallTotalSaved)}</p>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {groups.length} active groups
              </div>
            </div>
          </div>

          {/* 🧠 AI CHALLENGES */}
          <div className="glass-card p-6 border border-primary/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                🤖 AI-Powered Challenges
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAIInsights({ type: 'all' })}
              >
                <Lightbulb className="w-4 h-4 mr-1" />
                AI Insights
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiChallenges.map((challenge) => (
                <div key={challenge.id} className="bg-secondary/30 p-4 rounded-lg border border-primary/10">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">{challenge.title}</h3>
                    <Badge className="bg-yellow-500/20 text-yellow-500">
                      {challenge.points} pts
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{challenge.desc}</p>
                  
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{challenge.progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={challenge.progress} className="h-2" />
                    <div className="text-xs text-muted-foreground text-right">
                      {formatCurrency(challenge.current)} / {formatCurrency(challenge.target)}
                    </div>
                  </div>
                  
                  <div className="p-2 bg-primary/5 rounded text-xs">
                    <div className="flex items-center gap-1 mb-1">
                      <Brain className="w-3 h-3 text-primary" />
                      <span className="font-medium">AI Tip</span>
                    </div>
                    <p className="text-muted-foreground">{challenge.aiTip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 🌟 OVERALL PROGRESS */}
          <div className="glass-card p-6 border border-primary/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TargetIcon className="w-5 h-5 text-primary" />
                Overall Group Progress
              </h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowLeaderboard(true)}
                >
                  <Trophy className="w-4 h-4 mr-1" />
                  Leaderboard
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSuccessPredictor({ type: 'overall' })}
                >
                  <LineChart className="w-4 h-4 mr-1" />
                  Predict Success
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Collected</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(overallTotalSaved)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Target</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(overallTotalTarget)}
                  </p>
                </div>
              </div>
              
              <Progress value={overallProgress} className="h-3" />
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {overallProgress.toFixed(1)}% Complete
                </span>
                <span className="text-primary font-semibold">
                  {formatCurrency(overallTotalTarget - overallTotalSaved)} to go!
                </span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4">
            <Button 
              className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Group
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowJoin(true)}
            >
              <Key className="w-5 h-5 mr-2" />
              Join Existing Group
            </Button>
          </div>

          {/* 📱 GROUPS LIST */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading your groups...</p>
            </div>
          )}

          {!loading && groups.length === 0 && (
            <div className="text-center py-12 glass-card">
              <PartyPopper className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Savings Groups Yet</h3>
              <p className="text-muted-foreground mb-6">
                Start your savings journey by creating or joining a group!
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setShowJoin(true)}>
                  <Key className="w-4 h-4 mr-2" />
                  Join Group
                </Button>
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Group
                </Button>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {groups.map(group => {
              const total = group.group_members?.reduce(
                (s: number, m: any) => s + Number(m.contribution || 0),
                0
              ) || 0;
              const progress = Math.min((total / group.target) * 100, 100);
              const daysLeft = Math.ceil((new Date(group.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const isCompleted = progress >= 100;
              const isClaimed = group.status === 'claimed';
              const prediction = predictGroupSuccess(group);
              const aiInsights = getAIGroupInsights(group);
              const userMember = group.group_members?.find(m => m.user_id === currentUserId);
              const isOwner = userMember?.is_owner || false;
              const userContribution = userMember?.contribution || 0;

              return (
                <div 
                  key={group.id} 
                  className={`glass-card p-6 relative group-card ${isClaimed ? 'claimed bg-gray-50/50 border-gray-300' : 'border-l-4 border-primary'}`}
                >
                  
                  {/* STATUS BADGES - ALIGNED PROPERLY */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                    {isClaimed && (
                      <div className="status-badge bg-purple-500/20 text-purple-500">
                        ✅ Claimed
                      </div>
                    )}
                    {isCompleted && !isClaimed && (
                      <div className="status-badge bg-green-500/20 text-green-500">
                        🎉 Ready to Claim!
                      </div>
                    )}
                    <div className={`status-badge prediction-badge ${prediction.badgeColor}`}>
                      <Brain className="w-3 h-3 mr-1" />
                      {prediction.probability}% Success
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ⏰ {daysLeft}d left
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-start mb-4 pr-32">
                    <div>
                      <h3 className={`font-semibold text-lg flex items-center gap-2 ${isClaimed ? 'text-gray-500' : ''}`}>
                        {group.name}
                        {isOwner && <Crown className="w-4 h-4 text-yellow-500" />}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-xs ${isClaimed ? 'bg-gray-100 text-gray-500' : ''}`}>
                          🔢 Code: {group.join_code}
                        </Badge>
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => copyGroupCode(group.join_code)}
                        >
                          {copiedCode === group.join_code ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* PROGRESS BAR */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className={isClaimed ? 'text-gray-500' : 'text-muted-foreground'}>
                        {formatCurrency(total)} of {formatCurrency(group.target)}
                      </span>
                      <span className={`font-semibold ${isClaimed ? 'text-gray-500' : ''}`}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={progress} 
                      className={`h-3 ${isClaimed ? 'claimed-progress' : ''}`} 
                    />
                    <div className={`text-xs ${isClaimed ? 'text-gray-400' : 'text-muted-foreground'} mt-1`}>
                      Your contribution: {formatCurrency(userContribution)}
                    </div>
                  </div>

                  {/* MEMBER AVATARS WITH NAMES */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm ${isClaimed ? 'text-gray-500' : 'text-muted-foreground'}`}>
                        Group Members
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${isClaimed ? 'bg-gray-100 text-gray-500' : 'bg-secondary'}`}>
                        👥 {group.group_members?.length || 0} members
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.group_members?.map((member, idx) => (
                        <div 
                          key={member.id} 
                          className={`flex items-center gap-2 p-2 rounded-lg ${isClaimed ? 'bg-gray-100' : 'bg-secondary/30'}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${isClaimed ? 'bg-gray-400' : 'bg-primary'}`}>
                            {member.initial}
                          </div>
                          <div>
                            <div className={`text-sm font-medium flex items-center gap-1 ${isClaimed ? 'text-gray-500' : ''}`}>
                              {member.displayName}
                              {member.is_owner && <Crown className="w-3 h-3 text-yellow-500" />}
                            </div>
                            <div className={`text-xs ${isClaimed ? 'text-gray-400' : 'text-muted-foreground'}`}>
                              {formatCurrency(member.contribution)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI INSIGHTS */}
                  {!isClaimed && (
                    <div className="mb-4 p-3 bg-primary/5 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Brain className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">AI Insights</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {aiInsights[0]}
                      </p>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto text-xs"
                        onClick={() => setShowAIInsights({ type: 'group', group })}
                      >
                        View more insights →
                      </Button>
                    </div>
                  )}

                  {/* ACTION BUTTONS */}
                  <div className="flex gap-2">
                    {!isCompleted && !isClaimed && (
                      <Button
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        onClick={() => setActiveGroup(group)}
                        disabled={currentBalance <= 0}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        {currentBalance <= 0 ? "Insufficient Balance" : "Contribute"}
                      </Button>
                    )}
                    
                    {isCompleted && !isClaimed && isOwner && (
                      <Button
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600"
                        onClick={() => setShowClaimModal(group)}
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        Claim Funds
                      </Button>
                    )}
                    
                    {isCompleted && !isClaimed && !isOwner && (
                      <Button
                        className="flex-1 bg-gray-500 hover:bg-gray-600"
                        disabled
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Admin Only
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      className={`flex-1 ${isClaimed ? 'border-gray-300 text-gray-500 hover:bg-gray-100' : ''}`}
                      onClick={() => setShowGroupDetails(group)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className={isClaimed ? 'border-gray-300 text-gray-500 hover:bg-gray-100' : ''}
                      onClick={() => setShowChat(group)}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* MODALS */}
      {showCreate && <CreateGroupModal />}
      {showJoin && <JoinGroupModal />}
      {showLeaderboard && <LeaderboardModal />}
      {showGroupDetails && <GroupDetailsModal />}
      <ClaimModal />
      <ChatModal />

      {/* 💰 CONTRIBUTE MODAL */}
      {activeGroup && (
        <Modal title={`Contribute to ${activeGroup.name}`} onClose={() => setActiveGroup(null)}>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl mb-2">💰</div>
              <p className="text-sm text-muted-foreground">
                Current progress: {formatCurrency(
                  activeGroup.group_members?.reduce((s: number, m: any) => s + (m.contribution || 0), 0) || 0
                )} / {formatCurrency(activeGroup.target)}
              </p>
              <div className="mt-2 p-2 bg-secondary/30 rounded-lg">
                <p className="text-sm font-medium">Available Balance</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(currentBalance)}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Contribution Amount
              </label>
              <Input
                type="number"
                placeholder="Enter amount in ₹"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="text-lg"
                max={currentBalance}
              />
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[100, 500, 1000, 5000].map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(amt)}
                    className={amount === amt ? "border-primary bg-primary/10" : ""}
                    disabled={amt > currentBalance}
                  >
                    ₹{amt}
                  </Button>
                ))}
              </div>
            </div>
            
            {amount > 0 && (
              <div className="space-y-3">
                <div className="bg-secondary/30 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Bonus Rewards
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✅ Earn {Math.floor(amount / 100) * 5} reward points</li>
                    <li>✅ Move up on the leaderboard</li>
                    <li>✅ Unlock achievement badges</li>
                  </ul>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    AI Suggestion
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {amount >= 1000 
                      ? "Great! This significant contribution will dramatically boost group progress! 🚀"
                      : amount >= 500
                      ? "Solid contribution! This will help maintain steady progress. 📈"
                      : "Every contribution counts! Consistent small amounts lead to big results. 💪"}
                  </p>
                </div>
              </div>
            )}
            
            <Button 
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              onClick={addMoney}
              disabled={!amount || amount <= 0 || amount > currentBalance}
            >
              <DollarSign className="w-5 h-5 mr-2" />
              {amount > currentBalance 
                ? "Insufficient Balance" 
                : `Add ${formatCurrency(amount)} to Group`}
            </Button>
          </div>
        </Modal>
      )}

      {/* 🧠 AI INSIGHTS MODAL */}
      {showAIInsights && (
        <Modal 
          title={showAIInsights.type === 'all' ? "🤖 Group AI Insights" : "🧠 Group Analysis"} 
          onClose={() => setShowAIInsights(null)}
        >
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">🔮</div>
              <h3 className="text-lg font-semibold">
                {showAIInsights.type === 'all' ? 'All Groups Analysis' : showAIInsights.group.name}
              </h3>
            </div>
            
            {showAIInsights.type === 'all' ? (
              <div className="space-y-4">
                {groups.map(group => {
                  const insights = getAIGroupInsights(group);
                  const prediction = predictGroupSuccess(group);
                  return (
                    <div key={group.id} className="p-4 bg-secondary/30 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold">{group.name}</h4>
                        <div className={`status-badge ${prediction.badgeColor}`}>
                          {prediction.probability}% Success
                        </div>
                      </div>
                      <div className="space-y-2">
                        {insights.map((insight, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <Brain className="w-4 h-4 text-primary mt-0.5" />
                            <span>{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    Overall AI Recommendation
                  </h4>
                  <p className="text-sm">
                    {overallProgress >= 70 
                      ? "Your groups are performing excellently! Consider creating a new group with higher targets to challenge yourself further. 🚀"
                      : overallProgress >= 50
                      ? "Good progress overall! Focus on groups with approaching deadlines to ensure timely completion. 📅"
                      : "Focus on one group at a time. Prioritize groups with the highest success probability to build momentum. 🎯"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-secondary/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Success Probability</p>
                    <p className="text-2xl font-bold">
                      {predictGroupSuccess(showAIInsights.group).probability}%
                    </p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Days Remaining</p>
                    <p className="text-2xl font-bold">
                      {Math.ceil((new Date(showAIInsights.group.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">AI Insights</h4>
                  {getAIGroupInsights(showAIInsights.group).map((insight, idx) => (
                    <div key={idx} className="p-3 bg-secondary/30 rounded-lg text-sm">
                      {insight}
                    </div>
                  ))}
                </div>
                
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <h4 className="font-semibold mb-2">AI Action Plan</h4>
                  <ul className="text-sm space-y-1">
                    <li>✅ Focus on encouraging all members to contribute</li>
                    <li>✅ Set weekly contribution targets</li>
                    <li>✅ Consider extending deadline if progress is slow</li>
                    <li>✅ Celebrate milestones to maintain motivation</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* 📈 SUCCESS PREDICTOR MODAL */}
      {showSuccessPredictor && (
        <Modal title="🔮 AI Success Predictor" onClose={() => setShowSuccessPredictor(null)}>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">🎯</div>
              <h3 className="text-lg font-semibold">
                {showSuccessPredictor.type === 'overall' ? 'Overall Success Prediction' : showSuccessPredictor.group.name}
              </h3>
            </div>
            
            {showSuccessPredictor.type === 'overall' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg" style={{ 
                  background: `linear-gradient(90deg, 
                    ${predictGroupSuccess({target: overallTotalTarget, group_members: []}).color.replace('text-', '')}20 ${overallProgress}%, 
                    transparent ${overallProgress}%)`
                }}>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">
                      {overallProgress.toFixed(1)}% Complete
                    </div>
                    <div className="text-lg font-semibold">
                      {overallProgress >= 70 
                        ? "🎉 Excellent Progress!" 
                        : overallProgress >= 50
                        ? "📈 Good Momentum"
                        : "🚀 Keep Going!"}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {groups.map(group => {
                    const pred = predictGroupSuccess(group);
                    return (
                      <div key={group.id} className="p-3 bg-secondary/30 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{group.name}</span>
                          <div className={`status-badge ${pred.badgeColor}`}>
                            {pred.probability}% Success
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {pred.willSucceed ? "Likely to succeed" : "Needs attention"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl mb-2">
                    {predictGroupSuccess(showSuccessPredictor.group).probability >= 80 ? "🎯" :
                     predictGroupSuccess(showSuccessPredictor.group).probability >= 60 ? "⚡" :
                     predictGroupSuccess(showSuccessPredictor.group).probability >= 40 ? "📊" : "🎯"}
                  </div>
                  <div className="text-3xl font-bold mb-1">
                    {predictGroupSuccess(showSuccessPredictor.group).probability}% Success Chance
                  </div>
                  <div className={`text-lg font-semibold ${predictGroupSuccess(showSuccessPredictor.group).color}`}>
                    {predictGroupSuccess(showSuccessPredictor.group).willSucceed 
                      ? "🎯 Likely to Achieve" 
                      : "⚠️ Needs Improvement"}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-secondary/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Daily Target</p>
                    <p className="font-bold">
                      ₹{predictGroupSuccess(showSuccessPredictor.group).requiredDaily.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-bold">{predictGroupSuccess(showSuccessPredictor.group).status}</p>
                  </div>
                </div>
                
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <h4 className="font-semibold mb-2">AI Recommendation</h4>
                  <p className="text-sm">
                    {predictGroupSuccess(showSuccessPredictor.group).probability >= 80
                      ? "Excellent progress! Maintain current contribution levels and consider helping other members."
                      : predictGroupSuccess(showSuccessPredictor.group).probability >= 60
                      ? "Good progress! Increase contributions slightly to improve success probability."
                      : "Needs attention. Consider increasing contributions or extending the deadline."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* MODAL COMPONENT */
const Modal = ({ title, children, onClose }: any) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">{title}</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
);
