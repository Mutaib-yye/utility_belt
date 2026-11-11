import React from 'react';
import {
  AbsoluteFill,
  Audio,
  continueRender,
  delayRender,
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

// ---- Brand tokens (from brand/brand-sheet.html) ----
const RED = '#EC0202';
const INK = '#1A1413';
const BLUSH_TOP = '#FFE9E5';
const BLUSH_BOTTOM = '#FFC9C1';
const AMBER = '#F5B50A';

export const FPS = 30;
const VIDEO_END = 21.2; // length of public/panel.mp4
const END_CARD = 1.6;
const FREEZE_AT = 20.9; // a hand enters frame at ~21.0s
export const TOTAL_SECONDS = VIDEO_END + END_CARD;

// Segment starts inside panel.mp4 (seconds)
const SEG = [0, 4.633, 10.767, 15.533, VIDEO_END];

const fontFaces = `
@font-face{font-family:'Baloo 2';font-weight:800;src:url('${staticFile('fonts/Baloo-2-wght-800.ttf')}')}
@font-face{font-family:'Baloo 2';font-weight:600;src:url('${staticFile('fonts/Baloo-2-wght-600.ttf')}')}
@font-face{font-family:'DM Sans';font-weight:500;src:url('${staticFile('fonts/DM-Sans-wght-500.ttf')}')}
@font-face{font-family:'DM Sans';font-weight:700;src:url('${staticFile('fonts/DM-Sans-wght-700.ttf')}')}
@font-face{font-family:'Great Vibes';font-weight:400;src:url('${staticFile('fonts/Great-Vibes.ttf')}')}
`;
// Make sure every face is loaded before frames are captured
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

// ---- Word captions: Whisper timings, text corrected by hand ----
type W = {t: number; w: string; hi?: boolean};
const WORDS: W[] = [
  {t: 0.16, w: 'Meet'}, {t: 0.56, w: 'AiiDell', hi: true}, {t: 1.54, w: 'your'},
  {t: 1.8, w: 'gifting'}, {t: 2.14, w: 'plans'}, {t: 2.57, w: 'just'}, {t: 3.01, w: 'got'},
  {t: 3.15, w: 'an'}, {t: 3.33, w: 'international', hi: true}, {t: 4.11, w: 'update'},
  {t: 4.7, w: 'Things'}, {t: 5.16, w: 'you'}, {t: 5.33, w: 'could'}, {t: 5.77, w: 'send'},
  {t: 6.14, w: 'to'}, {t: 6.22, w: 'someone'}, {t: 6.79, w: 'you'}, {t: 7.03, w: 'love', hi: true},
  {t: 7.6, w: 'besides'}, {t: 8.04, w: '47', hi: true}, {t: 8.48, w: 'paragraphs'},
  {t: 9.2, w: 'about'}, {t: 9.4, w: 'how'}, {t: 9.61, w: 'much'}, {t: 9.89, w: 'you'},
  {t: 10.05, w: 'miss'}, {t: 10.28, w: 'them'},
  {t: 10.8, w: 'Flowers', hi: true}, {t: 11.44, w: 'obviously'}, {t: 12.42, w: 'Cake', hi: true},
  {t: 12.96, w: 'always'}, {t: 13.72, w: 'Hampers', hi: true}, {t: 14.4, w: 'now'},
  {t: 14.64, w: 'we'}, {t: 14.79, w: 'are'}, {t: 15.09, w: 'talking'},
  {t: 15.6, w: 'And'}, {t: 15.86, w: 'here'}, {t: 16.85, w: 'the'}, {t: 17.14, w: 'interesting'},
  {t: 17.62, w: 'part'}, {t: 18.18, w: 'you'}, {t: 18.5, w: 'can'}, {t: 18.64, w: 'send'},
  {t: 18.93, w: 'them'}, {t: 19.22, w: 'between'}, {t: 19.73, w: 'India', hi: true},
  {t: 20.09, w: 'and'}, {t: 20.4, w: 'Indonesia', hi: true},
];
const WORD_END = 21.1;

// Moments that get a pop sound + a visual change
const POPS = [0.15, 4.7, 8.04, 10.8, 12.42, 13.72, 15.6, 19.73, VIDEO_END];

const useT = () => useCurrentFrame() / FPS;

const usePop = (start: number, damping = 13) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - Math.round(start * fps), fps, config: {damping, mass: 0.6}});
};

