#!/usr/bin/env bun
/**
 * Test script that takes a long time (for timeout testing)
 */

console.log("Starting slow operation...")
await Bun.sleep(10000) // 10 seconds
console.log("Done!")
