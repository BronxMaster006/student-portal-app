"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Heartbeat } from "@/components/heartbeat";

type GameKey = "tictactoe" | "snake" | "minesweeper" | "ultimate";

type CellValue = "X" | "O" | null;
type SmallBoardResult = "X" | "O" | "draw" | null;

type SnakePoint = {
  x: number;
  y: number;
};

type Direction = "up" | "down" | "left" | "right";

type MinesweeperCell = {
  isMine: boolean;
  isOpen: boolean;
  isFlagged: boolean;
  neighborMines: number;
};

type MinesweeperDifficultyKey = "leicht" | "mittel" | "schwer";

type MinesweeperDifficulty = {
  label: string;
  size: number;
  mines: number;
};

type UltimateHistory = {
  xWins: number;
  oWins: number;
  draws: number;
};

const gameTabs: { key: GameKey; label: string; description: string }[] = [
  { key: "tictactoe", label: "Tic-Tac-Toe", description: "2 Spieler lokal auf einem Gerät" },
  { key: "snake", label: "Snake", description: "Pfeiltasten, Touch oder Swipe" },
  { key: "minesweeper", label: "Minesweeper", description: "Mit Schwierigkeitsstufen" },
  { key: "ultimate", label: "Ultimate Tic-Tac-Toe", description: "9 Felder mit Ziel-Feld-Regel" }
];

const snakeBoardSize = 14;
const snakeTickMs = 180;
const snakeBestScoreStorageKey = "student-portal-snake-bestscore";
const ultimateHistoryStorageKey = "student-portal-ultimate-history";
const mineLongPressMs = 450;

const minesweeperDifficulties: Record<MinesweeperDifficultyKey, MinesweeperDifficulty> = {
  leicht: { label: "Leicht", size: 8, mines: 10 },
  mittel: { label: "Mittel", size: 12, mines: 24 },
  schwer: { label: "Schwer", size: 16, mines: 45 }
};

const initialUltimateHistory: UltimateHistory = {
  xWins: 0,
  oWins: 0,
  draws: 0
};

function getWinner(board: CellValue[]): CellValue {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
}

function isBoardFull(board: CellValue[]): boolean {
  return board.every((cell) => cell !== null);
}

function createMinesweeperBoard(size: number, mineCount: number, safeIndex?: number): MinesweeperCell[][] {
  const board = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      isMine: false,
      isOpen: false,
      isFlagged: false,
      neighborMines: 0
    }))
  );

  const allPositions = Array.from({ length: size * size }, (_, index) => index).filter((index) => index !== safeIndex);

  for (let i = allPositions.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
  }

  const actualMineCount = Math.min(mineCount, allPositions.length);

  for (let i = 0; i < actualMineCount; i += 1) {
    const position = allPositions[i];
    const row = Math.floor(position / size);
    const col = position % size;
    board[row][col].isMine = true;
  }

  const offsets = [-1, 0, 1];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (board[row][col].isMine) {
        continue;
      }

      let count = 0;
      for (const dy of offsets) {
        for (const dx of offsets) {
          if (dy === 0 && dx === 0) {
            continue;
          }
          const nextRow = row + dy;
          const nextCol = col + dx;
          if (nextRow < 0 || nextCol < 0 || nextRow >= size || nextCol >= size) {
            continue;
          }
          if (board[nextRow][nextCol].isMine) {
            count += 1;
          }
        }
      }

      board[row][col].neighborMines = count;
    }
  }

  return board;
}

function isOppositeDirection(a: Direction, b: Direction): boolean {
  return (
    (a === "up" && b === "down") ||
    (a === "down" && b === "up") ||
    (a === "left" && b === "right") ||
    (a === "right" && b === "left")
  );
}

function createEmptyUltimateBoards(): CellValue[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(null));
}

function createEmptyUltimateWinners(): SmallBoardResult[] {
  return Array(9).fill(null);
}

