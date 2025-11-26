import { useState, useEffect } from "react";
import { Calendar, MapPin, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTimeToIST } from "@/lib/utils";
import InvoiceModal from "@/components/booking/InvoiceModal";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { readSession, SESSION_KEYS } from "@/lib/session";

interface DisplayBooking {
  id: string;
  eventName: string;
  eventType: string;
  date: string;
  time: string;
  venue: string;
  seats: string[];
  quantity: number;
  totalPrice: number;
  paymentMethod: string;
  bookingDate: string;
}

const MyBookingsTab = () => {
  const [bookings, setBookings] = useState<DisplayBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<DisplayBooking | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const session = readSession(SESSION_KEYS.user);
        if (!session) {
          toast({
            title: "Please sign in",
            description: "Log in to view your bookings.",
            variant: "destructive",
          });
          setBookings([]);
          return;
        }

  const data = await api.bookings.list(session.token);
  const mapped = data.map<DisplayBooking>((booking) => {
          const event = booking.event;
          const eventDate = event?.date ?? booking.bookedAt ?? booking.createdAt ?? new Date().toISOString();
          return {
            id: booking.id,
            eventName: event?.name ?? "Event",
            eventType: event?.type ?? "General",
            date: eventDate,
            time: event?.time ?? '',
            venue: event?.venue ?? "Venue TBA",
            seats: booking.seats,
            quantity: booking.quantity,
            totalPrice: booking.totalPrice,
            paymentMethod: booking.paymentMethod,
            bookingDate: booking.bookedAt ?? booking.createdAt ?? eventDate,
          };
        });
        setBookings(mapped);
      } catch (error) {
        console.error("Failed to load bookings:", error);
        toast({
          title: "Unable to load bookings",
          description: error instanceof ApiError ? error.message : "Please refresh and try again.",
          variant: "destructive",
        });
      }
    };

    loadBookings();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">My Bookings</h2>
        <p className="text-muted-foreground">View and manage your event bookings</p>
      </div>

      {bookings.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-card border-border">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
          <p className="text-muted-foreground">Start exploring events and book your tickets!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="p-6 bg-gradient-card border-border">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold">{booking.eventName}</h3>
                    <Badge variant="outline">{booking.eventType}</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {new Date(booking.date).toLocaleDateString()} • {formatTimeToIST(booking.time) || "Time TBA"}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {booking.venue}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Booking ID</p>
                      <p className="font-mono text-sm">{booking.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Seats/Passes</p>
                      <p className="font-semibold">{booking.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-bold text-primary">
                        {booking.totalPrice === 0 ? "FREE" : `₹${booking.totalPrice}`}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedBooking(booking)}
                    className="w-full md:w-auto"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Invoice
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedBooking && (
        <InvoiceModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
};

export default MyBookingsTab;
