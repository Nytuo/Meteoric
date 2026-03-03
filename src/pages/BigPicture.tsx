import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { Search, X, Play, Square, Loader2, Image, Trophy, Library, Clock, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useGameStore } from "@/stores/gameStore";
import { useAppStore } from "@/stores/appStore";
import { useTauriEventStore } from "@/stores/tauriEvents";
import type { IGame, ITrophy } from "@/types";
import "./BigPicture.css";

function toParsedTimeFull(minutes: number): string {
	const days = Math.floor(minutes / 1440);
	const hours = Math.floor((minutes % 1440) / 60);
	const mins = (minutes % 1440) % 60;
	let result = "";
	if (days > 0) result += days + "d ";
	if (hours > 0) result += hours + "h ";
	if (mins > 0) result += mins + "m";
	return result || "0m";
}

function getTotalTimePlayed(game: IGame): string {
	const ms = game.stats?.reduce((acc, s) => acc + parseInt(s.time_played || "0"), 0) || 0;
	const total = Math.floor(ms / 60000);
	return toParsedTimeFull(total);
}

function getLastPlayed(game: IGame): string {
	if (!game.stats || game.stats.length === 0) return "Never";
	const sorted = [...game.stats].sort((a, b) => new Date(b.date_of_play).getTime() - new Date(a.date_of_play).getTime());
	const last = sorted[0]?.date_of_play;
	if (!last) return "Never";
	const d = new Date(last);
	const now = new Date();
	const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return `${diffDays}d ago`;
	const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
	return months[d.getMonth()] + " " + d.getDate();
}

function getTrophyCount(game: IGame) {
	const total = parseInt(game.trophies || "0") || 0;
	const unlocked = parseInt(game.trophies_unlocked || "0") || 0;
	return { unlocked, total };
}

function getTrophyPercent(game: IGame): number {
	const { unlocked, total } = getTrophyCount(game);
	if (total === 0) return 0;
	return Math.round((unlocked / total) * 100);
}

function transformHltbTime(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}