// ---------- Header ----------
const Header: React.FC = () => {
  const t = useT();
  // logo bounces when "AiiDell" is said
  const bounce = usePop(0.56, 8);
  const s = t < 0.56 ? 1 : interpolate(bounce, [0, 1], [1.18, 1]);
  return (
    <div style={{position: 'absolute', top: 96, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
      <Img src={staticFile('logo.png')} style={{width: 270, transform: `scale(${s})`, borderRadius: 20}} />
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
  if (t < start || t >= end) return null;
  const y = interpolate(inP, [0, 1], [-60, 0]);
  const sc = interpolate(inP, [0, 1], [0.9, 1]);
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 430, height: 330, background: '#fff', borderRadius: 34, border: `5px solid ${RED}`,
      boxShadow: '0 18px 40px rgba(120,20,10,0.18)', transform: `translateY(${y}px) scale(${sc})`, opacity: Math.min(1, inP * 1.5), overflow: 'hidden'}}>
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
  const prog = interpolate(t, [0.6, 3.3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <CardShell start={0.15} end={SEG[1]}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 26}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
          <Flag f="🇮🇩" label="Indonesia" />
          <div style={{position: 'relative', width: 120, height: 8, background: '#F3D5D0', borderRadius: 4}}>
            <div style={{width: `${prog * 100}%`, height: 8, background: RED, borderRadius: 4}} />
            <div style={{position: 'absolute', top: -30, left: prog * 120 - 30, fontFamily: EMOJI, fontSize: 52}}>🎁</div>
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
    <CardShell start={15.6} end={VIDEO_END}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 22}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
          <Flag f="🇮🇳" label="India" on={t >= 19.73} />
          <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 70, color: RED}}>⇄</div>
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
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 430, height: 330, background: RED, borderRadius: 34,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
      transform: `scale(${interpolate(p, [0, 1], [0.85, 1])})`, boxShadow: '0 18px 40px rgba(120,20,10,0.25)'}}>
      <div style={{fontFamily: DISPLAY, fontWeight: 800, fontSize: 84, color: '#fff', lineHeight: 1}}>
        Comment <span style={{background: '#fff', color: RED, borderRadius: 18, padding: '0 22px'}}>GIFT</span>
      </div>
      <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 38, color: '#fff', opacity: 0.92}}>aiidell.com</div>
    </div>
  );
};

// ---------- Captions ----------
const Caption: React.FC = () => {
  const t = useT();
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  let i = -1;
  for (let k = 0; k < WORDS.length; k++) if (WORDS[k].t <= t) i = k;
  if (i < 0) return null;
  const cur = WORDS[i];
  const next = i + 1 < WORDS.length ? WORDS[i + 1].t : WORD_END;
  if (t >= Math.min(next, cur.t + 0.9)) return null;
  const p = spring({frame: frame - Math.round(cur.t * fps), fps, config: {damping: 12, mass: 0.5}, durationInFrames: 4});
  const s = interpolate(p, [0, 1], [0.85, 1]);
  return (
    <div style={{position: 'absolute', top: 772, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
      <div style={{transform: `scale(${s})`, fontFamily: DISPLAY, fontWeight: 800, fontSize: 104, lineHeight: 1.15,
        color: cur.hi ? '#fff' : INK, background: cur.hi ? RED : 'transparent', borderRadius: 24, padding: cur.hi ? '0 30px 6px' : 0}}>
        {cur.w}
      </div>
    </div>
  );
};

// ---------- Speaker panel ----------
const Panel: React.FC = () => {
  const t = useT();
  // alternate framing per segment; punch in on "now we are talking"
  let zoom = 1;
  if (t >= SEG[1] && t < SEG[2]) zoom = 1.1;
  if (t >= 14.4 && t < SEG[3]) zoom = 1.14;
  if (t >= SEG[3]) zoom = 1.05;
  const video = <OffthreadVideo muted src={staticFile('panel.mp4')} style={{width: '100%', height: '100%', objectFit: 'cover'}} />;
  return (
    <div style={{position: 'absolute', left: 36, right: 36, top: 900, height: 1100, borderRadius: 48, overflow: 'hidden',
      boxShadow: '0 -10px 40px rgba(120,20,10,0.15)', background: '#000'}}>
      <div style={{width: '100%', height: '100%', transform: `scale(${zoom})`, transformOrigin: '50% 30%'}}>
        {t < FREEZE_AT ? video : <Freeze frame={Math.round(FREEZE_AT * FPS)}>{video}</Freeze>}
      </div>
    </div>
  );
};

export const AiiDell01: React.FC = () => (
  <AbsoluteFill style={{background: `linear-gradient(180deg, ${BLUSH_TOP} 0%, ${BLUSH_BOTTOM} 100%)`}}>
    <style>{fontFaces}</style>
    {/* soft amber glow behind the header */}
    <div style={{position: 'absolute', top: -200, left: 240, width: 600, height: 600, borderRadius: 300, background: AMBER, opacity: 0.12, filter: 'blur(90px)'}} />
    <Header />
    <RouteCard />
    <ParagraphsCard />
    <ProductCard start={10.8} end={12.42} emoji="🌹" name={'Roses & Chocolates\nCombo'.replace('\n', ' ')} tag="Rp 210.000" />
    <ProductCard start={12.42} end={13.72} emoji="🎂" name="Cakes & bakes" tag="Delivered in India" />
    <ProductCard start={13.72} end={15.6} emoji="🎁" name="Hampers & combos" tag="94+ to pick from" />
    <BetweenCard />
    <EndCard />
    <Caption />
    <Panel />
    <Audio src={staticFile('panel.mp4')} />
    {POPS.map((p) => (
      <Sequence key={p} from={Math.round(p * FPS)} durationInFrames={6}>
        <Audio src={staticFile('pop.wav')} volume={0.8} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
