import { useState } from "react";
import { Badge } from "@/components/ui/badge";

interface StandardSeatsProps {
  onSelectSeats: (seats: string[]) => void;
}

const StandardSeats = ({ onSelectSeats }: StandardSeatsProps) => {
  const categories = [
    { id: "silver", name: "Silver", rows: ["A", "B", "C"], color: "bg-muted" },
    { id: "gold", name: "Gold", rows: ["D", "E", "F"], color: "bg-warning/30" },
    { id: "platinum", name: "Platinum", rows: ["G", "H", "I"], color: "bg-primary/20" },
  ];
  
  const seatsPerRow = 10;
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bookedSeats] = useState<string[]>(["A3", "D5", "F8", "H2"]);

  const toggleSeat = (seatId: string) => {
    if (bookedSeats.includes(seatId)) return;

    let updatedSeats;
    if (selectedSeats.includes(seatId)) {
      updatedSeats = selectedSeats.filter((s) => s !== seatId);
    } else {
      updatedSeats = [...selectedSeats, seatId];
    }
    setSelectedSeats(updatedSeats);
    onSelectSeats(updatedSeats);
  };

  const getSeatClass = (seatId: string) => {
    if (bookedSeats.includes(seatId)) {
      return "bg-seat-booked cursor-not-allowed";
    }
    if (selectedSeats.includes(seatId)) {
      return "bg-seat-selected cursor-pointer hover:opacity-80";
    }
    return "bg-seat-available cursor-pointer hover:opacity-80";
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-full h-2 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full mb-2" />
        <p className="text-sm text-muted-foreground">SCREEN / STAGE</p>
      </div>

      {categories.map((category) => (
        <div key={category.id} className={`p-4 rounded-lg ${category.color}`}>
          <div className="flex items-center justify-between mb-3">
            <Badge variant="outline">{category.name}</Badge>
          </div>
          <div className="flex flex-col items-center gap-2">
            {category.rows.map((row) => (
              <div key={row} className="flex items-center gap-2">
                <span className="w-8 text-center font-semibold text-sm">{row}</span>
                <div className="flex gap-2">
                  {Array.from({ length: seatsPerRow }, (_, i) => {
                    const seatNumber = i + 1;
                    const seatId = `${row}${seatNumber}`;
                    return (
                      <button
                        key={seatId}
                        onClick={() => toggleSeat(seatId)}
                        className={`w-8 h-8 rounded-t-lg transition-all ${getSeatClass(seatId)}`}
                        disabled={bookedSeats.includes(seatId)}
                        title={seatId}
                      />
                    );
                  })}
                </div>
                <span className="w-8 text-center font-semibold text-sm">{row}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StandardSeats;
