import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Calendar, Plus, Edit, Trash2, LogOut, TrendingUp, User, BarChart3, Settings, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { api, ApiError, type Event as ApiEvent } from "@/lib/api";
import { formatTimeToIST } from "@/lib/utils";
import ProfileDashboard from "@/components/ProfileDashboard";
import { readSession, clearSession, SESSION_KEYS } from "@/lib/session";

interface Advertisement {
  id: string;
  eventId: string;
  eventName: string;
  imageUrl: string;
  duration: number;
  expiryDate: string;
  cost: number;
}

const OrganizerDashboard = () => {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const eventsData = await api.events.list();
      setEvents(eventsData);
      
      // Load ads from localStorage (for now)
      const storedAds = JSON.parse(localStorage.getItem("advertisements") || "[]");
      setAds(storedAds);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load events. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const session = readSession(SESSION_KEYS.organizer) || readSession(SESSION_KEYS.admin);
    if (!session) {
      navigate("/organizer-login");
      return;
    }
    loadData();
  }, [navigate, loadData]);

  const handleLogout = () => {
  clearSession(SESSION_KEYS.organizer);
  clearSession(SESSION_KEYS.admin);
    navigate("/");
  };

  const getDaysRemaining = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleDelete = async (eventId: string) => {
    try {
      const session = readSession(SESSION_KEYS.organizer) || readSession(SESSION_KEYS.admin);
      if (!session) {
        toast({
          title: "Sign In Required",
          description: "Log in again to manage events.",
          variant: "destructive",
        });
        navigate("/organizer-login");
        return;
      }

      await api.events.remove(eventId, session.token);
      
      // Remove from local state
  const updatedEvents = events.filter((event) => event.id !== eventId);
      setEvents(updatedEvents);
      
      // Also remove associated bookings and ads
      const bookings = JSON.parse(localStorage.getItem("bookings") || "[]") as { eventId?: string }[];
      const updatedBookings = bookings.filter((b) => b.eventId !== eventId);
      localStorage.setItem("bookings", JSON.stringify(updatedBookings));
      
      const updatedAds = ads.filter((ad) => ad.eventId !== eventId);
      localStorage.setItem("advertisements", JSON.stringify(updatedAds));
      setAds(updatedAds);

      toast({
        title: "Event Deleted",
        description: "Event and all associated data removed",
      });
    } catch (error) {
      console.error("Failed to delete event:", error);
      if (error instanceof ApiError) {
        toast({
          title: "Unable to delete event",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete event. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Organizer Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <Link to="/create-event">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create New Event
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">My Events</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileDashboard userType="organizer" />
          </TabsContent>

          <TabsContent value="events">
            <div className="space-y-8">
              {/* Active Advertisements Section */}
              {ads.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-secondary" />
                    Active Promotions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ads.map((ad) => {
                      const daysLeft = getDaysRemaining(ad.expiryDate);
                      return (
                        <Card key={ad.id} className="p-4 bg-gradient-card border-border">
                          <div className="aspect-video rounded-lg overflow-hidden mb-3">
                            <img src={ad.imageUrl} alt={ad.eventName} className="w-full h-full object-cover" />
                          </div>
                          <h4 className="font-semibold mb-2">{ad.eventName}</h4>
                          <div className="flex justify-between items-center text-sm">
                            <Badge variant={daysLeft > 0 ? "default" : "destructive"}>
                              {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
                            </Badge>
                            <span className="text-muted-foreground">₹{ad.cost}</span>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Events List */}
              {loading ? (
                <Card className="p-12 text-center bg-gradient-card border-border">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Loading Events...</h3>
                  <p className="text-muted-foreground">Please wait while we fetch your events</p>
                </Card>
              ) : events.length === 0 ? (
                <Card className="p-12 text-center bg-gradient-card border-border">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Events Yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first event to get started</p>
                  <Link to="/create-event">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  </Link>
                </Card>
              ) : (
                <div>
                  <h3 className="text-2xl font-bold mb-4">Your Events</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => {
                      const statusLabel = event.status ? `${event.status.charAt(0).toUpperCase()}${event.status.slice(1)}` : "Unknown";
                      const isActive = event.status === "active";
                      return (
                        <Card key={event.id} className="p-6 hover:shadow-lg transition-shadow">
                        <h3 className="text-xl font-semibold mb-2">{event.name}</h3>
                        <div className="space-y-2 mb-4">
                          <Badge variant="secondary" className="mr-2">
                            {event.type}
                          </Badge>
                          <Badge variant={isActive ? "default" : "outline"}>
                            {statusLabel}
                          </Badge>
                          <div className="text-sm text-muted-foreground flex flex-col gap-1">
                            <span className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {new Date(event.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {formatTimeToIST(event.time)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(event.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-8">
              <h3 className="text-2xl font-bold">Analytics & Insights</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Events</p>
                      <p className="text-2xl font-bold">{events.length}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-primary" />
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Promotions</p>
                      <p className="text-2xl font-bold">{ads.length}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Published Events</p>
                      <p className="text-2xl font-bold">
                        {events.filter((event) => event.status === "active").length}
                      </p>
                    </div>
                    <Badge className="w-8 h-8 rounded-full flex items-center justify-center">
                      ✓
                    </Badge>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Draft Events</p>
                      <p className="text-2xl font-bold">
                        {events.filter((event) => event.status === "draft").length}
                      </p>
                    </div>
                    <Settings className="w-8 h-8 text-orange-500" />
                  </div>
                </Card>
              </div>

              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4">Event Distribution by Type</h4>
                <div className="space-y-3">
                  {Array.from(new Set(events.map(e => e.type))).map(type => {
                    const count = events.filter(e => e.type === type).length;
                    const percentage = events.length > 0 ? (count / events.length) * 100 : 0;
                    
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{type}</Badge>
                          <span className="text-sm text-muted-foreground">{count} events</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OrganizerDashboard;