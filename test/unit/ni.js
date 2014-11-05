/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/* global describe, it, beforeEach */
'use strict';

var assert = require('assert'),            
    mockery = require('mockery'),
    error, 
    ni, 
    devDependency, 
    selfPkg;


mockery.registerMock('read-installed', function (err, options, cb) {
    var deps = {dependencies: null, devDependencies: null};

    if (error) {
        cb(null, deps);
        return;
    }

    // mocking the dependency module
    deps.dependencies = [{
        'name': 'moduleName',
        'description': 'description',
        'version': '1.0.0',
        'author': 'author info',
        'repository': { url: 'git://repo-URL' },
        'dependencies': 'deps info',
        'dist': 'dist URL'
    }];

    if (devDependency) {
        deps.devDependencies = {
            'moduleName': 'version',
        };
    } else {
        deps.dependencies[0].repository = null;
        deps.devDependencies = {
            'module': 'version'
        };
    }

    cb(null, deps);
});

mockery.registerMock('github-url-from-git', function () {
    return 'https://URL';
});

mockery.registerMock('read-package-json', function(file, err, bool, cb) {
    if (selfPkg) {
        cb(null, {name: 'node-info'});
    }
    cb({}, null);
});

mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false
});

ni = require('../../model/ni');

describe('node-info -> model -> ni', function () {
    var n, f;

    beforeEach(function () {
        error = false;
        n = new ni(null);
        devDependency = false;
    });
    
    describe('ni()', function () {

        it('should be a function.', function () {
            assert.equal(typeof ni, 'function');
        });

        it('should return an object.', function () {
            assert.equal(typeof n, 'object');
        });
    });

    describe('ni.getModulesInfo()', function () {
        f = 'path/to/node_modules';

        it('should return null if there is no deps modules', function (next) {
            error = true;
            n.getModulesInfo(f, function (err, data) {
                assert.equal(data, null);
                next();
            });
        });

        it('should return all the dependencies if there is no error', function (next) {
        devDependency = true;
            n.getModulesInfo(f, function (err, data) {
                assert.equal(typeof data.pkgs, 'object');
                next();
            });
        });

        it('should return only the dependencies if there is no dev deps', function (next) {
            n.getModulesInfo(f, function (err, data) {
                assert.equal(typeof data.pkgs, 'object');
                next();
            });
        });

        it('should return the self info if there is no error reading the package.json', function (next) {
            selfPkg = true;
            n.getModulesInfo(f, function (err, data) {
                assert.equal(data.pkgs[0].name, 'node-info');
                assert.equal(data.pkgs[0].selfPkg, true);
            });
            next();
        });
    });

    describe('ni.getSystemInfo()', function () {

        it('should return all the sys info if there is no error', function (next) {
            delete process.env.USER;
            delete process.env.LANG;
            delete process.platform;
            delete process.arch;
            delete process.pid;

            n.getSystemInfo(function (err, data) {
                assert.equal(typeof data.sys, 'object');
                next();
            });
        });

        it('should return all the proc info if there is no error', function (next) {
            n.getSystemInfo(function (err, data) {
                assert.equal(Object.keys(data.sys[0].proc).length > 0, true);
                next();
            });
        });

        it('should return all the os info if there is no error', function (next) {
            n.getSystemInfo(function (err, data) {
                assert.equal(Object.keys(data.sys[1].os).length > 0, true);
                next();
            });
        });
    });

    describe('ni.compare()', function () {

        it('should return true if the first value is greater than the second', function (next) {
            var obj = [ {'name': 2}, {'name': 1}],
                sortedObj = n.compare (obj); 
            assert.equal(sortedObj[0].name, 1);
            next();
        });

        it('should return true if the first value is smaller than the second', function (next) {
            var obj = [ {'name': 1}, {'name': 2}],
                sortedObj = n.compare (obj); 
            assert.equal(sortedObj[0].name, 1);
            next();
        });

        it('should return true if the first value is same as the second', function (next) {
            var obj = [ {'name': 1}, {'name': 1}],
                sortedObj = n.compare (obj); 
            assert.equal(sortedObj[0].name, 1);
            next();
        });
    });
});
