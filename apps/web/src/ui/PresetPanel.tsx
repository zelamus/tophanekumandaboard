import { useState } from 'react';
import { PRESETS, presetCables } from '../presets';
import type { Preset } from '../presets';
import { A, getState } from '../store';
import { confirmAction } from './confirm';
import { IconPlay } from './Icons';

const INK = '#2c251d';
const W = 2;

function Rail({ x, y0, y1, color }: { x: number; y0: number; y1: number; color: string }) {
  return <path d={`M ${x} ${y0} V ${y1}`} stroke={color} strokeWidth={W} fill="none" />;
}

export function MiniT4() {
  const y = 40;
  return (
    <svg viewBox="0 0 176 78" className="schematicSvg">
      <Rail x={14} y0={22} y1={58} color="#b71c1c" />
      <Rail x={158} y0={22} y1={58} color="#262626" />
      <path d={`M 14 ${y} H 30`} stroke={INK} strokeWidth={1.6} />
      <rect x={30} y={y - 8} width={14} height={16} fill="none" stroke={INK} strokeWidth={1.5} />
      <text x={37} y={y - 12} textAnchor="middle" fontSize={7} fill={INK} fontFamily="system-ui">F1</text>
      <path d={`M 44 ${y} H 60`} stroke={INK} strokeWidth={1.6} />
      <circle cx={70} cy={y - 14} r={2.6} fill="none" stroke={INK} strokeWidth={1.3} />
      <path d={`M 70 ${y - 12} V ${y - 4}`} stroke={INK} strokeWidth={1.3} />
      <path d={`M 60 ${y} L 80 ${y} M 66 ${y} L 74 ${y - 9}`} stroke={INK} strokeWidth={1.6} fill="none" />
      <text x={67} y={y + 12} textAnchor="middle" fontSize={7} fill={INK} fontFamily="system-ui">S0 (b1)</text>
      <path d={`M 80 ${y} H 96`} stroke={INK} strokeWidth={1.6} />
      <circle cx={104} cy={y} r={8} fill="none" stroke="#b71c1c" strokeWidth={1.8} />
      <path d={`M 99 ${y - 5} L 109 ${y + 5} M 109 ${y - 5} L 99 ${y + 5}`} stroke="#b71c1c" strokeWidth={1.3} />
      <text x={104} y={y + 18} textAnchor="middle" fontSize={7} fill={INK} fontFamily="system-ui">H1 (harici)</text>
      <path d={`M 112 ${y} H 158`} stroke={INK} strokeWidth={1.6} />
    </svg>
  );
}

function S1Button({ y }: { y: number }) {
  return (
    <>
      <circle cx={74} cy={y - 14} r={2.6} fill="none" stroke={INK} strokeWidth={1.3} />
      <path d={`M 74 ${y - 12} V ${y - 4}`} stroke={INK} strokeWidth={1.3} />
      <path d={`M 60 ${y} H 68 M 74 ${y} H 80 M 68 ${y} L 74 ${y - 8}`} stroke={INK} strokeWidth={1.6} fill="none" />
      <text x={70} y={y + 12} textAnchor="middle" fontSize={7} fill={INK} fontFamily="system-ui">S1 (b2)</text>
    </>
  );
}

