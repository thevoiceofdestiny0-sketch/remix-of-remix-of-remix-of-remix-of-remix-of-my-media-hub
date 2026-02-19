import { NavLink, Outlet, Navigate } from "react-router-dom";
import { Film, Tv, Users, CreditCard, Wallet, LayoutDashboard, ListVideo, Crown, ImageIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AdminMobileNav from "@/components/AdminMobileNav";

const sidebarItems = [
  { label: "Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
  { label: "Carousel", path: "/admin/carousel", icon: ImageIcon },
  { label: "Movies", path: "/admin/movies", icon: Film },
  { label: "Series", path: "/admin/series", icon: Tv },
  { label: "Episodes", path: "/admin/episodes", icon: ListVideo },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "Transactions", path: "/admin/transactions", icon: CreditCard },
  { label: "Wallet", path: "/admin/wallet", icon: Wallet },
  { label: "Subscriptions", path: "/admin/subscriptions", icon: Crown },
];

const AdminLayout = () => {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - hidden on mobile */}
      <aside className="hidden md:flex w-56 bg-card border-r border-border flex-col py-4 sticky top-0 h-screen">
        <div className="px-4 mb-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="DWON PA DESTINY" className="w-7 h-7 rounded-full object-cover" />
            <h1 className="text-sm font-black text-gradient-green tracking-tight">DWON PA DESTINY.ONLINE</h1>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Admin Panel</p>
        </div>
        <nav className="flex-1 px-2 space-y-0.5">
          {sidebarItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive ? "bg-primary text-primary-foreground font-semibold" : "text-secondary-foreground hover:bg-secondary"
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 pt-4 border-t border-border">
          <NavLink to="/" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back to site
          </NavLink>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 md:p-6 overflow-auto pb-24 md:pb-6">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-2 mb-4">
          <img src="/logo.png" alt="DWON PA DESTINY" className="w-7 h-7 rounded-full object-cover" />
          <div>
            <h1 className="text-sm font-black text-gradient-green tracking-tight">DWON PA DESTINY.ONLINE</h1>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <AdminMobileNav />
    </div>
  );
};

export default AdminLayout;
