"""Original sound effects synthesized from code (no third-party audio)."""
import numpy as np, wave, sys, os
SR = 48000
out_dir = sys.argv[1]
rng = np.random.default_rng(3)

def save(name, x, gain=0.8):
    x = np.asarray(x, float)
    x = x / (np.max(np.abs(x)) + 1e-9) * gain
    st = np.stack([x, x], 1)
    with wave.open(os.path.join(out_dir, name + '.wav'), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())

def t(d): return np.arange(int(SR * d)) / SR

def lp(x, a):  # one-pole low-pass, a in (0,1): higher = darker
    y = np.zeros_like(x); s = 0.0
    for i, v in enumerate(x): s = a * s + (1 - a) * v; y[i] = s
    return y

# whoosh: noise swept through a moving band, swelling then fading
d = t(0.45); n = rng.normal(0, 1, len(d))
cut = np.interp(d, [0, 0.25, 0.45], [0.97, 0.80, 0.95])
y = np.zeros_like(n); s = 0
for i, v in enumerate(n): s = cut[i] * s + (1 - cut[i]) * v; y[i] = s
y = y - lp(y, 0.995)
env = np.sin(np.pi * np.clip(d / 0.45, 0, 1)) ** 1.6
save('whoosh', y * env, 0.7)

# pop: short pitched blip with fast decay
d = t(0.09); f = np.interp(d, [0, 0.09], [1300, 500])
save('pop', np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-d * 55), 0.6)

# boom: deep sub drop + click transient (meme-style hit)
d = t(1.1); f = np.interp(d, [0, 1.1], [95, 38])
body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-d * 3.2)
click = rng.normal(0, 1, len(d)) * np.exp(-d * 90) * 0.4
save('boom', np.tanh((body + click) * 2.2), 0.9)

# record scratch: noisy wobble with pitch sweeps
d = t(0.55); wob = np.sin(2 * np.pi * np.cumsum(np.interp(d, [0, .2, .35, .55], [900, 200, 1400, 150])) / SR)
nz = rng.normal(0, 1, len(d)); nz = nz - lp(nz, 0.9)
env = np.interp(d, [0, .02, .2, .25, .45, .55], [0, 1, .8, .3, .9, 0])
save('scratch', (wob * 0.6 + nz * 0.5) * env, 0.75)

# notification ding: two soft bell tones
def bell(freq, dur):
    dd = t(dur); return (np.sin(2*np.pi*freq*dd) + .35*np.sin(2*np.pi*freq*2.76*dd)) * np.exp(-dd * 6)
a = bell(1318.5, 0.6); b = bell(1760, 0.8)
y = np.zeros(int(SR * 0.95)); y[:len(a)] += a; y[int(SR*.13):int(SR*.13)+len(b)] += b
save('ding', y, 0.55)

# shimmer: rising sparkle for the logo reveal
d = t(0.9); y = np.zeros_like(d)
for k in range(14):
    f0 = 1800 + k * 260; st = int(SR * k * 0.045)
    seg = t(0.35); tone = np.sin(2*np.pi*f0*seg) * np.exp(-seg*14)
    y[st:st+len(seg)] += tone[:len(y)-st]
save('shimmer', y * np.linspace(0.5, 1, len(y)), 0.45)

# shutter: camera click (two short noise bursts)
d = t(0.18); nz = rng.normal(0, 1, len(d)); nz = nz - lp(nz, 0.8)
env = np.exp(-d * 120) + np.exp(-np.clip(d - 0.07, 0, None) * 140) * (d > 0.07)
save('shutter', nz * env, 0.6)

# typing: soft keyboard ticks
d = t(0.9); y = np.zeros_like(d)
for k in range(9):
    st = int(SR * (k * 0.095 + rng.uniform(0, .02))); c = t(0.03)
    tick = rng.normal(0, 1, len(c)) * np.exp(-c * 260)
    y[st:st+len(c)] += tick[:len(y)-st]
save('typing', y - lp(y, 0.6), 0.45)

# riser: short tension build into a reveal
d = t(0.8); f = np.interp(d, [0, .8], [300, 1600])
tone = np.sin(2*np.pi*np.cumsum(f)/SR) * 0.4
nz = rng.normal(0, 1, len(d)); nz = nz - lp(nz, 0.95)
save('riser', (tone + nz * 0.5) * (d / 0.8) ** 2, 0.5)
print('ok')
