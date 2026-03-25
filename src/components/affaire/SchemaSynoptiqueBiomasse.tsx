'use client';

const BIOMASSE_CHARS: Record<string, { pci: number; masseVol: number; tauxCendre: number }> = {
  PLAQUETTE:  { pci: 3.8, masseVol: 225, tauxCendre: 0.01 },
  GRANULES:   { pci: 4.6, masseVol: 650, tauxCendre: 0.005 },
  MISCANTHUS: { pci: 4.2, masseVol: 120, tauxCendre: 0.03 },
  BUCHES:     { pci: 4.0, masseVol: 420, tauxCendre: 0.01 },
};

interface SchemaSynoptiqueProps {
  puissanceChaudiereBois: number;
  rendementChaudiereBois: number; // 0-100 (%)
  puissanceChaudiere2: number;
  rendementChaudiere2: number; // 0-100 (%)
  pourcentageCouvertureBois: number; // 0-100 (%)
  typeBiomasse: string;
  combustibleAppoint: string;
  longueurReseau: number;
  sectionReseau: string;
  volumeCamion: number;
  volumeSilo: number;
  kmHaieAn: number;
  stereAn: number;
  consoBatimentsParc: number; // kWh/an
}

function fmt(n: number, decimals = 1): string {
  if (!isFinite(n) || isNaN(n)) return '0';
  return n.toLocaleString('fr-FR', { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
}

export function SchemaSynoptiqueBiomasse(props: SchemaSynoptiqueProps) {
  const {
    puissanceChaudiereBois, rendementChaudiereBois,
    puissanceChaudiere2, rendementChaudiere2,
    pourcentageCouvertureBois, typeBiomasse,
    combustibleAppoint, longueurReseau, sectionReseau,
    volumeCamion, volumeSilo, kmHaieAn, stereAn,
    consoBatimentsParc,
  } = props;

  const chars = BIOMASSE_CHARS[typeBiomasse] || BIOMASSE_CHARS.PLAQUETTE;
  const couverturePct = pourcentageCouvertureBois > 1 ? pourcentageCouvertureBois : pourcentageCouvertureBois * 100;

  // Calculs
  const consoSortieBois = consoBatimentsParc * (couverturePct / 100);
  const rendBoisNorm = rendementChaudiereBois > 1 ? rendementChaudiereBois / 100 : rendementChaudiereBois;
  const consoEntreeBois = rendBoisNorm > 0 ? consoSortieBois / rendBoisNorm : 0;
  const consoSortieAppoint = consoBatimentsParc * (1 - couverturePct / 100);
  const rendApptNorm = rendementChaudiere2 > 1 ? rendementChaudiere2 / 100 : rendementChaudiere2;
  const consoEntreeAppoint = rendApptNorm > 0 ? consoSortieAppoint / rendApptNorm : 0;

  const consoAnnuelleTonnes = consoEntreeBois / (chars.pci * 1000);
  const consoAnnuelleM3 = chars.masseVol > 0 ? (consoAnnuelleTonnes * 1000) / chars.masseVol : 0;
  const nbLivraisons = volumeCamion > 0 ? Math.ceil(consoAnnuelleM3 / volumeCamion) : 0;

  const stockage10jT = (consoEntreeBois / 365 * 10) / (chars.pci * 1000);
  const stockage10jM3 = chars.masseVol > 0 ? (stockage10jT * 1000) / chars.masseVol : 0;

  const volumeCendresM3 = chars.masseVol > 0 ? (consoEntreeBois * chars.tauxCendre) / chars.masseVol : 0;

  const heuresPP = puissanceChaudiereBois > 0 ? consoSortieBois / puissanceChaudiereBois : 0;

  const consoEntreeBoiskWh = consoEntreeBois / 1000;
  const consoSortieBoiskWh = consoSortieBois / 1000;
  const consoReseauMWh = consoBatimentsParc / 1000;
  const consoSortieAppointMWh = consoSortieAppoint / 1000;
  const consoEntreeAppointMWh = consoEntreeAppoint / 1000;

  // Label component
  const Label = ({ x, y, lines, bg = 'white' }: { x: number; y: number; lines: string[]; bg?: string }) => {
    const w = 120;
    const lineH = 14;
    const h = lines.length * lineH + 8;
    return (
      <g>
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={3} fill={bg} stroke="#9ca3af" strokeWidth={0.5} />
        {lines.map((line, i) => (
          <text key={i} x={x} y={y - h / 2 + 12 + i * lineH} textAnchor="middle" fontSize={10} fill="#374151" fontWeight={500}>
            {line}
          </text>
        ))}
      </g>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Schema synoptique</h4>
      <svg viewBox="0 0 860 420" className="w-full" style={{ maxHeight: 420 }}>
        <defs>
          <marker id="arrowG" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#16a34a" />
          </marker>
          <marker id="arrowB" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#2563eb" />
          </marker>
          <marker id="arrowGray" markerWidth={8} markerHeight={6} refX={8} refY={3} orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="#6b7280" />
          </marker>
        </defs>

        {/* Background */}
        <rect width={860} height={420} rx={8} fill="#f9fafb" />

        {/* ===== CAMION (gauche) ===== */}
        <g transform="translate(60, 140)">
          {/* Remorque */}
          <rect x={0} y={0} width={80} height={50} rx={4} fill="#65a30d" stroke="#4d7c0f" strokeWidth={1.5} />
          {/* Cabine */}
          <rect x={80} y={10} width={30} height={40} rx={3} fill="#84cc16" stroke="#4d7c0f" strokeWidth={1.5} />
          {/* Roues */}
          <circle cx={20} cy={55} r={8} fill="#374151" />
          <circle cx={60} cy={55} r={8} fill="#374151" />
          <circle cx={95} cy={55} r={8} fill="#374151" />
          {/* Label */}
          <text x={55} y={30} textAnchor="middle" fontSize={11} fill="white" fontWeight={700}>CAMION</text>
        </g>
        {/* Valeurs camion */}
        <Label x={100} y={110} lines={[`${nbLivraisons} liv/an`, `${fmt(consoAnnuelleM3)} m3/an`]} />
        {kmHaieAn > 0 && <Label x={100} y={240} lines={[`${fmt(kmHaieAn)} km haie/an`]} />}
        {stereAn > 0 && typeBiomasse === 'BUCHES' && <Label x={100} y={270} lines={[`${fmt(stereAn)} stere/an`]} />}

        {/* ===== Flèche Camion → Silo ===== */}
        <line x1={175} y1={165} x2={225} y2={165} stroke="#16a34a" strokeWidth={2.5} markerEnd="url(#arrowG)" />
        <Label x={200} y={145} lines={[`${fmt(consoAnnuelleM3)} m3/an`, `${fmt(consoEntreeBoiskWh)} MWh/an`]} />

        {/* ===== SILO ===== */}
        <g transform="translate(235, 120)">
          {/* Dôme */}
          <path d="M0,50 Q0,0 50,0 Q100,0 100,50 Z" fill="#fbbf24" stroke="#d97706" strokeWidth={1.5} />
          {/* Base */}
          <rect x={0} y={50} width={100} height={40} fill="#fcd34d" stroke="#d97706" strokeWidth={1.5} />
          <text x={50} y={38} textAnchor="middle" fontSize={11} fill="#78350f" fontWeight={700}>SILO</text>
          <text x={50} y={78} textAnchor="middle" fontSize={9} fill="#92400e">{volumeSilo ? `${fmt(volumeSilo, 0)} m3` : '-'}</text>
        </g>
        {/* Valeur stockage 10j */}
        <Label x={285} y={100} lines={[`Stock 10j: ${fmt(stockage10jM3)} m3`]} />

        {/* ===== CENDRIER (sous le silo) ===== */}
        <g transform="translate(255, 260)">
          <rect x={0} y={0} width={60} height={30} rx={3} fill="#d1d5db" stroke="#6b7280" strokeWidth={1} />
          <text x={30} y={18} textAnchor="middle" fontSize={9} fill="#374151" fontWeight={600}>CENDRIER</text>
        </g>
        <line x1={285} y1={210} x2={285} y2={258} stroke="#6b7280" strokeWidth={1.5} strokeDasharray="4 2" markerEnd="url(#arrowGray)" />
        <Label x={285} y={310} lines={[`${fmt(volumeCendresM3, 2)} m3/an`]} />

        {/* ===== Flèche Silo → Chaudière Bois ===== */}
        <line x1={340} y1={165} x2={400} y2={165} stroke="#16a34a" strokeWidth={2.5} markerEnd="url(#arrowG)" />

        {/* ===== CHAUDIÈRE BOIS ===== */}
        <g transform="translate(410, 115)">
          <rect x={0} y={0} width={130} height={100} rx={6} fill="#dc2626" stroke="#991b1b" strokeWidth={2} />
          {/* Flamme */}
          <text x={65} y={35} textAnchor="middle" fontSize={24}>🔥</text>
          <text x={65} y={58} textAnchor="middle" fontSize={11} fill="white" fontWeight={700}>CHAUDIERE</text>
          <text x={65} y={72} textAnchor="middle" fontSize={10} fill="#fecaca" fontWeight={600}>BOIS</text>
          <text x={65} y={90} textAnchor="middle" fontSize={9} fill="#fecaca">
            {puissanceChaudiereBois > 0 ? `${fmt(puissanceChaudiereBois, 0)} kW` : '-'}
          </text>
        </g>
        {/* Valeurs chaudière bois */}
        <Label x={475} y={95} lines={[`Entree: ${fmt(consoEntreeBoiskWh)} MWh/an`, `Sortie: ${fmt(consoSortieBoiskWh)} MWh/an`, `Hpp: ${fmt(heuresPP, 0)} h`]} />

        {/* ===== Flèche Chaudière → Réseau ===== */}
        <line x1={545} y1={165} x2={600} y2={165} stroke="#2563eb" strokeWidth={2.5} markerEnd="url(#arrowB)" />
        {/* Réseau label */}
        <g transform="translate(600, 140)">
          <rect x={0} y={0} width={30} height={50} rx={2} fill="#3b82f6" stroke="#1d4ed8" strokeWidth={1} />
          <line x1={15} y1={0} x2={15} y2={50} stroke="#93c5fd" strokeWidth={1} />
          <line x1={0} y1={25} x2={30} y2={25} stroke="#93c5fd" strokeWidth={1} />
        </g>
        <Label x={615} y={120} lines={[`Reseau: ${fmt(consoReseauMWh)} MWh/an`, longueurReseau ? `${fmt(longueurReseau, 0)} ml ${sectionReseau || ''}` : '']} />

        {/* ===== Flèche Réseau → Chaudière appoint ===== */}
        <line x1={635} y1={165} x2={690} y2={165} stroke="#6b7280" strokeWidth={2} markerEnd="url(#arrowGray)" />

        {/* ===== CHAUDIÈRE APPOINT ===== */}
        <g transform="translate(695, 125)">
          <rect x={0} y={0} width={110} height={80} rx={6} fill="#6b7280" stroke="#4b5563" strokeWidth={1.5} />
          <text x={55} y={28} textAnchor="middle" fontSize={10} fill="white" fontWeight={700}>CHAUDIERE</text>
          <text x={55} y={42} textAnchor="middle" fontSize={10} fill="#d1d5db" fontWeight={600}>APPOINT</text>
          <text x={55} y={60} textAnchor="middle" fontSize={9} fill="#d1d5db">
            {puissanceChaudiere2 > 0 ? `${fmt(puissanceChaudiere2, 0)} kW` : '-'}
          </text>
          <text x={55} y={73} textAnchor="middle" fontSize={8} fill="#9ca3af">
            {combustibleAppoint || '-'}
          </text>
        </g>
        {/* Valeurs appoint */}
        {consoSortieAppoint > 0 && (
          <Label x={750} y={105} lines={[`Entree: ${fmt(consoEntreeAppointMWh)} MWh/an`, `Sortie: ${fmt(consoSortieAppointMWh)} MWh/an`]} />
        )}

        {/* ===== Légende ===== */}
        <g transform="translate(20, 370)">
          <rect x={0} y={0} width={12} height={12} rx={2} fill="#16a34a" />
          <text x={18} y={10} fontSize={9} fill="#374151">Biomasse</text>
          <rect x={85} y={0} width={12} height={12} rx={2} fill="#dc2626" />
          <text x={103} y={10} fontSize={9} fill="#374151">Chaudiere bois</text>
          <rect x={200} y={0} width={12} height={12} rx={2} fill="#3b82f6" />
          <text x={218} y={10} fontSize={9} fill="#374151">Reseau</text>
          <rect x={275} y={0} width={12} height={12} rx={2} fill="#6b7280" />
          <text x={293} y={10} fontSize={9} fill="#374151">Appoint</text>

          <text x={370} y={10} fontSize={9} fill="#6b7280">
            Biomasse: {typeBiomasse || '-'} | PCI: {chars.pci} MWh/t | Couverture: {fmt(couverturePct, 0)}%
          </text>
        </g>
      </svg>
    </div>
  );
}
