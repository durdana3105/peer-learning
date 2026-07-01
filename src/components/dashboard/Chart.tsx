import type { ReactNode } from "react";

type ChartProps = {
  children?: ReactNode;
  className?: string;
};

export default function Chart({ children, className }: ChartProps) {
  return <div className={className}>{children}</div>;
}