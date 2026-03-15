"use client";

import { useMemo, useState } from "react";

type ChessColor = "w" | "b";
type PieceType = "p" | "r" | "n" | "b" | "q" | "k";

type Piece = {
  type: PieceType;
  color: ChessColor;
  hasMoved: boolean;
};

type Square = { row: number; col: number };

type EnPassantTarget = {
  target: Square;
  pawnSquare: Square;
  pawnColor: ChessColor;
} | null;

type ChessMove = {
  from: Square;
  to: Square;
  isCastle?: "king" | "queen";
  isEnPassant?: boolean;
  promotion?: PieceType;
};

type Board = Array<Array<Piece | null>>;

function initialBoard(): Board {
  const emptyRow = () => Array.from({ length: 8 }, () => null as Piece | null);
  const board: Board = Array.from({ length: 8 }, () => emptyRow());

  const setupBackRank = (row: number, color: ChessColor) => {
    const order: PieceType[] = ["r", "n", "b", "q", "k", "b", "n", "r"];
    order.forEach((type, col) => {
      board[row][col] = { type, color, hasMoved: false };
    });
  };

  setupBackRank(0, "b");
  setupBackRank(7, "w");

  for (let col = 0; col < 8; col += 1) {
    board[1][col] = { type: "p", color: "b", hasMoved: false };
    board[6][col] = { type: "p", color: "w", hasMoved: false };
  }

  return board;
}

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function opposite(color: ChessColor): ChessColor {
  return color === "w" ? "b" : "w";
}

function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((piece) => (piece ? { ...piece } : null)));
}

function findKing(board: Board, color: ChessColor): Square | null {
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (piece && piece.color === color && piece.type === "k") {
        return { row, col };
      }
    }
  }
  return null;
}

function isSquareAttacked(board: Board, square: Square, byColor: ChessColor): boolean {
  const pawnDir = byColor === "w" ? -1 : 1;
  const pawnRows = [square.row - pawnDir];

  for (const r of pawnRows) {
    for (const c of [square.col - 1, square.col + 1]) {
      if (!inBounds(r, c)) {
        continue;
      }
      const p = board[r][c];
      if (p && p.color === byColor && p.type === "p") {
        return true;
      }
    }
  }

  const knightMoves = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1]
  ];

  for (const [dr, dc] of knightMoves) {
    const r = square.row + dr;
    const c = square.col + dc;
    if (!inBounds(r, c)) {
      continue;
    }
    const p = board[r][c];
    if (p && p.color === byColor && p.type === "n") {
      return true;
    }
  }

  const rookDirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];

  for (const [dr, dc] of rookDirs) {
    let r = square.row + dr;
    let c = square.col + dc;
    while (inBounds(r, c)) {
      const p = board[r][c];
      if (p) {
        if (p.color === byColor && (p.type === "r" || p.type === "q")) {
          return true;
        }
        break;
      }
      r += dr;
      c += dc;
    }
  }

  const bishopDirs = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1]
  ];

  for (const [dr, dc] of bishopDirs) {
    let r = square.row + dr;
    let c = square.col + dc;
    while (inBounds(r, c)) {
      const p = board[r][c];
      if (p) {
        if (p.color === byColor && (p.type === "b" || p.type === "q")) {
          return true;
        }
        break;
      }
      r += dr;
      c += dc;
    }
  }

  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) {
        continue;
      }
      const r = square.row + dr;
      const c = square.col + dc;
      if (!inBounds(r, c)) {
        continue;
      }
      const p = board[r][c];
      if (p && p.color === byColor && p.type === "k") {
        return true;
      }
    }
  }

  return false;
}

function isInCheck(board: Board, color: ChessColor): boolean {
  const king = findKing(board, color);
  if (!king) {
    return false;
  }
  return isSquareAttacked(board, king, opposite(color));
}

