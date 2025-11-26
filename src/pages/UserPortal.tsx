import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, LogOut, Users, Music, Trophy, Film, Receipt, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FamilyEventsTab from "@/components/tabs/FamilyEventsTab";
import ConcertsTab from "@/components/tabs/ConcertsTab";
import SportsTab from "@/components/tabs/SportsTab";
import MoviesTab from "@/components/tabs/MoviesTab";
import MyBookingsTab from "@/components/tabs/MyBookingsTab";
import ProfileDashboard from "@/components/ProfileDashboard";

const UserPortal = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (!session) {
      navigate("/user-login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userSession");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">EventHub</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="concerts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="family" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Family</span>
            </TabsTrigger>
            <TabsTrigger value="concerts" className="gap-2">
              <Music className="w-4 h-4" />
              <span className="hidden sm:inline">Concerts</span>
            </TabsTrigger>
            <TabsTrigger value="sports" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Sports</span>
            </TabsTrigger>
            <TabsTrigger value="movies" className="gap-2">
              <Film className="w-4 h-4" />
              <span className="hidden sm:inline">Movies</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2">
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">My Bookings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileDashboard userType="user" />
          </TabsContent>

          <TabsContent value="family">
            <FamilyEventsTab />
          </TabsContent>

          <TabsContent value="concerts">
            <ConcertsTab />
          </TabsContent>

          <TabsContent value="sports">
            <SportsTab />
          </TabsContent>

          <TabsContent value="movies">
            <MoviesTab />
          </TabsContent>

          <TabsContent value="bookings">
            <MyBookingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserPortal;
