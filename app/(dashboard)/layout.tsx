import { AuthGuard } from "@/components/auth-guard";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

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
