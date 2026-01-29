#!/bin/bash
# Build PDF and EPUB from AsciiDoc source files
# Uses Asciidoctor (https://asciidoctor.org)
set -e
cd "$(dirname "$0")/.."

# Paths
ASCIIDOCTOR="/opt/homebrew/lib/ruby/gems/3.4.0/bin/asciidoctor"
ASCIIDOCTOR_PDF="/opt/homebrew/lib/ruby/gems/3.4.0/bin/asciidoctor-pdf"
ADOC_DIR="asciidoc"
OUTPUT_DIR="output"
BOOK_FILE="${ADOC_DIR}/book.adoc"

# Parse arguments
FORMAT="all"
VERBOSE=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --pdf) FORMAT="pdf"; shift ;;
    --epub) FORMAT="epub"; shift ;;
    --html) FORMAT="html"; shift ;;
    -v|--verbose) VERBOSE="-v"; shift ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --pdf      Build PDF only"
      echo "  --epub     Build EPUB only"
      echo "  --html     Build HTML only"
      echo "  -v         Verbose output"
      echo "  -h         Show this help"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "=== AsciiDoc Build ==="
echo "Format: $FORMAT"
echo ""

# Check for book.adoc or use test.adoc
if [[ ! -f "$BOOK_FILE" ]]; then
  echo "Note: No book.adoc found. Using test.adoc for demonstration."
  BOOK_FILE="${ADOC_DIR}/test.adoc"
fi

if [[ ! -f "$BOOK_FILE" ]]; then
  echo "Error: No AsciiDoc file found at $BOOK_FILE"
  exit 1
fi

# Build PDF
build_pdf() {
  echo "Building PDF..."
  $ASCIIDOCTOR_PDF $VERBOSE \
    -a pdf-theme=default \
    -a pdf-fontsdir=/opt/homebrew/lib/ruby/gems/3.4.0/gems/asciidoctor-pdf-2.3.24/data/fonts \
    -o "${OUTPUT_DIR}/the-meta-engineer.pdf" \
    "$BOOK_FILE"

  if [[ -f "${OUTPUT_DIR}/the-meta-engineer.pdf" ]]; then
    size=$(ls -lh "${OUTPUT_DIR}/the-meta-engineer.pdf" | awk '{print $5}')
    echo "  PDF created: ${OUTPUT_DIR}/the-meta-engineer.pdf ($size)"
  fi
}

# Build HTML
build_html() {
  echo "Building HTML..."
  $ASCIIDOCTOR $VERBOSE \
    -b html5 \
    -a toc=left \
    -a toclevels=3 \
    -a source-highlighter=rouge \
    -o "${OUTPUT_DIR}/the-meta-engineer.html" \
    "$BOOK_FILE"

  if [[ -f "${OUTPUT_DIR}/the-meta-engineer.html" ]]; then
    size=$(ls -lh "${OUTPUT_DIR}/the-meta-engineer.html" | awk '{print $5}')
    echo "  HTML created: ${OUTPUT_DIR}/the-meta-engineer.html ($size)"
  fi
}

# Build EPUB (requires asciidoctor-epub3)
build_epub() {
  if command -v asciidoctor-epub3 &> /dev/null; then
    echo "Building EPUB..."
    asciidoctor-epub3 $VERBOSE \
      -o "${OUTPUT_DIR}/the-meta-engineer.epub" \
      "$BOOK_FILE"

    if [[ -f "${OUTPUT_DIR}/the-meta-engineer.epub" ]]; then
      size=$(ls -lh "${OUTPUT_DIR}/the-meta-engineer.epub" | awk '{print $5}')
      echo "  EPUB created: ${OUTPUT_DIR}/the-meta-engineer.epub ($size)"
    fi
  else
    echo "  Skipping EPUB: asciidoctor-epub3 not installed"
    echo "  Install with: gem install asciidoctor-epub3"
  fi
}

# Execute builds
case $FORMAT in
  pdf) build_pdf ;;
  html) build_html ;;
  epub) build_epub ;;
  all)
    build_pdf
    build_html
    build_epub
    ;;
esac

echo ""
echo "=== Build Complete ==="
ls -la "$OUTPUT_DIR"/ 2>/dev/null || echo "No output files generated"
