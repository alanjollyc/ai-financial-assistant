import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";
import { Trophy, Star, Flame, Medal } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

/* ================= TYPES ================= */
type AchievementRow = {
  id: string;
  progress: number;
  unlocked: boolean;
  achievement: {
    id: string;
    name: string;
    description: string;
    points: number;
    icon?: string;
  };
};

type LeaderboardUser = {
  id: string;
  full_name: string;
  weekly_points: number;
};

/* ================= MAIN ================= */
export default function Achievements() {
  const [user, setUser] = useState<any>(null);
  const [createdAt, setCreatedAt] = useState<Date | null>(null);
  const [achievements, setAchievements] = useState<AchievementRow[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [streaks, setStreaks] = useState({
    noSpend: 0,
    dailySavings: 0,
    expenseDays: 0,
  });

  /* ---------- AUTH ---------- */
  const fetchUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user);
    if (data?.user?.created_at) {
      setCreatedAt(new Date(data.user.created_at));
    }
  };

  /* ---------- SEED USER ACHIEVEMENTS ---------- */
  const seedUserAchievements = async (uid: string) => {
    const { data: all } = await supabase.from("achievements").select("id");
    if (!all) return;

    const { data: existing } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", uid);

    const existingIds = new Set(existing?.map(e => e.achievement_id));

    const missing = all
      .filter(a => !existingIds.has(a.id))
      .map(a => ({
        user_id: uid,
        achievement_id: a.id,
        progress: 0,
        unlocked: false,
      }));

    if (missing.length > 0) {
      await supabase.from("user_achievements").insert(missing);
    }
  };

  /* ---------- FETCH ACHIEVEMENTS ---------- */
  const fetchAchievements = async (uid: string) => {
    const { data } = await supabase
      .from("user_achievements")
      .select(`
        id,
        progress,
        unlocked,
        achievement:achievements (
          id,
          name,
          description,
          points,
          icon
        )
      `)
      .eq("user_id", uid)
      .order("achievement_id");

    setAchievements(data || []);
  };

  /* ---------- STREAKS (FROM ACCOUNT CREATION) ---------- */
  const fetchStreaks = async (uid: string) => {
    if (!createdAt) return;

    const { data: expenses } = await supabase
      .from("expenses")
      .select("date, amount")
      .eq("user_id", uid);

    if (!expenses) return;

    const today = new Date();
    let noSpend = 0;
    let dailySavings = 0;
    let expenseDays = new Set(expenses.map(e => e.date)).size;

    for (
      let d = new Date(today);
      d >= createdAt;
      d.setDate(d.getDate() - 1)
    ) {
      const day = d.toISOString().split("T")[0];
      const dayExpenses = expenses.filter(e => e.date === day);
      const total = dayExpenses.reduce((s, e) => s + Number(e.amount), 0);

      if (dayExpenses.length === 0) noSpend++;
      else break;

      if (total <= 500) dailySavings++;
      else break;
    }

    setStreaks({ noSpend, dailySavings, expenseDays });
  };

  /* ---------- ACHIEVEMENT ENGINE ---------- */
  const evaluateAchievements = async (uid: string) => {
    const [
      { data: expenses },
      { data: goals },
      { data: groups },
    ] = await Promise.all([
      supabase.from("expenses").select("amount").eq("user_id", uid),
      supabase.from("goals").select("target, current").eq("user_id", uid),
      supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", uid),
    ]);

    const totalExpenses = expenses?.length || 0;
    const totalSaved =
      goals?.reduce((s, g) => s + Number(g.current), 0) || 0;
    const completedGoals =
      goals?.filter(g => Number(g.current) >= Number(g.target)).length || 0;
    const groupCount = groups?.length || 0;

    for (const ua of achievements) {
      const a = ua.achievement;
      let progress = ua.progress;
      let unlocked = ua.unlocked;

      switch (a.name) {
        case "Welcome Aboard":
          progress = 100;
          unlocked = true;
          break;

        case "Goal Setter":
          progress = goals && goals.length > 0 ? 100 : 0;
          unlocked = progress === 100;
          break;

        case "Goal Crusher":
          progress = Math.min(100, completedGoals * 100);
          unlocked = progress === 100;
          break;

        case "Savings Star":
          progress = Math.min(100, (totalSaved / 5000) * 100);
          unlocked = progress === 100;
          break;

        case "Expense Tracker":
          progress = Math.min(100, (totalExpenses / 50) * 100);
          unlocked = progress === 100;
          break;

        case "Streak Master":
          progress = Math.min(100, (streaks.noSpend / 30) * 100);
          unlocked = progress === 100;
          break;

        case "Team Player":
          progress = Math.min(100, (groupCount / 3) * 100);
          unlocked = progress === 100;
          break;
      }

      if (progress !== ua.progress || unlocked !== ua.unlocked) {
        await supabase
          .from("user_achievements")
          .update({ progress, unlocked })
          .eq("id", ua.id);

        if (unlocked && !ua.unlocked) {
          await supabase.rpc("increment_points", {
            uid,
            pts: a.points,
          });
        }
      }
    }

    fetchAchievements(uid);
    fetchWeeklyLeaderboard();
  };

  /* ---------- WEEKLY LEADERBOARD ---------- */
  const fetchWeeklyLeaderboard = async () => {
    const start = new Date();
    start.setDate(start.getDate() - 7);

    const { data } = await supabase
      .from("points_log")
      .select("user_id, points, profiles(full_name)")
      .gte("created_at", start.toISOString());

    if (!data) return;

    const map: Record<string, LeaderboardUser> = {};

    data.forEach((r: any) => {
      if (!map[r.user_id]) {
        map[r.user_id] = {
          id: r.user_id,
          full_name: r.profiles.full_name,
          weekly_points: 0,
        };
      }
      map[r.user_id].weekly_points += r.points;
    });

    setLeaderboard(
      Object.values(map)
        .sort((a, b) => b.weekly_points - a.weekly_points)
        .slice(0, 10)
    );
  };

  /* ---------- INIT ---------- */
  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      await seedUserAchievements(user.id);
      await fetchAchievements(user.id);
      await fetchStreaks(user.id);
      await fetchWeeklyLeaderboard();
    })();
  }, [user, createdAt]);

  useEffect(() => {
    if (user && achievements.length > 0) {
      evaluateAchievements(user.id);
    }
  }, [achievements, streaks]);

  /* ---------- UI ---------- */
  const getRankEmoji = (i: number) =>
    i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i < 10 ? "🔥" : "🙂";

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="pl-64">
        <DashboardHeader />

        <main className="p-6 space-y-6">
          <h1 className="text-2xl font-bold">Achievements & Competition</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Stat icon={Trophy} title="Unlocked" value={`${achievements.filter(a => a.unlocked).length}/${achievements.length}`} />
            <Stat icon={Flame} title="No-Spend Streak" value={`${streaks.noSpend} days`} />
            <Stat icon={Star} title="Weekly Rank" value={`Top ${leaderboard.findIndex(l => l.id === user?.id) + 1 || "-"}`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map(item => (
                <div key={item.id} className="glass-card p-4">
                  <div className="flex gap-4">
                    <div className="text-2xl">{item.achievement.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.achievement.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.achievement.description}</p>
                      {!item.unlocked && (
                        <>
                          <Progress value={item.progress} />
                          <p className="text-xs">{Math.round(item.progress)}%</p>
                        </>
                      )}
                    </div>
                    <span className="font-bold text-primary">+{item.achievement.points}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card p-4">
              <h3 className="font-semibold mb-4">🏆 Weekly Leaderboard</h3>
              {leaderboard.map((u, i) => (
                <div key={u.id} className="flex justify-between py-1">
                  <span>{getRankEmoji(i)} {u.full_name}</span>
                  <span className="font-bold">{u.weekly_points}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- STAT ---------- */
const Stat = ({ icon: Icon, title, value }: any) => (
  <div className="glass-card p-4 flex gap-3">
    <Icon className="w-5 h-5 text-primary" />
    <div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  </div>
);
