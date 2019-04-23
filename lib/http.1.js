"use strict";
var request = require("request");
var cheerio = require("cheerio");
var async = require("async");
var jszip = require("jszip");

var opts = {
    jar: true,
    timeout: 10000,
    encoding: null,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.94 Safari/537.36'
    }
};
request = request.defaults(opts);
class Http {
    constructor(nroDoc) {
        this.nroDoc = nroDoc;
    }
    getBasicInformation(html, callback) {
        try {
            var contribuyente = {};
            var $ = cheerio.load(html);
            var table = $(".form-table").eq(2).find("tbody");
            var first = table.first().children("tr");
            var rsHtml = first.find("td[class=bg]").html();
            if (!rsHtml) {
                return callback(null, contribuyente);
            }
            var initData = rsHtml.split("-").map(function (wat) {
                return wat.trim();
            });
            /**
             * tr - td - class=bg - valor
             * fila - columna
             */
            contribuyente.ruc = initData[0];
            contribuyente.razon_social = initData[1];
            contribuyente.tipo_contribuyente = table.children().eq(1).children().eq(1).text().trim(),
            contribuyente.nombre_comercial = table.children().eq(2).children().eq(1).text().trim().replace(/[ \n\t]+/g, " ");
            contribuyente.fecha_inscripcion = table.children().eq(3).children().eq(1).text().trim();
            contribuyente.inicio_actividades = table.children().eq(3).children().eq(3).text().trim();
            contribuyente.estado = table.children().eq(4).children().eq(1).text().trim();
            contribuyente.condicion = table.children().eq(5).children().eq(1).text().trim();
            contribuyente.direccion_referencia = table.children().eq(6).children().eq(1).text().split("-").map(function (splited) {
                return splited.trim();
            }).join("-");
            return callback(null, contribuyente, html);
        } catch (e) {
            return callback(e);
        }
    }
    getExtendedInformation(html, callback) {
        try {
            var data = {};
            var $ = cheerio.load(html);
            var tiposComprobantes = new Array();
            var tiposComprobantesElec = new Array();
            var table = $(".form-table").eq(2).find("tbody");
            data.sistema_emision = table.children().eq(7).children().eq(1).text().trim();
            data.comercio_exterior = table.children().eq(7).children().eq(3).text().trim();
            data.sistema_contabilidad = table.children().eq(8).children().eq(1).text().trim();
            data.actividades_economicas = table.children().eq(9).children().eq(1).map(function () {
                return $(this).text().trim().replace(/[ \t]+/g, " ");
            }).get();
            table.children().eq(10).children().eq(1).text().split("\n").map(function (param) {
                var comprobantes = param.trim();
                if (comprobantes != "") {
                    return tiposComprobantes.push(comprobantes);
                }
            });
            data.comprobantes_autorizados = tiposComprobantes;
            table.children().eq(11).children().eq(1).text().split("\n").map(function (param) {
                var comprobanteElec = param.trim();
                if (comprobanteElec != "") {
                    return tiposComprobantesElec.push(comprobanteElec.replace(/[ \t]+/g, " "));
                }
            });
            data.sistema_emision_electronica = tiposComprobantesElec;
            data.afiliacion_ple = table.children().eq(12).children().eq(1).text().trim();
            data.padrones = table.children().eq(13).children().eq(1).text().trim();
            return callback(null, data, null);
        } catch (e) {
            return callback(e);
        }
    }

    getCaptcha(base, cb) {

        var URL = "/captcha";
        var CAPTCHA_URL = base + URL;
        request.post(CAPTCHA_URL, { form: { "accion": "random" } }, function (err, response, body) {
            if (err) {
                return cb(err);
            } else {
                return cb(null, body.toString());
            }
        });
    }

    getHtmlPage(ruc, cb) {
        var BASE = "http://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc";
        var RUC_URL = BASE + "/jcrS00Alias";

        this.getCaptcha(BASE, function (err, captcha) {
            request.post(RUC_URL, {
                form: {
                    "nroRuc": ruc,
                    "accion": "consPorRuc",
                    "numRnd": captcha
                }
            }, function (err, response, body) {
                if (err) {
                    return cb(err);
                } else {
                    return cb(null, body.toString());
                }
            });
        });

    }

