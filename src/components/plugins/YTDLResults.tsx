import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, PlayCircle, X } from "lucide-react";

interface YTDLResultsProps {
	results: any[];
	onSelect: (item: any) => void;
}

export function YTDLResults({ results, onSelect }: YTDLResultsProps) {
	const [preview, setPreview] = useState<any>(null);

	if (!results || results.length === 0) return null;

	return (
		<div className="space-y-3">
			{/* Preview panel */}
			{preview && (
				<div className="relative rounded-xl border border-primary/40 bg-muted/30 p-4">
					<button
						type="button"
						className="absolute right-2 top-2 rounded-full p-1 hover:bg-accent"
						onClick={() => setPreview(null)}
					>
						<X className="h-4 w-4" />
					</button>
					{preview.url && (
						<iframe
							src={preview.url.replace("watch?v=", "embed/")}
							className="mb-3 w-full rounded-lg"
							style={{ aspectRatio: "16/9" }}
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowFullScreen
						/>
					)}
					<div className="flex items-center justify-between gap-3">
						<div className="min-w-0">
							<p className="truncate font-semibold leading-snug">{preview.title || preview.name}</p>
							{preview.uploader && <p className="truncate text-xs text-muted-foreground">{preview.uploader}</p>}
							{preview.duration && <p className="text-xs text-muted-foreground">Duration: {preview.duration}</p>}
						</div>
						<Button size="sm" className="shrink-0" onClick={() => { onSelect(preview); setPreview(null); }}>
							<Download className="mr-1 h-4 w-4" /> Use this track
						</Button>
					</div>
				</div>
			)}

			{/* Results list */}
			<div className="max-h-96 overflow-y-auto rounded-lg border border-border">
				<div className="space-y-1 p-2">
					{results.map((item: any, i: number) => (
						<div
							key={i}
							className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-accent ${
								preview === item ? "bg-primary/10 ring-1 ring-primary" : ""
							}`}
						>
							{item.thumbnail && (
								<img src={item.thumbnail} alt="" className="h-12 w-20 shrink-0 rounded object-cover" />
							)}
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{item.title || item.name}</p>
								{item.uploader && <p className="truncate text-xs text-muted-foreground">{item.uploader}</p>}
								{item.duration && <p className="text-xs text-muted-foreground">{item.duration}</p>}
							</div>
							<div className="flex shrink-0 gap-2">
								<Button
									size="sm"
									variant="secondary"
									onClick={() => setPreview(item)}
								>
									<PlayCircle className="mr-1 h-3 w-3" /> Preview
								</Button>
								<Button
									size="sm"
									onClick={() => onSelect(item)}
								>
									<Download className="mr-1 h-3 w-3" /> Use
								</Button>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
