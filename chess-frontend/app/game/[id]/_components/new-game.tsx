import { useSocket } from "@/store/socket-provider";

interface NewGameProps {
  timeControl: string;
}

export const NewGame = ({ timeControl }: NewGameProps) => {
  const { joinQueue } = useSocket();

  const targetTimeControl = timeControl;

  return (
    <button
      onClick={() => {
        if (targetTimeControl) {
          joinQueue(targetTimeControl);
        }
      }}
      className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all duration-200 shadow-lg"
    >
      New Game
    </button>
  );
};
