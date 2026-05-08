import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const API_BASE = "https://api.thevoiceofdestiny0.workers.dev/api";

interface RelworxResult {
  internal_reference?: string;
  status?: string;
  request_status?: string;
  amount?: number;
  msisdn?: string;
  success?: boolean;
  provider?: string;
  provider_transaction_id?: string;
  completed_at?: string;
  message?: string;
  customer_message?: string;
  failure_reason?: string;
  reason?: string;
  error?: string;
  error_code?: string;
}

interface DepositResponse {
  success: boolean;
  relworx?: RelworxResult;
  message?: string;
}

interface StatusResponse {
  success: boolean;
  relworx?: RelworxResult;
  message?: string;
}

const SUCCESS_STATUSES = new Set(["success", "successful", "completed", "complete", "approved", "paid"]);
const FAILURE_STATUSES = new Set(["failed", "failure", "cancelled", "canceled", "rejected", "declined", "error", "expired"]);

export function getTransactionReference(data: any): string | undefined {
  return data?.relworx?.internal_reference || data?.internal_reference;
}

export function getTransactionStatus(data: any): string {
  const rawStatus = data?.relworx?.status || data?.relworx?.request_status || data?.status || data?.request_status || "";
  return String(rawStatus).trim().toLowerCase();
}

export function getTransactionErrorMessage(data: any, fallback = "Payment failed"): string {
  const r = data?.relworx || {};
  return (
    r.message ||
    r.customer_message ||
    r.failure_reason ||
    r.reason ||
    r.error ||
    (r.error_code ? `Error: ${r.error_code}` : null) ||
    data?.message ||
    data?.error ||
    fallback
  );
}

export function isTransactionSuccessful(data: any): boolean {
  const status = getTransactionStatus(data);
  const r = data?.relworx || {};
  return SUCCESS_STATUSES.has(status) || (!!data?.success && r.success === true && !!r.completed_at);
}

export function isTransactionFailed(data: any): boolean {
  const status = getTransactionStatus(data);
  const r = data?.relworx || {};
  return FAILURE_STATUSES.has(status) || data?.success === false || r.success === false;
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
  maxAttempts = 300,
  intervalMs = 1000
): () => void {
  let attempt = 0;
  const id = setInterval(async () => {
    attempt++;
    onPoll?.(attempt);
    try {
      const data: any = await checkStatus(internalReference);
      if (isTransactionSuccessful(data)) {
        clearInterval(id);
        onSuccess(data);
      } else if (isTransactionFailed(data)) {
        clearInterval(id);
        onFail(getTransactionErrorMessage(data));
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
