import React from 'react';
import {
  AbsoluteFill,
  Audio,
  continueRender,
  delayRender,
  Easing,
  Freeze,
  Img,
  OffthreadVideo,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import timeline from './timeline.json';

// ---- Brand tokens (brand/brand-sheet.html) ----
const RED = '#EC0202';
const INK = '#1A1413';
const AMBER = '#F5B50A';
// Caption colours: white base, yellow active word, orange key words
const CAP_WHITE = '#FFFFFF';
const CAP_YELLOW = '#FFD23F';
const CAP_ORANGE = '#FF8A1F';

export const FPS = 30;
// Clip order: 7390 (things) -> 7401 (flowers) -> 7406 (between) -> 7411 (Meet AiiDell)
const SEG: number[] = timeline.segStarts; // [A, B, C, D, end]
const VIDEO_END = SEG[4];
const END_CARD = 1.9;
export const TOTAL_SECONDS = VIDEO_END + END_CARD;

type W = {t: number; w: string; key?: boolean};
const WORDS: W[] = timeline.words;
const wordT = (w: string, nth = 0) => WORDS.filter((x) => x.w.replace(/[^\w]/g, '') === w)[nth].t;

// ---- Fonts: load every face before frames are captured ----
const fontHandle = delayRender('Loading brand fonts');
Promise.all(
  [
    ['Baloo 2', 'fonts/Baloo-2-wght-800.ttf', '800'],
    ['Baloo 2', 'fonts/Baloo-2-wght-600.ttf', '600'],
    ['DM Sans', 'fonts/DM-Sans-wght-500.ttf', '500'],
    ['DM Sans', 'fonts/DM-Sans-wght-700.ttf', '700'],
    ['Great Vibes', 'fonts/Great-Vibes.ttf', '400'],
  ].map(async ([family, file, weight]) => {
    const f = new FontFace(family, `url('${staticFile(file)}')`, {weight});
    await f.load();
    document.fonts.add(f);
  }),
).then(() => continueRender(fontHandle));

const DISPLAY = "'Baloo 2', sans-serif";
const BODY = "'DM Sans', sans-serif";
const SCRIPT = "'Great Vibes', cursive";
const EMOJI = "'Noto Color Emoji'";

// Key moments
const T_LOVE = wordT('love');
const T_47 = wordT('47');
const T_FLOWERS = wordT('Flowers');
const T_CAKE = wordT('Cake');
const T_HAMPERS = wordT('Hampers');
const T_NOW = wordT('now');
const T_INDIA = wordT('India');
const T_INDONESIA = wordT('Indonesia');
const T_AIIDELL = wordT('AiiDell');
const T_INTL = wordT('international');

// ---- B-roll: few, gentle cross-fades ----
type B = {start: number; end: number; src: string; fx: number; fy: number};
const BROLL: B[] = [
  {start: wordT('someone'), end: T_47 - 0.25, src: 'broll/couple.jpg', fx: 60, fy: 40},
  {start: T_FLOWERS, end: T_CAKE, src: 'broll/roses.jpg', fx: 45, fy: 40},
  {start: T_CAKE, end: T_HAMPERS, src: 'broll/cake.jpg', fx: 62, fy: 45},
];
const FADE = 0.22; // seconds

const useT = () => useCurrentFrame() / FPS;

const fadeWindow = (t: number, start: number, end: number, f = FADE) =>
  Math.min(
    interpolate(t, [start - f / 2, start + f / 2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    interpolate(t, [end - f / 2, end + f / 2], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );

const usePop = (start: number, damping = 14) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - Math.round(start * fps), fps, config: {damping, mass: 0.6}});
};

// ---------- Animated background (slow, calm) ----------
const BG_STOPS = [0, SEG[1], SEG[2], SEG[3], SEG[4], TOTAL_SECONDS];
const BG_TOP = ['#FFE9E5', '#FFE4D2', '#FFE1E8', '#FFE9E5', '#FFDCD6', '#FFDCD6'];
const BG_BOTTOM = ['#FFC9C1', '#FFC8A8', '#FFBFCF', '#FFC9C1', '#FFB8AE', '#FFB8AE'];
const ICONS = ['♥', '✈', '✉', '♥', '★', '♥', '✈', '✉', '♥', '★'];

const AnimatedBackground: React.FC = () => {
  const t = useT();
  const top = interpolateColors(t, BG_STOPS, BG_TOP);
  const bottom = interpolateColors(t, BG_STOPS, BG_BOTTOM);
  const blob = (x: number, y: number, r: number, color: string, sp: number, ph: number, op: number) => (
    <div style={{position: 'absolute', left: x + Math.sin(t * sp + ph) * 70, top: y + Math.cos(t * sp * 0.8 + ph) * 50,
      width: r, height: r, borderRadius: r, background: color, opacity: op, filter: 'blur(80px)'}} />
  );
  // dashed flight path draws across the top while AiiDell is introduced
  const draw = interpolate(t, [SEG[3], T_INTL], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`, overflow: 'hidden'}}>
      {blob(-120, -80, 560, AMBER, 0.35, 0, 0.18)}
      {blob(620, 260, 520, RED, 0.3, 2, 0.1)}
      {blob(120, 620, 480, '#FF7FA0', 0.4, 4, 0.14)}
      {ICONS.map((ic, i) => {
        const speed = 22 + (i % 4) * 8;
        const x = (i * 109 + 40) % 1000;
        const y = 900 - ((t * speed + i * 170) % 1000);
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, fontSize: 40 + (i % 3) * 14, color: RED,
            opacity: 0.13, transform: `rotate(${Math.sin(t * 0.8 + i) * 12}deg)`, fontFamily: DISPLAY}}>{ic}</div>
        );
      })}
      <svg width={1080} height={420} style={{position: 'absolute', top: 40, left: 0}} viewBox="0 0 1080 420">
        <path d="M 40 360 C 260 60, 820 60, 1040 300" fill="none" stroke={RED} strokeOpacity={0.35} strokeWidth={6}
          strokeDasharray="18 16" style={{clipPath: `inset(0 ${(1 - draw) * 100}% 0 0)`}} />
      </svg>
    </AbsoluteFill>
  );
};

// ---------- Header ----------
const Header: React.FC = () => {
  const t = useT();
  const bounce = usePop(T_AIIDELL, 9);
  const s = t < T_AIIDELL ? 1 : interpolate(bounce, [0, 1], [1.15, 1]);
  return (
    <div style={{position: 'absolute', top: 96 + Math.sin(t * 1.4) * 4, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
      <Img src={staticFile('logo.png')} style={{width: 270, transform: `scale(${s})`, borderRadius: 20, boxShadow: '0 10px 30px rgba(236,2,2,0.22)'}} />
      <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 70, color: INK, lineHeight: 1, marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 18}}>
        Gifts across
        <span style={{fontFamily: SCRIPT, fontWeight: 400, fontSize: 112, color: RED, lineHeight: 0.8}}>borders</span>
      </div>
    </div>
  );
};

// ---------- Cards: soft fade + small rise, cross-fade into each other ----------
const CardShell: React.FC<{start: number; end: number; children: React.ReactNode}> = ({start, end, children}) => {
  const t = useT();
  const op = fadeWindow(t, start, end, 0.3);
  if (op <= 0) return null;
  const rise = interpolate(t, [start - 0.15, start + 0.35], [24, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 430, height: 330, background: '#fff', borderRadius: 34, border: `5px solid ${RED}`,
      boxShadow: '0 18px 40px rgba(120,20,10,0.16)', transform: `translateY(${rise}px)`, opacity: op, overflow: 'hidden'}}>
      <div style={{height: 44, background: '#F6EFEE', borderBottom: '2px solid #EADFDD', display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 22}}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />)}
        <div style={{marginLeft: 20, fontFamily: BODY, fontWeight: 500, fontSize: 22, color: '#7A6E6B'}}>aiidell.com</div>
      </div>
      <div style={{position: 'absolute', top: 44, left: 0, right: 0, bottom: 0}}>{children}</div>
    </div>
  );
};

const Flag: React.FC<{f: string; label: string; on?: boolean}> = ({f, label, on}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '10px 26px 12px 18px', borderRadius: 999,
    background: on ? RED : '#FFF1EE', color: on ? '#fff' : INK, fontFamily: DISPLAY, fontWeight: 800, fontSize: 46}}>
    <span style={{fontFamily: EMOJI, fontSize: 44}}>{f}</span>{label}
  </div>
);

const Bubble: React.FC<{text: string; at: number}> = ({text, at}) => {
  const t = useT();
  const p = usePop(at, 16);
  if (t < at) return null;
  return (
    <div style={{alignSelf: 'flex-end', maxWidth: 700, background: '#E9E3E2', color: INK, borderRadius: 28, borderBottomRightRadius: 8,
      padding: '12px 26px', fontFamily: BODY, fontWeight: 500, fontSize: 38, opacity: p, transform: `translateY(${(1 - p) * 14}px)`}}>
      {text}
    </div>
  );
};

const ParagraphsCard: React.FC = () => {
  const t = useT();
  const stamp = usePop(T_47, 12);
  return (
    <CardShell start={0.05} end={SEG[1] + 0.1}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 12, padding: '18px 32px'}}>
        <Bubble at={0.5} text="I miss you so much 🥺" />
        <Bubble at={1.4} text="like SO much. let me explain why…" />
        <Bubble at={2.4} text="(paragraph 3 of 47)" />
      </div>
      {t >= T_47 && (
        <div style={{position: 'absolute', left: 90, bottom: 26, transform: `rotate(-5deg) scale(${interpolate(stamp, [0, 1], [1.25, 1])})`, opacity: stamp,
          border: `6px solid ${RED}`, color: RED, borderRadius: 18, padding: '2px 22px', fontFamily: DISPLAY, fontWeight: 800, fontSize: 48, background: 'rgba(255,255,255,0.94)'}}>
          47 paragraphs? Send a gift.
        </div>
      )}
    </CardShell>
  );
};

const ProductCard: React.FC<{start: number; end: number; emoji: string; name: string; tag: string}> = ({start, end, emoji, name, tag}) => (
  <CardShell start={start} end={end}>
    <div style={{display: 'flex', alignItems: 'center', height: '100%', gap: 36, padding: '0 46px'}}>
      <div style={{width: 190, height: 190, borderRadius: 30, background: '#FFF1EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: EMOJI, fontSize: 120}}>{emoji}</div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start'}}>
        <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 54, color: INK, lineHeight: 1.05}}>{name}</div>
        <div style={{background: RED, color: '#fff', borderRadius: 14, padding: '4px 20px 8px', fontFamily: DISPLAY, fontWeight: 800, fontSize: 42}}>{tag}</div>
      </div>
    </div>
  </CardShell>
);

const BetweenCard: React.FC = () => {
  const t = useT();
  return (
    <CardShell start={SEG[2]} end={SEG[3]}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 22}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
          <Flag f="🇮🇳" label="India" on={t >= T_INDIA} />
          <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 70, color: RED}}>⇄</div>
          <Flag f="🇮🇩" label="Indonesia" on={t >= T_INDONESIA} />
        </div>
        <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 34, color: '#6B605D'}}>Door to door, across borders</div>
      </div>
    </CardShell>
  );
};

const RouteCard: React.FC = () => {
  const t = useT();
  const prog = interpolate(t, [T_AIIDELL, T_INTL], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  return (
    <CardShell start={SEG[3]} end={VIDEO_END}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 26}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
          <Flag f="🇮🇩" label="Indonesia" />
          <div style={{position: 'relative', width: 120, height: 8, background: '#F3D5D0', borderRadius: 4}}>
            <div style={{width: `${prog * 100}%`, height: 8, background: RED, borderRadius: 4}} />
            <div style={{position: 'absolute', top: -34, left: prog * 120 - 30, fontFamily: EMOJI, fontSize: 52}}>🎁</div>
          </div>
          <Flag f="🇮🇳" label="India" on={t >= T_INTL} />
        </div>
        <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 34, color: '#6B605D'}}>Pay in Rupiah · Bought locally in India</div>
      </div>
    </CardShell>
  );
};

const EndCard: React.FC = () => {
  const t = useT();
  const op = interpolate(t, [VIDEO_END - 0.15, VIDEO_END + 0.25], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (op <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 430, height: 330, background: RED, borderRadius: 34,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: op,
      transform: `translateY(${(1 - op) * 20}px)`, boxShadow: '0 18px 40px rgba(120,20,10,0.25)'}}>
      <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 84, color: '#fff', lineHeight: 1}}>
        Comment <span style={{background: '#fff', color: RED, borderRadius: 18, padding: '0 22px'}}>GIFT</span>
      </div>
      <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 38, color: '#fff', opacity: 0.92}}>aiidell.com</div>
    </div>
  );
};

// ---------- Subtitles: phrase on screen, active word yellow, key words orange ----------
const PHRASE_LENGTHS = [3, 3, 2, 3, 3, 3, 1, 1, 1, 1, 1, 4, 2, 3, 2, 2, 1, 2, 3, 3, 2];
const PHRASES: {start: number; words: (W & {i: number})[]}[] = (() => {
  const out: {start: number; words: (W & {i: number})[]}[] = [];
  let i = 0;
  for (const n of PHRASE_LENGTHS) {
    if (i >= WORDS.length) break;
    const words = WORDS.slice(i, i + n).map((w, k) => ({...w, i: i + k}));
    out.push({start: words[0].t, words});
    i += n;
  }
  return out;
})();

const Subtitles: React.FC = () => {
  const t = useT();
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  let pi = -1;
  for (let k = 0; k < PHRASES.length; k++) if (PHRASES[k].start <= t) pi = k;
  if (pi < 0) return null;
  const ph = PHRASES[pi];
  const lastWord = ph.words[ph.words.length - 1];
  const nextStart = pi + 1 < PHRASES.length ? PHRASES[pi + 1].start : VIDEO_END;
  if (t >= Math.min(nextStart, lastWord.t + 1.0)) return null;
  const inP = spring({frame: frame - Math.round(ph.start * fps), fps, config: {damping: 14, mass: 0.5}, durationInFrames: 6});
  return (
    <div style={{position: 'absolute', top: 1625, left: 40, right: 40, display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
      transform: `translateY(${interpolate(inP, [0, 1], [14, 0])}px)`, opacity: inP}}>
      {ph.words.map((w) => {
        const active = t >= w.t && (w.i + 1 >= WORDS.length || t < WORDS[w.i + 1].t);
        const color = w.key ? CAP_ORANGE : active ? CAP_YELLOW : CAP_WHITE;
        return (
          <span key={w.i} style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: ph.words.length === 1 ? 112 : 88, lineHeight: 1.1, color,
            opacity: t >= w.t ? 1 : 0.55, display: 'inline-block', margin: '0 22px',
            WebkitTextStroke: '9px #120B0A', paintOrder: 'stroke fill', textShadow: '0 6px 14px rgba(0,0,0,0.45)'}}>
            {w.w}
          </span>
        );
      })}
    </div>
  );
};

// ---------- Speaker panel with gentle B-roll cross-fades ----------
const BRollLayer: React.FC = () => {
  const t = useT();
  return (
    <>
      {BROLL.map((b) => {
        const op = fadeWindow(t, b.start, b.end);
        if (op <= 0) return null;
        return (
          <AbsoluteFill key={b.src} style={{opacity: op}}>
            <Img src={staticFile(b.src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${b.fx}% ${b.fy}%`, transform: 'none'}} />
            <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.32) 100%)'}} />
          </AbsoluteFill>
        );
      })}
    </>
  );
};

