import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeToIST(time?: string | null) {
  if (!time) return "";

  const raw = time.trim();
  if (!raw) return "";

  const hasIST = /IST$/i.test(raw);

  const ampmMatch = raw.match(/^([0-9]{1,2})(?::([0-9]{2}))?\s*(AM|PM)$/i);
  if (ampmMatch) {
    const hours = parseInt(ampmMatch[1], 10) % 12 || 12;
    const minutes = ampmMatch[2] ?? "00";
    const suffix = ampmMatch[3].toUpperCase();
    const formatted = `${hours.toString().padStart(2, "0")}:${minutes.padStart(2, "0")} ${suffix}`;
    return hasIST ? formatted.replace(/IST$/i, "IST").trim() : `${formatted} IST`;
  }

  const twentyFourMatch = raw.match(/^([0-9]{1,2})(?::([0-9]{2}))?$/);
  if (twentyFourMatch) {
    let hours = parseInt(twentyFourMatch[1], 10);
    const minutes = twentyFourMatch[2] ?? "00";
    const suffix = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const formatted = `${hours.toString().padStart(2, "0")}:${minutes.padStart(2, "0")} ${suffix}`;
    return `${formatted} IST`;
  }

  return hasIST ? raw.replace(/IST$/i, "IST") : `${raw} IST`;
}
