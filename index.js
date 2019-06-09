#!/usr/bin/env node

const { exec } = require('child_process')

exec(`
  cd android && ./gradlew assembleRelease
`, (err, stdout, stderr) => {
  console.log(stdout, stderr)
})
