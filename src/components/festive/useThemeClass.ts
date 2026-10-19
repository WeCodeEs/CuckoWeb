import { useEffect } from 'react';
import { useThemeStore } from '../../stores/themeStore';

/** Mantiene la clase `dark` del <html> alineada con el tema guardado (también en el login). */
export function useThemeClass() {
  const isDark = useThemeStore((s) => s.isDark);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);
  return isDark;
}
