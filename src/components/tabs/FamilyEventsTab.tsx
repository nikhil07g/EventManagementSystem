import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { api, ApiError, type Event } from "@/lib/api";
import { formatTimeToIST } from "@/lib/utils";

const FamilyEventsTab = () => {
  const [familyId, setFamilyId] = useState("");
  const [event, setEvent] = useState<Event | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    try {
      const normalizedQuery = familyId.trim().toLowerCase();
      if (!normalizedQuery) {
        toast({
          title: "Enter search details",
          description: "Provide an event ID or part of the event name.",
          variant: "destructive",
        });
        return;
      }
      const events = await api.events.list();
      const found = events.find(
        (event) =>
          event.type === "Family" &&
          event.status === "active" &&
          (event.id.toLowerCase() === normalizedQuery || event.name.toLowerCase().includes(normalizedQuery))
      );

      if (found) {
        setEvent(found);
        toast({
          title: "Event Found!",
          description: `Welcome to ${found.name}`,
        });
      } else {
        setEvent(null);
        toast({
          title: "Event Not Found",
          description: "Please check the Family Event ID and try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to search family events:", error);
      toast({
        title: "Unable to search",
        description: error instanceof ApiError ? error.message : "Please try again in a moment.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-card border-border">
        <h2 className="text-2xl font-bold mb-4">Access Family Event</h2>
        <p className="text-muted-foreground mb-6">
          Enter the unique Family Event ID you received to view event details
        </p>
        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="familyId" className="sr-only">
              Family Event ID
            </Label>
            <Input
              id="familyId"
              placeholder="Search by Event ID or name"
              value={familyId}
              onChange={(e) => setFamilyId(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch}>
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>
      </Card>

      {event && (
        <Card className="p-6 bg-gradient-card border-border animate-in fade-in slide-in-from-top-4">
          {event.image && (
            <div className="aspect-video rounded-lg overflow-hidden mb-6">
              <img src={event.image} alt={event.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="space-y-4">
            <div>
              <h3 className="text-3xl font-bold mb-2">{event.name}</h3>
              <p className="text-lg text-muted-foreground">{event.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-border">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-semibold">{new Date(event.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-semibold">{formatTimeToIST(event.time)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Venue</p>
                <p className="font-semibold">{event.venue}</p>
              </div>
            </div>
            <p className="text-center text-muted-foreground">
              This is a private family event. Please contact the organizer for more details.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FamilyEventsTab;
