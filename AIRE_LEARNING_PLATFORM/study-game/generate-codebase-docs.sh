#!/bin/bash

# Set the output file
OUTPUT_FILE="../AIRE_LEARNING_PLATFORM-codebase.md"

# Function to get file type and corresponding markdown syntax
get_file_type() {
  local file=$1
  local extension="${file##*.}"
  
  case "$extension" in
    js)
      echo "javascript"
      ;;
    json)
      echo "json"
      ;;
    html)
      echo "html"
      ;;
    css)
      echo "css"
      ;;
    md)
      echo "markdown"
      ;;
    *)
      echo "plaintext"
      ;;
  esac
}

# Start building the markdown file
echo "# AIRE Learning Platform Codebase Documentation" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "Generated on $(date)" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "## Table of Contents" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Create the table of contents first
echo "Building table of contents..."

# Core configuration files
echo "- [Core Configuration Files](#core-configuration-files)" >> "$OUTPUT_FILE"
for file in ./vercel.json ./package.json ./tailwind.config.js ./postcss.config.js ./.nvmrc; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    anchor=$(echo "$filename" | tr '.' '-')
    echo "  - [$filename](#$anchor)" >> "$OUTPUT_FILE"
  fi
done

# Main application files
echo "- [Main Application Files](#main-application-files)" >> "$OUTPUT_FILE"
for file in ./index.js ./src/server.js; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    path_part=$(dirname "$file" | tr './' '-')
    anchor="$path_part-$filename"
    if [ "$path_part" = "-" ]; then
      anchor="$filename"
    fi
    echo "  - [$file](#$anchor)" >> "$OUTPUT_FILE"
  fi
done

# Frontend files
echo "- [Frontend Files](#frontend-files)" >> "$OUTPUT_FILE"
find ./src/public -type f -name "*.html" -o -name "*.js" -o -name "*.css" | sort | while read -r file; do
  filename=$(basename "$file")
  path_part=$(dirname "$file" | tr './' '-')
  anchor="$path_part-$filename"
  echo "  - [$file](#$anchor)" >> "$OUTPUT_FILE"
done

# Learning modules
echo "- [Learning Modules](#learning-modules)" >> "$OUTPUT_FILE"
find ./src/learning -type f -name "*.json" | sort | while read -r file; do
  filename=$(basename "$file")
  path_part=$(dirname "$file" | tr './' '-')
  anchor="$path_part-$filename"
  echo "  - [$file](#$anchor)" >> "$OUTPUT_FILE"
done

# Utility scripts
echo "- [Utility Scripts](#utility-scripts)" >> "$OUTPUT_FILE"
find ./src/scripts ./src/utils -type f -name "*.js" | sort | while read -r file; do
  filename=$(basename "$file")
  path_part=$(dirname "$file" | tr './' '-')
  anchor="$path_part-$filename"
  echo "  - [$file](#$anchor)" >> "$OUTPUT_FILE"
done

# Now add the actual file contents
echo "" >> "$OUTPUT_FILE"

# Core configuration files
echo "## Core Configuration Files" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
for file in ./vercel.json ./package.json ./tailwind.config.js ./postcss.config.js ./.nvmrc; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "### $filename" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "File path: \`$file\`" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    filetype=$(get_file_type "$file")
    echo '```'"$filetype" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  fi
done

# Main application files
echo "## Main Application Files" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
for file in ./index.js ./src/server.js; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "### $file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    echo "File path: \`$file\`" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    filetype=$(get_file_type "$file")
    echo '```'"$filetype" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo '```' >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  fi
done

# Frontend files
echo "## Frontend Files" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
find ./src/public -type f -name "*.html" -o -name "*.js" -o -name "*.css" | sort | while read -r file; do
  filename=$(basename "$file")
  echo "### $file" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  echo "File path: \`$file\`" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  filetype=$(get_file_type "$file")
  echo '```'"$filetype" >> "$OUTPUT_FILE"
  cat "$file" >> "$OUTPUT_FILE"
  echo '```' >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
done

# Learning modules
echo "## Learning Modules" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
find ./src/learning -type f -name "*.json" | sort | while read -r file; do
  filename=$(basename "$file")
  echo "### $file" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  echo "File path: \`$file\`" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  filetype=$(get_file_type "$file")
  echo '```'"$filetype" >> "$OUTPUT_FILE"
  cat "$file" >> "$OUTPUT_FILE"
  echo '```' >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
done

# Utility scripts
echo "## Utility Scripts" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
find ./src/scripts ./src/utils -type f -name "*.js" | sort | while read -r file; do
  filename=$(basename "$file")
  echo "### $file" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  echo "File path: \`$file\`" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
  filetype=$(get_file_type "$file")
  echo '```'"$filetype" >> "$OUTPUT_FILE"
  cat "$file" >> "$OUTPUT_FILE"
  echo '```' >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"
done

echo "Codebase documentation has been generated at $OUTPUT_FILE"

# Now update the main documentation file
DOC_FILE="../AIRE_LEARNING_PLATFORM-documentation.md"

# Append the documentation reference
cat << EOF >> "$DOC_FILE"

## Chapter 9: Complete Codebase Documentation 📖

A comprehensive documentation of the entire codebase has been generated in the file [AIRE_LEARNING_PLATFORM-codebase.md](./AIRE_LEARNING_PLATFORM-codebase.md). This file contains all code files with proper syntax highlighting and organization.

To regenerate this documentation after code changes, run the following command from the study-game directory:

\`\`\`bash
./generate-codebase-docs.sh
\`\`\`

This will update the codebase documentation with the latest code.
EOF

echo "Documentation reference added to $DOC_FILE"

# Make script executable
chmod +x generate-codebase-docs.sh 