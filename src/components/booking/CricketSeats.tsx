import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CricketSeatsProps {
  onSelectSeats: (seats: string[]) => void;
}

const CricketSeats = ({ onSelectSeats }: CricketSeatsProps) => {
  const [selectedStand, setSelectedStand] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  const stands = [
    { id: "north", name: "North Stand", price: 1000, color: "bg-seat-available" },
    { id: "east", name: "East Stand", price: 1200, color: "bg-seat-selected" },
    { id: "south", name: "South Stand", price: 800, color: "bg-warning" },
    { id: "west", name: "West Stand", price: 1500, color: "bg-primary" },
  ];

  const blocks = ["A", "B", "C", "D", "E", "F"];
  const floors = [
    { label: "Ground", key: "ground" },
    { label: "1st Floor", key: "floor1" },
    { label: "2nd Floor", key: "floor2" },
  ];

  const handleStandSelect = (standId: string) => {
    setSelectedStand(standId);
  };

  const handleSeatSelect = (seatId: string) => {
    let updatedSeats;
    if (selectedSeats.includes(seatId)) {
      updatedSeats = selectedSeats.filter((s) => s !== seatId);
    } else {
      updatedSeats = [...selectedSeats, seatId];
    }
    setSelectedSeats(updatedSeats);
    onSelectSeats(updatedSeats);
  };

  return (
    <div className="space-y-6">
      {/* Stadium View */}
      <div className="relative aspect-square max-w-md mx-auto">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-success/20 flex items-center justify-center">
            <p className="text-sm font-semibold text-center">CRICKET<br />FIELD</p>
          </div>
        </div>
        {stands.map((stand, index) => {
          const angle = (index * 90 - 45) * (Math.PI / 180);
          const distance = 200;
          const x = Math.cos(angle) * distance;
          const y = Math.sin(angle) * distance;
          
          return (
            <button
              key={stand.id}
              onClick={() => handleStandSelect(stand.id)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 p-4 rounded-lg transition-all ${
                selectedStand === stand.id
                  ? `${stand.color} scale-110`
                  : "bg-muted hover:scale-105"
              }`}
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
              }}
            >
              <p className="font-semibold text-sm whitespace-nowrap">{stand.name}</p>
              <p className="text-xs">₹{stand.price}</p>
            </button>
          );
        })}
      </div>

      {/* Seat Selection */}
      {selectedStand && (
        <Card className="p-6 bg-gradient-card border-border animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">
              {stands.find((s) => s.id === selectedStand)?.name}
            </h3>
            <Badge variant="outline">
              ₹{stands.find((s) => s.id === selectedStand)?.price}
            </Badge>
          </div>

          <div className="space-y-4">
            {floors.map((floor) => (
              <div key={floor.key}>
                <p className="font-semibold mb-2 text-sm text-muted-foreground">{floor.label}</p>
                <div className="flex gap-2 flex-wrap">
                  {blocks.map((block) => 
                    Array.from({ length: 5 }, (_, i) => {
                      const seatId = `${selectedStand.toUpperCase()}-${floor.key.toUpperCase()}-${block}${i + 1}`;
                      return (
                        <button
                          key={seatId}
                          onClick={() => handleSeatSelect(seatId)}
                          className={`w-10 h-10 rounded transition-all ${
                            selectedSeats.includes(seatId)
                              ? "bg-seat-selected"
                              : "bg-seat-available hover:opacity-80"
                          }`}
                          title={seatId}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default CricketSeats;
