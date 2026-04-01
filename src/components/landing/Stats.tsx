const stats = [
  { value: "0K+", label: "Active Users" },
  { value: "$0M+", label: "Tracked Savings" },
  { value: "100%", label: "User Satisfaction" },
  { value: "5", label: "App Store Rating" },
];

export function Stats() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-6">
        <div className="glass-card p-8 md:p-12 gradient-hero-bg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <p className="font-display text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </p>
                <p className="text-white/80 text-sm md:text-base">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
