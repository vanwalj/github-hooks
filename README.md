# Github hooks
A simple server that listen on Github push events and exec a script

## Why ??? 😱
At first, just needed something to continuously sync a GH repo to a S3 bucket, but without heavy/non-free tools 

## Usage
* Edit `config.json` and create your scripts
* Set `PORT` and `GITHUB_SECRET` environment variables
* run `npm install`
* run `npm start`