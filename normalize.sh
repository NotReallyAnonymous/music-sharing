#!/usr/bin/env bash
set -uo pipefail

MUSIC_DIR="$(cd "$(dirname "$0")/music" && pwd)"
LOUDNORM="loudnorm=I=-16:TP=-1.5:LRA=11"
SUCCESS=0
FAIL=0

# Use process substitution (not a pipe) so the loop runs in the current shell
# and ffmpeg doesn't inherit stdin from the find pipeline.
# -print0 / read -d '' handles filenames with spaces and special characters.
while IFS= read -r -d '' FILE; do
  echo "Processing: ${FILE#$MUSIC_DIR/}"

  # 1. Preserve mtime
  MTIME=$(stat -c "%y" "$FILE")

  # 2. Detect original sample rate
  SAMPLE_RATE=$(ffprobe -v quiet -select_streams a:0 \
    -show_entries stream=sample_rate -of csv=p=0 "$FILE")

  TMP="${FILE}.normalizing.wav"

  # 3. Normalize — redirect stdin from /dev/null so ffmpeg doesn't go interactive
  if ffmpeg -y -nostdin \
      -i "$FILE" \
      -af "$LOUDNORM" \
      -map_metadata 0 \
      -c:a pcm_s16le \
      -ar "$SAMPLE_RATE" \
      -f wav \
      "$TMP" \
      -loglevel error; then

    # 4. Replace original
    mv "$TMP" "$FILE"

    # 5. Restore mtime exactly
    touch -m -d "$MTIME" "$FILE"

    echo "  ✓ done"
    SUCCESS=$((SUCCESS + 1))
  else
    rm -f "$TMP"
    echo "  ✗ FAILED" >&2
    FAIL=$((FAIL + 1))
  fi

done < <(find "$MUSIC_DIR" -type f -iname "*.wav" -print0 | sort -z)

echo ""
echo "Done. Success: $SUCCESS  Failed: $FAIL"
