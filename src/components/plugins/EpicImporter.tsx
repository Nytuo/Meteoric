import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useTranslation } from "react-i18next";
import {
	ChevronRight, ChevronLeft, ExternalLink, LogIn, Loader2, Download,
	Play, RefreshCw, Trash2, Cloud, CloudUpload, CloudDownload, Trophy,
	CheckCircle, AlertCircle, HardDrive, FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useGameStore } from "@/stores/gameStore";
import { useEpicStore, type EpicGameEntry } from "@/stores/epicStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const EPIC_LOGIN_URL =
	"https://www.epicgames.com/id/login?redirectUrl=https%3A//www.epicgames.com/id/api/redirect%3FclientId%3D34a02cf8f4414e29b15921876da36f9a%26responseType%3Dcode";

type Tab = "auth" | "library" | "installed";

export function EpicImporter() {
	const { t } = useTranslation();
	const { fetchGames, games } = useGameStore();
	const {
		loggedIn, displayName, downloadableGames, installedGames,
		downloadingGame, loadingGames,
		checkLoginStatus, fetchDownloadableGames, fetchInstalledGames,
		downloadGame, updateGame, uninstallGame, launchGame,
		checkCloudSaves, uploadSaves, downloadSaves,
		syncAchievements,
	} = useEpicStore();

	const [tab, setTab] = useState<Tab>("auth");
	const [authStep, setAuthStep] = useState(0);
	const [authCode, setAuthCode] = useState("");
	const [loading, setLoading] = useState(false);
	const [installPath, setInstallPath] = useState("");

	useEffect(() => {
		checkLoginStatus();
	}, []);

	useEffect(() => {
		if (loggedIn && tab === "auth") setTab("library");
	}, [loggedIn]);

	const openLoginPage = () => openUrl(EPIC_LOGIN_URL);

	const loginAndSync = async () => {
		setLoading(true);
		try {
			await invoke("import_library", {
				pluginName: "epic_importer",
				creds: [authCode],
			});
			await fetchGames();
			await checkLoginStatus();
			await fetchDownloadableGames();
			await fetchInstalledGames();
			toast.success("Epic Games import OK");
			setTab("library");
		} catch (e: any) {
			toast.error(String(e));
		} finally {
			setLoading(false);
		}
	};

	const syncOnly = async () => {
		setLoading(true);
		try {
			await invoke("import_library", {
				pluginName: "epic_importer",
				creds: [""],
			});
			await fetchGames();
			await checkLoginStatus();
			await fetchDownloadableGames();
			await fetchInstalledGames();
			toast.success("Epic Games sync OK");
			setTab("library");
		} catch (e: any) {
			toast.error(String(e));
		} finally {
			setLoading(false);
		}
	};

	const refreshLibrary = async () => {
		setLoading(true);
		try {
			await fetchDownloadableGames();
			await fetchInstalledGames();
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex h-full flex-col">
			<h2 className="mb-1 flex items-center gap-2 text-xl font-semibold">
				Epic Games {t("importer") || "Importer"}
				{loggedIn && (
					<Badge variant="secondary" className="ml-2 text-xs font-normal">
						<CheckCircle className="mr-1 h-3 w-3 text-green-500" />
						{displayName || "Connected"}
					</Badge>
				)}
			</h2>

			{/* Tab Nav */}
			<div className="mb-4 flex gap-1">
				{([
					{ key: "auth" as Tab, label: t("authentication") || "Authentication" },
					{ key: "library" as Tab, label: t("library") || "Library" },
					{ key: "installed" as Tab, label: t("installed") || "Installed" },
				]).map(({ key, label }) => (
					<button
						key={key}
						onClick={() => setTab(key)}
						className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
							tab === key
								? "bg-primary text-primary-foreground"
								: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
						}`}
					>
						{label}
					</button>
				))}
			</div>

			{/* ── Auth Tab ─────────────────────── */}
			{tab === "auth" && (
				<div>
					{loggedIn ? (
						<div className="space-y-3">
							<p className="text-sm text-green-600 dark:text-green-400">
								<CheckCircle className="mr-1 inline h-4 w-4" />
								{t("loggedInAs") || "Logged in as"} <strong>{displayName}</strong>
							</p>
							<Button variant="outline" onClick={syncOnly} disabled={loading}>
								{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
								{t("resyncLibrary") || "Re-sync Library"}
							</Button>
						</div>
					) : (
						<>
							{/* Step indicators */}
							<div className="mb-4 flex gap-2">
								{[t("signIn") || "Sign In", t("insertTheAuthcode") || "Auth Code", t("login") || "Login"].map((label, i) => (
									<button
										key={i}
										onClick={() => setAuthStep(i)}
										className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
											authStep === i
												? "bg-primary text-primary-foreground"
												: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
										}`}
									>
										{i + 1}. {label}
									</button>
								))}
							</div>

							{authStep === 0 && (
								<div className="space-y-4">
									<p className="text-sm text-muted-foreground">
										{t("epic-importer.howto") || "Sign in to your Epic Games account to get an authorization code."}
									</p>
									<Button variant="outline" onClick={openLoginPage}>
										<ExternalLink className="mr-2 h-4 w-4" />
										{t("signIn") || "Sign In to Epic Games"}
									</Button>
									<div className="pt-2">
										<Button onClick={() => setAuthStep(1)}>
											{t("next") || "Next"} <ChevronRight className="ml-2 h-4 w-4" />
										</Button>
									</div>
								</div>
							)}

							{authStep === 1 && (
								<div className="space-y-4">
									<div className="max-w-sm">
										<Label htmlFor="epic-auth">{t("authcode") || "Authorization Code"}</Label>
										<Input
											id="epic-auth"
											value={authCode}
											onChange={(e) => setAuthCode(e.target.value)}
											placeholder="paste your auth code here..."
											className="mt-1"
										/>
									</div>
									<div className="flex gap-2">
										<Button variant="secondary" onClick={() => setAuthStep(0)}>
											<ChevronLeft className="mr-2 h-4 w-4" /> {t("back") || "Back"}
										</Button>
										<Button onClick={() => setAuthStep(2)}>
											{t("next") || "Next"} <ChevronRight className="ml-2 h-4 w-4" />
										</Button>
									</div>
								</div>
							)}

							{authStep === 2 && (
								<div className="space-y-4">
									<div className="flex flex-wrap gap-3">
										<Button onClick={loginAndSync} disabled={loading}>
											{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
											{t("loginAndSync") || "Login & Sync"}
										</Button>
										<Button variant="outline" onClick={syncOnly} disabled={loading}>
											{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
											{t("sync-loggedin") || "Sync (Already Logged In)"}
										</Button>
									</div>
									<Button variant="secondary" onClick={() => setAuthStep(1)}>
										<ChevronLeft className="mr-2 h-4 w-4" /> {t("back") || "Back"}
									</Button>
								</div>
							)}
						</>
					)}
				</div>
			)}

			{/* ── Library Tab (downloadable games) ─────── */}
			{tab === "library" && (
				<div className="flex flex-1 flex-col space-y-3 overflow-hidden">
					<div className="flex items-center gap-2">
						<Button size="sm" variant="outline" onClick={refreshLibrary} disabled={loading || loadingGames}>
							{loadingGames ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-2 h-3 w-3" />}
							{t("refresh") || "Refresh"}
						</Button>
						<span className="text-xs text-muted-foreground">{downloadableGames.length} games</span>
					</div>

					{!loggedIn && (
						<p className="text-sm text-amber-600 dark:text-amber-400">
							<AlertCircle className="mr-1 inline h-4 w-4" />
							{t("pleaseLoginFirst") || "Please login first to see your Epic library."}
						</p>
					)}

					<ScrollArea className="flex-1">
						<div className="space-y-1 pr-3">
							{downloadableGames.map((game) => {
								// Find the local game that matches this Epic game by app_name in exec_args
								const localGame = games.find((g) => {
									const epicData = g.exec_args?.split(":");
									return g.importer_id === "epic" && epicData?.[1] === game.app_name;
								});
								const hasLocalExecutable = !!(localGame?.exec_file && localGame?.game_dir);
								
								return (
									<EpicGameRow
										key={game.app_name}
										game={game}
										downloading={downloadingGame === game.app_name}
										installPath={installPath}
										setInstallPath={setInstallPath}
										hasLocalExecutable={hasLocalExecutable}
										onDownload={() => downloadGame(game.app_name, installPath || "C:\\Games")}
										onUpdate={() => updateGame(game.app_name)}
										onUninstall={() => uninstallGame(game.app_name)}
										onLaunch={() => launchGame(game.app_name)}
										onSyncAchievements={() => syncAchievements("", game.app_name, game.namespace)}
										onCloudCheck={() => checkCloudSaves(game.app_name)}
										onCloudUpload={() => uploadSaves(game.app_name)}
										onCloudDownload={() => downloadSaves(game.app_name)}
									/>
								);
							})}
							{downloadableGames.length === 0 && !loadingGames && (
								<p className="py-4 text-center text-sm text-muted-foreground">
									{t("noGamesFound") || "No games found. Sync your library first."}
								</p>
							)}
						</div>
					</ScrollArea>
				</div>
			)}

			{/* ── Installed Tab ──────────────────── */}
			{tab === "installed" && (
				<div className="flex flex-1 flex-col space-y-3 overflow-hidden">
					<div className="flex items-center gap-2">
						<Button size="sm" variant="outline" onClick={fetchInstalledGames}>
							<RefreshCw className="mr-2 h-3 w-3" /> {t("refresh") || "Refresh"}
						</Button>
						<span className="text-xs text-muted-foreground">{installedGames.length} installed</span>
					</div>
					<ScrollArea className="flex-1">
						<div className="space-y-2 pr-3">
							{installedGames.map((game) => (
								<div key={game.app_name} className="flex items-center justify-between rounded-md border border-border p-3">
									<div>
										<p className="text-sm font-medium">{game.title || game.app_name}</p>
										{game.title && (
											<p className="text-xs text-muted-foreground">{game.app_name}</p>
										)}
										<p className="text-xs text-muted-foreground">
											<HardDrive className="mr-1 inline h-3 w-3" />
											{game.install_path}
											<span className="ml-2">v{game.version}</span>
											<span className="ml-2">{(game.install_size / 1024 / 1024 / 1024).toFixed(1)} GB</span>
										</p>
									</div>
									<div className="flex gap-1">
										<Button size="sm" variant="ghost" onClick={() => launchGame(game.app_name)}>
											<Play className="h-4 w-4" />
										</Button>
										<Button size="sm" variant="ghost" onClick={() => uninstallGame(game.app_name)}>
											<Trash2 className="h-4 w-4 text-destructive" />
										</Button>
									</div>
								</div>
							))}
							{installedGames.length === 0 && (
								<p className="py-4 text-center text-sm text-muted-foreground">
									{t("noInstalledGames") || "No Epic games installed yet."}
								</p>
							)}
						</div>
					</ScrollArea>
				</div>
			)}
		</div>
	);
}

