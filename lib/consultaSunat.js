const Http = require("./http");
const newHttp = new Http();

class Sunat {
    constructor() {
    }

    getDetailed(nroDoc, cb) {
        newHttp.getZipPage(nroDoc,false, function (err, data) {
            if (err) {
                return cb(err);
            } else {
                newHttp.getCsv(data, function (err, res) {
                    if (err) {
                        return cb(err);
                    } else {
                        return cb(null, res);
                    }
                });
            }
        });
    }

    getBasic(nroDoc, cb) {
        if (Array.isArray(nroDoc)) {
            if (nroDoc.length < 1) {
                return cb(null, []);
            }
            newHttp.getZipPage(nroDoc,true, function (err, data) {
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

    getAll(nroDoc, cb){
        this.getBasic(nroDoc , function (err , basicInformation , body) {
            if ( err ) {
                return cb(err);
            } else {
                if ( Array.isArray(nroDoc) ) {
                    return cb(null , basicInformation);
                } else {
                    if ( !Object.keys(basicInformation).length ) {
                        return cb(null , basicInformation);
                    }
    
                    newHttp.getExtendedInformation(body , function (err , extendedInformation) {
                        if ( err ) {
                            return cb(err);
                        } else {
                            return cb(null , Object.assign(basicInformation , extendedInformation) , body);
                        }
                    });
                }
            }
        });
    }

    validateRuc(nroDoc) {
        if (nroDoc) {
            return !isNaN(parseFloat(nroDoc)) && isFinite(nroDoc) && nroDoc.toString().length == 11;
        }
        return false;
    }
}

module.exports = Sunat;