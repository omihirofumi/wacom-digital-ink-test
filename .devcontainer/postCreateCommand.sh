#!/usr/bin/env bash

sudo apt update
sudo apt-get install -y libxi-dev libpango1.0-dev libcairo2-dev libgl1-mesa-dev pkg-config
pnpm config set store-dir /tmp/pnpm/store
pnpm i
