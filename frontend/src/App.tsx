import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import type { Square } from "chess.js";
import { io } from "socket.io-client";

// Piece Imports
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
import moveSound from "./sound/move.mp3"; 

const socket = io("http://localhost:3000");
const STARTING_TIME = 300; // 5 minutes
const INCREMENT = 3;       // 3 seconds

export default function App() {
  const [game, setGame] = useState(new Chess());
  const [whiteTime, setWhiteTime] = useState(STARTING_TIME);
  const [blackTime, setBlackTime] = useState(STARTING_TIME);
  const [isPaused, setIsPaused] = useState(true);
  
  const [selected, setSelected] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [opponentName, setOpponentName] = useState("Waiting...");
  
  const [status, setStatus] = useState<"menu" | "setup" | "playing">("menu");
  const [username, setUsername] = useState("");
  const [gameId, setGameId] = useState("");
  const [asBlack, setAsBlack] = useState(false);

  const pieceMap: Record<string, string> = {
    w_p: whitePawn, w_r: whiteRook, w_n: whiteKnight, w_b: whiteBishop, w_q: whiteQueen, w_k: whiteKing,
    b_p: blackPawn, b_r: blackRook, b_n: blackKnight, b_b: blackBishop, b_q: blackQueen, b_k: blackKing,
  };

  // Timer Countdown Logic
  useEffect(() => {
    if (isPaused || game.isGameOver()) return;

    const interval = setInterval(() => {
      if (game.turn() === 'w') {
        setWhiteTime((prev) => Math.max(0, prev - 1));
      } else {
        setBlackTime((prev) => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [game.turn(), isPaused, game]);

  // Handle Game Over by Time
  useEffect(() => {
    if (whiteTime === 0 || blackTime === 0) {
        setIsPaused(true);
    }
  }, [whiteTime, blackTime]);

  useEffect(() => {
    socket.on("move-received", (newFen: string) => {
      const newGame = new Chess(newFen);
      // Logic: If opponent moved, they get the increment
      if (newGame.turn() === 'w') setBlackTime(t => t + INCREMENT);
      else setWhiteTime(t => t + INCREMENT);
      
      setGame(newGame);
      new Audio(moveSound).play().catch(() => {});
    });

    socket.on("player-data", (players: any[]) => {
      const opponent = players.find(p => p.username !== username);
      if (opponent) {
        setOpponentName(opponent.username);
        setIsPaused(false); // Start clocks once both players are in
      }
    });

    return () => { socket.off("move-received"); socket.off("player-data"); };
  }, [username]);

  function handleSquareClick(squarePos: string) {
    if (game.isGameOver() || whiteTime === 0 || blackTime === 0) return;
    const playerColor = asBlack ? 'b' : 'w';
    
    if (legalMoves.includes(squarePos)) {
      const gameCopy = new Chess(game.fen());
      gameCopy.move({ from: selected!, to: squarePos, promotion: "q" });
      
      // Apply Increment to current player
      if (game.turn() === 'w') setWhiteTime(t => t + INCREMENT);
      else setBlackTime(t => t + INCREMENT);

      setGame(gameCopy);
      setSelected(null);
      setLegalMoves([]);
      setHighlights([]);
      new Audio(moveSound).play().catch(() => {});
      socket.emit("make-move", { gameId, fen: gameCopy.fen() });
      return;
    }

    const piece = game.get(squarePos as Square);
    if (piece && piece.color === playerColor && game.turn() === playerColor) {
      setSelected(squarePos);
      const moves = game.moves({ square: squarePos as Square, verbose: true });
      setLegalMoves(moves.map(m => m.to));
    } else {
      setSelected(null);
      setLegalMoves([]);
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRightClick = (e: React.MouseEvent, pos: string) => {
    e.preventDefault();
    setHighlights(prev => prev.includes(pos) ? prev.filter(s => s !== pos) : [...prev, pos]);
  };

  const displayBoard = asBlack 
    ? [...game.board()].reverse().map(r => [...r].reverse()) 
    : game.board();

  return (
    <div className="board-container">
      {status === "playing" && (
        <div className="game-header">
          <div className="header-item">
            <span className="header-label">{asBlack ? "White" : "Black"} (Opponent)</span>
            <span className="header-value">{opponentName}</span>
            <span className="timer-val" style={{color: (asBlack ? whiteTime : blackTime) < 30 ? 'red' : 'white'}}>
                {formatTime(asBlack ? whiteTime : blackTime)}
            </span>
          </div>
          
          <div className="turn-pill" style={{ 
            backgroundColor: game.turn() === (asBlack ? 'b' : 'w') ? "#4CAF50" : "#333" 
          }}>
            {game.turn() === (asBlack ? 'b' : 'w') ? "YOUR TURN" : "WAITING..."}
          </div>

          <div className="header-item">
            <span className="header-label">Room Code</span>
            <span className="header-value" style={{color: 'salmon'}}>{gameId}</span>
          </div>

          <div className="header-item">
            <span className="header-label">You ({asBlack ? "Black" : "White"})</span>
            <span className="header-value">{username}</span>
            <span className="timer-val" style={{color: (asBlack ? blackTime : whiteTime) < 30 ? 'red' : 'white'}}>
                {formatTime(asBlack ? blackTime : whiteTime)}
            </span>
          </div>
        </div>
      )}

      <div className="board">
        {displayBoard.map((row, i) => row.map((square, j) => {
          const fileIdx = asBlack ? 7 - j : j;
          const rankIdx = asBlack ? i : 7 - i;
          const squarePos = `${String.fromCharCode(97 + fileIdx)}${rankIdx + 1}`;
          return (
            <div
              key={squarePos}
              className={`square ${(i + j) % 2 === 0 ? "white" : "black"} 
                ${selected === squarePos ? "selected" : ""} 
                ${highlights.includes(squarePos) ? "highlight-red" : ""}`}
              onClick={() => handleSquareClick(squarePos)}
              onContextMenu={(e) => handleRightClick(e, squarePos)}
            >
              {square && <img src={pieceMap[`${square.color}_${square.type}`]} className="piece" />}
              {legalMoves.includes(squarePos) && <div className="move-dot" />}
            </div>
          );
        }))}
      </div>

      {status !== "playing" && (
        <div className="overlay" style={overlayStyle}>
          <div className="menu" style={menuStyle}>
            <h2>Chess Online</h2>
            {status === "menu" ? (
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => { setGameId(Math.random().toString(36).substring(2, 7)); setAsBlack(false); setStatus("setup"); }}>Create Game</button>
                <button onClick={() => { setAsBlack(true); setStatus("setup"); }}>Join Game</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} />
                <input placeholder="Room ID" value={gameId} onChange={e => setGameId(e.target.value)} style={inputStyle} readOnly={!asBlack} />
                <button onClick={() => { socket.emit("join-game", { gameId, username }); setStatus("playing"); }}>Enter Room</button>
              </div>
            )}
          </div>
        </div>
      )}

      {(game.isGameOver() || whiteTime === 0 || blackTime === 0) && (
        <div className="overlay" style={overlayStyle}>
          <div className="menu" style={menuStyle}>
            <h1 style={{color: 'black'}}>Game Over</h1>
            <p style={{color: 'black', marginBottom: '20px'}}>
                {whiteTime === 0 ? "Black wins on time!" : 
                 blackTime === 0 ? "White wins on time!" : 
                 game.isCheckmate() ? "Checkmate!" : "Draw!"}
            </p>
            <button onClick={() => window.location.reload()}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
}

const overlayStyle: any = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 };
const menuStyle: any = { background: "white", padding: "40px", borderRadius: "20px", textAlign: "center", color: "black" };
const inputStyle: any = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd" };