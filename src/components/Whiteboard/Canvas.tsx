import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/useAuth";
import {
  ToolType,
  WhiteboardEvent,
} from "./types";

type Props = {
  roomId: string;
};

export default function Canvas({ roomId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const channelRef = useRef<any>(null);

  const isDrawing = useRef(false);

  const strokesRef = useRef<WhiteboardEvent[]>([]);

  const currentStrokeId = useRef<string | null>(null);

  const { user } = useAuth();

  const [tool, setTool] = useState<ToolType>("pen");

  const [color, setColor] = useState("#ffffff");

  const [lineWidth] = useState(3);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return;

    const previous = canvas.toDataURL();

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const img = new Image();

    img.src = previous;

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
    };
  };

  const getContext = () => {
    const canvas = canvasRef.current;

    if (!canvas) return null;

    return canvas.getContext("2d");
  };

  const drawEvent = (
    ctx: CanvasRenderingContext2D,
    event: WhiteboardEvent
  ) => {
    if (event.type === "clear") {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      return;
    }

    const point = event.payload.point;

    if (!point) return;

    const drawColor =
      event.payload.tool === "eraser"
        ? "#020617"
        : event.payload.color || "#ffffff";

    ctx.strokeStyle = drawColor;

    ctx.lineWidth = event.payload.lineWidth || 3;

    if (event.type === "draw-start") {
      ctx.beginPath();

      ctx.moveTo(point.x, point.y);
    }

    if (event.type === "draw-move") {
      ctx.lineTo(point.x, point.y);

      ctx.stroke();
    }

    if (event.type === "draw-end") {
      ctx.closePath();
    }
  };

  const replayCanvas = () => {
    const ctx = getContext();

    if (!ctx) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (const event of strokesRef.current) {
      drawEvent(ctx, event);
    }
  };

  const persistEvent = async (event: WhiteboardEvent) => {
    await supabase.from("whiteboard_events" as any).insert({
      room_id: roomId,
      user_id: user?.id,
      type: event.type,
      payload: event.payload,
    });
  };

  const broadcastEvent = (event: WhiteboardEvent) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "whiteboard-event",
      payload: {
        ...event,
        senderId: user?.id,
      },
    });
  };

  const pushEvent = (event: WhiteboardEvent) => {
    strokesRef.current.push(event);

    const ctx = getContext();

    if (!ctx) return;

    drawEvent(ctx, event);

    broadcastEvent(event);

    persistEvent(event);
  };

  useEffect(() => {
    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  useEffect(() => {
    const initializeBoard = async () => {
      const { data } = await supabase
        .from("whiteboard_events" as any)
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", {
          ascending: true,
        });

      if (data) {
        strokesRef.current = data as any;

        replayCanvas();
      }
    };

    initializeBoard();

    const channel = supabase.channel(
      `whiteboard_${roomId}`
    );

    channel
      .on(
        "broadcast",
        { event: "whiteboard-event" },
        ({ payload }) => {
          if (payload.senderId === user?.id) return;

          const event: WhiteboardEvent = payload;

          strokesRef.current.push(event);

          const ctx = getContext();

          if (!ctx) return;

          drawEvent(ctx, event);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;

    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement>
  ) => {
    isDrawing.current = true;

    const point = getCoordinates(e);

    if (!point) return;

    const strokeId = crypto.randomUUID();

    currentStrokeId.current = strokeId;

    pushEvent({
      type: "draw-start",
      payload: {
        point,
        color,
        lineWidth,
        tool,
        strokeId,
      },
    });
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing.current) return;

    const point = getCoordinates(e);

    if (!point) return;

    pushEvent({
      type: "draw-move",
      payload: {
        point,
        color,
        lineWidth,
        tool,
        strokeId:
          currentStrokeId.current || undefined,
      },
    });
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;

    isDrawing.current = false;

    pushEvent({
      type: "draw-end",
      payload: {
        color,
        lineWidth,
        tool,
        strokeId:
          currentStrokeId.current || undefined,
      },
    });

    currentStrokeId.current = null;
  };
  const undoLastStroke = async () => {
  const events = [...strokesRef.current];

  let lastStrokeId: string | undefined;

  for (let i = events.length - 1; i >= 0; i--) {
    const strokeId =
      events[i].payload?.strokeId;

    if (strokeId) {
      lastStrokeId = strokeId;
      break;
    }
  }

  if (!lastStrokeId) return;

  const updated = events.filter(
    (event) =>
      event.payload?.strokeId !==
      lastStrokeId
  );

  strokesRef.current = updated;

  replayCanvas();

  await supabase
    .from("whiteboard_events" as any)
    .delete()
    .eq("room_id", roomId)
    .eq(
      "payload->>strokeId",
      lastStrokeId
    );

  broadcastEvent({
    type: "clear",
    payload: {},
  });

  for (const event of updated) {
    broadcastEvent(event);
  }
};

  const clearBoard = async () => {
  const ctx = getContext();

  if (!ctx) return;

  ctx.clearRect(
    0,
    0,
    ctx.canvas.width,
    ctx.canvas.height
  );

  strokesRef.current = [];

  await supabase
    .from("whiteboard_events" as any)
    .delete()
    .eq("room_id", roomId);

  broadcastEvent({
    type: "clear",
    payload: {},
  });
};

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col bg-slate-950"
    >
      <div className="flex items-center gap-3 p-3 border-b border-slate-800 bg-slate-900">
        <button
          onClick={() => setTool("pen")}
          className={`px-3 py-1 rounded text-sm ${
            tool === "pen"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-300"
          }`}
        >
          Pen
        </button>

        <button
          onClick={() => setTool("eraser")}
          className={`px-3 py-1 rounded text-sm ${
            tool === "eraser"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-300"
          }`}
        >
          Eraser
        </button>

        <input
          type="color"
          value={color}
          onChange={(e) =>
            setColor(e.target.value)
          }
          className="w-10 h-10 bg-transparent border-none"
        />
       <div className="ml-auto flex items-center gap-2">
  <button
    onClick={undoLastStroke}
    className="px-3 py-1 rounded text-sm bg-slate-800 text-slate-300 hover:bg-slate-700"
  >
    Undo
  </button>

  <button
    onClick={clearBoard}
    className="px-3 py-1 rounded text-sm bg-red-600 text-white hover:bg-red-700"
  >
    Clear
  </button>
</div>
      </div>

      <canvas
        ref={canvasRef}
        className="flex-1 w-full h-full cursor-crosshair touch-none"
       onMouseDown={startDrawing}
onMouseMove={draw}
onMouseUp={stopDrawing}
onMouseLeave={stopDrawing}

onTouchStart={(e) => {
  e.preventDefault();

  const touch = e.touches[0];

  startDrawing({
    clientX: touch.clientX,
    clientY: touch.clientY,
  } as any);
}}

onTouchMove={(e) => {
  e.preventDefault();

  const touch = e.touches[0];

  draw({
    clientX: touch.clientX,
    clientY: touch.clientY,
  } as any);
}}

onTouchEnd={stopDrawing}
      />
    </div>
  );
}