import React from 'react';
import { Check, Minus } from 'lucide-react';

/**
 * Competitive matrix. Each row traces its own hairline left-to-right when the
 * hosting Reveal fires (.cmp-row td::after in Main.css), staggered via --d.
 */

const ROWS = [
    { name: 'Live lap timing', others: [true, true, true] },
    { name: 'Steering display', others: [false, true, true] },
    { name: 'RTK precision', others: [false, false, false] },
    { name: 'Live sector delta', others: [false, false, false] },
    { name: 'Trajectory analysis', others: [false, false, false] },
];

const rowDelay = (idx: number) => ({ '--d': `${150 + idx * 110}ms` } as React.CSSProperties);

const CompareTable: React.FC = () => (
    <div className="relative overflow-x-auto rounded-2xl border border-mokart-primary/12 bg-mokart-surface">
        <table className="w-full text-left border-collapse min-w-[560px]">
            <thead>
                <tr className="border-b border-mokart-primary/12">
                    <th className="p-4 md:p-5 text-xs font-bold text-white/60 font-display tracking-tight">Feature</th>
                    {['Apex', 'Sodi', 'Facer'].map((c) => (
                        <th key={c} className="p-4 md:p-5 text-center text-xs text-white/35">{c}</th>
                    ))}
                    <th className="p-4 md:p-5 text-center text-xs font-bold text-mokart-primary bg-mokart-primary/[0.06] font-display tracking-tight">Mokart</th>
                </tr>
            </thead>
            <tbody>
                {ROWS.map((row, ri) => (
                    <tr key={row.name} className="cmp-row hover:bg-mokart-primary/[0.025] transition-colors" style={rowDelay(ri)}>
                        <td className="p-4 md:p-5 text-sm text-white/70">{row.name}</td>
                        {row.others.map((has, idx) => (
                            <td key={idx} className="p-4 md:p-5 text-center">
                                {has
                                    ? <Check size={16} className="mx-auto text-white/30" />
                                    : <Minus size={16} className="mx-auto text-white/12" />}
                            </td>
                        ))}
                        <td className="p-4 md:p-5 text-center bg-mokart-primary/[0.06]">
                            <Check size={17} className="mx-auto text-mokart-primary" strokeWidth={2.5} />
                        </td>
                    </tr>
                ))}
                <tr className="cmp-row" style={rowDelay(ROWS.length)}>
                    <td className="p-4 md:p-5 text-sm text-white/70">Hardware cost</td>
                    {['High', 'High', 'High'].map((c, idx) => (
                        <td key={idx} className="p-4 md:p-5 text-center text-xs text-white/35">{c}</td>
                    ))}
                    <td className="p-4 md:p-5 text-center text-xs font-bold text-mokart-primary bg-mokart-primary/[0.06]">Low</td>
                </tr>
            </tbody>
        </table>

        {/* second read */}
        <p className="px-4 md:px-5 pb-3 -mt-1 font-mono text-[9px] tracking-[0.15em] text-white/20 text-right select-none" aria-hidden="true">
            survey — rental-kart telemetry · Q2 2026
        </p>
    </div>
);

export default CompareTable;
