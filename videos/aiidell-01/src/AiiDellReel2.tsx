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
} from 'remotion';
import tl from './reel2-timeline.json';

// ===== Reel 2: "gifts don't need an occasion" — red-themed Gen Z creator reel =====
const FPS = 30;
const VOICE_END = tl.duration;
const END_CARD = 2.4;
export const REEL2_SECONDS = VOICE_END + END_CARD;

const C = {red: '#E5121F', redHot: '#FF2D3D', crimson: '#8E0B16', wine: '#3A0409', ink: '#120607', white: '#FFFFFF', blush: '#FFC9CD'};

type W = {t: number; w: string; key?: boolean};
const WORDS: W[] = tl.words;
const at = (w: string, nth = 0) => WORDS.filter((x) => x.w.replace(/[^\w]/g, '').toLowerCase() === w.toLowerCase())[nth].t;
const seg = (name: string) => tl.segments.find((s) => s.name === name)!;

const T = {
  special: at('special'),
  birthdaySeg: seg('birthday').start,
  birthday: at('Birthday'),
  anniversary: at('Anniversary'),
  random: at('random'),
  wednesday: at('Wednesday'),
  when: at('when'),
  transition: seg('aiidell').start,
  aiidell: at('AiiDell'),
  send: at('Send'),
  flowers: at('flowers'),
  chocolates: at('chocolates'),
  hampers: at('hampers'),
  cakes: at('cakes'),
  across: at('across'),
  india: at('India'),
  indonesia: at('Indonesia'),
  anywaySeg: seg('anyway').start,
  sign: at('sign'),
  notification: at('notification'),
};
const SLIDE_CAL = {start: T.birthdaySeg, end: T.when};
const SLIDE_GRID = {start: T.send - 0.05, end: T.across};
const SLIDE_ROUTE = {start: T.across, end: T.anywaySeg};

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

// ---------- backdrop + grain ----------
const Backdrop: React.FC = () => {
  const t = useT();
  const gx = 50 + Math.sin(t * 0.35) * 22;
  const gy = 30 + Math.cos(t * 0.27) * 12;
  return (
    <AbsoluteFill style={{background: `radial-gradient(120% 70% at ${gx}% ${gy}%, ${C.crimson} 0%, ${C.wine} 55%, #1A0204 100%)`}}>
      <AbsoluteFill style={{background: `linear-gradient(115deg, rgba(255,60,70,0) ${20 + (t * 6) % 120}%, rgba(255,80,90,0.10) ${30 + (t * 6) % 120}%, rgba(255,60,70,0) ${42 + (t * 6) % 120}%)`}} />
      <div style={{position: 'absolute', left: 60, right: 60, top: 270, height: 2, background: 'linear-gradient(90deg, rgba(255,45,61,0), rgba(255,45,61,0.55), rgba(255,45,61,0))'}} />
      <div style={{position: 'absolute', left: 60, right: 60, top: 1650, height: 2, background: 'linear-gradient(90deg, rgba(255,45,61,0), rgba(255,45,61,0.45), rgba(255,45,61,0))'}} />
    </AbsoluteFill>
  );
};
const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: 0.05, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width="1080" height="1920">
        <filter id="grain2"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 9} /><feColorMatrix type="saturate" values="0" /></filter>
        <rect width="1080" height="1920" filter="url(#grain2)" />
      </svg>
    </AbsoluteFill>
  );
};
const SlideBg: React.FC = () => <AbsoluteFill style={{background: `radial-gradient(90% 60% at 50% 22%, ${C.red} 0%, ${C.crimson} 60%, ${C.wine} 100%)`}} />;

// ---------- talking video ----------
const voiceVideo = (style: React.CSSProperties) => <OffthreadVideo muted src={staticFile('reel2/voice.mp4')} style={style} />;

