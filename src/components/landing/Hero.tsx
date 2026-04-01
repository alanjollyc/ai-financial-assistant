import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-finance-teal-light via-background to-finance-green-light opacity-50" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-soft" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="relative container mx-auto px-6 pt-32 pb-20">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Finance Management</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
            Take Control of Your{" "}
            <span className="gradient-text">Financial Future</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Track expenses, achieve savings goals, and get personalized AI insights. 
            The smart way to manage your money and build wealth.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/auth">
              <Button variant="gradient" size="xl" className="group">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
              <TrendingUp className="w-4 h-4 text-finance-green" />
              <span className="text-sm font-medium">Smart Analytics</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
              <Shield className="w-4 h-4 text-finance-blue" />
              <span className="text-sm font-medium">Bank-Level Security</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
              <Sparkles className="w-4 h-4 text-finance-purple" />
              <span className="text-sm font-medium">AI Assistant</span>
            </div>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 relative animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
          <div className="glass-card p-2 md:p-4 max-w-5xl mx-auto shadow-2xl">
            <div className="bg-card rounded-xl p-6 space-y-6">
              {/* Mock Dashboard Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p className="text-3xl font-display font-bold">24,580.00</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-finance-green-light text-finance-green text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  +12.5%
                </div>
              </div>
              
              {/* Mock Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-secondary">
                  <p className="text-xs text-muted-foreground mb-1">Monthly Spending</p>
                  <p className="text-xl font-semibold">3,240</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary">
                  <p className="text-xs text-muted-foreground mb-1">Savings This Month</p>
                  <p className="text-xl font-semibold text-finance-green">1,850</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary">
                  <p className="text-xs text-muted-foreground mb-1">Goals Progress</p>
                  <p className="text-xl font-semibold text-finance-blue">67%</p>
                </div>
              </div>

              {/* Mock Chart Area */}
              <div className="h-32 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-xl flex items-end justify-around px-4 pb-4">
                {[40, 65, 45, 80, 55, 70, 90].map((height, i) => (
                  <div
                    key={i}
                    className="w-8 rounded-t-md gradient-bg opacity-80"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