function applyMove(board: Board, move: ChessMove, enPassant: EnPassantTarget): { board: Board; nextEnPassant: EnPassantTarget } {
  const next = cloneBoard(board);
  const piece = next[move.from.row][move.from.col];
  if (!piece) {
    return { board: next, nextEnPassant: null };
  }

  next[move.from.row][move.from.col] = null;

  if (move.isEnPassant && enPassant) {
    next[enPassant.pawnSquare.row][enPassant.pawnSquare.col] = null;
  }

  if (move.isCastle) {
    if (move.isCastle === "king") {
      const rook = next[move.from.row][7];
      next[move.from.row][7] = null;
      if (rook) {
        next[move.from.row][5] = { ...rook, hasMoved: true };
      }
    } else {
      const rook = next[move.from.row][0];
      next[move.from.row][0] = null;
      if (rook) {
        next[move.from.row][3] = { ...rook, hasMoved: true };
      }
    }
  }

  const movedPiece: Piece = { ...piece, hasMoved: true };
  if (move.promotion) {
    movedPiece.type = move.promotion;
  }
  next[move.to.row][move.to.col] = movedPiece;

  let nextEnPassant: EnPassantTarget = null;
  if (piece.type === "p" && Math.abs(move.to.row - move.from.row) === 2) {
    const direction = piece.color === "w" ? -1 : 1;
    nextEnPassant = {
      target: { row: move.from.row + direction, col: move.from.col },
      pawnSquare: { row: move.to.row, col: move.to.col },
      pawnColor: piece.color
    };
  }

  return { board: next, nextEnPassant };
}

function generatePseudoMoves(board: Board, from: Square, enPassant: EnPassantTarget): ChessMove[] {
  const piece = board[from.row][from.col];
  if (!piece) {
    return [];
  }

  const moves: ChessMove[] = [];

  if (piece.type === "p") {
    const direction = piece.color === "w" ? -1 : 1;
    const startRow = piece.color === "w" ? 6 : 1;
    const oneStep = { row: from.row + direction, col: from.col };

    if (inBounds(oneStep.row, oneStep.col) && !board[oneStep.row][oneStep.col]) {
      moves.push({ from, to: oneStep });

      const twoStep = { row: from.row + direction * 2, col: from.col };
      if (from.row === startRow && !board[twoStep.row][twoStep.col]) {
        moves.push({ from, to: twoStep });
      }
    }

    for (const dc of [-1, 1]) {
      const target = { row: from.row + direction, col: from.col + dc };
      if (!inBounds(target.row, target.col)) {
        continue;
      }

      const targetPiece = board[target.row][target.col];
      if (targetPiece && targetPiece.color !== piece.color) {
        moves.push({ from, to: target });
      }

      if (
        enPassant &&
        enPassant.target.row === target.row &&
        enPassant.target.col === target.col &&
        enPassant.pawnColor !== piece.color
      ) {
        moves.push({ from, to: target, isEnPassant: true });
      }
    }
  }

  if (piece.type === "n") {
    const jumps = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1]
    ];
    for (const [dr, dc] of jumps) {
      const r = from.row + dr;
      const c = from.col + dc;
      if (!inBounds(r, c)) {
        continue;
      }
      const target = board[r][c];
      if (!target || target.color !== piece.color) {
        moves.push({ from, to: { row: r, col: c } });
      }
    }
  }

  if (piece.type === "b" || piece.type === "r" || piece.type === "q") {
    const dirs: Array<[number, number]> = [];
    if (piece.type === "b" || piece.type === "q") {
      dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
    }
    if (piece.type === "r" || piece.type === "q") {
      dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
    }

    for (const [dr, dc] of dirs) {
      let r = from.row + dr;
      let c = from.col + dc;
      while (inBounds(r, c)) {
        const target = board[r][c];
        if (!target) {
          moves.push({ from, to: { row: r, col: c } });
        } else {
          if (target.color !== piece.color) {
            moves.push({ from, to: { row: r, col: c } });
          }
          break;
        }
        r += dr;
        c += dc;
      }
    }
  }

  if (piece.type === "k") {
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) {
          continue;
        }
        const r = from.row + dr;
        const c = from.col + dc;
        if (!inBounds(r, c)) {
          continue;
        }
        const target = board[r][c];
        if (!target || target.color !== piece.color) {
          moves.push({ from, to: { row: r, col: c } });
        }
      }
    }

    if (!piece.hasMoved && !isInCheck(board, piece.color)) {
      const row = from.row;
      const rookKingSide = board[row][7];
      if (
        rookKingSide &&
        rookKingSide.type === "r" &&
        rookKingSide.color === piece.color &&
        !rookKingSide.hasMoved &&
        !board[row][5] &&
        !board[row][6] &&
        !isSquareAttacked(board, { row, col: 5 }, opposite(piece.color)) &&
        !isSquareAttacked(board, { row, col: 6 }, opposite(piece.color))
      ) {
        moves.push({ from, to: { row, col: 6 }, isCastle: "king" });
      }

      const rookQueenSide = board[row][0];
      if (
        rookQueenSide &&
        rookQueenSide.type === "r" &&
        rookQueenSide.color === piece.color &&
        !rookQueenSide.hasMoved &&
        !board[row][1] &&
        !board[row][2] &&
        !board[row][3] &&
        !isSquareAttacked(board, { row, col: 3 }, opposite(piece.color)) &&
        !isSquareAttacked(board, { row, col: 2 }, opposite(piece.color))
      ) {
        moves.push({ from, to: { row, col: 2 }, isCastle: "queen" });
      }
    }
  }

  return moves;
}

