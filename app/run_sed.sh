#!/bin/bash
cd /app/src/main/java/com/example/ui || exit 1
find . -type f -name "*.kt" -exec sed -i \
  -e '/FontWeight\.\(Bold\|ExtraBold\|Black\)/ s/FontFamily\.[A-Za-z]*/com.example.ui.theme.AllertaStencilFamily/g' \
  -e '/fontSize\s*=\s*1[4-9]\.sp/ s/FontFamily\.[A-Za-z]*/com.example.ui.theme.AllertaStencilFamily/g' \
  -e '/fontSize\s*=\s*[2-9][0-9]\.sp/ s/FontFamily\.[A-Za-z]*/com.example.ui.theme.AllertaStencilFamily/g' \
  -e 's/FontFamily\.[A-Za-z]*/com.example.ui.theme.ArialNarrowFamily/g' {} +
echo "Done"
