#!/bin/bash
# Fix broken repos and install Docker
set -e

echo "=== Fixing broken apt repositories ==="
echo ""

# Remove broken GitHub CLI repo (doesn't support noble yet)
echo "[1/7] Removing broken GitHub CLI repository..."
sudo rm -f /etc/apt/sources.list.d/github-cli.list 2>/dev/null || true
sudo rm -f /etc/apt/sources.list.d/github-cli.sources 2>/dev/null || true

# Remove broken AppImageLauncher PPA (doesn't support noble)
echo "[2/7] Removing broken AppImageLauncher repository..."
sudo rm -f /etc/apt/sources.list.d/appimagelauncher-team-ubuntu-stable-*.list 2>/dev/null || true
sudo add-apt-repository --remove ppa:appimagelauncher-team/stable -y 2>/dev/null || true

echo ""
echo "=== Installing Docker Engine ==="
echo ""

# Update apt (should work now)
echo "[3/7] Updating package lists..."
sudo apt-get update

# Install prerequisites
echo "[4/7] Installing prerequisites..."
sudo apt-get install -y ca-certificates curl

# Add Docker's official GPG key
echo "[5/7] Adding Docker's official GPG key..."
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the Docker repository (check if already exists)
echo "[6/7] Configuring Docker repository..."
if [ ! -f /etc/apt/sources.list.d/docker.list ]; then
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
fi

sudo apt-get update

# Install Docker Engine
echo "[7/7] Installing Docker Engine..."
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Post-installation
echo ""
echo "=== Post-installation configuration ==="
sudo groupadd docker 2>/dev/null || true
sudo usermod -aG docker $USER

sudo systemctl enable docker.service
sudo systemctl enable containerd.service
sudo systemctl start docker

# Configure log rotation
sudo mkdir -p /etc/docker
if [ ! -f /etc/docker/daemon.json ]; then
    echo '{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}' | sudo tee /etc/docker/daemon.json > /dev/null
    sudo systemctl restart docker
fi

echo ""
echo "=== Installation Complete ==="
docker --version
docker compose version
echo ""
echo "Run 'newgrp docker' or log out/in, then test with:"
echo "  docker run hello-world"
