import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { open } from '@tauri-apps/plugin-dialog';
import { dirname } from '@tauri-apps/api/path';
import { toast } from 'sonner';
import {
  Save,
  Trash2,
  X,
  Eye,
  EyeOff,
  Link,
  Plus,
  Search,
  FileText,
  User,
  Images,
  Play,
  Youtube,
  Monitor,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { useGameStore } from '@/stores/gameStore';
import { useAppStore } from '@/stores/appStore';
import { db, refreshGameLinks } from '@/lib/db';
import type { IGame } from '@/types';
import { IGDBResults } from '@/components/plugins/IGDBResults';
import { SteamGridResults } from '@/components/plugins/SteamGridResults';
import { YTDLResults } from '@/components/plugins/YTDLResults';

export function EditGame() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getGame, setGame, fetchGames, searchAPI, loadGameExtras } =
    useGameStore();
  const { changeSidebarOpen, stopAllAudio, changeBlockUI, downloadYTAudio } =
    useAppStore();

  const [selectedProvider, setSelectedProvider] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedGames, setSearchedGames] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(undefined);
  const [strict, setStrict] = useState(false);
  const [ytUrl, setYtUrl] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const [formData, setFormData] = useState<Record<string, any>>({});

  const game = id ? getGame(id) : undefined;

  const statuses = [
    t('not-started'),
    t('in-progress'),
    t('completed'),
    t('on-hold'),
    t('dropped'),
    t('platinum'),
  ];

  const generalKeys = [
    'name',
    'sort_name',
    'rating',
    'platforms',
    'tags',
    'description',
    'critic_score',
    'genres',
    'styles',
    'release_date',
    'developers',
    'editors',
  ];
  const statKeys = ['status', 'trophies_unlocked'];
  const execKeys = ['exec_file', 'game_dir', 'exec_args'];

  useEffect(() => {
    changeSidebarOpen(false);
    stopAllAudio();
    if (game) {
      setSearchQuery(game.name);
      setFormData({ ...game });

      if (id) loadGameExtras(id);
    }
    return () => {
      changeSidebarOpen(true);
    };
  }, [id]);

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const saveGeneral = async () => {
    if (!id || !game) return;
    changeBlockUI(true);
    const updated = { ...game };
    for (const key of generalKeys) {
      (updated as any)[key] = formData[key] ?? (game as any)[key];
    }
    await db.postGame(updated);
    setGame(id, updated);
    await fetchGames();
    toast.success(t('the-change-has-been-saved'));
    changeBlockUI(false);
  };

  const saveStat = async () => {
    if (!id || !game) return;
    const updated = { ...game };
    for (const key of statKeys) {
      (updated as any)[key] = formData[key] ?? (game as any)[key];
    }
    updated.stats = formData.stats || game.stats;
    const newId = await db.postGame(updated);
    setGame(id, updated);
    await fetchGames();
    toast.success(t('the-change-has-been-saved'));
    navigate(`/game/${newId}`);
  };

  const saveExec = async () => {
    if (!id || !game) return;
    const updated = { ...game };
    for (const key of execKeys) {
      (updated as any)[key] = formData[key] ?? (game as any)[key];
    }
    await db.postGame(updated);
    setGame(id, updated);
    await fetchGames();
    toast.success(t('the-change-has-been-saved'));
  };

  const linkGame = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: 'Executables', extensions: ['exe', 'bat', 'sh'] }],
    });
    if (!selected || !id || !game) return;
    const updated = { ...game };
    updated.exec_file = selected.toString();
    updated.game_dir = await dirname(selected.toString());
    updated.exec_args = '';
    await db.postGame(updated);
    setGame(id, updated);
    setFormData((prev) => ({
      ...prev,
      exec_file: updated.exec_file,
      game_dir: updated.game_dir,
      exec_args: '',
    }));
    toast.success(t('the-game-has-been-linked'));
  };

  const deleteGame = async () => {
    if (!id) return;
    await db.deleteGame(id);
    await fetchGames();
    navigate('/games');
  };

  const toggleHidden = async () => {
    if (!id || !game) return;
    const updated = {
      ...game,
      hidden: game.hidden === 'true' ? 'false' : 'true',
    };
    await db.postGame(updated);
    setGame(id, updated);
    setFormData((prev) => ({ ...prev, hidden: updated.hidden }));
    toast.success(t('the-hidden-status-has-been-changed'));
  };

  const onFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: string
  ) => {
    const file = e.target.files?.[0];
    if (!file || !id || !game) {
      toast.error(t('no-file-selected'));
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const buf = reader.result;
      if (!buf || typeof buf === 'string') return;
      await db.uploadFile(buf, type, id);
      const refreshed = await refreshGameLinks(game);
      setFormData({ ...refreshed });
      setGame(id, refreshed);
    };
    reader.readAsArrayBuffer(file);
  };

  const deleteScreenshot = async (path: string) => {
    if (!game || !id) return;
    const idx = game.screenshots.indexOf(path);
    const ssId = path.split('screenshot-')[1]?.split('.')[0];
    await db.deleteElement('screenshot', id, ssId);
    game.screenshots.splice(idx, 1);
    setGame(id, game);
    setFormData((prev) => ({ ...prev, screenshots: [...game.screenshots] }));
    toast.success(t('the-screenshot-has-been-deleted'));
  };

  const deleteVideo = async (path: string) => {
    if (!game || !id) return;
    const idx = game.videos.indexOf(path);
    const vidId = path.split('video-')[1]?.split('.')[0];
    await db.deleteElement('video', id, vidId);
    game.videos.splice(idx, 1);
    setGame(id, game);
    setFormData((prev) => ({ ...prev, videos: [...game.videos] }));
    toast.success(t('the-video-has-been-deleted'));
  };

  const deleteBackgroundMusic = async () => {
    if (!game || !id) return;
    await db.deleteElement('audio', id);
    toast.success(t('the-audio-has-been-deleted'));
  };

  const searchYTBGMusic = async () => {
    if (!ytUrl || !game || !id) return;
    await downloadYTAudio(ytUrl, id);
    const refreshed = await refreshGameLinks(game);
    setFormData({ ...refreshed });
    setGame(id, refreshed);
  };

  const searchGameInAPI = async () => {
    if (!searchQuery) return;
    const result = await searchAPI(searchQuery, selectedProvider, strict, game);
    if (!result) {
      toast.error('No results');
      return;
    }
    if (typeof result === 'string') {
      toast.error(result);
      return;
    }
    setSearchedGames(result);
  };

  const selectItem = async (overrideItem?: any) => {
    const item = overrideItem ?? selectedItem;
    if (!item || !id) {
      toast.error(t('no-file-selected'));
      return;
    }
    changeBlockUI(true);
    item.id = id;
    if (selectedProvider === 'ytdl') {
      setYtUrl(item.url);
      await downloadYTAudio(item.url, id);
      const refreshed = await refreshGameLinks(game!);
      setFormData({ ...refreshed });
      setGame(id, refreshed);
      changeBlockUI(false);
      return;
    }
    if (selectedProvider === 'steam_grid') {
      await db.saveMediaToExternalStorage(item);
      const refreshed = await refreshGameLinks(game!);
      setFormData({ ...refreshed });
      setGame(id, refreshed);
      await fetchGames();
      changeBlockUI(false);
      return;
    }
    setFormData({ ...item });
    await db.postGame(item);
    await fetchGames();
    await db.saveMediaToExternalStorage(item);
    const refreshed = await refreshGameLinks(item);
    setFormData({ ...refreshed });
    setGame(id, refreshed);
    changeBlockUI(false);
    toast.success(t('the-metadata-has-been-saved-for') + item.name);
  };

  const addSession = () => {
    const stats = formData.stats || [];
    stats.push({
      date_of_play: new Date(),
      time_played: '0',
      id: (stats.length + 1).toString(),
      game_id: id,
    });
    setFormData((prev) => ({ ...prev, stats: [...stats] }));
  };

  const deleteSession = (sessionId: string) => {
    const stats = (formData.stats || []).filter((s: any) => s.id !== sessionId);
    setFormData((prev) => ({ ...prev, stats }));
  };

  const menuItems = [
    {
      label: t('game-information'),
      items: [
        {
          label: t('general'),
          icon: <FileText className="h-4 w-4" />,
          key: 'general',
        },
        {
          label: t('personal'),
          icon: <User className="h-4 w-4" />,
          key: 'personal',
        },
        {
          label: t('media'),
          icon: <Images className="h-4 w-4" />,
          key: 'media',
        },
        {
          label: t('execution'),
          icon: <Play className="h-4 w-4" />,
          key: 'exec',
        },
      ],
    },
    {
      label: t('metadata-providers'),
      items: [
        {
          label: t('youtube-background-music-provider'),
          icon: <Youtube className="h-4 w-4" />,
          key: 'ytdl',
        },
        {
          label: t('steam-grid-db-provider'),
          icon: <Monitor className="h-4 w-4" />,
          key: 'steam_grid',
        },
        {
          label: t('igdb-provider'),
          icon: <Globe className="h-4 w-4" />,
          key: 'igdb',
        },
      ],
    },
  ];

  const isProviderSearch = ['igdb', 'ytdl', 'steam_grid'].includes(
    selectedProvider
  );

  return (
    <div className="flex h-full">
      <div className="w-60 shrink-0 border-r border-border bg-card/50 p-4">
        <p className="mb-3 text-xs text-muted-foreground">
          {t('editing-currentgame-name')}{' '}
          <span className="font-medium text-foreground">{game?.name}</span>
        </p>
        <Accordion type="multiple" defaultValue={['0', '1']}>
          {menuItems.map((section, i) => (
            <AccordionItem key={i} value={i.toString()}>
              <AccordionTrigger className="text-sm">
                {section.label}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => {
                        setSelectedProvider(item.key);
                        setSearchedGames([]);
                        setShowSearch(
                          isProviderSearch ||
                            ['ytdl', 'steam_grid', 'igdb'].includes(item.key)
                        );
                      }}
                      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors hover:bg-accent ${selectedProvider === item.key ? 'bg-accent' : ''}`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Separator className="my-4" />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/game/${id}`)}
          >
            <X className="mr-1 h-3 w-3" /> {t('close')}
          </Button>
          <Button variant="destructive" size="sm" onClick={deleteGame}>
            <Trash2 className="mr-1 h-3 w-3" /> {t('delete')}
          </Button>
        </div>
        <Button
          variant={formData.hidden === 'true' ? 'secondary' : 'destructive'}
          size="sm"
          className="mt-2 w-full"
          onClick={toggleHidden}
        >
          {formData.hidden === 'true' ? (
            <Eye className="mr-1 h-3 w-3" />
          ) : (
            <EyeOff className="mr-1 h-3 w-3" />
          )}
          {formData.hidden === 'true' ? 'Show' : 'Hide'}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">
          {['igdb', 'ytdl', 'steam_grid'].includes(selectedProvider) && (
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <Label htmlFor="searchGame">{t('search-a-game')}</Label>
                  <Input
                    id="searchGame"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchGameInAPI()}
                    className="mt-1"
                  />
                </div>
                <Button onClick={searchGameInAPI} className="mt-6">
                  <Search className="mr-1 h-4 w-4" /> {t('search')}
                </Button>
                <div className="mt-6 flex items-center gap-2">
                  <Checkbox
                    id="strict"
                    checked={strict}
                    onCheckedChange={(v) => setStrict(!!v)}
                  />
                  <Label htmlFor="strict">{t('strict')}</Label>
                </div>
                {selectedProvider !== 'ytdl' && (
                  <Button
                    onClick={() => selectItem()}
                    className="mt-6"
                    variant="secondary"
                  >
                    {t('select')}
                  </Button>
                )}
              </div>

              {selectedProvider === 'igdb' && (
                <IGDBResults
                  results={searchedGames}
                  onSelect={setSelectedItem}
                  selectedItem={selectedItem}
                />
              )}
              {selectedProvider === 'steam_grid' && (
                <SteamGridResults
                  results={searchedGames}
                  onSelect={(item) => selectItem(item)}
                />
              )}
              {selectedProvider === 'ytdl' && (
                <YTDLResults
                  results={searchedGames}
                  onSelect={(item) => selectItem(item)}
                />
              )}
            </div>
          )}

          {selectedProvider === 'general' && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">
                {t('general-info')}
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {generalKeys.map((key) => (
                  <div key={key}>
                    <Label htmlFor={key}>{key}</Label>
                    <Input
                      id={key}
                      value={formData[key] || ''}
                      onChange={(e) => updateField(key, e.target.value)}
                      className="mt-1"
                    />
                    {key === 'tags' && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t('tags-are-separated-by-commas')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <Button onClick={saveGeneral} className="mt-6">
                <Save className="mr-1 h-4 w-4" /> {t('save')}
              </Button>
            </div>
          )}

          {selectedProvider === 'personal' && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">
                {t('personal-stats')}
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="trophies_unlocked">trophies_unlocked</Label>
                  <Input
                    id="trophies_unlocked"
                    value={formData.trophies_unlocked || ''}
                    onChange={(e) =>
                      updateField('trophies_unlocked', e.target.value)
                    }
                    className="mt-1 max-w-xs"
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status || ''}
                    onValueChange={(v) => updateField('status', v)}
                  >
                    <SelectTrigger className="mt-1 max-w-xs">
                      <SelectValue placeholder={t('select-a-status')} />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium">Sessions</h3>
                  {(formData.stats || []).map((session: any, i: number) => (
                    <div
                      key={session.id || i}
                      className="mb-3 flex items-center gap-3"
                    >
                      <div>
                        <Label>{t('time-played')}</Label>
                        <Input
                          value={session.time_played || ''}
                          onChange={(e) => {
                            const stats = [...(formData.stats || [])];
                            stats[i] = {
                              ...stats[i],
                              time_played: e.target.value,
                            };
                            updateField('stats', stats);
                          }}
                          className="mt-1 w-32"
                        />
                      </div>
                      <div>
                        <Label>{t('date-of-play')}</Label>
                        <Input
                          type="datetime-local"
                          value={session.date_of_play || ''}
                          onChange={(e) => {
                            const stats = [...(formData.stats || [])];
                            stats[i] = {
                              ...stats[i],
                              date_of_play: e.target.value,
                            };
                            updateField('stats', stats);
                          }}
                          className="mt-1 w-56"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="mt-5 rounded-full"
                        onClick={() => deleteSession(session.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addSession}>
                    <Plus className="mr-1 h-3 w-3" /> Add Session
                  </Button>
                </div>
              </div>
              <Button onClick={saveStat} className="mt-6">
                <Save className="mr-1 h-4 w-4" /> {t('save')}
              </Button>
            </div>
          )}

          {selectedProvider === 'media' && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">{t('media')}</h2>
              <div className="space-y-8">
                <div>
                  <h3 className="mb-2 text-sm font-medium">
                    {t('background')}
                  </h3>
                  {formData.background && (
                    <img
                      src={formData.background}
                      alt=""
                      className="mb-2 h-32 rounded-lg object-cover"
                    />
                  )}
                  <input
                    type="file"
                    onChange={(e) => onFileSelected(e, 'background')}
                    className="text-xs"
                  />
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium">{t('jaquette')}</h3>
                  {formData.jaquette && (
                    <img
                      src={formData.jaquette}
                      alt=""
                      className="mb-2 h-40 rounded-lg object-cover"
                    />
                  )}
                  <input
                    type="file"
                    onChange={(e) => onFileSelected(e, 'jaquette')}
                    className="text-xs"
                  />
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium">{t('logo')}</h3>
                  {formData.logo && (
                    <img
                      src={formData.logo}
                      alt=""
                      className="mb-2 h-32 rounded-lg object-contain"
                    />
                  )}
                  <input
                    type="file"
                    onChange={(e) => onFileSelected(e, 'logo')}
                    className="text-xs"
                  />
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium">{t('icon')}</h3>
                  {formData.icon && (
                    <img
                      src={formData.icon}
                      alt=""
                      className="mb-2 h-20 rounded-lg object-contain"
                    />
                  )}
                  <input
                    type="file"
                    onChange={(e) => onFileSelected(e, 'icon')}
                    className="text-xs"
                  />
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium">
                    {t('screenshots')}
                  </h3>
                  <input
                    type="file"
                    onChange={(e) => onFileSelected(e, 'screenshot')}
                    className="mb-2 text-xs"
                  />
                  <div className="flex flex-wrap gap-3">
                    {(formData.screenshots || []).map(
                      (ss: string, i: number) => (
                        <div key={i} className="group relative">
                          <img
                            src={ss}
                            alt=""
                            className="h-32 rounded-lg object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -right-2 -top-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100"
                            onClick={() => deleteScreenshot(ss)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium">
                    {t('background-music')}
                  </h3>
                  <input
                    type="file"
                    onChange={(e) => onFileSelected(e, 'audio')}
                    className="mb-2 text-xs"
                  />
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder={t('youtube-video-url')}
                      value={ytUrl}
                      onChange={(e) => setYtUrl(e.target.value)}
                      className="max-w-sm"
                    />
                    <Button size="icon" onClick={searchYTBGMusic}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={deleteBackgroundMusic}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.backgroundMusic && (
                    <audio
                      controls
                      src={formData.backgroundMusic}
                      className="mt-2"
                    />
                  )}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium">{t('video')}</h3>
                  <input
                    type="file"
                    onChange={(e) => onFileSelected(e, 'video')}
                    className="mb-2 text-xs"
                  />
                  {(formData.videos || []).map((vid: string, i: number) => (
                    <div key={i} className="group relative mb-3">
                      <video
                        controls
                        src={vid}
                        className="max-w-md rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -right-2 -top-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100"
                        onClick={() => deleteVideo(vid)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedProvider === 'exec' && (
            <div>
              <h2 className="mb-4 text-xl font-semibold">{t('execution')}</h2>
              <Button
                onClick={linkGame}
                className="mb-4 bg-purple-600 hover:bg-purple-700"
              >
                <Link className="mr-1 h-4 w-4" /> {t('link-0')}
              </Button>
              <div className="space-y-4">
                {execKeys.map((key) => (
                  <div key={key}>
                    <Label htmlFor={key}>{key}</Label>
                    <Input
                      id={key}
                      value={formData[key] || ''}
                      onChange={(e) => updateField(key, e.target.value)}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
              <Button onClick={saveExec} className="mt-6">
                <Save className="mr-1 h-4 w-4" /> {t('save')}
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
