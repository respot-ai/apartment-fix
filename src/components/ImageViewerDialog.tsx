import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";

type Props = {
  src: string | null;
  onClose: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const ZOOM_STEP = 1.5;

export function ImageViewerDialog({ src, onClose }: Props) {
  const open = src !== null;
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = React.useState(1);
  const [tx, setTx] = React.useState(0);
  const [ty, setTy] = React.useState(0);
  const [rotation, setRotation] = React.useState(0);

  // Reset transform whenever a new image opens.
  React.useEffect(() => {
    if (open) {
      setScale(1);
      setTx(0);
      setTy(0);
      setRotation(0);
    }
  }, [open, src]);

  const clampPan = React.useCallback((nextScale: number, nextX: number, nextY: number) => {
    const el = containerRef.current;
    if (!el) return { x: nextX, y: nextY };
    const { width, height } = el.getBoundingClientRect();
    const maxX = ((nextScale - 1) * width) / 2;
    const maxY = ((nextScale - 1) * height) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, nextX)),
      y: Math.max(-maxY, Math.min(maxY, nextY)),
    };
  }, []);

  const applyZoom = React.useCallback(
    (nextScale: number, anchor?: { x: number; y: number }) => {
      const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, nextScale));
      const el = containerRef.current;
      if (!el || !anchor) {
        const { x, y } = clampPan(clamped, tx, ty);
        setScale(clamped);
        setTx(x);
        setTy(y);
        return;
      }
      const rect = el.getBoundingClientRect();
      // Anchor in container coords (origin at center).
      const ax = anchor.x - rect.left - rect.width / 2;
      const ay = anchor.y - rect.top - rect.height / 2;
      const ratio = clamped / scale;
      const nextX = ax - (ax - tx) * ratio;
      const nextY = ay - (ay - ty) * ratio;
      const { x, y } = clampPan(clamped, nextX, nextY);
      setScale(clamped);
      setTx(x);
      setTy(y);
    },
    [clampPan, scale, tx, ty],
  );

  // Mouse drag panning.
  const dragRef = React.useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (scale <= 1 || pinchRef.current) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, tx, ty };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || pinchRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    const { x, y } = clampPan(scale, dragRef.current.tx + dx, dragRef.current.ty + dy);
    setTx(x);
    setTy(y);
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  // Pinch zoom (two-finger).
  const activePointers = React.useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = React.useRef<{ dist: number; scale: number; cx: number; cy: number } | null>(
    null,
  );

  const onTouchPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") return;
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointers.current.size === 2) {
      const [a, b] = Array.from(activePointers.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      pinchRef.current = {
        dist,
        scale,
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
      };
      dragRef.current = null;
    }
  };
  const onTouchPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") return;
    if (!activePointers.current.has(e.pointerId)) return;
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinchRef.current && activePointers.current.size >= 2) {
      const [a, b] = Array.from(activePointers.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const ratio = dist / pinchRef.current.dist;
      applyZoom(pinchRef.current.scale * ratio, { x: pinchRef.current.cx, y: pinchRef.current.cy });
    }
  };
  const onTouchPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "touch") return;
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size < 2) pinchRef.current = null;
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    applyZoom(scale * factor, { x: e.clientX, y: e.clientY });
  };

  const rotateCw = () => {
    setRotation((r) => r + 90);
    setTx(0);
    setTy(0);
  };

  const onDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale > 1) {
      applyZoom(1);
    } else {
      applyZoom(2, { x: e.clientX, y: e.clientY });
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex items-center justify-center focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
        >
          <DialogPrimitive.Title className="sr-only">תצוגת תמונה</DialogPrimitive.Title>

          <div
            ref={containerRef}
            className="relative size-full overflow-hidden touch-none select-none"
            style={{ cursor: scale > 1 ? (dragRef.current ? "grabbing" : "grab") : "default" }}
            onPointerDown={(e) => {
              onTouchPointerDown(e);
              onPointerDown(e);
            }}
            onPointerMove={(e) => {
              onTouchPointerMove(e);
              onPointerMove(e);
            }}
            onPointerUp={(e) => {
              onTouchPointerUp(e);
              onPointerUp();
            }}
            onPointerCancel={(e) => {
              onTouchPointerUp(e);
              onPointerUp();
            }}
            onWheel={onWheel}
            onDoubleClick={onDoubleClick}
          >
            {src && (
              <img
                src={src}
                alt=""
                draggable={false}
                className="absolute inset-0 m-auto object-contain will-change-transform"
                style={{
                  // When rotated 90°/270°, swap the bounds so the rotated image still fits.
                  maxWidth: rotation % 180 === 0 ? "100%" : "100vh",
                  maxHeight: rotation % 180 === 0 ? "100%" : "100vw",
                  transform: `translate3d(${tx}px, ${ty}px, 0) rotate(${rotation}deg) scale(${scale})`,
                  transformOrigin: "center center",
                  transition:
                    dragRef.current || pinchRef.current ? "none" : "transform 120ms ease-out",
                }}
              />
            )}
          </div>

          <DialogPrimitive.Close
            className="absolute top-4 right-4 grid place-items-center size-10 rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/60"
            aria-label="סגור"
          >
            <X className="size-5" />
          </DialogPrimitive.Close>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-2 py-1.5">
            <button
              type="button"
              onClick={() => applyZoom(scale / ZOOM_STEP)}
              disabled={scale <= MIN_SCALE + 0.001}
              className="grid place-items-center size-9 rounded-full text-white hover:bg-white/20 disabled:opacity-40 focus:outline-none"
              aria-label="התרחק"
            >
              <ZoomOut className="size-5" />
            </button>
            <span className="text-xs font-medium text-white tabular-nums min-w-[3ch] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => applyZoom(scale * ZOOM_STEP)}
              disabled={scale >= MAX_SCALE - 0.001}
              className="grid place-items-center size-9 rounded-full text-white hover:bg-white/20 disabled:opacity-40 focus:outline-none"
              aria-label="התקרב"
            >
              <ZoomIn className="size-5" />
            </button>
            <div className="mx-1 h-5 w-px bg-white/25" />
            <button
              type="button"
              onClick={rotateCw}
              className="grid place-items-center size-9 rounded-full text-white hover:bg-white/20 focus:outline-none"
              aria-label="סובב 90°"
            >
              <RotateCw className="size-5" />
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
