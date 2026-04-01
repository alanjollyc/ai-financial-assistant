import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

type Goal = {
  id: number;
  name: string;
  current: number;
  target: number;
  deadline: string | null;
};

export function GoalsProgress() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("goals")
        .select("id, name, current, target, deadline")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) {
        setGoals(data || []);
      }

      setLoading(false);
    };

    fetchGoals();
  }, []);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-semibold text-lg">Savings Goals</h3>
          <p className="text-sm text-muted-foreground">
            Track your progress
          </p>
        </div>
        <button className="text-sm text-primary hover:underline">
          Add Goal
        </button>
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading goals...</p>
      )}

      {!loading && goals.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No goals added yet
        </p>
      )}

      <div className="space-y-6">
        {goals.map((goal) => {
          const progress =
            goal.target > 0
              ? Math.min((goal.current / goal.target) * 100, 100)
              : 0;

          return (
            <div key={goal.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">
                    {goal.name}
                  </span>
                </div>
                {goal.deadline && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(goal.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>

              <Progress value={progress} className="h-2" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  ₹{goal.current.toLocaleString()} / ₹{goal.target.toLocaleString()}
                </span>
                <span className="font-medium text-primary">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
