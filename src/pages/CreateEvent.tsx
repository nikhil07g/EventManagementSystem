import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import PaymentModal from "@/components/PaymentModal";
import theatres from "@/data/theatres";
import { api, ApiError, type CreateEventPayload, type EventType } from "@/lib/api";
import { readSession, SESSION_KEYS } from "@/lib/session";

const CreateEvent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    // `theatres` selection is stored in `selectedTheatres` state (multi-select)
    image: "",
    ticketPrice: "",
    venueType: "",
    sportType: "",
    familyCategory: "",
    brideName: "",
    groomName: "",
    birthdayName: "",
    birthdayYear: "",
  });

  const [selectedShowtimes, setSelectedShowtimes] = useState<string[]>([]);
  const [selectedTheatres, setSelectedTheatres] = useState<string[]>([]);
  const customTimeRef = useRef<HTMLInputElement | null>(null);

  const [promoteEvent, setPromoteEvent] = useState(false);
  const [adImage, setAdImage] = useState("");
  const [adDuration, setAdDuration] = useState("1");
  const [familyImageName, setFamilyImageName] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFamilyImageUpload = (file: File | null) => {
    if (!file) {
      setFormData((prev) => ({ ...prev, image: "" }));
      setFamilyImageName("");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = typeof reader.result === "string" ? reader.result : "";
      setFormData((prev) => ({ ...prev, image: base64 }));
    };
    reader.readAsDataURL(file);
    setFamilyImageName(file.name);
  };

  useEffect(() => {
    if (formData.type === "Family") {
      setPromoteEvent(false);
      setAdImage("");
      setAdDuration("1");
      return;
    }

    setFamilyImageName("");
    setFormData((prev) => ({
      ...prev,
      familyCategory: "",
      brideName: "",
      groomName: "",
      birthdayName: "",
      birthdayYear: "",
    }));
  }, [formData.type]);

  useEffect(() => {
    if (formData.familyCategory === "Marriage") {
      setFormData((prev) => ({
        ...prev,
        birthdayName: "",
        birthdayYear: "",
      }));
    } else if (formData.familyCategory === "Birthday") {
      setFormData((prev) => ({
        ...prev,
        brideName: "",
        groomName: "",
      }));
    }
  }, [formData.familyCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Require theatre selection for Movie events
    if (formData.type === "Movie") {
      if (selectedTheatres.length === 0) {
        toast({ title: "Please select at least one theatre", description: "Choose theatres where the movie will play." });
        return;
      }
      if (selectedShowtimes.length === 0) {
        toast({ title: "Please select at least one showtime", description: "Choose showtimes for the movie." });
        return;
      }
    }

    if (formData.type === "Family") {
      if (!formData.familyCategory) {
        toast({ title: "Select family function type", description: "Choose Marriage or Birthday for your family event." });
        return;
      }

      if (formData.familyCategory === "Marriage" && (!formData.brideName.trim() || !formData.groomName.trim())) {
        toast({ title: "Add couple names", description: "Please enter both the bride and bridegroom names." });
        return;
      }

      if (formData.familyCategory === "Birthday" && (!formData.birthdayName.trim() || !formData.birthdayYear.trim())) {
        toast({ title: "Complete birthday details", description: "Add the birthday person and the year being celebrated." });
        return;
      }

      if (!formData.image) {
        toast({ title: "Upload an image", description: "Please upload an image for your family event." });
        return;
      }
    }

    if (promoteEvent) {
      const cost = parseInt(adDuration) * 1000;
      setPaymentAmount(cost);
      setShowPaymentModal(true);
    } else {
      createEvent();
    }
  };

  const handlePaymentSuccess = (paymentMethod: string) => {
    setShowPaymentModal(false);
    createEvent(true, paymentMethod);
  };

  const resolveCategory = (type: string): string => {
    if (type === "Family") {
      return formData.familyCategory || "Family";
    }
    if (type === "Sports") {
      return formData.sportType || "Sports";
    }
    if (type === "Concert") {
      return formData.venueType || "Concert";
    }
    return type || "General";
  };

  const getOrganizerSession = () => {
    return readSession(SESSION_KEYS.organizer) || readSession(SESSION_KEYS.admin);
  };

  const createEvent = async (withAd = false, paymentMethod?: string) => {
    const session = getOrganizerSession();

    if (!session) {
      toast({
        title: "Sign In Required",
        description: "Log in as an organizer or admin to create events.",
        variant: "destructive",
      });
      return;
    }

    const { familyCategory, brideName, groomName, birthdayName, birthdayYear, ...baseForm } = formData;

    let computedName = baseForm.name.trim();
    if (formData.type === "Family") {
      if (familyCategory === "Marriage") {
        const couple = [brideName.trim(), groomName.trim()].filter(Boolean).join(" & ");
        computedName = couple ? `${couple} Wedding` : "Family Wedding";
      } else if (familyCategory === "Birthday") {
        const celebrant = birthdayName.trim() ? `${birthdayName.trim()}'s Birthday` : "Birthday Celebration";
        computedName = birthdayYear.trim() ? `${celebrant} - ${birthdayYear.trim()}` : celebrant;
      }
    }

    const ticketPriceValue = formData.type === "Family" ? 0 : Number.parseFloat(formData.ticketPrice || "0");
    const ticketPrice = Number.isFinite(ticketPriceValue) ? ticketPriceValue : 0;

    const payload: CreateEventPayload = {
      name: computedName,
      type: formData.type as EventType,
      category: resolveCategory(formData.type),
      date: formData.date,
      time: formData.time,
      venue: formData.venue,
      ticketPrice,
      capacity: 100,
      description: baseForm.description?.trim() ? baseForm.description : undefined,
      image: baseForm.image || undefined,
      status: "active",
    };

    try {
      const createdEvent = await api.events.create(payload, session.token);

      if (withAd && promoteEvent && adImage) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + Number.parseInt(adDuration, 10));

        const advertisement = {
          id: `AD${Date.now()}`,
          eventId: createdEvent.id,
          eventName: createdEvent.name,
          imageUrl: adImage,
          duration: Number.parseInt(adDuration, 10),
          expiryDate: expiryDate.toISOString(),
          cost: paymentAmount,
          paymentMethod,
        };

        const ads = JSON.parse(localStorage.getItem("advertisements") || "[]");
        ads.push(advertisement);
        localStorage.setItem("advertisements", JSON.stringify(ads));

        toast({
          title: "Event Created & Promoted!",
          description: `Event ID ${createdEvent.id} is now featured for ${adDuration} day(s).`,
        });
      } else {
        toast({
          title: formData.type === "Family" ? "Family Event Created!" : "Event Created!",
          description: `${createdEvent.name} is live. Event ID: ${createdEvent.id}.`,
        });
      }

      navigate("/organizer-dashboard");
    } catch (error) {
      console.error("Failed to create event:", error);
      if (error instanceof ApiError) {
        toast({
          title: "Unable to create event",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Network Error",
          description: "Failed to create event. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/organizer-dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <Calendar className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">Create New Event</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-8 bg-gradient-card border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="type">Event Type *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Family">Family</SelectItem>
                  <SelectItem value="Concert">Concert</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Movie">Movie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type !== "Family" ? (
              <div>
                <Label htmlFor="name">Event Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="familyCategory">Family Function *</Label>
                  <Select
                    value={formData.familyCategory}
                    onValueChange={(value) => handleInputChange("familyCategory", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select function type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Marriage">Marriage</SelectItem>
                      <SelectItem value="Birthday">Birthday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.familyCategory === "Marriage" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="brideName">Bride Name *</Label>
                      <Input
                        id="brideName"
                        value={formData.brideName}
                        onChange={(e) => handleInputChange("brideName", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="groomName">Bridegroom Name *</Label>
                      <Input
                        id="groomName"
                        value={formData.groomName}
                        onChange={(e) => handleInputChange("groomName", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                {formData.familyCategory === "Birthday" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="birthdayName">Birthday Boy/Girl Name *</Label>
                      <Input
                        id="birthdayName"
                        value={formData.birthdayName}
                        onChange={(e) => handleInputChange("birthdayName", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="birthdayYear">Celebrating Which Year *</Label>
                      <Input
                        id="birthdayYear"
                        value={formData.birthdayYear}
                        onChange={(e) => handleInputChange("birthdayYear", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {formData.type === "Concert" && (
              <div>
                <Label htmlFor="venueType">Venue Type *</Label>
                <Select value={formData.venueType} onValueChange={(value) => handleInputChange("venueType", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select venue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Auditorium">Auditorium</SelectItem>
                    <SelectItem value="Open Ground">Open Ground</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.type === "Movie" && (
              <div>
                <Label className="mb-2">Select Theatres *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 max-h-64 overflow-auto p-2 border rounded bg-card/50">
                  {theatres.map((t) => {
                    const checked = selectedTheatres.includes(t.name);
                    return (
                      <label key={t.name} className="flex items-center gap-2 p-2 rounded hover:bg-muted/10">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(val) => {
                            if (val) setSelectedTheatres((prev) => [...prev, t.name]);
                            else setSelectedTheatres((prev) => prev.filter((x) => x !== t.name));
                          }}
                        />
                        <div>
                          <div className="text-sm font-medium">{t.name}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {formData.type === "Movie" && selectedTheatres.length > 0 && (
              <div>
                <Label className="mb-2">Choose Showtimes *</Label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {(() => {
                    // Collect showtimes from all selected theatres, fall back to defaults
                    const defaults = ["11:00am", "8:00am", "2:00pm", "6:00pm", "9:00pm"];
                    const merged = selectedTheatres
                      .flatMap((name) => theatres.find((x) => x.name === name)?.showtimes || [])
                      .concat(defaults);
                    const options = Array.from(new Set(merged));
                    return options.map((s) => {
                      const checked = selectedShowtimes.includes(s);
                      return (
                        <label key={s} className="flex items-center gap-2 p-2 bg-muted/10 rounded">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(val) => {
                              if (val) setSelectedShowtimes((prev) => [...prev, s]);
                              else setSelectedShowtimes((prev) => prev.filter((x) => x !== s));
                            }}
                          />
                          <span className="text-sm">{s}</span>
                        </label>
                      );
                    });
                  })()}
                </div>

                <div className="flex gap-2">
                  <input
                    ref={customTimeRef}
                    type="text"
                    placeholder="e.g. 4:30pm"
                    className="input px-3 py-2 w-full rounded border bg-card"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const val = customTimeRef.current?.value?.trim();
                      if (val) {
                        setSelectedShowtimes((prev) => (prev.includes(val) ? prev : [...prev, val]));
                        if (customTimeRef.current) customTimeRef.current.value = "";
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                {selectedShowtimes.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">Selected: {selectedShowtimes.join(", ")}</p>
                )}
              </div>
            )}

            {formData.type === "Sports" && (
              <div>
                <Label htmlFor="sportType">Sport Type *</Label>
                <Select value={formData.sportType} onValueChange={(value) => handleInputChange("sportType", value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sport type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cricket">Cricket</SelectItem>
                    <SelectItem value="Football">Football</SelectItem>
                    <SelectItem value="Tennis">Tennis</SelectItem>
                    <SelectItem value="Basketball">Basketball</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange("time", e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="venue">Venue / Address *</Label>
              <Input
                id="venue"
                value={formData.venue}
                onChange={(e) => handleInputChange("venue", e.target.value)}
                required
              />
            </div>

            {formData.type === "Family" ? (
              <div>
                <Label htmlFor="familyImage">Upload Event Image *</Label>
                <Input
                  id="familyImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFamilyImageUpload(e.target.files?.[0] || null)}
                  required
                />
                {familyImageName && (
                  <p className="text-sm text-muted-foreground mt-2">Selected: {familyImageName}</p>
                )}
              </div>
            ) : (
              <div>
                <Label htmlFor="image">Event Image URL</Label>
                <Input
                  id="image"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image}
                  onChange={(e) => handleInputChange("image", e.target.value)}
                />
              </div>
            )}

            {formData.type !== "Family" && (
              <div>
                <Label htmlFor="ticketPrice">Ticket Price (₹) *</Label>
                <Input
                  id="ticketPrice"
                  type="number"
                  min="0"
                  placeholder="Enter 0 for free events"
                  value={formData.ticketPrice}
                  onChange={(e) => handleInputChange("ticketPrice", e.target.value)}
                  required
                />
              </div>
            )}

            {formData.type !== "Family" && (
              <Card className="p-6 bg-muted/50 border-secondary">
                <div className="flex items-start gap-3 mb-4">
                  <Checkbox
                    id="promote"
                    checked={promoteEvent}
                    onCheckedChange={(checked) => setPromoteEvent(checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="promote" className="text-lg font-semibold cursor-pointer">
                      Promote My Event on Homepage
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Feature your event on the homepage banner for maximum visibility (₹1000/day)
                    </p>
                  </div>
                </div>

                {promoteEvent && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="adImage">Advertisement Image URL *</Label>
                      <Input
                        id="adImage"
                        type="url"
                        placeholder="https://example.com/ad-banner.jpg"
                        value={adImage}
                        onChange={(e) => setAdImage(e.target.value)}
                        required={promoteEvent}
                      />
                    </div>
                    <div>
                      <Label htmlFor="adDuration">Duration (Days) *</Label>
                      <Input
                        id="adDuration"
                        type="number"
                        min="1"
                        max="30"
                        value={adDuration}
                        onChange={(e) => setAdDuration(e.target.value)}
                        required={promoteEvent}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Total Cost: ₹{parseInt(adDuration || "0") * 1000}
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            )}

            <Button type="submit" className="w-full" size="lg">
              {promoteEvent ? `Create & Promote Event (₹${parseInt(adDuration || "0") * 1000})` : "Create Event"}
            </Button>
          </form>
        </Card>
      </div>

      {showPaymentModal && (
        <PaymentModal
          amount={paymentAmount}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
          eventName={formData.name}
        />
      )}
    </div>
  );
};

export default CreateEvent;
