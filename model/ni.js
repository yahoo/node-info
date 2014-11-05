/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/* jshint camelcase: false */
'use strict';

// require all the libs
var ri = require('read-installed');
var tt = require('timethat');
var path = require('path');
var gitURL = require('github-url-from-git');
var readJSON = require('read-package-json');

/**
 * Data Access Object to handle the node pkgs, system info
 * @module NodeInfo
 */

/**
 * NodeInfo (node info) constructor to handle the info
 *
 * @class NodeInfo
 * @constructor
 * @param {Object} req node express request object
 */
var NodeInfo = function (req) {
     this.request = req;
};

/**
 * get all the installed node modules info
 *
 * @method getModulesInfo
 * @param {String} f the folder to be traversed
 * @param {Function} cb a callback
 */
NodeInfo.prototype.getModulesInfo = function (f, cb) {
    var options = { dev: false, depth: 1 },
        resp, 
        depsList, 
        devDepsList, 
        deps,
        devDeps,
        selfInfo,
        pkg,
        defaultString = '-';

        // read all the modules in the given directory
        ri(f, options, function (err, data) {
            deps = data.dependencies || null;

            if (!deps) {

                // return the response
                cb(err, null);
                return;
            }

            devDeps = data.devDependencies;
            resp = []; 
            depsList = []; 
            devDepsList = []; 

              Object.keys(deps).forEach(function (key) {
                pkg = {
                    name: deps[key].name,
                    description: deps[key].description,
                    version: deps[key].version,
                    homepage: deps[key].homepage || defaultString,
                    author: deps[key].author,
                    bugs: deps[key].bugs || defaultString,
                    repository: deps[key].repository,
                    license: deps[key].license || defaultString,
                    dependencies: deps[key].dependencies,
                    dist: deps[key].dependencies.dist
                };

                // convert git:// form url to github URL
                if (pkg.repository && pkg.repository.url) {
                    pkg.repository.url = gitURL(pkg.repository.url, null);
                }

                if (!devDeps[pkg.name]) {
                    pkg.deps = true;
                    depsList.push(pkg);
                } else {
                    pkg.dev = true;
                    devDepsList.push(pkg);
                }
            });

            depsList = this.compare(depsList);
            devDepsList = this.compare(devDepsList);

            // add this package info if exists
            readJSON(path.join(process.cwd(), 'package.json'), console.error, false, function (err, pkg) {
                if (!err) {
                    selfInfo = {
                        name: pkg.name,
                        description: pkg.description,
                        version: pkg.version,
                        homepage: pkg.homepage || defaultString,
                        author: pkg.author,
                        bugs: pkg.bugs || defaultString,
                        repository: pkg.repository || defaultString,
                        license: pkg.license || defaultString,
                        selfPkg: true
                    };
                    depsList.unshift(selfInfo); 
                }
                resp = { pkgs: depsList.concat(devDepsList) };
                cb(err, resp);
            }.bind(this));
    }.bind(this));
};

/**
 * compare the objects
 *
 * @method compare
 * @param {Boolean} Boolean 
 */
NodeInfo.prototype.compare = function (obj) {
    obj.sort(function (a, b) {
        if (a.name > b.name) {
            return 1;
        }
        if (a.name < b.name) {
            return -1;
        }

        // a must be equal to b
        return 0;
    });

    return obj;
};

/**
 * get the system info
 *
 * @method getSystemInfo
 * @param {Function} cb callback
 */
NodeInfo.prototype.getSystemInfo = function (cb) {
    var sys = [],
        info,
        proc = process,
        os = require('os'),
        cpu,
        memv8,
        MB = 1024 * 1000,
        GB = MB * 1000,
        defaultString = '-';

    // filter out the required process info
    info = { 
        version: proc.version.replace(/^[v|V]/, ""),
        path: proc.env.NODE_PATH || defaultString,
        user: proc.env.USER || defaultString,
        lang: proc.env.LANG || defaultString,
        platform: proc.platform || defaultString,
        uptime: tt.calc(Date.now() - (proc.uptime() * 1000)),
        arch: proc.arch || defaultString,
        pid: proc.pid || defaultString,
        memv8: proc.memoryUsage()
    };
    
    memv8 = {
        rss: Math.round(info.memv8.rss/MB),
        heapUsed: Math.round(info.memv8.heapUsed/MB),
        heapTotal: Math.round(info.memv8.heapTotal/MB)
    };
    info.memv8 = memv8;

    sys.push({ proc: info });

    // filter out the required OS info
    cpu = os.cpus(); 
    info = {
        totalmem: Math.round(os.totalmem()/GB),
        freemem: Math.round(os.freemem()/GB),
        core: cpu.length,
        model: cpu[0].model,
        speed: cpu[0].speed,
        hostname: os.hostname()
    };
    sys.push({ os: info });

    // return the response
    cb(null, { sys: sys });
};

// export the NodeInfo module
 module.exports = function (req) {
     return new NodeInfo(req);
 };
