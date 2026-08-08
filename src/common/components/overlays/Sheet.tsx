import { useCallback, useEffect, useRef, type PointerEvent, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import * as styles from '@/common/components/overlays/Sheet.css';

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

/**
 * The sheet's own gesture state. Per instance rather than module-level: two
 * sheets in the tree at once must not share a drag offset.
 */
interface SheetGestureState {
  offsetY: number;
  dragging: boolean;
  closing: boolean;
}

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
  // Not state: the in-flight pointer must not re-render on every move event,
  // and the timer is only ever read by cleanup.
  const dragRef = useRef<DragState | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gesture = useInstanceStore<SheetGestureState>(() => ({
    offsetY: 0,
    dragging: false,
    closing: false,
  }));
  const { offsetY, dragging, closing } = useStore(
    gesture,
    useShallow((s) => s),
  );

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
    gesture.setState({
      closing: true,
      dragging: false,
      offsetY: panelRef.current?.offsetHeight ?? window.innerHeight,
    });
    closeTimerRef.current = setTimeout(onClose, CLOSE_ANIMATION_MS);
  }, [gesture, onClose]);

  const endDrag = useCallback(
    (e: PointerEvent<HTMLDivElement>, dismissible: boolean) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      dragRef.current = null;
      if (!drag.active) return;

      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      gesture.setState({ dragging: false });

      const distance = e.clientY - drag.startY;
      const velocity = distance / Math.max(1, e.timeStamp - drag.startTime);
      const shouldDismiss =
        dismissible &&
        (distance > DISMISS_DISTANCE_PX ||
          (velocity > DISMISS_VELOCITY_PX_PER_MS && distance > DRAG_THRESHOLD_PX));

      if (shouldDismiss) closeWithSlideOut();
      else gesture.setState({ offsetY: 0 });
    },
    [closeWithSlideOut, gesture],
  );

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (closing || e.button !== 0 || isTextInput(e.target)) return;

    dragRef.current = {
      pointerId: e.pointerId,
      startY: e.clientY,
      startX: e.clientX,
      startTime: e.timeStamp,
      fromHandle:
        e.target instanceof Element && e.target.closest('[data-sheet-handle]') !== null,
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
      gesture.setState({ dragging: true });
    }

    gesture.setState({ offsetY: Math.max(0, dy) });
  }

  const panelHeight = panelRef.current?.offsetHeight ?? 0;
  const backdropOpacity = closing
    ? 0
    : panelHeight > 0
      ? Math.max(0, 1 - offsetY / panelHeight)
      : 1;

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className={styles.backdrop}
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
        className={styles.panel}
        style={{
          transform: offsetY > 0 ? `translateY(${offsetY}px)` : undefined,
          transition: dragging
            ? undefined
            : `transform ${CLOSE_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        }}
      >
        <div className={styles.handleZone} data-sheet-handle>
          <div className={styles.handle} aria-hidden />
        </div>
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
