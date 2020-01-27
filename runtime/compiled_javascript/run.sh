#!/bin/sh
base=$(dirname "$0")
# cd "$base" && time node compile.js > test.js && time node --inspect test.js
cd "$base" && time node compile.js > test.js && time node test.js
