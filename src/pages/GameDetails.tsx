import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import * as simpleIcons from "simple-icons";
import type { SimpleIcon } from "simple-icons";
import { useGameStore } from "@/stores/gameStore";
import { useAppStore } from "@/stores/appStore";
import { useTauriEventStore } from "@/stores/tauriEvents";
import { useEpicStore } from "@/stores/epicStore";
import { useGogStore } from "@/stores/gogStore";
import { useSteamStore } from "@/stores/steamStore";
import { db } from "@/lib/db";
import { InfoCard } from "@/components/game/InfoCard";
import { toParsedTime } from "@/lib/utils";
import {
    ChevronLeft, ChevronRight, ChevronDown, BookOpen, Swords, Trophy,
    Clock, Users, Gamepad2, Cloud, CloudUpload, CloudDownload, RefreshCw, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function determinePlatformSvg(platforms: string): { type: "svg"; svg: string; } | { type: "img"; src: string; } | null {
    if (!platforms) return null;
    if (platforms === "Xbox") return { type: "img", src: "/platforms/xbox.svg" };
    const searchLower = platforms.toLowerCase().replace(/[^a-z0-9]/g, "");
    const found = (Object.values(simpleIcons) as SimpleIcon[]).find(
        (icon) =>
            icon.title?.toLowerCase().replace(/[^a-z0-9]/g, "") === searchLower ||
            icon.slug?.toLowerCase().replace(/[^a-z0-9]/g, "") === searchLower,
    );
    if (found) return { type: "svg", svg: found.svg };
    return null;
}

function transformHltbTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

type HltbData = {
    mainStory: string; mainExtra: string; completionist: string;
    allStyles: string; coop: string; versus: string;
};
const emptyHltb: HltbData = {
    mainStory: "N/A", mainExtra: "N/A", completionist: "N/A",
    allStyles: "N/A", coop: "N/A", versus: "N/A",
};

export function GameDetails() {
    const { id } = useParams<{ id: string; }>();
    const { t } = useTranslation();
    const { getGame, setCurrentGame, fetchAchievements, achievements, setGame, autoDownloadBGMusic, loadGameExtras } = useGameStore();
    const { achievementsVisible, toggleAchievementsVisible, playBGMusic, stopBGMusic } = useAppStore();
    const {
        fetchInstalledGames, fetchDownloadableGames,
        downloadableGames,
        checkCloudSaves, uploadSaves, downloadSaves, syncAchievements,
    } = useEpicStore();
    const {
        fetchInstalledGames: fetchGogInstalledGames,
        fetchDownloadableGames: fetchGogDownloadableGames,
        checkCloudSaves: gogCheckCloudSaves,
        uploadSaves: gogUploadSaves,
        downloadSaves: gogDownloadSaves,
        syncAchievements: gogSyncAchievements,
    } = useGogStore();
    const {
        syncAchievements: steamSyncAchievements,
    } = useSteamStore();

    const [scrollY, setScrollY] = useState(0);
    const [imageIndex, setImageIndex] = useState(0);
    const [videoIndex, setVideoIndex] = useState(0);
    const [showLaunchAnim, setShowLaunchAnim] = useState(false);
    const [hltbData, setHltbData] = useState<HltbData>(emptyHltb);
    const [loadingHltb, setLoadingHltb] = useState(false);
    const [gamePID, setGamePID] = useState(0);
    const [cloudInfo, setCloudInfo] = useState<any>(null);
    const [cloudLoading, setCloudLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { gameLaunchMessage } = useTauriEventStore();

    const game = id ? getGame(id) : undefined;

    const isEpic = game?.importer_id === "epic";
    // exec_args is "epic:{app_name}:{namespace}:{catalog_item_id}" for Epic games
    const epicAppName = isEpic && game?.exec_args ? (game.exec_args.split(":")[1] ?? "") : "";
    const epicNamespace = isEpic && game?.exec_args ? (game.exec_args.split(":")[2] ?? "") : "";
    const epicEntry = isEpic ? downloadableGames.find((g) => g.app_name === epicAppName) ?? null : null;

    const isGog = game?.importer_id === "gog";
    // exec_args is "gog:{game_id}" for GOG games
    const gogGameId = isGog && game?.exec_args ? (game.exec_args.split(":")[1] ?? "") : "";

    const isSteam = game?.importer_id === "steam";
    // game_importer_id is the Steam app ID for Steam games
    const steamAppId = isSteam && game?.game_importer_id ? game.game_importer_id : "";

    const statuses = [
        t("not-started"), t("in-progress"), t("completed"),
        t("on-hold"), t("dropped"), t("platinum"),
    ];

    const handleRatingChange = async (star: number) => {
        if (!id || !game) return;
        const updated = { ...game, rating: String(star) };
        await db.postGame(updated);
        setGame(id, updated);
    };

    const handleStatusChange = async (val: string) => {
        if (!id || !game) return;
        const updated = { ...game, status: val };
        await db.postGame(updated);
        setGame(id, updated);
    };

    const fetchHLTB = useCallback(async (name: string) => {
        setLoadingHltb(true);
        setHltbData(emptyHltb);
        try {
            const res = await invoke<string>("search_hltb", { gameName: name });
            const d = JSON.parse(res);
            const fmt = (s?: number) => (s ? transformHltbTime(s) : "N/A");
            setHltbData({
                mainStory: fmt(d.main_story?.average),
                mainExtra: fmt(d.main_extra?.average),
                completionist: fmt(d.completionist?.average),
                allStyles: fmt(d.all_styles?.average),
                coop: fmt(d.co_op?.average),
                versus: fmt(d.vs?.average),
            });
        } catch {
            setHltbData(emptyHltb);
        }
        setLoadingHltb(false);
    }, []);

    useEffect(() => {
        if (!id || !game) return;
        setCurrentGame(game);
        setScrollY(0);
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
        fetchAchievements(id);
        
        // Load screenshots, videos, and background music for this game
        loadGameExtras(id).then(() => {
            // After loading extras, check for background music
            const updated = getGame(id);
            if (updated?.backgroundMusic) {
                playBGMusic(updated.backgroundMusic);
            } else {
                // If still not found, try to download it
                autoDownloadBGMusic(game).then(() => {
                    const refreshed = getGame(id);
                    if (refreshed?.backgroundMusic) {
                        playBGMusic(refreshed.backgroundMusic);
                    }
                });
            }
        });
        
        fetchHLTB(game.name);
        if (isEpic) {
            fetchInstalledGames();
            fetchDownloadableGames();
            setCloudLoading(true);
            checkCloudSaves(epicAppName)
                .then(setCloudInfo)
                .catch(() => null)
                .finally(() => setCloudLoading(false));
        }
        if (isGog) {
            fetchGogInstalledGames();
            fetchGogDownloadableGames();
            setCloudLoading(true);
            gogCheckCloudSaves(gogGameId)
                .then(setCloudInfo)
                .catch(() => null)
                .finally(() => setCloudLoading(false));
        }
        return () => { stopBGMusic(); };
    }, [id]);

    useEffect(() => {
        if (gameLaunchMessage.gamePID > 0 && !gameLaunchMessage.isEnded) {
            setGamePID(gameLaunchMessage.gamePID);
            setShowLaunchAnim(true);
            const timer = setTimeout(() => setShowLaunchAnim(false), 3000);
            return () => clearTimeout(timer);
        } else if (gameLaunchMessage.isEnded) {
            setGamePID(0);
            setShowLaunchAnim(false);
        }
    }, [gameLaunchMessage]);

    if (!game) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">{t("game-not-found")}</p>
            </div>
        );
    }

    const totalTimePlayed = toParsedTime(
        Math.floor((game.stats?.reduce((acc, s) => acc + parseInt(s.time_played || "0"), 0) || 0) / 60000)
    );
    const lastTimePlayed = game.stats?.length
        ? game.stats.reduce((a, b) => (new Date(a.date_of_play) > new Date(b.date_of_play) ? a : b)).date_of_play?.toLocaleString?.() || "N/A"
        : "N/A";
    const gameTags = game.tags || t("no-tags");
    const platformIcon = determinePlatformSvg(game.platforms || "");
    const rating = parseInt(game.rating || "0");
    const screenshots = game.screenshots || [];
    const videos = game.videos || [];

    const bgOpacity = Math.max(0.1, 0.65 - (scrollY / 500) * 0.55);
    const heroOpacity = Math.max(0, 1 - scrollY / 300);

    const hltbItems = [
        { label: "Main Story", value: hltbData.mainStory, Icon: BookOpen },
        { label: "Main + Extras", value: hltbData.mainExtra, Icon: Swords },
        { label: "Completionist", value: hltbData.completionist, Icon: Trophy },
        { label: "All Styles", value: hltbData.allStyles, Icon: Clock, hide: hltbData.allStyles === "N/A" },
        { label: "Co-op", value: hltbData.coop, Icon: Users, hide: hltbData.coop === "N/A" },
        { label: "Versus", value: hltbData.versus, Icon: Gamepad2, hide: hltbData.versus === "N/A" },
    ].filter((it) => !(it as any).hide);

    return (
        <div className="relative h-full overflow-hidden">
            {game.background && (
                <img
                    src={game.background}
                    alt=""
                    style={{ opacity: bgOpacity }}
                    className="absolute inset-0 h-full w-full object-cover transition-opacity duration-75"
                />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

            <div
                ref={scrollRef}
                onScroll={() => setScrollY(scrollRef.current?.scrollTop ?? 0)}
                className="relative h-full overflow-y-auto"
            >
                {/* Hero */}
                <div
                    className="relative flex h-screen flex-col items-center justify-end pb-12"
                    style={{ opacity: heroOpacity }}
                >
                    {game.logo ? (
                        <img
                            src={game.logo}
                            alt={game.name}
                            className="max-h-[240px] max-w-[520px] object-contain drop-shadow-2xl"
                        />
                    ) : (
                        <h1 className="text-5xl font-bold tracking-tight drop-shadow-2xl">{game.name}</h1>
                    )}

                    <div className="mt-8 flex animate-bounce flex-col items-center text-white/40">
                        <ChevronDown className="h-6 w-6" />
                    </div>
                </div>

                {/* Details */}
                <div className="min-h-screen px-8 pb-16 pt-10">
                    <div className="mb-6 flex flex-wrap items-center gap-4">
                        <h1 className="text-3xl font-bold tracking-tight">{game.name}</h1>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1">
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => handleRatingChange(star === rating ? 0 : star)}
                                            className="cursor-pointer transition-transform hover:scale-110"
                                        >
                                            <svg
                                                className={`h-5 w-5 ${rating >= star ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted-foreground/30"}`}
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                                {rating > 0 && <span className="text-xs font-semibold text-yellow-400">{rating}/5</span>}
                            </div>
                            {platformIcon && (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border/50 bg-muted/40 p-1">
                                    {platformIcon.type === "svg" ? (
                                        <div
                                            className="h-full w-full [&>svg]:h-full [&>svg]:w-full [&>svg]:fill-foreground"
                                            dangerouslySetInnerHTML={{ __html: platformIcon.svg }}
                                        />
                                    ) : (
                                        <img src={platformIcon.src} alt={game.platforms || ""} className="h-full w-full dark:invert" />
                                    )}
                                </div>
                            )}
                            <Select value={game.status || ""} onValueChange={handleStatusChange}>
                                <SelectTrigger className="h-8 w-auto min-w-[120px] rounded-full border-border/50 bg-muted/40 text-xs">
                                    <SelectValue placeholder="Set status…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map((s) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="mb-8 grid grid-cols-4 gap-4">
                        <InfoCard icon="clock" color="green" title={t("total-time-played") || "Total Time Played"} description={totalTimePlayed || "0"} />
                        <InfoCard icon="trophy" color="orange" title={t("trophies-unlocked") || "Trophies Unlocked"} description={game.trophies_unlocked || "0"} />
                        <InfoCard icon="calendar" color="red" title={t("last-time-played") || "Last Time Played"} description={lastTimePlayed} />
                        <InfoCard icon="tag" color="blue" title={t("tags") || "Tags"} description={gameTags} />
                    </div>

                    <div className="mb-8">
                        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">How Long to Beat</h3>
                        {loadingHltb ? (
                            <div className="grid grid-cols-3 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/40" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-4">
                                {hltbItems.map(({ label, value, Icon }) => (
                                    <div key={label} className="flex items-center gap-3 rounded-xl border bg-muted/20 p-4">
                                        <div className="rounded-lg bg-background/50 p-2 text-primary">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">{label}</p>
                                            <p className="text-base font-bold">{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {game.description && (
                        <div className="mb-8">
                            <p className="text-sm leading-relaxed text-muted-foreground">{game.description}</p>
                        </div>
                    )}

                    <div className="mb-8 grid grid-cols-2 gap-x-12 gap-y-1">
                        {[
                            { label: t("critics-score"), value: game.critic_score },
                            { label: t("genres-0"), value: game.genres },
                            { label: t("styles"), value: game.styles },
                            { label: t("release-date-0"), value: game.release_date },
                            { label: t("developers"), value: game.developers },
                            { label: t("editors-0"), value: game.editors },
                            { label: t("status-0"), value: game.status },
                        ].map(
                            (item) =>
                                item.value && (
                                    <div key={item.label} className="flex justify-between border-b border-border/40 py-1.5">
                                        <span className="text-xs text-muted-foreground">{item.label}</span>
                                        <span className="text-xs font-medium">{item.value}</span>
                                    </div>
                                )
                        )}
                    </div>

                    {(isEpic || isGog) && (
                        <div className="mb-8">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                <Cloud className="h-4 w-4" /> Cloud Saves
                                <div className="ml-auto flex gap-2">
                                    <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => isEpic ? uploadSaves(epicAppName) : gogUploadSaves(gogGameId, cloudInfo?.local_save_path ?? "")}>
                                        <CloudUpload className="h-3.5 w-3.5" /> Upload
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => isEpic ? downloadSaves(epicAppName) : gogDownloadSaves(gogGameId, cloudInfo?.local_save_path ?? "")}>
                                        <CloudDownload className="h-3.5 w-3.5" /> Download
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Refresh" onClick={() => {
                                        if (!game) return;
                                        setCloudLoading(true);
                                        if (isEpic) {
                                            checkCloudSaves(epicAppName).then(setCloudInfo).catch(() => null).finally(() => setCloudLoading(false));
                                        } else {
                                            gogCheckCloudSaves(gogGameId).then(setCloudInfo).catch(() => null).finally(() => setCloudLoading(false));
                                        }
                                    }}>
                                        <RefreshCw className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </h3>
                            {cloudLoading ? (
                                <div className="flex items-center gap-2 rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Checking cloud save status…
                                </div>
                            ) : cloudInfo ? (
                                <div className="rounded-xl border bg-muted/20 p-4">
                                    <p className="text-sm font-medium">{cloudInfo.status?.replace(/([A-Z])/g, " $1").trim() ?? "Unknown"}</p>
                                    {cloudInfo.local_path && (
                                        <p className="mt-1 text-xs text-muted-foreground">{cloudInfo.local_path}</p>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">No cloud save info available.</div>
                            )}
                        </div>
                    )}

                    {(isEpic || isGog || isSteam || achievements.length > 0) && (
                        <div className="mb-8">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                <Trophy className="h-4 w-4" /> Achievements
                                {achievements.length > 0 && (
                                    <span className="ml-2 text-xs font-normal normal-case">
                                        {achievements.filter((a) => a.unlocked === "1" || a.unlocked === "true").length} / {achievements.length}
                                    </span>
                                )}
                                {isEpic && epicEntry && (
                                    <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1.5 text-xs" onClick={() => syncAchievements(id ?? "", epicAppName, epicEntry?.namespace ?? epicNamespace)}>
                                        <RefreshCw className="h-3.5 w-3.5" /> Sync
                                    </Button>
                                )}
                                {isEpic && !epicEntry && (
                                    <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1.5 text-xs" disabled>
                                        <RefreshCw className="h-3.5 w-3.5" /> Sync
                                    </Button>
                                )}
                                {isGog && gogGameId && (
                                    <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1.5 text-xs" onClick={() => gogSyncAchievements(id ?? "", gogGameId)}>
                                        <RefreshCw className="h-3.5 w-3.5" /> Sync
                                    </Button>
                                )}
                                {isSteam && steamAppId && (
                                    <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1.5 text-xs" onClick={() => steamSyncAchievements(id ?? "", steamAppId)}>
                                        <RefreshCw className="h-3.5 w-3.5" /> Sync
                                    </Button>
                                )}
                            </h3>
                            {achievements.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {achievements.map((ach, i) => {
                                        const isUnlocked = ach.unlocked === "1" || ach.unlocked === "true";
                                        return (
                                            <div
                                                key={i}
                                                className={`flex items-center gap-3 rounded-xl border p-3 ${isUnlocked ? "border-yellow-500/20 bg-yellow-500/5" : "border-border/40 bg-muted/10 opacity-60"
                                                    }`}
                                            >
                                                {ach.image_url_unlocked ? (
                                                    <img
                                                        src={isUnlocked ? ach.image_url_unlocked : (ach.image_url_locked || ach.image_url_unlocked)}
                                                        alt=""
                                                        className="h-10 w-10 shrink-0 rounded"
                                                    />
                                                ) : (
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted">
                                                        <Trophy className={`h-5 w-5 ${isUnlocked ? "text-yellow-400" : "text-muted-foreground"}`} />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-medium">{ach.name || `Achievement ${i + 1}`}</p>
                                                    {ach.description && (
                                                        <p className="truncate text-xs text-muted-foreground">{ach.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No achievements synced yet. Press Sync to load them.</p>
                            )}
                        </div>
                    )}

                    {screenshots.length > 0 && (
                        <div className="mb-8">
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Screenshots</h3>
                            <div className="relative mx-auto max-w-4xl">
                                <img src={screenshots[imageIndex]} alt={`Screenshot ${imageIndex + 1}`} className="w-full rounded-lg object-contain" />
                                {screenshots.length > 1 && (
                                    <div className="absolute inset-y-0 flex w-full items-center justify-between px-2">
                                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full opacity-70 hover:opacity-100"
                                            onClick={() => setImageIndex((i) => Math.max(0, i - 1))} disabled={imageIndex === 0}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full opacity-70 hover:opacity-100"
                                            onClick={() => setImageIndex((i) => Math.min(screenshots.length - 1, i + 1))} disabled={imageIndex === screenshots.length - 1}>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                                <p className="mt-2 text-center text-xs text-muted-foreground">{imageIndex + 1} / {screenshots.length}</p>
                            </div>
                        </div>
                    )}

                    {videos.length > 0 && (
                        <div className="mb-8">
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Videos</h3>
                            <div className="relative mx-auto max-w-4xl">
                                <video key={videoIndex} controls className="w-full rounded-lg">
                                    <source src={videos[videoIndex]} type="video/mp4" />
                                </video>
                                {videos.length > 1 && (
                                    <div className="absolute inset-y-0 flex w-full items-center justify-between px-2">
                                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full opacity-70 hover:opacity-100"
                                            onClick={() => setVideoIndex((i) => Math.max(0, i - 1))} disabled={videoIndex === 0}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full opacity-70 hover:opacity-100"
                                            onClick={() => setVideoIndex((i) => Math.min(videos.length - 1, i + 1))} disabled={videoIndex === videos.length - 1}>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                                <p className="mt-2 text-center text-xs text-muted-foreground">{videoIndex + 1} / {videos.length}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showLaunchAnim && game && (
                <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 animate-pulse bg-black/40 backdrop-blur-sm" style={{ animation: "fadeOut 2.5s forwards" }} />
                    <div className="relative flex flex-col items-center gap-4 rounded-2xl border border-border/50 bg-black/70 px-12 py-8 shadow-2xl backdrop-blur-md" style={{ animation: "scaleIn 0.3s ease-out" }}>
                        {game.logo ? (
                            <img src={game.logo} alt={game.name} className="max-h-28 max-w-52 object-contain drop-shadow-2xl" />
                        ) : (
                            <p className="text-xl font-bold">{game.name}</p>
                        )}
                        <p className="text-sm font-medium text-muted-foreground">Launching…</p>
                        <div className="flex gap-2">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${i * 150}ms` }} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
