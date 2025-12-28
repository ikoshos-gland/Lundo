#!/bin/bash
# Docker Engine Installation Script for Ubuntu
# Based on official Docker documentation (docs.docker.com/engine/install/ubuntu)
# Generated: 2025-12-27

set -e  # Exit on any error

echo "=== Docker Engine Installation Script ==="
echo ""

# Step 1: Remove conflicting packages
echo "[1/6] Removing any conflicting packages..."
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
    sudo apt-get remove -y $pkg 2>/dev/null || true
done

# Step 2: Install prerequisites
echo "[2/6] Installing prerequisites..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl

# Step 3: Add Docker's official GPG key
echo "[3/6] Adding Docker's official GPG key..."
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Step 4: Add the Docker repository
echo "[4/6] Adding Docker repository..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update

# Step 5: Install Docker Engine
echo "[5/6] Installing Docker Engine, CLI, and plugins..."
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Step 6: Post-installation configuration
echo "[6/6] Configuring Docker..."

# Add current user to docker group (allows running docker without sudo)
sudo groupadd docker 2>/dev/null || true
sudo usermod -aG docker $USER

# Enable Docker to start on boot
sudo systemctl enable docker.service
sudo systemctl enable containerd.service

# Start Docker now
sudo systemctl start docker

# Configure log rotation to prevent disk space issues
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
echo ""
echo "Docker version:"
docker --version
echo ""
echo "Docker Compose version:"
docker compose version
echo ""
echo "IMPORTANT: To use Docker without sudo, either:"
echo "  1. Log out and log back in, OR"
echo "  2. Run: newgrp docker"
echo ""
echo "To verify installation, run:"
echo "  docker run hello-world"
echo ""
