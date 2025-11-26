import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Users, Music, Trophy, Film, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import theatres from "@/data/theatres";

const Index = () => {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  interface Advertisement { imageUrl?: string; expiryDate?: string; eventId?: string; eventName?: string }
  const [activeAds, setActiveAds] = useState<Advertisement[]>([]);

  useEffect(() => {
    // Load active advertisements
    const ads = JSON.parse(localStorage.getItem("advertisements") || "[]") as Advertisement[];
    const now = new Date();
    const active = ads.filter((ad) => {
      const expiryDate = new Date(ad.expiryDate || "");
      return expiryDate > now;
    });
    setActiveAds(active);
  }, []);

  useEffect(() => {
    if (activeAds.length > 0) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % activeAds.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeAds.length]);

  const nextAd = () => {
    setCurrentAdIndex((prev) => (prev + 1) % activeAds.length);
  };

  const prevAd = () => {
    setCurrentAdIndex((prev) => (prev - 1 + activeAds.length) % activeAds.length);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">EventHub</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/organizer-login">
              <Button variant="outline">Organizer Login</Button>
            </Link>
            <Link to="/user-login">
              <Button>User Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Advertisement Banner */}
      <section className="relative overflow-hidden">
        {activeAds.length > 0 ? (
          <div className="relative h-[400px] bg-gradient-hero">
            <img 
              src={activeAds[currentAdIndex].imageUrl} 
              alt="Event Advertisement"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="container mx-auto">
                <Link to={`/user-portal?eventId=${activeAds[currentAdIndex].eventId}`}>
                  <h2 className="text-4xl font-bold text-primary-foreground mb-2">
                    {activeAds[currentAdIndex].eventName}
                  </h2>
                  <p className="text-xl text-primary-foreground/90">Featured Event - Click to Book</p>
                </Link>
              </div>
            </div>
            {activeAds.length > 1 && (
              <>
                <button
                  onClick={prevAd}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm p-2 rounded-full hover:bg-card transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextAd}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm p-2 rounded-full hover:bg-card transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="relative py-20 px-4 bg-gradient-hero">
            <div className="container mx-auto text-center">
              <h2 className="text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
                Experience Live Events
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                Book tickets for concerts, sports, movies, and family events all in one place
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/user-login">
                  <Button size="lg" variant="secondary">
                    Browse Events
                  </Button>
                </Link>
                <Link to="/organizer-login">
                  <Button size="lg" variant="outline" className="bg-card/10 backdrop-blur-sm border-primary-foreground/20 text-primary-foreground hover:bg-card/20">
                    Create Event
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Event Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 hover:shadow-hover transition-shadow bg-gradient-card border-border">
              <Users className="w-12 h-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Family Events</h4>
              <p className="text-muted-foreground">Private events with unique invitation IDs</p>
            </Card>
            <Card className="p-6 hover:shadow-hover transition-shadow bg-gradient-card border-border">
              <Music className="w-12 h-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Concerts</h4>
              <p className="text-muted-foreground">Auditorium seats or open ground passes</p>
            </Card>
            <Card className="p-6 hover:shadow-hover transition-shadow bg-gradient-card border-border">
              <Trophy className="w-12 h-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Sports</h4>
              <p className="text-muted-foreground">Stadium seating for all major sports</p>
            </Card>
            <Card className="p-6 hover:shadow-hover transition-shadow bg-gradient-card border-border">
              <Film className="w-12 h-12 text-primary mb-4" />
              <h4 className="text-xl font-semibold mb-2">Movies</h4>
              <p className="text-muted-foreground">Book your favorite movie shows</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Cinemas Section */}
      <section id="cinemas" className="py-12 px-4">
        <div className="container mx-auto">
          <h3 className="text-2xl font-bold mb-6">Cinemas in Hyderabad</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {theatres.slice(0, 40).map((t) => (
              <Card key={t.name} className="p-4 hover:shadow-hover transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-lg font-semibold">{t.name}</h4>
                    {t.address && <p className="text-sm text-muted-foreground">{t.address}</p>}
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-xs bg-primary/10 text-primary px-2 py-1 rounded">{t.showtimes.length} shows</span>
                  </div>
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  <div className="flex flex-wrap gap-2">
                    {t.showtimes.slice(0,4).map((s) => (
                      <span key={s} className="px-2 py-1 bg-muted/20 rounded">{s}</span>
                    ))}
                    {t.showtimes.length > 4 && <span className="px-2 py-1 bg-muted/20 rounded">+{t.showtimes.length - 4}</span>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-3xl text-center">
          <h3 className="text-3xl font-bold mb-6">About EventHub</h3>
          <p className="text-lg text-muted-foreground mb-4">
            EventHub is your all-in-one platform for discovering and booking live events. 
            Whether you're planning a family gathering, attending a concert, watching sports, 
            or catching the latest movie, we've got you covered.
          </p>
          <p className="text-lg text-muted-foreground">
            For organizers, we provide powerful tools to create, manage, and promote your events 
            with our advertisement portal.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 EventHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
