import { useTransactions } from "@/hooks/useUsers";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";

const AdminTransactions = () => {
  const { transactions, loading, error, refetch } = useTransactions();
  const total = transactions.filter(t => t.status === "completed").reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Total: <span className="text-foreground font-bold">{total.toLocaleString()} UGX</span>
          </span>
          <button onClick={refetch} disabled={loading} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left p-3">User / Phone</th>
                <th className="text-left p-3">Type</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Reference</th>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="border-b border-border last:border-0">
                  <td className="p-3 text-foreground">
                    <div>{tx.userName}</div>
                    {tx.msisdn && tx.userName !== tx.msisdn && (
                      <div className="text-[10px] text-muted-foreground">{tx.msisdn}</div>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground capitalize">{tx.type.replace(/_/g, " ")}</td>
                  <td className="p-3 text-foreground font-semibold">{tx.amount.toLocaleString()} UGX</td>
                  <td className="p-3 text-muted-foreground text-[11px] font-mono">{tx.reference || "—"}</td>
                  <td className="p-3 text-muted-foreground">{new Date(tx.date).toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tx.status === "completed" ? "bg-primary/20 text-primary" :
                      tx.status === "failed" ? "bg-destructive/20 text-destructive" :
                      "bg-badge-hot/20 text-badge-hot"
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && !error && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
