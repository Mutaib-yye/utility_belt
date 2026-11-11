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
  Sequence,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// ---- Brand tokens (brand/brand-sheet.html) ----
const RED = '#EC0202';
const INK = '#1A1413';
const AMBER = '#F5B50A';
// Caption colours requested: white base, yellow active word, orange key words
const CAP_WHITE = '#FFFFFF';
const CAP_YELLOW = '#FFD23F';
const CAP_ORANGE = '#FF8A1F';

export const FPS = 30;
const VIDEO_END = 21.2; // length of public/panel.mp4
const FREEZE_AT = 20.9; // a hand enters frame at ~21.0s
const END_CARD = 1.6;
export const TOTAL_SECONDS = VIDEO_END + END_CARD;

// Segment starts inside panel.mp4 (seconds)
const SEG = [0, 4.633, 10.767, 15.533, VIDEO_END];

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

// ---- Words: Whisper timings, text corrected by hand. key = always orange ----
type W = {t: number; w: string; key?: boolean};
const WORDS: W[] = [
  {t: 0.16, w: 'Meet'}, {t: 0.56, w: 'AiiDell', key: true}, {t: 1.54, w: 'your'},
  {t: 1.8, w: 'gifting'}, {t: 2.14, w: 'plans'}, {t: 2.57, w: 'just'}, {t: 3.01, w: 'got'},
  {t: 3.15, w: 'an'}, {t: 3.33, w: 'international', key: true}, {t: 4.11, w: 'update'},
  {t: 4.7, w: 'Things'}, {t: 5.16, w: 'you'}, {t: 5.33, w: 'could'}, {t: 5.77, w: 'send'},
  {t: 6.14, w: 'to'}, {t: 6.22, w: 'someone'}, {t: 6.79, w: 'you'}, {t: 7.03, w: 'love', key: true},
  {t: 7.6, w: 'besides'}, {t: 8.04, w: '47', key: true}, {t: 8.48, w: 'paragraphs'},
  {t: 9.2, w: 'about'}, {t: 9.4, w: 'how'}, {t: 9.61, w: 'much'}, {t: 9.89, w: 'you'},
  {t: 10.05, w: 'miss'}, {t: 10.28, w: 'them'},
  {t: 10.8, w: 'Flowers,', key: true}, {t: 11.44, w: 'obviously.'}, {t: 12.42, w: 'Cake,', key: true},
  {t: 12.96, w: 'always.'}, {t: 13.72, w: 'Hampers?', key: true}, {t: 14.4, w: 'now'},
  {t: 14.64, w: 'we'}, {t: 14.79, w: 'are'}, {t: 15.09, w: 'talking'},
  {t: 15.6, w: 'And'}, {t: 15.86, w: 'here,'}, {t: 16.85, w: 'the'}, {t: 17.14, w: 'interesting'},
  {t: 17.62, w: 'part'}, {t: 18.18, w: 'you'}, {t: 18.5, w: 'can'}, {t: 18.64, w: 'send'},
  {t: 18.93, w: 'them'}, {t: 19.22, w: 'between'}, {t: 19.73, w: 'India', key: true},
  {t: 20.09, w: 'and'}, {t: 20.4, w: 'Indonesia', key: true},
];
// Subtitle phrases (number of words in each, in order)
const PHRASE_LENGTHS = [2, 3, 3, 2, 3, 3, 2, 2, 2, 3, 2, 1, 1, 1, 1, 1, 3, 1, 2, 3, 3, 2, 2, 1];
const WORD_END = 21.1;

// ---- B-roll cutaways over the speaker panel ----
type B = {start: number; end: number; src: string; fx: number; fy: number};
const BROLL: B[] = [
  {start: 3.3, end: 4.62, src: 'broll/hero-generic.jpg', fx: 70, fy: 50},
  {start: 6.2, end: 7.55, src: 'broll/sunset-couple.jpg', fx: 55, fy: 60},
  {start: 10.78, end: 12.4, src: 'broll/tile-flowers.jpg', fx: 50, fy: 50},
  {start: 12.4, end: 13.7, src: 'broll/hero-birthday-in.jpg', fx: 62, fy: 55},
  {start: 13.7, end: 14.38, src: 'broll/tile-hampers.jpg', fx: 50, fy: 50},
  {start: 19.68, end: 20.35, src: 'broll/everyday-india.jpg', fx: 45, fy: 45},
  {start: 20.35, end: 20.9, src: 'broll/everyday-indonesia.jpg', fx: 45, fy: 45},
];

// Moments that get a pop sound + a visual change
const POPS = [0.15, 3.3, 4.7, 6.2, 8.04, 10.78, 12.4, 13.7, 15.6, 19.68, VIDEO_END];

const useT = () => useCurrentFrame() / FPS;

