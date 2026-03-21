FROM python:3.11-slim

# Install ffmpeg (for video merging and MP3 conversion) and wget (for downloading binaries)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Download pre-compiled Rust PO Token provider binary
RUN wget -q -O /usr/local/bin/bgutil-pot \
    https://github.com/jim60105/bgutil-ytdlp-pot-provider-rs/releases/latest/download/bgutil-pot-linux-x86_64 && \
    chmod +x /usr/local/bin/bgutil-pot

# Download and install the Rust PO Token provider's yt-dlp plugin
RUN wget -q -O /tmp/pot-plugin.zip \
    https://github.com/jim60105/bgutil-ytdlp-pot-provider-rs/releases/latest/download/bgutil-ytdlp-pot-provider-rs.zip && \
    mkdir -p /app/yt_dlp_plugins/extractor && \
    cd /tmp && unzip -o pot-plugin.zip -d pot-plugin && \
    cp -r /tmp/pot-plugin/yt_dlp_plugins/extractor/*.py /app/yt_dlp_plugins/extractor/ && \
    rm -rf /tmp/pot-plugin /tmp/pot-plugin.zip

# Create downloads directory (fallback if not auto-generated)
RUN mkdir -p tempfiles

EXPOSE 10000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
