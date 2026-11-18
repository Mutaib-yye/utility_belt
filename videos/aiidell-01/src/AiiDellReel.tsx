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
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import tl from './reel-timeline.json';

// ===== Fresh edit: red-themed, Gen Z creator reel =====
export const FPS = 30;
const VOICE_END = tl.duration;
const END_CARD = 2.3;
export const REEL_SECONDS = VOICE_END + END_CARD;

const C = {
  red: '#E5121F',
  redHot: '#FF2D3D',
  crimson: '#8E0B16',
  wine: '#3A0409',
  ink: '#120607',
  cream: '#FFF6F2',
  white: '#FFFFFF',
};

type W = {t: number; w: string; key?: boolean};
const WORDS: W[] = tl.words;
const at = (w: string, nth = 0) => WORDS.filter((x) => x.w.replace(/[^\w]/g, '').toLowerCase() === w.toLowerCase())[nth].t;
const seg = (name: string) => tl.segments.find((s) => s.name === name)!;

const T = {
  someone: at('someone'),
  besides: at('besides'),
  n47: at('47'),
  paragraphs: at('paragraphs'),
  freeze: seg('freeze47').start,
  unfreeze: seg('freeze47').start + seg('freeze47').dur,
  flowersSeg: seg('flowers').start,
  flowers: at('Flowers'),
  cake: at('Cake'),
  hampers: at('Hampers'),
  now: at('now'),
  andhere: seg('andhere').start,
  interesting: at('interesting'),
  you2: at('you', 3),
  india: at('India'),
  indonesia: at('Indonesia'),
  meetSeg: seg('meet').start,
  aiidell: at('AiiDell'),
  intl: at('international'),
  update: at('update'),
};
const SLIDE1 = {start: T.flowersSeg - 0.05, end: T.now};
const SLIDE2 = {start: T.you2 - 0.08, end: T.meetSeg};

// ---------- fonts ----------
const fontHandle = delayRender('fonts');
Promise.all(
  [
    ['Poppins', 'fonts/Poppins-wght-800.ttf', '800'],
    ['Poppins', 'fonts/Poppins-wght-600.ttf', '600'],
    ['Playfair', 'fonts/Playfair-Display-ital-wght-1-700.ttf', '700'],
  ].map(async ([family, file, weight]) => {
    const f = new FontFace(family, `url('${staticFile(file)}')`, {weight, style: family === 'Playfair' ? 'italic' : 'normal'});
    await f.load();
    document.fonts.add(f);
  }),
).then(() => continueRender(fontHandle));
const SANS = "'Poppins', sans-serif";
const SERIF = "'Playfair', serif";
const EMOJI = "'Noto Color Emoji'";

// ---------- helpers ----------
const useT = () => useCurrentFrame() / FPS;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const useSpringAt = (t0: number, damping = 13, mass = 0.6) => {
  const f = useCurrentFrame();
  return spring({frame: f - Math.round(t0 * FPS), fps: FPS, config: {damping, mass}});
};
const win = (t: number, a: number, b: number, fade = 0.2) =>
  Math.min(interpolate(t, [a, a + fade], [0, 1], clamp), interpolate(t, [b - fade, b], [1, 0], clamp));

// ---------- background: classy deep red with slow light + grain ----------
const Backdrop: React.FC = () => {
  const t = useT();
  const gx = 50 + Math.sin(t * 0.35) * 22;
  const gy = 30 + Math.cos(t * 0.27) * 12;
  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 70% at ${gx}% ${gy}%, ${C.crimson} 0%, ${C.wine} 55%, #1A0204 100%)`}}>
      {/* soft diagonal light sweep */}
      <AbsoluteFill style={{background: `linear-gradient(115deg, rgba(255,60,70,0) ${20 + (t * 6) % 120}%, rgba(255,80,90,0.10) ${30 + (t * 6) % 120}%, rgba(255,60,70,0) ${42 + (t * 6) % 120}%)`}} />
      {/* thin accent lines */}
      <div style={{position: 'absolute', left: 60, right: 60, top: 270, height: 2, background: 'linear-gradient(90deg, rgba(255,45,61,0), rgba(255,45,61,0.55), rgba(255,45,61,0))'}} />
      <div style={{position: 'absolute', left: 60, right: 60, top: 1650, height: 2, background: 'linear-gradient(90deg, rgba(255,45,61,0), rgba(255,45,61,0.45), rgba(255,45,61,0))'}} />
    </AbsoluteFill>
  );
};

