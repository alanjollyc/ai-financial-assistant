import { ShoppingBag, Car, Home, Coffee, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const transactions = [
  {
    id: 1,
    name: "Amazon Purchase",
    category: "Shopping",
    amount: -89.99,
    date: "Today, 2:45 PM",
    icon: ShoppingBag,
    color: "finance-purple",
  },
  {
    id: 2,
    name: "Uber Ride",
    category: "Travel",
    amount: -24.50,
    date: "Today, 11:30 AM",
    icon: Car,
    color: "finance-blue",
  },
  {
    id: 3,
    name: "Rent Payment",
    category: "Housing",
    amount: -1200.00,
    date: "Dec 1, 9:00 AM",
    icon: Home,
    color: "finance-orange",
  },
  {
    id: 4,
    name: "Starbucks",
    category: "Food & Drink",
    amount: -6.75,
    date: "Nov 30, 4:15 PM",
    icon: Coffee,
    color: "finance-teal",
  },
  {
    id: 5,
    name: "Electricity Bill",
    category: "Utilities",
    amount: -145.00,
    date: "Nov 28, 10:00 AM",
    icon: Zap,
    color: "finance-green",
  },
];

export function RecentTransactions() {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-semibold text-lg">Recent Transactions</h3>
          <p className="text-sm text-muted-foreground">Your latest expenses</p>
        </div>
        <button className="text-sm text-primary hover:underline">View All</button>
      </div>

      <div className="space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", `bg-${transaction.color}-light`)}>
              <transaction.icon className={cn("w-5 h-5", `text-${transaction.color}`)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{transaction.name}</p>
              <p className="text-sm text-muted-foreground">{transaction.category}</p>
            </div>
            <div className="text-right">
              <p className={cn("font-semibold", transaction.amount < 0 ? "text-finance-red" : "text-finance-green")}>
                {transaction.amount < 0 ? "-" : "+"}${Math.abs(transaction.amount).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">{transaction.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
