import { useState, useEffect } from "react";
import { Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTimeToIST } from "@/lib/utils";
import SeatBookingModal from "@/components/booking/SeatBookingModal";
import { api, ApiError, type Event } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const SportsTab = () => {
  const [sports, setSports] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadSports = async () => {
      try {
        const events = await api.events.list();
        const sportsEvents = events.filter((event) => event.type === "Sports" && event.status === "active");
        setSports(sportsEvents);
      } catch (error) {
        console.error("Failed to load sports events:", error);
        toast({
          title: "Unable to load sports events",
          description: error instanceof ApiError ? error.message : "Please refresh and try again.",
          variant: "destructive",
        });
      }
    };

    loadSports();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Sports Events</h2>
        <p className="text-muted-foreground">Experience the thrill of live sports action</p>
      </div>

      {sports.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-card border-border">
          <p className="text-lg text-muted-foreground">No sports events available at the moment</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sports.map((sport) => (
            <Card
              key={sport.id}
              className="overflow-hidden bg-gradient-card border-border hover:shadow-hover transition-shadow"
            >
              {sport.image && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={sport.image}
                    alt={sport.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">{sport.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {sport.description}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(sport.date).toLocaleDateString()} • {formatTimeToIST(sport.time)}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {sport.venue}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    {sport.category && <Badge variant="outline">{sport.category}</Badge>}
                    <p className="text-lg font-bold mt-2">₹{sport.ticketPrice}</p>
                  </div>
                  <Button onClick={() => setSelectedEvent(sport)}>Book Now</Button>
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

export default SportsTab;
