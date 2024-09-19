# Gemini Prompt: My directory has a number of .gz files. I need to efficiently 
# uncompress them, upload them to gcs, then move the compressed file into 
# a separate folder. The uncompressed file should be deleted because I 
# don’t have enough local storage 

#!/bin/bash

# --- Configuration ---
COMPRESSED_DIR="<current path, e.g., /Users/williszhang/Projects>/gemini-med-lit-review/pubmed" # Directory containing .gz files
PROCESSED_DIR="$COMPRESSED_DIR/processed" # Directory to move processed .gz files
GCS_BUCKET="${PROJECT_ID}-datastore" # Your Google Cloud Storage bucket name

# --- Functions ---
process_file() {
  local file="$1"
  local filename=$(basename "$file")
  local filename_without_ext="${filename%.gz}"

  echo "Processing: $filename"

  # 1. Uncompress
  gunzip -c "$file" > "$filename_without_ext"

  # 2. Upload to GCS
  gsutil cp "$filename_without_ext" "gs://$GCS_BUCKET/"

  if [[ $? -eq 0 ]]; then # Check if upload was successful
    # 3. Move compressed file
    mv "$file" "$PROCESSED_DIR/"

    # 4. Delete uncompressed file
    rm "$filename_without_ext"
  else
    echo "Error uploading $filename to GCS. Skipping to next file."
  fi
}

# --- Main Script ---
# Iterate through all files in the current directory for deletion and
# clean up non-abstract files
for file in *
do
  # Check if the item is a file, not the script itself, 
  # and does NOT (begin with pubmed24 AND end in .gz)
  if [[ -f "$file" && "$file" != "$0" && ! ( "$file" == pubmed24*.gz ) ]]; then
    # Delete the file
    rm "$file"
  fi
done

# Create the processed directory if it doesn't exist
mkdir -p "$PROCESSED_DIR"

# Find all .gz files and process them
find "$COMPRESSED_DIR" -name "pubmed24*.gz" -print0 | while IFS= read -r -d $'\0' file; do
  process_file "$file"
done

echo "Processing complete."