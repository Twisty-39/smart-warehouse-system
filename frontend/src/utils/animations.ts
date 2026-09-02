import { animate } from 'animejs';

/**
 * Animasi hitung angka naik secara halus (odometer effect)
 * Cocok untuk angka metrik dasbor agar tidak kaku
 */
export const animateNumber = (
  element: HTMLElement | null,
  startValue: number,
  endValue: number,
  duration: number = 800,
  formatter?: (val: number) => string
) => {
  if (!element) return;

  const obj = { value: startValue };
  animate(obj, {
    value: endValue,
    round: 1,
    ease: 'outQuad',
    duration: duration,
    onUpdate: () => {
      if (element) {
        element.innerHTML = formatter ? formatter(Math.round(obj.value)) : Math.round(obj.value).toLocaleString('id-ID');
      }
    }
  });
};

/**
 * Transisi fade-in lembut untuk kontainer halaman atau daftar
 */
export const fadeIn = (target: string | HTMLElement, delay: number = 0, duration: number = 400) => {
  animate(target, {
    opacity: [0, 1],
    translateY: [8, 0],
    ease: 'outCubic',
    duration: duration,
    delay: delay,
    onComplete: () => {
      if (typeof target !== 'string' && target instanceof HTMLElement) {
        target.style.transform = '';
      }
    }
  });
};

/**
 * Animasi pembukaan modal dialog secara mulus dan jelas
 */
export const modalPop = (target: string | HTMLElement) => {
  animate(target, {
    opacity: [0, 1],
    scale: [0.96, 1],
    ease: 'outCubic',
    duration: 250
  });
};