const usePop = (start: number, damping = 13) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - Math.round(start * fps), fps, config: {damping, mass: 0.6}});
};

// ---------- Animated background ----------
const BG_STOPS = [0, 4.6, 10.7, 15.5, 21.2, 22.8];
const BG_TOP = ['#FFE9E5', '#FFE4D2', '#FFE9E5', '#FFE1E8', '#FFE9E5', '#FFD9D3'];
const BG_BOTTOM = ['#FFC9C1', '#FFC8A8', '#FFC9C1', '#FFBFCF', '#FFC9C1', '#FFB3A8'];

const ICONS = ['♥', '✈', '✉', '♥', '★', '♥', '✈', '✉', '♥', '★', '♥', '✉'];

const AnimatedBackground: React.FC = () => {
  const t = useT();
  const top = interpolateColors(t, BG_STOPS, BG_TOP);
  const bottom = interpolateColors(t, BG_STOPS, BG_BOTTOM);
  const blob = (x: number, y: number, r: number, color: string, sp: number, ph: number, op: number) => (
    <div style={{position: 'absolute', left: x + Math.sin(t * sp + ph) * 90, top: y + Math.cos(t * sp * 0.8 + ph) * 70,
      width: r, height: r, borderRadius: r, background: color, opacity: op, filter: 'blur(80px)'}} />
  );
  // dashed flight path drawn across the top during the hook
  const draw = interpolate(t, [0.3, 3.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`, overflow: 'hidden'}}>
      {blob(-120, -80, 560, AMBER, 0.5, 0, 0.18)}
      {blob(620, 260, 520, RED, 0.4, 2, 0.1)}
      {blob(120, 620, 480, '#FF7FA0', 0.6, 4, 0.14)}
      {ICONS.map((ic, i) => {
        const speed = 38 + (i % 4) * 12;
        const x = (i * 97 + 40) % 1000;
        const y = 1000 - ((t * speed + i * 160) % 1100);
        const rot = Math.sin(t * 1.2 + i) * 18;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, fontSize: 40 + (i % 3) * 16, color: RED,
            opacity: 0.16, transform: `rotate(${rot}deg)`, fontFamily: DISPLAY}}>{ic}</div>
        );
      })}
      <svg width={1080} height={420} style={{position: 'absolute', top: 40, left: 0}} viewBox="0 0 1080 420">
        <path d="M 40 360 C 260 60, 820 60, 1040 300" fill="none" stroke={RED} strokeOpacity={0.35} strokeWidth={6}
          strokeDasharray="18 16" strokeDashoffset={0}
          style={{clipPath: `inset(0 ${(1 - draw) * 100}% 0 0)`}} />
      </svg>
          </AbsoluteFill>
  );
};

// ---------- Header ----------
const Header: React.FC = () => {
  const t = useT();
  const bounce = usePop(0.56, 8);
  const s = t < 0.56 ? 1 : interpolate(bounce, [0, 1], [1.2, 1]);
  const floatY = Math.sin(t * 2) * 5;
  return (
    <div style={{position: 'absolute', top: 96 + floatY, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
      <Img src={staticFile('logo.png')} style={{width: 270, transform: `scale(${s}) rotate(${Math.sin(t * 1.5) * 1.5}deg)`, borderRadius: 20,
        boxShadow: '0 10px 30px rgba(236,2,2,0.25)'}} />
      <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 70, color: INK, lineHeight: 1, marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 18}}>
        Gifts across
        <span style={{fontFamily: SCRIPT, fontWeight: 400, fontSize: 112, color: RED, lineHeight: 0.8}}>borders</span>
      </div>
    </div>
  );
};

// ---------- Cards ----------
const CardShell: React.FC<{start: number; end: number; children: React.ReactNode}> = ({start, end, children}) => {
  const t = useT();
  const inP = usePop(start);
  const outP = usePop(end - 0.2, 16);
  if (t < start || t >= end) return null;
  const y = interpolate(inP, [0, 1], [-70, 0]) + interpolate(outP, [0, 1], [0, 40]);
  const sc = interpolate(inP, [0, 1], [0.88, 1]) * interpolate(outP, [0, 1], [1, 0.92]);
  const op = Math.min(1, inP * 1.5) * interpolate(outP, [0, 1], [1, 0]);
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 430, height: 330, background: '#fff', borderRadius: 34, border: `5px solid ${RED}`,
      boxShadow: '0 18px 40px rgba(120,20,10,0.18)', transform: `translateY(${y}px) scale(${sc}) rotate(${interpolate(inP, [0, 1], [-2, 0])}deg)`, opacity: op, overflow: 'hidden'}}>
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

const RouteCard: React.FC = () => {
  const t = useT();
  const prog = interpolate(t, [0.6, 3.3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  return (
    <CardShell start={0.15} end={SEG[1]}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 26}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
          <Flag f="🇮🇩" label="Indonesia" />
          <div style={{position: 'relative', width: 120, height: 8, background: '#F3D5D0', borderRadius: 4}}>
            <div style={{width: `${prog * 100}%`, height: 8, background: RED, borderRadius: 4}} />
            <div style={{position: 'absolute', top: -34 - Math.abs(Math.sin(t * 8)) * 8, left: prog * 120 - 30, fontFamily: EMOJI, fontSize: 52}}>🎁</div>
          </div>
          <Flag f="🇮🇳" label="India" on={t > 3.33} />
        </div>
        <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 34, color: '#6B605D'}}>Pay in Rupiah · Bought locally in India</div>
      </div>
    </CardShell>
  );
};

const Bubble: React.FC<{text: string; at: number}> = ({text, at}) => {
  const t = useT();
  const p = usePop(at, 14);
  if (t < at) return null;
  return (
    <div style={{alignSelf: 'flex-end', maxWidth: 700, background: '#E9E3E2', color: INK, borderRadius: 28, borderBottomRightRadius: 8,
      padding: '12px 26px', fontFamily: BODY, fontWeight: 500, fontSize: 38, transform: `scale(${interpolate(p, [0, 1], [0.7, 1])})`, transformOrigin: 'right bottom'}}>
      {text}
    </div>
  );
};

const ParagraphsCard: React.FC = () => {
  const t = useT();
  const stamp = usePop(8.04, 9);
  return (
    <CardShell start={4.7} end={SEG[2]}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 12, padding: '18px 32px'}}>
        <Bubble at={5.3} text="I miss you so much 🥺" />
        <Bubble at={6.2} text="like SO much. let me explain why…" />
        <Bubble at={7.1} text="(paragraph 3 of 47)" />
      </div>
      {t >= 8.04 && (
        <div style={{position: 'absolute', left: 90, bottom: 26, transform: `rotate(-6deg) scale(${interpolate(stamp, [0, 1], [1.6, 1])})`,
          border: `6px solid ${RED}`, color: RED, borderRadius: 18, padding: '2px 22px', fontFamily: DISPLAY, fontWeight: 800, fontSize: 48, background: 'rgba(255,255,255,0.92)'}}>
          47 paragraphs? Send a gift.
        </div>
      )}
    </CardShell>
  );
};

const ProductCard: React.FC<{start: number; end: number; emoji: string; name: string; tag: string}> = ({start, end, emoji, name, tag}) => {
  const t = useT();
  return (
    <CardShell start={start} end={end}>
      <div style={{display: 'flex', alignItems: 'center', height: '100%', gap: 36, padding: '0 46px'}}>
        <div style={{width: 190, height: 190, borderRadius: 30, background: '#FFF1EE', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: EMOJI, fontSize: 120, transform: `rotate(${Math.sin(t * 3) * 6}deg)`}}>{emoji}</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start'}}>
          <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 54, color: INK, lineHeight: 1.05}}>{name}</div>
          <div style={{background: RED, color: '#fff', borderRadius: 14, padding: '4px 20px 8px', fontFamily: DISPLAY, fontWeight: 800, fontSize: 42}}>{tag}</div>
        </div>
      </div>
    </CardShell>
  );
};

const BetweenCard: React.FC = () => {
  const t = useT();
  return (
    <CardShell start={15.6} end={VIDEO_END}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 22}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
          <Flag f="🇮🇳" label="India" on={t >= 19.73} />
          <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 70, color: RED, transform: `scale(${1 + Math.sin(t * 6) * 0.08})`}}>⇄</div>
          <Flag f="🇮🇩" label="Indonesia" on={t >= 20.4} />
        </div>
        <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 34, color: '#6B605D'}}>Door to door, across borders</div>
      </div>
    </CardShell>
  );
};

const EndCard: React.FC = () => {
  const t = useT();
  const p = usePop(VIDEO_END, 11);
  if (t < VIDEO_END) return null;
  const pulse = 1 + Math.sin((t - VIDEO_END) * 7) * 0.03;
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 430, height: 330, background: RED, borderRadius: 34,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
      transform: `scale(${interpolate(p, [0, 1], [0.85, 1]) * pulse})`, boxShadow: '0 18px 40px rgba(120,20,10,0.25)'}}>
      <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 84, color: '#fff', lineHeight: 1}}>
        Comment <span style={{background: '#fff', color: RED, borderRadius: 18, padding: '0 22px'}}>GIFT</span>
      </div>
      <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 38, color: '#fff', opacity: 0.92}}>aiidell.com</div>
    </div>
  );
};

// ---------- Subtitles: phrase on screen, active word yellow, key words orange ----------
const PHRASES: {start: number; words: (W & {i: number})[]}[] = (() => {
  const out: {start: number; words: (W & {i: number})[]}[] = [];
  let i = 0;
  for (const n of PHRASE_LENGTHS) {
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
  const nextStart = pi + 1 < PHRASES.length ? PHRASES[pi + 1].start : WORD_END;
  if (t >= Math.min(nextStart, lastWord.t + 1.1)) return null;
  const inP = spring({frame: frame - Math.round(ph.start * fps), fps, config: {damping: 12, mass: 0.5}, durationInFrames: 6});
  return (
    <div style={{position: 'absolute', top: 1625, left: 60, right: 60, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', columnGap: 0, rowGap: 0,
      transform: `translateY(${interpolate(inP, [0, 1], [24, 0])}px) scale(${interpolate(inP, [0, 1], [0.85, 1])})`, opacity: inP}}>
      {ph.words.map((w) => {
        const active = t >= w.t && (w.i + 1 >= WORDS.length || t < WORDS[w.i + 1].t);
        const spoken = t >= w.t;
        const color = w.key ? CAP_ORANGE : active ? CAP_YELLOW : CAP_WHITE;
        const wp = spring({frame: frame - Math.round(w.t * fps), fps, config: {damping: 10, mass: 0.4}, durationInFrames: 5});
        const sc = active ? interpolate(wp, [0, 1], [1, 1.1]) : 1;
        return (
          <span key={w.i} style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: ph.words.length === 1 ? 118 : 92, lineHeight: 1.1, color,
            opacity: spoken ? 1 : 0.55, transform: `scale(${sc})`, display: 'inline-block', margin: '0 26px',
            WebkitTextStroke: '9px #120B0A', paintOrder: 'stroke fill', textShadow: '0 6px 14px rgba(0,0,0,0.45)'}}>
            {w.w}
          </span>
        );
      })}
    </div>
  );
};

// ---------- Speaker panel with B-roll cutaways ----------
const BRollLayer: React.FC = () => {
  const t = useT();
  const b = BROLL.find((x) => t >= x.start && t < x.end);
  if (!b) return null;
  const local = t - b.start;
  const dur = b.end - b.start;
  // whip-in: slide + blur for 5 frames, then slow push-in
  const whip = interpolate(local, [0, 0.17], [1, 0], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const push = interpolate(local, [0, dur], [1.04, 1.16]);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <Img src={staticFile(b.src)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${b.fx}% ${b.fy}%`,
        transform: `translateX(${whip * 300}px) scale(${push + whip * 0.2})`, filter: `blur(${whip * 14}px)`}} />
      {/* soft vignette so subtitles stay readable */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.35) 100%)'}} />
      {/* white flash on the cut */}
      <AbsoluteFill style={{background: '#fff', opacity: interpolate(local, [0, 0.1], [0.5, 0], {extrapolateRight: 'clamp'})}} />
    </AbsoluteFill>
  );
};

