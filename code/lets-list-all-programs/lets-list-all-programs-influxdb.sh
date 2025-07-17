#!/bin/sh -e

# Set the eventlog socket
export GHC_EVENTLOG_SOCKET="/tmp/lets_list_all_programs_eventlog.sock"

# Build lets-list-all-programs
echo "Build lets-list-all-programs"
cabal build lets-list-all-programs -w${HOME}/Projects/ghc/_build/stage1/bin/ghc

# Install cleanup handler
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

# Run oddball
echo "Start lets-list-all-programs"
LLAP_BIN=$(cabal list-bin lets-list-all-programs -v0 -w${HOME}/Projects/ghc/_build/stage1/bin/ghc | head -n1)
"${LLAP_BIN}" \
    count \
    --eventlog-socket "$GHC_EVENTLOG_SOCKET" \
    --system=Fw \
    --depth=25 \
    +RTS -l -hT --eventlog-flush-interval=1 -RTS \
    &
LLAP_PID=$!

# Run eventlog-influxdb
# NOTE: The purpose of 'sleep 5' is to give the oddball process
#       sufficient time to create the Unix socket.
echo "Start eventlog-influxdb"
sleep 5 && eventlog-influxdb-with-event-marker \
    --eventlog-socket "$GHC_EVENTLOG_SOCKET" \
    -hT \
    --influxdb-host=localhost \
    --influxdb-database=eventlog \
    --influxdb-username=admin \
    --influxdb-password=admin

# Wait for oddball to finish
wait $LLAP_PID
