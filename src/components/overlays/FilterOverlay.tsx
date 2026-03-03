import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useSettingsStore } from "@/stores/settingsStore";

interface FilterOverlayProps {
	onClose?: () => void;
}

export function FilterOverlay({ onClose }: FilterOverlayProps) {
	const { t } = useTranslation();
	const { settings, updateSettings, applySettings } = useSettingsStore();

	const view = settings.view || "card";
	const zoom = parseInt(settings.zoom || "10");
	const gap = parseInt(settings.gap || "10");
	const displayInfo = settings.displayInfo || "";

	const setView = (v: "list" | "card") => {
		applySettings({ ...settings, view: v });
	};

	const setZoom = (v: number[]) => {
		updateSettings({ ...settings, zoom: v[0].toString() });
	};
	const applyZoom = (v: number[]) => {
		applySettings({ ...settings, zoom: v[0].toString() });
	};

	const setGap = (v: number[]) => {
		updateSettings({ ...settings, gap: v[0].toString() });
	};
	const applyGap = (v: number[]) => {
		applySettings({ ...settings, gap: v[0].toString() });
	};

	const setDisplayInfo = (value: string) => {
		applySettings({ ...settings, displayInfo: value });
	};

	const clearDisplayInfo = () => {
		applySettings({ ...settings, displayInfo: "" });
	};

	const displayOptions = ["name", "platforms", "tags", "rating"];

	return (
		<div className="space-y-4 p-1">
			{/* View toggle */}
			<div className="flex gap-1 rounded-lg border border-border p-0.5">
				<button
					onClick={() => setView("card")}
					className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
						view === "card" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
					}`}
				>
					{t("view.grid")}
				</button>
				<button
					onClick={() => setView("list")}
					className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
						view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-accent"
					}`}
				>
					{t("view.list")}
				</button>
			</div>

			{/* Zoom */}
			<div>
				<Label className="text-xs">{t("zoom")}</Label>
				<Slider
					value={[zoom]}
					min={5}
					max={50}
					step={2}
					onValueChange={setZoom}
					onValueCommit={applyZoom}
					className="mt-2"
				/>
			</div>

			{/* Gap */}
			<div>
				<Label className="text-xs">{t("gap")}</Label>
				<Slider
					value={[gap]}
					min={0}
					max={50}
					step={2}
					onValueChange={setGap}
					onValueCommit={applyGap}
					className="mt-2"
				/>
			</div>

			{/* Display info */}
			<div className="space-y-2">
				<Label className="text-xs">Display Info</Label>
				<div className="flex flex-wrap gap-2">
					{displayOptions.map((opt) => (
						<button
							key={opt}
							onClick={() => setDisplayInfo(opt)}
							className={`rounded-md border px-2 py-1 text-xs transition-colors ${
								displayInfo === opt
									? "border-primary bg-primary/10 text-primary"
									: "border-border hover:bg-accent"
							}`}
						>
							{t(opt)}
						</button>
					))}
				</div>
				<Button variant="ghost" size="sm" onClick={clearDisplayInfo} className="text-xs">
					{t("reset")}
				</Button>
			</div>
		</div>
	);
}