const cameraZoom = (t: number) => {
  let z = interpolate(t, [0, T.special], [1.0, 1.06], clamp);
  if (t >= T.special && t < T.birthdaySeg) z = interpolate(t, [T.special, T.special + 0.12], [1.06, 1.2], {...clamp, easing: Easing.out(Easing.back(1.8))});
  if (t >= T.when && t < T.transition) z = interpolate(t, [T.when, T.when + 0.9], [1.12, 1.24], {...clamp, easing: Easing.inOut(Easing.quad)});
  if (t >= T.transition && t < SLIDE_GRID.start) z = interpolate(t, [T.transition, T.aiidell + 0.2], [1.0, 1.06], clamp);
  if (t >= T.anywaySeg) z = interpolate(t, [T.anywaySeg, T.sign, T.sign + 0.1, VOICE_END], [1.0, 1.04, 1.14, 1.16], clamp);
  return z;
};

const MainVideo: React.FC = () => {
  const t = useT();
  const z = cameraZoom(t);
  const shake = t >= T.special && t < T.special + 0.25 ? Math.sin(t * 90) * 6 : 0;
  const endFrame = Math.round(VOICE_END * FPS) - 2;
  const v = voiceVideo({width: '100%', height: '100%', objectFit: 'cover'});
  // warm-to-cool mood shift on "when you miss someone"
  const moody = interpolate(t, [T.when, T.when + 0.4, T.transition - 0.2, T.transition], [0, 1, 1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: 24, right: 24, top: 300, height: 1330, borderRadius: 40, overflow: 'hidden',
      boxShadow: '0 30px 80px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,45,61,0.35)', background: '#000'}}>
      <div style={{width: '100%', height: '100%', transform: `scale(${z}) translateX(${shake}px)`, transformOrigin: '50% 24%',
        filter: `saturate(${1.05 - moody * 0.35}) contrast(1.04) brightness(${1 - moody * 0.08})`}}>
        {t * FPS < endFrame ? v : <Freeze frame={endFrame}>{v}</Freeze>}
      </div>
      <AbsoluteFill style={{boxShadow: `inset 0 0 220px rgba(20,0,2,${0.75 * moody})`}} />
    </div>
  );
};

// ---------- red wipe ----------
const RedWipe: React.FC<{at: number}> = ({at: a}) => {
  const t = useT();
  const p = interpolate(t, [a - 0.2, a + 0.22], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  if (p <= 0 || p >= 1) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', top: -300, bottom: -300, width: 900, left: interpolate(p, [0, 1], [-1400, 1400]), transform: 'skewX(-14deg)',
        background: `linear-gradient(90deg, ${C.crimson}, ${C.red} 45%, ${C.redHot} 55%, ${C.crimson})`, boxShadow: '0 0 80px rgba(255,45,61,0.6)'}} />
    </AbsoluteFill>
  );
};

// ---------- pieces ----------
const Ser: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = C.redHot}) => (
  <span style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, color, fontSize: '1.08em'}}>{children}</span>
);

const TopLine: React.FC<{t0: number; t1: number; children: React.ReactNode; y?: number}> = ({t0, t1, children, y = 80}) => {
  const t = useT();
  const s = useSpringAt(t0, 14);
  if (t < t0 || t >= t1) return null;
  const o = interpolate(t, [t1 - 0.15, t1], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', top: y, left: 40, right: 40, textAlign: 'center', opacity: s * o, transform: `translateY(${(1 - s) * -30}px)`,
      fontFamily: `${SANS}, ${EMOJI}`, fontWeight: 800, fontSize: 60, lineHeight: 1.15, color: C.white, textShadow: '0 6px 20px rgba(0,0,0,0.5)'}}>
      {children}
    </div>
  );
};

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

