interface IGDBResultsProps {
  results: any[];
  onSelect: (item: any) => void;
  selectedItem?: any;
}

export function IGDBResults({
  results,
  onSelect,
  selectedItem,
}: IGDBResultsProps) {
  if (!results || results.length === 0) return null;

  return (
    <div className="max-h-96 overflow-y-auto rounded-lg border border-border">
      <div className="space-y-1 p-2">
        {results.map((game: any, i: number) => {
          const isSelected =
            selectedItem &&
            selectedItem.name === game.name &&
            selectedItem.release_date === game.release_date;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(game)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                isSelected ? 'bg-primary/20 ring-1 ring-primary' : ''
              }`}
            >
              {game.jaquette ? (
                <img
                  src={game.jaquette}
                  alt=""
                  className="h-16 w-12 shrink-0 rounded object-cover"
                />
              ) : (
                <div className="h-16 w-12 shrink-0 rounded bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{game.name}</p>
                {game.release_date && (
                  <p className="text-xs text-muted-foreground">
                    {game.release_date}
                  </p>
                )}
                {game.platforms && (
                  <p className="truncate text-xs text-muted-foreground">
                    {game.platforms}
                  </p>
                )}
              </div>
              {isSelected && (
                <span className="shrink-0 rounded bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