const Grain: React.FC<{o?: number}> = ({o = 0.06}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: o, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width="1080" height="1920">
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 9} /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="1080" height="1920" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

// ---------- the talking video ----------
const voiceVideo = (style: React.CSSProperties) => <OffthreadVideo muted src={staticFile('reel/voice.mp4')} style={style} />;

const cameraZoom = (t: number) => {
  // gentle push on the hook, jump-cut punch-ins, comedic snap on "now we are talking"
  let z = interpolate(t, [0, T.freeze], [1.0, 1.07], clamp);
  if (t >= T.freeze && t < T.unfreeze) z = interpolate(t, [T.freeze, T.freeze + 0.12], [1.07, 1.28], {...clamp, easing: Easing.out(Easing.cubic)});
  if (t >= T.unfreeze && t < SLIDE1.start) z = 1.0;
  if (t >= T.now && t < T.andhere) z = interpolate(t, [T.now, T.now + 0.1], [1.0, 1.32], {...clamp, easing: Easing.out(Easing.back(2))});
  if (t >= T.andhere && t < seg('interesting').start) z = 1.08;
  if (t >= seg('interesting').start && t < SLIDE2.start) z = interpolate(t, [T.interesting, T.interesting + 1.0], [1.0, 1.1], {...clamp, easing: Easing.inOut(Easing.quad)});
  if (t >= T.meetSeg) z = interpolate(t, [T.meetSeg, VOICE_END], [1.04, 1.0], clamp);
  return z;
};

const MainVideo: React.FC = () => {
  const t = useT();
  const z = cameraZoom(t);
  const shake = (t >= T.now && t < T.now + 0.35) || (t >= T.freeze && t < T.freeze + 0.25) ? Math.sin(t * 90) * 7 : 0;
  const isFreeze = t >= T.freeze && t < T.unfreeze;
  const drift = Math.sin(t * 0.9) * 2;
  const endFrame = Math.round(VOICE_END * FPS) - 2;
  const v = voiceVideo({width: '100%', height: '100%', objectFit: 'cover'});
  return (
    <div style={{position: 'absolute', left: 24, right: 24, top: 300, height: 1330, borderRadius: 40, overflow: 'hidden',
      boxShadow: '0 30px 80px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,45,61,0.35)', background: '#000'}}>
      <div style={{width: '100%', height: '100%', transform: `scale(${z}) translate(${shake}px, ${drift}px)`, transformOrigin: '50% 38%',
        filter: isFreeze ? 'saturate(0.35) contrast(1.15)' : 'saturate(1.05) contrast(1.03)'}}>
        {t * FPS < endFrame ? v : <Freeze frame={endFrame}>{v}</Freeze>}
      </div>
      {/* red tint on the freeze frame */}
      {isFreeze && <AbsoluteFill style={{background: C.red, mixBlendMode: 'multiply', opacity: 0.55}} />}
      {/* soft red vignette pulse on the comedic punch-in */}
      <AbsoluteFill style={{boxShadow: `inset 0 0 160px rgba(229,18,31,${interpolate(t, [T.now, T.now + 0.15, T.now + 0.8], [0, 0.85, 0], clamp)})`}} />
    </div>
  );
};

