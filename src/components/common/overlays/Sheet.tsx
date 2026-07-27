import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';

interface SheetProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

/** Drag past this many pixels, or flick faster than this, and the sheet dismisses. */
const DISMISS_DISTANCE_PX = 110;
const DISMISS_VELOCITY_PX_PER_MS = 0.5;
/** Pointer travel before a touch counts as a drag rather than a tap or a scroll. */
const DRAG_THRESHOLD_PX = 8;
const CLOSE_ANIMATION_MS = 220;

interface DragState {
  pointerId: number;
  startY: number;
  startX: number;
  startTime: number;
  fromHandle: boolean;
  active: boolean;
}

/** Fields never want the sheet stealing their pointer gestures (caret, selection). */
function isTextInput(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest('input, textarea, select, [contenteditable="true"]') !== null
  );
}

/**
 * Bottom sheet used for every modal flow (payments, room/plan forms).
 * Closes on backdrop tap, Escape, or a downward swipe, and locks background
 * scroll while open.
 */
export function Sheet({ title, subtitle, onClose, children }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [offsetY, setOffsetY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [onClose]);

  /** Slide the panel off-screen, then hand control back to the caller. */
  const closeWithSlideOut = useCallback(() => {
    setClosing(true);
    setDragging(false);
    setOffsetY(panelRef.current?.offsetHeight ?? window.innerHeight);
    closeTimerRef.current = setTimeout(onClose, CLOSE_ANIMATION_MS);
  }, [onClose]);

  const endDrag = useCallback(
    (e: PointerEvent<HTMLDivElement>, dismissible: boolean) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      dragRef.current = null;
      if (!drag.active) return;

      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      setDragging(false);

      const distance = e.clientY - drag.startY;
      const velocity = distance / Math.max(1, e.timeStamp - drag.startTime);
      const shouldDismiss =
        dismissible &&
        (distance > DISMISS_DISTANCE_PX ||
          (velocity > DISMISS_VELOCITY_PX_PER_MS && distance > DRAG_THRESHOLD_PX));

      if (shouldDismiss) closeWithSlideOut();
      else setOffsetY(0);
    },
    [closeWithSlideOut],
  );

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (closing || e.button !== 0 || isTextInput(e.target)) return;

    dragRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startX: e.clientX,
      startTime: e.timeStamp,
      fromHandle: e.target instanceof Element && e.target.closest('[data-sheet-handle]') !== null,
      active: false,
    };
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const dy = e.clientY - drag.startY;

    if (!drag.active) {
      // Only claim the gesture once it is clearly a downward drag, and only when
      // the content is scrolled to the top — otherwise the body must scroll.
      const isDownwardIntent = dy > DRAG_THRESHOLD_PX && dy > Math.abs(e.clientX - drag.startX);
      const atTop = (panelRef.current?.scrollTop ?? 0) <= 0;
      if (!isDownwardIntent || !(atTop || drag.fromHandle)) return;

      drag.active = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
    }

    setOffsetY(Math.max(0, dy));
  }

  const panelHeight = panelRef.current?.offsetHeight ?? 0;
  const backdropOpacity = closing
    ? 0
    : panelHeight > 0
      ? Math.max(0, 1 - offsetY / panelHeight)
      : 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-black/50 backdrop-blur-sm"
        style={{
          opacity: backdropOpacity,
          transition: dragging ? undefined : `opacity ${CLOSE_ANIMATION_MS}ms ease-out`,
        }}
      />

      <div
        ref={panelRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endDrag(e, true)}
        onPointerCancel={(e) => endDrag(e, false)}
        className="animate-sheet-in relative z-10 max-h-[92dvh] w-full max-w-app overflow-y-auto overscroll-contain rounded-t-4xl border-t border-line bg-surface px-5 pt-3"
        style={{
          paddingBottom: 'calc(1.75rem + env(safe-area-inset-bottom))',
          transform: offsetY > 0 ? `translateY(${offsetY}px)` : undefined,
          transition: dragging
            ? undefined
            : `transform ${CLOSE_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        }}
      >
        <div className="-mx-5 -mt-3 px-5 pb-1 pt-3" data-sheet-handle style={{ touchAction: 'none' }}>
          <div className="mx-auto h-1.5 w-11 rounded-full bg-line" aria-hidden />
        </div>
        <h2 className="mt-3 text-xl font-bold tracking-tight text-fg">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