export default function SpielePage() {
  const [activeGame, setActiveGame] = useState<GameKey>("tictactoe");
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  const [tttBoard, setTttBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [tttTurn, setTttTurn] = useState<"X" | "O">("X");
  const tttWinner = useMemo(() => getWinner(tttBoard), [tttBoard]);
  const tttDraw = !tttWinner && tttBoard.every((cell) => cell !== null);

  const [snake, setSnake] = useState<SnakePoint[]>([
    { x: 6, y: 7 },
    { x: 5, y: 7 },
    { x: 4, y: 7 }
  ]);
  const [snakeFood, setSnakeFood] = useState<SnakePoint>({ x: 10, y: 7 });
  const [snakeRunning, setSnakeRunning] = useState(false);
  const [snakeGameOver, setSnakeGameOver] = useState(false);
  const [snakeScore, setSnakeScore] = useState(0);
  const [snakeBestScore, setSnakeBestScore] = useState(0);
  const snakeDirectionRef = useRef<Direction>("right");
  const snakeQueuedDirectionRef = useRef<Direction>("right");
  const snakeInputLockedRef = useRef(false);
  const snakeSwipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const [mineDifficulty, setMineDifficulty] = useState<MinesweeperDifficultyKey>("leicht");
  const [mineBoard, setMineBoard] = useState<MinesweeperCell[][]>(() =>
    createMinesweeperBoard(minesweeperDifficulties.leicht.size, minesweeperDifficulties.leicht.mines)
  );
  const [mineGameOver, setMineGameOver] = useState(false);
  const [mineWon, setMineWon] = useState(false);
  const [mineFirstClickDone, setMineFirstClickDone] = useState(false);
  const [mineTouchFlagMode, setMineTouchFlagMode] = useState(false);
  const mineLongPressTimerRef = useRef<number | null>(null);
  const mineLongPressTriggeredRef = useRef(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const [utttBoards, setUtttBoards] = useState<CellValue[][]>(() => createEmptyUltimateBoards());
  const [utttSmallWinners, setUtttSmallWinners] = useState<SmallBoardResult[]>(() => createEmptyUltimateWinners());
  const [utttTurn, setUtttTurn] = useState<"X" | "O">("X");
  const [utttTargetBoard, setUtttTargetBoard] = useState<number | null>(null);
  const [ultimateHistory, setUltimateHistory] = useState<UltimateHistory>(initialUltimateHistory);
  const [ultimateFinished, setUltimateFinished] = useState(false);

  const currentMineSettings = minesweeperDifficulties[mineDifficulty];

  const flaggedCount = useMemo(
    () => mineBoard.flat().reduce((count, cell) => count + (cell.isFlagged ? 1 : 0), 0),
    [mineBoard]
  );

  const remainingMines = currentMineSettings.mines - flaggedCount;

  const ultimateBigBoard = useMemo<CellValue[]>(
    () => utttSmallWinners.map((winner) => (winner === "X" || winner === "O" ? winner : null)),
    [utttSmallWinners]
  );
  const ultimateWinner = useMemo(() => getWinner(ultimateBigBoard), [ultimateBigBoard]);
  const ultimateDraw = useMemo(
    () => !ultimateWinner && utttSmallWinners.every((result) => result !== null),
    [ultimateWinner, utttSmallWinners]
  );

  const clearMineLongPress = useCallback(() => {
    if (mineLongPressTimerRef.current !== null) {
      window.clearTimeout(mineLongPressTimerRef.current);
      mineLongPressTimerRef.current = null;
    }
  }, []);

  function resetTicTacToe() {
    setTttBoard(Array(9).fill(null));
    setTttTurn("X");
  }

  function playTicTacToe(index: number) {
    if (tttBoard[index] || tttWinner || tttDraw) {
      return;
    }

    setTttBoard((previous) => {
      const next = [...previous];
      next[index] = tttTurn;
      return next;
    });

    setTttTurn((previous) => (previous === "X" ? "O" : "X"));
  }

  function randomFreeCell(excluded: SnakePoint[]): SnakePoint {
    const occupied = new Set(excluded.map((p) => `${p.x}-${p.y}`));
    const free: SnakePoint[] = [];

    for (let y = 0; y < snakeBoardSize; y += 1) {
      for (let x = 0; x < snakeBoardSize; x += 1) {
        const key = `${x}-${y}`;
        if (!occupied.has(key)) {
          free.push({ x, y });
        }
      }
    }

    if (free.length === 0) {
      return { x: 0, y: 0 };
    }

    return free[Math.floor(Math.random() * free.length)];
  }

  const queueSnakeDirection = useCallback((nextDirection: Direction) => {
    if (snakeInputLockedRef.current && snakeRunning) {
      return;
    }

    if (isOppositeDirection(snakeDirectionRef.current, nextDirection)) {
      return;
    }

    snakeQueuedDirectionRef.current = nextDirection;
    snakeInputLockedRef.current = true;

    if (!snakeRunning && !snakeGameOver) {
      setSnakeRunning(true);
    }
  }, [snakeGameOver, snakeRunning]);

  const handleSnakeSwipeStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }
    snakeSwipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleSnakeSwipeMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    const start = snakeSwipeStartRef.current;
    const touch = event.touches[0];
    if (!start || !touch) {
      return;
    }

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const threshold = 24;

    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      queueSnakeDirection(dx > 0 ? "right" : "left");
    } else {
      queueSnakeDirection(dy > 0 ? "down" : "up");
    }

    snakeSwipeStartRef.current = null;
  }, [queueSnakeDirection]);

  const handleSnakeSwipeEnd = useCallback(() => {
    snakeSwipeStartRef.current = null;
  }, []);

  function resetSnake() {
    const initialSnake = [
      { x: 6, y: 7 },
      { x: 5, y: 7 },
      { x: 4, y: 7 }
    ];
    setSnake(initialSnake);
    setSnakeFood(randomFreeCell(initialSnake));
    setSnakeScore(0);
    setSnakeGameOver(false);
    setSnakeRunning(false);
    snakeDirectionRef.current = "right";
    snakeQueuedDirectionRef.current = "right";
    snakeInputLockedRef.current = false;
    snakeSwipeStartRef.current = null;
  }

  function toggleMineFlag(row: number, col: number) {
    if (mineGameOver || mineWon) {
      return;
    }

    setMineBoard((previous) => {
      const next = previous.map((line) => line.map((cell) => ({ ...cell })));
      const cell = next[row][col];
      if (cell.isOpen) {
        return previous;
      }
      cell.isFlagged = !cell.isFlagged;
      return next;
    });
  }

  function openMinesweeperCell(row: number, col: number) {
    if (mineGameOver || mineWon) {
      return;
    }

    setMineBoard((previous) => {
      const currentCell = previous[row][col];
      if (currentCell.isOpen || currentCell.isFlagged) {
        return previous;
      }

      let next = previous.map((line) => line.map((cell) => ({ ...cell })));

      if (!mineFirstClickDone) {
        const safeIndex = row * currentMineSettings.size + col;
        next = createMinesweeperBoard(currentMineSettings.size, currentMineSettings.mines, safeIndex);
        setMineFirstClickDone(true);
      }

      const cell = next[row][col];

      if (cell.isMine) {
        for (const boardRow of next) {
          for (const boardCell of boardRow) {
            if (boardCell.isMine) {
              boardCell.isOpen = true;
            }
          }
        }
        setMineGameOver(true);
        return next;
      }

      revealMineCell(next, row, col);

      if (checkMinesweeperWin(next)) {
        setMineWon(true);
      }

      return next;
    });
  }

  function handleMineCellClick(row: number, col: number) {
    if (mineLongPressTriggeredRef.current) {
      mineLongPressTriggeredRef.current = false;
      return;
    }

    if (mineTouchFlagMode) {
      toggleMineFlag(row, col);
      return;
    }

    openMinesweeperCell(row, col);
  }

  function handleMineTouchStart(row: number, col: number) {
    if (!isTouchDevice || mineTouchFlagMode) {
      return;
    }

    mineLongPressTriggeredRef.current = false;
    clearMineLongPress();

    mineLongPressTimerRef.current = window.setTimeout(() => {
      toggleMineFlag(row, col);
      mineLongPressTriggeredRef.current = true;
      mineLongPressTimerRef.current = null;
    }, mineLongPressMs);
  }

  function handleMineTouchEnd() {
    clearMineLongPress();
  }

  function handleMineContextMenu(event: React.MouseEvent, row: number, col: number) {
    event.preventDefault();
    toggleMineFlag(row, col);
  }

  function resetMinesweeper(nextDifficulty?: MinesweeperDifficultyKey) {
    const difficulty = nextDifficulty ?? mineDifficulty;
    const settings = minesweeperDifficulties[difficulty];
    setMineDifficulty(difficulty);
    setMineBoard(createMinesweeperBoard(settings.size, settings.mines));
    setMineGameOver(false);
    setMineWon(false);
    setMineFirstClickDone(false);
    clearMineLongPress();
    mineLongPressTriggeredRef.current = false;
  }

  function revealMineCell(board: MinesweeperCell[][], row: number, col: number) {
    const queue: Array<{ row: number; col: number }> = [{ row, col }];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        continue;
      }

      const { row: currentRow, col: currentCol } = current;
      if (currentRow < 0 || currentCol < 0 || currentRow >= currentMineSettings.size || currentCol >= currentMineSettings.size) {
        continue;
      }

      const cell = board[currentRow][currentCol];
      if (cell.isOpen || cell.isFlagged) {
        continue;
      }

      cell.isOpen = true;

      if (cell.neighborMines !== 0 || cell.isMine) {
        continue;
      }

      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dy === 0 && dx === 0) {
            continue;
          }
          queue.push({ row: currentRow + dy, col: currentCol + dx });
        }
      }
    }
  }

  function checkMinesweeperWin(board: MinesweeperCell[][]): boolean {
    for (let row = 0; row < currentMineSettings.size; row += 1) {
      for (let col = 0; col < currentMineSettings.size; col += 1) {
        const cell = board[row][col];
        if (!cell.isMine && !cell.isOpen) {
          return false;
        }
      }
    }
    return true;
  }

  function resetUltimateTicTacToe() {
    setUtttBoards(createEmptyUltimateBoards());
    setUtttSmallWinners(createEmptyUltimateWinners());
    setUtttTurn("X");
    setUtttTargetBoard(null);
    setUltimateFinished(false);
  }

  function playUltimateCell(boardIndex: number, cellIndex: number) {
    if (ultimateWinner || ultimateDraw) {
      return;
    }

    const forcedBoardStillOpen = utttTargetBoard !== null && utttSmallWinners[utttTargetBoard] === null;
    if (forcedBoardStillOpen && boardIndex !== utttTargetBoard) {
      return;
    }

    if (utttSmallWinners[boardIndex] !== null) {
      return;
    }

    if (utttBoards[boardIndex][cellIndex] !== null) {
      return;
    }

    const nextBoards = utttBoards.map((board) => [...board]);
    nextBoards[boardIndex][cellIndex] = utttTurn;

    const nextSmallWinners = [...utttSmallWinners];
    const updatedSmallBoard = nextBoards[boardIndex];
    const smallBoardWinner = getWinner(updatedSmallBoard);

    if (smallBoardWinner) {
      nextSmallWinners[boardIndex] = smallBoardWinner;
    } else if (isBoardFull(updatedSmallBoard)) {
      nextSmallWinners[boardIndex] = "draw";
    }

    setUtttBoards(nextBoards);
    setUtttSmallWinners(nextSmallWinners);

    const targetResult = nextSmallWinners[cellIndex];
    setUtttTargetBoard(targetResult === null ? cellIndex : null);

    setUtttTurn((previous) => (previous === "X" ? "O" : "X"));
  }

  const ultimateForcedBoardStillOpen = utttTargetBoard !== null && utttSmallWinners[utttTargetBoard] === null;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const touch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
    setIsTouchDevice(touch);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(snakeBestScoreStorageKey);
    if (!stored) {
      return;
    }

    const parsed = Number.parseInt(stored, 10);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      setSnakeBestScore(parsed);
    }
  }, []);

  useEffect(() => {
    if (snakeScore > snakeBestScore) {
      setSnakeBestScore(snakeScore);
    }
  }, [snakeBestScore, snakeScore]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(snakeBestScoreStorageKey, String(snakeBestScore));
  }, [snakeBestScore]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(ultimateHistoryStorageKey);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Partial<UltimateHistory>;
      if (
        typeof parsed.xWins === "number" &&
        typeof parsed.oWins === "number" &&
        typeof parsed.draws === "number"
      ) {
        setUltimateHistory({
          xWins: parsed.xWins,
          oWins: parsed.oWins,
          draws: parsed.draws
        });
      }
    } catch {
      // intentionally ignore broken history values
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(ultimateHistoryStorageKey, JSON.stringify(ultimateHistory));
  }, [ultimateHistory]);

  useEffect(() => {
    if (ultimateFinished) {
      return;
    }

    if (ultimateWinner) {
      setUltimateHistory((previous) => ({
        ...previous,
        xWins: previous.xWins + (ultimateWinner === "X" ? 1 : 0),
        oWins: previous.oWins + (ultimateWinner === "O" ? 1 : 0)
      }));
      setUltimateFinished(true);
      return;
    }

    if (ultimateDraw) {
      setUltimateHistory((previous) => ({ ...previous, draws: previous.draws + 1 }));
      setUltimateFinished(true);
    }
  }, [ultimateDraw, ultimateFinished, ultimateWinner]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (activeGame !== "snake") {
        return;
      }

      if (event.repeat) {
        return;
      }

      const keyMap: Record<string, Direction | undefined> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right"
      };

      const nextDirection = keyMap[event.key];
      if (!nextDirection) {
        return;
      }

      event.preventDefault();
      queueSnakeDirection(nextDirection);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeGame, queueSnakeDirection]);

  useEffect(() => {
    if (!snakeRunning || snakeGameOver) {
      return;
    }

    const interval = window.setInterval(() => {
      setSnake((previous) => {
        snakeInputLockedRef.current = false;
        const direction = snakeQueuedDirectionRef.current;
        snakeDirectionRef.current = direction;
        const head = previous[0];

        const delta: Record<Direction, SnakePoint> = {
          up: { x: 0, y: -1 },
          down: { x: 0, y: 1 },
          left: { x: -1, y: 0 },
          right: { x: 1, y: 0 }
        };

        const nextHead = {
          x: head.x + delta[direction].x,
          y: head.y + delta[direction].y
        };

        const wallHit = nextHead.x < 0 || nextHead.y < 0 || nextHead.x >= snakeBoardSize || nextHead.y >= snakeBoardSize;
        const selfHit = previous.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);

        if (wallHit || selfHit) {
          setSnakeGameOver(true);
          setSnakeRunning(false);
          snakeInputLockedRef.current = false;
          return previous;
        }

        const ateFood = nextHead.x === snakeFood.x && nextHead.y === snakeFood.y;
        const nextSnake = [nextHead, ...previous];

        if (!ateFood) {
          nextSnake.pop();
        } else {
          setSnakeScore((score) => score + 1);
          setSnakeFood(randomFreeCell(nextSnake));
        }

        return nextSnake;
      });
    }, snakeTickMs);

    return () => window.clearInterval(interval);
  }, [snakeFood, snakeGameOver, snakeRunning]);

  useEffect(() => {
    if (!showEasterEgg) {
      return;
    }

    const timer = window.setTimeout(() => {
      setShowEasterEgg(false);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [showEasterEgg]);

  useEffect(() => {
    return () => {
      clearMineLongPress();
    };
  }, [clearMineLongPress]);

  return (
    <main className="min-h-screen px-6 py-10">
      <Heartbeat />
      <div className="mx-auto max-w-6xl space-y-6">
        <AppHeader title="Spiele" />

        <section className="relative rounded-xl border border-slate-700 bg-card p-5">
          <button
            type="button"
            onClick={() => setShowEasterEgg(true)}
            className="absolute right-3 top-3 rounded-full border border-slate-600 bg-slate-900/70 px-2 py-1 text-xs text-slate-300 hover:border-accent"
            aria-label="Easter Egg"
          >
            🍌
          </button>
          {showEasterEgg ? (
            <div className="pointer-events-none absolute right-3 top-12 rounded-md border border-accent/40 bg-slate-900 px-3 py-1 text-xs text-amber-200 shadow-lg">
              eeerrrww bananana
            </div>
          ) : null}

          <h2 className="text-xl font-semibold">Spielesammlung</h2>
          <p className="mt-1 text-sm text-slate-300">Wähle ein Spiel aus. Alle Spiele laufen lokal direkt im Browser.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {gameTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveGame(tab.key)}
                className={`rounded-lg border p-3 text-left transition ${
                  activeGame === tab.key
                    ? "border-accent bg-slate-900"
                    : "border-slate-700 bg-slate-900/40 hover:border-slate-500"
                }`}
              >
                <p className="font-medium">{tab.label}</p>
                <p className="mt-1 text-xs text-slate-300">{tab.description}</p>
              </button>
            ))}
          </div>
        </section>

        {activeGame === "tictactoe" ? (
          <section className="rounded-xl border border-slate-700 bg-card p-6">
            <h3 className="text-xl font-semibold">Tic-Tac-Toe</h3>
            <p className="mt-1 text-sm text-slate-300">Setzt abwechselnd X und O. Drei gleiche Symbole in einer Reihe gewinnen.</p>

            <div className="mt-4 grid w-full max-w-sm grid-cols-3 gap-2">
              {tttBoard.map((cell, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => playTicTacToe(index)}
                  className="aspect-square rounded-lg border border-slate-700 bg-slate-900 text-2xl font-bold text-white transition hover:border-accent"
                >
                  {cell ?? ""}
                </button>
              ))}
            </div>

            <p className="mt-4 text-sm text-slate-200">
              {tttWinner
                ? `Spiel beendet: ${tttWinner} hat gewonnen.`
                : tttDraw
                  ? "Spiel beendet: Unentschieden."
                  : `Am Zug: ${tttTurn}`}
            </p>

            <button type="button" onClick={resetTicTacToe} className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              Neustart
            </button>
          </section>
        ) : null}

        {activeGame === "snake" ? (
          <section className="rounded-xl border border-slate-700 bg-card p-6">
            <h3 className="text-xl font-semibold">Snake</h3>
            <p className="mt-1 text-sm text-slate-300">Steuerung mit Pfeiltasten, Swipe oder Touch-Buttons. Futter sammeln erhöht den Score.</p>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-3 text-sm">
                <p className="rounded-md bg-slate-900 px-3 py-1 text-slate-100">Score: <span className="font-semibold">{snakeScore}</span></p>
                <p className="rounded-md bg-slate-900 px-3 py-1 text-slate-100">Bestscore: <span className="font-semibold text-emerald-300">{snakeBestScore}</span></p>
              </div>
              <p className="text-sm text-slate-300">
                {snakeGameOver ? "Game Over. Starte neu, um weiterzuspielen." : snakeRunning ? "Läuft..." : "Bereit. Starte das Spiel."}
              </p>

              <div
                className="grid w-full max-w-[440px] touch-none gap-0.5 rounded-lg border border-slate-700 bg-slate-800 p-2"
                style={{ gridTemplateColumns: `repeat(${snakeBoardSize}, minmax(0, 1fr))` }}
                onTouchStart={handleSnakeSwipeStart}
                onTouchMove={handleSnakeSwipeMove}
                onTouchEnd={handleSnakeSwipeEnd}
                onTouchCancel={handleSnakeSwipeEnd}
              >
                {Array.from({ length: snakeBoardSize * snakeBoardSize }, (_, index) => {
                  const x = index % snakeBoardSize;
                  const y = Math.floor(index / snakeBoardSize);
                  const isHead = snake[0]?.x === x && snake[0]?.y === y;
                  const isBody = snake.slice(1).some((segment) => segment.x === x && segment.y === y);
                  const isFood = snakeFood.x === x && snakeFood.y === y;

                  return (
                    <div
                      key={index}
                      className={`aspect-square rounded-sm ${
                        isHead
                          ? "bg-emerald-300"
                          : isBody
                            ? "bg-emerald-500"
                            : isFood
                              ? "bg-red-400"
                              : "bg-slate-900"
                      }`}
                    />
                  );
                })}
              </div>

              <div className="grid w-full max-w-[280px] grid-cols-3 gap-2 md:hidden">
                <div />
                <button
                  type="button"
                  onClick={() => queueSnakeDirection("up")}
                  className="min-h-12 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-xl text-slate-200 active:scale-[0.98]"
                >
                  ↑
                </button>
                <div />
                <button
                  type="button"
                  onClick={() => queueSnakeDirection("left")}
                  className="min-h-12 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-xl text-slate-200 active:scale-[0.98]"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => queueSnakeDirection("down")}
                  className="min-h-12 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-xl text-slate-200 active:scale-[0.98]"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => queueSnakeDirection("right")}
                  className="min-h-12 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-xl text-slate-200 active:scale-[0.98]"
                >
                  →
                </button>
              </div>

              <p className="text-xs text-slate-400 md:hidden">Swipe auf dem Spielfeld oder nutze die Pfeil-Buttons (eine Richtungsänderung pro Tick).</p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!snakeGameOver) {
                      setSnakeRunning(true);
                    }
                  }}
                  disabled={snakeRunning || snakeGameOver}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  Start
                </button>
                <button type="button" onClick={resetSnake} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-accent">
                  Neustart
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {activeGame === "minesweeper" ? (
          <section className="rounded-xl border border-slate-700 bg-card p-6">
            <h3 className="text-xl font-semibold">Minesweeper</h3>
            <p className="mt-1 text-sm text-slate-300">Erster Klick ist immer sicher. Rechtsklick markiert Minen mit einer Flagge.</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {Object.entries(minesweeperDifficulties).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => resetMinesweeper(key as MinesweeperDifficultyKey)}
                  className={`rounded-lg border px-3 py-1 text-sm transition ${
                    mineDifficulty === key ? "border-accent bg-slate-900 text-white" : "border-slate-700 text-slate-200 hover:border-accent"
                  }`}
                >
                  {value.label}
                </button>
              ))}
            </div>

            {isTouchDevice ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 p-1">
                <button
                  type="button"
                  onClick={() => setMineTouchFlagMode(false)}
                  className={`rounded-md px-3 py-1 text-xs ${!mineTouchFlagMode ? "bg-accent text-white" : "text-slate-300"}`}
                >
                  Öffnen
                </button>
                <button
                  type="button"
                  onClick={() => setMineTouchFlagMode(true)}
                  className={`rounded-md px-3 py-1 text-xs ${mineTouchFlagMode ? "bg-accent text-white" : "text-slate-300"}`}
                >
                  Flaggen
                </button>
                <p className="pl-1 text-xs text-slate-400">Langdruck setzt ebenfalls eine Flagge.</p>
              </div>
            ) : null}

            <div className="mt-4 grid gap-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-sm md:grid-cols-2">
              <p className="text-slate-200">
                Schwierigkeit: <span className="font-semibold">{currentMineSettings.label}</span> ({currentMineSettings.size}×{currentMineSettings.size})
              </p>
              <p className="text-slate-300">Minen gesamt: {currentMineSettings.mines}</p>
              <p className="text-slate-300">Gesetzte Flags: {flaggedCount}</p>
              <p className="text-slate-300">Rest (geschätzt): {remainingMines}</p>
              <p className="md:col-span-2 text-slate-200">
                {mineGameOver ? "Verloren: Du hast eine Mine geöffnet." : mineWon ? "Gewonnen: Alle sicheren Felder sind aufgedeckt." : "Spiel läuft."}
              </p>
            </div>

            <div className="mt-4 overflow-x-auto pb-1">
              <div
                className="grid min-w-[320px] gap-1 rounded-lg border border-slate-700 bg-slate-800 p-2"
                style={{
                  gridTemplateColumns: `repeat(${currentMineSettings.size}, minmax(0, 1fr))`,
                  width: `${Math.max(320, currentMineSettings.size * 34)}px`
                }}
              >
                {mineBoard.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const content = cell.isOpen ? (cell.isMine ? "💣" : cell.neighborMines === 0 ? "" : cell.neighborMines) : cell.isFlagged ? "🚩" : "";

                    return (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        type="button"
                        onClick={() => handleMineCellClick(rowIndex, colIndex)}
                        onTouchStart={() => handleMineTouchStart(rowIndex, colIndex)}
                        onTouchEnd={handleMineTouchEnd}
                        onTouchCancel={handleMineTouchEnd}
                        onContextMenu={(event) => handleMineContextMenu(event, rowIndex, colIndex)}
                        className={`aspect-square rounded border text-xs font-semibold sm:text-sm ${
                          cell.isOpen ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-700 bg-slate-700/70 text-slate-100 hover:border-accent"
                        }`}
                      >
                        {content}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <button type="button" onClick={() => resetMinesweeper()} className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-accent">
              Neustart
            </button>
          </section>
        ) : null}

        {activeGame === "ultimate" ? (
          <section className="rounded-xl border border-slate-700 bg-card p-6">
            <h3 className="text-xl font-semibold">Ultimate Tic-Tac-Toe</h3>
            <p className="mt-1 text-sm text-slate-300">
              Du spielst in einem kleinen 3×3-Feld. Das gewählte Feld (Position 1-9) bestimmt, in welches kleine Feld der nächste Zug muss.
              Ist dieses Ziel-Feld bereits gewonnen oder voll, darf frei gewählt werden.
            </p>

            <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-sm">
              <p className="text-slate-200">
                {ultimateWinner
                  ? `Gesamtsieg: ${ultimateWinner} gewinnt Ultimate Tic-Tac-Toe.`
                  : ultimateDraw
                    ? "Unentschieden: Alle kleinen Felder sind abgeschlossen."
                    : `Am Zug: ${utttTurn}`}
              </p>
              <p className="mt-1 text-slate-300">
                {ultimateWinner || ultimateDraw
                  ? "Spiel beendet."
                  : ultimateForcedBoardStillOpen
                    ? `Nächstes Ziel-Feld: ${utttTargetBoard! + 1}`
                    : "Nächstes Ziel-Feld: frei wählbar"}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-xs sm:text-sm">
              <p className="rounded bg-slate-800 px-2 py-1 text-slate-200">Siege X: <span className="font-semibold text-blue-300">{ultimateHistory.xWins}</span></p>
              <p className="rounded bg-slate-800 px-2 py-1 text-slate-200">Siege O: <span className="font-semibold text-rose-300">{ultimateHistory.oWins}</span></p>
              <p className="rounded bg-slate-800 px-2 py-1 text-slate-200">Unentschieden: <span className="font-semibold">{ultimateHistory.draws}</span></p>
            </div>

            <div className="mt-4 overflow-x-auto pb-1">
              <div className="grid min-w-[360px] grid-cols-3 gap-2 rounded-lg border border-slate-700 bg-slate-800 p-2 sm:min-w-[540px]">
                {utttBoards.map((smallBoard, boardIndex) => {
                  const smallWinner = utttSmallWinners[boardIndex];
                  const isActiveTarget =
                    !ultimateWinner &&
                    !ultimateDraw &&
                    (ultimateForcedBoardStillOpen ? boardIndex === utttTargetBoard : smallWinner === null);

                  return (
                    <div
                      key={boardIndex}
                      className={`rounded-md border p-1 ${
                        smallWinner === "X"
                          ? "border-blue-400 bg-blue-950/30"
                          : smallWinner === "O"
                            ? "border-rose-400 bg-rose-950/30"
                            : smallWinner === "draw"
                              ? "border-slate-500 bg-slate-900/70"
                              : isActiveTarget
                                ? "border-accent bg-slate-900"
                                : "border-slate-700 bg-slate-900/70"
                      }`}
                    >
                      <div className="grid grid-cols-3 gap-1">
                        {smallBoard.map((cell, cellIndex) => (
                          <button
                            key={`${boardIndex}-${cellIndex}`}
                            type="button"
                            onClick={() => playUltimateCell(boardIndex, cellIndex)}
                            disabled={
                              !!ultimateWinner ||
                              ultimateDraw ||
                              cell !== null ||
                              smallWinner !== null ||
                              (ultimateForcedBoardStillOpen && boardIndex !== utttTargetBoard)
                            }
                            className={`aspect-square rounded border text-lg font-bold sm:text-xl ${
                              cell === "X"
                                ? "text-blue-300"
                                : cell === "O"
                                  ? "text-rose-300"
                                  : "text-slate-200"
                            } ${
                              smallWinner !== null
                                ? "border-slate-700 bg-slate-900/80"
                                : "border-slate-700 bg-slate-900 hover:border-accent disabled:cursor-not-allowed disabled:opacity-70"
                            }`}
                          >
                            {cell ?? ""}
                          </button>
                        ))}
                      </div>

                      <p className="mt-1 text-center text-[11px] text-slate-300">
                        Feld {boardIndex + 1}: {smallWinner === "X" ? "X gewonnen" : smallWinner === "O" ? "O gewonnen" : smallWinner === "draw" ? "Unentschieden" : "offen"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={resetUltimateTicTacToe}
              className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-accent"
            >
              Neustart
            </button>
          </section>
        ) : null}
      </div>
    </main>
  );
}