export function MiniT5() {
  const c = 30;
  return (
    <svg viewBox="0 0 176 122" className="schematicSvg">
      <Rail x={158} y0={16} y1={106} color="#262626" />
      <path d={`M 10 ${c} H 16`} stroke={INK} strokeWidth={1.6} />
      <rect x={16} y={c - 8} width={12} height={16} fill="none" stroke={INK} strokeWidth={1.5} />
      <path d={`M 28 ${c} H 44`} stroke={INK} strokeWidth={1.6} />
      <path d={`M 44 ${c} H 60`} stroke={INK} strokeWidth={1.6} />
      <text x={52} y={c - 5} textAnchor="middle" fontSize={6.5} fill={INK} fontFamily="system-ui">e.tc</text>
      <S1Button y={c} />
      <path d={`M 80 ${c} H 92`} stroke={INK} strokeWidth={1.6} />
      <rect x={92} y={c - 8} width={16} height={16} fill="none" stroke={INK} strokeWidth={1.5} />
      <text x={100} y={c + 24} textAnchor="middle" fontSize={7} fill={INK} fontFamily="system-ui">K1</text>
      <path d={`M 108 ${c} H 158`} stroke={INK} strokeWidth={1.6} />
      <circle cx={52} cy={c} r={2} fill={INK} />
      <path d={`M 52 ${c} V 58 H 60`} stroke={INK} strokeWidth={1.6} fill="none" />
      <path d={`M 60 58 H 80`} stroke={INK} strokeWidth={1.6} />
      <circle cx={88} cy={58} r={7} fill="none" stroke="#c0392b" strokeWidth={1.7} />
      <path d={`M 95 58 H 158`} stroke={INK} strokeWidth={1.6} />
      <text x={88} y={48} textAnchor="middle" fontSize={6.5} fill={INK} fontFamily="system-ui">K1 NC → H1</text>
      <circle cx={100} cy={c + 8} r={2} fill={INK} />
      <path d={`M 100 ${c + 8} V 78 H 122`} stroke={INK} strokeWidth={1.6} fill="none" />
      <path d={`M 122 78 H 130 M 134 78 H 142 M 130 78 L 134 70`} stroke={INK} strokeWidth={1.6} fill="none" />
      <circle cx={150} cy={78} r={7} fill="none" stroke="#1e7a34" strokeWidth={1.7} />
      <path d={`M 157 78 H 158`} stroke={INK} strokeWidth={1.6} />
      <text x={110} y={70} textAnchor="middle" fontSize={6.5} fill={INK} fontFamily="system-ui">K1 NO → H2</text>
      {[0, 1, 2].map((i) => {
        const y = 94 + i * 9;
        const names = ['R', 'S', 'T'];
        return (
          <g key={i}>
            <path d={`M 18 ${y} H 150`} stroke={INK} strokeWidth={1.4} />
            <text x={12} y={y + 3} textAnchor="middle" fontSize={6.5} fill={INK} fontFamily="system-ui">{names[i]}</text>
            <rect x={22} y={y - 4} width={10} height={9} fill="none" stroke={INK} strokeWidth={1.2} />
            <path d={`M 40 ${y} H 46 M 52 ${y} H 134 M 46 ${y} L 52 ${y - 5}`} stroke={INK} strokeWidth={1.4} fill="none" />
          </g>
        );
      })}
      <circle cx={148} cy={103} r={10} fill="none" stroke={INK} strokeWidth={1.6} />
      <text x={148} y={106} textAnchor="middle" fontSize={8} fontWeight={700} fill={INK} fontFamily="system-ui">M</text>
    </svg>
  );
}

export function MiniT6() {
  const c = 34;
  return (
    <svg viewBox="0 0 176 128" className="schematicSvg">
      <Rail x={158} y0={16} y1={112} color="#262626" />
      <path d={`M 10 ${c} H 16`} stroke={INK} strokeWidth={1.6} />
      <rect x={16} y={c - 8} width={12} height={16} fill="none" stroke={INK} strokeWidth={1.5} />
      <path d={`M 28 ${c} H 44 M 44 ${c} H 56`} stroke={INK} strokeWidth={1.6} />
      <circle cx={66} cy={c - 14} r={2.6} fill="none" stroke={INK} strokeWidth={1.3} />
      <path d={`M 66 ${c - 12} V ${c - 4}`} stroke={INK} strokeWidth={1.3} />
      <path d={`M 56 ${c} H 78`} stroke={INK} strokeWidth={1.6} />
      <text x={64} y={c + 14} textAnchor="middle" fontSize={7} fill={INK} fontFamily="system-ui">S0 (b1)</text>
      <path d={`M 78 ${c} H 84 M 90 ${c} H 96`} stroke={INK} strokeWidth={1.6} />
      <path d={`M 84 ${c} L 90 ${c - 8}`} stroke={INK} strokeWidth={1.6} />
      <text x={86} y={c + 14} textAnchor="middle" fontSize={7} fill={INK} fontFamily="system-ui">S1 (b2)</text>
      <circle cx={81} cy={c} r={2} fill={INK} />
      <path d={`M 81 ${c} V ${c - 20} H 88 M 94 ${c - 20} H 100 M 88 ${c - 20} L 94 ${c - 28}`} stroke={INK} strokeWidth={1.4} fill="none" />
      <path d={`M 100 ${c - 20} V ${c} H 96`} stroke={INK} strokeWidth={1.4} fill="none" />
      <text x={100} y={c - 32} textAnchor="middle" fontSize={6.5} fill={INK} fontFamily="system-ui">K1 NO (c1.x3)</text>
      <path d={`M 96 ${c} H 106`} stroke={INK} strokeWidth={1.6} />
      <rect x={106} y={c - 8} width={16} height={16} fill="none" stroke={INK} strokeWidth={1.5} />
      <text x={114} y={c + 26} textAnchor="middle" fontSize={7} fill={INK} fontFamily="system-ui">K1</text>
      <path d={`M 122 ${c} H 158`} stroke={INK} strokeWidth={1.6} />
      <text x={12} y={64} fontSize={7} fill={INK} fontFamily="system-ui">H1: e.tc.b → K1 NC (c1.k1) → Harici Kırmızı</text>
      <text x={12} y={76} fontSize={7} fill={INK} fontFamily="system-ui">H2: e.tc.b → K1 NO (c1.x2) → Harici Yeşil</text>
      {[0, 1, 2].map((i) => {
        const y = 88 + i * 9;
        const names = ['R', 'S', 'T'];
        return (
          <g key={i}>
            <path d={`M 18 ${y} H 150`} stroke={INK} strokeWidth={1.4} />
            <text x={12} y={y + 3} textAnchor="middle" fontSize={6.5} fill={INK} fontFamily="system-ui">{names[i]}</text>
            <rect x={22} y={y - 4} width={10} height={9} fill="none" stroke={INK} strokeWidth={1.2} />
            <path d={`M 40 ${y} H 46 M 52 ${y} H 134 M 46 ${y} L 52 ${y - 5}`} stroke={INK} strokeWidth={1.4} fill="none" />
          </g>
        );
      })}
      <circle cx={148} cy={97} r={10} fill="none" stroke={INK} strokeWidth={1.6} />
      <text x={148} y={100} textAnchor="middle" fontSize={8} fontWeight={700} fill={INK} fontFamily="system-ui">M</text>
    </svg>
  );
}

