"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Heartbeat } from "@/components/heartbeat";

type GameKey = "tictactoe" | "snake" | "minesweeper";

type CellValue = "X" | "O" | null;

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

const gameTabs: { key: GameKey; label: string; description: string }[] = [
  { key: "tictactoe", label: "Tic-Tac-Toe", description: "2 Spieler lokal auf einem Gerät" },
  { key: "snake", label: "Snake", description: "Pfeiltasten oder Touch-Steuerung" },
  { key: "minesweeper", label: "Minesweeper", description: "Mit Schwierigkeitsstufen" }
];

const snakeBoardSize = 14;
const snakeTickMs = 180;

const minesweeperDifficulties: Record<MinesweeperDifficultyKey, MinesweeperDifficulty> = {
  leicht: { label: "Leicht", size: 8, mines: 10 },
  mittel: { label: "Mittel", size: 12, mines: 24 },
  schwer: { label: "Schwer", size: 16, mines: 45 }
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

export default function SpielePage() {
  const [activeGame, setActiveGame] = useState<GameKey>("tictactoe");

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
  const snakeDirectionRef = useRef<Direction>("right");
  const snakeQueuedDirectionRef = useRef<Direction>("right");

  const [mineDifficulty, setMineDifficulty] = useState<MinesweeperDifficultyKey>("leicht");
  const [mineBoard, setMineBoard] = useState<MinesweeperCell[][]>(() =>
    createMinesweeperBoard(minesweeperDifficulties.leicht.size, minesweeperDifficulties.leicht.mines)
  );
  const [mineGameOver, setMineGameOver] = useState(false);
  const [mineWon, setMineWon] = useState(false);
  const [mineFirstClickDone, setMineFirstClickDone] = useState(false);

  const currentMineSettings = minesweeperDifficulties[mineDifficulty];

  const flaggedCount = useMemo(
    () => mineBoard.flat().reduce((count, cell) => count + (cell.isFlagged ? 1 : 0), 0),
    [mineBoard]
  );

  const remainingMines = currentMineSettings.mines - flaggedCount;

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
    if (isOppositeDirection(snakeDirectionRef.current, nextDirection)) {
      return;
    }

    snakeQueuedDirectionRef.current = nextDirection;

    if (!snakeRunning && !snakeGameOver) {
      setSnakeRunning(true);
    }
  }, [snakeGameOver, snakeRunning]);

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
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (activeGame !== "snake") {
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

    const interval = setInterval(() => {
      setSnake((previous) => {
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
          return previous;
        }

        const ateFood = nextHead.x === snakeFood.x && nextHead.y === snakeFood.y;
        const nextSnake = [nextHead, ...previous];

        if (!ateFood) {
          nextSnake.pop();
        } else {
          setSnakeScore((s) => s + 1);
          setSnakeFood(randomFreeCell(nextSnake));
        }

        return nextSnake;
      });
    }, snakeTickMs);

    return () => clearInterval(interval);
  }, [snakeFood, snakeGameOver, snakeRunning]);

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

  function resetMinesweeper(nextDifficulty?: MinesweeperDifficultyKey) {
    const difficulty = nextDifficulty ?? mineDifficulty;
    const settings = minesweeperDifficulties[difficulty];
    setMineDifficulty(difficulty);
    setMineBoard(createMinesweeperBoard(settings.size, settings.mines));
    setMineGameOver(false);
    setMineWon(false);
    setMineFirstClickDone(false);
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

  function toggleMineFlag(event: React.MouseEvent, row: number, col: number) {
    event.preventDefault();

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

  return (
    <main className="min-h-screen px-6 py-10">
      <Heartbeat />
      <div className="mx-auto max-w-6xl space-y-6">
        <AppHeader title="Spiele" />

        <section className="rounded-xl border border-slate-700 bg-card p-5">
          <h2 className="text-xl font-semibold">Spielesammlung</h2>
          <p className="mt-1 text-sm text-slate-300">Wähle ein Spiel aus. Alle Spiele laufen lokal direkt im Browser.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
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
            <p className="mt-1 text-sm text-slate-300">Steuerung mit Pfeiltasten oder Touch-Buttons. Futter sammeln erhöht den Score.</p>

            <div className="mt-4 space-y-3">
              <p className="text-sm text-slate-200">Score: {snakeScore}</p>
              <p className="text-sm text-slate-300">
                {snakeGameOver ? "Game Over. Starte neu, um weiterzuspielen." : snakeRunning ? "Läuft..." : "Bereit. Starte das Spiel."}
              </p>

              <div
                className="grid w-full max-w-[420px] gap-0.5 rounded-lg border border-slate-700 bg-slate-800 p-2"
                style={{ gridTemplateColumns: `repeat(${snakeBoardSize}, minmax(0, 1fr))` }}
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

              <div className="grid w-full max-w-[220px] grid-cols-3 gap-2 md:hidden">
                <div />
                <button
                  type="button"
                  onClick={() => queueSnakeDirection("up")}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:border-accent"
                >
                  ↑
                </button>
                <div />
                <button
                  type="button"
                  onClick={() => queueSnakeDirection("left")}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:border-accent"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => queueSnakeDirection("down")}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:border-accent"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => queueSnakeDirection("right")}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:border-accent"
                >
                  →
                </button>
              </div>

              <p className="text-xs text-slate-400 md:hidden">Touch-Steuerung: Tippe auf die Pfeil-Buttons.</p>

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

            <p className="mt-3 text-sm text-slate-200">
              Schwierigkeit: {currentMineSettings.label} ({currentMineSettings.size}×{currentMineSettings.size}, {currentMineSettings.mines} Minen)
            </p>
            <p className="mt-1 text-sm text-slate-300">Verbleibende Minen (geschätzt): {remainingMines}</p>
            <p className="mt-1 text-sm text-slate-200">
              {mineGameOver ? "Verloren: Du hast eine Mine geöffnet." : mineWon ? "Gewonnen: Alle sicheren Felder sind aufgedeckt." : "Spiel läuft."}
            </p>

            <div
              className="mt-4 grid w-full max-w-[560px] gap-1"
              style={{ gridTemplateColumns: `repeat(${currentMineSettings.size}, minmax(0, 1fr))` }}
            >
              {mineBoard.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const content = cell.isOpen ? (cell.isMine ? "💣" : cell.neighborMines === 0 ? "" : cell.neighborMines) : cell.isFlagged ? "🚩" : "";

                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      type="button"
                      onClick={() => openMinesweeperCell(rowIndex, colIndex)}
                      onContextMenu={(event) => toggleMineFlag(event, rowIndex, colIndex)}
                      className={`aspect-square rounded border text-xs font-semibold sm:text-sm ${
                        cell.isOpen ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-700 bg-slate-800 text-slate-100 hover:border-accent"
                      }`}
                    >
                      {content}
                    </button>
                  );
                })
              )}
            </div>

            <button type="button" onClick={() => resetMinesweeper()} className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-accent">
              Neustart
            </button>
          </section>
        ) : null}
      </div>
    </main>
  );
}
