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
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import timeline from './timeline.json';

// v8 "creator scrapbook" style: native-feeling reel, photos as polaroids, brand only where she names it.
const RED = '#EC0202';
const INK = '#1A1413';
const CAP_WHITE = '#FFFFFF';
const CAP_YELLOW = '#FFD23F';
const CAP_ORANGE = '#FF8A1F';

export const FPS = 30;
const SEG: number[] = timeline.segStarts; // [A, B, C, D, end]
const VIDEO_END = SEG[4];
const END_CARD = 2.0;
export const TOTAL_SECONDS = VIDEO_END + END_CARD;

type W = {t: number; w: string; key?: boolean};
const WORDS: W[] = timeline.words;
const wordT = (w: string, nth = 0) => WORDS.filter((x) => x.w.replace(/[^\w]/g, '') === w)[nth].t;

// ---- Fonts ----
const fontHandle = delayRender('Loading fonts');
Promise.all(
  [
    ['Baloo 2', 'fonts/Baloo-2-wght-800.ttf', '800'],
    ['DM Sans', 'fonts/DM-Sans-wght-700.ttf', '700'],
    ['Caveat', 'fonts/Caveat-700.ttf', '700'],
  ].map(async ([family, file, weight]) => {
    const f = new FontFace(family, `url('${staticFile(file)}')`, {weight});
    await f.load();
    document.fonts.add(f);
  }),
).then(() => continueRender(fontHandle));

const DISPLAY = "'Baloo 2', sans-serif";
const BODY = "'DM Sans', sans-serif";
const HAND = "'Caveat', cursive";
const EMOJI = "'Noto Color Emoji'";

const useT = () => useCurrentFrame() / FPS;

// ---------- Scrapbook beats: each beat drops up to two polaroids into the top of the frame ----------
type Pol = {src: string; note: string; at: number};
type Beat = {start: number; end: number; left: Pol; right?: Pol};
const T = {
  besides: wordT('besides'),
  flowers: wordT('Flowers'),
  cake: wordT('Cake'),
  hampers: wordT('Hampers'),
  now: wordT('now'),
  interesting: wordT('Interesting'),
  india: wordT('India'),
  indonesia: wordT('Indonesia'),
  meet: wordT('Meet'),
  aiidell: wordT('AiiDell'),
  your: wordT('your'),
};
const BEATS: Beat[] = [
  {start: 0.1, end: T.besides, left: {src: 'scrap/kraft.jpg', note: 'for them 💌', at: 0.1}, right: {src: 'broll/gift.jpg', note: 'a lil something', at: 1.4}},
  {start: T.besides, end: T.flowers, left: {src: 'scrap/letters.jpg', note: '47 paragraphs 😭', at: T.besides + 0.6}, right: {src: 'scrap/texting.jpg', note: 'me, typing #48', at: 4.5}},
  {start: T.flowers, end: T.cake, left: {src: 'scrap/tulips.jpg', note: 'flowers ✓', at: T.flowers}, right: {src: 'broll/flowers.jpg', note: 'obviously', at: T.flowers + 0.6}},
  {start: T.cake, end: T.hampers, left: {src: 'scrap/candles.jpg', note: 'cake ✓✓', at: T.cake}, right: {src: 'broll/cake.jpg', note: 'always.', at: T.cake + 0.58}},
  {start: T.hampers, end: T.interesting, left: {src: 'scrap/giftbox.jpg', note: 'hampers?!', at: T.hampers}, right: {src: 'scrap/snowgift.jpg', note: "now we're talking 🤭", at: T.now}},
  {start: T.interesting, end: T.india - 0.05, left: {src: 'scrap/window-girl.jpg', note: 'long distance 🥲', at: T.interesting}, right: {src: 'scrap/window.jpg', note: 'the miles tho ✈️', at: T.interesting + 1.3}},
  {start: T.india - 0.05, end: T.meet, left: {src: 'scrap/delhi.jpg', note: '🇮🇳 india', at: T.india - 0.05}, right: {src: 'scrap/indonesia.jpg', note: '🇮🇩 indonesia', at: T.indonesia}},
];

