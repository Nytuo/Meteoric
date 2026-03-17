import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/stores/settingsStore';
import { Badge } from '@/components/ui/badge';
import { Gamepad2 } from 'lucide-react';
import type { IGame } from '@/types';
import { cn } from '@/lib/utils';

interface GameCardProps {
  game: IGame;
}

export function GameCard({ game }: GameCardProps) {
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const displayInfo = settings.displayInfo || 'name';
  const zoom = settings.zoom || 14;
  const [imgError, setImgError] = useState(false);

  const parsedTags = game.tags
    ? game.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return (
    <div
      onClick={() => navigate(`/game/${game.id}`)}
      className="group relative cursor-pointer overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.03]"
      style={{ width: `${zoom}rem` }}
    >
      {/* Image */}
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muted">
        {imgError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Gamepad2 className="h-12 w-12 text-muted-foreground opacity-40" />
          </div>
        ) : (
          <img
            src={game.jaquette || '/assets/logo.gif'}
            alt={game.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <div className="mt-2 px-1">
        {displayInfo === 'name' && (
          <p className="truncate text-sm font-medium">{game.name}</p>
        )}
        {displayInfo === 'platforms' && (
          <p className="truncate text-xs italic text-muted-foreground">
            {game.platforms}
          </p>
        )}
        {displayInfo === 'rating' && (
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={cn(
                  'h-3 w-3',
                  parseInt(game.rating || '0') >= star
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-muted-foreground'
                )}
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
        )}
        {displayInfo === 'tags' && (
          <div className="flex flex-wrap gap-1">
            {parsedTags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-1 py-0"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
