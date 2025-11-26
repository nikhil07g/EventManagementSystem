import { useState } from "react";

interface AuditoriumSeatsProps {
  onSelectSeats: (seats: string[]) => void;
}

const AuditoriumSeats = ({ onSelectSeats }: AuditoriumSeatsProps) => {
  const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const seatsPerRow = 12;
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bookedSeats] = useState<string[]>(["A5", "A6", "C7", "E9", "F4"]);

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
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-full h-2 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full mb-2" />
        <p className="text-sm text-muted-foreground">SCREEN</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        {rows.map((row) => (
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
  );
};

export default AuditoriumSeats;
