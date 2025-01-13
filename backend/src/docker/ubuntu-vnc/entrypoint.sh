#!/bin/bash
set -e

# Clean up any stale pid files
sudo rm -f /var/run/dbus/pid
sudo rm -f /var/run/dbus/system_bus_socket

# Start dbus daemon with sudo
sudo mkdir -p /var/run/dbus
sudo dbus-daemon --system --fork

# Start session dbus
export DBUS_SESSION_BUS_ADDRESS=$(dbus-daemon --session --fork --print-address)

# Ensure log directories exist with proper permissions
mkdir -p /tmp/x11vnc_logs /tmp/novnc_logs

# Start all VNC components
./start_all.sh
./novnc_startup.sh

echo "✨ VNC server is ready!"
echo "➡️  VNC server running on port 5900, noVNC on port 6080"

# Monitor logs in the background
tail -f /tmp/x11vnc_logs/x11vnc.log /tmp/novnc_logs/novnc.log &

# Keep the container running
tail -f /dev/null