const SCHEMATICS: Record<string, () => React.ReactNode> = {
  t4: MiniT4,
  t5: MiniT5,
  t6: MiniT6,
};

export function PresetPanel() {
  const [openSchematic, setOpenSchematic] = useState<string | null>(null);

  // Kurulum: temizliği + yüklemeyi TEK geri alınabilir adımda yapar.
  // Panoda iş varken açıkça sorar — öğrencinin 20 dakikalık kablosu uyarısız silinmez (R1 #5).
  const handleInstall = async (p: Preset) => {
    if (getState().cables.length > 0) {
      const ok = await confirmAction({
        title: `"${p.name}" panoya kurulacak`,
        body: `Mevcut ${getState().cables.length} kablo kalkacak. Kablo işlemlerini Ctrl+Z ile geri alabilirsiniz.`,
        confirmLabel: 'Devreyi Kur',
        cancelLabel: 'İptal',
      });
      if (!ok) return;
    }
    A.replaceDoc({
      v: 1,
      cables: presetCables(p),
      breakers: { motor: true, control: true },
      zr: getState().zr,
      termikArmed: true,
    });
  };

  return (
    <div className="inspectorSection" aria-label="MEB Kitap Devreleri">
      <div className="sectionIntro">
        <span className="sectionIntroTitle">Milli Eğitim Müfredatı</span>
        <span className="sectionIntroDesc">
          10. Sınıf Kumanda ve Kontrol Atölyesi temrin devrelerini tek tıklamayla panoya kurun.
        </span>
      </div>

      <div className="presetCardsList">
        {PRESETS.map((p: Preset) => {
          const isSchematicOpen = openSchematic === p.id;
          const SchematicComponent = SCHEMATICS[p.id];
          return (
            <div key={p.id} className="appleCard presetCard">
              <div className="cardHeader">
                <div>
                  <span className="presetNumber">{p.gorsel}</span>
                  <h3 className="presetTitle">{p.name}</h3>
                </div>
              </div>

              <p className="cardText">{p.kisa}</p>

              {/* Şema Önizleme Butonu & Çizim */}
              {SchematicComponent && (
                <div className="schematicContainer" id={`schem-${p.id}`}>
                  <button
                    type="button"
                    className="schematicToggle"
                    aria-expanded={isSchematicOpen}
                    aria-controls={`schem-${p.id}`}
                    onClick={() => setOpenSchematic(isSchematicOpen ? null : p.id)}
                  >
                    <span>{isSchematicOpen ? 'Şemayı Gizle' : 'Elektrik Şemasını Göster'}</span>
                  </button>
                  {isSchematicOpen && (
                    <div className="schematicFrame">
                      <SchematicComponent />
                    </div>
                  )}
                </div>
              )}

              <ul className="presetSteps">
                {p.aciklama.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>

              <button
                type="button"
                className="appleButton primary"
                title="Mevcut kablolar silinip bu devre kurulur; önce onay ister"
                aria-label={`"${p.name}" devresini panoya kur`}
                onClick={() => void handleInstall(p)}
              >
                <IconPlay style={{ width: 14, height: 14, marginRight: 6 }} />
                <span>Devreyi Panoya Kur</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