// ---------- red wipe transition ----------
const RedWipe: React.FC<{at: number}> = ({at: a}) => {
  const t = useT();
  const p = interpolate(t, [a - 0.2, a + 0.22], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  if (p <= 0 || p >= 1) return null;
  const x = interpolate(p, [0, 1], [-1400, 1400]);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top: -300, bottom: -300, width: 900, left: x, transform: 'skewX(-14deg)',
        background: `linear-gradient(90deg, ${C.crimson}, ${C.red} 45%, ${C.redHot} 55%, ${C.crimson})`, boxShadow: '0 0 80px rgba(255,45,61,0.6)'}} />
    </AbsoluteFill>
  );
};

// ---------- small reusable pieces ----------
const PhotoCard: React.FC<{src: string; w: number; h: number; style?: React.CSSProperties}> = ({src, w, h, style}) => (
  <div style={{width: w, background: C.white, padding: 12, borderRadius: 18, boxShadow: '0 24px 50px rgba(0,0,0,0.45)', ...style}}>
    <Img src={staticFile(src)} style={{width: w - 24, height: h, objectFit: 'cover', borderRadius: 10, display: 'block'}} />
  </div>
);

const Sticker: React.FC<{emoji: string; t0: number; t1: number; x: number; y: number; size?: number; rot?: number}> = ({emoji, t0, t1, x, y, size = 150, rot = -8}) => {
  const t = useT();
  const s = useSpringAt(t0, 8, 0.5);
  if (t < t0 || t >= t1) return null;
  const out = interpolate(t, [t1 - 0.15, t1], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: x, top: y, fontFamily: EMOJI, fontSize: size, transform: `scale(${s * out}) rotate(${rot + Math.sin(t * 6) * 4}deg)`,
      filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.45))'}}>{emoji}</div>
  );
};

const PiP: React.FC<{x: number; y: number; size?: number; t0: number; t1: number}> = ({x, y, size = 330, t0, t1}) => {
  const t = useT();
  const s = useSpringAt(t0 + 0.1, 12);
  if (t < t0 || t >= t1) return null;
  const out = interpolate(t, [t1 - 0.12, t1], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size, overflow: 'hidden', border: `7px solid ${C.white}`,
      boxShadow: `0 0 0 5px ${C.red}, 0 20px 50px rgba(0,0,0,0.5)`, transform: `scale(${s * out})`}}>
      {voiceVideo({width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%', transform: 'scale(1.35)'})}
    </div>
  );
};

// ---------- hook + bold text overlays (top strip) ----------
const TopLine: React.FC<{t0: number; t1: number; children: React.ReactNode; y?: number}> = ({t0, t1, children, y = 92}) => {
  const t = useT();
  const s = useSpringAt(t0, 14);
  if (t < t0 || t >= t1) return null;
  const o = interpolate(t, [t1 - 0.15, t1], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', top: y, left: 40, right: 40, textAlign: 'center', opacity: s * o, transform: `translateY(${(1 - s) * -30}px)`,
      fontFamily: `${SANS}, ${EMOJI}`, fontWeight: 800, fontSize: 64, lineHeight: 1.12, color: C.white, letterSpacing: -0.5, textShadow: '0 6px 20px rgba(0,0,0,0.5)'}}>
      {children}
    </div>
  );
};
const Ser: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = C.redHot}) => (
  <span style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, color, fontSize: '1.08em', letterSpacing: 0}}>{children}</span>
);

