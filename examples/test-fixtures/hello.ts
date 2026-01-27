#!/usr/bin/env bun
/**
 * Simple test script for verifying the exercise runner
 */

console.log("Hello from test fixture!")
console.log("Arguments:", Bun.argv.slice(2))
console.log("Timestamp:", new Date().toISOString())
