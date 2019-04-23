const Http = require("./http.js");


class Sunat {
    constructor() {
    }
    get(nroDoc, cb) {
        const newHttp = new Http(nroDoc);
        if (Array.isArray(nroDoc)) {
            if (nroDoc.length < 1) {
                return cb(null, []);
            }

            newHttp.getZipPage(nroDoc, function (err, data) {
                
                if (err) {
                    return cb(err);
                } else {
                    newHttp.parseCsv(data, function (err, res) {
                        if (err) {
                            return cb(err);
                        } else {
                            return cb(null, res);
                        }
                    });
                }
            });
        } else {
            newHttp.getHtmlPage(nroDoc, function (err, body) {
                
                if (err) {
                    return cb(err);
                }else{
                    newHttp.getBasicInformation(body, function (err, data) {
                console.log(data);
                        
                        if (err) {
                            return cb(err);
                        } else {
                            return cb(null, data, body);
                        }
                    });
                }
            });
        }
    }

    validateRuc(nroDoc) {
        if (nroDoc) {
            return !isNaN(parseFloat(nroDoc)) && isFinite(nroDoc) && nroDoc.toString().length == 11;
        }
        return false;
    }
}

module.exports = Sunat;