// ---------- chat bubble + "novel" joke around the freeze ----------
const ChatJoke: React.FC = () => {
  const t = useT();
  const s = useSpringAt(T.paragraphs - 0.1, 14);
  if (t < T.paragraphs - 0.1 || t >= T.unfreeze + 0.05) return null;
  const typed = interpolate(t, [T.paragraphs, T.freeze], [0.15, 1], clamp);
  const text = 'okay so i know it’s 2am but i just need to tell you how much i miss you and honestly today was so long and i kept thinking about the time we';
  const shown = text.slice(0, Math.floor(text.length * typed));
  const out = interpolate(t, [T.unfreeze - 0.1, T.unfreeze + 0.05], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 1080, opacity: out, transform: `translateY(${(1 - s) * 120}px)`}}>
      <div style={{background: C.white, borderRadius: 34, borderBottomRightRadius: 8, padding: '26px 30px', boxShadow: '0 20px 50px rgba(0,0,0,0.45)',
        fontFamily: SANS, fontWeight: 600, fontSize: 34, lineHeight: 1.3, color: C.ink}}>
        {shown}<span style={{opacity: Math.sin(t * 14) > 0 ? 1 : 0}}>|</span>
        <div style={{marginTop: 10, fontSize: 24, color: '#8a7b78', textAlign: 'right'}}>paragraph 3 of 47 · read 2:47 am</div>
      </div>
    </div>
  );
};

const FreezeText: React.FC = () => {
  const t = useT();
  const s = useSpringAt(T.freeze + 0.05, 9, 0.5);
  if (t < T.freeze || t >= T.unfreeze) return null;
  return (
    <div style={{position: 'absolute', top: 470, left: 0, right: 0, textAlign: 'center', transform: `scale(${interpolate(s, [0, 1], [1.6, 1])}) rotate(-3deg)`, opacity: s}}>
      <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 84, color: C.white, lineHeight: 1, textShadow: '0 8px 24px rgba(0,0,0,0.6)'}}>that's not a text.</div>
      <div style={{fontFamily: `${SERIF}, ${EMOJI}`, fontStyle: 'italic', fontWeight: 700, fontSize: 100, color: C.white, marginTop: 8,
        textShadow: '0 8px 24px rgba(0,0,0,0.6)'}}>that's a <span style={{background: C.red, padding: '0 18px', borderRadius: 16}}>novel</span> 😭</div>
    </div>
  );
};

// ---------- SLIDE 1: the checklist ----------
const CheckCard: React.FC<{src: string; label: string; tag: string; t0: number; y: number; rot: number}> = ({src, label, tag, t0, y, rot}) => {
  const t = useT();
  const s = useSpringAt(t0, 12, 0.6);
  const tick = useSpringAt(t0 + 0.25, 10);
  if (t < t0) return null;
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: y, height: 300, display: 'flex', alignItems: 'center', gap: 34,
      transform: `translateX(${(1 - s) * -700}px) rotate(${rot}deg)`, opacity: Math.min(1, s * 1.6)}}>
      {/* speed-ramp feel: photo zooms in fast then settles */}
      <div style={{width: 300, height: 300, borderRadius: 26, overflow: 'hidden', border: `6px solid ${C.white}`, boxShadow: '0 20px 45px rgba(0,0,0,0.5)', flex: 'none'}}>
        <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${interpolate(s, [0, 1], [1.5, 1.04])})`}} />
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 78, color: C.white, lineHeight: 1}}>{label}</div>
          <div style={{width: 64, height: 64, borderRadius: 64, background: C.white, color: C.red, fontFamily: SANS, fontWeight: 800, fontSize: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${tick})`}}>✓</div>
        </div>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 52, color: '#FFC9CD'}}>{tag}</div>
      </div>
    </div>
  );
};

