import { cn } from "@/lib/utils";
import { Clock, Trophy, Calendar, Tag } from "lucide-react";

interface InfoCardProps {
	title: string;
	description: string;
	icon: "clock" | "trophy" | "calendar" | "tag";
	color: "green" | "orange" | "red" | "blue";
}

const colorMap = {
	green: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20",
	orange: "from-amber-500/20 to-amber-500/5 border-amber-500/20",
	red: "from-red-500/20 to-red-500/5 border-red-500/20",
	blue: "from-blue-500/20 to-blue-500/5 border-blue-500/20",
};

const iconColorMap = {
	green: "text-emerald-400",
	orange: "text-amber-400",
	red: "text-red-400",
	blue: "text-blue-400",
};

const iconMap = {
	clock: Clock,
	trophy: Trophy,
	calendar: Calendar,
	tag: Tag,
};

export function InfoCard({ title, description, icon, color }: InfoCardProps) {
	const Icon = iconMap[icon];

	return (
		<div className={cn("flex items-center gap-3 rounded-xl border bg-gradient-to-br p-4", colorMap[color])}>
			<div className={cn("rounded-lg bg-background/50 p-2", iconColorMap[color])}>
				<Icon className="h-5 w-5" />
			</div>
			<div>
				<p className="text-xs text-muted-foreground">{title}</p>
				<p className="text-sm font-semibold">{description}</p>
			</div>
		</div>
	);
}
