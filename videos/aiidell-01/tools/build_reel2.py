"""Reel 2: builds public/reel2/voice.mp4 (1080x1350, cleaned voice) + src/reel2-timeline.json."""
import json, subprocess, os
RAW = '/home/user/utility_belt/brand/raw2'
HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(HERE)
WORK = os.path.join(PROJ, 'work', 'reel2'); os.makedirs(WORK, exist_ok=True)
OUT = os.path.join(PROJ, 'public', 'reel2'); os.makedirs(OUT, exist_ok=True)
FPS = 30; SR = 48000
CLIPS = {  # source clip: crop x for a 864x1080 (4:5) window around the speaker, used range
  'IMG_7466': {'x': 462, 'in': 1.08, 'out': 4.92},
  'IMG_7479': {'x': 583, 'in': 0.85, 'out': 6.72},
  'IMG_7490': {'x': 520, 'in': 1.10, 'out': 10.10},
  'IMG_7518': {'x': 436, 'in': 2.02, 'out': 6.05},
}
EDL = [  # spoken "transition" cue (IMG_7490 0.05-1.05) is cut and replaced by a real transition
  ('why', 'IMG_7466', 1.08, 4.92),
  ('birthday', 'IMG_7479', 0.85, 3.80),
  ('wednesday', 'IMG_7479', 4.00, 6.72),
  ('aiidell', 'IMG_7490', 1.10, 6.20),
  ('cakes', 'IMG_7490', 6.62, 7.14),
  ('across', 'IMG_7490', 7.33, 10.10),
  ('anyway', 'IMG_7518', 2.02, 6.05),
]
WORDS = {  # raw-clip times (s): Whisper on each trimmed take, checked against audio energy
  'IMG_7466': [('Why',1.17),('are',1.28),('we',1.36),('acting',1.50),('like',1.95),('sending',2.30),('someone',2.70),('a',3.00),('gift,',3.05,'k'),("it's",3.50),('a',3.62),('special',3.90,'k'),('occasion?',4.35,'k')],
  'IMG_7479': [('Birthday,',.95,'k'),('obviously.',1.80),('Anniversary,',2.60,'k'),('sure.',3.55),('But',4.08),('what',4.30),('about',4.40),('a',4.62),('random',4.75,'k'),('Wednesday',5.05,'k'),('when',5.55),('you',5.75),('miss',5.90,'k'),('someone?',6.17)],
  'IMG_7490': [('And',1.14),("that's",1.35),('where',1.70),('AiiDell',1.95,'k'),('comes',2.75),('in.',3.22),('Send',3.82),('flowers,',4.08,'k'),('chocolates,',4.75,'k'),('hampers,',5.58,'k'),('cakes',6.70,'k'),('across',7.43),('India,',7.75,'k'),('between',8.24),('India',8.73,'k'),('and',9.11),('Indonesia.',9.29,'k')],
  'IMG_7518': [('Anyway,',2.12),('consider',2.59),('this',3.16),('your',3.46),('sign',3.70,'k'),('to',4.06),('be',4.17),("someone's",4.28),('favourite',4.78,'k'),('notification.',5.19,'k')],
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
json.dump({'duration': round(t, 3), 'segments': segs, 'words': words}, open(os.path.join(PROJ, 'src', 'reel2-timeline.json'), 'w'), indent=1)
print('duration', round(t, 3)); [print(s) for s in segs]
