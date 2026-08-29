import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppPage,
});

function AppPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link to="/app" className="text-lg font-semibold tracking-tight">
            Video Speed Reader
          </Link>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6">
        <div className="fade-up w-full max-w-lg text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Hi {user.email}</h1>
          <div className="mt-6 rounded-xl border border-dashed border-border bg-card p-10">
            <p className="text-muted-foreground">
              Your dashboard is coming soon. Upload functionality will be added in the next
              milestone.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
