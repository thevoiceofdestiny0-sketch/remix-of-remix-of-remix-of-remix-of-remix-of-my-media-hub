import { useState, useRef } from "react";
import { Check, Crown, Phone, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { initiateDeposit, pollPaymentStatus, activateSubscription } from "@/lib/payments";

const subscriptionPlans = [
  { id: "plan-1day", name: "1 Day Pass", duration: "1 Day", price: 5000, durationDays: 1 },
  { id: "plan-1week", name: "1 Week Pass", duration: "1 Week", price: 10000, durationDays: 7 },
  { id: "plan-1month", name: "1 Month Pass", duration: "1 Month", price: 15000, durationDays: 30 },
];

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
}

const SubscriptionModal = ({ open, onClose }: SubscriptionModalProps) => {
  const { toast } = useToast();
  const { user, profile, hasActiveSubscription, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof subscriptionPlans[0] | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const cancelPoll = useRef<(() => void) | null>(null);

  if (!open) return null;

  const handlePay = async () => {
    if (!user || !profile) {
      toast({ title: "Please log in first", variant: "destructive" });
      return;
    }
    if (!selectedPlan) {
      toast({ title: "Select a plan first", variant: "destructive" });
      return;
    }
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({ title: "Enter a valid phone number", variant: "destructive" });
      return;
    }

    const msisdn = phoneNumber.startsWith("+") ? phoneNumber : `+256${phoneNumber.replace(/^0/, "")}`;
    setLoading(true);

    try {
      const res = await initiateDeposit(msisdn, selectedPlan.price, `${selectedPlan.name} Subscription`);
      if (res.success && res.relworx?.internal_reference) {
        toast({ title: "Confirm payment", description: `Check your phone (${msisdn}) and enter your PIN to pay ${selectedPlan.price.toLocaleString()} UGX.` });
        setLoading(false);
        setPolling(true);

        cancelPoll.current = pollPaymentStatus(
          res.relworx.internal_reference,
          async () => {
            await activateSubscription(user.uid, selectedPlan.name, selectedPlan.durationDays);
            await refreshProfile();
            setPolling(false);
            toast({ title: "✅ Subscription activated!", description: `${selectedPlan.name} is now active. Enjoy!` });
            onClose();
          },
          (msg) => {
            setPolling(false);
            toast({ title: "Payment failed", description: msg, variant: "destructive" });
          },
          (attempt) => console.log(`Polling attempt ${attempt}...`)
        );
      } else {
        setLoading(false);
        toast({ title: "Error", description: res.message || "Could not initiate payment.", variant: "destructive" });
      }
    } catch {
      setLoading(false);
      toast({ title: "Error", description: "Network error. Try again.", variant: "destructive" });
    }
  };

  const hasActive = hasActiveSubscription();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => { if (!polling) onClose(); }}>
      <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-[520px] mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {!polling && (
          <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-secondary transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}

        <div className="text-center mb-6">
          <Crown className="w-10 h-10 text-accent mx-auto mb-2" />
          <h2 className="text-xl font-bold text-foreground mb-1">VIP Subscription</h2>
          <p className="text-sm text-muted-foreground">Watch and download unlimited content</p>
          {hasActive && profile && (
            <p className="mt-2 text-xs text-primary font-medium">
              ✓ Active: {profile.subscriptionPlan} — expires {new Date(profile.subscriptionExpiry!).toLocaleDateString()}
            </p>
          )}
        </div>

        {polling ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Waiting for payment confirmation...</p>
            <p className="text-xs text-muted-foreground">Please confirm the payment on your phone.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {subscriptionPlans.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`border rounded-xl p-4 bg-secondary/30 transition-colors text-center ${
                    selectedPlan?.id === plan.id ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary"
                  }`}
                >
                  <h3 className="text-sm font-bold text-foreground mb-1">{plan.duration}</h3>
                  <p className="text-2xl font-black text-primary mb-0.5">{plan.price.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">UGX</p>
                  <ul className="text-[11px] text-muted-foreground space-y-1 mt-3 text-left">
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-primary" /> Watch all content</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-primary" /> Download offline</li>
                    <li className="flex items-center gap-1"><Check className="w-3 h-3 text-primary" /> No ads</li>
                  </ul>
                </button>
              ))}
            </div>

            {selectedPlan && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Mobile Money Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      placeholder="0770123456"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <button
                  onClick={handlePay}
                  disabled={loading || !profile}
                  className="w-full py-2 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                  {loading ? "Initiating..." : `Pay ${selectedPlan.price.toLocaleString()} UGX via Mobile Money`}
                </button>
              </div>
            )}

            {!profile && (
              <p className="mt-3 text-center text-xs text-destructive">Please log in to subscribe.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SubscriptionModal;
