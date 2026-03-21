FROM python:3.11-slim

# Install ffmpeg (for video merging and MP3 conversion) and wget (for downloading Rust binary)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Download pre-compiled Rust PO Token provider binary
# NOTE: No external yt-dlp plugin needed — yt-dlp 2026.3.17+ has built-in PO token support
# The binary runs as HTTP server on port 4416, yt-dlp auto-detects it
RUN wget -q -O /usr/local/bin/bgutil-pot \
    https://github.com/jim60105/bgutil-ytdlp-pot-provider-rs/releases/latest/download/bgutil-pot-linux-x86_64 && \
    chmod +x /usr/local/bin/bgutil-pot

# Create required directories
RUN mkdir -p tempfiles secrets_runtime

EXPOSE 10000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
