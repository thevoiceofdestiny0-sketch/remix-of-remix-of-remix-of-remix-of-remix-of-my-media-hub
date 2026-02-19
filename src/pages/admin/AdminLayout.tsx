import { NavLink, Outlet } from "react-router-dom";
import { Film, Tv, Users, CreditCard, Wallet, LayoutDashboard, ListVideo, Crown, ImageIcon } from "lucide-react";

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
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-56 bg-card border-r border-border flex flex-col py-4 sticky top-0 h-screen">
        <div className="px-4 mb-6">
          <h1 className="text-lg font-black text-gradient-green tracking-tight">DWON PA DESTINY</h1>
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
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
