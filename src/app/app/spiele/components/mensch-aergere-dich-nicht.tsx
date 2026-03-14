"use client";

import { useMemo, useState } from "react";

type LudoColor = "rot" | "blau" | "gruen" | "gelb";

type LudoPieceState = {
  position: number; // -1 = Haus, 0..39 = Laufbahn, 40..43 = Zielbahn
};

type LudoState = Record<LudoColor, LudoPieceState[]>;

type CellKind = "track" | "home" | "house" | "center" | "empty";

type CellMeta = {
  kind: CellKind;
  color?: LudoColor;
  key?: string;
};

const BOARD_SIZE = 13;

const ludoColors: LudoColor[] = ["rot", "blau", "gruen", "gelb"];

const ludoColorStyles: Record<LudoColor, string> = {
  rot: "bg-red-500",
  blau: "bg-blue-500",
  gruen: "bg-emerald-500",
  gelb: "bg-yellow-400"
};

const ludoColorTintStyles: Record<LudoColor, string> = {
  rot: "bg-red-900/30 border-red-500/50",
  blau: "bg-blue-900/30 border-blue-500/50",
  gruen: "bg-emerald-900/30 border-emerald-500/50",
  gelb: "bg-yellow-900/20 border-yellow-500/50"
};

const ludoColorLabel: Record<LudoColor, string> = {
  rot: "Rot",
  blau: "Blau",
  gruen: "Grün",
  gelb: "Gelb"
};

// Geometrisch neu aufgebaut: klarer 40er-Laufweg als ringförmige Ein-Spur-Bahn.
const trackCoordinates: Array<{ r: number; c: number }> = [
  // oben links -> oben rechts
  { r: 1, c: 1 },
  { r: 1, c: 2 },
  { r: 1, c: 3 },
  { r: 1, c: 4 },
  { r: 1, c: 5 },
  { r: 1, c: 6 },
  { r: 1, c: 7 },
  { r: 1, c: 8 },
  { r: 1, c: 9 },
  { r: 1, c: 10 },
  { r: 1, c: 11 },
  // rechts oben -> rechts unten
  { r: 2, c: 11 },
  { r: 3, c: 11 },
  { r: 4, c: 11 },
  { r: 5, c: 11 },
  { r: 6, c: 11 },
  { r: 7, c: 11 },
  { r: 8, c: 11 },
  { r: 9, c: 11 },
  { r: 10, c: 11 },
  { r: 11, c: 11 },
  // unten rechts -> unten links
  { r: 11, c: 10 },
  { r: 11, c: 9 },
  { r: 11, c: 8 },
  { r: 11, c: 7 },
  { r: 11, c: 6 },
  { r: 11, c: 5 },
  { r: 11, c: 4 },
  { r: 11, c: 3 },
  { r: 11, c: 2 },
  { r: 11, c: 1 },
  // links unten -> links oben
  { r: 10, c: 1 },
  { r: 9, c: 1 },
  { r: 8, c: 1 },
  { r: 7, c: 1 },
  { r: 6, c: 1 },
  { r: 5, c: 1 },
  { r: 4, c: 1 },
  { r: 3, c: 1 },
  { r: 2, c: 1 }
];

// Startfelder logisch auf den vier Seitenmitteln.
const startIndex: Record<LudoColor, number> = {
  rot: 35,   // links Mitte (6,1)
  blau: 5,   // oben Mitte (1,6)
  gruen: 15, // rechts Mitte (6,11)
  gelb: 25   // unten Mitte (11,6)
};

// Zielstrecken sauber zur Mitte ausgerichtet.
const homeStretchCoordinates: Record<LudoColor, Array<{ r: number; c: number }>> = {
  rot: [
    { r: 6, c: 2 },
    { r: 6, c: 3 },
    { r: 6, c: 4 },
    { r: 6, c: 5 }
  ],
  blau: [
    { r: 2, c: 6 },
    { r: 3, c: 6 },
    { r: 4, c: 6 },
    { r: 5, c: 6 }
  ],
  gruen: [
    { r: 6, c: 10 },
    { r: 6, c: 9 },
    { r: 6, c: 8 },
    { r: 6, c: 7 }
  ],
  gelb: [
    { r: 10, c: 6 },
    { r: 9, c: 6 },
    { r: 8, c: 6 },
    { r: 7, c: 6 }
  ]
};

