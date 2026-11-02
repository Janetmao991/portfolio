#!/bin/zsh
# Makes a .webp (1360px wide = 2x the 680px stage card, <= 250 KB) next to every screen PNG.
cd "${0:A:h}/../../assets/screens"
for f in *.png; do
  for q in 82 74 66 58 50; do
    cwebp -quiet -q $q -resize 1360 0 -m 6 "$f" -o "${f%.png}.webp"
    [ $(stat -f%z "${f%.png}.webp") -le 256000 ] && break
  done
  echo "${f%.png}.webp q$q $(( $(stat -f%z "${f%.png}.webp") / 1024 ))KB"
done
