import { useEffect } from 'react';

/** Keeps sheets inside the visible area when a phone's keyboard is open. */
export function useMobileViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const root = document.documentElement;
    let frame = 0;
    let fullHeight = window.innerHeight;
    let width = window.innerWidth;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const height = viewport?.height ?? window.innerHeight;
        const top = viewport?.offsetTop ?? 0;
        root.style.setProperty('--visual-height', `${height}px`);
        root.style.setProperty('--visual-top', `${top}px`);
        const active = document.activeElement;
        const editing = active instanceof HTMLElement && (active.matches('input:not([type="range"]), textarea') || active.isContentEditable);
        if (!editing || Math.abs(width - window.innerWidth) > 80) fullHeight = window.innerHeight;
        width = window.innerWidth;
        root.toggleAttribute('data-keyboard-open', editing && Math.max(fullHeight, window.innerHeight) - height > 140);
      });
    };
    update();
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
      root.style.removeProperty('--visual-height');
      root.style.removeProperty('--visual-top');
      root.removeAttribute('data-keyboard-open');
    };
  }, []);
}
