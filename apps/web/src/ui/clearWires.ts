// Tüm kabloları temizleme — onay penceresi + tek geri alınabilir adım.
// Hem üst çubuk (Header) hem de mobil sabit eylem çubuğu bu tek kaynağı kullanır
// (metin/akış iki kopyada ayrışmasın).

import { A, getState } from '../store';
import { sfx } from '../audio/sfx';
import { confirmAction } from './confirm';

export async function clearWiresWithConfirm(): Promise<void> {
  const n = getState().cables.length;
  if (n === 0) return;
  const ok = await confirmAction({
    title: 'Tüm kablolar temizlensin mi?',
    body: `Panodaki ${n} kablo silinecek. Son işlemi Geri Al düğmesiyle geri getirebilirsiniz.`,
    confirmLabel: 'Temizle',
    cancelLabel: 'İptal',
  });
  if (ok) {
    sfx.breaker(false);
    A.clearWires();
  }
}