// Klare 2x2-Hausblöcke in den Ecken.
const houseCoordinates: Record<LudoColor, Array<{ r: number; c: number }>> = {
  rot: [
    { r: 3, c: 3 },
    { r: 3, c: 4 },
    { r: 4, c: 3 },
    { r: 4, c: 4 }
  ],
  blau: [
    { r: 3, c: 8 },
    { r: 3, c: 9 },
    { r: 4, c: 8 },
    { r: 4, c: 9 }
  ],
  gruen: [
    { r: 8, c: 8 },
    { r: 8, c: 9 },
    { r: 9, c: 8 },
    { r: 9, c: 9 }
  ],
  gelb: [
    { r: 8, c: 3 },
    { r: 8, c: 4 },
    { r: 9, c: 3 },
    { r: 9, c: 4 }
  ]
};

function createInitialLudoState(): LudoState {
  return {
    rot: Array.from({ length: 4 }, () => ({ position: -1 })),
    blau: Array.from({ length: 4 }, () => ({ position: -1 })),
    gruen: Array.from({ length: 4 }, () => ({ position: -1 })),
    gelb: Array.from({ length: 4 }, () => ({ position: -1 }))
  };
}

function getGlobalTrackIndex(color: LudoColor, position: number): number | null {
  if (position < 0 || position > 39) {
    return null;
  }
  return (startIndex[color] + position) % 40;
}

function isInHomeStretch(position: number): boolean {
  return position >= 40;
}

function positionAfterMove(currentPosition: number, dice: number): number | null {
  if (currentPosition === -1) {
    return dice === 6 ? 0 : null;
  }

  if (isInHomeStretch(currentPosition)) {
    const target = currentPosition + dice;
    return target <= 43 ? target : null;
  }

  const remainingToEntry = 39 - currentPosition;
  if (dice <= remainingToEntry) {
    return currentPosition + dice;
  }

  const stepIntoHome = dice - remainingToEntry - 1;
  const homePos = 40 + stepIntoHome;
  return homePos <= 43 ? homePos : null;
}

function hasOwnPieceAt(ludoState: LudoState, color: LudoColor, position: number): boolean {
  return ludoState[color].some((piece) => piece.position === position);
}

function getMovablePieceIndices(ludoState: LudoState, color: LudoColor, dice: number): number[] {
  const movable: number[] = [];

  ludoState[color].forEach((piece, index) => {
    const target = positionAfterMove(piece.position, dice);
    if (target === null) {
      return;
    }

    if (hasOwnPieceAt(ludoState, color, target)) {
      return;
    }

    movable.push(index);
  });

  return movable;
}

function nextColor(color: LudoColor): LudoColor {
  const idx = ludoColors.indexOf(color);
  return ludoColors[(idx + 1) % ludoColors.length];
}

function isWinner(ludoState: LudoState, color: LudoColor): boolean {
  return ludoState[color].every((piece) => piece.position === 43);
}

const boardTemplate: CellMeta[][] = Array.from({ length: BOARD_SIZE }, () =>
  Array.from({ length: BOARD_SIZE }, () => ({ kind: "empty" as CellKind }))
);

// Laufweg
trackCoordinates.forEach((coord, trackIndex) => {
  boardTemplate[coord.r][coord.c] = { kind: "track", key: `track-${trackIndex}` };
});

// Zielstrecken
for (const color of ludoColors) {
  homeStretchCoordinates[color].forEach((coord, homeIndex) => {
    boardTemplate[coord.r][coord.c] = { kind: "home", color, key: `home-${color}-${homeIndex}` };
  });
}

// Häuser
for (const color of ludoColors) {
  houseCoordinates[color].forEach((coord, houseIndex) => {
    boardTemplate[coord.r][coord.c] = { kind: "house", color, key: `house-${color}-${houseIndex}` };
  });
}

// Brettmitte
for (let r = 5; r <= 7; r += 1) {
  for (let c = 5; c <= 7; c += 1) {
    if (boardTemplate[r][c].kind === "empty") {
      boardTemplate[r][c] = { kind: "center" };
    }
  }
}

