import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
export default function Modal({ children, onClose, label }: { children: React.ReactNode; onClose: () => void; label: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement;
    dialog.showModal();
    return () => { dialog.close(); previous?.focus(); };
  }, []);
  return createPortal(<dialog ref={ref} aria-label={label} onCancel={e => { e.preventDefault(); close.current(); }} onClick={e => { if (e.target === ref.current) close.current(); }} className="m-auto max-h-[90vh] overflow-y-auto rounded-2xl bg-transparent p-0 backdrop:bg-black/50 w-[calc(100vw_-_2rem)] max-w-md">{children}</dialog>, document.body);
}
