#!/bin/bash
cd ~/flowstas/src
rm -rf .vercel
vercel link --yes --project flowstas-app
vercel --prod