const PiP: React.FC<{x: number; y: number; size?: number; t0: number; t1: number}> = ({x, y, size = 320, t0, t1}) => {
  const t = useT();
  const s = useSpringAt(t0 + 0.1, 12);
  if (t < t0 || t >= t1) return null;
  const out = interpolate(t, [t1 - 0.12, t1], [1, 0], clamp);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size, overflow: 'hidden', border: `7px solid ${C.white}`,
      boxShadow: `0 0 0 5px ${C.red}, 0 20px 50px rgba(0,0,0,0.5)`, transform: `scale(${s * out})`}}>
      {voiceVideo({width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 18%', transform: 'scale(1.9)', transformOrigin: '50% 22%'})}
    </div>
  );
};

// ---------- SLIDE: the gifting calendar ----------
const DayTile: React.FC<{t0: number; x: number; y: number; day: string; title: string; note: string; src?: string; rot: number; big?: boolean}> = ({t0, x, y, day, title, note, src, rot, big}) => {
  const t = useT();
  const s = useSpringAt(t0, 11, 0.6);
  const ring = useSpringAt(t0 + 0.3, 14);
  if (t < t0) return null;
  const w = big ? 560 : 440;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, transform: `scale(${interpolate(s, [0, 1], [0.6, 1])}) rotate(${rot}deg)`, opacity: Math.min(1, s * 1.6)}}>
      <div style={{background: C.white, borderRadius: 26, overflow: 'hidden', boxShadow: '0 24px 55px rgba(0,0,0,0.5)'}}>
        <div style={{background: C.red, color: C.white, fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 3, padding: '10px 22px'}}>{day}</div>
        {src ? (
          <Img src={staticFile(src)} style={{width: '100%', height: 250, objectFit: 'cover', display: 'block', transform: `scale(${interpolate(s, [0, 1], [1.35, 1.02])})`}} />
        ) : (
          <div style={{height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'}}>
            <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 150, color: C.ink, lineHeight: 1}}>WED</div>
            <svg width={w} height={250} style={{position: 'absolute', inset: 0}}>
              <ellipse cx={w / 2} cy={125} rx={w * 0.36} ry={92} fill="none" stroke={C.red} strokeWidth={9} strokeLinecap="round"
                strokeDasharray={760} strokeDashoffset={760 * (1 - ring)} transform={`rotate(-6 ${w / 2} 125)`} />
            </svg>
          </div>
        )}
        <div style={{padding: '16px 22px 20px'}}>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 44, color: C.ink, lineHeight: 1.1}}>{title}</div>
          <div style={{fontFamily: SERIF, fontStyle: 'italic', fontWeight: 700, fontSize: 34, color: C.red, marginTop: 4}}>{note}</div>
        </div>
      </div>
    </div>
  );
};

const SlideCalendar: React.FC = () => {
  const t = useT();
  if (t < SLIDE_CAL.start || t >= SLIDE_CAL.end) return null;
  return (
    <AbsoluteFill>
      <SlideBg />
      <div style={{position: 'absolute', top: 110, left: 60, right: 60, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 58, color: C.white, lineHeight: 1.15}}>
        the official <Ser color="#FFD9DC">gifting calendar</Ser>
      </div>
      <DayTile t0={T.birthday} x={60} y={300} day="BIRTHDAY" title="birthday ✓" note="obviously." src="reel2/img/candles.jpg" rot={-3} />
      <DayTile t0={T.anniversary} x={560} y={420} day="ANNIVERSARY" title="anniversary ✓" note="sure." src="reel2/img/couple.jpg" rot={3} />
      <DayTile t0={T.random} x={150} y={930} day="A RANDOM WEDNESDAY" title="no occasion." note="just missing them." rot={-1.5} big />
      <PiP x={720} y={1430} size={300} t0={SLIDE_CAL.start} t1={SLIDE_CAL.end} />
    </AbsoluteFill>
  );
};