    parseZip(link, callback) {
        request.get(link, function (err, res, body) {
            if (err) {
                return callback(err);
            }
            var zip = new jszip();
            zip.loadAsync(body)
                .then(function (data) {
                    data = data.file(/^.*\.txt$/)[0];
                    data.async("string").then(function success(content) {
                        return callback(null, content);
                    }, function error(e) {
                        return callback(e);
                    });
                }, function (err) {
                    return callback(err);
                })
        });
    }

    parseHtmlZip(html, callback) {
        try {
            var $ = cheerio.load(html);
            var link = $("td.bg>a").first().attr("href");
            return callback(null, link);
        } catch (e) {
            return callback(e);
        }
    }

    getCsv(csv, callback) {
        csv = csv.replace(/\r/g, "");
        var data = csv.split("\n").map(function (line) {
            return line.split("|");
        });
        var columns = [
            "ruc",
            "razon_social",
            "tipo_contribuyente",
            "profesion",
            "nombre_comercial",
            "condicion",
            "estado",
            "fecha_inscripcion",
            "inicio_actividades",
            "departamento",
            "provincia",
            "distrito",
            "direccion_referencia",
            "telefono",
            "fax",
            "comercio_exterior",
            "principal_CIIU",
            "secundario1_CIIU",
            "secundario2_CIIU",
            "nuevo_rus",
            "buen_contribuyente",
            "agente_retencion",
            "agente_percepcion_vtaint",
            "agente_percepcion_comliq",
            ""
        ];
        var r = {};
        data = data.splice(1);
        data.forEach(function (line) {
            if (line) {
                if (line.length > 0) {
                    line.forEach(function (l, index) {
                        if (l && l.length > 0) {
                            r[columns[index]] = l.trim();
                        }
                    });
                }
            }
        });
        return callback(null, r);
    }

    parseCsv(csv, callback) {
        csv = csv.replace(/\r/g, "");
        var data = csv.split("\n").map(function (line) {
            return line.split("|");
        });
        
        var columns = [
            "ruc",
            "razon_social",
            "tipo_contribuyente",
            "profesion",
            "nombre_comercial",
            "condicion",
            "estado",
            "fecha_inscripcion",
            "inicio_actividades",
            "departamento",
            "provincia",
            "distrito",
            "direccion_referencia",
            "telefono",
            "fax",
            "comercio_exterior",
            "principal_CIIU",
            "secundario1_CIIU",
            "secundario2_CIIU",
            "nuevo_rus",
            "buen_contribuyente",
            "agente_retencion",
            "agente_percepcion_vtaint",
            "agente_percepcion_comliq",
            ""
        ];
        var result = [];
        data = data.splice(1);
        data.forEach(function (line) {
            if (line) {
                var r = {};
                if (line.length > 0) {
                    line.forEach(function (l, index) {
                        if (l && l.length > 0) {
                            r[columns[index]] = l.trim();
                        }
                    });
                    if (Object.keys(r).length > 0) {
                        result.push(r);
                    }
                }
            }
        });
        return callback(null, result);
    }

    getZipPage(rucs,multiple, cb) {
        var BASE = "http://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsmulruc";
        var RUC_URL = BASE + "/jrmS00Alias";
        async.waterfall([
            async.constant(BASE),
            this.getCaptcha,
            function (captcha, next) {
                var req_url = "";
                if(multiple){
                    req_url = RUC_URL + "?accion=consManual&textRuc=&numRnd=" + captcha + "&" + rucs.map(function (r) {
                        return "selRuc=" + r;
                    }).join("&");
                }else{
                    req_url = RUC_URL + "?accion=consManual&textRuc=&numRnd=" + captcha + "&selRuc="+rucs;
                }
                request.post(req_url, function (err, response, body) {
                    if (err) {
                        return next(err);
                    } else {
                        return next(null, body);
                    }
                });
            },
            this.parseHtmlZip,
            this.parseZip
        ], function (err, result) {
            if (err) {
                return cb(err)
            } else {
                return cb(null, result);
            }
        });
    }
}

module.exports = Http;