const SlideChecklist: React.FC = () => {
  const t = useT();
  if (t < SLIDE1.start || t >= SLIDE1.end) return null;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(90% 60% at 50% 20%, ${C.red} 0%, ${C.crimson} 60%, ${C.wine} 100%)`}} />
      <div style={{position: 'absolute', top: 120, left: 60, right: 60, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 60, color: C.white, lineHeight: 1.15}}>
        things that actually say<br /><Ser color="#FFD9DC">"i miss you"</Ser>
      </div>
      <CheckCard src="reel/img/tulips.jpg" label="flowers" tag="obviously." t0={T.flowers} y={400} rot={-1.5} />
      <CheckCard src="reel/img/cake.jpg" label="cake" tag="always." t0={T.cake} y={740} rot={1.2} />
      <CheckCard src="reel/img/giftbox.jpg" label="hampers" tag="wait, what?" t0={T.hampers} y={1080} rot={-1} />
      <PiP x={690} y={1430} t0={SLIDE1.start} t1={SLIDE1.end} />
    </AbsoluteFill>
  );
};

// ---------- SLIDE 2: India <-> Indonesia route ----------
const SlideRoute: React.FC = () => {
  const t = useT();
  const indiaIn = SLIDE2.start + 0.15;
  const sIn = useSpringAt(indiaIn, 12);
  const sId = useSpringAt(T.indonesia, 12);
  if (t < SLIDE2.start || t >= SLIDE2.end) return null;
  const draw = interpolate(t, [T.india, T.indonesia + 0.5], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  // plane along a quadratic curve from India card to Indonesia card
  const P0 = [330, 760], P1 = [900, 760], P2 = [700, 1190];
  const q = (a: number, b: number, c: number, u: number) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * b + u * u * c;
  const px = q(P0[0], P1[0], P2[0], draw), py = q(P0[1], P1[1], P2[1], draw);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(90% 60% at 50% 25%, ${C.red} 0%, ${C.crimson} 60%, ${C.wine} 100%)`}} />
      <div style={{position: 'absolute', top: 130, left: 60, right: 60, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 64, color: C.white, lineHeight: 1.15}}>
        send it <Ser color="#FFD9DC">across borders</Ser>
      </div>
      <svg width="1080" height="1920" style={{position: 'absolute', inset: 0}}>
        <path d={`M ${P0[0]} ${P0[1]} Q ${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={6}
          strokeDasharray="20 16" style={{clipPath: `inset(0 ${(1 - draw) * 100}% 0 0)`}} />
      </svg>
      {t >= indiaIn && (
        <div style={{position: 'absolute', left: 70, top: 360, transform: `scale(${sIn}) rotate(-5deg)`}}>
          <PhotoCard src="reel/img/delhi.jpg" w={460} h={360} />
          <div style={{marginTop: 14, textAlign: 'center', fontFamily: `${SANS}, ${EMOJI}`, fontWeight: 800, fontSize: 50, color: C.white}}>🇮🇳 India</div>
        </div>
      )}
      {t >= T.indonesia && (
        <div style={{position: 'absolute', left: 520, top: 860, transform: `scale(${sId}) rotate(4deg)`}}>
          <PhotoCard src="reel/img/indonesia.jpg" w={480} h={360} />
          <div style={{marginTop: 14, textAlign: 'center', fontFamily: `${SANS}, ${EMOJI}`, fontWeight: 800, fontSize: 50, color: C.white}}>🇮🇩 Indonesia</div>
        </div>
      )}
      {draw > 0 && draw < 1 && <div style={{position: 'absolute', left: px - 40, top: py - 40, fontFamily: EMOJI, fontSize: 80, transform: 'rotate(20deg)'}}>✈️</div>}
      <PiP x={60} y={1330} size={300} t0={SLIDE2.start} t1={SLIDE2.end} />
    </AbsoluteFill>
  );
};

// ---------- "Meet AiiDell" logo reveal + software-update joke ----------
const LogoReveal: React.FC = () => {
  const t = useT();
  const s = useSpringAt(T.aiidell - 0.05, 9, 0.6);
  if (t < T.aiidell - 0.05 || t >= VOICE_END) return null;
  const glow = interpolate(t, [T.aiidell, T.aiidell + 0.6], [1, 0.25], clamp);
  return (
    <div style={{position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{transform: `scale(${interpolate(s, [0, 1], [0.4, 1])})`, opacity: Math.min(1, s * 2), borderRadius: 28,
        boxShadow: `0 0 ${80 * glow}px ${30 * glow}px rgba(255,45,61,${0.7 * glow}), 0 16px 40px rgba(0,0,0,0.5)`, border: `5px solid ${C.white}`}}>
        <Img src={staticFile('logo.png')} style={{width: 400, display: 'block', borderRadius: 22}} />
      </div>
    </div>
  );
};

const UpdateNotification: React.FC = () => {
  const t = useT();
  const t0 = T.intl - 0.1;
  const s = useSpringAt(t0, 14);
  if (t < t0 || t >= VOICE_END + 0.1) return null;
  return (
    <div style={{position: 'absolute', top: 350, left: 60, right: 60, transform: `translateY(${(1 - s) * -260}px)`, opacity: s}}>
      <div style={{background: 'rgba(255,248,246,0.94)', borderRadius: 36, padding: '24px 28px', display: 'flex', gap: 22, alignItems: 'center',
        boxShadow: '0 24px 60px rgba(0,0,0,0.45)'}}>
        <Img src={staticFile('logo.png')} style={{width: 110, height: 110, objectFit: 'cover', borderRadius: 26}} />
        <div style={{flex: 1, minWidth: 0}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: SANS, fontWeight: 600, fontSize: 26, color: '#7d6f6c'}}>
            <span>SOFTWARE UPDATE</span><span>now</span>
          </div>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 36, color: C.ink, marginTop: 2}}>Gifting Plans 2.0 is here</div>
          <div style={{fontFamily: `${SANS}, ${EMOJI}`, fontWeight: 600, fontSize: 28, color: '#3b3130'}}>Now works between 🇮🇳 India ⇄ 🇮🇩 Indonesia</div>
        </div>
      </div>
    </div>
  );
};

// ---------- end card ----------
const EndCard: React.FC = () => {
  const t = useT();
  const s = useSpringAt(VOICE_END + 0.05, 12);
  const s2 = useSpringAt(VOICE_END + 0.35, 14);
  if (t < VOICE_END) return null;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(90% 60% at 50% 40%, ${C.red} 0%, ${C.crimson} 60%, ${C.wine} 100%)`}} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 40}}>
        <div style={{transform: `scale(${interpolate(s, [0, 1], [0.6, 1])})`, opacity: s, borderRadius: 30, border: `6px solid ${C.white}`, boxShadow: '0 20px 60px rgba(0,0,0,0.45)'}}>
          <Img src={staticFile('logo.png')} style={{width: 560, display: 'block', borderRadius: 24}} />
        </div>
        <div style={{opacity: s2, transform: `translateY(${(1 - s2) * 30}px)`, textAlign: 'center'}}>
          <div style={{fontFamily: `${SERIF}, ${EMOJI}`, fontStyle: 'italic', fontWeight: 700, fontSize: 84, color: C.white, lineHeight: 1.1}}>send love,<br />not paragraphs 💌</div>
          <div style={{marginTop: 34, fontFamily: SANS, fontWeight: 800, fontSize: 52, color: C.white, letterSpacing: 1}}>aiidell.com</div>
          <div style={{marginTop: 8, fontFamily: SANS, fontWeight: 600, fontSize: 36, color: '#FFC9CD'}}>@jastipindiaaiidell</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- subtitles: karaoke phrases, red highlights, moving placement ----------
