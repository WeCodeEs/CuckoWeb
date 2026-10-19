import React, { useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';
import pumpkin from '../assets/festive/pumpkin.svg';
import skull from '../assets/festive/calaverita.webp';

// Edición Día de Muertos / Halloween: el modo claro es la versión Día de Muertos y el oscuro la
// versión Halloween. El botón muestra la versión a la que se cambia (calabaza ↔ calaverita).
export default function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeStore();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const label = isDark ? 'Cambiar a Día de Muertos' : 'Cambiar a Halloween';

  return (
    <button
      onClick={toggleTheme}
      className="shrink-0 p-2 rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-darkbg active:scale-95"
      title={label}
      aria-label={label}
    >
      {isDark ? (
        <img src={skull} alt="" aria-hidden draggable={false} className="h-6 w-6 shrink-0 object-contain" />
      ) : (
        <img src={pumpkin} alt="" aria-hidden draggable={false} className="h-6 w-6 shrink-0 object-contain" />
      )}
    </button>
  );
}
