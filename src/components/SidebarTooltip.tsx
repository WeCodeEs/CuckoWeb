import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface SidebarTooltipProps {
  label: string;
  children: React.ReactNode;
}

export default function SidebarTooltip({ label, children }: SidebarTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 8,
      });
    }
    setVisible(true);
  }, []);

  const hide = useCallback(() => setVisible(false), []);

  return (
    <div
      ref={triggerRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      className="relative"
    >
      {children}
      {visible &&
        createPortal(
          <div
            className="fixed z-[9999] px-3 py-2 bg-primary-dark dark:bg-darkbg-darker text-white text-sm rounded-lg whitespace-nowrap shadow-lg pointer-events-none"
            style={{
              top: position.top,
              left: position.left,
              transform: 'translateY(-50%)',
            }}
          >
            {label}
          </div>,
          document.body
        )}
    </div>
  );
}
