import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import type { IGame } from "@/types";

interface ListViewProps {
	games: IGame[];
}

const BATCH_SIZE = 60;

export function ListView({ games }: ListViewProps) {
	const navigate = useNavigate();
	const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
	const sentinelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setVisibleCount(BATCH_SIZE);
	}, [games]);

	const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
		if (entries[0]?.isIntersecting) {
			setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, games.length));
		}
	}, [games.length]);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;
		const observer = new IntersectionObserver(observerCallback, { rootMargin: "200px" });
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [observerCallback]);

	const visibleGames = useMemo(() => games.slice(0, visibleCount), [games, visibleCount]);

	return (
		<div className="p-4">
			<table className="w-full">
				<thead>
					<tr className="border-b border-border text-left text-xs font-medium uppercase text-muted-foreground">
						<th className="w-12 py-3"></th>
						<th className="py-3 pl-3">Name</th>
						<th className="py-3">Platform</th>
						<th className="py-3">Genres</th>
						<th className="py-3">Rating</th>
						<th className="py-3">Status</th>
					</tr>
				</thead>
				<tbody>
					{visibleGames.map((game) => (
						<tr
							key={game.id}
							onClick={() => navigate(`/game/${game.id}`)}
							className="cursor-pointer border-b border-border/30 transition-colors hover:bg-accent/30"
						>
							<td className="py-2">
								<img
									src={game.icon || game.jaquette || "/assets/logo.gif"}
									alt=""
									className="h-8 w-8 rounded object-cover"
								/>
							</td>
							<td className="py-2 pl-3 text-sm font-medium">{game.name}</td>
							<td className="py-2 text-xs text-muted-foreground">{game.platforms}</td>
							<td className="py-2 text-xs text-muted-foreground">{game.genres}</td>
							<td className="py-2">
								<div className="flex items-center gap-0.5">
									{[1, 2, 3, 4, 5].map((star) => (
										<svg
											key={star}
											className={`h-3 w-3 ${parseInt(game.rating || "0") >= star ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
											viewBox="0 0 24 24"
										>
											<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
										</svg>
									))}
								</div>
							</td>
							<td className="py-2">
								{game.status && (
									<Badge variant="outline" className="text-[10px]">
										{game.status}
									</Badge>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
			{games.length === 0 && (
				<div className="flex h-64 w-full items-center justify-center">
					<p className="text-sm text-muted-foreground">No games found</p>
				</div>
			)}
			{visibleCount < games.length && (
				<div ref={sentinelRef} className="h-1 w-full" />
			)}
		</div>
	);
}
