/* =========================================================
   INVENTARIO DE IMPORTACIONES YESICA
   ---------------------------------------------------------
   Aquí se agregan, editan o quitan los carros.
   Los cambios aparecen solos en la página principal y en
   la página de inventario.

   CÓMO AGREGAR UN CARRO:
   1. Copia un bloque completo desde { hasta },
   2. pégalo arriba de todo (el primero es el más reciente),
   3. cambia los datos y las fotos.

   FOTOS:
   - Una por una:  fotos: ["carpeta/foto1.jpg", "carpeta/foto2.jpg"]
   - En serie:     fotos: serie("kia rio rojo/rio", 1, 12)
                   (= kia rio rojo/rio1.jpg ... rio12.jpg)

   ESTADO: "En camino" (sale con punto verde), "Para reparar",
           "En bodega", "Vendido", etc.
   ========================================================= */

function serie(prefijo, desde, hasta, ext = ".jpg") {
  const lista = [];
  for (let i = desde; i <= hasta; i++) lista.push(prefijo + i + ext);
  return lista;
}

window.AUTOS = [
  {
    nombre: "Hyundai Elantra Sport 2018",
    color: "Blanco",
    precio: "Consultar",
    estado: "En camino",
    motor: "1.6L Turbo",
    transmision: "Por confirmar",
    millaje: "Por confirmar",
    condicion: "Por confirmar",
    titulo: "Copart",
    detalles: "Versión Sport: motor 1.6L turbo de 201 hp, rines de 18 pulgadas y faros LED. Lote: 71947746 • Daño: por confirmar • Título: por confirmar",
    fotos: ["hyundai elantra sport 2018/sport1.jpg"]
  },
  {
    nombre: "Hyundai Elantra SE 2017",
    color: "Blanco",
    precio: "$6,200",
    estado: "Para reparar",
    motor: "2.0L",
    transmision: "Automático",
    millaje: "101,904 mi",
    condicion: "Run & Drive",
    titulo: "Salvage (MD)",
    detalles: "Lote 62387385 · VIN 5NPD84LF8HH****** · Ubicación: PA - Pittsburgh West. Arranca y conduce; transmisión activa; con llave. Daño primario: delantero/interfaz; secundario: lado. Valor minorista estimado: $7,981.",
    fotos: serie("hyundai elantra blanco 2017/elantra", 2, 13)
  },
  {
    nombre: "Hyundai Accent SE 2017",
    color: "Blanco",
    precio: "$5,900",
    estado: "Para reparar",
    motor: "1.6L",
    transmision: "Automático",
    millaje: "73,785 mi",
    condicion: "Run & Drive",
    titulo: "Salvage (VA - Danville)",
    detalles: "Copart Lote 67913855 • VIN KMHCT4AE1HU****** • Ubicación: VA - Danville • Vendedor: GE • Título: VA - Certificado de título - Salvamento • Color: Blanco • Cilindros: 4 • Combustible: Gas • Tracción: Delantera • Daño primario: trasero • Daño secundario: lado • Valor minorista estimado: $8,626.",
    fotos: serie("accent blanco uno/accent", 1, 12)
  },
  {
    nombre: "Hyundai Elantra SEL 2018",
    color: "Negro",
    precio: "$6,500",
    estado: "Para reparar",
    motor: "2.0L",
    transmision: "Automático",
    millaje: "114,367 mi",
    condicion: "Run & Drive",
    titulo: "Clean (GA)",
    detalles: "Copart Lote 62332015 • Ubicación: GA - Atlanta South • Vendedor: American Credit • Título: GA - Certificado de título (Clean) • Tracción delantera • Combustible: Gas • Sin llave reportada. Observado daño frontal (ver fotos).",
    fotos: serie("elantra negro 2018/elantra18.", 1, 12)
  },
  {
    nombre: "Hyundai Elantra SE 2017",
    color: "Rojo",
    precio: "$6,400",
    estado: "Para reparar",
    motor: "2.0L",
    transmision: "Automático",
    millaje: "51,423 mi",
    condicion: "Run & Drive",
    titulo: "Salvage (PA)",
    detalles: "Copart Lote 68400285 • VIN KMHD74LF5HU****** • Ubicación: PA - Pittsburgh West • Vendedor: GE • Título: PA - Certificate of Salvage • Color: Rojo • Cilindros: 4 • Tracción: Delantera • Combustible: Gas • Daño primario: Front End • Daño secundario: Mecánico • Valor minorista estimado: $11,205.50.",
    fotos: serie("hyundai elantra rojo/elantrarojo", 1, 12)
  },
  {
    nombre: "Kia Rio LX 2018",
    color: "Rojo",
    precio: "$6,000",
    estado: "Para reparar",
    motor: "1.6L",
    transmision: "Automático",
    millaje: "66,684 mi",
    condicion: "Engine Start",
    titulo: "Salvage (TX)",
    detalles: "Copart Lote 66112625 • VIN 3KPA24AB8JE****** • Ubicación: TX - San Antonio • Título: TX - Salvage Vehicle Title • Color: Rojo • Cilindros: 4 • Tracción: Delantera • Combustible: Gas • Programa: Engine Start • Daño primario: Front End.",
    fotos: serie("kia rio rojo/rio", 1, 12)
  }
];
