"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const gameTabs: { key: GameKey; label: string; description: string }[] = [
  { key: "tictactoe", label: "Tic-Tac-Toe", description: "2 Spieler lokal auf einem Gerät" },
  { key: "snake", label: "Snake", description: "Pfeiltasten steuern die Schlange" },
  { key: "minesweeper", label: "Minesweeper", description: "8x8 Feld mit Minen und Zahlen" }
];

const snakeBoardSize = 14;
const snakeTickMs = 180;
const minesweeperSize = 8;
const minesweeperMines = 10;

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

function createMinesweeperBoard(size: number, mineCount: number): MinesweeperCell[][] {
  const board = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({
      isMine: false,
      isOpen: false,
      isFlagged: false,
      neighborMines: 0
    }))
  );

  const allPositions = Array.from({ length: size * size }, (_, index) => index);

  for (let i = allPositions.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
  }

  for (let i = 0; i < mineCount; i += 1) {
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

  const [mineBoard, setMineBoard] = useState<MinesweeperCell[][]>(() => createMinesweeperBoard(minesweeperSize, minesweeperMines));
  const [mineGameOver, setMineGameOver] = useState(false);
  const [mineWon, setMineWon] = useState(false);

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

      if (isOppositeDirection(snakeDirectionRef.current, nextDirection)) {
        return;
      }

      snakeQueuedDirectionRef.current = nextDirection;

      if (!snakeRunning && !snakeGameOver) {
        setSnakeRunning(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeGame, snakeGameOver, snakeRunning]);

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
      if (currentRow < 0 || currentCol < 0 || currentRow >= minesweeperSize || currentCol >= minesweeperSize) {
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
    for (let row = 0; row < minesweeperSize; row += 1) {
      for (let col = 0; col < minesweeperSize; col += 1) {
        const cell = board[row][col];
        if (!cell.isMine && !cell.isOpen) {
          return false;
        }
      }
    }
    return true;
  }

  function openMinesweeperCell(row: number, col: number) {
    if (mineGameOver || mineWon) {
      return;
    }

    setMineBoard((previous) => {
      const next = previous.map((line) => line.map((cell) => ({ ...cell })));
      const cell = next[row][col];

      if (cell.isOpen || cell.isFlagged) {
        return previous;
      }

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

  function resetMinesweeper() {
    setMineBoard(createMinesweeperBoard(minesweeperSize, minesweeperMines));
    setMineGameOver(false);
    setMineWon(false);
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
            <p className="mt-1 text-sm text-slate-300">Steuerung mit Pfeiltasten. Futter sammeln erhöht den Score. Kollision beendet das Spiel.</p>

            <div className="mt-4 space-y-3">
              <p className="text-sm text-slate-200">Score: {snakeScore}</p>
              <p className="text-sm text-slate-300">
                {snakeGameOver ? "Game Over. Starte neu, um weiterzuspielen." : snakeRunning ? "Läuft..." : "Bereit. Starte das Spiel."}
              </p>

              <div className="grid w-full max-w-[420px] gap-0.5 rounded-lg border border-slate-700 bg-slate-800 p-2"
                style={{ gridTemplateColumns: `repeat(${snakeBoardSize}, minmax(0, 1fr))` }}>
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
            <p className="mt-1 text-sm text-slate-300">Öffne sichere Felder. Rechtsklick markiert Minen mit einer Flagge.</p>

            <p className="mt-3 text-sm text-slate-200">
              {mineGameOver ? "Verloren: Du hast eine Mine geöffnet." : mineWon ? "Gewonnen: Alle sicheren Felder sind aufgedeckt." : "Spiel läuft."}
            </p>

            <div className="mt-4 grid w-full max-w-[420px] grid-cols-8 gap-1">
              {mineBoard.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const content = cell.isOpen ? (cell.isMine ? "💣" : cell.neighborMines === 0 ? "" : cell.neighborMines) : cell.isFlagged ? "🚩" : "";

                  return (
                    <button
                      key={`${rowIndex}-${colIndex}`}
                      type="button"
                      onClick={() => openMinesweeperCell(rowIndex, colIndex)}
                      onContextMenu={(event) => toggleMineFlag(event, rowIndex, colIndex)}
                      className={`aspect-square rounded border text-sm font-semibold ${
                        cell.isOpen ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-700 bg-slate-800 text-slate-100 hover:border-accent"
                      }`}
                    >
                      {content}
                    </button>
                  );
                })
              )}
            </div>

            <button type="button" onClick={resetMinesweeper} className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-accent">
              Neustart
            </button>
          </section>
        ) : null}
      </div>
    </main>
  );
}
