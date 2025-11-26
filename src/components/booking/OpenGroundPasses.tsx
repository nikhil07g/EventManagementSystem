import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface OpenGroundPassesProps {
  onSelectSeats: (passes: string[]) => void;
}

const OpenGroundPasses = ({ onSelectSeats }: OpenGroundPassesProps) => {
  const [passes, setPasses] = useState({
    regular: 0,
    vip: 0,
    vvip: 0,
  });

  const passTypes = [
    { id: "regular", name: "Regular Pass", price: 500, color: "bg-seat-available" },
    { id: "vip", name: "VIP Pass", price: 1500, color: "bg-seat-selected" },
    { id: "vvip", name: "VVIP Pass", price: 3000, color: "bg-primary" },
  ];

  const updatePass = (type: string, delta: number) => {
    const newPasses = {
      ...passes,
      [type]: Math.max(0, passes[type as keyof typeof passes] + delta),
    };
    setPasses(newPasses);

    const passArray: string[] = [];
    Object.entries(newPasses).forEach(([key, value]) => {
      for (let i = 0; i < value; i++) {
        passArray.push(`${key.toUpperCase()}-${i + 1}`);
      }
    });
    onSelectSeats(passArray);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2">Select Your Passes</h3>
        <p className="text-muted-foreground">Open Ground Concert - Choose your access level</p>
      </div>

      <div className="grid gap-4">
        {passTypes.map((pass) => (
          <Card key={pass.id} className="p-6 bg-gradient-card border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg ${pass.color}`} />
                <div>
                  <h4 className="font-semibold text-lg">{pass.name}</h4>
                  <p className="text-sm text-muted-foreground">₹{pass.price} per pass</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updatePass(pass.id, -1)}
                  disabled={passes[pass.id as keyof typeof passes] === 0}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-xl font-bold w-12 text-center">
                  {passes[pass.id as keyof typeof passes]}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updatePass(pass.id, 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Total Passes:</span>
          <span className="text-lg font-bold">
            {passes.regular + passes.vip + passes.vvip}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OpenGroundPasses;
