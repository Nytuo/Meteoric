import { RefObject, useEffect, useLayoutEffect, useRef } from 'react';
import { useLibraryViewStore } from '@/stores/libraryViewStore';
import type { IGame } from '@/types';

export const GAME_ANCHOR_ATTR = 'data-game-id';

const RESTORE_BUDGET_MS = 1200;
const TOLERANCE_PX = 1;
const USER_SCROLL_EVENTS = [
  'wheel',
  'touchstart',
  'keydown',
  'pointerdown',
] as const;

interface Options {
  containerRef: RefObject<HTMLElement | null>;
  games: IGame[];
  listToken: number;
}

function anchorSelector(id: string) {
  return `[${GAME_ANCHOR_ATTR}="${CSS.escape(id)}"]`;
}

function anchorAtTop(scroller: HTMLElement): HTMLElement | null {
  const rect = scroller.getBoundingClientRect();
  const y = rect.top + 2;
  for (const fraction of [0.5, 0.25, 0.75, 0.08, 0.92]) {
    const hit = document.elementFromPoint(
      rect.left + rect.width * fraction,
      y
    ) as HTMLElement | null;
    const anchor = hit?.closest<HTMLElement>(`[${GAME_ANCHOR_ATTR}]`);
    if (anchor && scroller.contains(anchor)) return anchor;
  }

  const all = scroller.querySelectorAll<HTMLElement>(`[${GAME_ANCHOR_ATTR}]`);
  for (const el of all) {
    if (el.getBoundingClientRect().bottom > rect.top) return el;
  }
  return null;
}

export function useLibraryScrollRestore({
  containerRef,
  games,
  listToken,
}: Options) {
  const gamesRef = useRef(games);
  gamesRef.current = games;

  const restoringRef = useRef(false);
  const cancelRestoreRef = useRef<() => void>(() => {});
  const aimRef = useRef<() => boolean>(() => true);
  const knownListToken = useRef(listToken);
  const knownLength = useRef(games.length);

  const getScroller = () =>
    (containerRef.current?.closest('main') as HTMLElement | null) ?? null;

  useLayoutEffect(() => {
    const scroller = getScroller();
    if (!scroller) return;

    let alive = true;
    let frame = 0;

    const savePosition = () => {
      if (!alive || restoringRef.current) return;
      const anchor = anchorAtTop(scroller);
      if (!anchor) {
        useLibraryViewStore.getState().setPosition({
          scrollTop: scroller.scrollTop,
          anchorId: null,
          anchorIndex: -1,
          anchorOffset: 0,
        });
        return;
      }
      const id = anchor.getAttribute(GAME_ANCHOR_ATTR) ?? '';
      useLibraryViewStore.getState().setPosition({
        scrollTop: scroller.scrollTop,
        anchorId: id,
        anchorIndex: gamesRef.current.findIndex((g) => g.id === id),
        anchorOffset:
          scroller.getBoundingClientRect().top -
          anchor.getBoundingClientRect().top,
      });
    };

    let scheduled = 0;
    const onScroll = () => {
      if (scheduled) return;
      scheduled = requestAnimationFrame(() => {
        scheduled = 0;
        savePosition();
      });
    };

    const aim = (): boolean => {
      const { anchorId, anchorIndex, anchorOffset, scrollTop } =
        useLibraryViewStore.getState();

      let el: HTMLElement | null = anchorId
        ? scroller.querySelector<HTMLElement>(anchorSelector(anchorId))
        : null;

      if (!el && anchorIndex >= 0) {
        const list = gamesRef.current;
        const replacement = list[Math.min(anchorIndex, list.length - 1)];
        if (replacement) {
          el = scroller.querySelector<HTMLElement>(
            anchorSelector(replacement.id)
          );
        }
      }

      if (el) {
        const delta =
          el.getBoundingClientRect().top -
          scroller.getBoundingClientRect().top +
          anchorOffset;
        if (Math.abs(delta) <= TOLERANCE_PX) return true;
        scroller.scrollTop += delta;
        const left =
          el.getBoundingClientRect().top -
          scroller.getBoundingClientRect().top +
          anchorOffset;
        return Math.abs(left) <= TOLERANCE_PX;
      }

      if (scrollTop <= 0) return true;
      if (scroller.scrollHeight - scroller.clientHeight >= scrollTop) {
        scroller.scrollTop = scrollTop;
        return true;
      }
      return false;
    };

    aimRef.current = aim;

    const { scrollTop, anchorId } = useLibraryViewStore.getState();
    const hasPosition = anchorId !== null || scrollTop > 0;

    if (hasPosition) {
      restoringRef.current = true;
      const deadline = performance.now() + RESTORE_BUDGET_MS;

      const step = () => {
        if (!alive || !restoringRef.current) return;
        aim();
        if (performance.now() > deadline) {
          restoringRef.current = false;
          savePosition();
          return;
        }
        frame = requestAnimationFrame(step);
      };
      aim();
      frame = requestAnimationFrame(step);
    }

    const abort = () => {
      if (!restoringRef.current) return;
      restoringRef.current = false;
      cancelAnimationFrame(frame);
      savePosition();
    };
    cancelRestoreRef.current = () => {
      restoringRef.current = false;
      cancelAnimationFrame(frame);
    };

    scroller.addEventListener('scroll', onScroll, { passive: true });
    for (const event of USER_SCROLL_EVENTS) {
      scroller.addEventListener(event, abort, { passive: true });
    }

    return () => {
      cancelAnimationFrame(frame);
      if (scheduled) cancelAnimationFrame(scheduled);
      savePosition();
      alive = false;
      restoringRef.current = false;
      scroller.removeEventListener('scroll', onScroll);
      for (const event of USER_SCROLL_EVENTS) {
        scroller.removeEventListener(event, abort);
      }
    };
  }, []);

  useEffect(() => {
    if (knownListToken.current === listToken) return;
    knownListToken.current = listToken;
    cancelRestoreRef.current();
    useLibraryViewStore.getState().reset();
    const scroller = getScroller();
    if (scroller) scroller.scrollTop = 0;
  }, [listToken]);

  useLayoutEffect(() => {
    const changed = knownLength.current !== games.length;
    knownLength.current = games.length;
    if (!changed || restoringRef.current) return;
    if (knownListToken.current !== listToken) return;
    aimRef.current();
  }, [games.length, listToken]);
}
