import { useState, useEffect } from "react";
import { Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatTimeToIST } from "@/lib/utils";
import SeatBookingModal from "@/components/booking/SeatBookingModal";
import { api, ApiError, type Event } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const MoviesTab = () => {
  const [movies, setMovies] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const events = await api.events.list();
        const movieEvents = events
          .filter((event) => event.type === "Movie" && event.status === "active");
        setMovies(movieEvents);
      } catch (error) {
        console.error("Failed to load movies:", error);
        toast({
          title: "Unable to load movies",
          description: error instanceof ApiError ? error.message : "Please refresh and try again.",
          variant: "destructive",
        });
      }
    };

    loadMovies();
  }, [toast]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Movies</h2>
        <p className="text-muted-foreground">Book your movie tickets for the best experience</p>
      </div>

      {movies.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-card border-border">
          <p className="text-lg text-muted-foreground">No movies available at the moment</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {movies.map((movie) => (
            <Card
              key={movie.id}
              className="overflow-hidden bg-gradient-card border-border hover:shadow-hover transition-shadow"
            >
              {movie.image && (
                <div className="aspect-[2/3] overflow-hidden">
                  <img
                    src={movie.image}
                    alt={movie.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">{movie.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {movie.description}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(movie.date).toLocaleDateString()} • {formatTimeToIST(movie.time)}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {movie.venue}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <p className="text-lg font-bold">₹{movie.ticketPrice}</p>
                  <Button onClick={() => setSelectedEvent(movie)}>Book Now</Button>
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

export default MoviesTab;
