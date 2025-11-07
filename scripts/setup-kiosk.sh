#!/bin/bash
# Setup script for Raspberry Pi kiosk mode

# Install Chromium
sudo apt-get update
sudo apt-get install -y chromium-browser unclutter

# Create autostart entry
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/kiosk.desktop << EOF
[Desktop Entry]
Type=Application
Name=STRM Display
Exec=chromium-browser --kiosk --disable-infobars http://localhost:8080
EOF

# Disable screen blanking
sudo sed -i 's/#xserver-command=X/xserver-command=X -s 0 -dpms/' /etc/lightdm/lightdm.conf

echo "Kiosk mode setup complete. Reboot to start."

