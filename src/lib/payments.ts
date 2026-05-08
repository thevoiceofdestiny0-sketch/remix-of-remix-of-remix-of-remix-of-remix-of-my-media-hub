import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const API_BASE = "https://api.thevoiceofdestiny0.workers.dev/api";

interface RelworxResult {
  internal_reference?: string;
  status?: string;
  amount?: number;
  msisdn?: string;
}

interface DepositResponse {
  success: boolean;
  relworx?: RelworxResult;
  message?: string;
}

interface StatusResponse {
  success: boolean;
  relworx?: RelworxResult & {
    request_status?: string;
    provider?: string;
    provider_transaction_id?: string;
    completed_at?: string;
  };
  message?: string;
}

export interface WalletBalanceResponse {
  success: boolean;
  relworx?: {
    success: boolean;
    balance: number;
  };
}

export interface BackendTransaction {
  id?: string;
  internal_reference?: string;
  amount?: number;
  msisdn?: string;
  status?: string;
  type?: string;
  created_at?: string;
  [key: string]: any;
}

export interface TransactionsResponse {
  success: boolean;
  relworx?: {
    success: boolean;
    current_page: number;
    per_page: number;
    total_pages: number;
    total_count: number;
    transactions: BackendTransaction[];
  };
}

export async function fetchWalletBalance(): Promise<WalletBalanceResponse> {
  const res = await fetch(`${API_BASE}/wallet/balance`);
  return res.json();
}

export async function fetchBackendTransactions(): Promise<TransactionsResponse> {
  const res = await fetch(`${API_BASE}/transactions`);
  return res.json();
}

export async function initiateDeposit(msisdn: string, amount: number, description: string): Promise<DepositResponse> {
  const res = await fetch(`${API_BASE}/request-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msisdn, amount, description }),
  });
  return res.json();
}

export async function initiateWithdraw(msisdn: string, amount: number, description: string) {
  const res = await fetch(`${API_BASE}/send-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ msisdn, amount, description }),
  });
  return res.json();
}

export async function checkStatus(internalReference: string): Promise<StatusResponse> {
  const res = await fetch(`${API_BASE}/request-status?internal_reference=${encodeURIComponent(internalReference)}`);
  return res.json();
}

export function pollPaymentStatus(
  internalReference: string,
  onSuccess: (data: StatusResponse) => void,
  onFail: (msg: string) => void,
  onPoll?: (attempt: number) => void,
  maxAttempts = 30,
  intervalMs = 10000
): () => void {
  let attempt = 0;
  const id = setInterval(async () => {
    attempt++;
    onPoll?.(attempt);
    try {
      const data: any = await checkStatus(internalReference);
      const r = data?.relworx || {};
      const status = r.status || r.request_status;
      if (data?.success && status === "success") {
        clearInterval(id);
        onSuccess(data);
      } else if (status === "failed" || status === "failure" || data?.success === false) {
        clearInterval(id);
        const msg =
          r.message ||
          r.customer_message ||
          r.failure_reason ||
          r.reason ||
          r.error ||
          data?.message ||
          data?.error ||
          "Payment failed";
        onFail(msg);
      } else if (attempt >= maxAttempts) {
        clearInterval(id);
        onFail("Payment verification timed out. Please check your phone.");
      }
    } catch {
      if (attempt >= maxAttempts) {
        clearInterval(id);
        onFail("Could not verify payment. Please try again.");
      }
    }
  }, intervalMs);

  return () => clearInterval(id);
}

export async function activateSubscription(
  uid: string,
  planName: string,
  durationDays: number
) {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + durationDays);

  await updateDoc(doc(db, "users", uid), {
    subscriptionPlan: planName,
    subscriptionExpiry: expiry.toISOString(),
    updatedAt: serverTimestamp(),
  });
}
