import { useState, useMemo, useRef, useEffect } from "react";
import { CATEGORIES, getCategoriesForProduct, getFundsForCategory, classifyFund } from "./utils/classifier";
import { PRODUCT_LABELS, getAllFunds, calcAverages, sortFunds } from "./utils/dataLoader";
import rawData from "./data/raw_data.json";

// ── Colour tokens ─────────────────────────────────────────────────────────────
const C = {
  crimson:   '#8B1A3A',
  crimsonLt: '#B02248',
  dark:      '#1A1A1A',
  darkMid:   '#2C2C2C',
  mid:       '#3D3D3D',
  muted:     '#6B6B6B',
  border:    '#E5E0DC',
  bg:        '#F8F5F2',
  white:     '#FFFFFF',
  pos:       '#16A34A',
  neg:       '#DC2626',
  avgBg:     '#F5F0EA',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const pctFmt   = v => v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
const pctFmtRaw= v => v == null ? '—' : `${v.toFixed(1)}%`;
const numColor = v => v == null ? C.dark : v >= 0 ? C.pos : C.neg;

// ── Product Selector ──────────────────────────────────────────────────────────
function ProductSelector({ selected, onChange }) {
  return (
    <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
      {Object.entries(PRODUCT_LABELS).map(([key, { label, icon }]) => {
        const active = selected === key;
        return (
          <button key={key} onClick={() => onChange(key)}
            style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:6,
              padding:'16px 24px', border:`2px solid ${active ? C.crimson : C.border}`,
              borderRadius:12, background: active ? C.crimson : C.white,
              color: active ? C.white : C.dark, cursor:'pointer',
              fontFamily:'inherit', fontSize:14, fontWeight:600, letterSpacing:'0.01em',
              transition:'all 0.2s', boxShadow: active ? '0 4px 20px rgba(139,26,58,0.25)' : '0 1px 4px rgba(0,0,0,0.06)',
              minWidth:130,
            }}>
            <span style={{ fontSize:26 }}>{icon}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position:'relative', display:'inline-flex', alignItems:'center', marginRight:6 }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{
          width:18, height:18, borderRadius:'50%', background:C.border,
          color:C.muted, fontSize:11, fontWeight:700,
          display:'inline-flex', alignItems:'center', justifyContent:'center',
          cursor:'help', flexShrink:0, border:`1px solid ${C.muted}`,
        }}>?</span>
      {show && (
        <div style={{
          position:'absolute', bottom:'calc(100% + 8px)', right:0, width:260,
          background:C.dark, color:C.white, borderRadius:8, padding:'10px 14px',
          fontSize:12, lineHeight:1.6, zIndex:1000, boxShadow:'0 8px 24px rgba(0,0,0,0.3)',
          direction:'rtl',
        }}>{text}</div>
      )}
    </span>
  );
}

// ── Category Tabs ─────────────────────────────────────────────────────────────
function CategoryTabs({ categories, selected, onSelect, funds }) {
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
      {categories.map(catId => {
        const cat = CATEGORIES[catId];
        const count = getFundsForCategory(funds, catId).length;
        if (count === 0) return null;
        const active = selected === catId;
        return (
          <button key={catId} onClick={() => onSelect(catId)}
            style={{
              padding:'7px 14px', borderRadius:20,
              border:`1.5px solid ${active ? C.crimson : C.border}`,
              background: active ? C.crimson : C.white,
              color: active ? C.white : C.mid,
              fontSize:12.5, fontWeight:600, cursor:'pointer',
              fontFamily:'inherit', transition:'all 0.15s',
              display:'flex', alignItems:'center', gap:6,
            }}>
            {cat.label}
            <span style={{
              background: active ? 'rgba(255,255,255,0.3)' : C.border,
              borderRadius:10, padding:'1px 7px', fontSize:11,
            }}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Fund Table ────────────────────────────────────────────────────────────────
function FundTable({ funds, onSelect, selectedFund, categoryId }) {
  const sorted = sortFunds(funds);
  const top12  = sorted.slice(0, 12);
  const rest   = sorted.slice(12);
  const avg    = calcAverages(sorted);
  const [showRest, setShowRest] = useState(false);
  const cat = CATEGORIES[categoryId];

  const colHeader = (label, tip) => (
    <th style={{ ...th, textAlign:'center' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
        {tip && <Tooltip text={tip} />}
        {label}
      </div>
    </th>
  );

  function FundRow({ fund, rank }) {
    const isAvg = fund.isAverage;
    const isSelected = !isAvg && selectedFund?.name === fund.name;
    return (
      <tr
        onClick={() => !isAvg && onSelect(fund)}
        style={{
          background: isAvg ? C.avgBg : isSelected ? '#FFF0F3' : C.white,
          cursor: isAvg ? 'default' : 'pointer',
          borderTop: isAvg ? `2px solid ${C.border}` : '1px solid #F0EBE6',
          transition:'background 0.12s',
        }}
        onMouseEnter={e => { if (!isAvg && !isSelected) e.currentTarget.style.background = '#FDF8F6'; }}
        onMouseLeave={e => { if (!isAvg && !isSelected) e.currentTarget.style.background = C.white; }}
      >
        <td style={{ ...td, color:C.muted, fontWeight:500, textAlign:'center', fontSize:12 }}>
          {isAvg ? '⌀' : rank}
        </td>
        <td style={{ ...td, fontWeight: isAvg ? 700 : 500, color: isSelected ? C.crimson : C.dark, direction:'rtl', maxWidth:220 }}>
          <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={fund.name}>
            {fund.name}
          </div>
        </td>
        {['ret_month','ret_1y','ret_3y','ret_5y'].map(k => (
          <td key={k} style={{ ...td, textAlign:'center', color: numColor(fund[k]), fontWeight:600, fontVariantNumeric:'tabular-nums' }}>
            {pctFmt(fund[k])}
          </td>
        ))}
        <td style={{ ...td, textAlign:'center', color:C.crimson, fontWeight:700 }}>
          {fund.profit_index != null ? fund.profit_index.toFixed(1) : '—'}
        </td>
        {!isAvg && (
          <td style={{ ...td, textAlign:'center' }}>
            <button onClick={e => { e.stopPropagation(); onSelect(fund); }}
              style={{
                background: isSelected ? C.crimson : 'transparent',
                border:`1px solid ${C.border}`, borderRadius:6, padding:'3px 10px',
                fontSize:11, cursor:'pointer', color: isSelected ? C.white : C.muted,
                fontFamily:'inherit',
              }}>
              {isSelected ? '◀ פתוח' : 'פרטים'}
            </button>
          </td>
        )}
        {isAvg && <td style={td} />}
      </tr>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', marginBottom:12 }}>
        <h3 style={{ margin:0, fontSize:17, color:C.dark, fontWeight:700 }}>{cat?.label}</h3>
        <span style={{ marginRight:8, fontSize:13, color:C.muted }}>{cat?.desc}</span>
      </div>

      <div style={{ overflowX:'auto', borderRadius:12, border:`1px solid ${C.border}`, boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:C.dark, color:C.white }}>
              <th style={{ ...th, width:40 }}>#</th>
              <th style={{ ...th, textAlign:'right' }}>שם המוצר</th>
              {colHeader('חודש', 'תשואה בחודש האחרון')}
              {colHeader('שנה', 'תשואה מצטברת 12 חודשים אחרונים')}
              {colHeader('3 שנים', 'תשואה מצטברת 36 חודשים אחרונים')}
              {colHeader('5 שנים', 'תשואה מצטברת 60 חודשים אחרונים')}
              {colHeader('מדד פרופיט', 'מדד שירות ואיכות ניהול של Profit Financial Group')}
              <th style={th} />
            </tr>
          </thead>
          <tbody>
            {top12.map((f, i) => <FundRow key={f.name} fund={f} rank={i + 1} />)}
            <FundRow fund={avg} rank={null} />
          </tbody>
        </table>
      </div>

      {rest.length > 0 && (
        <div style={{ marginTop:8 }}>
          <button onClick={() => setShowRest(!showRest)}
            style={{
              background:'transparent', border:'none', color:C.crimson,
              fontSize:13, cursor:'pointer', fontFamily:'inherit', fontWeight:600,
              display:'flex', alignItems:'center', gap:6, padding:'6px 0',
            }}>
            <span style={{ fontSize:16 }}>{showRest ? '▲' : '▼'}</span>
            {showRest ? 'הסתר' : `הצג עוד ${rest.length} מוצרים`}
          </button>
          {showRest && (
            <div style={{ overflowX:'auto', borderRadius:12, border:`1px solid ${C.border}`, marginTop:6, boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <tbody>
                  {rest.map((f, i) => <FundRow key={f.name} fund={f} rank={13 + i} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Return chart (mini sparkline via SVG) ─────────────────────────────────────
function ReturnChart({ fund }) {
  const points = [
    { label: 'חודש', val: fund.ret_month },
    { label: 'שנה',  val: fund.ret_1y },
    { label: '3 שנים', val: fund.ret_3y },
    { label: '5 שנים', val: fund.ret_5y },
  ].filter(p => p.val != null);

  if (points.length < 2) return <p style={{ color:C.muted, fontSize:13 }}>אין מספיק נתונים לגרף</p>;

  const vals = points.map(p => p.val);
  const min  = Math.min(...vals);
  const max  = Math.max(...vals);
  const H = 120, W = 300, pad = 20;
  const yScale = v => H - pad - ((v - min) / (max - min || 1)) * (H - pad * 2);
  const xScale = i => pad + (i / (points.length - 1)) * (W - pad * 2);

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(p.val)}`).join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:'visible' }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.crimson} stopOpacity="0.3" />
          <stop offset="100%" stopColor={C.crimson} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area */}
      <path d={`${pathD} L ${xScale(points.length-1)} ${H} L ${xScale(0)} ${H} Z`}
        fill="url(#chartGrad)" />
      {/* Line */}
      <path d={pathD} fill="none" stroke={C.crimson} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots + labels */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={xScale(i)} cy={yScale(p.val)} r="4" fill={C.crimson} />
          <text x={xScale(i)} y={yScale(p.val) - 8} textAnchor="middle" fontSize="10" fill={C.crimson} fontWeight="700">
            {pctFmt(p.val)}
          </text>
          <text x={xScale(i)} y={H - 4} textAnchor="middle" fontSize="9" fill={C.muted}>
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── Fund Detail Panel ─────────────────────────────────────────────────────────
function FundDetail({ fund, onClose }) {
  if (!fund) return null;
  const cats = classifyFund(fund).map(id => CATEGORIES[id]?.label).filter(Boolean);

  const ParamRow = ({ label, value, fmt }) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
      padding:'8px 0', borderBottom:`1px solid ${C.border}` }}>
      <span style={{ color:C.muted, fontSize:13 }}>{label}</span>
      <span style={{ fontWeight:700, color:C.dark, fontSize:13 }}>{fmt ? fmt(value) : (value ?? '—')}</span>
    </div>
  );

  return (
    <div style={{
      position:'fixed', top:0, left:0, width:380, height:'100vh',
      background:C.white, boxShadow:'4px 0 40px rgba(0,0,0,0.12)',
      zIndex:200, overflowY:'auto', display:'flex', flexDirection:'column',
      direction:'rtl',
    }}>
      {/* Header */}
      <div style={{ background:C.crimson, padding:'20px 20px 16px', color:C.white }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <h2 style={{ margin:0, fontSize:15, fontWeight:700, lineHeight:1.4, flex:1 }}>
            {fund.name}
          </h2>
          <button onClick={onClose} style={{
            background:'rgba(255,255,255,0.2)', border:'none', color:C.white,
            width:28, height:28, borderRadius:'50%', cursor:'pointer',
            fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0, marginRight:12,
          }}>×</button>
        </div>
        <div style={{ marginTop:8, display:'flex', gap:6, flexWrap:'wrap' }}>
          {cats.slice(0, 3).map(c => (
            <span key={c} style={{
              background:'rgba(255,255,255,0.2)', borderRadius:12,
              padding:'2px 10px', fontSize:11, fontWeight:600,
            }}>{c}</span>
          ))}
        </div>
      </div>

      <div style={{ padding:20, flex:1 }}>
        {/* Profit index */}
        <div style={{
          background: 'linear-gradient(135deg, #FFF0F3, #FFE4EA)',
          border:`1px solid #F8C8D0`, borderRadius:12, padding:'14px 16px',
          marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <span style={{ fontSize:13, fontWeight:600, color:C.crimson }}>מדד פרופיט</span>
          <span style={{ fontSize:28, fontWeight:800, color:C.crimson }}>
            {fund.profit_index != null ? fund.profit_index.toFixed(1) : '—'}
          </span>
        </div>

        {/* Returns */}
        <h4 style={{ margin:'0 0 10px', fontSize:14, color:C.dark, fontWeight:700 }}>תשואות</h4>
        <ParamRow label="חודש אחרון"   value={fund.ret_month} fmt={pctFmt} />
        <ParamRow label="מתחילת השנה"  value={fund.ret_ytd}   fmt={pctFmt} />
        <ParamRow label="12 חודשים"    value={fund.ret_1y}    fmt={pctFmt} />
        <ParamRow label="36 חודשים"    value={fund.ret_3y}    fmt={pctFmt} />
        <ParamRow label="60 חודשים"    value={fund.ret_5y}    fmt={pctFmt} />

        {/* Chart */}
        <h4 style={{ margin:'20px 0 10px', fontSize:14, color:C.dark, fontWeight:700 }}>גרף תשואות</h4>
        <div style={{ background:C.bg, borderRadius:10, padding:14 }}>
          <ReturnChart fund={fund} />
        </div>

        {/* Exposures */}
        <h4 style={{ margin:'20px 0 10px', fontSize:14, color:C.dark, fontWeight:700 }}>חשיפות</h4>
        <ParamRow label="חשיפה למניות"  value={fund.stocks}   fmt={pctFmtRaw} />
        <ParamRow label={'חשיפה לחו"ל'}  value={fund.foreign}  fmt={pctFmtRaw} />
        <ParamRow label={'חשיפה למט"ח'}  value={fund.forex}    fmt={pctFmtRaw} />
        <ParamRow label="נכסים לא סחירים" value={fund.illiquid} fmt={pctFmtRaw} />
        {fund.sharpe != null && <ParamRow label="מדד שארפ" value={fund.sharpe.toFixed(2)} />}
        {fund.fees != null && <ParamRow label="דמי ניהול" value={fund.fees} fmt={pctFmtRaw} />}

        {/* AI placeholder */}
        <div style={{
          marginTop:24, background:C.bg, border:`1.5px dashed ${C.border}`,
          borderRadius:12, padding:16,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <span style={{ fontSize:18 }}>🤖</span>
            <span style={{ fontSize:13, fontWeight:700, color:C.dark }}>ניתוח AI</span>
            <span style={{ fontSize:11, color:C.muted, background:C.border, borderRadius:10, padding:'2px 8px' }}>
              בקרוב
            </span>
          </div>
          <p style={{ margin:0, fontSize:12, color:C.muted, lineHeight:1.6 }}>
            כאן יופיע תיאור AI על הגוף המנהל, אסטרטגיית ניהול ההשקעות, וה"סיפור" של המוצר.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Table styles ──────────────────────────────────────────────────────────────
const th = {
  padding:'11px 12px', fontSize:12, fontWeight:700,
  letterSpacing:'0.03em', textTransform:'uppercase',
  whiteSpace:'nowrap',
};
const td = { padding:'10px 12px', fontSize:13 };

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [product, setProduct]   = useState('השתלמות');
  const [category, setCategory] = useState(null);
  const [selFund, setSelFund]   = useState(null);

  const funds = useMemo(() => getAllFunds(product), [product]);
  const catIds = useMemo(() => getCategoriesForProduct(product), [product]);

  // Pick first valid category when product changes
  useEffect(() => {
    const first = catIds.find(id => getFundsForCategory(funds, id).length > 0);
    setCategory(first ?? null);
    setSelFund(null);
  }, [product]);

  const visibleFunds = useMemo(() =>
    category ? getFundsForCategory(funds, category) : [],
    [funds, category]
  );

  const panelOpen = selFund !== null;

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:"'Assistant', 'Heebo', Arial, sans-serif", direction:'rtl' }}>
      {/* ── Top Nav ── */}
      <nav style={{
        background:C.dark, padding:'0 32px', display:'flex', alignItems:'center',
        justifyContent:'space-between', height:60, position:'sticky', top:0, zIndex:100,
        boxShadow:'0 2px 12px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:36, height:36, borderRadius:8,
            background:`linear-gradient(135deg, ${C.crimson}, ${C.crimsonLt})`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:900, color:C.white, fontSize:14, letterSpacing:'-0.5px',
          }}>PG</div>
          <div>
            <div style={{ color:C.white, fontWeight:800, fontSize:17, lineHeight:1 }}>ProGemel</div>
            <div style={{ color:C.muted, fontSize:10, letterSpacing:'0.08em' }}>PROFIT FINANCIAL GROUP</div>
          </div>
        </div>
        <div style={{ color:C.muted, fontSize:12 }}>
          נתונים: {new Date().toLocaleDateString('he-IL')}
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{
        background:`linear-gradient(135deg, ${C.dark} 0%, ${C.darkMid} 60%, #3A0A1A 100%)`,
        padding:'40px 32px 48px', textAlign:'center', position:'relative', overflow:'hidden',
      }}>
        <div style={{
          position:'absolute', inset:0, opacity:0.04,
          backgroundImage:'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
          backgroundSize:'20px 20px',
        }} />
        <h1 style={{ margin:'0 0 10px', fontSize:28, fontWeight:800, color:C.white, position:'relative' }}>
          השוואת מסלולי חיסכון
        </h1>
        <p style={{ margin:0, color:'rgba(255,255,255,0.55)', fontSize:15, position:'relative' }}>
          בחר מוצר, סנן לפי קטגוריה, ומצא את המסלול הטוב ביותר עבורך
        </p>
      </div>

      {/* ── Product Selector ── */}
      <div style={{ padding:'28px 32px 0', maxWidth:900, margin:'0 auto' }}>
        <ProductSelector selected={product} onChange={setProduct} />
      </div>

      {/* ── Main Content ── */}
      <div style={{
        display:'flex', transition:'all 0.3s',
        paddingRight: panelOpen ? 380 : 0,
      }}>
        <div style={{ flex:1, padding:'24px 32px 48px', maxWidth:'100%', minWidth:0 }}>
          {/* Category tabs */}
          <CategoryTabs
            categories={catIds}
            selected={category}
            onSelect={id => { setCategory(id); setSelFund(null); }}
            funds={funds}
          />

          {/* Table */}
          {category && visibleFunds.length > 0 ? (
            <FundTable
              funds={visibleFunds}
              categoryId={category}
              onSelect={setSelFund}
              selectedFund={selFund}
            />
          ) : (
            <div style={{
              textAlign:'center', padding:'60px 0', color:C.muted, fontSize:15,
            }}>
              אין מוצרים בקטגוריה זו
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Panel ── */}
      {panelOpen && (
        <>
          <div onClick={() => setSelFund(null)} style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.2)',
            zIndex:150, backdropFilter:'blur(2px)',
          }} />
          <FundDetail fund={selFund} onClose={() => setSelFund(null)} />
        </>
      )}

      {/* ── Footer ── */}
      <footer style={{
        background:C.dark, color:'rgba(255,255,255,0.4)',
        textAlign:'center', padding:'20px 32px', fontSize:12,
        borderTop:`1px solid ${C.mid}`,
      }}>
        © {new Date().getFullYear()} Profit Financial Group · כל הזכויות שמורות ·
        הנתונים מוצגים לצורך מידע בלבד ואינם מהווים ייעוץ השקעות
      </footer>
    </div>
  );
}