const PHRASE_LENGTHS = [3, 3, 2, 3, 3, 3, 1, 1, 1, 1, 1, 4, 3, 2, 3, 2, 2, 1, 2, 3, 3, 2];
const PHRASES = (() => {
  const out: {start: number; words: (W & {i: number})[]}[] = [];
  let i = 0;
  for (const n of PHRASE_LENGTHS) {
    if (i >= WORDS.length) break;
    const ws = WORDS.slice(i, i + n).map((w, k) => ({...w, i: i + k}));
    out.push({start: ws[0].t, words: ws});
    i += n;
  }
  return out;
})();

const subtitlePlace = (t: number): {top: number; size: number} => {
  if (t >= SLIDE1.start && t < SLIDE1.end) return {top: 1440, size: 66};   // under the checklist, left of the bubble
  if (t >= SLIDE2.start && t < SLIDE2.end) return {top: 1720, size: 70};   // below the route slide
  if (t >= T.besides && t < T.unfreeze) return {top: 360, size: 78};       // jumps to the top for the 47 joke
  if (t >= T.meetSeg) return {top: 1420, size: 78};
  return {top: 1360, size: 80};
};

const Subtitles: React.FC = () => {
  const t = useT();
  const f = useCurrentFrame();
  let pi = -1;
  for (let k = 0; k < PHRASES.length; k++) if (PHRASES[k].start <= t) pi = k;
  if (pi < 0 || t >= VOICE_END) return null;
  if (t >= T.freeze && t < T.unfreeze) return null; // the freeze has its own text
  const ph = PHRASES[pi];
  const last = ph.words[ph.words.length - 1];
  const next = pi + 1 < PHRASES.length ? PHRASES[pi + 1].start : VOICE_END;
  if (t >= Math.min(next, last.t + 1.1)) return null;
  const inP = spring({frame: f - Math.round(ph.start * FPS), fps: FPS, config: {damping: 13, mass: 0.45}, durationInFrames: 7});
  const place = subtitlePlace(t);
  const inSlide1 = t >= SLIDE1.start && t < SLIDE1.end;
  return (
    <div style={{position: 'absolute', top: place.top, left: inSlide1 ? 50 : 40, right: inSlide1 ? 420 : 40, display: 'flex', flexWrap: 'wrap',
      justifyContent: inSlide1 ? 'flex-start' : 'center', rowGap: 6, transform: `translateY(${(1 - inP) * 26}px) scale(${interpolate(inP, [0, 1], [0.9, 1])})`, opacity: inP}}>
      {ph.words.map((w) => {
        const active = t >= w.t && (w.i + 1 >= WORDS.length || t < WORDS[w.i + 1].t);
        const spoken = t >= w.t;
        const wp = spring({frame: f - Math.round(w.t * FPS), fps: FPS, config: {damping: 10, mass: 0.35}, durationInFrames: 5});
        const base: React.CSSProperties = {fontFamily: SANS, fontWeight: 800, fontSize: place.size, lineHeight: 1.12, margin: '0 13px', display: 'inline-block',
          transform: `scale(${active ? interpolate(wp, [0, 1], [1, 1.08]) : 1})`, opacity: spoken ? 1 : 0.45};
        if (w.key) {
          return (
            <span key={w.i} style={{...base, color: C.white, background: spoken ? C.red : 'rgba(229,18,31,0.35)', borderRadius: 16, padding: '0 16px 4px',
              boxShadow: spoken ? '0 8px 22px rgba(229,18,31,0.45)' : 'none'}}>{w.w}</span>
          );
        }
        return (
          <span key={w.i} style={{...base, color: C.white, WebkitTextStroke: '8px rgba(18,6,7,0.92)', paintOrder: 'stroke fill', textShadow: '0 6px 16px rgba(0,0,0,0.45)'}}>{w.w}</span>
        );
      })}
    </div>
  );
};

