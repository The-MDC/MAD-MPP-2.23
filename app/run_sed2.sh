#!/bin/bash
find /app/src/main/java -name "*.kt" -exec sed -i \
  -e 's/blurRadius = 24f/blurRadius = 16f/g' \
  -e 's/blurRadius = 16f/blurRadius = 11f/g' \
  -e 's/blurRadius = 12f/blurRadius = 8f/g' \
  -e 's/blurRadius = 8f/blurRadius = 5f/g' {} +
echo "Done"
