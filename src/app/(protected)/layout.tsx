import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TabNavigation } from "@/components/tab-navigation";
import { UserMenu } from "@/components/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { DollarSign } from "lucide-react";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <DollarSign className="h-4 w-4" />
              </div>
              <span className="text-lg font-semibold tracking-tight">
                Financial Analyzer
              </span>
            </div>
            <TabNavigation />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu email={user.email ?? ""} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
