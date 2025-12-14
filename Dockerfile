FROM node:20-slim

# Install Python and dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ghostscript \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy dependency files first for caching
COPY api/package*.json ./api/
COPY pdf-engine/requirements.txt ./pdf-engine/

# Install Node dependencies
WORKDIR /app/api
RUN npm install

# Install Python dependencies
WORKDIR /app
# --break-system-packages is needed for recent Debian/Ubuntu versions in Docker when installing globally
RUN pip3 install --no-cache-dir -r pdf-engine/requirements.txt --break-system-packages

# Copy source code
COPY api ./api
COPY pdf-engine ./pdf-engine
COPY shared ./shared

# Build API (Compile TypeScript)
WORKDIR /app/api
# Ensure we have access to tsc
RUN npm run build

# Expose port (Render sets PORT env, but we expose 4000 as default documentation)
EXPOSE 4000

# Start
CMD ["npm", "start"]
