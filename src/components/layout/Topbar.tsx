import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { open } from "@tauri-apps/plugin-dialog";
import { dirname } from "@tauri-apps/api/path";
import {
	ChevronLeft, ChevronRight, Bookmark, Star, Filter, Search,
	PlusCircle, ArrowUpDown, MoreVertical, Play, Square, Link,
	Pencil, Trophy, Minus, Maximize2, X, Plus,
	Download, Cloud, CloudUpload, CloudDownload, RefreshCw, Trash2, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useGameStore } from "@/stores/gameStore";
import { useCategoryStore } from "@/stores/categoryStore";
import { useAppStore } from "@/stores/appStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTauriEventStore } from "@/stores/tauriEvents";
import { db } from "@/lib/db";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AddGameOverlay } from "@/components/overlays/AddGameOverlay";
import { FilterOverlay } from "@/components/overlays/FilterOverlay";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useEpicStore } from "@/stores/epicStore";
import { useGogStore } from "@/stores/gogStore";
import { toast } from "sonner";
import type { IGameLaunchedMessage } from "@/types";

const appWindow = getCurrentWebviewWindow();

export function Topbar() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();

	const onGamePage = location.pathname.startsWith("/game/") && !location.pathname.startsWith("/games");
	const gameID = onGamePage ? location.pathname.split("/")[2] : "";

	const [searchQuery, setSearchQuery] = useState("");
	const [searchOpen, setSearchOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [gameOverlayOpen, setGameOverlayOpen] = useState(false);
	const [filterOverlayOpen, setFilterOverlayOpen] = useState(false);
	const [selectedSort, setSelectedSort] = useState<string>("");

	const searchRef = useRef<HTMLInputElement>(null);

	const { games, currentGame, getGame, setGame, searchGame, sortGames, filterGames, getAllFilters, launchGame, killGame } = useGameStore();
	const { categories, getCategoriesForGame, addGameToCategory, removeGameFromCategory, createCategory, getCategoryIdByName } = useCategoryStore();
	const { toggleAchievementsVisible } = useAppStore();
	const { gameLaunchMessage } = useTauriEventStore();
	const {
		installedGames, downloadableGames, downloadingGame, downloadProgress,
		fetchInstalledGames, fetchDownloadableGames,
		downloadGame, updateGame, uninstallGame,
		checkCloudSaves, uploadSaves, downloadSaves, syncAchievements,
	} = useEpicStore();

	const {
		installedGames: gogInstalledGames,
		downloadableGames: gogDownloadableGames,
		downloadingGame: gogDownloadingGame,
		downloadProgress: gogDownloadProgress,
		fetchInstalledGames: fetchGogInstalledGames,
		downloadGame: gogDownloadGame,
		uninstallGame: gogUninstallGame,
		checkCloudSaves: gogCheckCloudSaves,
		uploadSaves: gogUploadSaves,
		downloadSaves: gogDownloadSaves,
	} = useGogStore();

	const [playLabel, setPlayLabel] = useState(t("link"));
	const [gamePID, setGamePID] = useState(0);
	const [installDialogOpen, setInstallDialogOpen] = useState(false);
	const [installPath, setInstallPath] = useState("C:\\Games");
	const [cloudDialogOpen, setCloudDialogOpen] = useState(false);
	const [cloudInfo, setCloudInfo] = useState<any>(null);
	const [cloudLoading, setCloudLoading] = useState(false);

	const game = onGamePage ? getGame(gameID) : undefined;

	const isEpic = game?.importer_id === "epic";
	// exec_args is "epic:{app_name}:{namespace}:{catalog_item_id}" for Epic games
	const epicAppName = isEpic && game?.exec_args ? (game.exec_args.split(":")[1] ?? "") : "";
	const epicNamespace = isEpic && game?.exec_args ? (game.exec_args.split(":")[2] ?? "") : "";
	const epicInstalled = isEpic ? installedGames.find((g) => g.app_name === epicAppName) ?? null : null;
	const epicEntry = isEpic ? downloadableGames.find((g) => g.app_name === epicAppName) ?? null : null;
	const isInstalling = isEpic && downloadingGame === epicAppName;

	// exec_args is "gog:{game_id}" for GOG games
	const isGog = game?.importer_id === "gog";
	const gogGameId = isGog && game?.exec_args ? (game.exec_args.split(":")[1] ?? "") : "";
	const gogInstalled = isGog ? gogInstalledGames.find((g) => g.game_id === gogGameId) ?? null : null;
	const gogEntry = isGog ? gogDownloadableGames.find((g) => g.game_id === gogGameId) ?? null : null;
	const isGogInstalling = isGog && gogDownloadingGame === gogGameId;
	
	// Consider game installed if either:
	// 1. Epic-managed (in installedGames list), OR
	// 2. GOG-managed (in gogInstalledGames list), OR
	// 3. Manually set (has exec_file and game_dir)
	const gameHasExecutable = game?.exec_file && game?.game_dir;
	const isGameInstalled = isEpic 
		? (!!epicInstalled || gameHasExecutable) 
		: isGog 
			? (!!gogInstalled || gameHasExecutable)
			: gameHasExecutable;

	const sorts = [
		{ name: t("criticsScore"), value: "critic_score" },
		{ name: t("gameTime"), value: "time_played" },
		{ name: t("genres"), value: "genres" },
		{ name: t("last-played"), value: "last_time_played" },
		{ name: t("name"), value: "sort_name" },
		{ name: t("platforms"), value: "platforms" },
		{ name: t("publishers"), value: "editors" },
		{ name: t("release-date"), value: "release_date" },
		{ name: t("user-rating"), value: "rating" },
		{ name: t("tags"), value: "tags" },
	];

	const filters = getAllFilters();
	const gameCategories = onGamePage ? getCategoriesForGame(gameID) : [];
	const userCategories = categories.filter(
		(c) => ![t("all"), t("installed"), "Steam", "Epic Games", "GOG", t("favorites")].includes(c.name)
	);

	const hasExecutable = (g: any) => !!((g?.exec_file && g?.game_dir) || (g?.game_importer_id && g?.importer_id));

	useEffect(() => {
		if (game) {
			setPlayLabel(hasExecutable(game) ? t("play") : t("link"));
		}
	}, [game, location.pathname]);

	useEffect(() => {
		if (gameLaunchMessage.isEnded) {
			setLoading(false);
			setPlayLabel(t("play"));
			setGamePID(0);
		} else if (gameLaunchMessage.gamePID > 0) {
			setLoading(false);
			setPlayLabel(t("stop"));
			setGamePID(gameLaunchMessage.gamePID);
		}
	}, [gameLaunchMessage]);

	const handleSearch = (val: string) => {
		setSearchQuery(val);
		searchGame(val);
	};

	const handleSort = (val: string) => {
		setSelectedSort(val);
		sortGames(val);
	};

	const handlePlay = async () => {
		if (!game) return;
		if (playLabel === t("link")) {
			const selected = await open({
				multiple: false,
				filters: [{ name: "Executables", extensions: ["exe", "bat", "sh"] }],
			});
			if (!selected) return;
			game.exec_file = selected.toString();
			game.game_dir = await dirname(selected.toString());
			// Preserve exec_args if it contains Epic metadata (starts with "epic:")
			// Otherwise clear it for non-Epic games
			if (!game.exec_args?.startsWith("epic:")) {
				game.exec_args = "";
			}
			await db.postGame(game);
			setGame(gameID, game);
			setPlayLabel(t("play"));
		} else if (playLabel === t("stop")) {
			if (gamePID > 0) await killGame(gamePID);
		} else {
			setLoading(true);
			const launchId = game.game_importer_id && game.importer_id ? game.game_importer_id : gameID;
			await launchGame(launchId, game.importer_id);
			setTimeout(() => setLoading(false), 10000);
		}
	};

	const isFavorite = gameCategories.some((c) => c.name === "Favorites");

	const toggleFavorites = () => {
		const favId = getCategoryIdByName("Favorites");
		if (!favId || !gameID) return;
		if (isFavorite) removeGameFromCategory(gameID, favId);
		else addGameToCategory(gameID, favId);
	};

	const isCategoryChecked = (catId: string) => gameCategories.some((c) => c.id === catId);

	const toggleCategory = (catId: string, checked: boolean) => {
		if (!gameID) return;
		if (!checked) removeGameFromCategory(gameID, catId);
		else addGameToCategory(gameID, catId);
	};

	const handleAddCategory = (name: string) => {
		if (!name) return;
		createCategory(name, "bookmark", [gameID]);
	};

	const handleInstallEpic = async () => {
		if (!game || !epicAppName) return;
		await downloadGame(epicAppName, installPath);
		setInstallDialogOpen(false);
		await fetchInstalledGames();
	};

	const handleInstallGog = async () => {
		if (!game || !gogGameId) return;
		await gogDownloadGame(gogGameId, installPath);
		setInstallDialogOpen(false);
		await fetchGogInstalledGames();
	};

	const handleCloudCheck = async () => {
		if (!game) return;
		setCloudLoading(true);
		setCloudDialogOpen(true);
		try {
			if (isGog) {
				const info = await gogCheckCloudSaves(gogGameId);
				setCloudInfo(info);
			} else {
				const info = await checkCloudSaves(epicAppName || game.game_importer_id);
				setCloudInfo(info);
			}
		} catch (e: any) {
			toast.error(String(e));
		} finally {
			setCloudLoading(false);
		}
	};

	const toggleMinimize = async () => {
		const isMin = await appWindow.isMinimized();
		isMin ? await appWindow.unminimize() : await appWindow.minimize();
	};

	const toggleMaximize = async () => {
		const isMax = await appWindow.isMaximized();
		isMax ? await appWindow.unmaximize() : await appWindow.maximize();
	};

	return (
		<>
			<div className="flex h-12 items-center justify-between border-b border-border/40 bg-card/30 px-3 backdrop-blur-sm" data-tauri-drag-region>
				{/* Left: Navigation + Bookmarks */}
				<div className="flex items-center gap-1">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.history.back()}>
								<ChevronLeft className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>{t("back")}</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.history.forward()}>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>{t("forward")}</TooltipContent>
					</Tooltip>

					{onGamePage && (
						<>
							<Popover>
								<PopoverTrigger asChild>
									<Button variant="ghost" size="icon" className="h-8 w-8">
										<Bookmark className="h-4 w-4" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-64">
									<div className="space-y-3">
										<div className="flex gap-2">
											<Input
												id="addcat"
												placeholder={t("addNewCategory")}
												className="h-8 text-xs"
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														handleAddCategory((e.target as HTMLInputElement).value);
														(e.target as HTMLInputElement).value = "";
													}
												}}
											/>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 shrink-0"
												onClick={() => {
													const input = document.getElementById("addcat") as HTMLInputElement;
													handleAddCategory(input?.value || "");
													if (input) input.value = "";
												}}
											>
												<Plus className="h-4 w-4" />
											</Button>
										</div>
										<Separator />
										{userCategories.map((cat) => (
											<div key={cat.id} className="flex items-center gap-2">
												<Checkbox
													id={`cat-${cat.id}`}
													checked={isCategoryChecked(cat.id)}
													onCheckedChange={(checked) => toggleCategory(cat.id, !!checked)}
												/>
												<Label htmlFor={`cat-${cat.id}`} className="text-sm">{cat.name}</Label>
											</div>
										))}
									</div>
								</PopoverContent>
							</Popover>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFavorites}>
										<Star className={`h-4 w-4 ${isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
									</Button>
								</TooltipTrigger>
								<TooltipContent>{t("favorites")}</TooltipContent>
							</Tooltip>
						</>
					)}

					{!onGamePage && (
						<Popover>
							<PopoverTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<Filter className="h-4 w-4" />
								</Button>
							</PopoverTrigger>
						<PopoverContent className="w-56 p-2">
							<p className="mb-2 px-1 text-xs font-semibold text-muted-foreground">{t("filterBy")}</p>
							<ScrollArea className="max-h-72">
								{filters.map((group) => (
									<div key={group.name} className="mb-2">
										<p className="mb-1 px-1 text-xs font-medium text-muted-foreground">{group.name}</p>
										{group.values?.map((v: any) => (
											<button
												key={v.cname}
												className="flex w-full items-center rounded px-2 py-1 text-xs hover:bg-accent"
												onClick={() => filterGames(v.code, v.value)}
											>
												{v.cname}
											</button>
										))}
									</div>
								))}
							</ScrollArea>
						</PopoverContent>
						</Popover>
					)}
				</div>

				{/* Center: Search / Game actions */}
				{!onGamePage ? (
					<div className="flex flex-1 items-center justify-center gap-2 px-4">
						<div className="relative w-full max-w-sm">
							<Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								ref={searchRef}
								placeholder={t("search")}
								value={searchQuery}
								onChange={(e) => handleSearch(e.target.value)}
								className="h-8 pl-9 text-sm"
							/>
							{searchQuery && (
								<Button
									variant="ghost"
									size="icon"
									className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
									onClick={() => handleSearch("")}
								>
									<X className="h-3 w-3" />
								</Button>
							)}
						</div>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setGameOverlayOpen(true)}>
									<PlusCircle className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{t("add-game")}</TooltipContent>
						</Tooltip>

						<Popover>
							<PopoverTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<ArrowUpDown className="h-4 w-4" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-48">
								<p className="mb-2 text-xs font-semibold text-muted-foreground">{t("sortBy")}</p>
								{sorts.map((s) => (
									<button
										key={s.value}
										className={`flex w-full items-center rounded px-2 py-1.5 text-xs hover:bg-accent ${selectedSort === s.value ? "bg-accent" : ""}`}
										onClick={() => handleSort(s.value)}
									>
										{s.name}
									</button>
								))}
							</PopoverContent>
						</Popover>

						<Popover open={filterOverlayOpen} onOpenChange={setFilterOverlayOpen}>
							<PopoverTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<MoreVertical className="h-4 w-4" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-72">
								<FilterOverlay />
							</PopoverContent>
						</Popover>
					</div>
				) : (
					<div className="flex flex-1 items-center justify-center gap-2 px-4">
						<Button
							onClick={handlePlay}
							disabled={loading}
							className={`gap-2 ${
								playLabel === t("stop")
									? "bg-red-700 hover:bg-red-800"
									: playLabel === t("play")
										? "bg-blue-600 hover:bg-blue-700"
										: "bg-purple-600 hover:bg-purple-700"
							}`}
						>
							{playLabel === t("stop") ? <Square className="h-4 w-4" /> : playLabel === t("play") ? <Play className="h-4 w-4" /> : <Link className="h-4 w-4" />}
							{loading ? "..." : playLabel}
						</Button>

						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/edit/${gameID}`)}>
									<Pencil className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{t("edit")}</TooltipContent>
						</Tooltip>
					{isEpic && !isGameInstalled && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="sm"
									disabled={isInstalling}
									className="gap-1.5 bg-green-700 hover:bg-green-800"
									onClick={() => setInstallDialogOpen(true)}
								>
									{isInstalling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
									{isInstalling ? "Installing…" : t("install") || "Install"}
								</Button>
							</TooltipTrigger>
							<TooltipContent>{t("install") || "Install"}</TooltipContent>
						</Tooltip>
					)}

					{isEpic && isGameInstalled && epicEntry?.has_update && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="secondary"
									size="sm"
									disabled={isInstalling}
									className="gap-1.5"
									onClick={() => updateGame(epicAppName)}
								>
									{isInstalling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
									{t("update") || "Update"}
								</Button>
							</TooltipTrigger>
							<TooltipContent>{t("update") || "Update"}</TooltipContent>
						</Tooltip>
					)}

					{isEpic && isGameInstalled && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 text-destructive hover:text-destructive"
									onClick={() => uninstallGame(epicAppName)}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{t("uninstall") || "Uninstall"}</TooltipContent>
						</Tooltip>
					)}

					{isGog && !gogInstalled && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="sm"
									disabled={isGogInstalling}
									className="gap-1.5 bg-green-700 hover:bg-green-800"
									onClick={() => setInstallDialogOpen(true)}
								>
									{isGogInstalling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
									{isGogInstalling ? "Installing…" : t("install") || "Install"}
								</Button>
							</TooltipTrigger>
							<TooltipContent>{t("install") || "Install"}</TooltipContent>
						</Tooltip>
					)}

					{isGog && gogInstalled && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 text-destructive hover:text-destructive"
									onClick={() => gogUninstallGame(gogGameId)}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{t("uninstall") || "Uninstall"}</TooltipContent>
						</Tooltip>
					)}					</div>
				)}

				{/* Right: Window controls */}
				<div className="flex items-center gap-0.5">
					<Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleMinimize}>
						<Minus className="h-3 w-3" />
					</Button>
					<Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleMaximize}>
						<Maximize2 className="h-3 w-3" />
					</Button>
					<Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-600" onClick={() => appWindow.close()}>
						<X className="h-3 w-3" />
					</Button>
				</div>
			</div>

			{gameOverlayOpen && <AddGameOverlay open={gameOverlayOpen} onOpenChange={setGameOverlayOpen} />}

			<Dialog open={installDialogOpen} onOpenChange={setInstallDialogOpen}>
				<DialogContent
					className="max-w-md"
					onInteractOutside={(e) => e.preventDefault()}
					onPointerDownOutside={(e) => e.preventDefault()}
				>
					<DialogHeader>
						<DialogTitle>Install {game?.name}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 pt-2">
						{(isInstalling || isGogInstalling) ? (
							<div className="space-y-3">
								<div className="flex items-center justify-between text-sm">
									<span className="flex items-center gap-2 text-muted-foreground">
										<Loader2 className="h-4 w-4 animate-spin" />
										Installing…
									</span>
									<span className="font-medium tabular-nums">
										{isGogInstalling 
											? (gogDownloadProgress?.percent.toFixed(1) ?? "0.0")
											: (downloadProgress?.percent.toFixed(1) ?? "0.0")
										}%
									</span>
								</div>
								<Progress 
									value={isGogInstalling ? (gogDownloadProgress?.percent ?? 0) : (downloadProgress?.percent ?? 0)} 
									className="h-2" 
								/>
								<div className="flex justify-between text-xs text-muted-foreground tabular-nums">
									<span>
										{isGogInstalling 
											? (gogDownloadProgress?.currentFile || "—")
											: (downloadProgress?.speed ?? "—")
										}
									</span>
									<span>
										{isGogInstalling 
											? "" 
											: (downloadProgress?.eta ? `ETA ${downloadProgress.eta}` : "—")
										}
									</span>
								</div>
							</div>
						) : (
							<>
								<div>
									<Label htmlFor="tb-install-path">Install Path</Label>
									<div className="mt-1 flex gap-2">
										<Input
											id="tb-install-path"
											value={installPath}
											onChange={(e) => setInstallPath(e.target.value)}
											placeholder="C:\Games"
											className="flex-1"
										/>
										<Button
											variant="outline"
											type="button"
											onClick={async () => {
												const selected = await open({ directory: true, multiple: false });
												if (selected) setInstallPath(selected.toString());
											}}
										>
											Browse…
										</Button>
									</div>
								</div>
								{epicEntry?.install_size && (
									<p className="text-xs text-muted-foreground">
										Size: {(epicEntry.install_size / 1024 / 1024 / 1024).toFixed(1)} GB
									</p>
								)}
								<div className="flex justify-end gap-2">
									<Button variant="outline" onClick={() => setInstallDialogOpen(false)}>Cancel</Button>
								<Button onClick={isGog ? handleInstallGog : handleInstallEpic}>
										<Download className="mr-2 h-4 w-4" />
										{t("install") || "Install"}
									</Button>
								</div>
							</>
						)}
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={cloudDialogOpen} onOpenChange={setCloudDialogOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Cloud Saves — {game?.name}</DialogTitle>
					</DialogHeader>
					<div className="space-y-3 pt-2">
						{cloudLoading ? (
							<div className="flex justify-center py-4">
								<Loader2 className="h-6 w-6 animate-spin" />
							</div>
						) : cloudInfo ? (
							<div className="rounded-lg border bg-muted/30 p-3 text-sm">
								<p className="font-medium">{cloudInfo.status?.replace(/([A-Z])/g, " $1").trim()}</p>
								{cloudInfo.local_path && (
									<p className="mt-1 text-xs text-muted-foreground">{cloudInfo.local_path}</p>
								)}
							</div>
						) : null}
						<Separator />
						<div className="flex gap-2">
						<Button className="flex-1" variant="outline" onClick={() => {
							if (isGog) gogUploadSaves(gogGameId, cloudInfo?.local_save_path ?? "");
							else uploadSaves(epicAppName);
							setCloudDialogOpen(false);
						}}>
							<CloudUpload className="mr-2 h-4 w-4" /> Upload
						</Button>
						<Button className="flex-1" variant="outline" onClick={() => {
							if (isGog) gogDownloadSaves(gogGameId, cloudInfo?.local_save_path ?? "");
							else downloadSaves(epicAppName);
							setCloudDialogOpen(false);
						}}>
								<CloudDownload className="mr-2 h-4 w-4" /> Download
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
