'use strict';

const crypto = require('crypto');
const child_process = require('child_process');

const _ = require('lodash');
const Koa = require('koa');
const koaBody = require('koa-body');
const app = new Koa();
const config = require('./config');


app.use(koaBody());

function exec (exe) {
    return new Promise(function (resolve) {
        child_process.execFile(exe.file, exe.args, exe.options, function (err, res) {
            if (err) {
                throw err;
            }
            return resolve(res);
        });
    });
}

app.use(function *(next) {
    const payload = this.request.body;
    const hmac = crypto.createHmac('sha1', process.env.GITHUB_SECRET);
    try {
        hmac.update(JSON.stringify(payload));
    } catch (e) {
        this.throw(400, 'Unable to parse the request body');
    }
    const calculatedSignature = `sha1=${ hmac.digest('hex') }`;
    this.assert(calculatedSignature === this.get('x-hub-signature'), 400, 'Signatures dows not match');

    const repo = _.get(this.request.body, 'repository.full_name');
    const ref = _.get(this.request.body, 'ref');
    this.assert(repo && ref, 400, 'Unable to get repository full name and branch name');

    const exe = _.get(config, [repo, ref]);
    this.assert(exe && exe.file, 400, 'Unable to find a configuration for', repo, ref);

    yield exec(exe);
    this.status = 200;
    yield next;
});

app.listen(process.env.PORT, function () {
    console.log('listening on', process.env.PORT);
});
