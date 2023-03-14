#!/bin/bash
echo "Stop NodeJS App:"
echo "  [+] Enter directory and run stop script"
cd /home/ubuntu/mrmugshots/admin-site/current/bundle && forever stop /home/ubuntu/mrmugshots/admin-site/current/bundle/main.js || true
