#!/bin/bash
cd ~/flowstas
git remote set-url origin https://github.com/timothymatudi/flowstas.git
git add -A -- ':!src/node_modules'
git commit -m "Rename project to flowstas"
git push -u origin main
