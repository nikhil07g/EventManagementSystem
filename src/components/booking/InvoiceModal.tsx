import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import { formatTimeToIST } from "@/lib/utils";

interface Booking {
  id: string;
  eventName: string;
  eventType: string;
  date: string;
  time: string;
  venue: string;
  seats: string[];
  quantity: number;
  totalPrice: number;
  paymentMethod: string;
  bookingDate: string;
}

interface InvoiceModalProps {
  booking: Booking;
  onClose: () => void;
}

const InvoiceModal = ({ booking, onClose }: InvoiceModalProps) => {
  const seatSummary = booking.seats.length
    ? booking.seats.join(", ")
    : `General admission (${booking.quantity})`;

  const qrData = JSON.stringify({
    bookingId: booking.id,
    event: booking.eventName,
    date: booking.date,
    seats: seatSummary,
  });

  const handleDownload = () => {
    const invoiceElement = document.getElementById("invoice-content");
    if (!invoiceElement) return;

    // Simple download simulation
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${booking.id}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .details { margin: 20px 0; }
              .row { display: flex; justify-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .qr-code { text-align: center; margin: 30px 0; }
            </style>
          </head>
          <body>
            ${invoiceElement.innerHTML}
            <script>
              window.onload = () => {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-card max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Booking Invoice</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div id="invoice-content" className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">EventHub</h1>
            <p className="text-muted-foreground">Booking Confirmation</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-background rounded-lg">
              <QRCodeSVG value={qrData} size={200} />
            </div>
          </div>

          {/* Booking Details */}
          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
              <div>
                <p className="text-sm text-muted-foreground">Booking ID</p>
                <p className="font-mono font-semibold">{booking.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Booking Date</p>
                <p className="font-semibold">
                  {new Date(booking.bookingDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="pb-4 border-b border-border">
              <p className="text-sm text-muted-foreground mb-1">Event Name</p>
              <p className="text-xl font-bold">{booking.eventName}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
              <div>
                <p className="text-sm text-muted-foreground">Event Type</p>
                <p className="font-semibold">{booking.eventType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-semibold">{booking.paymentMethod.toUpperCase()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-border">
              <div>
                <p className="text-sm text-muted-foreground">Event Date</p>
                <p className="font-semibold">
                  {new Date(booking.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Event Time</p>
                <p className="font-semibold">{formatTimeToIST(booking.time)}</p>
              </div>
            </div>

            <div className="pb-4 border-b border-border">
              <p className="text-sm text-muted-foreground mb-1">Venue</p>
              <p className="font-semibold">{booking.venue}</p>
            </div>

            <div className="pb-4 border-b border-border">
              <p className="text-sm text-muted-foreground mb-1">
                Seats / Passes ({booking.quantity})
              </p>
              <p className="font-semibold">{seatSummary}</p>
            </div>

            <div className="pt-4">
              <div className="flex justify-between items-center text-2xl font-bold">
                <span>Total Amount:</span>
                <span className="text-primary">
                  {booking.totalPrice === 0 ? "FREE" : `₹${booking.totalPrice}`}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pt-8 border-t border-border">
            <p>Thank you for booking with EventHub!</p>
            <p className="mt-2">
              Please present this QR code at the venue entrance for verification.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default InvoiceModal;
