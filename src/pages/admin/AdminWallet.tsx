import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wallet, ArrowUpRight, Smartphone, RefreshCw } from "lucide-react";
import {
  fetchWalletBalance,
  fetchBackendTransactions,
  initiateWithdraw,
  checkStatus,
  getTransactionErrorMessage,
  getTransactionReference,
  getTransactionStatus,
  isTransactionFailed,
  isTransactionSuccessful,
  type BackendTransaction,
} from "@/lib/payments";

const AdminWallet = () => {
  const { toast } = useToast();

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<BackendTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawStatus, setWithdrawStatus] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [balRes, txRes] = await Promise.all([
        fetchWalletBalance(),
        fetchBackendTransactions(),
      ]);
      if (balRes.success && balRes.relworx) {
        setBalance(balRes.relworx.balance);
      }
      if (txRes.success && txRes.relworx) {
        setTransactions(txRes.relworx.transactions || []);
      }
    } catch (e) {
      console.error("Failed to load wallet data", e);
      toast({ title: "Failed to load wallet data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleWithdraw = async () => {
    const num = parseInt(withdrawAmount);
    if (!num || num <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    if (!mobileNumber.trim()) {
      toast({ title: "Enter a mobile money number", variant: "destructive" });
      return;
    }
    if (num > balance) {
      toast({ title: "Insufficient balance", description: `Available: ${balance.toLocaleString()} UGX`, variant: "destructive" });
      return;
    }
    setWithdrawing(true);
    setWithdrawStatus("Initiating withdrawal...");
    try {
      const res: any = await initiateWithdraw(mobileNumber.trim(), num, "Admin withdrawal");
      const reference = getTransactionReference(res);
      if (isTransactionFailed(res)) {
        toast({ title: "Withdrawal failed", description: getTransactionErrorMessage(res, "Withdrawal failed"), variant: "destructive" });
      } else if (isTransactionSuccessful(res)) {
        toast({ title: "Withdrawal successful", description: `${num.toLocaleString()} UGX sent to ${mobileNumber}.` });
        setWithdrawAmount("");
        setMobileNumber("");
        setWithdrawStatus("");
        loadData();
      } else if (reference) {
        setWithdrawStatus("Waiting for withdrawal confirmation...");

        let confirmed = false;
        for (let attempt = 1; attempt <= 300; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const statusRes = await checkStatus(reference);
          const status = getTransactionStatus(statusRes);

          if (isTransactionSuccessful(statusRes)) {
            confirmed = true;
            toast({ title: "Withdrawal successful", description: `${num.toLocaleString()} UGX sent to ${mobileNumber}.` });
            setWithdrawAmount("");
            setMobileNumber("");
            setWithdrawStatus("");
            loadData();
            break;
          }

          if (isTransactionFailed(statusRes)) {
            setWithdrawStatus("");
            toast({ title: "Withdrawal failed", description: getTransactionErrorMessage(statusRes, "Withdrawal failed"), variant: "destructive" });
            break;
          }

          setWithdrawStatus(status ? `Verifying withdrawal... (${status})` : `Verifying withdrawal... (${attempt}s)`);
        }

        if (!confirmed) {
          setWithdrawStatus("");
          toast({ title: "Withdrawal still pending", description: "No final confirmation yet. Please refresh and check transaction history.", variant: "destructive" });
        }
      } else {
        setWithdrawStatus("");
        toast({ title: "Withdrawal failed", description: getTransactionErrorMessage(res, "No withdrawal reference returned"), variant: "destructive" });
      }
    } catch (e: any) {
      setWithdrawStatus("");
      toast({ title: "Error", description: e?.message || "Network error", variant: "destructive" });
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Subscription Wallet</h1>
        <button onClick={loadData} disabled={loading} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Available Balance</span>
          </div>
          <p className="text-2xl font-black text-foreground">
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : `${balance.toLocaleString()} UGX`}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Transactions</span>
          </div>
          <p className="text-2xl font-black text-foreground">{transactions.length}</p>
        </div>
      </div>

      {/* Admin Withdraw via Mobile Money */}
      <div className="bg-card border border-border rounded-xl p-5 mb-8 max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Withdraw via Mobile Money</h2>
        </div>
        <div className="space-y-3">
          <input
            value={mobileNumber}
            onChange={e => setMobileNumber(e.target.value)}
            placeholder="Mobile Money Number (e.g. +256700000000)"
            type="tel"
            className="w-full px-3 py-2 rounded-md bg-secondary text-foreground text-sm border border-border placeholder:text-muted-foreground"
          />
          <div className="flex gap-2">
            <input
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              placeholder="Amount (UGX)"
              type="number"
              className="flex-1 px-3 py-2 rounded-md bg-secondary text-foreground text-sm border border-border placeholder:text-muted-foreground"
            />
            <button
              onClick={handleWithdraw}
              disabled={withdrawing || !withdrawAmount || !mobileNumber}
              className="flex items-center gap-1 px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
            >
              {withdrawing && <Loader2 className="w-3 h-3 animate-spin" />} Withdraw
            </button>
          </div>
          {withdrawStatus && <p className="text-xs text-muted-foreground">{withdrawStatus}</p>}
          <p className="text-xs text-muted-foreground">Funds will be sent via MTN/Airtel Mobile Money.</p>
        </div>
      </div>

      {/* Transaction History from Backend */}
      <h2 className="text-lg font-bold text-foreground mb-3">Transaction History</h2>
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left p-3">Reference</th>
                <th className="text-left p-3">Phone</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => (
                <tr key={tx.internal_reference || tx.id || i} className="border-b border-border last:border-0">
                  <td className="p-3 text-foreground text-xs font-mono">{tx.internal_reference || tx.id || "—"}</td>
                  <td className="p-3 text-muted-foreground">{tx.msisdn || "—"}</td>
                  <td className="p-3 text-foreground font-bold">{(tx.amount || 0).toLocaleString()} UGX</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.status === "success" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {tx.status || "unknown"}
                    </span>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminWallet;
