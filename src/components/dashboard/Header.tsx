import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* helper */
const getDisplayEmail = (email?: string | null) => {
  if (!email) return "User";
  return email.split("@")[0];
};

export function DashboardHeader() {
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? "");
    };
    fetchUser();
  }, []);

  return (
    <header className="h-16 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
      {/* SEARCH */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions, goals..."
            className="pl-10 h-10 bg-secondary/50 border-0 rounded-xl"
          />
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-finance-red rounded-full" />
        </Button>

        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">
              {getDisplayEmail(email)}
            </p>
            <p className="text-xs text-muted-foreground">
              {email}
            </p>
          </div>

          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </header>
  );
}
