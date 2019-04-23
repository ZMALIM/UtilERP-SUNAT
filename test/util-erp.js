var expect  = require("chai").expect;
const ConsultaSunat = require("../lib");

const Sunat = new ConsultaSunat(null);

describe("Consulta SUNAT" , function () {

	it("Obtener información personal de RUC válido" , function (cb) {
		Sunat.getBasic("20131312955" , function (error , data) {
			if ( error ) {
				throw error;
			}
			expect(data).to.be.not.empty;
			expect(data).to.be.object;
			expect(data.ruc).to.be.not.empty;
			expect(data.razon_social).to.be.not.empty;
			return cb();
		});
	});

	it("Obtener información vacía de ruc no válido" , function (cb) {
		Sunat.getBasic("201313129551" , function (error , data) {
			if ( error ) {
				throw error;
			}
			expect(data).to.be.empty;
			return cb();
		});
	});

	it("Obtener información extendida de ruc válido" , function (cb) {
		Sunat.getAll("20131312955" , function (error , data , body) {
			if ( error ) {
				throw error;
			}
			expect(data).to.be.not.empty;
			expect(data).to.be.object;
			expect(data.sistema_emision).to.be.not.empty;
			expect(data.comercio_exterior).to.be.not.empty;
			return cb();
		})
	});

	it("Obtener información extendida vacía de RUC no válido" , function (cb) {
		Sunat.getAll("201313129551" , function (error , data , body) {
			if ( error ) {
				throw error;
			}
			expect(data).to.be.empty;
			return cb();
		})
	});


	it("Obtenga información personal del conjunto completo válido de RUC's" , function (cb) {
		Sunat.getBasic([
			"20131312955" ,
			"20343216808" ,
			"20537841860" ,
			"20417025244" ,
			"20521028123" ,
			"20562857096" ,
			"20519618037" ,
			"20531277890" ,
			"20166399077" ,
			"20533660747" ,
			"20450516091"
		] , function (error , data) {
			if ( error ) {
				throw error;
			}
			expect(data).to.be.instanceof(Array);
			expect(data).to.have.length.above(0);
			expect(data[ 0 ]).to.have.property("ruc");
			expect(data[ 0 ][ "ruc" ]).to.be.not.empty;
			return cb();
		});
	});

	it("Obtener información personal de un conjunto vacío de RUC's" , function (cb) {
		Sunat.getBasic([] , function (error , data) {
			if ( error ) {
				throw error;
			}

			expect(data).to.be.instanceof(Array);
			expect(data).to.be.empty;
			return cb();
		});
	});

});