#!/usr/bin/env bash

while [[ $# -gt 0 ]]; do
	case $1 in
	-w | --warmup)
		WARMUP="$2"
		shift # past argument
		shift # past value
		;;
	-m | --min-runs)
		MIN_RUNS="$2"
		shift # past argument
		shift # past value
		;;
	-M | --max-runs)
		MAX_RUNS="$2"
		shift # past argument
		shift # past value
		;;
	--min-depth)
		MIN_DEPTH="$2"
		shift # past argument
		shift # past value
		;;
	-d | --max-depth)
		MAX_DEPTH="$2"
		shift # past argument
		shift # past value
		;;
	-s | --system)
		SYSTEM="$2"
		shift # past argument
		shift # past value
		;;
	--pcs | --parallel-conjunction-strategy)
		PARALLEL_CONJUNCTION_STRATEGY="$2"
		shift # past argument
		shift # past value
		;;
	--threaded)
		THREADED="yes"
		shift # past argument
		;;
	-w | --with-compiler)
		COMPILER="$2"
		shift # past argument
		shift # past value
		;;
	esac
done

# Resolve configuration
WARMUP="${WARMUP:-3}"
MIN_RUNS="${MIN_RUNS:-10}"
MAX_RUNS="${MAX_RUNS:-20}"
MIN_DEPTH="${MIN_DEPTH:-1}"
MAX_DEPTH="${MAX_DEPTH:-30}"
SYSTEM="${SYSTEM:-STLC}"
PARALLEL_CONJUNCTION_STRATEGY="${PARALLEL_CONJUNCTION_STRATEGY:-OF}"
THREADED="${THREADED:-no}"
COMPILER="${COMPILER:-ghc}"

# Derive the --with-compiler option
if [ "${COMPILER}" == "ghc" ]; then
	WITH_COMPILER=""
else
	WITH_COMPILER="--with-compiler=${COMPILER}"
fi

# Derive the GHC and RTS options
if [ "${THREADED}" == "yes" ]; then
	CABAL_OPTIONS="-f=+threaded"
	RTS_OPTIONS="-N"
elif [ "${THREADED}" == "no" ]; then
	CABAL_OPTIONS="-f=-threaded"
	RTS_OPTIONS=""
else
	echo "Error: Unexpected value THREADED='${THREADED}'"
	exit 1
fi

# Derive the output CSV filename
PREFIX="data/system=${SYSTEM}&pcs=${PARALLEL_CONJUNCTION_STRATEGY}&compiler=${COMPILER}&threaded=${THREADED}&parameters=${MIN_DEPTH}..${MAX_DEPTH}"
OUT_FILE="${PREFIX}.out"
CSV_FILE="${PREFIX}.csv"

# Print the configuration
echo "Running benchmark with configuration:"
echo
echo "WARMUP                        = ${WARMUP}"
echo "MIN_RUNS                      = ${MIN_RUNS}"
echo "MAX_RUNS                      = ${MAX_RUNS}"
echo "MIN_DEPTH                     = ${MIN_DEPTH}"
echo "MAX_DEPTH                     = ${MAX_DEPTH}"
echo "SYSTEM                        = ${SYSTEM}"
echo "PARALLEL_CONJUNCTION_STRATEGY = ${PARALLEL_CONJUNCTION_STRATEGY}"
echo "THREADED                      = ${THREADED}"
echo
echo "CABAL_OPTIONS                 = ${CABAL_OPTIONS}"
echo "RTS_OPTIONS                   = ${RTS_OPTIONS}"
echo "WITH_COMPILER                 = ${WITH_COMPILER}"
echo
echo "OUT_FILE                      = ${OUT_FILE}"
echo "CSV_FILE                      = ${CSV_FILE}"
echo

# Check if the output files exist
if [ -f "${OUT_FILE}" -a -f "${CSV_FILE}" ]; then
	echo "Warning: Benchmark skipped, output already files exist"
	exit 0
else
	# Clean any previous build
	echo "Cleaning any previous build artifacts..."
	cabal clean
	echo

	# Build the binary
	echo "Building binary for lets-list-all-programs..."
	cabal build -v0 ${WITH_COMPILER} lets-list-all-programs
	echo

	# Get to binary
	echo "Locating binary for lets-list-all-programs..."
	BIN=$(cabal list-bin -v0 ${WITH_COMPILER} lets-list-all-programs | head -n1)
	echo "Found: ${BIN}"
	echo

	# Run the benchmark
	hyperfine \
		--warmup="${WARMUP}" \
		--min-runs="${MIN_RUNS}" \
		--max-runs="${MAX_RUNS}" \
		--parameter-scan depth "${MIN_DEPTH}" "${MAX_DEPTH}" \
		--parameter-step-size 1 \
		--shell="none" \
		--export-csv="${CSV_FILE}" \
		--show-output \
		"${BIN} count --system="${SYSTEM}" --parallel-conjunction-strategy="${PARALLEL_CONJUNCTION_STRATEGY}" --depth={depth} +RTS ${RTS_OPTIONS} -RTS" |
		tee -a "${OUT_FILE}"
fi