const Polaroid: React.FC<{p: Pol; side: 'left' | 'right'; end: number}> = ({p, side, end}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < p.at) return null;
  const drop = spring({frame: frame - Math.round(p.at * fps), fps, config: {damping: 15, mass: 0.7}});
  const out = interpolate(t, [end - 0.18, end + 0.12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (out >= 1) return null;
  const baseRot = side === 'left' ? -6 : 5;
  const rot = baseRot + interpolate(drop, [0, 1], [side === 'left' ? -10 : 10, 0]);
  const y = interpolate(drop, [0, 1], [-140, 0]) + out * 60;
  const sway = Math.sin(t * 1.3 + (side === 'left' ? 0 : 2)) * 1.2;
  return (
    <div style={{position: 'absolute', top: side === 'left' ? 120 : 170, left: side === 'left' ? 60 : 560, width: 460,
      background: '#FFFDF8', padding: '20px 20px 0', boxShadow: '0 22px 45px rgba(0,0,0,0.35)', opacity: Math.min(1, drop * 2) * (1 - out),
      transform: `translateY(${y}px) rotate(${rot + sway}deg)`}}>
      {/* tape */}
      <div style={{position: 'absolute', top: -18, left: 160, width: 140, height: 40, background: 'rgba(255,236,190,0.75)', transform: 'rotate(-3deg)'}} />
      <Img src={staticFile(p.src)} style={{width: 420, height: 440, objectFit: 'cover', display: 'block', filter: 'saturate(1.08) contrast(1.04) sepia(0.06)'}} />
      <div style={{height: 88, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: `${HAND}, ${EMOJI}`, fontWeight: 700, fontSize: 52, color: INK}}>
        {p.note}
      </div>
    </div>
  );
};

const Scrapbook: React.FC = () => (
  <>
    {BEATS.map((b, i) => (
      <React.Fragment key={i}>
        <Polaroid p={b.left} side="left" end={b.end} />
        {b.right && <Polaroid p={b.right} side="right" end={b.end} />}
      </React.Fragment>
    ))}
  </>
);

// ---------- "Meet AiiDell" moment: logo sticker + handwritten line ----------
const MeetSticker: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < T.aiidell - 0.05 || t >= VIDEO_END + 0.05) return null;
  const pop = spring({frame: frame - Math.round((T.aiidell - 0.05) * fps), fps, config: {damping: 9, mass: 0.6}});
  const line = spring({frame: frame - Math.round(T.your * fps), fps, config: {damping: 14}});
  return (
    <>
      <div style={{position: 'absolute', top: 200, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <div style={{transform: `scale(${interpolate(pop, [0, 1], [0.3, 1])}) rotate(${interpolate(pop, [0, 1], [-14, -4])}deg)`, opacity: Math.min(1, pop * 2),
          background: '#FFFFFF', padding: 16, borderRadius: 34, boxShadow: '0 20px 45px rgba(0,0,0,0.35)'}}>
          <Img src={staticFile('logo.png')} style={{width: 520, display: 'block', borderRadius: 22}} />
        </div>
      </div>
      {t >= T.your && (
        <div style={{position: 'absolute', top: 470, left: 60, right: 60, textAlign: 'center', fontFamily: `${HAND}, ${EMOJI}`, fontWeight: 700, fontSize: 70,
          color: '#FFFFFF', textShadow: '0 4px 14px rgba(0,0,0,0.55)', opacity: line, transform: `translateY(${(1 - line) * 20}px) rotate(-2deg)`}}>
          gifting plans: now international ✈️
        </div>
      )}
    </>
  );
};

// ---------- End card: comment sticker ----------
const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  if (t < VIDEO_END) return null;
  const pop = spring({frame: frame - Math.round(VIDEO_END * fps), fps, config: {damping: 10, mass: 0.6}});
  return (
    <div style={{position: 'absolute', top: 240, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26}}>
      <div style={{background: '#FFFFFF', borderRadius: 40, padding: '26px 46px', boxShadow: '0 20px 45px rgba(0,0,0,0.35)',
        transform: `scale(${interpolate(pop, [0, 1], [0.4, 1])}) rotate(-3deg)`, opacity: Math.min(1, pop * 2),
        fontFamily: `${DISPLAY}, ${EMOJI}`, fontWeight: 800, fontSize: 86, color: INK, lineHeight: 1}}>
        comment <span style={{background: RED, color: '#fff', borderRadius: 20, padding: '0 22px'}}>GIFT</span> 🎁
      </div>
      <div style={{fontFamily: HAND, fontWeight: 700, fontSize: 64, color: '#FFFFFF', textShadow: '0 4px 14px rgba(0,0,0,0.55)', opacity: pop}}>
        aiidell.com
      </div>
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
    <div style={{position: 'absolute', top: 1600, left: 40, right: 40, display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
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

// ---------- Video: blurred extension behind, sharp square video below, one continuous frame ----------
const useVideoEl = (style: React.CSSProperties) => {
  const t = useT();
  const freezeAt = Math.round(VIDEO_END * FPS) - 2;
  const v = <OffthreadVideo muted src={staticFile('panel.mp4')} style={style} />;
  return t * FPS < freezeAt ? v : <Freeze frame={freezeAt}>{v}</Freeze>;
};

const BlurredBackdrop: React.FC = () => {
  const el = useVideoEl({width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(38px) brightness(0.62) saturate(1.25)', transform: 'scale(1.15)'});
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: '#2a1410'}}>
      {el}
      {/* warm wash so the top reads like soft golden-hour light */}
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(255,120,80,0.18) 0%, rgba(40,10,5,0.25) 55%, rgba(0,0,0,0) 100%)'}} />
    </AbsoluteFill>
  );
};

const MainVideo: React.FC = () => {
  const el = useVideoEl({width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.06) contrast(1.03)'});
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: 840, height: 1080, overflow: 'hidden',
      WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0px, rgba(0,0,0,1) 150px)', maskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0px, rgba(0,0,0,1) 150px)'}}>
      {el}
    </div>
  );
};

// Subtle film grain for a phone-native, less polished look
const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: 0.07, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width="1080" height="1920">
        <filter id="g">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 12} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="1080" height="1920" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};

// ---------- Music: Easy Lemon (Kevin MacLeod), soft under the voice ----------
const musicVolume = (f: number) => {
  const t = f / FPS;
  const fadeIn = interpolate(t, [0, 0.5], [0, 1], {extrapolateRight: 'clamp'});
  const level = interpolate(t, [VIDEO_END - 0.2, VIDEO_END + 0.4], [0.14, 0.32], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fadeOut = interpolate(t, [TOTAL_SECONDS - 1.2, TOTAL_SECONDS], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
  return fadeIn * level * fadeOut;
};

export const AiiDell01: React.FC = () => (
  <AbsoluteFill style={{background: '#2a1410'}}>
    <BlurredBackdrop />
    <MainVideo />
    <Scrapbook />
    <MeetSticker />
    <EndCard />
    <Subtitles />
    <Grain />
    <Audio src={staticFile('panel.mp4')} />
    <Audio src={staticFile('music-easy-lemon.mp3')} volume={musicVolume} />
  </AbsoluteFill>
);
