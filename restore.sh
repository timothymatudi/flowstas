#!/bin/bash
cd ~/flowstas
git add src/next.config.mjs
git commit -m "Fix turbopack root for Vercel build"
git push origin main
cd src
vercel --prod --force 2>&1
