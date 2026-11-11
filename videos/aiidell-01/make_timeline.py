"""Builds src/timeline.json: corrected words with times on the final cut.
Word times were measured on an earlier cut (old offset + trim) and are mapped
to raw-clip time, then onto the new cut using the clip trims below."""
import subprocess, json
dur = lambda f: float(subprocess.run(['ffprobe','-v','error','-select_streams','v','-show_entries','stream=duration','-of','csv=p=0',f],capture_output=True,text=True).stdout)
old = [(0,0),(6.1667,0.48),(11.2,0),(16.6333,0.30)]
new_trim = [0.0,0.66,1.09,0.48]
XF = 0.133
W = [
 [('Things',.13),('you',.56),('could',.66),('send',1.07),('to',1.32),('someone',1.46),('you',2.00),('love',2.30,1),('besides',2.63),('47',3.27,1),('paragraphs',3.72),('about',4.53),('how',4.80),('much',4.95),('you',5.15),('miss',5.28),('them.',5.45)],
 [('Flowers,',6.43,1),('obviously.',7.03),('Cake,',7.83,1),('always.',8.41),('Hampers?',9.30,1),('now',9.95),('we',10.12),('are',10.25),('talking!',10.36)],
 [('Interesting',12.30),('part:',13.36),('you',13.81),('can',14.03),('send',14.25),('them',14.40),('between',14.56),('India',15.09,1),('and',15.55),('Indonesia.',15.70,1)],
 [('Meet',16.88),('AiiDell.',17.15,1),('your',18.27),('gifting',18.42),('plans',18.86),('just',19.29),('got',19.72),('an',19.98),('international',20.12,1),('update.',20.62)],
]
ends = [5.90,10.62,16.42,21.02]
starts = []; acc = 0
for i in range(4): starts.append(acc); acc += dur(f'n{i}.mov') - (XF if i < 3 else 0)
conv = lambda i,t: t-old[i][0]+old[i][1]-new_trim[i]+starts[i]
words = [{'w':w[0],'t':round(conv(i,w[1]),3),**({'key':True} if len(w)>2 else {})} for i,ws in enumerate(W) for w in ws]
tl = {'segStarts':[round(s,3) for s in starts]+[round(acc,3)],'speechEnds':[round(conv(i,e),3) for i,e in enumerate(ends)],'words':words}
open('../src/timeline.json','w').write(json.dumps(tl,indent=1))
print(tl['segStarts'], tl['speechEnds'])
