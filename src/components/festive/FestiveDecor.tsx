// Edición limitada Día de Muertos / Halloween (temporal): adornos puramente visuales.
// Modo claro = Día de Muertos (papel picado, cempasúchil, calaverita).
// Modo oscuro = Halloween (telarañas, arañas, murciélagos, calabazas).
// Todo es decorativo: no recibe clics (pointer-events-none) y está oculto para lectores de pantalla.
import { useThemeStore } from '../../stores/themeStore';
import { useThemeClass } from './useThemeClass';
import garland from '../../assets/festive/papel-picado.svg';
import cobweb from '../../assets/festive/cobweb.svg';
import spider from '../../assets/festive/spider.svg';
import bat from '../../assets/festive/bat.svg';
import pumpkin from '../../assets/festive/pumpkin.svg';
import bouquetLeft from '../../assets/festive/ramo-izq.webp';
import bouquetRight from '../../assets/festive/ramo-der.webp';

const img = { alt: '', 'aria-hidden': true, draggable: false } as const;

/** Zona libre del centro del encabezado: guirnalda (Día de Muertos) o telarañas, arañas y murciélagos (Halloween). */
export function HeaderDecor() {
  const isDark = useThemeStore((s) => s.isDark);

  return (
    <div aria-hidden className="pointer-events-none relative mx-6 hidden h-full min-w-0 flex-1 overflow-hidden xl:block">
      {isDark ? (
        <>
          <img {...img} src={cobweb} className="absolute left-0 top-0 w-14 opacity-60" />
          <img {...img} src={cobweb} className="absolute right-0 top-0 w-14 -scale-x-100 opacity-60" />
          <img {...img} src={spider} className="festive-swing absolute left-[30%] top-0 w-7" />
          <img {...img} src={spider} className="festive-swing absolute left-[68%] top-0 w-6 [animation-delay:-2s]" />
          <img {...img} src={bat} className="absolute left-[46%] top-3 w-9" />
          <img {...img} src={bat} className="absolute left-[54%] top-7 w-6 -scale-x-100 opacity-80" />
        </>
      ) : (
        <div
          className="absolute inset-x-0 top-0 h-[52px]"
          style={{
            backgroundImage: `url(${garland})`,
            backgroundRepeat: 'repeat-x',
            backgroundPosition: 'center top',
            backgroundSize: '312px 50px',
            WebkitMaskImage: 'linear-gradient(to right, transparent, #000 14%, #000 86%, transparent)',
            maskImage: 'linear-gradient(to right, transparent, #000 14%, #000 86%, transparent)',
          }}
        />
      )}
    </div>
  );
}

/** Adorno de la esquina superior del menú lateral (solo Halloween). */
export function SidebarDecor() {
  const isDark = useThemeStore((s) => s.isDark);
  if (!isDark) return null;
  return <img {...img} src={cobweb} className="pointer-events-none absolute left-0 top-0 z-10 w-16 opacity-60" />;
}

/** Tira de papel picado colgando bajo el logo del menú lateral (solo Día de Muertos, con el menú expandido). */
export function SidebarGarland() {
  const isDark = useThemeStore((s) => s.isDark);
  if (isDark) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none h-[42px] shrink-0"
      style={{ backgroundImage: `url(${garland})`, backgroundRepeat: 'repeat-x', backgroundPosition: 'center top', backgroundSize: '260px 42px' }}
    />
  );
}

/** Fondo del área de contenido: ramos de cempasúchil o calabazas asomando detrás de las tarjetas. */
export function PageBackdrop() {
  const isDark = useThemeStore((s) => s.isDark);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {isDark ? (
        <>
          <div
            className="absolute inset-x-0 bottom-0 h-56"
            style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(255,122,26,0.16), transparent 65%)' }}
          />
          <img {...img} src={pumpkin} className="absolute bottom-1 right-8 w-28" />
          <img {...img} src={pumpkin} className="absolute bottom-0 right-40 w-16 opacity-90" />
          <img {...img} src={pumpkin} className="absolute bottom-1 left-6 w-20 -scale-x-100" />
        </>
      ) : (
        <>
          <img {...img} src={bouquetLeft} className="absolute bottom-0 left-0 w-44" />
          <img {...img} src={bouquetRight} className="absolute bottom-0 right-0 w-44" />
        </>
      )}
    </div>
  );
}

/** Decoración de la pantalla de inicio de sesión (ocupa toda la pantalla, detrás del formulario). */
export function LoginDecor() {
  const isDark = useThemeClass();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {isDark ? (
        <>
          <img {...img} src={cobweb} className="absolute left-0 top-0 w-56 opacity-60" />
          <img {...img} src={cobweb} className="absolute right-0 top-0 w-56 -scale-x-100 opacity-60" />
          <img {...img} src={spider} className="festive-swing absolute left-[18%] top-0 w-12" />
          <img {...img} src={spider} className="festive-swing absolute right-[20%] top-0 w-9 [animation-delay:-2.5s]" />
          <img {...img} src={bat} className="absolute left-[28%] top-24 w-14" />
          <img {...img} src={bat} className="absolute right-[30%] top-40 w-10 -scale-x-100 opacity-80" />
          <img {...img} src={pumpkin} className="absolute bottom-2 left-6 w-36" />
          <img {...img} src={pumpkin} className="absolute bottom-0 right-10 w-28" />
        </>
      ) : (
        <>
          <div
            className="absolute inset-x-0 top-0 h-[84px]"
            style={{ backgroundImage: `url(${garland})`, backgroundRepeat: 'repeat-x', backgroundPosition: 'center top', backgroundSize: '520px 84px' }}
          />
          <img {...img} src={bouquetLeft} className="absolute bottom-0 left-0 w-52" />
          <img {...img} src={bouquetRight} className="absolute bottom-0 right-0 w-52" />
        </>
      )}
    </div>
  );
}
