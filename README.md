# Automated APK distribution

A cli command to build the apk file run in the root of a react-native project.

This can be used to generate and distribute test links in pull request comments, discord, slack, text, wherever

## Usage

### CI

Ideally there's a script to build, locate and upload the apk 

`npx apkdist .`

Which would do something along the lines of 

```
#!/bin/sh
# Build the apk
cd android && ./gradlew assembleRelease
# Then locate it locally

```

in the ci for a react native project
