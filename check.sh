#!/bin/bash
cd ~/flowstas/src
vercel inspect --logs $(vercel ls --json 2>/dev/null | head -1) 2>/dev/null || vercel ls v0-stripe-api-keys
