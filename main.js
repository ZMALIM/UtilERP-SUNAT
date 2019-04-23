const Sunat = require("./lib");

const Consulta = new Sunat();


Consulta.getDetailed("10484404718", function ( err , data ) {
    console.log(data);
});

