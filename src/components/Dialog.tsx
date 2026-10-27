import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Dialog({ title, close, children, className = '', closeLabel = 'Close dialog' }: { title: string; close: () => void; children: ReactNode; className?: string; closeLabel?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current!;
    const rootOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.documentElement.style.overflow = rootOverflow;
      document.body.style.overflow = bodyOverflow;
    };
  }, []);
  return <dialog ref={ref} className={`dialog ${className}`} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === ref.current) close(); }}>
    <div className="dialog-inner">
      <header className="section-heading"><h2 id={titleId}>{title}</h2><button className="icon-button" aria-label={closeLabel} onClick={close}><X size={20} /></button></header>
      {children}
    </div>
  </dialog>;
}
