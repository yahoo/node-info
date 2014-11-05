/*
 * Copyright (c) 2014, Yahoo! Inc. All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

var express = require('express'),
    nodeinfo = require('../lib/index.js'),
    app = express();

app.use(nodeinfo({
    url: '/node-info',
    check: function(req) {
        if (req.something === false) {

            // don't show nodeinfo
            return false;
        }

        // show nodeinfo
        return true;
    }
}));

console.log('Go to: http://127.0.0.1:8000/node-info');
app.listen(8000);