// ---------- audio: voice, soft music (ducked on the freeze), sound design ----------
const musicVol = (f: number) => {
  const t = f / FPS;
  const fadeIn = interpolate(t, [0, 0.4], [0, 1], clamp);
  const stop = t >= T.freeze && t < T.unfreeze ? 0 : 1; // record-scratch music stop
  const base = interpolate(t, [VOICE_END - 0.2, VOICE_END + 0.3], [0.11, 0.38], clamp);
  const fadeOut = interpolate(t, [REEL_SECONDS - 1.0, REEL_SECONDS], [1, 0], clamp);
  return fadeIn * stop * base * fadeOut;
};
const SFX: {at: number; s: string; v: number}[] = [
  {at: 0.05, s: 'pop', v: 0.35},
  {at: T.someone - 0.1, s: 'whoosh', v: 0.3},
  {at: T.paragraphs - 0.05, s: 'typing', v: 0.35},
  {at: T.n47, s: 'pop', v: 0.4},
  {at: T.freeze, s: 'scratch', v: 0.55},
  {at: SLIDE1.start - 0.22, s: 'whoosh', v: 0.45},
  {at: T.flowers, s: 'pop', v: 0.4},
  {at: T.cake, s: 'pop', v: 0.4},
  {at: T.hampers, s: 'pop', v: 0.4},
  {at: T.now, s: 'boom', v: 0.55},
  {at: T.interesting - 0.55, s: 'riser', v: 0.3},
  {at: SLIDE2.start - 0.22, s: 'whoosh', v: 0.45},
  {at: SLIDE2.start + 0.15, s: 'pop', v: 0.4},
  {at: T.india, s: 'shutter', v: 0.3},
  {at: T.indonesia, s: 'pop', v: 0.4},
  {at: SLIDE2.end - 0.2, s: 'whoosh', v: 0.35},
  {at: T.aiidell - 0.05, s: 'shimmer', v: 0.45},
  {at: T.intl, s: 'ding', v: 0.5},
  {at: VOICE_END - 0.2, s: 'whoosh', v: 0.45},
  {at: VOICE_END + 0.05, s: 'shimmer', v: 0.35},
];

