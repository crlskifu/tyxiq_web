import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRandomColor() {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70 + Math.floor(Math.random() * 30);
  const lightness = 50 + Math.floor(Math.random() * 20);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function generateAccentColors() {
  return [
    getRandomColor(),
    getRandomColor(),
    getRandomColor()
  ];
}