export function MenschAergereDichNichtGame() {
  const [ludoState, setLudoState] = useState<LudoState>(() => createInitialLudoState());
  const [activePlayer, setActivePlayer] = useState<LudoColor>("rot");
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [canMove, setCanMove] = useState(false);
  const [winner, setWinner] = useState<LudoColor | null>(null);
  const [statusText, setStatusText] = useState("Würfle, um zu starten.");

  const movablePieceIndices = useMemo(() => {
    if (diceValue === null || winner) {
      return [];
    }
    return getMovablePieceIndices(ludoState, activePlayer, diceValue);
  }, [activePlayer, diceValue, ludoState, winner]);

  const boardOccupancy = useMemo(() => {
    const mapping = new Map<string, Array<{ color: LudoColor; pieceIndex: number }>>();

    for (const color of ludoColors) {
      let houseCounter = 0;

      ludoState[color].forEach((piece, pieceIndex) => {
        let key: string | null = null;

        if (piece.position >= 0 && piece.position <= 39) {
          const globalIndex = getGlobalTrackIndex(color, piece.position);
          if (globalIndex !== null) {
            key = `track-${globalIndex}`;
          }
        } else if (piece.position >= 40) {
          key = `home-${color}-${piece.position - 40}`;
        } else {
          key = `house-${color}-${houseCounter}`;
          houseCounter += 1;
        }

        if (!key) {
          return;
        }

        if (!mapping.has(key)) {
          mapping.set(key, []);
        }
        mapping.get(key)?.push({ color, pieceIndex });
      });
    }

    return mapping;
  }, [ludoState]);

  function resetGame() {
    setLudoState(createInitialLudoState());
    setActivePlayer("rot");
    setDiceValue(null);
    setCanMove(false);
    setWinner(null);
    setStatusText("Würfle, um zu starten.");
  }

  function passToNextPlayer(currentPlayer: LudoColor, rolledSix: boolean) {
    if (rolledSix) {
      setStatusText(`${ludoColorLabel[currentPlayer]} hat eine 6 gewürfelt und darf erneut würfeln.`);
      setActivePlayer(currentPlayer);
      setDiceValue(null);
      setCanMove(false);
      return;
    }

    const next = nextColor(currentPlayer);
    setActivePlayer(next);
    setDiceValue(null);
    setCanMove(false);
    setStatusText(`Keine Zugmöglichkeit. ${ludoColorLabel[next]} ist am Zug.`);
  }

  function rollDice() {
    if (winner || canMove) {
      return;
    }

    const rolled = Math.floor(Math.random() * 6) + 1;
    const movable = getMovablePieceIndices(ludoState, activePlayer, rolled);

    setDiceValue(rolled);

    if (movable.length === 0) {
      passToNextPlayer(activePlayer, rolled === 6);
      return;
    }

    setCanMove(true);
    setStatusText(`${ludoColorLabel[activePlayer]} hat ${rolled} gewürfelt. Wähle eine markierte Figur.`);
  }

  function movePiece(pieceIndex: number) {
    if (!canMove || diceValue === null || winner) {
      return;
    }

    const possible = getMovablePieceIndices(ludoState, activePlayer, diceValue);
    if (!possible.includes(pieceIndex)) {
      return;
    }

    const currentPlayer = activePlayer;
    const rolled = diceValue;

    setLudoState((previous) => {
      const nextState: LudoState = {
        rot: previous.rot.map((piece) => ({ ...piece })),
        blau: previous.blau.map((piece) => ({ ...piece })),
        gruen: previous.gruen.map((piece) => ({ ...piece })),
        gelb: previous.gelb.map((piece) => ({ ...piece }))
      };

      const movingPiece = nextState[currentPlayer][pieceIndex];
      const targetPosition = positionAfterMove(movingPiece.position, rolled);
      if (targetPosition === null) {
        return previous;
      }

      movingPiece.position = targetPosition;

      const targetGlobal = getGlobalTrackIndex(currentPlayer, targetPosition);
      if (targetGlobal !== null) {
        for (const enemyColor of ludoColors) {
          if (enemyColor === currentPlayer) {
            continue;
          }

          nextState[enemyColor].forEach((enemyPiece) => {
            const enemyGlobal = getGlobalTrackIndex(enemyColor, enemyPiece.position);
            if (enemyGlobal === targetGlobal) {
              enemyPiece.position = -1;
            }
          });
        }
      }

      const playerWon = isWinner(nextState, currentPlayer);
      if (playerWon) {
        setWinner(currentPlayer);
        setStatusText(`${ludoColorLabel[currentPlayer]} hat gewonnen!`);
        setCanMove(false);
        setDiceValue(null);
        return nextState;
      }

      if (rolled === 6) {
        setStatusText(`${ludoColorLabel[currentPlayer]} hat eine 6 gewürfelt und ist erneut am Zug.`);
        setActivePlayer(currentPlayer);
      } else {
        const next = nextColor(currentPlayer);
        setActivePlayer(next);
        setStatusText(`${ludoColorLabel[next]} ist am Zug.`);
      }

      setCanMove(false);
      setDiceValue(null);

      return nextState;
    });
  }

  function renderOccupants(key: string) {
    const occupants = boardOccupancy.get(key) ?? [];
    return (
      <div className="flex h-full w-full items-center justify-center gap-0.5">
        {occupants.map((piece) => (
          <span key={`${piece.color}-${piece.pieceIndex}`} className={`h-2.5 w-2.5 rounded-full ${ludoColorStyles[piece.color]}`} />
        ))}
      </div>
    );
  }

  function cellClass(cell: CellMeta): string {
    if (cell.kind === "track") {
      const trackIndex = Number(cell.key?.split("-")[1] ?? -1);
      const startColor = ludoColors.find((color) => startIndex[color] === trackIndex);
      if (startColor) {
        return `aspect-square rounded border ${ludoColorTintStyles[startColor]}`;
      }
      return "aspect-square rounded border border-slate-700 bg-slate-800";
    }

    if (cell.kind === "home" || cell.kind === "house") {
      return `aspect-square rounded border ${ludoColorTintStyles[cell.color!]}`;
    }

    if (cell.kind === "center") {
      return "aspect-square rounded border border-slate-700 bg-slate-900";
    }

    return "aspect-square rounded border border-slate-800 bg-slate-950/40";
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-card p-6">
      <h3 className="text-xl font-semibold">Mensch ärgere dich nicht</h3>
      <p className="mt-1 text-sm text-slate-300">
        4 Spieler lokal (Rot, Blau, Grün, Gelb). Mit einer 6 kommst du aus dem Haus und darfst erneut würfeln. Gegner können geschlagen werden.
      </p>

      <div className="mt-4 grid gap-3 rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-sm md:grid-cols-2">
        <p className="text-slate-200">Aktiver Spieler: <span className="font-semibold">{ludoColorLabel[activePlayer]}</span></p>
        <p className="text-slate-300">Würfel: {diceValue ?? "-"}</p>
        <p className="md:col-span-2 text-slate-200">{statusText}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={rollDice}
          disabled={!!winner || canMove}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          Würfeln
        </button>
        <button
          type="button"
          onClick={resetGame}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-accent"
        >
          Neustart
        </button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,560px)_1fr]">
        <div className="overflow-x-auto pb-1">
          <div
            className="grid min-w-[520px] gap-1 rounded-lg border border-slate-700 bg-slate-800 p-2"
            style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}
          >
            {boardTemplate.flatMap((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div key={`${rowIndex}-${colIndex}`} className={cellClass(cell)}>
                  {cell.key ? renderOccupants(cell.key) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-slate-300">Mögliche Figuren ({ludoColorLabel[activePlayer]}):</p>
          <div className="space-y-2">
            {ludoState[activePlayer].map((piece, pieceIndex) => {
              const canMovePiece = movablePieceIndices.includes(pieceIndex);
              const location =
                piece.position === -1
                  ? "Haus"
                  : piece.position >= 40
                    ? `Ziel ${piece.position - 39}/4`
                    : `Laufbahn ${piece.position + 1}`;

              return (
                <button
                  key={pieceIndex}
                  type="button"
                  onClick={() => movePiece(pieceIndex)}
                  disabled={!canMovePiece || !canMove || !!winner}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm ${
                    canMovePiece && canMove ? "border-accent bg-slate-900 text-white" : "border-slate-700 bg-slate-900/50 text-slate-300"
                  } disabled:opacity-70`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${ludoColorStyles[activePlayer]}`} />
                    Figur {pieceIndex + 1}
                  </span>
                  <span>{location}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
