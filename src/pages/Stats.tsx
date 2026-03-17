import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ArrowLeft, Clock, Gamepad2, Star, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGameStore } from '@/stores/gameStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { toParsedTime } from '@/lib/utils';
import type { IGame } from '@/types';

function calcTime(game: IGame): number {
  const ms =
    game.stats?.reduce((acc, s) => acc + parseInt(s.time_played || '0'), 0) ||
    0;
  return Math.floor(ms / 60000);
}

export function Stats() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { games, filteredGames, fetchGames, getHiddenGames } = useGameStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [totalHidden, setTotalHidden] = useState(0);

  useEffect(() => {
    fetchGames();
    fetchCategories();
    getHiddenGames().then((h) => setTotalHidden(h.length));
  }, []);

  const allGames = filteredGames.length > 0 ? filteredGames : games;
  const totalGames = allGames.length;

  const favNumber = useMemo(() => {
    const favCat = categories.find((c) => c.name === 'Favorites');
    if (!favCat?.games) return 0;
    return favCat.games.split(',').filter((g: string) => g.trim() !== '')
      .length;
  }, [categories]);

  const favPercentage =
    totalGames > 0 ? Math.round((favNumber / totalGames) * 100) : 0;

  const totalTimePlayed = useMemo(() => {
    const total = allGames.reduce((acc, g) => acc + calcTime(g), 0);
    return toParsedTime(total.toString());
  }, [allGames]);

  const averageTimePlayed = useMemo(() => {
    const total = allGames.reduce((acc, g) => acc + calcTime(g), 0);
    return toParsedTime(Math.floor(total / (totalGames || 1)).toString());
  }, [allGames, totalGames]);

  const mostPlayed = useMemo(() => {
    return allGames.reduce(
      (best, g) => (calcTime(g) > calcTime(best) ? g : best),
      allGames[0]
    );
  }, [allGames]);

  const leastPlayed = useMemo(() => {
    return allGames.reduce(
      (best, g) => (calcTime(g) < calcTime(best) ? g : best),
      allGames[0]
    );
  }, [allGames]);

  const top5 = useMemo(() => {
    return [...allGames].sort((a, b) => calcTime(b) - calcTime(a)).slice(0, 5);
  }, [allGames]);

  const dayData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    allGames.forEach((g) => {
      g.stats?.forEach((s) => {
        const d = new Date(s.date_of_play);
        const dayIdx = (d.getDay() + 6) % 7;
        counts[dayIdx]++;
      });
    });
    return days.map((d, i) => ({ name: d, played: counts[i] }));
  }, [allGames]);

  const monthData = useMemo(() => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const counts = new Array(12).fill(0);
    allGames.forEach((g) => {
      g.stats?.forEach((s) => {
        const m = new Date(s.date_of_play).getMonth();
        counts[m]++;
      });
    });
    return months.map((m, i) => ({ name: m, played: counts[i] }));
  }, [allGames]);

  const yearData = useMemo(() => {
    const yearSet = new Set<number>();
    allGames.forEach((g) =>
      g.stats?.forEach((s) =>
        yearSet.add(new Date(s.date_of_play).getFullYear())
      )
    );
    const years = [...yearSet].sort();
    return years.map((y) => {
      let count = 0;
      allGames.forEach((g) => {
        if (g.stats?.some((s) => new Date(s.date_of_play).getFullYear() === y))
          count++;
      });
      return { name: y.toString(), played: count };
    });
  }, [allGames]);

  const statCards = [
    {
      icon: <Star className="h-5 w-5 text-yellow-500" />,
      label: 'Favorites',
      value: `${favNumber} (${favPercentage}%)`,
    },
    {
      icon: <Gamepad2 className="h-5 w-5 text-blue-500" />,
      label: 'Total Games',
      value: `${totalGames + totalHidden}`,
    },
    {
      icon: <Clock className="h-5 w-5 text-green-500" />,
      label: 'Total Playtime',
      value: totalTimePlayed || '0m',
    },
    {
      icon: <Clock className="h-5 w-5 text-orange-500" />,
      label: 'Avg Playtime',
      value: averageTimePlayed || '0m',
    },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Statistics</h1>
        </div>

        <div className="mb-8 grid grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                {s.icon}
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-xl font-semibold">{s.value}</p>
            </div>
          ))}
        </div>

        {mostPlayed && (
          <div className="mb-8 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-1 text-xs text-muted-foreground">Most Played</p>
              <div className="flex items-center gap-3">
                {mostPlayed.jaquette && (
                  <img
                    src={mostPlayed.jaquette}
                    alt=""
                    className="h-14 w-10 rounded object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{mostPlayed.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {toParsedTime(calcTime(mostPlayed).toString())}
                  </p>
                </div>
              </div>
            </div>
            {leastPlayed && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="mb-1 text-xs text-muted-foreground">
                  Least Played
                </p>
                <div className="flex items-center gap-3">
                  {leastPlayed.jaquette && (
                    <img
                      src={leastPlayed.jaquette}
                      alt=""
                      className="h-14 w-10 rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium">{leastPlayed.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {toParsedTime(calcTime(leastPlayed).toString())}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Top Activity</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {top5.map((g) => (
              <div
                key={g.id}
                className="shrink-0 cursor-pointer rounded-lg border border-border bg-card p-2 transition-shadow hover:shadow-md"
                onClick={() => navigate(`/game/${g.id}`)}
              >
                {g.jaquette ? (
                  <img
                    src={g.jaquette}
                    alt={g.name}
                    className="mb-2 h-40 w-28 rounded object-cover"
                  />
                ) : (
                  <div className="mb-2 flex h-40 w-28 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                    No image
                  </div>
                )}
                <p className="w-28 truncate text-xs font-medium">{g.name}</p>
                <p className="text-xs text-muted-foreground">
                  {toParsedTime(calcTime(g).toString())}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Games Played Per Day</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dayData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="played"
                  stroke="#4bc0c0"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">Monthly Activity</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="played" fill="#42A5F5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {yearData.length > 0 && (
            <div className="col-span-2 rounded-xl border border-border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold">Yearly Activity</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={yearData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="played" fill="#9CCC65" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Completion by Category</h2>
          <div className="rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3 text-left font-medium">Category</th>
                  <th className="p-3 text-right font-medium">Count</th>
                  <th className="p-3 text-right font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="p-3">{c.name}</td>
                    <td className="p-3 text-right">{c.count || 0}</td>
                    <td className="p-3 text-right">
                      {totalGames > 0
                        ? Math.round(((c.count || 0) / totalGames) * 100)
                        : 0}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">All Games Playtime</h2>
          <div className="rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3 text-left font-medium">Game</th>
                  <th className="p-3 text-right font-medium">Playtime</th>
                </tr>
              </thead>
              <tbody>
                {allGames.map((g) => (
                  <tr
                    key={g.id}
                    className="border-b border-border last:border-0 hover:bg-accent/50 cursor-pointer"
                    onClick={() => navigate(`/game/${g.id}`)}
                  >
                    <td className="p-3">{g.name}</td>
                    <td className="p-3 text-right text-muted-foreground">
                      {toParsedTime(calcTime(g).toString()) || '0m'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
