"""Soft romantic music bed: Karplus-Strong plucked arpeggios over a warm pad.
Original composition generated from code, so it is free of third-party rights."""
import sys, numpy as np, wave

SR = 48000
BPM = 76
BEAT = 60 / BPM
DUR = float(sys.argv[2]) if len(sys.argv) > 2 else 24.0
rng = np.random.default_rng(7)

def hz(n):  # MIDI note -> Hz
    return 440 * 2 ** ((n - 69) / 12)

# Fmaj9 - Am7 - Dm9 - Bbmaj7 (one bar of 4 beats each)
CHORDS = [
    [53, 60, 64, 67, 69, 72],
    [57, 60, 64, 67, 71, 72],
    [50, 57, 60, 64, 65, 69],
    [46, 53, 57, 62, 65, 69],
]

out = np.zeros(int(SR * (DUR + 3)))

def add(sig, t):
    i = int(t * SR)
    n = min(len(sig), len(out) - i)
    if n > 0:
        out[i:i + n] += sig[:n]

def pluck(f, length=2.4, bright=0.5):
    n = int(SR * length)
    p = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, p)
    # soften the excitation for a warmer, nylon-like tone
    buf = np.convolve(buf, np.ones(3) / 3, 'same')
    y = np.zeros(n)
    for i in range(n):
        y[i] = buf[i % p]
        buf[i % p] = 0.996 * (bright * buf[i % p] + (1 - bright) * buf[(i + 1) % p])
    env = np.minimum(1, np.arange(n) / (0.004 * SR))
    return y * env

def pad(notes, length):
    n = int(SR * length)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for k, m in enumerate(notes[:4]):
        f = hz(m)
        for det in (-0.12, 0.0, 0.12):  # gentle chorus
            s += np.sin(2 * np.pi * f * (1 + det / 100) * t + k)
            s += 0.25 * np.sin(2 * np.pi * 2 * f * (1 + det / 100) * t)
    env = np.minimum(1, t / 1.2) * np.minimum(1, (length - t) / 1.2)
    return s * env / 18

bar = 4 * BEAT
nbars = int(np.ceil(DUR / bar)) + 1
pattern = [0, 2, 4, 5, 3, 4, 2, 1]  # gentle up-down arpeggio, eighth notes
for b in range(nbars):
    ch = CHORDS[b % 4]
    t0 = b * bar
    add(pad(ch, bar + 1.0), t0)
    add(0.55 * pluck(hz(ch[0] - 12), 3.0, 0.45), t0)  # soft bass note
    for k, idx in enumerate(pattern):
        vel = 0.33 if k % 2 == 0 else 0.24
        add(vel * pluck(hz(ch[idx] + 12), 2.0, 0.5), t0 + k * BEAT / 2 + rng.uniform(0, 0.012))

# simple room reverb: convolve with decaying noise
ir_len = int(SR * 1.8)
ir = rng.normal(0, 1, ir_len) * np.exp(-np.arange(ir_len) / (SR * 0.45))
ir[0] = 0
wet = np.convolve(out, ir)[: len(out)] / 60
mix = out + 0.6 * wet
mix = mix[: int(SR * DUR)]
fade = int(SR * 1.5)
mix[:int(SR * 0.6)] *= np.linspace(0, 1, int(SR * 0.6))
mix[-fade:] *= np.linspace(1, 0, fade)
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 0.8
# stereo widen slightly with a 12 ms offset on the right channel
right = np.concatenate([np.zeros(int(SR * 0.012)), mix])[: len(mix)]
stereo = np.stack([mix, 0.85 * right + 0.15 * mix], 1)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((stereo * 32767).astype(np.int16).tobytes())
