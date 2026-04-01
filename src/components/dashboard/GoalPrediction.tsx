import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Brain,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface GoalPredictionProps {
  goalId: number;
  goalName: string;
  current: number;
  target: number;
  deadline: string;
}

/* ---------------- CONSISTENCY CALC ---------------- */
const calculateConsistency = async (userId: string) => {
  const { data } = await supabase
    .from("expenses")
    .select("amount")
    .eq("user_id", userId)
    .eq("category", "Goals");

  if (!data || data.length < 3) return 0.5;

  const values = data.map(e => Number(e.amount));
  const avg = values.reduce((s, v) => s + v, 0) / values.length;

  const variance =
    values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length;

  const score = 1 - Math.sqrt(variance) / avg;
  return Math.max(0, Math.min(1, score));
};

/* ---------------- LOGISTIC REGRESSION ---------------- */
function predictGoalSuccess(
  current: number,
  target: number,
  daysRemaining: number,
  consistency: number
) {
  const progressRatio = current / target;
  const timeRatio = Math.min(daysRemaining / 365, 1);

  const weights = {
    progress: 2.5,
    time: 1.2,
    consistency: 1.8,
    bias: -1.5,
  };

  const z =
    weights.progress * progressRatio +
    weights.time * timeRatio +
    weights.consistency * consistency +
    weights.bias;

  const probability = 1 / (1 + Math.exp(-z));

  const factors: string[] = [];

  if (progressRatio > 0.6) factors.push("Strong progress");
  if (progressRatio < 0.3) factors.push("Low current savings");
  if (daysRemaining < 30) factors.push("Limited time remaining");
  if (daysRemaining > 90) factors.push("Sufficient time available");
  if (consistency > 0.7) factors.push("Excellent saving consistency");
  if (consistency < 0.4) factors.push("Irregular saving pattern");

  return {
    probability: Math.round(probability * 100),
    willAchieve: probability >= 0.5,
    factors: factors.slice(0, 3),
  };
}

/* ---------------- COMPONENT ---------------- */
export function GoalPrediction({
  goalId,
  goalName,
  current,
  target,
  deadline,
}: GoalPredictionProps) {
  const [consistency, setConsistency] = useState(0.5);

  useEffect(() => {
    const fetchConsistency = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const score = await calculateConsistency(user.id);
      setConsistency(score);
    };

    fetchConsistency();
  }, [goalId]);

  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(deadline).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const prediction = predictGoalSuccess(
    current,
    target,
    daysRemaining,
    consistency
  );

  const color =
    prediction.probability >= 70
      ? "text-accent"
      : prediction.probability >= 50
      ? "text-warning"
      : "text-destructive";

  return (
    <div className="rounded-lg p-4 border bg-secondary/40">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">AI Prediction</span>
        </div>
        {prediction.willAchieve ? (
          <CheckCircle className="w-4 h-4 text-accent" />
        ) : (
          <XCircle className="w-4 h-4 text-destructive" />
        )}
      </div>

      <div className="flex gap-3 items-center mb-3">
        <div className={`text-3xl font-bold ${color}`}>
          {prediction.probability}%
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            chance to achieve <b>{goalName}</b>
          </p>
          <div className="flex items-center gap-1 text-xs">
            {prediction.willAchieve ? (
              <TrendingUp className="w-3 h-3 text-accent" />
            ) : (
              <TrendingDown className="w-3 h-3 text-destructive" />
            )}
            {daysRemaining} days remaining
          </div>
        </div>
      </div>

      <Progress value={prediction.probability} className="h-2 mb-3" />

      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">
          Key factors:
        </p>
        {prediction.factors.map((f, i) => (
          <div key={i} className="text-xs text-muted-foreground flex gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}
