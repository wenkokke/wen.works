#!/usr/bin/env bash

while [[ $# -gt 0 ]]; do
    case $1 in
        -w|--warmup)
            WARMUP="$2"
            shift # past argument
            shift # past value
            ;;
        -m|--min-runs)
            MIN_RUNS="$2"
            shift # past argument
            shift # past value
            ;;
        -M|--max-runs)
            MAX_RUNS="$2"
            shift # past argument
            shift # past value
            ;;
        -d|--max-depth)
            MAX_DEPTH="$2"
            shift # past argument
            shift # past value
            ;;
        -s|--system)
            SYSTEM="$2"
            shift # past argument
            shift # past value
            ;;
    esac
done

# Build the binary
echo "Building binary for lets-list-all-programs..."
cabal build -v0 lets-list-all-programs
echo

# Get to binary
echo "Locating binary for lets-list-all-programs..."
BIN=$(cabal list-bin -v0 lets-list-all-programs | head -n1)
echo "Found: ${BIN}"
echo

# Resolve configuration
WARMUP="${WARMUP:-3}"
MIN_RUNS="${MIN_RUNS:-10}"
MAX_RUNS="${MAX_RUNS:-20}"
MAX_DEPTH="${MAX_DEPTH:-30}"
SYSTEM="${SYSTEM:-STLC}"

# Print the configuration
echo "Running benchmark with configuration:"
echo
echo "WARMUP    = ${WARMUP}"
echo "MIN_RUNS  = ${MIN_RUNS}"
echo "MAX_RUNS  = ${MAX_RUNS}"
echo "MAX_DEPTH = ${MAX_DEPTH}"
echo "SYSTEM    = ${SYSTEM}"
echo

# Run the benchmark
hyperfine \
    --warmup="${WARMUP}" \
    --min-runs="${MIN_RUNS}" \
    --max-runs="${MAX_RUNS}" \
    --parameter-scan depth 1 "${MAX_DEPTH}" \
    --parameter-step-size 1 \
    "${BIN} count --system="${SYSTEM}" --depth={depth}" \
    --export-csv="data/${SYSTEM}.csv" \
    --show-output >"data/${SYSTEM}.out"
