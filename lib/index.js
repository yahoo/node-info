/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var url = require('url'),
    ejs = require('ejs'),
    fs = require('fs'),
    ni = require('../model/ni'),
    ejsStr,
    n, d;

module.exports = function (config) {

    config = config || {};
    config.url = config.url || '/node-info';
    config.errMessage = config.errMessage || 'Not Found';
    config.errCode = config.errCode || 404;

    // valid values are html or json
    config.responseContentType = config.responseContentType || 'html';

    if (config.responseContentType !== 'json') {
        config.ejsTemplate = config.ejsTemplate || require('path').join(__dirname, 'tpl/nodeinfo.ejs');

        ejsStr = fs.readFileSync(config.ejsTemplate, 'utf8');
    }

    return function (req, res, next) {
        if (url.parse(req.url).pathname === config.url) {
            if (typeof config.check !== "function" || config.check(req)) {

                // nodeinfo instance variable
                n = ni(req); 
                n.getModulesInfo(process.cwd(), function (err, data) {

                    //TODO: error handling
                    if (err) {
                        res.writeHead(500, {'Content-Type' : 'text/plain'});
                        res.end("problem getting the modules info");
                    }

                    d = data;
                    n.getSystemInfo(function (err, data) {
                        data.pkgs = d.pkgs;
                        if (config.responseContentType === 'json') {
                            res.writeHead(200, {'Content-Type' : 'application/json'});
                            res.end(JSON.stringify(data));
                        } else {
                            res.writeHead(200, {'Content-Type' : 'text/html'});

                            // check if its defined 
                            data.isDefined =  function(obj) {
                                return typeof(obj) !== "undefined";
                            };

                            // check if its an object 
                            data.isObject =  function(obj) {
                               return Object.keys(obj).length > 0;
                            };

                            res.end(ejs.render(ejsStr, data));
                        }
                    });
                });
            } else {
                res.writeHead(config.errCode, {'Content-Type' : 'text/plain'});
                res.end(config.errMessage);
            }
        } else {
            next();
        }
    };
};