// ---------- SLIDE: what you can send ----------
const GridItem: React.FC<{t0: number; x: number; y: number; src: string; label: string; rot: number}> = ({t0, x, y, src, label, rot}) => {
  const t = useT();
  const s = useSpringAt(t0, 11, 0.55);
  if (t < t0) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 450, transform: `scale(${interpolate(s, [0, 1], [0.5, 1])}) rotate(${rot}deg)`, opacity: Math.min(1, s * 1.6)}}>
      <div style={{background: C.white, padding: 12, borderRadius: 24, boxShadow: '0 24px 55px rgba(0,0,0,0.5)'}}>
        <Img src={staticFile(src)} style={{width: 426, height: 380, objectFit: 'cover', borderRadius: 14, display: 'block', transform: `scale(${interpolate(s, [0, 1], [1.4, 1.02])})`}} />
        <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 46, color: C.ink, textAlign: 'center', padding: '10px 0 4px'}}>{label}</div>
      </div>
    </div>
  );
};
const SlideGrid: React.FC = () => {
  const t = useT();
  if (t < SLIDE_GRID.start || t >= SLIDE_GRID.end) return null;
  return (
    <AbsoluteFill>
      <SlideBg />
      <div style={{position: 'absolute', top: 110, left: 60, right: 60, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 60, color: C.white}}>
        send <Ser color="#FFD9DC">literally anything</Ser>
      </div>
      <GridItem t0={T.flowers} x={70} y={290} src="reel2/img/tulips.jpg" label="flowers" rot={-3} />
      <GridItem t0={T.chocolates} x={560} y={330} src="reel2/img/chocolates.jpg" label="chocolates" rot={3} />
      <GridItem t0={T.hampers} x={70} y={850} src="reel2/img/giftbox.jpg" label="hampers" rot={2} />
      <GridItem t0={T.cakes} x={560} y={890} src="reel2/img/cake.jpg" label="cakes" rot={-2.5} />
    </AbsoluteFill>
  );
};

