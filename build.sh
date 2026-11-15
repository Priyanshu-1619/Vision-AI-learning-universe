#!/usr/bin/env bash
# AI Learning Universe — Render Single-Service Unified Build Script
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "================================================================"
echo "  AI LEARNING UNIVERSE — UNIFIED RENDER BUILD PROCESS"
echo "================================================================"

echo "[1/4] Upgrading pip and installing Python dependencies..."
python -m pip install --upgrade pip
python -m pip install -r backend/requirements.txt

echo "[2/4] Installing frontend npm dependencies..."
cd frontend
npm ci || npm install

echo "[3/4] Building optimized production React/Vite assets..."
npm run build
cd ..

echo "[4/4] Verifying and priming concept knowledge database..."
python backend/scripts/enrich_concepts.py

echo "================================================================"
echo "  BUILD COMPLETE: Single-service application ready to launch!"
echo "================================================================"