function generateLegalMoves(board: Board, from: Square, enPassant: EnPassantTarget): ChessMove[] {
  const piece = board[from.row][from.col];
  if (!piece) {
    return [];
  }

  const pseudo = generatePseudoMoves(board, from, enPassant);
  const legal = pseudo.filter((move) => {
    const result = applyMove(board, move, enPassant);
    return !isInCheck(result.board, piece.color);
  });

  return legal;
}

function collectAllLegalMoves(board: Board, color: ChessColor, enPassant: EnPassantTarget): ChessMove[] {
  const all: ChessMove[] = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece || piece.color !== color) {
        continue;
      }
      all.push(...generateLegalMoves(board, { row, col }, enPassant));
    }
  }
  return all;
}

function pieceSymbol(piece: Piece): string {
  const symbols: Record<ChessColor, Record<PieceType, string>> = {
    w: { p: "♙", r: "♖", n: "♘", b: "♗", q: "♕", k: "♔" },
    b: { p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚" }
  };
  return symbols[piece.color][piece.type];
}

function squareKey(square: Square): string {
  return `${square.row}-${square.col}`;
}

export function ChessV1Game() {
  const [board, setBoard] = useState<Board>(() => initialBoard());
  const [turn, setTurn] = useState<ChessColor>("w");
  const [selected, setSelected] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<ChessMove[]>([]);
  const [enPassant, setEnPassant] = useState<EnPassantTarget>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{
    boardAfterMove: Board;
    square: Square;
    nextTurn: ChessColor;
    enPassantAfterMove: EnPassantTarget;
  } | null>(null);

  const allLegalMovesCurrent = useMemo(() => collectAllLegalMoves(board, turn, enPassant), [board, enPassant, turn]);
  const inCheck = useMemo(() => isInCheck(board, turn), [board, turn]);
  const isMate = inCheck && allLegalMovesCurrent.length === 0;
  const isStalemate = !inCheck && allLegalMovesCurrent.length === 0;

  function resetGame() {
    setBoard(initialBoard());
    setTurn("w");
    setSelected(null);
    setLegalTargets([]);
    setEnPassant(null);
    setPendingPromotion(null);
  }

  function finishTurn(nextBoard: Board, nextTurn: ChessColor, nextEnPassant: EnPassantTarget) {
    setBoard(nextBoard);
    setTurn(nextTurn);
    setEnPassant(nextEnPassant);
    setSelected(null);
    setLegalTargets([]);
  }

  function choosePromotion(type: PieceType) {
    if (!pendingPromotion) {
      return;
    }

    const nextBoard = cloneBoard(pendingPromotion.boardAfterMove);
    const current = nextBoard[pendingPromotion.square.row][pendingPromotion.square.col];
    if (current) {
      nextBoard[pendingPromotion.square.row][pendingPromotion.square.col] = {
        ...current,
        type,
        hasMoved: true
      };
    }

    finishTurn(nextBoard, pendingPromotion.nextTurn, pendingPromotion.enPassantAfterMove);
    setPendingPromotion(null);
  }

  function handleSquareClick(row: number, col: number) {
    if (pendingPromotion || isMate || isStalemate) {
      return;
    }

    const clickedPiece = board[row][col];

    const legalMoveToClicked = legalTargets.find((move) => move.to.row === row && move.to.col === col);
    if (selected && legalMoveToClicked) {
      const piece = board[selected.row][selected.col];
      if (!piece) {
        setSelected(null);
        setLegalTargets([]);
        return;
      }

      const result = applyMove(board, legalMoveToClicked, enPassant);
      const movedPiece = result.board[legalMoveToClicked.to.row][legalMoveToClicked.to.col];
      const nextTurn = opposite(piece.color);

      if (movedPiece && movedPiece.type === "p" && (legalMoveToClicked.to.row === 0 || legalMoveToClicked.to.row === 7)) {
        setPendingPromotion({
          boardAfterMove: result.board,
          square: legalMoveToClicked.to,
          nextTurn,
          enPassantAfterMove: result.nextEnPassant
        });
        setSelected(null);
        setLegalTargets([]);
        return;
      }

      finishTurn(result.board, nextTurn, result.nextEnPassant);
      return;
    }

    if (!clickedPiece || clickedPiece.color !== turn) {
      setSelected(null);
      setLegalTargets([]);
      return;
    }

    const from = { row, col };
    setSelected(from);
    setLegalTargets(generateLegalMoves(board, from, enPassant));
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-card p-6">
      <h3 className="text-xl font-semibold">Schach V1</h3>
      <p className="mt-1 text-sm text-slate-300">
        Lokales 2-Spieler-Schach mit legalen Zügen, Schach/Schachmatt/Patt, Rochade, En Passant und Bauernumwandlung.
      </p>

      <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-sm">
        <p className="text-slate-200">Am Zug: <span className="font-semibold">{turn === "w" ? "Weiß" : "Schwarz"}</span></p>
        <p className="mt-1 text-slate-300">
          {isMate
            ? `Schachmatt! ${turn === "w" ? "Schwarz" : "Weiß"} gewinnt.`
            : isStalemate
              ? "Patt: Keine legalen Züge mehr."
              : inCheck
                ? "Schach!"
                : "Spiel läuft."}
        </p>
      </div>

      {pendingPromotion ? (
        <div className="mt-3 rounded-lg border border-accent/40 bg-slate-900 p-3 text-sm">
          <p className="text-slate-200">Bauernumwandlung: Wähle die neue Figur.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["q", "r", "b", "n"] as PieceType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => choosePromotion(type)}
                className="rounded border border-slate-700 bg-slate-800 px-3 py-1 text-slate-200 hover:border-accent"
              >
                {type === "q" ? "Dame" : type === "r" ? "Turm" : type === "b" ? "Läufer" : "Springer"}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto pb-1">
        <div className="grid min-w-[420px] grid-cols-8 rounded-lg border border-slate-700 p-1">
          {Array.from({ length: 64 }, (_, idx) => {
            const row = Math.floor(idx / 8);
            const col = idx % 8;
            const piece = board[row][col];
            const isDark = (row + col) % 2 === 1;
            const isSelected = selected?.row === row && selected?.col === col;
            const isLegal = legalTargets.some((move) => move.to.row === row && move.to.col === col);
            const pieceColorClass = piece?.color === "w" ? "text-blue-500" : piece?.color === "b" ? "text-red-500" : "";

            return (
              <button
                key={`${row}-${col}`}
                type="button"
                onClick={() => handleSquareClick(row, col)}
                className={`relative aspect-square border text-3xl font-bold leading-none sm:text-4xl ${
                  isDark ? "border-slate-700 bg-slate-700/70" : "border-slate-700 bg-slate-200 text-slate-900"
                } ${isSelected ? "outline outline-2 outline-accent" : ""}`}
              >
                <span className={`drop-shadow-[0_0_2px_rgba(0,0,0,0.8)] ${pieceColorClass}`}>{piece ? pieceSymbol(piece) : ""}</span>
                {isLegal ? <span className="pointer-events-none absolute inset-0 m-auto h-3 w-3 rounded-full bg-accent/80" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={resetGame}
        className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-accent"
      >
        Neustart
      </button>
    </section>
  );
}
