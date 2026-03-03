import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function toParsedTime(time: string | number): string {
	const total = typeof time === "string" ? parseInt(time, 10) : time;
	if (isNaN(total) || total <= 0) return "0m";
	const days = Math.floor(total / 1440);
	const hours = Math.floor((total % 1440) / 60);
	const minutes = total % 60;
	let result = "";
	if (days > 0) result += `${days}d `;
	if (hours > 0) result += `${hours}h `;
	if (minutes > 0) result += `${minutes}m`;
	return result.trim() || "0m";
}
