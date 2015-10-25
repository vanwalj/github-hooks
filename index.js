'use strict';

const crypto = require('crypto');
const child_process = require('child_process');

const _ = require('lodash');
const Koa = require('koa');
const koaBody = require('koa-body');
const app = new Koa();
const config = require('./config');

const hmac = crypto.createHmac('sha1', process.env.GITHUB_SECRET);
const calculatedSignature = 'sha1=' + hmac.digest('hex');

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
    try {
        hmac.update(JSON.stringify(payload));
    } catch (e) {
        console.error(e);
        this.throw(400);
    }
    const calculatedSignature = `sha1=${ hmac.digest('hex') }`;
    this.assert(calculatedSignature === this.get('x-hub-signature'), 400);

    const repo = _.get(this.request.body, 'repository.full_name');
    const ref = _.get(this.request.body, 'ref');
    this.assert(repo && ref, 400);

    const exe = _.get(config, [repo, ref]);
    this.assert(exe && exe.file, 400);

    yield exec(exe);
    this.status = 200;
    yield next;
});

app.listen(process.env.PORT, function () {
    console.log('listening on', process.env.PORT);
});
