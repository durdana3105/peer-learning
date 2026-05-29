import Canvas from "./Canvas";

type Props = {
  roomId: string;
};

export default function Whiteboard({
  roomId,
}: Props) {
  return (
    <div className="w-full h-full bg-slate-950 rounded-xl overflow-hidden">
      <Canvas roomId={roomId} />
    </div>
  );
}