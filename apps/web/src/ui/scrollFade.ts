import { useEffect, useRef } from 'react';

/**
 * Yatay taşma koşullu fade: .isScrollable sınıfı yalnız içerik GERÇEKTEN
 * taşınca eklenir. Sabit maske sığan içerikte de karartıyordu — ipucu
 * boş zemine düşüyor, kaydırılabilirlik duyurusu sahte görünüyordu
 * (R5 GLM #2 / Nemotron öneri; DeepSeek R4 önerisiyle uyumlu).
 */
export function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const overflow = max > 1;
      el.classList.toggle('isScrollable', overflow);
      // Kaydırmanın sonunda fade kalkar: son kontrol karartılmasın (R5 DeepSeek öneri)
      el.classList.toggle('atScrollEnd', !overflow || el.scrollLeft >= max - 1);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);
  return ref;
}
