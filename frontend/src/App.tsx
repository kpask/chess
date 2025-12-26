import { useState } from "react";

// Import all piece SVGs as URLs
import whitePawn from "./pieces/white_pawn.svg";
import whiteRook from "./pieces/white_rook.svg";
import whiteKnight from "./pieces/white_knight.svg";
import whiteBishop from "./pieces/white_bishop.svg";
import whiteQueen from "./pieces/white_queen.svg";
import whiteKing from "./pieces/white_king.svg";

import blackPawn from "./pieces/black_pawn.svg";
import blackRook from "./pieces/black_rook.svg";
import blackKnight from "./pieces/black_knight.svg";
import blackBishop from "./pieces/black_bishop.svg";
import blackQueen from "./pieces/black_queen.svg";
import blackKing from "./pieces/black_king.svg";

function App() {
  type Piece = {
    type: "pawn" | "rook" | "knight" | "bishop" | "queen" | "king";
    color: "white" | "black";
    img: string;
  };

  const initialBoard = () => {
    const board: { color: "white" | "black"; piece: Piece | null }[][] = [];
    const backRank: Piece["type"][] = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];

    const pieceMap: Record<string, string> = {
      white_pawn: whitePawn,
      white_rook: whiteRook,
      white_knight: whiteKnight,
      white_bishop: whiteBishop,
      white_queen: whiteQueen,
      white_king: whiteKing,
      black_pawn: blackPawn,
      black_rook: blackRook,
      black_knight: blackKnight,
      black_bishop: blackBishop,
      black_queen: blackQueen,
      black_king: blackKing,
    };

    for (let i = 0; i < 8; i++) {
      const row: typeof board[0] = [];

      for (let j = 0; j < 8; j++) {
        const squareColor = (i + j) % 2 === 0 ? "white" : "black";
        let piece: Piece | null = null;

        // Pawns
        if (i === 1) piece = { type: "pawn", color: "black", img: pieceMap.black_pawn };
        if (i === 6) piece = { type: "pawn", color: "white", img: pieceMap.white_pawn };

        // Back rank
        if (i === 0) piece = { type: backRank[j], color: "black", img: pieceMap[`black_${backRank[j]}`] };
        if (i === 7) piece = { type: backRank[j], color: "white", img: pieceMap[`white_${backRank[j]}`] };

        row.push({ color: squareColor, piece });
      }

      board.push(row);
    }

    return board;
  };

  const [status, setStatus] = useState<"menu" | "waiting" | "inGame" | "gameOver" | "join">("menu");
  const [board, setBoard] = useState(initialBoard);
  const [asBlack, setAsBlack] = useState(false);

  function handleCreateGame() {
    setStatus("waiting");
  }

  function handleJoinGame() {
    setStatus("join");
    setAsBlack(true); // flip board for black
  }

  const displayBoard = asBlack
    ? board.slice().reverse().map(row => row.slice().reverse())
    : board;

  return (
    <>
      <div className="board-container">
        <div className="board">
          {displayBoard.map((row, i) =>
            row.map((square, j) => (
              <div key={`${i}-${j}`} className={`square ${square.color}`}>
                {square.piece && <img src={square.piece.img} className="piece" />}
              </div>
            ))
          )}
        </div>
      </div>

      {status === "menu" && (
        <div className="overlay">
          <div className="menu">
            <h2>Chess Online</h2>
            <button onClick={handleCreateGame}>Create Game</button>
            <button onClick={handleJoinGame}>Join Game</button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
