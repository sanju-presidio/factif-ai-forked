#!/bin/bash

set -e

export DISPLAY=:${DISPLAY_NUM}
export XDG_RUNTIME_DIR=/tmp/runtime-$USERNAME

# Create runtime directory
mkdir -p $XDG_RUNTIME_DIR
chmod 700 $XDG_RUNTIME_DIR

# Start Xvfb
./xvfb_startup.sh

# Start window manager and panel
./mutter_startup.sh
sleep 2
./tint2_startup.sh

# Start PCManFM for desktop icons
pcmanfm --desktop &
sleep 1

# Start VNC server
./x11vnc_startup.sh
