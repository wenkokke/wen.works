#!/usr/bin/env bash

################################################################################
# STLC
################################################################################

################################################################################
# STLC - threaded

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 20 \
	--min-depth 1 \
	--max-depth 30 \
	--system "STLC" \
	--parallel-conjunction-strategy "O" \
	--threaded

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 20 \
	--min-depth 1 \
	--max-depth 30 \
	--system "STLC" \
	--parallel-conjunction-strategy "OF" \
	--threaded

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 20 \
	--min-depth 1 \
	--max-depth 30 \
	--system "STLC" \
	--parallel-conjunction-strategy "OSF" \
	--threaded

################################################################################
# STLC - non-threaded

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 20 \
	--min-depth 1 \
	--max-depth 30 \
	--system "STLC" \
	--parallel-conjunction-strategy "O"

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 20 \
	--min-depth 1 \
	--max-depth 30 \
	--system "STLC" \
	--parallel-conjunction-strategy "OF"

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 20 \
	--min-depth 1 \
	--max-depth 30 \
	--system "STLC" \
	--parallel-conjunction-strategy "OSF"

################################################################################
# STLLC
################################################################################

################################################################################
# STLLC - threaded

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 20 \
	--min-depth 1 \
	--max-depth 30 \
	--system "STLLC" \
	--parallel-conjunction-strategy "O" \
	--threaded

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 20 \
	--min-depth 1 \
	--max-depth 30 \
	--system "STLLC" \
	--parallel-conjunction-strategy "OF" \
	--threaded

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 20 \
	--min-depth 1 \
	--max-depth 30 \
	--system "STLLC" \
	--parallel-conjunction-strategy "OSF" \
	--threaded

################################################################################
# STLLC - non-threaded

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 20 \
	--min-depth 1 \
	--max-depth 30 \
	--system "STLLC" \
	--parallel-conjunction-strategy "O"

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 20 \
	--min-depth 1 \
	--max-depth 30 \
	--system "STLLC" \
	--parallel-conjunction-strategy "OF"

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 20 \
	--min-depth 1 \
	--max-depth 30 \
	--system "STLLC" \
	--parallel-conjunction-strategy "OSF"

################################################################################
# STRLC
################################################################################

################################################################################
# STRLC - threaded

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 20 \
	--min-depth 1 \
	--max-depth 30 \
	--system "STRLC" \
	--parallel-conjunction-strategy "O" \
	--threaded

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 20 \
	--min-depth 1 \
	--max-depth 30 \
	--system "STRLC" \
	--parallel-conjunction-strategy "OF" \
	--threaded

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 20 \
	--min-depth 1 \
	--max-depth 30 \
	--system "STRLC" \
	--parallel-conjunction-strategy "OSF" \
	--threaded

################################################################################
# STRLC - non-threaded

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 20 \
	--min-depth 1 \
	--max-depth 30 \
	--system "STRLC" \
	--parallel-conjunction-strategy "O"

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 20 \
	--min-depth 1 \
	--max-depth 30 \
	--system "STRLC" \
	--parallel-conjunction-strategy "OF"

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 20 \
	--min-depth 1 \
	--max-depth 30 \
	--system "STRLC" \
	--parallel-conjunction-strategy "OSF"

################################################################################
# Fw
################################################################################

################################################################################
# Fw - threaded

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 10 \
	--min-depth 1 \
	--max-depth 22 \
	--system "Fw" \
	--parallel-conjunction-strategy "O" \
	--threaded

./benchmark.sh \
	--warmup 0 \
	--min-runs 1 \
	--max-runs 1 \
	--min-depth 23 \
	--max-depth 30 \
	--system "Fw" \
	--parallel-conjunction-strategy "O" \
	--threaded

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 10 \
	--min-depth 1 \
	--max-depth 22 \
	--system "Fw" \
	--parallel-conjunction-strategy "OF" \
	--threaded

./benchmark.sh \
	--warmup 0 \
	--min-runs 1 \
	--max-runs 1 \
	--min-depth 23 \
	--max-depth 30 \
	--system "Fw" \
	--parallel-conjunction-strategy "OF" \
	--threaded

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 10 \
	--min-depth 1 \
	--max-depth 22 \
	--system "Fw" \
	--parallel-conjunction-strategy "OSF" \
	--threaded

./benchmark.sh \
	--warmup 0 \
	--min-runs 1 \
	--max-runs 1 \
	--min-dept 23 \
	--max-depth 30 \
	--system "Fw" \
	--parallel-conjunction-strategy "OSF" \
	--threaded

################################################################################
# Fw - non-threaded

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 10 \
	--min-depth 1 \
	--max-depth 22 \
	--system "Fw" \
	--parallel-conjunction-strategy "O"

./benchmark.sh \
	--warmup 0 \
	--min-runs 1 \
	--max-runs 1 \
	--min-depth 23 \
	--max-depth 30 \
	--system "Fw" \
	--parallel-conjunction-strategy "O"

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 10 \
	--min-depth 1 \
	--max-depth 22 \
	--system "Fw" \
	--parallel-conjunction-strategy "OF"

./benchmark.sh \
	--warmup 0 \
	--min-runs 1 \
	--max-runs 1 \
	--min-depth 23 \
	--max-depth 30 \
	--system "Fw" \
	--parallel-conjunction-strategy "OF"

./benchmark.sh \
	--warmup 3 \
	--min-runs 1 \
	--max-runs 10 \
	--min-depth 1 \
	--max-depth 22 \
	--system "Fw" \
	--parallel-conjunction-strategy "OSF"

./benchmark.sh \
	--warmup 0 \
	--min-runs 1 \
	--max-runs 1 \
	--min-dept 23 \
	--max-depth 30 \
	--system "Fw" \
	--parallel-conjunction-strategy "OSF"
