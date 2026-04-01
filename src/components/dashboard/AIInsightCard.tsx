import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AIInsightCard() {
  return (
    <div className="glass-card p-6 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-primary/20">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-semibold text-lg mb-1">AI Insight</h3>
          <p className="text-muted-foreground mb-4">
            Based on your spending patterns, you've spent <span className="font-semibold text-finance-orange">22% more</span> on 
            dining out this month compared to last month. Consider setting a budget for restaurants to save an extra{" "}
            <span className="font-semibold text-finance-green">$150/month</span>.
          </p>
          <Button variant="outline" size="sm" className="group">
            Get More Insights
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}
