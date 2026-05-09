import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/contexts/AuthContext";
import { fetchBackendTransactions, type BackendTransaction } from "@/lib/payments";

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: "subscription" | "wallet_topup" | "wallet_withdraw";
  amount: number;
  plan?: string;
  date: string;
  status: "completed" | "pending" | "failed";
  msisdn?: string;
  reference?: string;
  raw?: BackendTransaction;
}

const SUCCESS = new Set(["success", "successful", "completed", "complete", "approved", "paid"]);
const FAIL = new Set(["failed", "failure", "cancelled", "canceled", "rejected", "declined", "error", "expired"]);

function mapBackendTx(tx: BackendTransaction, users: UserProfile[]): Transaction {
  const rawStatus = String(tx.status || tx.request_status || "").toLowerCase();
  const status: Transaction["status"] = SUCCESS.has(rawStatus)
    ? "completed"
    : FAIL.has(rawStatus)
    ? "failed"
    : "pending";
  const txType = String(tx.transaction_type || tx.type || "").toLowerCase();
  const isPayout = txType.includes("payout") || txType.includes("withdraw");
  const matchedUser = users.find((u) => (u as any).msisdn && (u as any).msisdn === tx.msisdn);
  return {
    id: tx.internal_reference || tx.id || tx.customer_reference || crypto.randomUUID(),
    userId: matchedUser?.uid || "",
    userName: matchedUser?.name || tx.msisdn || "Unknown",
    type: isPayout ? "wallet_withdraw" : "wallet_topup",
    amount: Number(tx.amount || 0),
    plan: undefined,
    date: tx.created_at || new Date().toISOString(),
    status,
    msisdn: tx.msisdn,
    reference: tx.internal_reference || tx.customer_reference,
    raw: tx,
  };
}

export const useUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map((d) => ({ ...d.data() } as UserProfile)));
    } catch (e) {
      console.error("Failed to load users", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);
  return { users, loading, refetch: fetchUsers };
};

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTx = async () => {
    setLoading(true);
    setError(null);
    try {
      // Pull users in parallel so we can label transactions with user names
      const [usersSnap, txRes] = await Promise.all([
        getDocs(collection(db, "users")).catch(() => null),
        fetchBackendTransactions(),
      ]);
      const users: UserProfile[] = usersSnap
        ? usersSnap.docs.map((d) => ({ ...d.data() } as UserProfile))
        : [];

      if (!txRes?.success || !txRes.relworx?.transactions) {
        throw new Error("Backend returned no transactions");
      }
      const items = txRes.relworx.transactions.map((t) => mapBackendTx(t, users));
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(items);
    } catch (e: any) {
      console.error("Failed to load transactions", e);
      setError(e?.message || "Failed to load transactions");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTx(); }, []);
  return { transactions, loading, error, refetch: fetchTx };
};

// Admin: activate subscription for a user
export const adminActivateSubscription = async (
  uid: string,
  planName: string,
  durationDays: number
) => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + durationDays);
  await updateDoc(doc(db, "users", uid), {
    subscriptionPlan: planName,
    subscriptionExpiry: expiry.toISOString(),
    updatedAt: serverTimestamp(),
  });
};

// Admin: deactivate subscription
export const adminDeactivateSubscription = async (uid: string) => {
  await updateDoc(doc(db, "users", uid), {
    subscriptionPlan: null,
    subscriptionExpiry: null,
    updatedAt: serverTimestamp(),
  });
};

// Admin: block/unblock user
export const adminSetUserBlocked = async (uid: string, blocked: boolean) => {
  await updateDoc(doc(db, "users", uid), {
    blocked,
    updatedAt: serverTimestamp(),
  });
};

// Admin: delete user document
export const adminDeleteUser = async (uid: string) => {
  await deleteDoc(doc(db, "users", uid));
};