// ---------- SLIDE: India <-> Indonesia ----------
const PhotoCard: React.FC<{src: string; w: number; h: number}> = ({src, w, h}) => (
  <div style={{width: w, background: C.white, padding: 12, borderRadius: 18, boxShadow: '0 24px 50px rgba(0,0,0,0.45)'}}>
    <Img src={staticFile(src)} style={{width: w - 24, height: h, objectFit: 'cover', borderRadius: 10, display: 'block'}} />
  </div>
);
const SlideRoute: React.FC = () => {
  const t = useT();
  const sIn = useSpringAt(T.india, 12);
  const sId = useSpringAt(T.indonesia, 12);
  if (t < SLIDE_ROUTE.start || t >= SLIDE_ROUTE.end) return null;
  const draw = interpolate(t, [T.india + 0.2, T.indonesia + 0.4], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const P0 = [330, 760], P1 = [900, 760], P2 = [700, 1190];
  const q = (a: number, b: number, c: number, u: number) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * b + u * u * c;
  return (
    <AbsoluteFill>
      <SlideBg />
      <div style={{position: 'absolute', top: 130, left: 60, right: 60, textAlign: 'center', fontFamily: SANS, fontWeight: 800, fontSize: 64, color: C.white}}>
        door to door, <Ser color="#FFD9DC">across borders</Ser>
      </div>
      <svg width="1080" height="1920" style={{position: 'absolute', inset: 0}}>
        <path d={`M ${P0[0]} ${P0[1]} Q ${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.85} strokeWidth={6}
          strokeDasharray="20 16" style={{clipPath: `inset(0 ${(1 - draw) * 100}% 0 0)`}} />
      </svg>
      {t >= T.india && (
        <div style={{position: 'absolute', left: 70, top: 360, transform: `scale(${sIn}) rotate(-5deg)`}}>
          <PhotoCard src="reel2/img/delhi.jpg" w={460} h={360} />
          <div style={{marginTop: 14, textAlign: 'center', fontFamily: `${SANS}, ${EMOJI}`, fontWeight: 800, fontSize: 50, color: C.white}}>🇮🇳 India</div>
        </div>
      )}
      {t >= T.indonesia && (
        <div style={{position: 'absolute', left: 520, top: 860, transform: `scale(${sId}) rotate(4deg)`}}>
          <PhotoCard src="reel2/img/indonesia.jpg" w={480} h={360} />
          <div style={{marginTop: 14, textAlign: 'center', fontFamily: `${SANS}, ${EMOJI}`, fontWeight: 800, fontSize: 50, color: C.white}}>🇮🇩 Indonesia</div>
        </div>
      )}
      {draw > 0 && draw < 1 && (
        <div style={{position: 'absolute', left: q(P0[0], P1[0], P2[0], draw) - 40, top: q(P0[1], P1[1], P2[1], draw) - 40, fontFamily: EMOJI, fontSize: 80, transform: 'rotate(20deg)'}}>✈️</div>
      )}
      <PiP x={60} y={1330} size={290} t0={SLIDE_ROUTE.start} t1={SLIDE_ROUTE.end} />
    </AbsoluteFill>
  );
};

// ---------- logo reveal ----------
const LogoReveal: React.FC = () => {
  const t = useT();
  const s = useSpringAt(T.aiidell - 0.05, 9, 0.6);
  if (t < T.aiidell - 0.05 || t >= SLIDE_GRID.start) return null;
  const glow = interpolate(t, [T.aiidell, T.aiidell + 0.6], [1, 0.25], clamp);
  return (
    <div style={{position: 'absolute', top: 70, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{transform: `scale(${interpolate(s, [0, 1], [0.4, 1])}) rotate(${interpolate(s, [0, 1], [-8, 0])}deg)`, opacity: Math.min(1, s * 2), borderRadius: 28,
        boxShadow: `0 0 ${80 * glow}px ${30 * glow}px rgba(255,45,61,${0.7 * glow}), 0 16px 40px rgba(0,0,0,0.5)`, border: `5px solid ${C.white}`}}>
        <Img src={staticFile('logo.png')} style={{width: 400, display: 'block', borderRadius: 22}} />
      </div>
    </div>
  );
};

// ---------- "favourite notification" ----------
const GiftNotification: React.FC = () => {
  const t = useT();
  const t0 = T.notification - 0.05;
  const s = useSpringAt(t0, 14);
  if (t < t0 || t >= VOICE_END + 0.1) return null;
  return (
    <div style={{position: 'absolute', top: 340, left: 60, right: 60, transform: `translateY(${(1 - s) * -260}px)`, opacity: s}}>
      <div style={{background: 'rgba(255,248,246,0.95)', borderRadius: 36, padding: '24px 28px', display: 'flex', gap: 22, alignItems: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.45)'}}>
        <Img src={staticFile('logo.png')} style={{width: 110, height: 110, objectFit: 'cover', borderRadius: 26}} />
        <div style={{flex: 1, minWidth: 0}}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: SANS, fontWeight: 600, fontSize: 26, color: '#7d6f6c'}}><span>AIIDELL</span><span>now</span></div>
          <div style={{fontFamily: `${SANS}, ${EMOJI}`, fontWeight: 800, fontSize: 38, color: C.ink, marginTop: 2}}>someone just sent you a gift 🎁</div>
          <div style={{fontFamily: `${SANS}, ${EMOJI}`, fontWeight: 600, fontSize: 28, color: '#3b3130'}}>no occasion. they just miss you 💌</div>
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
      <SlideBg />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 40}}>
        <div style={{opacity: s2, transform: `translateY(${(1 - s2) * 30}px)`, textAlign: 'center', fontFamily: `${SERIF}, ${EMOJI}`, fontStyle: 'italic', fontWeight: 700, fontSize: 82, color: C.white, lineHeight: 1.12}}>
          be someone's<br />favourite notification 🔔
        </div>
        <div style={{transform: `scale(${interpolate(s, [0, 1], [0.6, 1])})`, opacity: s, borderRadius: 30, border: `6px solid ${C.white}`, boxShadow: '0 20px 60px rgba(0,0,0,0.45)'}}>
          <Img src={staticFile('logo.png')} style={{width: 500, display: 'block', borderRadius: 24}} />
        </div>
        <div style={{opacity: s2, textAlign: 'center'}}>
          <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 52, color: C.white, letterSpacing: 1}}>aiidell.com</div>
          <div style={{marginTop: 8, fontFamily: SANS, fontWeight: 600, fontSize: 36, color: C.blush}}>@jastipindiaaiidell</div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- subtitles ----------
const PHRASE_LENGTHS = [3, 2, 2, 2, 2, 2, 1, 1, 1, 1, 3, 2, 1, 2, 2, 3, 1, 2, 2, 1, 1, 1, 2, 2, 2, 1, 2, 2, 3, 1, 1];
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
const place = (t: number) => {
  if (t >= SLIDE_CAL.start && t < SLIDE_CAL.end) return {top: 1470, size: 64, left: 50, right: 400, justify: 'flex-start'};
  if (t >= SLIDE_GRID.start && t < SLIDE_GRID.end) return {top: 1480, size: 76, left: 40, right: 40, justify: 'center'};
  if (t >= SLIDE_ROUTE.start && t < SLIDE_ROUTE.end) return {top: 1700, size: 68, left: 380, right: 40, justify: 'center'};
  if (t >= T.when && t < T.transition) return {top: 120, size: 80, left: 40, right: 40, justify: 'center'}; // emotional line moves to the top
  return {top: 1360, size: 80, left: 40, right: 40, justify: 'center'};
};
const Subtitles: React.FC = () => {
  const t = useT();
  const f = useCurrentFrame();
  let pi = -1;
  for (let k = 0; k < PHRASES.length; k++) if (PHRASES[k].start <= t) pi = k;
  if (pi < 0 || t >= VOICE_END) return null;
  const ph = PHRASES[pi];
  const last = ph.words[ph.words.length - 1];
  const next = pi + 1 < PHRASES.length ? PHRASES[pi + 1].start : VOICE_END;
  if (t >= Math.min(next, last.t + 1.1)) return null;
  const inP = spring({frame: f - Math.round(ph.start * FPS), fps: FPS, config: {damping: 13, mass: 0.45}, durationInFrames: 7});
  const p = place(t);
  return (
    <div style={{position: 'absolute', top: p.top, left: p.left, right: p.right, display: 'flex', flexWrap: 'wrap', justifyContent: p.justify, rowGap: 6,
      transform: `translateY(${(1 - inP) * 26}px) scale(${interpolate(inP, [0, 1], [0.9, 1])})`, opacity: inP}}>
      {ph.words.map((w) => {
        const active = t >= w.t && (w.i + 1 >= WORDS.length || t < WORDS[w.i + 1].t);
        const spoken = t >= w.t;
        const wp = spring({frame: f - Math.round(w.t * FPS), fps: FPS, config: {damping: 10, mass: 0.35}, durationInFrames: 5});
        const base: React.CSSProperties = {fontFamily: SANS, fontWeight: 800, fontSize: p.size, lineHeight: 1.12, margin: '0 13px', display: 'inline-block',
          transform: `scale(${active ? interpolate(wp, [0, 1], [1, 1.08]) : 1})`, opacity: spoken ? 1 : 0.45};
        if (w.key) {
          return <span key={w.i} style={{...base, color: C.white, background: spoken ? C.red : 'rgba(229,18,31,0.35)', borderRadius: 16, padding: '0 16px 4px',
            boxShadow: spoken ? '0 8px 22px rgba(229,18,31,0.45)' : 'none'}}>{w.w}</span>;
        }
        return <span key={w.i} style={{...base, color: C.white, WebkitTextStroke: '8px rgba(18,6,7,0.92)', paintOrder: 'stroke fill', textShadow: '0 6px 16px rgba(0,0,0,0.45)'}}>{w.w}</span>;
      })}
    </div>
  );
};

// ---------- audio ----------
const musicVol = (f: number) => {
  const t = f / FPS;
  const fadeIn = interpolate(t, [0, 0.4], [0, 1], clamp);
  // dip the music under the emotional line, then lift it again on the AiiDell transition
  const dip = interpolate(t, [T.when - 0.1, T.when + 0.3, T.transition - 0.3, T.transition], [1, 0.45, 0.45, 1], clamp);
  const base = interpolate(t, [VOICE_END - 0.2, VOICE_END + 0.3], [0.11, 0.38], clamp);
  const fadeOut = interpolate(t, [REEL2_SECONDS - 1.0, REEL2_SECONDS], [1, 0], clamp);
  return fadeIn * dip * base * fadeOut;
};
const SFX: {at: number; s: string; v: number}[] = [
  {at: 0.05, s: 'pop', v: 0.35},
  {at: T.special, s: 'boom', v: 0.45},
  {at: SLIDE_CAL.start - 0.22, s: 'whoosh', v: 0.45},
  {at: T.birthday, s: 'pop', v: 0.4},
  {at: T.anniversary, s: 'pop', v: 0.4},
  {at: T.random, s: 'pop', v: 0.4},
  {at: T.random + 0.3, s: 'shutter', v: 0.3},
  {at: SLIDE_CAL.end - 0.2, s: 'whoosh', v: 0.35},
  {at: T.transition - 0.75, s: 'riser', v: 0.35},
  {at: T.transition - 0.22, s: 'whoosh', v: 0.5},
  {at: T.aiidell - 0.05, s: 'shimmer', v: 0.45},
  {at: SLIDE_GRID.start - 0.22, s: 'whoosh', v: 0.45},
  {at: T.flowers, s: 'pop', v: 0.4},
  {at: T.chocolates, s: 'pop', v: 0.4},
  {at: T.hampers, s: 'pop', v: 0.4},
  {at: T.cakes, s: 'pop', v: 0.4},
  {at: SLIDE_ROUTE.start - 0.22, s: 'whoosh', v: 0.4},
  {at: T.india, s: 'pop', v: 0.4},
  {at: T.indonesia, s: 'pop', v: 0.4},
  {at: SLIDE_ROUTE.end - 0.2, s: 'whoosh', v: 0.4},
  {at: T.sign, s: 'shimmer', v: 0.3},
  {at: T.notification - 0.05, s: 'ding', v: 0.5},
  {at: VOICE_END - 0.2, s: 'whoosh', v: 0.45},
];
const AudioLayer: React.FC = () => (
  <>
    <Audio src={staticFile('reel2/voice.mp4')} />
    <Audio src={staticFile('music-easy-lemon.mp3')} volume={musicVol} />
    {SFX.map((x, i) => (
      <Sequence key={i} from={Math.max(0, Math.round(x.at * FPS))} durationInFrames={45}>
        <Audio src={staticFile(`sfx/${x.s}.wav`)} volume={x.v} />
      </Sequence>
    ))}
  </>
);

export const AiiDellReel2: React.FC = () => (
  <AbsoluteFill style={{background: C.wine}}>
    <Backdrop />
    <MainVideo />
    <Sticker emoji="🙄" t0={T.special + 0.05} t1={T.birthdaySeg} x={760} y={420} size={160} rot={8} />
    <Sticker emoji="🥺" t0={T.when + 0.15} t1={T.transition} x={790} y={1100} size={150} rot={-6} />
    <TopLine t0={0.05} t1={T.birthdaySeg}>unpopular opinion 💭<br />gifts don't need <Ser>a reason</Ser></TopLine>
    <TopLine t0={T.sign - 0.05} t1={T.notification - 0.1}>this is your <Ser>sign</Ser> ✨</TopLine>
    <SlideCalendar />
    <SlideGrid />
    <SlideRoute />
    <LogoReveal />
    <GiftNotification />
    <EndCard />
    <Subtitles />
    <RedWipe at={SLIDE_CAL.start} />
    <RedWipe at={SLIDE_CAL.end} />
    <RedWipe at={T.transition} />
    <RedWipe at={SLIDE_GRID.start} />
    <RedWipe at={SLIDE_ROUTE.end} />
    <RedWipe at={VOICE_END} />
    <Grain />
    <AudioLayer />
  </AbsoluteFill>
);
