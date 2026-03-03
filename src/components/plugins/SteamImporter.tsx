import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useGameStore } from "@/stores/gameStore";

export function SteamImporter() {
	const { t } = useTranslation();
	const { fetchGames } = useGameStore();
	const [steamId, setSteamId] = useState("");
	const [loading, setLoading] = useState(false);

	const handleImport = async () => {
		if (!steamId.trim()) return;
		setLoading(true);
		try {
			await invoke("import_library", {
				pluginName: "steam_importer",
				creds: [steamId.trim()],
			});
			await fetchGames();
			toast.success(t("import") + " Steam OK");
		} catch (e: any) {
			toast.error(String(e));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
			<h2 className="mb-1 flex items-center gap-2 text-xl font-semibold">
				Steam {t("importer") || "Library Importer"}
			</h2>
			<p className="mb-4 text-sm text-muted-foreground">{t("steamLibraryImporter")}</p>
			<div className="max-w-sm space-y-3">
				<div>
					<Label htmlFor="steam-id">Steam ID (Public)</Label>
					<Input
						id="steam-id"
						value={steamId}
						onChange={(e) => setSteamId(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleImport()}
						placeholder="76561198..."
						className="mt-1"
						disabled={loading}
					/>
				</div>
				<Button onClick={handleImport} disabled={loading || !steamId.trim()}>
					{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
					{t("import") || "Import"}
				</Button>
			</div>
		</div>
	);
}
