@echo off
tsc -noImplicitAny -w -t ES5 %~dp0runtime.ts --out %~dp0runtime.js