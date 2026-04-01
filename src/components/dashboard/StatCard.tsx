import { LucideIcon, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor: string;
}

export function StatCard({ title, value, change, changeType, icon: Icon, iconColor }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", `bg-${iconColor}-light`)}>
          <Icon className={cn("w-6 h-6", `text-${iconColor}`)} />
        </div>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            changeType === "positive" && "bg-finance-green-light text-finance-green",
            changeType === "negative" && "bg-finance-red-light text-finance-red",
            changeType === "neutral" && "bg-secondary text-muted-foreground"
          )}
        >
          {changeType === "positive" && <TrendingUp className="w-3 h-3" />}
          {changeType === "negative" && <TrendingDown className="w-3 h-3" />}
          {changeType === "neutral" && <Minus className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-2xl font-display font-bold">{value}</p>
    </div>
  );
}
