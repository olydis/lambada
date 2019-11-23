#!/bin/sh
time node compile.js > test.js && time node --inspect test.js
