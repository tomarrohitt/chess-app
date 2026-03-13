import { Chess, Square } from "chess.js";
import { useRef, useState } from "react";
import { Chessboard, SquareHandlerArgs } from "react-chessboard";

export const GameBoard = () => {

  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;

  const [chessPosition, setChessPosition] = useState(chessGame.fen());
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] =
    useState<Record<string, React.CSSProperties>>({});
  function makeRandomMove() {
    const possibleMoves = chessGame.moves();

    if (chessGame.isGameOver()) {
      return;
    }

    const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

    chessGame.move(randomMove);

    setChessPosition(chessGame.fen());
  }

  function getMoveOptions(square: Square) {
    const moves = chessGame.moves({
      square: moveFrom as Square,
      verbose: true
    });

    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }

    const newSquares: Record<string, React.CSSProperties> = {};

    for (const move of moves) {
      const pieceOnTarget = chessGame.get(move.to);

      newSquares[move.to] = {
        background:
          pieceOnTarget && pieceOnTarget.color !== chessGame.get(square)?.color
            ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
            : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
        borderRadius: "50%"
      };
    }

    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)'
    };

    setOptionSquares(newSquares);

    return true;
  }
  function onSquareClick({
    square,
    piece
  }: SquareHandlerArgs) {
    if (!moveFrom && piece) {
      const hasMoveOptions = getMoveOptions(square as Square);

      if (hasMoveOptions) {
        setMoveFrom(square as Square);
      }

      return;
    }

    const moves = chessGame.moves({
      square: moveFrom as Square,
      verbose: true
    });
    const foundMove = moves.find(m => m.from === moveFrom && m.to === square);

    if (!foundMove) {
      const hasMoveOptions = getMoveOptions(square as Square);

      setMoveFrom(hasMoveOptions ? square : null);

      return;
    }

    try {
      chessGame.move({
        from: moveFrom ?? "",
        to: square,
        promotion: 'q'
      });
    } catch {
      const hasMoveOptions = getMoveOptions(square as Square);

      if (hasMoveOptions) {
        setMoveFrom(square);
      }

      return;
    }

    setChessPosition(chessGame.fen());

    setTimeout(makeRandomMove, 300);

    setMoveFrom(null);
    setOptionSquares({});
  }

  const chessboardOptions = {
    allowDragging: false,
    onSquareClick,
    position: chessPosition,
    squareStyles: optionSquares,
    id: 'click-to-move'
  };


  return (
    <Chessboard options={chessboardOptions} />
  )
}
