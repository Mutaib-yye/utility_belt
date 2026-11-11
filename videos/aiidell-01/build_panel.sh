#!/bin/bash
# Builds public/panel.mp4: 4 takes, cleaned voice, matched loudness, 4-frame blends between takes.
set -e
R=/home/user/utility_belt/brand/raw
XF=0.133   # 4-frame blend between takes
i=0
for spec in "IMG_7390 0.00 5.66 270" "IMG_7401 0.66 5.12 415" "IMG_7406 1.09 5.30 374" "IMG_7411 0.48 5.00 417"; do
  set -- $spec
  N=$(python3 -c "print(round(($3-$2)*30))"); D=$(python3 -c "print($N/30)")
  CLEAN="highpass=f=80,arnndn=m=/opt/tools/rnnoise/std.rnnn:mix=0.9,agate=threshold=0.012:ratio=3:range=0.08:attack=5:release=180,afade=t=in:d=0.015,afade=t=out:st=$(python3 -c "print($D-0.03)"):d=0.03"
  J=$(ffmpeg -hide_banner -ss $2 -t $D -i $R/$1.mov -af "$CLEAN,loudnorm=I=-16:TP=-2:LRA=7:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
  MI=$(echo "$J" | python3 -c "import json,sys;d=json.load(sys.stdin);print(f\"measured_I={d['input_i']}:measured_TP={d['input_tp']}:measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:offset={d['target_offset']}\")")
  ffmpeg -loglevel error -y -ss $2 -t $D -i $R/$1.mov -an -vf "crop=1080:1080:$4:0,fps=30,format=yuv420p" -frames:v $N -c:v libx264 -crf 16 -preset fast n$i.mov
  ffmpeg -loglevel error -y -ss $2 -i $R/$1.mov -vn -af "atrim=end=$D,$CLEAN,loudnorm=I=-16:TP=-2:LRA=7:$MI:linear=true,aresample=48000,asetpts=N/SR/TB,apad,atrim=end_sample=$(python3 -c "print(round($D*48000))")" -ac 2 -c:a pcm_s16le n$i.wav
  i=$((i+1))
done
d() { ffprobe -v error -select_streams v -show_entries stream=duration -of csv=p=0 $1; }
o1=$(python3 -c "print($(d n0.mov)-$XF)"); o2=$(python3 -c "print($o1+$(d n1.mov)-$XF)"); o3=$(python3 -c "print($o2+$(d n2.mov)-$XF)")
ffmpeg -loglevel error -y -i n0.mov -i n1.mov -i n2.mov -i n3.mov -i n0.wav -i n1.wav -i n2.wav -i n3.wav -filter_complex \
 "[0:v][1:v]xfade=transition=fade:duration=$XF:offset=$o1[v1];[v1][2:v]xfade=transition=fade:duration=$XF:offset=$o2[v2];[v2][3:v]xfade=transition=fade:duration=$XF:offset=$o3[v];\
  [4:a][5:a]acrossfade=d=$XF[a1];[a1][6:a]acrossfade=d=$XF[a2];[a2][7:a]acrossfade=d=$XF[a]" \
 -map "[v]" -map "[a]" -c:v libx264 -crf 16 -preset fast -c:a aac -b:a 192k ../public/panel.mp4
ffprobe -v error -show_entries stream=codec_type,duration -of csv=p=0 ../public/panel.mp4
