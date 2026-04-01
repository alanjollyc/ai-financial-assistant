import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  User, Bell, Moon, Download, Trash2, Shield,
  LogOut, Lock, AlertTriangle, Palette, Save, Mail,
  Smartphone, Globe, Eye, EyeOff, Database,
  Target
} from "lucide-react";

// Add these as separate imports if needed
import { Calendar } from "lucide-react";
import { CreditCard } from "lucide-react";
import { Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Color themes with names and CSS classes
const COLOR_THEMES = [
  { id: "blue", name: "Ocean Blue", primary: "#3b82f6", secondary: "#1d4ed8", class: "theme-blue" },
  { id: "emerald", name: "Emerald Green", primary: "#10b981", secondary: "#059669", class: "theme-emerald" },
  { id: "purple", name: "Royal Purple", primary: "#8b5cf6", secondary: "#7c3aed", class: "theme-purple" },
  { id: "rose", name: "Rose Pink", primary: "#f43f5e", secondary: "#e11d48", class: "theme-rose" },
  { id: "amber", name: "Sunset Amber", primary: "#f59e0b", secondary: "#d97706", class: "theme-amber" },
  { id: "indigo", name: "Deep Indigo", primary: "#6366f1", secondary: "#4f46e5", class: "theme-indigo" },
];

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState("");
  const [saving, setSaving] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  // User settings
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [darkMode, setDarkMode] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState("blue");
  
  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Notifications
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weekly: true,
    monthly: true,
    goals: true,
    overspending: true,
    anomalies: true,
    low_balance: true,
  });

  // Data export options
  const [exportOptions, setExportOptions] = useState({
    transactions: true,
    goals: true,
    categories: true,
    insights: true,
    format: "csv" as "csv" | "json",
  });

  /* 🔹 APPLY THEME SETTINGS */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Apply dark/light mode
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    // Apply color theme
    COLOR_THEMES.forEach(theme => {
      document.documentElement.classList.remove(theme.class);
    });
    const selectedThemeObj = COLOR_THEMES.find(t => t.id === selectedTheme);
    if (selectedThemeObj) {
      document.documentElement.classList.add(selectedThemeObj.class);
    }
    
    // Store theme in localStorage for persistence
    localStorage.setItem('userTheme', JSON.stringify({
      darkMode,
      colorTheme: selectedTheme,
    }));
  }, [darkMode, selectedTheme]);

  /* 🔹 LOAD USER SETTINGS */
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setProfileId(profile.id);
        setFullName(profile.full_name || "");
        setUsername(profile.username || "");
        setPhone(profile.phone || "");
        setCurrency(profile.currency || "INR");
        setDarkMode(profile.dark_mode ?? true);
        setSelectedTheme(profile.color_theme || "blue");
        setNotifications(profile.notifications || notifications);
      }

      // Load theme from localStorage if exists
      const savedTheme = localStorage.getItem('userTheme');
      if (savedTheme) {
        try {
          const theme = JSON.parse(savedTheme);
          setDarkMode(theme.darkMode);
          setSelectedTheme(theme.colorTheme);
        } catch (e) {
          console.error("Error loading theme:", e);
        }
      }

      setLoading(false);
    };

    loadProfile();
  }, []);

  /* 🔹 SAVE SETTINGS */
  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          username,
          phone,
          currency,
          dark_mode: darkMode,
          color_theme: selectedTheme,
          notifications,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId);

      if (error) throw error;
      
      toast.success("Settings saved successfully!");
      
      // Also store in localStorage for immediate persistence
      localStorage.setItem('userTheme', JSON.stringify({
        darkMode,
        colorTheme: selectedTheme,
      }));
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  /* 🔹 CHANGE PASSWORD */
  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all password fields");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast.success("Password changed successfully!");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Password change error:", error);
      toast.error(error.message || "Failed to change password");
    }
  };

  /* 🔹 PASSWORD RESET EMAIL */
  const sendPasswordReset = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) throw error;
      
      toast.success("Password reset email sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    }
  };

  /* 🔹 EXPORT DATA */
  const exportData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let exportData: any = {};
      
      if (exportOptions.transactions) {
        const { data: transactions } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id);
        exportData.transactions = transactions || [];
      }
      
      if (exportOptions.goals) {
        const { data: goals } = await supabase
          .from("goals")
          .select("*")
          .eq("user_id", user.id);
        exportData.goals = goals || [];
      }
      
      if (exportOptions.categories) {
        // Export category preferences
        exportData.categories = BASE_CATEGORIES;
      }
      
      let content, filename, type;
      
      if (exportOptions.format === "csv") {
        // Simple CSV conversion for transactions
        if (exportData.transactions) {
          const headers = ["Date", "Description", "Amount", "Type", "Category"];
          const rows = exportData.transactions.map((t: any) => 
            [t.date, t.narration, t.amount, t.type, t.category].join(",")
          );
          content = [headers.join(","), ...rows].join("\n");
          filename = `finwise_export_${new Date().toISOString().split('T')[0]}.csv`;
          type = "text/csv";
        }
      } else {
        content = JSON.stringify(exportData, null, 2);
        filename = `finwise_export_${new Date().toISOString().split('T')[0]}.json`;
        type = "application/json";
      }
      
      // Create and download file
      const blob = new Blob([content], { type });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("Data exported successfully!");
      setShowExportOptions(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  /* 🔹 DELETE ACCOUNT CONFIRMATION */
  const deleteAccount = async () => {
    if (!confirm("Are you sure? This will permanently delete your account and all data. This action cannot be undone.")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profileId);
      
      if (error) throw error;
      
      // Sign out after deletion
      await supabase.auth.signOut();
      navigate("/auth");
      toast.success("Account deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete account");
    }
  };

  /* 🔹 SIGN OUT */
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-3 text-muted-foreground">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="ml-0 lg:ml-64 transition-all duration-300">
        <DashboardHeader />

        <main className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                Account Settings
              </h1>
              <p className="text-muted-foreground">
                Manage your profile, preferences, and security
              </p>
            </div>
            <Button 
              onClick={saveSettings} 
              disabled={saving}
              className="bg-gradient-to-r from-primary to-blue-600"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

          {/* PROFILE SETTINGS */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-blue-600">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Profile Information</h2>
                <p className="text-sm text-muted-foreground">Update your personal details</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName"
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username"
                  value={username} 
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Choose a username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input 
                    id="email"
                    value={email} 
                    disabled
                    className="pr-10"
                  />
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Input 
                    id="phone"
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                  />
                  <Smartphone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <div className="relative">
                  <select
                    id="currency"
                    className="w-full p-2 rounded-lg border bg-background"
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                  >
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="GBP">British Pound (£)</option>
                    <option value="JPY">Japanese Yen (¥)</option>
                  </select>
                  <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* APPEARANCE & THEME */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Appearance & Theme</h2>
                <p className="text-sm text-muted-foreground">Customize look and feel</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
              
              <div>
                <p className="font-medium mb-3">Color Theme</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose your primary color theme
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {COLOR_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedTheme === theme.id 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${theme.primary}20, ${theme.secondary}20)`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <span className="text-sm font-medium">{theme.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* NOTIFICATIONS */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Notifications</h2>
                <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                ["email", "Email Notifications", "Receive updates via email", Mail],
                ["push", "Push Notifications", "Receive browser notifications", Bell],
                ["weekly", "Weekly Summary", "Get weekly spending reports", Calendar],
                ["monthly", "Monthly Reports", "Monthly financial insights", Wallet],
                ["goals", "Goal Reminders", "Reminders for savings goals", Target],
                ["overspending", "Overspending Alerts", "When exceeding budget limits", AlertTriangle],
                ["anomalies", "Anomaly Detection", "Unusual transaction alerts", Shield],
                ["low_balance", "Low Balance Alerts", "When balance is low", CreditCard],
              ].map(([key, title, desc, Icon]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {Icon && <Icon className="w-4 h-4 text-primary" />}
                    </div>
                    <div>
                      <p className="font-medium">{title}</p>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={(notifications as any)[key]}
                    onCheckedChange={(v) =>
                      setNotifications({ ...notifications, [key]: v })
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* SECURITY */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Security</h2>
                <p className="text-sm text-muted-foreground">Manage account security</p>
              </div>
            </div>

            {showPasswordForm ? (
              <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Change Password</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowPasswordForm(false)}>
                    Cancel
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                <Button onClick={handlePasswordChange} className="w-full">
                  Update Password
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Lock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Change Password</p>
                      <p className="text-sm text-muted-foreground">Update your account password</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
                    Change Password
                  </Button>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Password Reset</p>
                      <p className="text-sm text-muted-foreground">Send password reset email</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={sendPasswordReset}>
                    Send Reset Email
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* DATA MANAGEMENT */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Data Management</h2>
                <p className="text-sm text-muted-foreground">Export or delete your data</p>
              </div>
            </div>

            <div className="space-y-4">
              {showExportOptions ? (
                <div className="space-y-4 p-4 bg-secondary/30 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Export Options</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowExportOptions(false)}>
                      Close
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      ["transactions", "Transactions", "All your income and expense records"],
                      ["goals", "Goals", "Your savings and investment goals"],
                      ["categories", "Categories", "Spending categories and preferences"],
                      ["insights", "Insights", "AI-generated insights and reports"],
                    ].map(([key, title, desc]) => (
                      <div key={key} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{title}</p>
                          <p className="text-sm text-muted-foreground">{desc}</p>
                        </div>
                        <Switch
                          checked={(exportOptions as any)[key]}
                          onCheckedChange={(v) =>
                            setExportOptions({ ...exportOptions, [key]: v })
                          }
                        />
                      </div>
                    ))}
                    
                    <div className="space-y-2">
                      <Label>Export Format</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={exportOptions.format === "csv" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setExportOptions({...exportOptions, format: "csv"})}
                        >
                          CSV
                        </Button>
                        <Button
                          variant={exportOptions.format === "json" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setExportOptions({...exportOptions, format: "json"})}
                        >
                          JSON
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Button onClick={exportData} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Download className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Export Data</p>
                      <p className="text-sm text-muted-foreground">Download all your financial data</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowExportOptions(true)}>
                    Export Options
                  </Button>
                </div>
              )}
              
              <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium text-red-600">Delete Account</p>
                    <p className="text-sm text-red-500/80">Permanently delete your account and data</p>
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={deleteAccount}>
                  Delete Account
                </Button>
              </div>
            </div>
          </div>

          {/* SIGN OUT */}
          <div className="glass-card p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-gray-500 to-slate-600">
                  <LogOut className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium">Sign Out</p>
                  <p className="text-sm text-muted-foreground">Sign out from your account</p>
                </div>
              </div>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Base categories for export
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