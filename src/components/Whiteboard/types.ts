export type ToolType =
  | "pen"
  | "eraser";

export type WhiteboardEventType =
  | "draw-start"
  | "draw-move"
  | "draw-end"
  | "clear"
  | "undo";

export type Point = {
  x: number;
  y: number;
};

export type WhiteboardEvent = {
  id?: string;
  room_id?: string;
  user_id?: string;

  type: WhiteboardEventType;

  payload: {
    point?: Point;

    color?: string;

    lineWidth?: number;

    tool?: ToolType;

    strokeId?: string;

    normalized?: boolean;
  };

  created_at?: string;
};