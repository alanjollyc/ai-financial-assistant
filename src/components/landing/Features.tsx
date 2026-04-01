import { 
  Wallet, 
  Target, 
  Users, 
  Brain, 
  TrendingUp, 
  PiggyBank,
  MessageSquare,
  Trophy
} from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Expense Tracking",
    description: "Automatically categorize and track every expense. See where your money goes with beautiful charts.",
    color: "finance-teal",
  },
  {
    icon: Target,
    title: "Savings Goals",
    description: "Set financial goals and track progress. Get smart suggestions on how much to save daily.",
    color: "finance-green",
  },
  {
    icon: Users,
    title: "Group Savings",
    description: "Save together with friends or family. Track everyone's contributions in real-time.",
    color: "finance-blue",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    description: "Get personalized insights about your spending habits and actionable recommendations.",
    color: "finance-purple",
  },
  {
    icon: TrendingUp,
    title: "Smart Forecasting",
    description: "Predict future spending based on your patterns. Plan ahead with confidence.",
    color: "finance-orange",
  },
  {
    icon: PiggyBank,
    title: "Investment Tips",
    description: "Discover where to invest your savings. Learn about SIPs, ETFs, and index funds.",
    color: "finance-teal",
  },
  {
    icon: MessageSquare,
    title: "AI Chat Assistant",
    description: "Ask questions like 'Can I afford this?' and get instant, data-driven answers.",
    color: "finance-blue",
  },
  {
    icon: Trophy,
    title: "Gamification",
    description: "Earn badges, maintain streaks, and celebrate wins. Make saving money fun!",
    color: "finance-green",
  },
];

export function Features() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to{" "}
            <span className="gradient-text">Build Wealth</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to help you understand, control, and grow your finances.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card p-6 group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-${feature.color}-light flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-6 h-6 text-${feature.color}`} />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
