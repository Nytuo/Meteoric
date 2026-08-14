import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Play,
  Pencil,
  CircleDot,
  Eye,
  EyeOff,
  Trash2,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import type { IGame } from '@/types';
import { useGameStore } from '@/stores/gameStore';
import { useConfirmStore } from '@/stores/confirmStore';
import { db } from '@/lib/db';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from '@/components/ui/context-menu';

interface GameContextMenuProps {
  game: IGame;
  children: ReactNode;
}

export function GameContextMenu({ game, children }: GameContextMenuProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { launchGame, setGame, fetchGames } = useGameStore();
  const { confirm } = useConfirmStore();

  const statuses = [
    t('not-started'),
    t('in-progress'),
    t('completed'),
    t('on-hold'),
    t('dropped'),
    t('platinum'),
  ];

  const handlePlay = async () => {
    const launchId =
      game.game_importer_id && game.importer_id
        ? game.game_importer_id
        : game.id;
    await launchGame(launchId, game.importer_id);
  };

  const handleSetStatus = async (status: string) => {
    const updated = { ...game, status };
    await db.postGame(updated);
    setGame(game.id, updated);
    toast.success(t('the-status-has-been-changed') || 'Status updated');
  };

  const handleToggleHidden = async () => {
    const updated = {
      ...game,
      hidden: game.hidden === 'true' ? 'false' : 'true',
    };
    await db.postGame(updated);
    setGame(game.id, updated);
    toast.success(t('the-hidden-status-has-been-changed'));
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: t('confirm-delete-game') || 'Delete this game?',
      description:
        t('confirm-delete-game-desc') ||
        "This removes the game and its stats/achievements from Meteoric. It won't delete the game's files on disk.",
      confirmLabel: t('delete') || 'Delete',
    });
    if (!ok) return;
    await db.deleteGame(game.id);
    await fetchGames();
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onSelect={handlePlay}>
          <Play className="mr-2 h-4 w-4" />
          {t('play') || 'Play'}
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => navigate(`/edit/${game.id}`)}>
          <Pencil className="mr-2 h-4 w-4" />
          {t('edit') || 'Edit'}
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <CircleDot className="mr-2 h-4 w-4" />
            {t('status') || 'Set status'}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {statuses.map((s) => (
              <ContextMenuItem key={s} onSelect={() => handleSetStatus(s)}>
                {game.status === s && <Check className="mr-2 h-4 w-4" />}
                <span className={game.status === s ? '' : 'ml-6'}>{s}</span>
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuItem onSelect={handleToggleHidden}>
          {game.hidden === 'true' ? (
            <Eye className="mr-2 h-4 w-4" />
          ) : (
            <EyeOff className="mr-2 h-4 w-4" />
          )}
          {game.hidden === 'true'
            ? t('unhide') || 'Unhide'
            : t('hide') || 'Hide'}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onSelect={handleDelete}
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t('delete') || 'Delete'}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
