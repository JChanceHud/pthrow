#!/usr/bin/env node

const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')
const s3 = require('s3');
const axios = require('axios')
const jwt = require('jwt-simple')

(async () => {
  try {
    console.log('Building release binary')
    await new Promise((rs, rj) => exec(`
      set -e
      test -d android || (echo "Unable to find android dir, run for rn project root" && exit 1)
      cd android
      ./gradlew assembleRelease
      `, (err, stdout, stderr) => {
        if (err) return rj(err)
        rs(stdout)
      }))
    const apkPath = path.join(process.cwd(), 'android/app/build/outputs/apk/release/app-release.apk')
    if (!fs.existsSync(apkPath)) {
      throw new Error('Unable to find built apk')
    }
    const filename = `${+new Date()}.apk`
    const client = s3.createClient({
      s3Options: {
        accessKeyId: process.env.PTHROW_ACCESS_ID,
        secretAccessKey: process.env.PTHROW_ACCESS_SECRET,
        s3BucketEndpoint: !!process.env.PTHROW_SPACE_ENDPOINT,
        endpoint: process.env.PTHROW_SPACE_ENDPOINT,
      }
    })
    await new Promise((rs, rj) => client.uploadFile({
      localFile: apkPath,
      s3Params: {
        Bucket: process.env.PTHROW_BUCKET,
        Key: filename,
        ACL: 'public-read',
      },
    }).on('end', () => {
      console.log('APK uploaded')
      rs()
    }).on('error', (err) => {
      console.log('Error uploading', err)
      process.exit(1)
    }))
    if (!process.env.TRAVIS_PULL_REQUEST) return
    const url = path.join(process.env.PTHROW_SPACE_ENDPOINT, filename)
    await axios.get(`https://pthrower.jchancehud.now.sh`, {
      params: {
        apkLink: url,
        pullNumber: process.env.TRAVIS_PULL_REQUEST,
        repoSlug: process.env.TRAVIS_REPO_SLUG,
      },
    })
  } catch (err) {
    console.log('Uncaught error', err)
    process.exit(1)
  }
})()
