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
  // Vacío: los carros ahora se agregan desde el panel (admin.html).
  // Si Firebase no respondiera, aquí se podrían poner carros de respaldo.
];

/* =========================================================
   VEHÍCULOS ENTREGADOS (referencias)
   ---------------------------------------------------------
   Carros que ya trajeron para clientes o que ya vendieron.
   Se muestran en la sección "Entregados" del inicio y en
   entregados.html. Si la lista está vacía, la sección no sale.

   tipo:  "cliente"  = traído para un cliente (búsqueda personalizada)
          "vendido"  = vendido del inventario

   Copia el bloque de ejemplo, quítale las // y cambia los datos:

  {
    nombre: "Toyota Corolla LE 2019",
    tipo: "cliente",
    fecha: "Septiembre 2026",
    lugar: "Ahuachapán",
    millaje: "68,000 mi",
    nota: "Búsqueda personalizada. El cliente pidió un Corolla automático con menos de 70,000 millas.",
    fotos: serie("entregados/corolla 2019/foto", 1, 6)
  },
   ========================================================= */

window.ENTREGADOS = [

];

/* Ejemplos SOLO para vista previa: se ven únicamente entrando con ?demo=1
   (por ejemplo .../index.html?demo=1). Los clientes no los ven. Se pueden borrar. */
window.ENTREGADOS_DEMO = [
  { nombre: "Hyundai Elantra Sport 2018", tipo: "cliente", fecha: "Octubre 2026", lugar: "Ahuachapán", millaje: "72,000 mi", nota: "Ejemplo de búsqueda personalizada con tope definido por el cliente.", fotos: ["hyundai elantra sport 2018/sport1.jpg"] },
  { nombre: "Hyundai Elantra SE 2017", tipo: "vendido", fecha: "Septiembre 2026", lugar: "Santa Ana", fotos: serie("hyundai elantra rojo/elantrarojo", 1, 12) },
  { nombre: "Kia Rio LX 2018", tipo: "cliente", fecha: "Agosto 2026", lugar: "San Salvador", fotos: serie("kia rio rojo/rio", 1, 12) },
  { nombre: "Hyundai Accent SE 2017", tipo: "vendido", fecha: "Julio 2026", lugar: "Sonsonate", fotos: serie("accent blanco uno/accent", 1, 12) },
  { nombre: "Hyundai Elantra SEL 2018", tipo: "cliente", fecha: "Junio 2026", lugar: "Ahuachapán", fotos: serie("elantra negro 2018/elantra18.", 1, 12) }
];
