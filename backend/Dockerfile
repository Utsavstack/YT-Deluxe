FROM python:3.11-slim

# Install ffmpeg (required for video merging and MP3 conversion) and nodejs for PO token generation
RUN apt-get update && apt-get install -y \
    ffmpeg \
    nodejs \
    npm \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Compile the token generator locally on container
RUN git clone --single-branch --branch 1.3.1 https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git && \
    cd bgutil-ytdlp-pot-provider/server && \
    npm ci && \
    npx tsc

# Create downloads directory (fallback if not auto-generated)
RUN mkdir -p tempfiles

EXPOSE 10000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]
