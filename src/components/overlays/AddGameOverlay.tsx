import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Loader2, Search, PenLine, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { IGDBResults } from '@/components/plugins/IGDBResults';
import { useGameStore } from '@/stores/gameStore';
import { db } from '@/lib/db';
import { createEmptyGame } from '@/types';

interface AddGameOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'name' | 'search';

export function AddGameOverlay({
  open: isOpen,
  onOpenChange,
}: AddGameOverlayProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { fetchGames, searchAPI } = useGameStore();

  const [step, setStep] = useState<Step>('name');
  const [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchedGames, setSearchedGames] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const reset = () => {
    setStep('name');
    setName('');
    setSearchQuery('');
    setSearchedGames([]);
    setSelectedItem(null);
    setLoading(false);
    setStatus('');
  };

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const goToSearch = () => {
    if (!name.trim()) return;
    setSearchQuery(name.trim());
    setSearchedGames([]);
    setSelectedItem(null);
    setStep('search');
  };

  const runSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSelectedItem(null);
    try {
      const result = await searchAPI(searchQuery.trim(), 'igdb', false);
      setSearchedGames(result);
      if (result.length === 0) toast.error(t('noIgdbMatches'));
    } catch (e: any) {
      toast.error(e?.message ?? String(e));
      setSearchedGames([]);
    } finally {
      setSearching(false);
    }
  };

  const addManually = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setStatus(t('insertingTheGameIntoTheDatabase'));

    const game = createEmptyGame();
    game.name = name.trim();
    game.sort_name = name.trim().toLowerCase();

    const id = await db.postGame(game);
    await fetchGames();
    close();
    navigate(`/edit/${id}`);
  };

  const addSelectedMatch = async () => {
    if (!selectedItem) return;
    setLoading(true);

    const game = createEmptyGame();
    game.name = name.trim();
    game.sort_name = name.trim().toLowerCase();

    setStatus(t('insertingTheGameIntoTheDatabase'));
    const id = await db.postGame(game);

    const igdbResult = { ...selectedItem, id };
    setStatus(
      `${t('found')}: ${igdbResult.name} — ${t('ModifyingTheDatabase')}`
    );
    await db.postGame(igdbResult);
    setStatus(t('gameMetadataUpdated'));
    await db.saveMediaToExternalStorage(igdbResult);
    setStatus(t('doneWaitForFinish'));

    await fetchGames();
    close();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) close();
        else onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90vh] w-[min(32rem,calc(100vw_-_2rem))] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('addAGame')}</DialogTitle>
        </DialogHeader>

        {step === 'name' && (
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="game-name">{t('name')}</Label>
              <Input
                id="game-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && goToSearch()}
                placeholder={t('name')}
                className="mt-1"
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button onClick={goToSearch} disabled={loading || !name.trim()}>
                <Search className="mr-2 h-4 w-4" />
                {t('searchIgdb')}
              </Button>
              <Button
                onClick={addManually}
                disabled={loading || !name.trim()}
                variant="outline"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PenLine className="mr-2 h-4 w-4" />
                )}
                {t('addManually')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('addManuallyHint')}
            </p>

            {loading && (
              <div className="space-y-2 rounded-lg border border-border bg-card/50 p-4">
                <p className="text-sm text-muted-foreground">
                  {t('adding_game_pls_wait')}
                </p>
                <Progress value={undefined} className="h-1.5" />
                <p className="text-xs text-muted-foreground">{status}</p>
              </div>
            )}
          </div>
        )}

        {step === 'search' && (
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="game-search-query">{t('search-a-game')}</Label>
              <Input
                id="game-search-query"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                className="mt-1"
                disabled={loading}
                autoFocus
              />
              <Button
                onClick={runSearch}
                disabled={searching || loading || !searchQuery.trim()}
                className="mt-2 w-full"
              >
                {searching ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-1 h-4 w-4" />
                )}
                {t('search')}
              </Button>
            </div>

            {searchedGames.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t('selectTheGameYouWantToAdd')}
              </p>
            )}
            <IGDBResults
              results={searchedGames}
              onSelect={setSelectedItem}
              selectedItem={selectedItem}
            />

            <div className="flex flex-col gap-2">
              <Button
                onClick={addSelectedMatch}
                disabled={loading || !selectedItem}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {t('add')}
              </Button>
              <Button
                onClick={addManually}
                variant="outline"
                disabled={loading}
              >
                <PenLine className="mr-2 h-4 w-4" />
                {t('addManually')}
              </Button>
              <Button
                onClick={() => setStep('name')}
                variant="ghost"
                disabled={loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('back')}
              </Button>
            </div>

            {loading && (
              <div className="space-y-2 rounded-lg border border-border bg-card/50 p-4">
                <p className="text-sm text-muted-foreground">
                  {t('adding_game_pls_wait')}
                </p>
                <Progress value={undefined} className="h-1.5" />
                <p className="text-xs text-muted-foreground">{status}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