export function BigPicture() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { games, filteredGames, fetchGames, fetchAchievements, achievements, launchGame, killGame, loadGameExtras } = useGameStore();
	const { playBGMusic, stopAllAudio } = useAppStore();
	const { gamePID, isGameRunning } = useTauriEventStore();

	// Gamepad
	const [gamepadConnected, setGamepadConnected] = useState(false);
	const gamepadRAF = useRef<number | null>(null);
	const lastButtonState = useRef<Record<number, boolean>>({});

	const [selectedIndex, setSelectedIndex] = useState(0);
	const [showDetail, setShowDetail] = useState(false);
	const [selectedGame, setSelectedGame] = useState<IGame | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [showSearch, setShowSearch] = useState(false);
	const [showExitConfirm, setShowExitConfirm] = useState(false);
	const [currentTime, setCurrentTime] = useState("");
	const [launchingGame, setLaunchingGame] = useState(false);
	const [localFiltered, setLocalFiltered] = useState<IGame[]>([]);

	// Detail tabs: "details" | "achievements"
	const [detailTab, setDetailTab] = useState<"details" | "achievements">("details");

	// Menu mode: "recent" (home) vs "all" (full library)
	const [menuMode, setMenuMode] = useState<"recent" | "all">("recent");

	// HLTB
	type HltbData = { mainStory: string; mainExtra: string; completionist: string; allStyles: string; coop: string; versus: string };
	const emptyHltb: HltbData = { mainStory: "N/A", mainExtra: "N/A", completionist: "N/A", allStyles: "N/A", coop: "N/A", versus: "N/A" };
	const [hltbData, setHltbData] = useState<HltbData>(emptyHltb);
	const [loadingHltb, setLoadingHltb] = useState(false);

	// Media lightbox
	const [mediaOverlay, setMediaOverlay] = useState<{ src: string; type: "image" | "video" } | null>(null);

	// Recent games: sorted by last played, limited to 10
	const recentGames = useMemo(() => {
		const allAvailable = filteredGames.length > 0 ? filteredGames : games;
		const played = allAvailable.filter((g) => g.stats && g.stats.length > 0);
		played.sort((a, b) => {
			const lastA = Math.max(...a.stats.map((s) => new Date(s.date_of_play).getTime()));
			const lastB = Math.max(...b.stats.map((s) => new Date(s.date_of_play).getTime()));
			return lastB - lastA;
		});
		return played.slice(0, 10);
	}, [games, filteredGames]);

	const allLibraryGames = useMemo(() => {
		return filteredGames.length > 0 ? filteredGames : games;
	}, [games, filteredGames]);

	const displayGames = useMemo(() => {
		if (localFiltered.length > 0 || searchQuery) return localFiltered;
		return menuMode === "recent" ? recentGames : allLibraryGames;
	}, [localFiltered, searchQuery, menuMode, recentGames, allLibraryGames]);

	const allGames = displayGames;

	// Refs for closures in gamepad/keyboard handlers
	const stateRef = useRef({ showDetail, showSearch, showExitConfirm, mediaOverlay, selectedIndex, allGames, menuMode });
	stateRef.current = { showDetail, showSearch, showExitConfirm, mediaOverlay, selectedIndex, allGames, menuMode };

	// ----------------------------------------------------------------
	//  Scroll helper
	// ----------------------------------------------------------------
	const scrollSelectedIntoView = useCallback((idx: number) => {
		setTimeout(() => {
			const container = document.getElementById("sd-carousel");
			const el = document.getElementById(`sd-card-${idx}`);
			if (container && el) {
				const containerRect = container.getBoundingClientRect();
				const elRect = el.getBoundingClientRect();
				const scrollLeft = el.offsetLeft - containerRect.width / 2 + elRect.width / 2;
				container.scrollTo({ left: Math.max(0, scrollLeft), behavior: "smooth" });
			}
		}, 50);
	}, []);

	// ----------------------------------------------------------------
	//  Navigation
	// ----------------------------------------------------------------
	const navigate_dir = useCallback((dir: "left" | "right") => {
		const { showDetail: sd, allGames: ag } = stateRef.current;
		if (sd || ag.length === 0) return;
		setSelectedIndex((prev) => {
			const next = dir === "left" ? Math.max(0, prev - 1) : Math.min(ag.length - 1, prev + 1);
			scrollSelectedIntoView(next);
			return next;
		});
	}, [scrollSelectedIntoView]);

	const selectCurrentRef = useRef<() => void>(() => {});
	const goBackRef = useRef<() => void>(() => {});
	const exitBigPictureRef = useRef<() => Promise<void>>(async () => {});
	const detailViewRef = useRef<HTMLDivElement>(null);
	const handleGamepadButtonRef = useRef<(button: string) => void>(() => {});

	// ----------------------------------------------------------------
	//  Init
	// ----------------------------------------------------------------
	useEffect(() => {
		const appWindow = getCurrentWebviewWindow();
		appWindow.setFullscreen(true);
		fetchGames();
		const timer = setInterval(() => {
			const now = new Date();
			const h = now.getHours() % 12 || 12;
			const m = now.getMinutes().toString().padStart(2, "0");
			const ampm = now.getHours() >= 12 ? "PM" : "AM";
			setCurrentTime(`${h}:${m} ${ampm}`);
		}, 1000);
		return () => { clearInterval(timer); stopAllAudio(); };
	}, []);

	useEffect(() => {
		if (!searchQuery) setLocalFiltered([]);
	}, [searchQuery]);

	// ----------------------------------------------------------------
	//  Gamepad polling
	// ----------------------------------------------------------------
	useEffect(() => {
		const handleConConnect = () => setGamepadConnected(true);
		const handleConDisconnect = () => {
			if (!navigator.getGamepads || !Array.from(navigator.getGamepads()).some(Boolean)) {
				setGamepadConnected(false);
			}
		};
		window.addEventListener("gamepadconnected", handleConConnect);
		window.addEventListener("gamepaddisconnected", handleConDisconnect);

		const poll = () => {
			const pads = navigator.getGamepads ? navigator.getGamepads() : [];
			for (const pad of pads) {
				if (!pad) continue;
				setGamepadConnected(true);
				const buttons = pad.buttons;
				// Map: 0=A, 1=B, 2=X, 3=Y, 4=LB, 5=RB, 9=Start, 12=DUp, 13=DDown, 14=DLeft, 15=DRight
				const pressed = (idx: number) => buttons[idx]?.pressed ?? false;

				const checkNew = (idx: number, label: string) => {
					const wasPressed = lastButtonState.current[idx] ?? false;
					const isPressed = pressed(idx);
					if (isPressed && !wasPressed) return label;
					return null;
				};

				const buttonMap: Array<[number, string]> = [
					[0, "A"], [1, "B"], [2, "X"], [3, "Y"],
					[4, "LB"], [5, "RB"], [9, "Start"],
					[12, "DPadUp"], [13, "DPadDown"],
					[14, "DPadLeft"], [15, "DPadRight"],
				];

				for (const [idx, label] of buttonMap) {
					const fired = checkNew(idx, label);
					if (fired) handleGamepadButtonRef.current(fired);
				}

				// Axis (left stick)
				const axisX = pad.axes[0] ?? 0;
				const prevAxis = (lastButtonState.current as any)._axisX ?? 0;
				if (axisX < -0.5 && Math.abs(prevAxis) < 0.5) {
					handleGamepadButtonRef.current("DPadLeft");
				} else if (axisX > 0.5 && Math.abs(prevAxis) < 0.5) {
					handleGamepadButtonRef.current("DPadRight");
				}
				(lastButtonState.current as any)._axisX = axisX;

				for (const [idx] of buttonMap) {
					lastButtonState.current[idx] = pressed(idx);
				}
			}
			gamepadRAF.current = requestAnimationFrame(poll);
		};

		gamepadRAF.current = requestAnimationFrame(poll);
		return () => {
			if (gamepadRAF.current) cancelAnimationFrame(gamepadRAF.current);
			window.removeEventListener("gamepadconnected", handleConConnect);
			window.removeEventListener("gamepaddisconnected", handleConDisconnect);
		};
	}, []);

	function handleGamepadButton(button: string) {
		const { showDetail: sd, showSearch: ss, showExitConfirm: sec, mediaOverlay: mo } = stateRef.current;
		if (mo) { if (button === "B") setMediaOverlay(null); return; }
		
		// Search mode: allow navigation and selection
		if (ss) {
			if (button === "B") { setShowSearch(false); setSearchQuery(""); setLocalFiltered([]); }
			else if (button === "A") { selectCurrentRef.current(); }
			else if (button === "DPadLeft" || button === "LB") { navigate_dir("left"); }
			else if (button === "DPadRight" || button === "RB") { navigate_dir("right"); }
			return;
		}
		
		if (sec) {
			if (button === "A") exitBigPictureRef.current();
			else if (button === "B") setShowExitConfirm(false);
			return;
		}
		
		// Detail mode: add tab switching and scrolling
		if (sd) {
			switch (button) {
				case "A": case "X": selectCurrentRef.current(); break;
				case "B": goBackRef.current(); break;
				case "LB": setDetailTab("details"); break;
				case "RB": setDetailTab("achievements"); break;
				case "DPadUp":
					if (detailViewRef.current) {
						detailViewRef.current.scrollBy({ top: -200, behavior: "smooth" });
					}
					break;
				case "DPadDown":
					if (detailViewRef.current) {
						detailViewRef.current.scrollBy({ top: 200, behavior: "smooth" });
					}
					break;
				case "Start": setShowExitConfirm(true); break;
			}
			return;
		}
		
		// Home mode: add tab switching with DPadUp/Down
		const currentMenuMode = stateRef.current.menuMode;
		switch (button) {
			case "A": selectCurrentRef.current(); break;
			case "B": goBackRef.current(); break;
			case "Y": setShowSearch(true); break;
			case "Start": setShowExitConfirm(true); break;
			case "DPadLeft": case "LB": navigate_dir("left"); break;
			case "DPadRight": case "RB": navigate_dir("right"); break;
			case "DPadUp":
				if (currentMenuMode === "all") {
					setMenuMode("recent");
					setSelectedIndex(0);
					setTimeout(() => scrollSelectedIntoView(0), 100);
				}
				break;
			case "DPadDown":
				if (currentMenuMode === "recent") {
					setMenuMode("all");
					setSelectedIndex(0);
					setTimeout(() => scrollSelectedIntoView(0), 100);
				}
				break;
		}
	}
	handleGamepadButtonRef.current = handleGamepadButton;

	// ----------------------------------------------------------------
	//  selectCurrent / goBack / exit (refresh on every render via ref)
	// ----------------------------------------------------------------
	const selectCurrent = () => {
		const { showDetail: sd, allGames: ag, selectedIndex: idx } = stateRef.current;
		if (sd || ag.length === 0) return;
		const game = ag[idx];
		setSelectedGame(game);
		setShowDetail(true);
		setDetailTab("details");
		
		// Load screenshots, videos, and background music
		loadGameExtras(game.id).then(() => {
			// After loading extras, check for background music
			const updated = games.find((g) => g.id === game.id);
			if (updated?.backgroundMusic) {
				playBGMusic(updated.backgroundMusic);
			}
		});
		
		fetchHLTB(game.name);
		fetchAchievements(game.id);
	};
	selectCurrentRef.current = selectCurrent;

	const goBack = () => {
		if (stateRef.current.mediaOverlay) { setMediaOverlay(null); return; }
		if (stateRef.current.showDetail) {
			setShowDetail(false);
			setSelectedGame(null);
			stopAllAudio();
			scrollSelectedIntoView(stateRef.current.selectedIndex);
		} else {
			setShowExitConfirm(true);
		}
	};
	goBackRef.current = goBack;

	const exitBigPicture = async () => {
		stopAllAudio();
		const appWindow = getCurrentWebviewWindow();
		await appWindow.setFullscreen(false);
		navigate("/games");
	};
	exitBigPictureRef.current = exitBigPicture;

	const launchSelected = async () => {
		if (!selectedGame) return;
		setLaunchingGame(true);
		const hasExec = (selectedGame.exec_file && selectedGame.game_dir) || (selectedGame.game_importer_id && selectedGame.importer_id);
		if (!hasExec) {
			toast.error(t("no_game_found"));
			setLaunchingGame(false);
			return;
		}
		if (isGameRunning && gamePID) {
			await killGame(gamePID);
		} else {
			const id = selectedGame.game_importer_id && selectedGame.importer_id ? selectedGame.game_importer_id : selectedGame.id;
			await launchGame(id, selectedGame.importer_id);
		}
		setLaunchingGame(false);
	};

	const fetchHLTB = async (name: string) => {
		setLoadingHltb(true);
		setHltbData(emptyHltb);
		try {
			const res = await invoke<string>("search_hltb", { gameName: name });
			const d = JSON.parse(res);
			const fmt = (s?: number) => (s ? transformHltbTime(s) : "N/A");
			setHltbData({
				mainStory:     fmt(d.main_story?.average),
				mainExtra:     fmt(d.main_extra?.average),
				completionist: fmt(d.completionist?.average),
				allStyles:     fmt(d.all_styles?.average),
				coop:          fmt(d.co_op?.average),
				versus:        fmt(d.vs?.average),
			});
		} catch {
			setHltbData(emptyHltb);
		}
		setLoadingHltb(false);
	};

	const onSearchInput = (q: string) => {
		setSearchQuery(q);
		if (!q.trim()) {
			setLocalFiltered([]);
			setSelectedIndex(0);
			return;
		}
		// Filter from the appropriate list (recent or all library), not just all games
		const sourceGames = menuMode === "recent" ? recentGames : allLibraryGames;
		setLocalFiltered(sourceGames.filter((g) => g.name.toLowerCase().includes(q.toLowerCase())));
		setSelectedIndex(0);
	};

	const openSearch = () => {
		setShowSearch(true);
		setTimeout(() => {
			const input = document.getElementById("bp-search-input") as HTMLInputElement | null;
			if (input) input.focus();
		}, 100);
	};

	const closeSearch = () => {
		setShowSearch(false);
		setSearchQuery("");
		setLocalFiltered([]);
		setSelectedIndex(0);
		scrollSelectedIntoView(0);
	};

	// ----------------------------------------------------------------
	//  Keyboard handler
	// ----------------------------------------------------------------
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			const { showDetail: sd, showSearch: ss, showExitConfirm: sec, mediaOverlay: mo } = stateRef.current;
			if (mo) { if (e.key === "Escape") setMediaOverlay(null); return; }
			
			// Search mode: allow navigation and selection
			if (ss) {
				if (e.key === "Escape") closeSearch();
				else if (e.key === "Enter" || e.key === " ") { selectCurrentRef.current(); e.preventDefault(); }
				else if (e.key === "ArrowLeft") { navigate_dir("left"); e.preventDefault(); }
				else if (e.key === "ArrowRight") { navigate_dir("right"); e.preventDefault(); }
				return;
			}
			
			if (sec) {
				if (e.key === "Enter" || e.key === " ") exitBigPicture();
				else if (e.key === "Escape") setShowExitConfirm(false);
				return;
			}
			
			// Detail mode: add tab switching with 1/2 keys or Q/E, and scrolling with arrow keys
			if (sd) {
				if (e.key === "1" || e.key === "q" || e.key === "Q") { setDetailTab("details"); e.preventDefault(); }
				else if (e.key === "2" || e.key === "e" || e.key === "E") { setDetailTab("achievements"); e.preventDefault(); }
				else if (e.key === "ArrowUp") {
					if (detailViewRef.current) {
						detailViewRef.current.scrollBy({ top: -200, behavior: "smooth" });
					}
					e.preventDefault();
				}
				else if (e.key === "ArrowDown") {
					if (detailViewRef.current) {
						detailViewRef.current.scrollBy({ top: 200, behavior: "smooth" });
					}
					e.preventDefault();
				}
				else if (e.key === "Escape" || e.key === "Backspace") { goBackRef.current(); e.preventDefault(); }
				return;
			}
			
			// Home mode: add tab switching with arrow up/down
			const currentMenuMode = stateRef.current.menuMode;
			switch (e.key) {
				case "ArrowLeft":  navigate_dir("left");  e.preventDefault(); break;
				case "ArrowRight": navigate_dir("right"); e.preventDefault(); break;
				case "ArrowUp":
					if (currentMenuMode === "all") {
						setMenuMode("recent");
						setSelectedIndex(0);
						setTimeout(() => scrollSelectedIntoView(0), 100);
					}
					e.preventDefault();
					break;
				case "ArrowDown":
					if (currentMenuMode === "recent") {
						setMenuMode("all");
						setSelectedIndex(0);
						setTimeout(() => scrollSelectedIntoView(0), 100);
					}
					e.preventDefault();
					break;
				case "Enter": case " ": selectCurrentRef.current(); e.preventDefault(); break;
				case "Escape": case "Backspace": goBackRef.current(); e.preventDefault(); break;
				case "f": case "F": { openSearch(); e.preventDefault(); } break;
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [navigate_dir, scrollSelectedIntoView]);

	// ----------------------------------------------------------------
	//  Derived values
	// ----------------------------------------------------------------
	const bgImage = showDetail && selectedGame
		? (selectedGame.background || selectedGame.jaquette)
		: allGames[selectedIndex]
			? (allGames[selectedIndex].background || allGames[selectedIndex].jaquette)
			: undefined;

	const trophies = selectedGame ? getTrophyCount(selectedGame) : { unlocked: 0, total: 0 };

	// ----------------------------------------------------------------
	//  Render  (matches Angular bigpicture.component.html exactly)
	// ----------------------------------------------------------------
	return (
		<div className={`sd-container${showDetail ? " detail-mode" : ""}`}>

			{/* Background */}
			<div className="sd-global-bg">
				{bgImage && <img src={bgImage} className="sd-bg-img" alt="" />}
				<div className="sd-bg-gradient" />
			</div>

			{/* Top right icons */}
			<div className="sd-top-right">
				<button className="sd-icon-action" onClick={openSearch}>
					<Search size={18} />
				</button>
				<span className="sd-time">{currentTime}</span>
			</div>

			{/* Search overlay */}
			{showSearch && (
				<div className="bp-search-overlay">
					<div className="bp-search-box" onClick={(e) => e.stopPropagation()}>
						<span className="bp-search-icon"><Search size={16} /></span>
						<input
							id="bp-search-input"
							type="text"
							className="bp-search-input"
							placeholder={t("bigpicture_search_placeholder") || "Search games…"}
							value={searchQuery}
							onChange={(e) => onSearchInput(e.target.value)}
							autoComplete="off"
						/>
						<button className="bp-search-close" onClick={closeSearch}><X size={16} /></button>
					</div>
				</div>
			)}

			{/* Exit overlay */}
			{showExitConfirm && (
				<div className="bp-exit-overlay" onClick={() => setShowExitConfirm(false)} onKeyDown={(e) => e.key === "Escape" && setShowExitConfirm(false)}>
					<div className="bp-exit-dialog" onClick={(e) => e.stopPropagation()}>
						<h2>{t("bigpicture_exit_confirm") || "Exit Big Picture?"}</h2>
						<p>{t("bigpicture_exit_message") || "Return to normal mode"}</p>
						<div className="bp-exit-buttons">
							<button className="bp-btn bp-btn-primary" onClick={exitBigPicture}>
								{gamepadConnected && <span className="bp-btn-icon">Ⓐ</span>} {t("yes") || "Yes"}
							</button>
							<button className="bp-btn bp-btn-secondary" onClick={() => setShowExitConfirm(false)}>
								{gamepadConnected && <span className="bp-btn-icon">Ⓑ</span>} {t("no") || "No"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ── HOME VIEW ── */}
			{!showDetail && (
				<div className="sd-home-view">
					{/* Menu mode tabs */}
					<div className="bp-menu-tabs">
						<button
							className={`bp-menu-tab${menuMode === "recent" ? " active" : ""}`}
							onClick={() => { setMenuMode("recent"); setSelectedIndex(0); scrollSelectedIntoView(0); }}
						>
							<Clock size={14} /> {t("last-played") || "Recent"}
						</button>
						<button
							className={`bp-menu-tab${menuMode === "all" ? " active" : ""}`}
							onClick={() => { setMenuMode("all"); setSelectedIndex(0); scrollSelectedIntoView(0); }}
						>
							<Library size={14} /> {t("all") || "All Games"}
						</button>
					</div>

					{allGames[selectedIndex] && (
						<div className="sd-home-info">
							{allGames[selectedIndex].logo && (
								<img src={allGames[selectedIndex].logo} className="sd-home-logo" alt={allGames[selectedIndex].name} />
							)}
							<h1 className="sd-game-title">{allGames[selectedIndex].name}</h1>
							<div className="sd-game-subtitle">
								<Play size={11} color="#5ba32b" />
								{getTotalTimePlayed(allGames[selectedIndex]) === "0m"
									? "NO PLAYTIME YET"
									: getTotalTimePlayed(allGames[selectedIndex])}
							</div>
						</div>
					)}

					<div className="sd-carousel" id="sd-carousel">
						{allGames.map((game, i) => (
							<div
								key={game.id}
								id={`sd-card-${i}`}
								className={`sd-card${i === selectedIndex ? " selected" : ""}`}
								onClick={() => { 
									setSelectedIndex(i); 
									if (showSearch) { 
										setShowSearch(false); 
										setSearchQuery(""); 
										setLocalFiltered([]); 
									}
									selectCurrentRef.current(); 
								}}
								onMouseEnter={() => { !showDetail && setSelectedIndex(i); scrollSelectedIntoView(i); }}
							>
								<img
									src={i === selectedIndex ? (game.jaquette_horizontal || game.jaquette) : game.jaquette}
									className="sd-card-img"
									alt={game.name}
									loading="lazy"
								/>
								{!game.jaquette && (
									<div className="sd-card-placeholder"><Image size={40} /></div>
								)}
							</div>
						))}
					</div>

					{/* Show All link when in recent mode */}
					{menuMode === "recent" && recentGames.length > 0 && (
						<div className="bp-show-all">
							<button className="bp-show-all-btn" onClick={() => { setMenuMode("all"); setSelectedIndex(0); scrollSelectedIntoView(0); }}>
								{t("all") || "Show All Games"} <ChevronRight size={14} />
							</button>
						</div>
					)}

					{allGames.length === 0 && (
						<div className="bp-empty">
							<span className="bp-empty-icon">📭</span>
							<p>{menuMode === "recent"
								? (t("bigpicture_no_recent") || "No recently played games")
								: (t("bigpicture_no_games") || "No games found")
							}</p>
						</div>
					)}
				</div>
			)}

			{/* ── DETAIL VIEW ── */}
			{showDetail && selectedGame && (
				<div ref={detailViewRef} className="pb-20 sd-detail-view">
					<div className="sd-detail-hero">
						{/* HLTB Panel */}
						<div className="sd-stats-panel">
							{loadingHltb ? (
								<div className="sd-stat-row">
									<span className="sd-stat-hours"><Loader2 size={16} className="animate-spin" /></span>
									<span className="sd-stat-type">LOADING HLTB…</span>
								</div>
							) : (
								<>
									<div className="sd-stat-row">
										<span className="sd-stat-hours">{hltbData.mainStory}</span>
										<span className="sd-stat-type">MAIN STORY</span>
									</div>
									<div className="sd-stat-row">
										<span className="sd-stat-hours">{hltbData.mainExtra}</span>
										<span className="sd-stat-type">MAIN + EXTRAS</span>
									</div>
									<div className="sd-stat-row">
										<span className="sd-stat-hours">{hltbData.completionist}</span>
										<span className="sd-stat-type">COMPLETIONIST</span>
									</div>
									<div className="sd-stat-row">
										<span className="sd-stat-hours">{hltbData.coop}</span>
										<span className="sd-stat-type">CO-OP</span>
									</div>
									<div className="sd-stat-row">
										<span className="sd-stat-hours">{hltbData.versus}</span>
										<span className="sd-stat-type">VERSUS</span>
									</div>
									<div className="sd-stat-row">
										<span className="sd-stat-hours">{hltbData.allStyles}</span>
										<span className="sd-stat-type">ALL STYLES</span>
									</div>
								</>
							)}
						</div>

						{/* Logo / Title */}
						<div className="sd-detail-logo-container">
							{selectedGame.logo
								? <img src={selectedGame.logo} className="sd-detail-logo" alt={selectedGame.name} />
								: <h1 className="sd-detail-logo-text">{selectedGame.name}</h1>
							}
						</div>
					</div>

					<div className="sd-detail-content">
						{/* Action bar */}
						<div className="sd-action-bar">
							<div className="sd-action-left">
								<div className="btn-container">
									{!isGameRunning ? (
										<button className="play-btn" onClick={launchSelected} disabled={launchingGame}>
											<span className="play-content">
												{launchingGame
													? <Loader2 size={24} className="animate-spin" />
													: <Play size={24} />
												}
												Play
											</span>
										</button>
									) : (
										<button className="stop-btn" onClick={launchSelected}>
											<span className="stop-content">
												<Square size={24} /> Stop
											</span>
										</button>
									)}
								</div>

								<div className="sd-stat-block">
									<span className="sd-stat-label">LAST PLAYED</span>
									<span className="sd-stat-val">{getLastPlayed(selectedGame)}</span>
								</div>
								<div className="sd-stat-block">
									<span className="sd-stat-label">PLAY TIME</span>
									<span className="sd-stat-val">{getTotalTimePlayed(selectedGame)}</span>
								</div>
								<div className="sd-stat-block">
									<span className="sd-stat-label">ACHIEVEMENTS</span>
									<span className="sd-stat-val">
										{trophies.unlocked}/{trophies.total}
										{trophies.total > 0 && (
											<div className="sd-progress">
												<div className="sd-progress-fill" style={{ width: `${getTrophyPercent(selectedGame)}%` }} />
											</div>
										)}
									</span>
								</div>
							</div>
						</div>

						{/* Detail tabs */}
						<div className="bp-detail-tabs">
							<button
								className={`bp-detail-tab${detailTab === "details" ? " active" : ""}`}
								onClick={() => setDetailTab("details")}
							>
								{t("game-information") || "Details"}
							</button>
							<button
								className={`bp-detail-tab${detailTab === "achievements" ? " active" : ""}`}
								onClick={() => setDetailTab("achievements")}
							>
								<Trophy size={14} /> {t("achievements") || "Achievements"}
								{achievements.length > 0 && (
									<span className="bp-detail-tab-badge">
										{achievements.filter((a) => a.unlocked === "1" || a.unlocked === "true").length}/{achievements.length}
									</span>
								)}
							</button>
						</div>

						{/* Tab content: Details */}
						{detailTab === "details" && (
							<div className="sd-description-section">
								<div className="sd-description-main">
									<p className="sd-description-text">
										{selectedGame.description || "No description available for this game."}
									</p>
									<div className="sd-game-meta">
										<div>Developer: <span>{selectedGame.developers || "Unknown"}</span></div>
										<div>Publisher: <span>{selectedGame.editors || "Unknown"}</span></div>
										<div>Release Date: <span>{selectedGame.release_date || "Unknown"}</span></div>
										<div>Rating: <span>{selectedGame.rating || "N/A"}</span></div>
										<div>Platforms: <span>{selectedGame.platforms || "Unknown"}</span></div>
										<div>Genres: <span>{selectedGame.genres || "Unknown"}</span></div>
										<div>Styles: <span>{selectedGame.styles || "Unknown"}</span></div>
										<div>Tags: <span>{selectedGame.tags || "—"}</span></div>
										<div>Status: <span>{selectedGame.status || "Unknown"}</span></div>
									</div>

									{/* Media gallery */}
									{((selectedGame.screenshots?.length || 0) > 0 || (selectedGame.videos?.length || 0) > 0) && (
										<div className="sd-media-gallery">
											{(selectedGame.screenshots?.length || 0) > 0 && (
												<div className="sd-media-section">
													<h3 className="sd-media-title">Screenshots</h3>
													<div className="sd-media-list">
														{selectedGame.screenshots.map((shot, i) => (
															<div key={i} className="sd-media-item">
																<img
																	src={shot}
																	alt="screenshot"
																	className="sd-screenshot"
																	loading="lazy"
																	onClick={() => setMediaOverlay({ src: shot, type: "image" })}
																/>
															</div>
														))}
													</div>
												</div>
											)}
											{(selectedGame.videos?.length || 0) > 0 && (
												<div className="sd-media-section">
													<h3 className="sd-media-title">Videos</h3>
													<div className="sd-media-list sd-video-list">
														{selectedGame.videos.map((vid, i) => (
															<div key={i} className="sd-media-item" onClick={() => setMediaOverlay({ src: vid, type: "video" })}>
																<video className="sd-video-thumb" src={vid} muted preload="metadata" />
															</div>
														))}
													</div>
												</div>
											)}
										</div>
									)}
								</div>
							</div>
						)}

						{/* Tab content: Achievements */}
						{detailTab === "achievements" && (
							<div className="sd-description-section">
								{achievements.length > 0 ? (
									<div className="bp-achievements-grid">
										{achievements.map((ach, i) => {
											const isUnlocked = ach.unlocked === "1" || ach.unlocked === "true";
											return (
												<div
													key={i}
													className={`bp-achievement-card${isUnlocked ? " unlocked" : ""}`}
												>
													{ach.image_url_unlocked ? (
														<img
															src={isUnlocked ? ach.image_url_unlocked : (ach.image_url_locked || ach.image_url_unlocked)}
															alt=""
															className="bp-achievement-img"
														/>
													) : (
														<div className="bp-achievement-icon-placeholder">
															<Trophy size={20} />
														</div>
													)}
													<div className="bp-achievement-info">
														<span className="bp-achievement-name">{ach.name || `Achievement ${i + 1}`}</span>
														{ach.description && (
															<span className="bp-achievement-desc">{ach.description}</span>
														)}
													</div>
												</div>
											);
										})}
									</div>
								) : (
									<div className="bp-empty" style={{ padding: "40px 0" }}>
										<Trophy size={48} style={{ opacity: 0.3 }} />
										<p>{t("bigpicture_no_achievements") || "No achievements synced yet."}</p>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			)}

			{/* Media overlay (lightbox) */}
			{mediaOverlay && (
				<div className="sd-media-overlay">
					<div className="sd-media-backdrop" onClick={() => setMediaOverlay(null)} />
					<div className="sd-media-content">
						<button className="sd-media-close" onClick={() => setMediaOverlay(null)}>✕</button>
						{mediaOverlay.type === "image"
							? <img src={mediaOverlay.src} alt="screenshot" />
							: <video src={mediaOverlay.src} controls autoPlay />
						}
					</div>
				</div>
			)}

			{/* Global bottom bar */}
			<div className="sd-global-bottom">
				<div className="sd-bottom-left">
					<div className="sd-pill">METEORIC</div>
				</div>
				{gamepadConnected && (
					<div className="sd-bottom-right">
						{showSearch ? (
							<>
								<div className="sd-hint">
									<div className="sd-hint-icon">◄►</div> NAVIGATE
								</div>
								<div className="sd-hint">
									<div className="sd-hint-icon">A</div> SELECT
								</div>
								<div className="sd-hint">
									<div className="sd-hint-icon">B</div> CLOSE
								</div>
							</>
						) : showDetail ? (
							<>
								<div className="sd-hint">
									<div className="sd-hint-icon">▲▼</div> SCROLL
								</div>
								<div className="sd-hint">
									<div className="sd-hint-icon">LB</div> DETAILS
								</div>
								<div className="sd-hint">
									<div className="sd-hint-icon">RB</div> ACHIEVEMENTS
								</div>
								<div className="sd-hint">
									<div className="sd-hint-icon">B</div> BACK
								</div>
							</>
						) : (
							<>
								{!showDetail && (
									<div className="sd-hint">
										<div className="sd-hint-icon">Y</div> SEARCH
									</div>
								)}
								<div className="sd-hint">
									<div className="sd-hint-icon">▲▼</div> TABS
								</div>
								<div className="sd-hint">
									<div className="sd-hint-icon">◄►</div> NAVIGATE
								</div>
								<div className="sd-hint">
									<div className="sd-hint-icon">A</div> SELECT
								</div>
								<div className="sd-hint">
									<div className="sd-hint-icon">B</div> BACK
								</div>
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
