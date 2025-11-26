import { useState, useEffect } from "react";
import { Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTimeToIST } from "@/lib/utils";
import SeatBookingModal from "@/components/booking/SeatBookingModal";
import { useToast } from "@/hooks/use-toast";
import { api, ApiError, type Event } from "@/lib/api";

const ConcertsTab = () => {
  const [concerts, setConcerts] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const loadConcerts = async () => {
      try {
        const events = await api.events.list();
        const concertEvents = events.filter((event) => event.type === "Concert" && event.status === "active");
        setConcerts(concertEvents);
      } catch (error) {
        console.error("Failed to load concerts:", error);
        toast({
          title: "Unable to load concerts",
          description: error instanceof ApiError ? error.message : "Please refresh and try again.",
          variant: "destructive",
        });
      }
    };

    loadConcerts();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Live Concerts</h2>
        <p className="text-muted-foreground">Book your tickets for amazing live performances</p>
      </div>

      {concerts.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-card border-border">
          <p className="text-lg text-muted-foreground">No concerts available at the moment</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {concerts.map((concert) => (
            <Card
              key={concert.id}
              className="overflow-hidden bg-gradient-card border-border hover:shadow-hover transition-shadow"
            >
              {concert.image && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={concert.image}
                    alt={concert.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">{concert.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {concert.description}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(concert.date).toLocaleDateString()} • {formatTimeToIST(concert.time)}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {concert.venue}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    {concert.category && <Badge variant="outline">{concert.category}</Badge>}
                    <p className="text-lg font-bold mt-2">
                      {concert.ticketPrice === 0 ? "FREE" : `₹${concert.ticketPrice}`}
                    </p>
                  </div>
                  <Button onClick={() => setSelectedEvent(concert)}>Book Now</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedEvent && (
        <SeatBookingModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

export default ConcertsTab;
