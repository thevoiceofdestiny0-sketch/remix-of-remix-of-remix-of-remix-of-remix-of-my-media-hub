import { useAllContent } from "@/hooks/useContent";
import { useUsers, useTransactions } from "@/hooks/useUsers";
import { Film, Tv, Users, CreditCard, Clock, Loader2 } from "lucide-react";

const AdminDashboard = () => {
  const { content, loading: contentLoading } = useAllContent();
  const { users, loading: usersLoading } = useUsers();
  const { transactions, loading: txLoading } = useTransactions();

  const movies = content.filter(c => c.type === "movie" && c.status === "published").length;
  const series = content.filter(c => c.type === "series" && c.status === "published").length;
  const agentQueue = content.filter(c => c.status === "agent").length;
  const totalRevenue = transactions.filter(t => t.status === "completed").reduce((s, t) => s + t.amount, 0);

  const loading = contentLoading || usersLoading || txLoading;

  const stats = [
    { label: "Movies", value: movies, icon: Film, color: "text-primary" },
    { label: "Series", value: series, icon: Tv, color: "text-primary" },
    { label: "Users", value: users.length, icon: Users, color: "text-badge-vip" },
    { label: "Revenue", value: `${totalRevenue.toLocaleString()} UGX`, icon: CreditCard, color: "text-primary" },
    { label: "Agent Queue", value: agentQueue, icon: Clock, color: "text-badge-hot" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {stats.map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>

          <h2 className="text-lg font-bold text-foreground mb-3">Recent Transactions</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map(tx => (
                  <tr key={tx.id} className="border-b border-border last:border-0">
                    <td className="p-3 text-foreground">{tx.userName}</td>
                    <td className="p-3 text-muted-foreground capitalize">{tx.type.replace(/_/g, " ")}</td>
                    <td className="p-3 text-foreground">{tx.amount.toLocaleString()} UGX</td>
                    <td className="p-3 text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.status === "completed" ? "bg-primary/20 text-primary" : "bg-badge-hot/20 text-badge-hot"}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No transactions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
