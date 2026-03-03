import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useGameStore } from "@/stores/gameStore";
import { useAppStore } from "@/stores/appStore";
import { db } from "@/lib/db";
import { createEmptyGame } from "@/types";

interface AddGameOverlayProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AddGameOverlay({ open: isOpen, onOpenChange }: AddGameOverlayProps) {
	const { t } = useTranslation();
	const { fetchGames, autoIGDB } = useGameStore();
	const { changeBlockUI } = useAppStore();

	const [name, setName] = useState("");
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState("");

	const addGame = async () => {
		if (!name.trim()) return;
		setLoading(true);

		const game = createEmptyGame();
		game.name = name.trim();
		game.sort_name = name.trim().toLowerCase();

		setStatus(t("insertingTheGameIntoTheDatabase"));
		const id = await db.postGame(game);

		setStatus(t("fetchingTheInfoFromIgdb"));
		const igdbResult = await autoIGDB(name.trim());

		if (typeof igdbResult === "string") {
			setStatus(`${t("error")}: ${igdbResult}`);
			toast.error(igdbResult);
		} else if (igdbResult) {
			igdbResult.id = id;
			setStatus(`${t("found")}: ${igdbResult.name} — ${t("ModifyingTheDatabase")}`);
			await db.postGame(igdbResult);
			setStatus(t("gameMetadataUpdated"));
			await db.saveMediaToExternalStorage(igdbResult);
			setStatus(t("doneWaitForFinish"));
		}

		await fetchGames();
		setLoading(false);
		setName("");
		setStatus("");
		onOpenChange(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>{t("addAGame")}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 pt-2">
					<div>
						<Label htmlFor="game-name">{t("name")}</Label>
						<Input
							id="game-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && addGame()}
							placeholder={t("name")}
							className="mt-1"
							disabled={loading}
						/>
					</div>
					<Button onClick={addGame} disabled={loading || !name.trim()}>
						{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
						{t("add")}
					</Button>

					{loading && (
						<div className="space-y-2 rounded-lg border border-border bg-card/50 p-4">
							<p className="text-sm text-muted-foreground">{t("adding_game_pls_wait")}</p>
							<Progress value={undefined} className="h-1.5" />
							<p className="text-xs text-muted-foreground">{status}</p>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
