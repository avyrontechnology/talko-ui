import { AuthGuard } from "@/components/auth-guard";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

// All dashboard pages fetch live API data client-side (auth-gated), so skip
// static prerendering: faster builds, far less build memory (Vercel Hobby
// OOMs prerendering 16 recharts pages), and no stale pre-rendered shells.
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-mist">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="slim-scroll flex-1 overflow-y-auto p-5 lg:p-7">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
