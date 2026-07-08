#!/bin/bash
# Extract a chapter from the Rust book PDF
# Usage: extract_chapter.sh <chapter_number> [output_file]
# Default output: content/books/rust程序设计/.extracted/chapter_<N>.txt

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
PDF="$PROJECT_ROOT/book_pdfs/Rust 程序设计(第2版).pdf"
EXTRACT_DIR="$PROJECT_ROOT/content/books/rust程序设计/.extracted"

# Page ranges for each chapter (start_page end_page)
declare -A PAGES
PAGES[1]="41 47"
PAGES[2]="48 103"
PAGES[3]="104 149"
PAGES[4]="150 180"
PAGES[5]="181 222"
PAGES[6]="223 260"
PAGES[7]="261 283"
PAGES[8]="284 335"
PAGES[9]="336 369"
PAGES[10]="370 402"
PAGES[11]="403 448"
PAGES[12]="449 472"
PAGES[13]="473 511"
PAGES[14]="512 540"
PAGES[15]="541 603"
PAGES[16]="604 657"
PAGES[17]="658 721"
PAGES[18]="722 758"
PAGES[19]="759 815"
PAGES[20]="816 892"
PAGES[21]="893 928"
PAGES[22]="929 978"
PAGES[23]="979 1020"

CHAPTER="${1:-}"
if [ -z "$CHAPTER" ] || [ -z "${PAGES[$CHAPTER]:-}" ]; then
    echo "Usage: $0 <chapter_number 1-23> [output_file]"
    echo "Available chapters: 1-23"
    exit 1
fi

OUTPUT="${2:-$EXTRACT_DIR/chapter_$CHAPTER.txt}"
mkdir -p "$EXTRACT_DIR"

read -r START END <<< "${PAGES[$CHAPTER]}"

echo "Extracting chapter $CHAPTER (pages $START-$END) ..."
pdftotext -layout -f "$START" -l "$END" "$PDF" "$OUTPUT"
echo "Done: $OUTPUT ($(wc -l < "$OUTPUT") lines)"