const Panel: React.FC = () => {
  const t = useT();
  // one steady framing for the whole video (no zooms)
  const freezeAt = Math.round(VIDEO_END * FPS) - 2;
  const video = <OffthreadVideo muted src={staticFile('panel.mp4')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />;
  return (
    <div style={{position: 'absolute', left: 36, right: 36, top: 900, height: 1100, borderRadius: 48, overflow: 'hidden',
      boxShadow: '0 -10px 40px rgba(120,20,10,0.16)', background: '#000', border: '6px solid #fff'}}>
      <div style={{width: '100%', height: '100%', transform: 'none'}}>
        {t * FPS < freezeAt ? video : <Freeze frame={freezeAt}>{video}</Freeze>}
      </div>
      <BRollLayer />
    </div>
  );
};

// ---------- Music: soft plucked bed under the voice, lifts a little on the end card ----------
const musicVolume = (f: number) => {
  const t = f / FPS;
  const fadeIn = interpolate(t, [0, 0.6], [0, 1], {extrapolateRight: 'clamp'});
  const level = interpolate(t, [VIDEO_END - 0.2, VIDEO_END + 0.4], [0.22, 0.45], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = interpolate(t, [TOTAL_SECONDS - 1.0, TOTAL_SECONDS], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return fadeIn * level * fadeOut;
};

export const AiiDell01: React.FC = () => (
  <AbsoluteFill>
    <AnimatedBackground />
    <Header />
    <ParagraphsCard />
    <ProductCard start={T_FLOWERS} end={T_CAKE} emoji="🌹" name="Roses & Chocolates Combo" tag="Rp 210.000" />
    <ProductCard start={T_CAKE} end={T_HAMPERS} emoji="🎂" name="Cakes & bakes" tag="Delivered in India" />
    <ProductCard start={T_HAMPERS} end={SEG[2]} emoji="🎁" name="Hampers & combos" tag="94+ to pick from" />
    <BetweenCard />
    <RouteCard />
    <EndCard />
    <Panel />
    <Subtitles />
    <Audio src={staticFile('panel.mp4')} />
    <Audio src={staticFile('music.wav')} volume={musicVolume} />
  </AbsoluteFill>
);
