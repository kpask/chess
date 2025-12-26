import { useState } from "react";

function App() {
  const initialBoard = () => {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    for(let i = 0; i < 8; i++) {
      for(let j = 0; j < 8; j++) {
        board[i][j] = { color: (i + j) % 2 === 0 ? "white" : "black", piece: null };
      }
    }
    return board;
  }
  

  const [status, setStatus] = useState<"menu" | "waiting" | "inGame" | "gameOver" | "join">("menu");
  const [board, setBoard] = useState(initialBoard);

  function handleCreateGame() {
    setStatus("waiting");
  }

  function handleJoinGame() {
    setStatus("join")
  }


  return (
    <>
      <div className="board-container">
        <div className="board">
          {board.map((row, i) =>
            row.map((square, j) => (
              <div key={`${i}-${j}`} className={`square ${square.color}`}>
                {square.piece && <img src={square.piece.img} />}
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
