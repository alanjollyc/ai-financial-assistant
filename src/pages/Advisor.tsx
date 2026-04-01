import { useEffect, useMemo, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  Utensils,
  ShoppingBag,
  Home,
  Car,
  CreditCard,
  AlertTriangle,
  TrendingDown,
  Wallet,
  ChefHat,
  Lightbulb,
} from "lucide-react";

/* ---------------- TYPES ---------------- */

type Txn = {
  amount: number;
  category: string;
  date: string;
  type: "DEBIT" | "CREDIT";
};

/* ---------------- CONFIG ---------------- */

const CATEGORY_BASELINE: Record<string, number> = {
  Food: 9000,
  Shopping: 6000,
  Rent: 25000,
  Travel: 5000,
  Bills: 7000,
  Others: 4000,
};

const CATEGORY_ACTIONS: Record<string, string[]> = {
  Food: [
    "Self cooking 4 days/week",
    "Reduce food delivery apps",
    "Weekly grocery planning",
  ],
  Shopping: [
    "Impulse control rule (24h wait)",
    "Unsubscribe promo emails",
    "Monthly shopping cap",
  ],
  Travel: [
    "Avoid peak-hour rides",
    "Public transport twice/week",
  ],
  Bills: [
    "Subscription audit",
    "Switch to lower tariff plans",
  ],
};

/* ---------------- HELPERS ---------------- */

const formatMoney = (n: number) => `₹${Math.round(n).toLocaleString()}`;

/* ---------------- COMPONENT ---------------- */

export default function Advisor() {
  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data } = await supabase
        .from("transactions")
        .select("amount, category, date, type")
        .eq("user_id", user.id)
        .eq("type", "DEBIT")
        .gte("date", sixMonthsAgo.toISOString().split("T")[0]);

      setTransactions(data || []);
      setLoading(false);
    };

    fetchData();
  }, []);

  /* ---------------- ANALYSIS ---------------- */
  const analysis = useMemo(() => {
    const map: Record<string, number> = {};

    transactions.forEach(t => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });

    return Object.entries(map).map(([category, total]) => {
      const baseline = CATEGORY_BASELINE[category] || 5000;
      const avgMonthly = total / 6;
      const overspend = Math.max(0, avgMonthly - baseline);
      const wasteScore = Math.min(100, Math.round((overspend / baseline) * 100));
      const possibleSave = overspend * 0.7;

      return {
        category,
        avgMonthly,
        baseline,
        wasteScore,
        possibleSave,
        isProblem: overspend > baseline * 0.15,
      };
    }).sort((a, b) => b.wasteScore - a.wasteScore);
  }, [transactions]);

  const totalPossibleSave = analysis.reduce((s, a) => s + a.possibleSave, 0);

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />

        <main className="p-6 space-y-6 max-w-6xl mx-auto">

          {/* HEADER */}
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10">
            <h1 className="text-3xl font-bold mb-2">
              Your AI Financial Advisor
            </h1>
            <p className="text-muted-foreground">
              I’ve analyzed your last 6 months of spending. Here’s how you can save more — realistically.
            </p>
          </Card>

          {/* SUMMARY */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-4">
              <Wallet className="mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Possible Monthly Savings</p>
              <p className="text-2xl font-bold text-primary">
                {formatMoney(totalPossibleSave)}
              </p>
            </Card>

            <Card className="p-4">
              <AlertTriangle className="mb-2 text-destructive" />
              <p className="text-sm text-muted-foreground">High Waste Categories</p>
              <p className="text-2xl font-bold">
                {analysis.filter(a => a.isProblem).length}
              </p>
            </Card>

            <Card className="p-4">
              <TrendingDown className="mb-2 text-accent" />
              <p className="text-sm text-muted-foreground">Advisor Confidence</p>
              <p className="text-2xl font-bold text-accent">High</p>
            </Card>
          </div>

          {/* CATEGORY ADVICE */}
          <div className="space-y-4">
            {analysis.map(cat => (
              <Card key={cat.category} className="p-5">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {cat.category}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Avg spend: {formatMoney(cat.avgMonthly)} / month
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setExpandedCategory(
                        expandedCategory === cat.category ? null : cat.category
                      )
                    }
                  >
                    View Advice
                  </Button>
                </div>

                <Progress value={cat.wasteScore} className="mt-4" />

                {expandedCategory === cat.category && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm">
                      You’re spending <b>{cat.wasteScore}%</b> above healthy limits.
                      I recommend reducing this gradually — not drastically.
                    </p>

                    <p className="font-medium text-accent">
                      You can save ~ {formatMoney(cat.possibleSave)} / month
                    </p>

                    <div className="grid md:grid-cols-2 gap-2">
                      {(CATEGORY_ACTIONS[cat.category] || []).map((action, i) => (
                        <div
                          key={i}
                          className="p-3 rounded bg-muted flex items-center gap-2"
                        >
                          <Lightbulb className="w-4 h-4 text-primary" />
                          <span className="text-sm">{action}</span>
                        </div>
                      ))}
                    </div>

                    {cat.category === "Food" && (
                      <Card className="p-4 bg-primary/5 mt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <ChefHat className="w-5 h-5 text-primary" />
                          <b>Self Cooking Plan</b>
                        </div>
                        <p className="text-sm">
                          Cook 4 dinners/week → save ~ ₹2,000/month without lifestyle change.
                        </p>
                      </Card>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {loading && (
            <p className="text-center text-muted-foreground">
              Analyzing your finances…
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
