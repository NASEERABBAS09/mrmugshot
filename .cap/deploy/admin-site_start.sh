#!/bin/bash
echo "Start NodeJS App:"
echo "  [+] Enter directory && install npm"
cd /home/ubuntu/mrmugshots/admin-site/current/bundle/programs/server && npm install --production
echo "  [+] Run Meteor script"
cd /home/ubuntu/mrmugshots/admin-site/current/bundle && PORT=4006 MONGO_URL=mongodb://localhost:27017/lawdawgs ROOT_URL=http://54.187.160.255 METEOR_SETTINGS=$(cat /home/ubuntu/mrmugshots/admin-site/shared/settings-production.json) forever start -a -l /home/ubuntu/mrmugshots/admin-site/shared/log/production.log -e /home/ubuntu/mrmugshots/admin-site/shared/log/error.log --pidFile /home/ubuntu/mrmugshots/admin-site/shared/tmp/pids/app.pid /home/ubuntu/mrmugshots/admin-site/current/bundle/main.js
