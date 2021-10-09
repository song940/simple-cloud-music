#!/usr/bin/env bash

NODE_ENV=production npm run build

git add .
git commit -m deploy
git push origin main
git subtree push --prefix public origin gh-pages