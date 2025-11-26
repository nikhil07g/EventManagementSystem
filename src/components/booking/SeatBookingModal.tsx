import { useMemo, useState } from "react";
import { X, Users, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import PaymentModal from "@/components/PaymentModal";
import { api, ApiError, Event } from "@/lib/api";
import { formatTimeToIST } from "@/lib/utils";
import { SESSION_KEYS, readSession } from "@/lib/session";

interface SeatBookingModalProps {
  event: Event;
  onClose: () => void;
}

const SeatBookingModal = ({ event, onClose }: SeatBookingModalProps) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const { toast } = useToast();

  const availableTickets = useMemo(() => {
    const capacity = event.capacity ?? 0;
    const remaining = event.ticketsAvailable ?? Math.max(capacity - (event.ticketsSold ?? 0), 0);
    return Math.max(remaining, 0);
  }, [event.capacity, event.ticketsAvailable, event.ticketsSold]);

  const ticketPrice = Number.isFinite(event.ticketPrice) ? event.ticketPrice : 0;
  const isFree = ticketPrice <= 0;
  const maxPurchase = availableTickets > 0 ? Math.min(availableTickets, 10) : 0;
  const totalAmount = quantity * ticketPrice;

  const ensureAuthenticated = () => {
    const session = readSession(SESSION_KEYS.user);
    if (!session) {
      toast({
        title: "Please Sign In",
        description: "Log in to book tickets for this event.",
        variant: "destructive",
      });
      return null;
    }
    return session;
  };

  const completeBooking = async (paymentMethod: string) => {
    const session = ensureAuthenticated();
    if (!session) return;

    setIsSubmitting(true);
    try {
      const payload = {
        eventId: event.id,
        quantity,
        paymentMethod,
      };

      const booking = await api.bookings.create(payload, session.token);

      toast({
        title: "Booking Confirmed",
        description: `Booking ID ${booking.id} created successfully.`,
      });

      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "Booking Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Booking Failed",
          description: "Unable to create booking. Please try again.",
          variant: "destructive",
        });
      }
  console.error("Booking error:", error);
    } finally {
      setIsSubmitting(false);
      setShowPayment(false);
    }
  };

  const handleBooking = () => {
    if (maxPurchase === 0) {
      toast({
        title: "Sold Out",
        description: "No tickets are currently available for this event.",
        variant: "destructive",
      });
      return;
    }

    if (quantity < 1) {
      toast({
        title: "Select Quantity",
        description: "Choose at least one ticket to continue.",
        variant: "destructive",
      });
      return;
    }

    if (quantity > maxPurchase) {
      toast({
        title: "Quantity Too High",
        description: `Only ${maxPurchase} ticket(s) are available right now.`,
        variant: "destructive",
      });
      setQuantity(maxPurchase);
      return;
    }

    const session = ensureAuthenticated();
    if (!session) return;

    if (isFree) {
      completeBooking('other');
    } else {
      setShowPayment(true);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
        <Card className="w-full max-w-2xl my-8 bg-card">
          <div className="sticky top-0 bg-card border-b border-border p-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">{event.name}</h2>
              <p className="text-sm text-muted-foreground">
                {new Date(event.date).toLocaleDateString()} • {formatTimeToIST(event.time)}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/40 flex items-center gap-3">
                <Ticket className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Price</p>
                  <p className="text-lg font-semibold">{isFree ? 'FREE' : `₹${ticketPrice.toLocaleString('en-IN')}`}</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/40 flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Tickets Available</p>
                  <p className="text-lg font-semibold">{availableTickets}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticketQuantity">Number of Tickets</Label>
              <Input
                id="ticketQuantity"
                type="number"
                min={1}
                max={Math.max(maxPurchase, 1)}
                value={quantity}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);
                  if (!Number.isFinite(nextValue) || nextValue < 1) {
                    setQuantity(1);
                    return;
                  }
                  const clamped = maxPurchase ? Math.min(nextValue, maxPurchase) : nextValue;
                  setQuantity(clamped);
                }}
                disabled={isSubmitting || maxPurchase === 0}
              />
              <p className="text-xs text-muted-foreground">
                You can book up to {maxPurchase || 1} ticket(s) at once.
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-primary">
                  {isFree ? 'FREE' : `₹${totalAmount.toLocaleString('en-IN')}`}
                </p>
              </div>
              <Button onClick={handleBooking} disabled={isSubmitting || maxPurchase === 0} size="lg">
                {isFree ? 'Confirm Booking' : 'Proceed to Payment'}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {showPayment && (
        <PaymentModal
          amount={totalAmount}
          onSuccess={completeBooking}
          onClose={() => setShowPayment(false)}
          eventName={event.name}
        />
      )}
    </>
  );
};

export default SeatBookingModal;
