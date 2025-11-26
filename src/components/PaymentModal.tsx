import { useState } from "react";
import { CreditCard, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface PaymentModalProps {
  amount: number;
  onSuccess: (method: string) => void;
  onClose: () => void;
  eventName: string;
}

const PaymentModal = ({ amount, onSuccess, onClose, eventName }: PaymentModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = () => {
    if (!paymentMethod) {
      toast({
        title: "Select Payment Method",
        description: "Please choose a payment method to continue",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      const selected = paymentMethod.toLowerCase();
      const method = selected === "debit" || selected === "credit" ? "card" : selected;
      toast({
        title: "Payment Successful!",
        description: `₹${amount} paid via ${paymentMethod}`,
      });
      onSuccess(method);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 bg-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Complete Payment</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="mb-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Event</p>
          <p className="font-semibold">{eventName}</p>
          <p className="text-2xl font-bold text-primary mt-2">₹{amount}</p>
        </div>

        <div className="space-y-4 mb-6">
          <Label>Select Payment Method</Label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setPaymentMethod("UPI")}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === "UPI"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Smartphone className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">UPI</p>
            </button>
            <button
              onClick={() => setPaymentMethod("Debit")}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === "Debit"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <CreditCard className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Debit</p>
            </button>
            <button
              onClick={() => setPaymentMethod("Credit")}
              className={`p-4 border-2 rounded-lg transition-all ${
                paymentMethod === "Credit"
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <CreditCard className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Credit</p>
            </button>
          </div>

          {paymentMethod && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              {paymentMethod === "UPI" && (
                <>
                  <div>
                    <Label htmlFor="upi">UPI ID</Label>
                    <Input id="upi" placeholder="yourname@upi" />
                  </div>
                </>
              )}
              {(paymentMethod === "Debit" || paymentMethod === "Credit") && (
                <>
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="expiry">Expiry</Label>
                      <Input id="expiry" placeholder="MM/YY" />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input id="cvv" placeholder="123" type="password" />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={processing} className="flex-1">
            {processing ? "Processing..." : `Pay ₹${amount}`}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PaymentModal;
