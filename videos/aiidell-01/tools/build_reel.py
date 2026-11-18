"""Builds public/reel/voice.mp4 (1080x1350, cleaned voice) + src/reel-timeline.json.
EDL: takes in recording order, one dead pause trimmed, one comedic freeze frame."""
import json, subprocess, os
RAW = '/home/user/utility_belt/brand/raw'
HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
WORK = os.path.join(PROJ, 'work', 'reel'); os.makedirs(WORK, exist_ok=True)
OUT = os.path.join(PROJ, 'public', 'reel'); os.makedirs(OUT, exist_ok=True)
FPS = 30; SR = 48000
CLIPS = {  # source clip: crop x for a 864x1080 (4:5) window centred on the face, used range
  'IMG_7390': {'x': 378, 'in': 0.00, 'out': 5.95},
  'IMG_7401': {'x': 523, 'in': 0.66, 'out': 5.12},
  'IMG_7406': {'x': 482, 'in': 0.05, 'out': 5.30},
  'IMG_7411': {'x': 525, 'in': 0.48, 'out': 5.00},
}
EDL = [  # (name, clip, in, out) or (name, 'FREEZE', seconds)
  ('things', 'IMG_7390', 0.00, 4.48),
  ('freeze47', 'FREEZE', 0.70),
  ('miss', 'IMG_7390', 4.48, 5.95),
  ('flowers', 'IMG_7401', 0.66, 5.12),
  ('andhere', 'IMG_7406', 0.05, 0.62),
  ('interesting', 'IMG_7406', 0.88, 5.30),
  ('meet', 'IMG_7411', 0.48, 5.00),
]
WORDS = {  # raw-clip times (s), measured earlier from Whisper + audio energy
  'IMG_7390': [('Things',.13),('you',.56),('could',.66),('send',1.07),('to',1.32),('someone',1.46),('you',2.00),('love',2.30,'k'),('besides',2.63),('47',3.27,'k'),('paragraphs',3.72,'k'),('about',4.53),('how',4.80),('much',4.95),('you',5.15),('miss',5.28),('them.',5.45)],
  'IMG_7401': [('Flowers,',.743,'k'),('obviously.',1.343),('Cake,',2.143,'k'),('always.',2.723),('Hampers?',3.613,'k'),('now',4.263),('we',4.433),('are',4.563),('talking!',4.673,'k')],
  'IMG_7406': [('And',.19),('here,',.42),('the',.93),('interesting',1.10,'k'),('part:',2.16),('you',2.61),('can',2.83),('send',3.05),('them',3.20),('between',3.36),('India',3.89,'k'),('and',4.35),('Indonesia.',4.50,'k')],
  'IMG_7411': [('Meet',.547),('AiiDell.',.817,'k'),('your',1.937),('gifting',2.087),('plans',2.527),('just',2.957),('got',3.387),('an',3.647),('international',3.787,'k'),('update.',4.287,'k')],
}
CHAIN = ('highpass=f=75,arnndn=m=/opt/tools/rnnoise/std.rnnn:mix=0.85,'
         'equalizer=f=250:t=q:w=1:g=-2,equalizer=f=4200:t=q:w=1.2:g=2.5,'
         'acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120')
def run(cmd): subprocess.run(cmd, check=True)