const Panel: React.FC = () => {
  const t = useT();
  // alternate framing per segment; punch in on "now we are talking"
  let zoom = 1;
  if (t >= SEG[1] && t < SEG[2]) zoom = 1.1;
  if (t >= 14.4 && t < SEG[3]) zoom = 1.15;
  if (t >= SEG[3]) zoom = 1.05;
  const video = <OffthreadVideo muted src={staticFile('panel.mp4')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />;
  const enter = usePop(0, 14);
  return (
    <div style={{position: 'absolute', left: 36, right: 36, top: 900, height: 1100, borderRadius: 48, overflow: 'hidden',
      boxShadow: '0 -10px 40px rgba(120,20,10,0.18)', background: '#000', border: '6px solid #fff',
      transform: `translateY(${interpolate(enter, [0, 1], [120, 0])}px)`}}>
      <div style={{width: '100%', height: '100%', transform: `scale(${zoom})`, transformOrigin: '50% 30%'}}>
        {t < FREEZE_AT ? video : <Freeze frame={Math.round(FREEZE_AT * FPS)}>{video}</Freeze>}
      </div>
      <BRollLayer />
    </div>
  );
};

export const AiiDell01: React.FC = () => (
  <AbsoluteFill>
    <AnimatedBackground />
    <Header />
    <RouteCard />
    <ParagraphsCard />
    <ProductCard start={10.8} end={12.42} emoji="🌹" name="Roses & Chocolates Combo" tag="Rp 210.000" />
    <ProductCard start={12.42} end={13.72} emoji="🎂" name="Cakes & bakes" tag="Delivered in India" />
    <ProductCard start={13.72} end={15.6} emoji="🎁" name="Hampers & combos" tag="94+ to pick from" />
    <BetweenCard />
    <EndCard />
    <Panel />
    <Subtitles />
    <Audio src={staticFile('panel.mp4')} />
    {POPS.map((p) => (
      <Sequence key={p} from={Math.round(p * FPS)} durationInFrames={6}>
        <Audio src={staticFile('pop.wav')} volume={0.8} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
