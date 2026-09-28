#!/usr/bin/env bash
set -euo pipefail

ROOT="public/offline-hadith"
rm -rf "$ROOT"
mkdir -p "$ROOT/ahmed" "$ROOT/fawaz" "$ROOT/toon" "public/hadith-covers"

BOOKS=(bukhari muslim abudawud tirmidhi nasai ibnmajah)
CHAPTERS=(97 56 43 49 52 37)
ENGLISH=(eng-bukhari eng-muslim eng-abudawud eng-tirmidhi eng-nasai eng-ibnmajah)
URDU=(urd-bukhari urd-muslim urd-abudawud urd-tirmidhi urd-nasai urd-ibnmajah)

download() {
  local url="$1" out="$2" required="$3"
  mkdir -p "$(dirname "$out")"
  if curl -fsSL --retry 3 --retry-delay 1 --connect-timeout 10 --max-time 60 "$url" -o "$out"; then
    test -s "$out"
  elif [ "$required" = "required" ]; then
    echo "Required download failed: $url" >&2
    exit 1
  else
    : > "$out"
  fi
}

jobs=0
for i in "${!BOOKS[@]}"; do
  book="${BOOKS[$i]}"
  max="${CHAPTERS[$i]}"
  eng="${ENGLISH[$i]}"
  urd="${URDU[$i]}"

  # Whole English editions are used for the offline collection list and global search.
  download "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${eng}.json" "$ROOT/fawaz/${eng}.json" required &
  download "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${eng}.min.json" "$ROOT/fawaz/${eng}.min.json" required &
  # Whole Urdu editions are kept for the chapter reader.
  download "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${urd}.json" "$ROOT/fawaz/${urd}.json" required &

  for n in $(seq 1 "$max"); do
    download "https://raw.githubusercontent.com/AhmedBaset/hadith-json/v1.2.0/db/by_chapter/the_9_books/${book}/${n}.json" "$ROOT/ahmed/${book}/${n}.json" required &
    download "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${eng}/sections/${n}.json" "$ROOT/fawaz/${eng}/sections/${n}.json" required &
    download "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${urd}/sections/${n}.json" "$ROOT/fawaz/${urd}/sections/${n}.json" required &
    download "https://cdn.jsdelivr.net/gh/HsnSaboor/hadith-api-toon@main/editions/${book}/sections/${n}.toon" "$ROOT/toon/${book}/sections/${n}.toon" required &
    download "https://cdn.jsdelivr.net/gh/HsnSaboor/hadith-api-toon@main/editions/${book}/translations/hi/sections/${n}.toon" "$ROOT/toon/${book}/translations/hi/sections/${n}.toon" optional &
    download "https://cdn.jsdelivr.net/gh/HsnSaboor/hadith-api-toon@main/editions/${book}/translations/roman-ur/sections/${n}.toon" "$ROOT/toon/${book}/translations/roman-ur/sections/${n}.toon" optional &
    jobs=$((jobs + 6))
    if [ "$jobs" -ge 24 ]; then wait; jobs=0; fi
  done
done
wait

# Book artwork is also bundled so the Hadith tab works without network.
declare -a COVER_URLS=(
  "https://commons.wikimedia.org/wiki/Special:FilePath/Sahih%20al-Bukhari.jpg"
  "https://commons.wikimedia.org/wiki/Special:FilePath/Sahih%20Muslim.jpg"
  "https://commons.wikimedia.org/wiki/Special:FilePath/Sunan%20Abi%20Dawud.jpg"
  "https://commons.wikimedia.org/wiki/Special:FilePath/Jami%20at-Tirmidhi.jpg"
  "https://commons.wikimedia.org/wiki/Special:FilePath/Sunan%20an-Nasa'i.jpg"
  "https://commons.wikimedia.org/wiki/Special:FilePath/Sunan%20Ibn%20Majah.jpg"
)
for i in "${!BOOKS[@]}"; do
  download "${COVER_URLS[$i]}" "public/hadith-covers/${BOOKS[$i]}.jpg" optional
done

# A deterministic marker lets CI verify that the offline package really exists.
printf '%s\n' "Muslim Ummah offline Hadith bundle: 6 collections, Arabic/English/Urdu + Hindi/Hinglish where upstream provides them." > "$ROOT/README.txt"
du -sh "$ROOT" public/hadith-covers