const AudioLayer: React.FC = () => (
  <>
    <Audio src={staticFile('reel/voice.mp4')} />
    <Audio src={staticFile('music-easy-lemon.mp3')} volume={musicVol} />
    {SFX.map((x, i) => (
      <Sequence key={i} from={Math.max(0, Math.round(x.at * FPS))} durationInFrames={45}>
        <Audio src={staticFile(`sfx/${x.s}.wav`)} volume={x.v} />
      </Sequence>
    ))}
  </>
);

// ---------- hook photo: someone you love ----------
const GiftPolaroid: React.FC = () => {
  const t = useT();
  const s = useSpringAt(T.someone, 12);
  if (t < T.someone || t >= T.besides) return null;
  const out = interpolate(t, [T.besides - 0.15, T.besides], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', right: 70, top: 380, transform: `translateX(${(1 - s) * 500}px) rotate(${6 - (1 - s) * 10}deg)`, opacity: out}}>
      <PhotoCard src="reel/img/gift.jpg" w={360} h={300} />
    </div>
  );
};

export const AiiDellReel: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{background: C.wine}}>
      <Backdrop />
      <MainVideo />
      <GiftPolaroid />
      <ChatJoke />
      <FreezeText />
      <Sticker emoji="😭" t0={T.freeze + 0.15} t1={T.unfreeze} x={780} y={760} size={170} />
      <Sticker emoji="👀" t0={T.now + 0.05} t1={T.andhere} x={790} y={420} size={150} rot={10} />
      {/* top-strip bold overlays */}
      <TopLine t0={0.05} t1={T.besides}>POV: your person lives in <Ser>another country</Ser> 🥺</TopLine>
      <TopLine t0={T.now} t1={T.andhere + 0.2}>hampers <Ser>{'>>>'}</Ser> paragraphs</TopLine>
      <TopLine t0={T.interesting - 0.05} t1={SLIDE2.start}>the <Ser>interesting</Ser> part 👀</TopLine>
      <SlideChecklist />
      <SlideRoute />
      <LogoReveal />
      <UpdateNotification />
      <EndCard />
      <Subtitles />
      <RedWipe at={SLIDE1.start} />
      <RedWipe at={SLIDE2.start} />
      <RedWipe at={SLIDE2.end} />
      <RedWipe at={VOICE_END} />
      <Grain o={t >= T.freeze && t < T.unfreeze ? 0.12 : 0.05} />
      <AudioLayer />
    </AbsoluteFill>
  );
};
