import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";

const benefits = [
  "Free to get started",
  "No credit card required",
  "Cancel anytime",
  "Bank-level security",
];

export function CTA() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your{" "}
            <span className="gradient-text">Financial Life?</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who have taken control of their finances. 
            Start your journey to financial freedom today.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 rounded-full bg-finance-green-light flex items-center justify-center">
                  <Check className="w-3 h-3 text-finance-green" />
                </div>
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <Link to="/auth">
            <Button variant="gradient" size="xl" className="group">
              Start Your Free Account
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