# 1) clean + normalise each source clip once (same gain for every part of a clip)
for clip, c in CLIPS.items():
    d = c['out'] - c['in']
    meas = subprocess.run(['ffmpeg','-hide_banner','-ss',str(c['in']),'-t',str(d),'-i',f'{RAW}/{clip}.mov','-vn','-af',
        CHAIN+',loudnorm=I=-16:TP=-2:LRA=7:print_format=json','-f','null','-'],capture_output=True,text=True).stderr
    j = json.loads(meas[meas.rindex('{'):meas.rindex('}')+1])
    ln = (f"loudnorm=I=-16:TP=-2:LRA=7:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
          f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
    run(['ffmpeg','-loglevel','error','-y','-ss',str(c['in']),'-t',str(d),'-i',f'{RAW}/{clip}.mov','-vn','-af',
         f'{CHAIN},{ln},aresample={SR},asetpts=N/SR/TB','-ac','2','-c:a','pcm_s16le',f'{WORK}/{clip}.wav'])

# 2) cut every EDL part: exact frame count, audio trimmed to the same length
parts = []; t = 0.0; segs = []; last = None
for i, e in enumerate(EDL):
    vid = f'{WORK}/p{i}.mov'; aud = f'{WORK}/p{i}.wav'
    if e[1] == 'FREEZE':
        n = round(e[2] * FPS); D = n / FPS
        run(['ffmpeg','-loglevel','error','-y','-sseof','-0.04','-i',last,'-frames:v','1',f'{WORK}/still.png'])
        run(['ffmpeg','-loglevel','error','-y','-loop','1','-framerate',str(FPS),'-i',f'{WORK}/still.png','-frames:v',str(n),
             '-vf','format=yuv420p','-c:v','libx264','-crf','15','-preset','fast',vid])
        run(['ffmpeg','-loglevel','error','-y','-f','lavfi','-i',f'anullsrc=r={SR}:cl=stereo','-t',f'{D}','-c:a','pcm_s16le',aud])
        segs.append({'name': e[0], 'start': round(t, 3), 'dur': round(D, 3), 'freeze': True})
    else:
        name, clip, a, b = e; c = CLIPS[clip]
        n = round((b - a) * FPS); D = n / FPS
        run(['ffmpeg','-loglevel','error','-y','-ss',str(a),'-i',f'{RAW}/{clip}.mov','-an','-frames:v',str(n),
             '-vf',f"crop=864:1080:{c['x']}:0,scale=1080:1350:flags=lanczos,unsharp=5:5:0.4,fps={FPS},format=yuv420p",
             '-c:v','libx264','-crf','15','-preset','fast',vid])
        off = a - c['in']
        run(['ffmpeg','-loglevel','error','-y','-i',f'{WORK}/{clip}.wav','-af',
             f"atrim=start_sample={round(off*SR)}:end_sample={round((off+D)*SR)},asetpts=N/SR/TB,afade=t=in:d=0.012,"
             f"afade=t=out:st={D-0.02:.4f}:d=0.02,apad,atrim=end_sample={round(D*SR)}",'-c:a','pcm_s16le',aud])
        segs.append({'name': name, 'clip': clip, 'in': a, 'start': round(t, 3), 'dur': round(D, 3)})
        last = vid
    parts.append((vid, aud)); t += D

# 3) join (hard cuts; every part already has identical audio/video length)
inputs = []
for v, a in parts: inputs += ['-i', v]
for v, a in parts: inputs += ['-i', a]
k = len(parts)
fc = ''.join(f'[{i}:v][{k+i}:a]' for i in range(k)) + f'concat=n={k}:v=1:a=1[v][a]'
run(['ffmpeg','-loglevel','error','-y',*inputs,'-filter_complex',fc,'-map','[v]','-map','[a]','-c:v','libx264','-crf','16',
     '-preset','medium','-pix_fmt','yuv420p','-c:a','aac','-b:a','256k',f'{OUT}/voice.mp4'])

# 4) word timings on the new timeline
words = []
for clip, ws in WORDS.items():
    for w in ws:
        for s in segs:
            if s.get('clip') == clip and s['in'] <= w[1] < s['in'] + s['dur']:
                words.append({'w': w[0], 't': round(s['start'] + w[1] - s['in'], 3), **({'key': True} if len(w) > 2 else {})})
                break
        else:
            print('word outside cut:', clip, w)
words.sort(key=lambda x: x['t'])
json.dump({'duration': round(t, 3), 'segments': segs, 'words': words}, open(os.path.join(PROJ, 'src', 'reel-timeline.json'), 'w'), indent=1)
print('duration', round(t, 3)); [print(s) for s in segs]