// ──────────────────────────────────────────────
// Game Row Sub-component
// ──────────────────────────────────────────────

function EpicGameRow({
	game, downloading, installPath, setInstallPath, hasLocalExecutable,
	onDownload, onUpdate, onUninstall, onLaunch,
	onSyncAchievements, onCloudCheck, onCloudUpload, onCloudDownload,
}: {
	game: EpicGameEntry;
	downloading: boolean;
	installPath: string;
	setInstallPath: (p: string) => void;
	hasLocalExecutable: boolean;
	onDownload: () => void;
	onUpdate: () => void;
	onUninstall: () => void;
	onLaunch: () => void;
	onSyncAchievements: () => void;
	onCloudCheck: () => void;
	onCloudUpload: () => void;
	onCloudDownload: () => void;
}) {
	const [expanded, setExpanded] = useState(false);
	
	// Consider installed if either Epic-managed OR has local executable set
	const isInstalled = game.is_installed || hasLocalExecutable;

	return (
		<div className="rounded-md border border-border">
			<button
				onClick={() => setExpanded(!expanded)}
				className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-accent/50"
			>
				<div className="flex items-center gap-2">
					<div>
						<span className="text-sm font-medium">{game.title || game.app_name}</span>
						{game.title && (
							<p className="text-xs text-muted-foreground">{game.app_name}</p>
						)}
					</div>
					{isInstalled && (
						<Badge variant="outline" className="text-xs">
							<CheckCircle className="mr-1 h-3 w-3 text-green-500" /> Installed
						</Badge>
					)}
					{game.has_update && (
						<Badge variant="destructive" className="text-xs">Update</Badge>
					)}
				</div>
				<ChevronRight className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`} />
			</button>

			{expanded && (
				<div className="border-t border-border px-3 py-2 space-y-2">
					<p className="text-xs text-muted-foreground">
						Build: {game.build_version} &middot; Namespace: {game.namespace}
					</p>

					{/* Install / Update / Uninstall / Launch */}
					<div className="flex flex-wrap items-center gap-2">
						{!isInstalled && (
							<>
								<Input
									placeholder="Install path (e.g. C:\Games)"
									value={installPath}
									onChange={(e) => setInstallPath(e.target.value)}
									className="h-8 max-w-xs text-xs"
								/>
								<Button size="sm" disabled={downloading} onClick={onDownload}>
									{downloading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Download className="mr-1 h-3 w-3" />}
									Install
								</Button>
							</>
						)}

						{isInstalled && (
							<>
								<Button size="sm" onClick={onLaunch}>
									<Play className="mr-1 h-3 w-3" /> Play
								</Button>
								{game.has_update && (
									<Button size="sm" variant="secondary" disabled={downloading} onClick={onUpdate}>
										{downloading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
										Update
									</Button>
								)}
								<Button size="sm" variant="destructive" onClick={onUninstall}>
									<Trash2 className="mr-1 h-3 w-3" /> Uninstall
								</Button>
							</>
						)}
					</div>

					<Separator />

					{/* Cloud saves & Achievements */}
					<div className="flex flex-wrap gap-2">
						<Button size="sm" variant="ghost" onClick={onCloudCheck} title="Check cloud save status">
							<Cloud className="mr-1 h-3 w-3" /> Saves
						</Button>
						<Button size="sm" variant="ghost" onClick={onCloudUpload} title="Upload saves">
							<CloudUpload className="h-3 w-3" />
						</Button>
						<Button size="sm" variant="ghost" onClick={onCloudDownload} title="Download saves">
							<CloudDownload className="h-3 w-3" />
						</Button>
						<Button size="sm" variant="ghost" onClick={onSyncAchievements} title="Sync achievements">
							<Trophy className="mr-1 h-3 w-3" /> Achievements
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
