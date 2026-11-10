// Türkçe sayı biçimlendirme — ondalık virgül (tr-TR) tek yerde.
const nf1 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });

/** 0.x haneli puan: 2.7 → "2,7" */
export function tr1(n: number): string {
  return nf1.format(n);
}

/** Tam sayı puan: 96 → "96" */
export function tr0(n: number): string {
  return nf0.format(n);
}
