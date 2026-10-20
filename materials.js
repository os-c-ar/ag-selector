/* =====================================================
   NFS – Materiales e Insumos (base maestra tipo "INSUMOS")
   Lista maestra de materiales/servicios con precio unitario,
   que alimenta las listas de materiales (BOM) de cada parte
   del catálogo de costeo.
   ===================================================== */

'use strict';

const NFS_MATERIALS = (function () {
  const KEY = 'nfs_materials_v1';
  const HANDLE_KEY = 'materials';
  let _items = [];
  let _fileHandle = null;

  // Base completa extraída de la hoja "INSUMOS" del archivo PP-03 PLANTILLA DE PRECIOS (523 ítems, 22 categorías).
  const DEFAULT_ITEMS = [
    { id: 1, categoria: 'BARRAS MACIZAS 304SS', nombre: '1 "', unidad: 'm', valorUnitario: 39000.0, proveedor: 'CORTEACEROS', fecha: '2016-02-26', pesoUnitario: 3.9777 },
    { id: 2, categoria: 'BARRAS MACIZAS 304SS', nombre: '1 1/4"', unidad: 'm', valorUnitario: 64000.0, proveedor: 'CORTEACEROS', fecha: '2016-02-26', pesoUnitario: 6.2151 },
    { id: 3, categoria: 'BARRAS MACIZAS 304SS', nombre: '1 1/2"', unidad: 'm', valorUnitario: 87000.0, proveedor: 'CORTEACEROS', fecha: '2016-02-26', pesoUnitario: 8.9497 },
    { id: 4, categoria: 'BARRAS MACIZAS 304SS', nombre: '2"', unidad: 'm', valorUnitario: 154000.0, proveedor: 'CORTEACEROS', fecha: '2016-02-26', pesoUnitario: 15.9106 },
    { id: 5, categoria: 'BARRAS MACIZAS 304SS', nombre: '2 1/2"', unidad: 'm', valorUnitario: 225000.0, proveedor: 'CORTEACEROS', fecha: '2016-02-26', pesoUnitario: 24.8603 },
    { id: 6, categoria: 'BARRAS MACIZAS 304SS', nombre: '3"', unidad: 'm', valorUnitario: 461000.0, proveedor: 'IMPORINOX', fecha: '2016-03-15', pesoUnitario: 35.7989 },
    { id: 7, categoria: 'BARRAS MACIZAS 304SS', nombre: '4"', unidad: 'm', valorUnitario: 563000.0, proveedor: 'CORTEACEROS', fecha: '2016-02-29', pesoUnitario: 63.6425 },
    { id: 8, categoria: 'BARRAS MACIZAS 304SS', nombre: '6"', unidad: 'm', valorUnitario: 1267000.0, proveedor: 'CORTEACEROS', fecha: '2016-04-14', pesoUnitario: 143.1955 },
    { id: 9, categoria: 'BARRAS MACIZAS 304SS', nombre: '8"', unidad: 'm', valorUnitario: 2765000.0, proveedor: 'CORTEACEROS', fecha: '2016-04-19', pesoUnitario: 254.5698 },
    { id: 10, categoria: 'BARRAS MACIZAS 304SS', nombre: '10"', unidad: 'm', valorUnitario: 4000000.0, proveedor: 'IMPORINOX', fecha: '2016-11-23', pesoUnitario: 397.7654 },
    { id: 11, categoria: 'BARRAS MACIZAS 316SS', nombre: '1"', unidad: 'm', valorUnitario: 80000.0, proveedor: 'IMPORINOX', fecha: 'SUPUESTO', pesoUnitario: 3.9777 },
    { id: 12, categoria: 'BARRAS MACIZAS 316SS', nombre: '1 1/4"', unidad: 'm', valorUnitario: 120000.0, proveedor: 'IMPORINOX', fecha: 'SUPUESTO', pesoUnitario: 6.2151 },
    { id: 13, categoria: 'BARRAS MACIZAS 316SS', nombre: '1 1/2"', unidad: 'm', valorUnitario: 140000.0, proveedor: 'IMPORINOX', fecha: '2016-03-31', pesoUnitario: 8.9497 },
    { id: 14, categoria: 'BARRAS MACIZAS 316SS', nombre: '2"', unidad: 'm', valorUnitario: 240000.0, proveedor: 'IMPORINOX', fecha: '2016-03-15', pesoUnitario: 15.9106 },
    { id: 15, categoria: 'BARRAS MACIZAS 316SS', nombre: '2 1/4"', unidad: 'm', valorUnitario: 265000.0, proveedor: 'IMPORINOX', fecha: '2016-03-15', pesoUnitario: 20.1369 },
    { id: 16, categoria: 'BARRAS MACIZAS 316SS', nombre: '2 1/2"', unidad: 'm', valorUnitario: 322000.0, proveedor: 'IMPORINOX', fecha: '2016-03-15', pesoUnitario: 24.8603 },
    { id: 17, categoria: 'BARRAS MACIZAS 316SS', nombre: '3"', unidad: 'm', valorUnitario: 461000.0, proveedor: 'IMPORINOX', fecha: '2016-03-15', pesoUnitario: 35.7989 },
    { id: 18, categoria: 'BARRAS MACIZAS 316SS', nombre: '3 1/2"', unidad: 'm', valorUnitario: 625000.0, proveedor: 'IMPORINOX', fecha: '2016-03-15', pesoUnitario: 48.7263 },
    { id: 19, categoria: 'BARRAS MACIZAS 316SS', nombre: '4"', unidad: 'm', valorUnitario: 720000.0, proveedor: 'IMPORINOX', fecha: '2016-05-31', pesoUnitario: 63.6425 },
    { id: 20, categoria: 'BARRAS MACIZAS 316SS', nombre: '6"', unidad: 'm', valorUnitario: 1944000.0, proveedor: 'Estimado extrapolacion', fecha: '2016-06-07', pesoUnitario: 143.2 },
    { id: 21, categoria: 'BARRAS MACIZAS 316SS', nombre: '8"', unidad: 'm', valorUnitario: 3594500.0, proveedor: 'IMPORINOX', fecha: '2016-05-31', pesoUnitario: 254.5698 },
    { id: 22, categoria: 'BARRAS MACIZAS 316SS', nombre: '10"', unidad: 'm', valorUnitario: 6500000.0, proveedor: 'IMPORINOX', fecha: 'ESTIMADO', pesoUnitario: 397.7654 },
    { id: 23, categoria: 'BARRAS MACIZAS 4140', nombre: '1 1/4"', unidad: 'm', valorUnitario: 35500.0, proveedor: 'ACEROSCOL', fecha: '2016-07-28', pesoUnitario: 6.2151 },
    { id: 24, categoria: 'BARRAS MACIZAS 4140', nombre: '1 3/8"', unidad: 'm', valorUnitario: 42500.0, proveedor: 'ACEROSCOL', fecha: '2016-07-28', pesoUnitario: 7.5203 },
    { id: 25, categoria: 'BARRAS MACIZAS 1020', nombre: '4 ½”', unidad: 'm', valorUnitario: 340000.0, proveedor: 'IMPORINOX', fecha: '2016-03-31', pesoUnitario: 80.5475 },
    { id: 26, categoria: 'BARRAS MACIZAS 1020', nombre: '6”', unidad: 'm', valorUnitario: 550000.0, proveedor: 'IMPORINOX', fecha: '2015', pesoUnitario: 143.1955 },
    { id: 27, categoria: 'BARRAS PERFORADAS 1518', nombre: 'D ext: 102 mm D in: 80 mm', unidad: 'm', valorUnitario: 112000.0, proveedor: 'ACEROSCOL', fecha: '2016-06-29', pesoUnitario: 24.6862 },
    { id: 28, categoria: 'BARRAS PERFORADAS 1518', nombre: 'D ext: 76 mm D in: 42 mm', unidad: 'm', valorUnitario: 112000.0, proveedor: 'ACEROSCOL', fecha: '2016-06-29', pesoUnitario: 24.7355 },
    { id: 29, categoria: 'BARRAS PERFORADAS 1518', nombre: 'D ext: 101 mm D in: 51 mm', unidad: 'm', valorUnitario: 212000.0, proveedor: 'ACEROSCOL', fecha: '2016-06-29', pesoUnitario: 46.8569 },
    { id: 30, categoria: 'BARRAS MACIZAS 1045', nombre: '3"', unidad: 'm', valorUnitario: 159000.0, proveedor: 'ACEROSCOL', fecha: '2016-06-29', pesoUnitario: 35.7989 },
    { id: 31, categoria: 'TUBOS SCH 10 316L', nombre: '1 1/4"', unidad: 'und', valorUnitario: 272600.0, proveedor: 'TUVACOL', fecha: '2016-07-28', pesoUnitario: 2.6898 },
    { id: 32, categoria: 'TUBOS SCH 10 316L', nombre: '2"', unidad: 'und', valorUnitario: 339880.0, proveedor: 'ACEROSCOL', fecha: '2016-06-29', pesoUnitario: 3.9298 },
    { id: 33, categoria: 'TUBOS SCH 10 316L', nombre: '3"', unidad: 'und', valorUnitario: 452400.0, proveedor: 'ACEROSCOL', fecha: '2016-06-29', pesoUnitario: 6.4533 },
    { id: 34, categoria: 'TUBOS SCH 10 316L', nombre: '4"', unidad: 'und', valorUnitario: 747040.0, proveedor: 'ACEROSCOL', fecha: '2016-06-29', pesoUnitario: 8.3626 },
    { id: 35, categoria: 'TUBOS SCH 10 316L', nombre: '6"', unidad: 'und', valorUnitario: 1287600.0, proveedor: 'ACEROSCOL', fecha: '2016-06-29', pesoUnitario: 13.839 },
    { id: 36, categoria: 'TUBOS SCH 40 304SS', nombre: '1 1/4"', unidad: 'und', valorUnitario: 240000.0, proveedor: 'SUMIVALLE', fecha: '2017-05-23', pesoUnitario: 3.0 },
    { id: 37, categoria: 'TUBOS SCH 40 304SS', nombre: '1 1/2"', unidad: 'und', valorUnitario: 250000.0, proveedor: 'SUMIVALLE', fecha: '2017-05-23', pesoUnitario: 3.2 },
    { id: 38, categoria: 'TUBOS SCH 40 304SS', nombre: '2"', unidad: 'und', valorUnitario: 440000.00000000006, proveedor: 'SUMIVALLE', fecha: '2016-09-14', pesoUnitario: 5.442 },
    { id: 39, categoria: 'TUBOS SCH 40 304SS', nombre: '2 1/2"', unidad: 'und', valorUnitario: 638000.0, proveedor: 'TUVACOL', fecha: '2015-07-07', pesoUnitario: 8.63 },
    { id: 40, categoria: 'TUBOS SCH 40 304SS', nombre: '3"', unidad: 'und', valorUnitario: 751564.0000000001, proveedor: 'TUVACOL', fecha: '2016-02-26', pesoUnitario: 11.3 },
    { id: 41, categoria: 'TUBOS SCH 40 304SS', nombre: '4"', unidad: 'und', valorUnitario: 1052700.0, proveedor: 'TUVACOL', fecha: '2016-02-26', pesoUnitario: 16.09 },
    { id: 42, categoria: 'TUBOS SCH 40 304SS', nombre: '5"', unidad: 'und', valorUnitario: 1333000.0, proveedor: 'CORTEACEROS', fecha: '2017-01-18', pesoUnitario: 21.8 },
    { id: 43, categoria: 'TUBOS SCH 40 304SS', nombre: '6"', unidad: 'und', valorUnitario: 2978800.0000000005, proveedor: 'TUVACOL', fecha: '2016-02-26', pesoUnitario: 28.2 },
    { id: 44, categoria: 'TUBOS SCH 40 304SS', nombre: '8"', unidad: 'und', valorUnitario: 4669500.0, proveedor: 'TUVACOL', fecha: '2016-03-18', pesoUnitario: 42.6 },
    { id: 45, categoria: 'TUBOS SCH 40 304SS', nombre: '10"', unidad: 'und', valorUnitario: 5830000.000000001, proveedor: 'IMPORINOX', fecha: '2016-11-22', pesoUnitario: 60.3 },
    { id: 46, categoria: 'TUBOS SCH 40 316SS', nombre: '1 1/4"', unidad: 'und', valorUnitario: 300000.0, proveedor: 'SUMIVALLE', fecha: '2017-05-23', pesoUnitario: 2.9 },
    { id: 47, categoria: 'TUBOS SCH 40 316SS', nombre: '1 1/2"', unidad: 'und', valorUnitario: 310000.0, proveedor: 'SUMIVALLE', fecha: '2017-05-23', pesoUnitario: 3.2 },
    { id: 48, categoria: 'TUBOS SCH 40 316SS', nombre: '2"', unidad: 'und', valorUnitario: 1050000.0, proveedor: 'TUVACOL', fecha: '2016-04-18', pesoUnitario: 5.4 },
    { id: 49, categoria: 'TUBOS SCH 40 316SS', nombre: '2 1/2"', unidad: 'und', valorUnitario: 1276000.0, proveedor: 'TUVACOL', fecha: '2016-04-18', pesoUnitario: 8.6 },
    { id: 50, categoria: 'TUBOS SCH 40 316SS', nombre: '3"', unidad: 'und', valorUnitario: 1320000.0, proveedor: 'TUVACOL', fecha: '2016-04-18', pesoUnitario: 11.3 },
    { id: 51, categoria: 'TUBOS SCH 40 316SS', nombre: '4"', unidad: 'und', valorUnitario: 1752000.0, proveedor: 'TUVACOL', fecha: '2016-02-02', pesoUnitario: 16.09 },
    { id: 52, categoria: 'TUBOS SCH 40 316SS', nombre: '6"', unidad: 'und', valorUnitario: 3600000.0, proveedor: 'TUVACOL', fecha: '2016-03-08', pesoUnitario: 28.2 },
    { id: 53, categoria: 'TUBOS SCH 40 316SS', nombre: '8"', unidad: 'und', valorUnitario: 4770500.0, proveedor: 'TUVACOL', fecha: '2016-04-18', pesoUnitario: 42.6 },
    { id: 54, categoria: 'TUBOS SCH 40 316SS', nombre: '10"', unidad: 'und', valorUnitario: 14500000.0, proveedor: 'TUVACOL', fecha: '2016-11-22', pesoUnitario: 60.3 },
    { id: 55, categoria: 'TUBOS SCH 40 A53', nombre: '6 "', unidad: 'und', valorUnitario: 448340.0, proveedor: 'TUVACOL', fecha: '2016-05-13', pesoUnitario: 28.2 },
    { id: 56, categoria: 'TUBOS SCH 40 A53', nombre: '8"', unidad: 'und', valorUnitario: 597786.6666666666, proveedor: 'TUVACOL', fecha: 'ESTIMADO', pesoUnitario: 42.6 },
    { id: 57, categoria: 'BRIDAS CIEGAS 304SS', nombre: '1 1/4"', unidad: 'und', valorUnitario: 60000.0, proveedor: 'TUVACOL', fecha: 'ESTIMADO', pesoUnitario: 1.7 },
    { id: 58, categoria: 'BRIDAS CIEGAS 304SS', nombre: '1 1/2"', unidad: 'und', valorUnitario: 65000.0, proveedor: 'TUVACOL', fecha: 'ESTIMADO', pesoUnitario: 2.0 },
    { id: 59, categoria: 'BRIDAS CIEGAS 304SS', nombre: '2 "', unidad: 'und', valorUnitario: 80000.0, proveedor: 'TUVACOL', fecha: '2016-02-26', pesoUnitario: 3.0 },
    { id: 60, categoria: 'BRIDAS CIEGAS 304SS', nombre: '2 1/2"', unidad: 'und', valorUnitario: 80000.0, proveedor: 'TUVACOL', fecha: '2016-02-26', pesoUnitario: 3.0 },
    { id: 61, categoria: 'BRIDAS CIEGAS 304SS', nombre: '3"', unidad: 'und', valorUnitario: 98250.0, proveedor: 'TUVACOL', fecha: '2016-02-26', pesoUnitario: 4.93 },
    { id: 62, categoria: 'BRIDAS CIEGAS 304SS', nombre: '4"', unidad: 'und', valorUnitario: 148500.0, proveedor: 'TUVACOL', fecha: '2016-02-26', pesoUnitario: 7.0 },
    { id: 63, categoria: 'BRIDAS CIEGAS 304SS', nombre: '6"', unidad: 'und', valorUnitario: 212000.0, proveedor: 'TUVACOL', fecha: '2016-02-25', pesoUnitario: 11.3 },
    { id: 64, categoria: 'BRIDAS CIEGAS 304SS', nombre: '8"', unidad: 'und', valorUnitario: 310000.0, proveedor: 'TUVACOL', fecha: '2016-03-18', pesoUnitario: 19.6 },
    { id: 65, categoria: 'BRIDAS CIEGAS 304SS', nombre: '10"', unidad: 'und', valorUnitario: 508000.0, proveedor: 'CASAVAL', fecha: '2016-11-22', pesoUnitario: 23.0 },
    { id: 66, categoria: 'BRIDA SLIP ON 304SS', nombre: '2"', unidad: 'und', valorUnitario: 75000.0, proveedor: 'TUVACOL', fecha: 'ESTIMADO', pesoUnitario: 3.0 },
    { id: 67, categoria: 'BRIDA SLIP ON 304SS', nombre: '2 1/2"', unidad: 'und', valorUnitario: 82000.0, proveedor: 'TUVACOL', fecha: '2016-03-01', pesoUnitario: 3.28 },
    { id: 68, categoria: 'BRIDA SLIP ON 304SS', nombre: '3"', unidad: 'und', valorUnitario: 78000.0, proveedor: 'TUVACOL', fecha: '2016-02-26', pesoUnitario: 3.85 },
    { id: 69, categoria: 'BRIDA SLIP ON 304SS', nombre: '4"', unidad: 'und', valorUnitario: 115000.0, proveedor: 'TUVACOL', fecha: '2016-02-26', pesoUnitario: 5.3 },
    { id: 70, categoria: 'BRIDA SLIP ON 304SS', nombre: '5"', unidad: 'und', valorUnitario: 130000.0, proveedor: 'TUVACOL', fecha: '2017-01-18', pesoUnitario: 9.5 },
    { id: 71, categoria: 'BRIDA SLIP ON 304SS', nombre: '6"', unidad: 'und', valorUnitario: 116100.0, proveedor: 'CASAVAL', fecha: '2016-10-13', pesoUnitario: 11.3 },
    { id: 72, categoria: 'BRIDA SLIP ON 304SS', nombre: '8"', unidad: 'und', valorUnitario: 310000.0, proveedor: 'TUVACOL', fecha: '2016-03-18', pesoUnitario: 12.1 },
    { id: 73, categoria: 'BRIDA SLIP ON 304SS', nombre: '10"', unidad: 'und', valorUnitario: 350000.0, proveedor: 'IMPORINOX', fecha: '2016-11-22', pesoUnitario: 14.0 },
    { id: 74, categoria: 'BRIDA CIEGA 316SS', nombre: '1 1/2"', unidad: 'und', valorUnitario: 80000.0, proveedor: 'TUVACOL', fecha: 'ESTIMADO', pesoUnitario: 2.0 },
    { id: 75, categoria: 'BRIDA CIEGA 316SS', nombre: '2"', unidad: 'und', valorUnitario: 120000.0, proveedor: 'TUVACOL', fecha: 'ESTIMADO', pesoUnitario: 3.0 },
    { id: 76, categoria: 'BRIDA CIEGA 316SS', nombre: '2 1/2"', unidad: 'und', valorUnitario: 130000.0, proveedor: 'TUVACOL', fecha: 'ESTIMADO', pesoUnitario: 3.28 },
    { id: 77, categoria: 'BRIDA CIEGA 316SS', nombre: '3"', unidad: 'und', valorUnitario: 209000.00000000003, proveedor: 'ASUMINCOL', fecha: '2016-09-26', pesoUnitario: 4.93 },
    { id: 78, categoria: 'BRIDA CIEGA 316SS', nombre: '4"', unidad: 'und', valorUnitario: 325600.0, proveedor: 'ASUMINCOL', fecha: '2016-09-26', pesoUnitario: 6.8 },
    { id: 79, categoria: 'BRIDA CIEGA 316SS', nombre: '6"', unidad: 'und', valorUnitario: 330000.0, proveedor: 'TUVACOL', fecha: '2016-03-08', pesoUnitario: 11.3 },
    { id: 80, categoria: 'BRIDA CIEGA 316SS', nombre: '8"', unidad: 'und', valorUnitario: 480000.0, proveedor: 'TUVACOL', fecha: '2016-03-08', pesoUnitario: 15.0 },
    { id: 81, categoria: 'BRIDA CIEGA 316SS', nombre: '10"', unidad: 'und', valorUnitario: 871500.0, proveedor: 'TUVACOL', fecha: '2016-11-22', pesoUnitario: 23.0 },
    { id: 82, categoria: 'BRIDA SLIP ON 316SS', nombre: '1 1/2"', unidad: 'und', valorUnitario: 45000.0, proveedor: 'SUMIVALLE', fecha: '2017-05-23', pesoUnitario: 2.0 },
    { id: 83, categoria: 'BRIDA SLIP ON 316SS', nombre: '2 1/2"', unidad: 'und', valorUnitario: 99000.0, proveedor: 'IMPORINOX', fecha: '2016-03-15', pesoUnitario: 3.28 },
    { id: 84, categoria: 'BRIDA SLIP ON 316SS', nombre: '3"', unidad: 'und', valorUnitario: 186340.00000000003, proveedor: 'ASUMINCOL', fecha: '2016-09-27', pesoUnitario: 3.85 },
    { id: 85, categoria: 'BRIDA SLIP ON 316SS', nombre: '4"', unidad: 'und', valorUnitario: 271700.0, proveedor: 'ASUMINCOL', fecha: '2016-09-27', pesoUnitario: 6.2 },
    { id: 86, categoria: 'BRIDA SLIP ON 316SS', nombre: '6"', unidad: 'und', valorUnitario: 240000.0, proveedor: 'TUVACOL', fecha: '2016-03-08', pesoUnitario: 7.45 },
    { id: 87, categoria: 'BRIDA SLIP ON 316SS', nombre: '10"', unidad: 'und', valorUnitario: 489962.0, proveedor: 'TUVACOL', fecha: '2016-11-22', pesoUnitario: 14.0 },
    { id: 88, categoria: 'BRIDA CIEGA A36', nombre: '6 "', unidad: 'und', valorUnitario: 62500.0, proveedor: 'TUVACOL', fecha: '2016-03-30', pesoUnitario: 11.3 },
    { id: 89, categoria: 'BRIDA CIEGA A36', nombre: '8"', unidad: 'und', valorUnitario: 83333.33333333333, proveedor: 'TUVACOL', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 90, categoria: 'PLETINAS', nombre: '150*1/4"', unidad: 'und', valorUnitario: 80000.0, proveedor: 'MQJS', fecha: 'SUPUESTO', pesoUnitario: 1.1216 },
    { id: 91, categoria: 'PLETINAS', nombre: '250 * 1/8"', unidad: 'und', valorUnitario: 130000.0, proveedor: 'MECANIDO', fecha: '2016-03-01', pesoUnitario: 1.5577 },
    { id: 92, categoria: 'PLETINAS', nombre: '210* 5/16', unidad: 'und', valorUnitario: 88000.0, proveedor: 'INDUPROMET', fecha: '2018-12-07', pesoUnitario: 3.0 },
    { id: 93, categoria: 'PLETINAS', nombre: '210 * 1/8"', unidad: 'und', valorUnitario: 68000.0, proveedor: 'MQJS', fecha: '2016-03-04', pesoUnitario: 1.0991 },
    { id: 94, categoria: 'PLETINAS', nombre: '350 * 1/8"', unidad: 'und', valorUnitario: 115000.0, proveedor: 'MQJS', fecha: '2016-03-04', pesoUnitario: 3.0532 },
    { id: 95, categoria: 'PLETINAS', nombre: '170* 1/4"', unidad: 'und', valorUnitario: 90000.0, proveedor: 'MQJS', fecha: '2016-03-04', pesoUnitario: 1.4406 },
    { id: 96, categoria: 'PLETINAS', nombre: '210 * 1/4"', unidad: 'und', valorUnitario: 96000.0, proveedor: 'MQJS', fecha: '2016-03-04', pesoUnitario: 2.1983 },
    { id: 97, categoria: 'PLETINAS', nombre: '250 * 1/4"', unidad: 'und', valorUnitario: 100000.0, proveedor: 'MQJS', fecha: '2016-03-04', pesoUnitario: 3.1155 },
    { id: 98, categoria: 'PLETINAS', nombre: '250 * 5/16"', unidad: 'und', valorUnitario: 160000.0, proveedor: 'INDUPROMET', fecha: '2017-08-28', pesoUnitario: 4.5 },
    { id: 99, categoria: 'PLETINAS', nombre: 'PL-300-025-80', unidad: 'und', valorUnitario: 110000.0, proveedor: 'INDUPROMET', fecha: '2017-09-05', pesoUnitario: 4.5 },
    { id: 100, categoria: 'PLETINAS', nombre: '300 * 1/4"', unidad: 'und', valorUnitario: 110000.0, proveedor: 'MQJS', fecha: '2016-03-04', pesoUnitario: 4.4863 },
    { id: 101, categoria: 'PLETINAS', nombre: '350* 1/4"', unidad: 'und', valorUnitario: 115000.0, proveedor: 'MQJS', fecha: '2016-03-04', pesoUnitario: 6.1063 },
    { id: 102, categoria: 'PLETINAS', nombre: '350 * 3/8"', unidad: 'und', valorUnitario: 160000.0, proveedor: 'MQJS', fecha: '2016-03-04', pesoUnitario: 9.1595 },
    { id: 103, categoria: 'PLETINAS', nombre: '350 * 1/2"', unidad: 'und', valorUnitario: 133000.0, proveedor: 'INDUPROMET', fecha: '2018-12-07', pesoUnitario: 100.0 },
    { id: 104, categoria: 'PLETINAS', nombre: '400 * 3/8”', unidad: 'und', valorUnitario: 200000.0, proveedor: 'MQJS', fecha: '2016-03-04', pesoUnitario: 11.9634 },
    { id: 105, categoria: 'PLETINAS', nombre: '400 * 3/4" 304SS', unidad: 'und', valorUnitario: 400000.0, proveedor: '', fecha: 'ESTIMADO', pesoUnitario: 24.0 },
    { id: 106, categoria: 'PLETINAS', nombre: '500* 3/4"', unidad: 'und', valorUnitario: 295000.0, proveedor: 'MQJS', fecha: '2016-01-19', pesoUnitario: 37.3856 },
    { id: 107, categoria: 'PLETINAS', nombre: '600* 3/4"', unidad: 'und', valorUnitario: 390000.0, proveedor: 'MQJS', fecha: '2016-01-19', pesoUnitario: 53.8353 },
    { id: 108, categoria: 'PLETINAS', nombre: '600 * 1"', unidad: 'und', valorUnitario: 390000.0, proveedor: 'MQJS', fecha: '2016-01-19', pesoUnitario: 71.7804 },
    { id: 109, categoria: 'PLETINAS', nombre: '600 * 2"', unidad: 'und', valorUnitario: 580000.0, proveedor: 'MQJS', fecha: '2016-01-19', pesoUnitario: 143.5608 },
    { id: 110, categoria: 'PROPELAS (MATERIALES)', nombre: 'T160 304SS', unidad: 'und', valorUnitario: 110000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 0.9 },
    { id: 111, categoria: 'PROPELAS (MATERIALES)', nombre: 'T200 304SS', unidad: 'und', valorUnitario: 120000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 0.97 },
    { id: 112, categoria: 'PROPELAS (MATERIALES)', nombre: 'T300 304SS', unidad: 'und', valorUnitario: 130000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 2.5 },
    { id: 113, categoria: 'PROPELAS (MATERIALES)', nombre: 'T350 304SS', unidad: 'und', valorUnitario: 130000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 2.91 },
    { id: 114, categoria: 'PROPELAS (MATERIALES)', nombre: 'T500 304SS', unidad: 'und', valorUnitario: 150000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 4.0 },
    { id: 115, categoria: 'PROPELAS (MATERIALES)', nombre: 'T550 304SS', unidad: 'und', valorUnitario: 170000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 4.08 },
    { id: 116, categoria: 'PROPELAS (MATERIALES)', nombre: 'T700 304SS', unidad: 'und', valorUnitario: 230000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 16.63 },
    { id: 117, categoria: 'PROPELAS (MATERIALES)', nombre: 'T800 304SS', unidad: 'und', valorUnitario: 260000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 24.0 },
    { id: 118, categoria: 'PROPELAS (MATERIALES)', nombre: 'T900 304SS', unidad: 'und', valorUnitario: 310000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 24.0 },
    { id: 119, categoria: 'PROPELAS (MATERIALES)', nombre: 'T1000 304SS', unidad: 'und', valorUnitario: 320000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 30.0 },
    { id: 120, categoria: 'PROPELAS (MATERIALES)', nombre: 'T200 316SS', unidad: 'und', valorUnitario: 156000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 0.97 },
    { id: 121, categoria: 'PROPELAS (MATERIALES)', nombre: 'T350 316SS', unidad: 'und', valorUnitario: 169000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 2.91 },
    { id: 122, categoria: 'PROPELAS (MATERIALES)', nombre: 'T500 316SS', unidad: 'und', valorUnitario: 195000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 4.0 },
    { id: 123, categoria: 'PROPELAS (MATERIALES)', nombre: 'T550 316SS', unidad: 'und', valorUnitario: 221000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 4.08 },
    { id: 124, categoria: 'PROPELAS (MATERIALES)', nombre: 'T700 316SS', unidad: 'und', valorUnitario: 299000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 8.0 },
    { id: 125, categoria: 'PROPELAS (MATERIALES)', nombre: 'T800 316SS', unidad: 'und', valorUnitario: 338000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 12.0 },
    { id: 126, categoria: 'PROPELAS (MATERIALES)', nombre: 'T900 316SS', unidad: 'und', valorUnitario: 403000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 24.0 },
    { id: 127, categoria: 'PROPELAS (MATERIALES)', nombre: 'T1000 316SS', unidad: 'und', valorUnitario: 405000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 30.0 },
    { id: 128, categoria: 'PROPELAS (MATERIALES)', nombre: 'T1200 316SS', unidad: 'und', valorUnitario: 410000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 18.0 },
    { id: 129, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT200 304SS', unidad: 'und', valorUnitario: 95000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 0.9 },
    { id: 130, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT300 304SS', unidad: 'und', valorUnitario: 105000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 1.6 },
    { id: 131, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT400 304SS', unidad: 'und', valorUnitario: 120000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 3.2 },
    { id: 132, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT500 304SS', unidad: 'und', valorUnitario: 150000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 4.8 },
    { id: 133, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT600 304SS', unidad: 'und', valorUnitario: 180000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 5.5 },
    { id: 134, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT700 304SS', unidad: 'und', valorUnitario: 205000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 9.8 },
    { id: 135, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT800 304SS', unidad: 'und', valorUnitario: 230000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 11.3 },
    { id: 136, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT1000 304SS', unidad: 'und', valorUnitario: 350000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 22.5 },
    { id: 137, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT1200 304SS', unidad: 'und', valorUnitario: 850000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 28.5 },
    { id: 138, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT1500 304SS', unidad: 'und', valorUnitario: 1100000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 42.0 },
    { id: 139, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT1800 304SS', unidad: 'und', valorUnitario: 1300000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 42.0 },
    { id: 140, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT2000 304SS', unidad: 'und', valorUnitario: 1380000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 54.0 },
    { id: 141, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT2500 304SS', unidad: 'und', valorUnitario: 2200000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 124.0 },
    { id: 142, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT3000 304SS', unidad: 'und', valorUnitario: 2560000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 235.0 },
    { id: 143, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT200 316SS', unidad: 'und', valorUnitario: 133000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 0.9 },
    { id: 144, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT300 316SS', unidad: 'und', valorUnitario: 147000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 1.6 },
    { id: 145, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT400 316SS', unidad: 'und', valorUnitario: 168000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 3.2 },
    { id: 146, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT500 316SS', unidad: 'und', valorUnitario: 210000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 4.8 },
    { id: 147, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT600 316SS', unidad: 'und', valorUnitario: 251999.99999999997, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 5.5 },
    { id: 148, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT700 316SS', unidad: 'und', valorUnitario: 287000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 9.8 },
    { id: 149, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT800 316SS', unidad: 'und', valorUnitario: 322000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 11.3 },
    { id: 150, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT1000 316SS', unidad: 'und', valorUnitario: 455000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 22.5 },
    { id: 151, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT1200 316SS', unidad: 'und', valorUnitario: 1105000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 28.5 },
    { id: 152, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT1500 316SS', unidad: 'und', valorUnitario: 1430000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 42.0 },
    { id: 153, categoria: 'PROPELAS (MATERIALES)', nombre: 'CT1800 316SS', unidad: 'und', valorUnitario: 1690000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 62.0 },
    { id: 154, categoria: 'PROPELAS (MATERIALES)', nombre: 'CB400 304SS', unidad: 'und', valorUnitario: 150000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 3.2 },
    { id: 155, categoria: 'PROPELAS (MATERIALES)', nombre: 'CB500 304SS', unidad: 'und', valorUnitario: 200000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 4.3 },
    { id: 156, categoria: 'PROPELAS (MATERIALES)', nombre: 'CB600 304SS', unidad: 'und', valorUnitario: 250000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 5.5 },
    { id: 157, categoria: 'PROPELAS (MATERIALES)', nombre: 'CB800 304SS', unidad: 'und', valorUnitario: 335000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 7.3333 },
    { id: 158, categoria: 'PROPELAS (MATERIALES)', nombre: 'CB1000 304SS', unidad: 'und', valorUnitario: 250000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 15.0 },
    { id: 159, categoria: 'PROPELAS (MATERIALES)', nombre: 'CB1200 304SS', unidad: 'und', valorUnitario: 300000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 22.0 },
    { id: 160, categoria: 'PROPELAS (MATERIALES)', nombre: 'CB1500 304SS', unidad: 'und', valorUnitario: 620000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 30.0 },
    { id: 161, categoria: 'PROPELAS (MATERIALES)', nombre: 'CB1600 304SS', unidad: 'und', valorUnitario: 708333.3333333334, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 35.0 },
    { id: 162, categoria: 'PROPELAS (MATERIALES)', nombre: 'CB2000 304SS', unidad: 'und', valorUnitario: 990000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 50.0 },
    { id: 163, categoria: 'PROPELAS (MATERIALES)', nombre: 'CB2500 304SS', unidad: 'und', valorUnitario: 1250000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 62.0 },
    { id: 164, categoria: 'PROPELAS (MATERIALES)', nombre: 'CB3000 304SS', unidad: 'und', valorUnitario: 1500000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 74.4 },
    { id: 165, categoria: 'PROPELAS (MATERIALES)', nombre: 'CB3600 304SS', unidad: 'und', valorUnitario: 1900000.0, proveedor: 'CORTEACEROS', fecha: '11/0/2016', pesoUnitario: 124.0 },
    { id: 166, categoria: 'PROPELAS (MATERIALES)', nombre: 'CB1600 316SS', unidad: 'und', valorUnitario: 850000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 35.0 },
    { id: 167, categoria: 'PROPELAS (MATERIALES)', nombre: 'CB2000 316SS', unidad: 'und', valorUnitario: 1100000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 55.0 },
    { id: 168, categoria: 'PROPELAS (MATERIALES)', nombre: 'CB2500 316SS', unidad: 'und', valorUnitario: 1625000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 68.75 },
    { id: 169, categoria: 'PROPELAS (MATERIALES)', nombre: 'CB3000 316SS', unidad: 'und', valorUnitario: 1950000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 74.4 },
    { id: 170, categoria: 'PROPELAS (MATERIALES)', nombre: 'CB3600 316SS', unidad: 'und', valorUnitario: 1950000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 124.0 },
    { id: 171, categoria: 'PROPELAS (MATERIALES)', nombre: 'GC400 304SS', unidad: 'und', valorUnitario: 120000.0, proveedor: 'CORTEACEROS', fecha: '2016-04-26', pesoUnitario: 4.3 },
    { id: 172, categoria: 'PROPELAS (MATERIALES)', nombre: 'GC500 304SS', unidad: 'und', valorUnitario: 230000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 6.2 },
    { id: 173, categoria: 'PROPELAS (MATERIALES)', nombre: 'GC600 304SS', unidad: 'und', valorUnitario: 250000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 8.7 },
    { id: 174, categoria: 'PROPELAS (MATERIALES)', nombre: 'GC800 304SS', unidad: 'und', valorUnitario: 300000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 35.4 },
    { id: 175, categoria: 'PROPELAS (MATERIALES)', nombre: 'GC1000 304SS', unidad: 'und', valorUnitario: 420000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 62.0 },
    { id: 176, categoria: 'PROPELAS (MATERIALES)', nombre: 'GC1200 304SS', unidad: 'und', valorUnitario: 1020000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 81.2 },
    { id: 177, categoria: 'PROPELAS (MATERIALES)', nombre: 'GC1400 304SS', unidad: 'und', valorUnitario: 1300000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 100.4 },
    { id: 178, categoria: 'PROPELAS (MATERIALES)', nombre: 'GC1500 304SS', unidad: 'und', valorUnitario: 1400000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 110.0 },
    { id: 179, categoria: 'PROPELAS (MATERIALES)', nombre: 'GC1600 304SS', unidad: 'und', valorUnitario: 1500000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 115.0 },
    { id: 180, categoria: 'PROPELAS (MATERIALES)', nombre: 'GC1800 304SS', unidad: 'und', valorUnitario: 1700000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 130.52 },
    { id: 181, categoria: 'PROPELAS (MATERIALES)', nombre: 'GC400 316SS', unidad: 'und', valorUnitario: 240000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 4.3 },
    { id: 182, categoria: 'PROPELAS (MATERIALES)', nombre: 'GC600 316SS', unidad: 'und', valorUnitario: 325000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 8.7 },
    { id: 183, categoria: 'PROPELAS (MATERIALES)', nombre: 'GC1000 316SS', unidad: 'und', valorUnitario: 1100000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 62.0 },
    { id: 184, categoria: 'PROPELAS (MATERIALES)', nombre: 'GC1500 316SS', unidad: 'und', valorUnitario: 1750000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 110.0 },
    { id: 185, categoria: 'PROPELAS (MATERIALES)', nombre: 'GC1800 316SS', unidad: 'und', valorUnitario: 2210000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 130.52 },
    { id: 186, categoria: 'PROPELAS (MATERIALES)', nombre: 'GCE400 304SS', unidad: 'und', valorUnitario: 100000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 4.3 },
    { id: 187, categoria: 'PROPELAS (MATERIALES)', nombre: 'GCE400 316SS', unidad: 'und', valorUnitario: 130000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 4.3 },
    { id: 188, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 1 1/2" TRIPALA 304SS', unidad: 'und', valorUnitario: 230000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 3.0 },
    { id: 189, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 2" TRIPALA 304SS', unidad: 'und', valorUnitario: 240000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 4.0 },
    { id: 190, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 2 1/2" TRIPALA 304SS', unidad: 'und', valorUnitario: 260000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 5.0 },
    { id: 191, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 3" TRIPALA 304SS', unidad: 'und', valorUnitario: 280000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 6.0 },
    { id: 192, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 4" TRIPALA 304SS', unidad: 'und', valorUnitario: 325000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 8.0 },
    { id: 193, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 5" TRIPALA 304SS', unidad: 'und', valorUnitario: 430000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 10.0 },
    { id: 194, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 6" TRIPALA 304SS', unidad: 'und', valorUnitario: 550000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 13.0 },
    { id: 195, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 8" TRIPALA 304SS', unidad: 'und', valorUnitario: 650000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 16.0 },
    { id: 196, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 2" TRIPALA 316SS', unidad: 'und', valorUnitario: 260000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 4.0 },
    { id: 197, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 2 1/2" TRIPALA 316SS', unidad: 'und', valorUnitario: 280000.0, proveedor: 'CORTEACEROS', fecha: 'ASUMIDA', pesoUnitario: 5.0 },
    { id: 198, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 3" TRIPALA 316SS', unidad: 'und', valorUnitario: 310000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 7.0 },
    { id: 199, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 4" TRIPALA 316SS', unidad: 'und', valorUnitario: 350000.0, proveedor: 'CORTEACEROS', fecha: 'ASUMIDA', pesoUnitario: 8.0 },
    { id: 200, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 6" TRIPALA 316SS', unidad: 'und', valorUnitario: 600000.0, proveedor: 'CORTEACEROS', fecha: 'ASUMIDA', pesoUnitario: 13.0 },
    { id: 201, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 8" TRIPALA 316SS', unidad: 'und', valorUnitario: 700000.0, proveedor: 'CORTEACEROS', fecha: 'ASUMIDA', pesoUnitario: 16.0 },
    { id: 202, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 1 1/2" BIPALA 304SS', unidad: 'und', valorUnitario: 120000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 4.0 },
    { id: 203, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 2" BIPALA 304SS', unidad: 'und', valorUnitario: 150000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 5.0 },
    { id: 204, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 2 1/2" BIPALA 304SS', unidad: 'und', valorUnitario: 180000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 6.0 },
    { id: 205, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 3" BIPALA 304SS', unidad: 'und', valorUnitario: 230000.0, proveedor: 'CORTEACEROS', fecha: 'ASUMIDA', pesoUnitario: 8.0 },
    { id: 206, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 4" BIPALA 304SS', unidad: 'und', valorUnitario: 280000.0, proveedor: 'CORTEACEROS', fecha: 'ASUMIDA', pesoUnitario: 10.0 },
    { id: 207, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 6" BIPALA 304SS', unidad: 'und', valorUnitario: 350000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 12.0 },
    { id: 208, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 8" BIPALA 304SS', unidad: 'und', valorUnitario: 380000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 16.0 },
    { id: 209, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 2" BIPALA 316SS', unidad: 'und', valorUnitario: 240000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 6.0 },
    { id: 210, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 3" BIPALA 316SS', unidad: 'und', valorUnitario: 276000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 8.0 },
    { id: 211, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 4" BIPALA 316SS', unidad: 'und', valorUnitario: 336000.0, proveedor: 'CORTEACEROS', fecha: 'ASUMIDA', pesoUnitario: 8.0 },
    { id: 212, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 6" BIPALA 316SS', unidad: 'und', valorUnitario: 420000.0, proveedor: 'CORTEACEROS', fecha: 'ASUMIDA', pesoUnitario: 12.0 },
    { id: 213, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 8" BIPALA 316SS', unidad: 'und', valorUnitario: 456000.0, proveedor: 'CORTEACEROS', fecha: 'ASUMIDA', pesoUnitario: 16.0 },
    { id: 214, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 2" GC 304SS', unidad: 'und', valorUnitario: 140000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 4.0 },
    { id: 215, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 2 1/2" GC 304SS', unidad: 'und', valorUnitario: 180000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 5.0 },
    { id: 216, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 3" GC 304SS', unidad: 'und', valorUnitario: 310000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 6.0 },
    { id: 217, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 4" GC 304SS', unidad: 'und', valorUnitario: 340000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 8.0 },
    { id: 218, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 6" GC 304SS', unidad: 'und', valorUnitario: 450000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 13.0 },
    { id: 219, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 10" GC 304SS', unidad: 'und', valorUnitario: 650000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 25.0 },
    { id: 220, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 2" GC 316SS', unidad: 'und', valorUnitario: 260000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 4.0 },
    { id: 221, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 6" GC 316SS', unidad: 'und', valorUnitario: 600000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 13.0 },
    { id: 222, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 10" GC 316SS', unidad: 'und', valorUnitario: 780000.0, proveedor: 'CORTEACEROS', fecha: 'ESTIMADO', pesoUnitario: 25.0 },
    { id: 223, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 2" TURBINA 304SS', unidad: 'und', valorUnitario: 250000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 4.0 },
    { id: 224, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 2 1/2" TURBINA 304SS', unidad: 'und', valorUnitario: 280000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 5.0 },
    { id: 225, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE  3" TURBINA 304SS', unidad: 'und', valorUnitario: 310000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 6.0 },
    { id: 226, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE  4" TURBINA 304SS', unidad: 'und', valorUnitario: 340000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 8.0 },
    { id: 227, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 5" TURBINA 304SS', unidad: 'und', valorUnitario: 360000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 10.0 },
    { id: 228, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE  6" TURBINA 304SS', unidad: 'und', valorUnitario: 380000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 12.0 },
    { id: 229, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 2" TURBINA 316SS', unidad: 'und', valorUnitario: 325000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 4.0 },
    { id: 230, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 3" TURBINA 316SS', unidad: 'und', valorUnitario: 372000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 6.0 },
    { id: 231, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 4" TURBINA 316SS', unidad: 'und', valorUnitario: 360000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 8.0 },
    { id: 232, categoria: 'CASQUETES (MATERIALES)', nombre: 'CASQUETE 6" TURBINA 316SS', unidad: 'und', valorUnitario: 410000.0, proveedor: 'CORTEACEROS', fecha: '2015', pesoUnitario: 12.0 },
    { id: 233, categoria: 'MECANIZADOS', nombre: 'ACOPLE DIRECTO 1 "', unidad: 'und', valorUnitario: 180000.0, proveedor: 'MQJS', fecha: '2016-02-26', pesoUnitario: 0 },
    { id: 234, categoria: 'MECANIZADOS', nombre: 'ACOPLE DIRECTO 1 1/4"', unidad: 'und', valorUnitario: 180000.0, proveedor: 'MQJS', fecha: '2016-02-26', pesoUnitario: 0 },
    { id: 235, categoria: 'MECANIZADOS', nombre: 'ACOPLE DIRECTO 1 1/2"', unidad: 'und', valorUnitario: 180000.0, proveedor: 'MQJS', fecha: '2016-02-26', pesoUnitario: 0 },
    { id: 236, categoria: 'MECANIZADOS', nombre: 'ACOPLE DIRECTO 2"', unidad: 'und', valorUnitario: 202000.0, proveedor: 'INDUPROMET', fecha: '2016-12-07', pesoUnitario: 0 },
    { id: 237, categoria: 'MECANIZADOS', nombre: 'ACOPLE DIRECTO 2" PARTIDO', unidad: 'und', valorUnitario: 280000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 238, categoria: 'MECANIZADOS', nombre: 'ACOPLE DIRECTO 2 1/2"', unidad: 'und', valorUnitario: 220000.0, proveedor: 'INDUPROMET', fecha: '2018-12-07', pesoUnitario: 0 },
    { id: 239, categoria: 'MECANIZADOS', nombre: 'ACOPLE DIRECTO 3"', unidad: 'und', valorUnitario: 266000.0, proveedor: 'INDUPROMET', fecha: '2018-12-07', pesoUnitario: 0 },
    { id: 240, categoria: 'MECANIZADOS', nombre: 'EJE MACIZO 1"', unidad: 'und', valorUnitario: 60000.0, proveedor: 'MQJS', fecha: '2016-02-26', pesoUnitario: 0 },
    { id: 241, categoria: 'MECANIZADOS', nombre: 'EJE MACIZO 1 1/4"', unidad: 'und', valorUnitario: 60000.0, proveedor: 'MQJS', fecha: '2016-02-26', pesoUnitario: 0 },
    { id: 242, categoria: 'MECANIZADOS', nombre: 'EJE MACIZO 1 1/2"', unidad: 'und', valorUnitario: 77000.0, proveedor: 'INDUPROMET', fecha: '2018-12-07', pesoUnitario: 0 },
    { id: 243, categoria: 'MECANIZADOS', nombre: 'EJE MACIZO 2"', unidad: 'und', valorUnitario: 77000.0, proveedor: 'INDUPROMET', fecha: '2016-02-26', pesoUnitario: 0 },
    { id: 244, categoria: 'MECANIZADOS', nombre: 'EJE MACIZO BRIDADO 1 1/4"', unidad: 'und', valorUnitario: 400000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 245, categoria: 'MECANIZADOS', nombre: 'EJE MACIZO BRIDADO 1 1/2"', unidad: 'und', valorUnitario: 400000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 246, categoria: 'MECANIZADOS', nombre: 'EJE MACIZO BRIDADO 2"', unidad: 'und', valorUnitario: 480000.0, proveedor: 'INDUPROMET', fecha: '2017-01-25', pesoUnitario: 0 },
    { id: 247, categoria: 'MECANIZADOS', nombre: 'ACOPLE BRIDADO 1 1/4"', unidad: 'und', valorUnitario: 230000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 248, categoria: 'MECANIZADOS', nombre: 'ACOPLE BRIDADO 1 1/2"', unidad: 'und', valorUnitario: 230000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 249, categoria: 'MECANIZADOS', nombre: 'ACOPLE BRIDADO 2"', unidad: 'und', valorUnitario: 250000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 250, categoria: 'MECANIZADOS', nombre: 'ACOPLE BRIDADO 2 1/2"', unidad: 'und', valorUnitario: 300000.0, proveedor: 'INDUPROMET', fecha: '2016-06-09', pesoUnitario: 0 },
    { id: 251, categoria: 'MECANIZADOS', nombre: 'ACOPLE BRIDADO 3"', unidad: 'und', valorUnitario: 395000.0, proveedor: 'MQJS', fecha: '2016-02-26', pesoUnitario: 0 },
    { id: 252, categoria: 'MECANIZADOS', nombre: 'ACOPLE BRIDADO 4"', unidad: 'und', valorUnitario: 420000.0, proveedor: 'MQJS', fecha: '2016-02-26', pesoUnitario: 0 },
    { id: 253, categoria: 'MECANIZADOS', nombre: 'ACOPLE BRIDADO 6"', unidad: 'und', valorUnitario: 1305000.0, proveedor: 'MQJS', fecha: '2016-02-26', pesoUnitario: 0 },
    { id: 254, categoria: 'MECANIZADOS', nombre: 'ACOPLE BRIDADO 8"', unidad: 'und', valorUnitario: 1600000.0, proveedor: 'MQJS', fecha: '2016-02-26', pesoUnitario: 0 },
    { id: 255, categoria: 'MECANIZADOS', nombre: 'ACOPLE BRIDADO 10"', unidad: 'und', valorUnitario: 1900000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 256, categoria: 'MECANIZADOS', nombre: 'EJE TUBULAR 1 1/2"', unidad: 'und', valorUnitario: 400000.0, proveedor: 'INDUPROMET', fecha: '', pesoUnitario: 0 },
    { id: 257, categoria: 'MECANIZADOS', nombre: 'EJE TUBULAR 2"', unidad: 'und', valorUnitario: 550000.0, proveedor: 'INDUPROMET', fecha: '2016-06-09', pesoUnitario: 0 },
    { id: 258, categoria: 'MECANIZADOS', nombre: 'EJE TUBULAR 2 1/2"', unidad: 'und', valorUnitario: 600000.0, proveedor: 'INDUPROMET', fecha: '2016-11-28', pesoUnitario: 0 },
    { id: 259, categoria: 'MECANIZADOS', nombre: 'EJE TUBULAR 3"', unidad: 'und', valorUnitario: 1050000.0, proveedor: 'MQJS', fecha: '2016-02-26', pesoUnitario: 0 },
    { id: 260, categoria: 'MECANIZADOS', nombre: 'EJE TUBULAR 4"', unidad: 'und', valorUnitario: 1680000.0, proveedor: 'MQJS', fecha: '2016-02-26', pesoUnitario: 0 },
    { id: 261, categoria: 'MECANIZADOS', nombre: 'EJE TUBULAR 5"', unidad: 'und', valorUnitario: 2000000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 262, categoria: 'MECANIZADOS', nombre: 'EJE TUBULAR 6"', unidad: 'und', valorUnitario: 2300000.0, proveedor: 'MQJS', fecha: '2016-02-26', pesoUnitario: 0 },
    { id: 263, categoria: 'MECANIZADOS', nombre: 'EJE TUBULAR 8"', unidad: 'und', valorUnitario: 3500000.0, proveedor: 'MQJS', fecha: '2016-02-26', pesoUnitario: 0 },
    { id: 264, categoria: 'MECANIZADOS', nombre: 'EJE TUBULAR 8" 3 BRIDAS', unidad: 'und', valorUnitario: 7000000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 265, categoria: 'MECANIZADOS', nombre: 'EJE TUBULAR 10"', unidad: 'und', valorUnitario: 4800000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 266, categoria: 'MECANIZADOS', nombre: 'PROPELA T160', unidad: 'und', valorUnitario: 50000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 267, categoria: 'MECANIZADOS', nombre: 'PROPELA T200', unidad: 'und', valorUnitario: 50000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 268, categoria: 'MECANIZADOS', nombre: 'PROPELA T300', unidad: 'und', valorUnitario: 70000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 269, categoria: 'MECANIZADOS', nombre: 'PROPELA T350', unidad: 'und', valorUnitario: 80000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 270, categoria: 'MECANIZADOS', nombre: 'PROPELA T500', unidad: 'und', valorUnitario: 100000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 271, categoria: 'MECANIZADOS', nombre: 'PROPELA T550', unidad: 'und', valorUnitario: 130000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 272, categoria: 'MECANIZADOS', nombre: 'PROPELA T700', unidad: 'und', valorUnitario: 160000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 273, categoria: 'MECANIZADOS', nombre: 'PROPELA T800', unidad: 'und', valorUnitario: 200000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 274, categoria: 'MECANIZADOS', nombre: 'PROPELA T900', unidad: 'und', valorUnitario: 300000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 275, categoria: 'MECANIZADOS', nombre: 'PROPELA T1000', unidad: 'und', valorUnitario: 350000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 276, categoria: 'MECANIZADOS', nombre: 'PROPELA T1200', unidad: 'und', valorUnitario: 380000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 277, categoria: 'MECANIZADOS', nombre: 'MANZANA  1 1/2"', unidad: 'und', valorUnitario: 178200.0, proveedor: 'MQJS', fecha: '2016-01-07', pesoUnitario: 0 },
    { id: 278, categoria: 'MECANIZADOS', nombre: 'MANZANA 2"', unidad: 'und', valorUnitario: 200000.0, proveedor: 'MQJS', fecha: '2016-01-07', pesoUnitario: 0 },
    { id: 279, categoria: 'MECANIZADOS', nombre: 'MANZANA 3"', unidad: 'und', valorUnitario: 250000.0, proveedor: 'MQJS', fecha: '2016-01-07', pesoUnitario: 0 },
    { id: 280, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING T160', unidad: 'und', valorUnitario: 30000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 281, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING T200', unidad: 'und', valorUnitario: 30000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 282, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING T300', unidad: 'und', valorUnitario: 35000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 283, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING T350', unidad: 'und', valorUnitario: 40000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 284, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING T500', unidad: 'und', valorUnitario: 50000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 285, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING T550', unidad: 'und', valorUnitario: 60000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 286, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING T700', unidad: 'und', valorUnitario: 70000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 287, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING T800', unidad: 'und', valorUnitario: 80000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 288, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING T900', unidad: 'und', valorUnitario: 90000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 289, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING T1000', unidad: 'und', valorUnitario: 100000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 290, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING T1200', unidad: 'und', valorUnitario: 120000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 291, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CT200', unidad: 'und', valorUnitario: 30000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 292, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CT300', unidad: 'und', valorUnitario: 35000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 293, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CT400', unidad: 'und', valorUnitario: 45000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 294, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CT500', unidad: 'und', valorUnitario: 50000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 295, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CT600', unidad: 'und', valorUnitario: 60000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 296, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CT700', unidad: 'und', valorUnitario: 70000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 297, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CT800', unidad: 'und', valorUnitario: 80000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 298, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CT1000', unidad: 'und', valorUnitario: 100000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 299, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CT1200', unidad: 'und', valorUnitario: 120000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 300, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CT1500', unidad: 'und', valorUnitario: 150000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 301, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CT1800', unidad: 'und', valorUnitario: 180000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 302, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CT2000', unidad: 'und', valorUnitario: 200000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 303, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CT2500', unidad: 'und', valorUnitario: 250000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 304, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CT3000', unidad: 'und', valorUnitario: 300000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 305, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING GC400', unidad: 'und', valorUnitario: 45000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 306, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING GC500', unidad: 'und', valorUnitario: 50000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 307, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING GC600', unidad: 'und', valorUnitario: 60000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 308, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING GC800', unidad: 'und', valorUnitario: 80000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 309, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING GC1000', unidad: 'und', valorUnitario: 100000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 310, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING GC1200', unidad: 'und', valorUnitario: 120000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 311, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING GC1400', unidad: 'und', valorUnitario: 140000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 312, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING GC1500', unidad: 'und', valorUnitario: 150000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 313, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING GC1600', unidad: 'und', valorUnitario: 160000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 314, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING GC1800', unidad: 'und', valorUnitario: 180000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 315, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING GCE400', unidad: 'und', valorUnitario: 45000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 316, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CB400', unidad: 'und', valorUnitario: 40000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 317, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CB500', unidad: 'und', valorUnitario: 50000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 318, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CB600', unidad: 'und', valorUnitario: 60000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 319, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CB800', unidad: 'und', valorUnitario: 80000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 320, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CB1000', unidad: 'und', valorUnitario: 100000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 321, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CB1200', unidad: 'und', valorUnitario: 120000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 322, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CB1500', unidad: 'und', valorUnitario: 150000.0, proveedor: 'PINTUEMPRESAS', fecha: '2017', pesoUnitario: 0 },
    { id: 323, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CB1600', unidad: 'und', valorUnitario: 160000.0, proveedor: 'PINTUEMPRESAS', fecha: '2015', pesoUnitario: 0 },
    { id: 324, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CB2000', unidad: 'und', valorUnitario: 200000.0, proveedor: 'PINTUEMPRESAS', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 325, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CB2500', unidad: 'und', valorUnitario: 250000.0, proveedor: 'PINTUEMPRESAS', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 326, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CB3000', unidad: 'und', valorUnitario: 300000.0, proveedor: 'PINTUEMPRESAS', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 327, categoria: 'MECANIZADOS', nombre: 'SANDBLASTING CB3600', unidad: 'und', valorUnitario: 360000.0, proveedor: 'PINTUEMPRESAS', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 328, categoria: 'MECANIZADOS', nombre: 'PROPELA CT200', unidad: 'und', valorUnitario: 120000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 329, categoria: 'MECANIZADOS', nombre: 'PROPELA CT300', unidad: 'und', valorUnitario: 120000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 330, categoria: 'MECANIZADOS', nombre: 'PROPELA CT400', unidad: 'und', valorUnitario: 120000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 331, categoria: 'MECANIZADOS', nombre: 'PROPELA CT500', unidad: 'und', valorUnitario: 150000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 332, categoria: 'MECANIZADOS', nombre: 'PROPELA CT600', unidad: 'und', valorUnitario: 200000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 333, categoria: 'MECANIZADOS', nombre: 'PROPELA CT700', unidad: 'und', valorUnitario: 230000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 334, categoria: 'MECANIZADOS', nombre: 'PROPELA CT800', unidad: 'und', valorUnitario: 250000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 335, categoria: 'MECANIZADOS', nombre: 'PROPELA CT1000', unidad: 'und', valorUnitario: 530000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 336, categoria: 'MECANIZADOS', nombre: 'PROPELA CT1200', unidad: 'und', valorUnitario: 600000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 337, categoria: 'MECANIZADOS', nombre: 'PROPELA CT1500', unidad: 'und', valorUnitario: 620000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 338, categoria: 'MECANIZADOS', nombre: 'PROPELA CT1800', unidad: 'und', valorUnitario: 680000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 339, categoria: 'MECANIZADOS', nombre: 'PROPELA CT2000', unidad: 'und', valorUnitario: 720000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 340, categoria: 'MECANIZADOS', nombre: 'PROPELA CT2500', unidad: 'und', valorUnitario: 750000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 341, categoria: 'MECANIZADOS', nombre: 'PROPELA CT3000', unidad: 'und', valorUnitario: 980000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 342, categoria: 'MECANIZADOS', nombre: 'PROPELA CB400', unidad: 'und', valorUnitario: 200000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 343, categoria: 'MECANIZADOS', nombre: 'PROPELA CB500', unidad: 'und', valorUnitario: 215000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 344, categoria: 'MECANIZADOS', nombre: 'PROPELA CB600', unidad: 'und', valorUnitario: 230000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 345, categoria: 'MECANIZADOS', nombre: 'PROPELA CB800', unidad: 'und', valorUnitario: 310000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 346, categoria: 'MECANIZADOS', nombre: 'PROPELA CB1000', unidad: 'und', valorUnitario: 450000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 347, categoria: 'MECANIZADOS', nombre: 'PROPELA CB1200', unidad: 'und', valorUnitario: 500000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 348, categoria: 'MECANIZADOS', nombre: 'PROPELA CB1500', unidad: 'und', valorUnitario: 530000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 349, categoria: 'MECANIZADOS', nombre: 'PROPELA CB1600', unidad: 'und', valorUnitario: 550000.0, proveedor: 'NFS', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 350, categoria: 'MECANIZADOS', nombre: 'PROPELA CB2000', unidad: 'und', valorUnitario: 650000.0, proveedor: 'NFS', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 351, categoria: 'MECANIZADOS', nombre: 'PROPELA CB2500', unidad: 'und', valorUnitario: 760000.0, proveedor: 'NFS', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 352, categoria: 'MECANIZADOS', nombre: 'PROPELA CB3000', unidad: 'und', valorUnitario: 880000.0, proveedor: 'NFS', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 353, categoria: 'MECANIZADOS', nombre: 'PROPELA CB3600', unidad: 'und', valorUnitario: 1000000.0, proveedor: 'NFS', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 354, categoria: 'MECANIZADOS', nombre: 'DOBLADO CT1000', unidad: 'und', valorUnitario: 180000.0, proveedor: 'MECANICA JAN', fecha: '2016-02-02', pesoUnitario: 0 },
    { id: 355, categoria: 'MECANIZADOS', nombre: 'DOBLADO CT1200', unidad: 'und', valorUnitario: 260000.0, proveedor: 'MECANICA JAN', fecha: '2016-09-30', pesoUnitario: 0 },
    { id: 356, categoria: 'MECANIZADOS', nombre: 'DOBLADO CT1500', unidad: 'und', valorUnitario: 330000.0, proveedor: 'MECANICA JAN', fecha: '2016-09-30', pesoUnitario: 0 },
    { id: 357, categoria: 'MECANIZADOS', nombre: 'DOBLADO CT1800', unidad: 'und', valorUnitario: 480000.0, proveedor: 'MECANICA JAN', fecha: '2016-02-02', pesoUnitario: 0 },
    { id: 358, categoria: 'MECANIZADOS', nombre: 'DOBLADO CT2000', unidad: 'und', valorUnitario: 480000.0, proveedor: 'MECANICA JAN', fecha: '', pesoUnitario: 0 },
    { id: 359, categoria: 'MECANIZADOS', nombre: 'DOBLADO CT2500', unidad: 'und', valorUnitario: 480000.0, proveedor: 'MECANICA JAN', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 360, categoria: 'MECANIZADOS', nombre: 'DOBLADO CT3000', unidad: 'und', valorUnitario: 560000.0, proveedor: 'MECANICA JAN', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 361, categoria: 'MECANIZADOS', nombre: 'DOBLADO GC1000', unidad: 'und', valorUnitario: 180000.0, proveedor: 'MECANICA JAN', fecha: '2016-02-02', pesoUnitario: 0 },
    { id: 362, categoria: 'MECANIZADOS', nombre: 'DOBLADO GC1200', unidad: 'und', valorUnitario: 260000.0, proveedor: 'MECANICA JAN', fecha: '2016-02-02', pesoUnitario: 0 },
    { id: 363, categoria: 'MECANIZADOS', nombre: 'DOBLADO GC1500', unidad: 'und', valorUnitario: 330000.0, proveedor: 'MECANICA JAN', fecha: '2016-02-02', pesoUnitario: 0 },
    { id: 364, categoria: 'MECANIZADOS', nombre: 'DOBLADO GC1600', unidad: 'und', valorUnitario: 400000.0, proveedor: 'MECANICA JAN', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 365, categoria: 'MECANIZADOS', nombre: 'DOBLADO GC1800', unidad: 'und', valorUnitario: 480000.0, proveedor: 'MECANICA JAN', fecha: '2016-02-02', pesoUnitario: 0 },
    { id: 366, categoria: 'MECANIZADOS', nombre: 'DOBLADO CB800', unidad: 'und', valorUnitario: 50000.0, proveedor: 'MECANICA JAN', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 367, categoria: 'MECANIZADOS', nombre: 'DOBLADO CB1200', unidad: 'und', valorUnitario: 50000.0, proveedor: 'MECANICA JAN', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 368, categoria: 'MECANIZADOS', nombre: 'DOBLADO CB1500', unidad: 'und', valorUnitario: 50000.0, proveedor: 'MECANICA JAN', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 369, categoria: 'MECANIZADOS', nombre: 'DOBLADO CB1600', unidad: 'und', valorUnitario: 50000.0, proveedor: 'MECANICA JAN', fecha: '2016-02-02', pesoUnitario: 0 },
    { id: 370, categoria: 'MECANIZADOS', nombre: 'DOBLADO CB2000', unidad: 'und', valorUnitario: 100000.0, proveedor: 'MECANICA JAN', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 371, categoria: 'MECANIZADOS', nombre: 'DOBLADO CB2500', unidad: 'und', valorUnitario: 220000.0, proveedor: 'MECANICA JAN', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 372, categoria: 'MECANIZADOS', nombre: 'DOBLADO CB3000', unidad: 'und', valorUnitario: 260000.0, proveedor: 'MECANICA JAN', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 373, categoria: 'MECANIZADOS', nombre: 'DOBLADO CB3600', unidad: 'und', valorUnitario: 310000.0, proveedor: 'MECANICA JAN', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 374, categoria: 'MECANIZADOS', nombre: 'DOBLADO CASQUETE PEQUEÑO', unidad: 'und', valorUnitario: 80000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 375, categoria: 'MECANIZADOS', nombre: 'DOBLADO CASQEUTE GC 4"', unidad: 'und', valorUnitario: 170000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 376, categoria: 'MECANIZADOS', nombre: 'DOBLADO CASQUETE GC 6"', unidad: 'und', valorUnitario: 170000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 377, categoria: 'MECANIZADOS', nombre: 'DOBLADO CASQUETE GC 10"', unidad: 'und', valorUnitario: 280000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 378, categoria: 'MECANIZADOS', nombre: 'DOBLADO CASQUETE CT 2"', unidad: 'und', valorUnitario: 75000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 379, categoria: 'MECANIZADOS', nombre: 'DOBLADO CASQUETE CT 3"', unidad: 'und', valorUnitario: 75000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 380, categoria: 'MECANIZADOS', nombre: 'DOBLADO CASQUETE CT 4"', unidad: 'und', valorUnitario: 90000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 381, categoria: 'MECANIZADOS', nombre: 'DOBLADO CASQUETE CT 6"', unidad: 'und', valorUnitario: 170000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 382, categoria: 'MECANIZADOS', nombre: 'DOBLADO CASQUETE CT 8"', unidad: 'und', valorUnitario: 135000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 383, categoria: 'MECANIZADOS', nombre: 'DOBLADO CASQUETE CB 2 1/2"', unidad: 'und', valorUnitario: 90000.0, proveedor: 'MECANICA JAN', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 384, categoria: 'MECANIZADOS', nombre: 'DOBLADO CASQUETE CB 2"', unidad: 'und', valorUnitario: 90000.0, proveedor: 'MECANICA JAN', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 385, categoria: 'MECANIZADOS', nombre: 'DOBLADO CASQUETE CB 2 1/2"', unidad: 'und', valorUnitario: 90000.0, proveedor: 'MECANICA JAN', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 386, categoria: 'MECANIZADOS', nombre: 'DOBLADO CASQUETE CB 3"', unidad: 'und', valorUnitario: 90000.0, proveedor: 'MECANICA JAN', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 387, categoria: 'MECANIZADOS', nombre: 'DOBLADO CASQUETE CB 4"', unidad: 'und', valorUnitario: 120000.0, proveedor: 'MECANICA JAN', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 388, categoria: 'MECANIZADOS', nombre: 'DOBLADO CASQUETE CB 6"', unidad: 'und', valorUnitario: 170000.0, proveedor: 'MECANICA JAN', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 389, categoria: 'MECANIZADOS', nombre: 'DOBLADO CASQUETE CB2000', unidad: 'und', valorUnitario: 170000.0, proveedor: 'MECANICA JAN', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 390, categoria: 'MECANIZADOS', nombre: 'DOBLADO CASQUETE CB2500', unidad: 'und', valorUnitario: 210000.0, proveedor: 'MECANICA JAN', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 391, categoria: 'MECANIZADOS', nombre: 'DOBLADO CASQUETE CB3000', unidad: 'und', valorUnitario: 210000.0, proveedor: 'MECANICA JAN', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 392, categoria: 'MECANIZADOS', nombre: 'DOBLADO CASQUETE CB3600', unidad: 'und', valorUnitario: 250000.0, proveedor: 'MECANICA JAN', fecha: 'ESTIMADO', pesoUnitario: 0 },
    { id: 393, categoria: 'MECANIZADOS', nombre: 'PROPELA GC400', unidad: 'und', valorUnitario: 170000.0, proveedor: 'INDUPROMET', fecha: 'SUPUESTO', pesoUnitario: 0 },
    { id: 394, categoria: 'MECANIZADOS', nombre: 'PROPELA GC500', unidad: 'und', valorUnitario: 240000.0, proveedor: 'INDUPROMET', fecha: 'SUPUESTO', pesoUnitario: 0 },
    { id: 395, categoria: 'MECANIZADOS', nombre: 'PROPELA GC600', unidad: 'und', valorUnitario: 240000.0, proveedor: 'INDUPROMET', fecha: 'SUPUESTO', pesoUnitario: 0 },
    { id: 396, categoria: 'MECANIZADOS', nombre: 'PROPELA GC800', unidad: 'und', valorUnitario: 300000.0, proveedor: 'INDUPROMET', fecha: 'SUPUESTO', pesoUnitario: 0 },
    { id: 397, categoria: 'MECANIZADOS', nombre: 'PROPELA GC1000', unidad: 'und', valorUnitario: 476000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 398, categoria: 'MECANIZADOS', nombre: 'PROPELA GC1200', unidad: 'und', valorUnitario: 476000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 399, categoria: 'MECANIZADOS', nombre: 'PROPELA GC1400', unidad: 'und', valorUnitario: 560000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 400, categoria: 'MECANIZADOS', nombre: 'PROPELA GC1500', unidad: 'und', valorUnitario: 650000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 401, categoria: 'MECANIZADOS', nombre: 'PROPELA GC1600', unidad: 'und', valorUnitario: 650000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 402, categoria: 'MECANIZADOS', nombre: 'PROPELA GC1800', unidad: 'und', valorUnitario: 700000.0, proveedor: 'NFS', fecha: '2015', pesoUnitario: 0 },
    { id: 403, categoria: 'MECANIZADOS', nombre: 'PROPELA GCE400', unidad: 'und', valorUnitario: 240000.0, proveedor: 'INDUPROMET', fecha: '2016-06-14', pesoUnitario: 0 },
    { id: 404, categoria: 'MOTOREDUCTORES', nombre: 'RF07DRS71S4', unidad: 'und', valorUnitario: 1155000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 9.0 },
    { id: 405, categoria: 'MOTOREDUCTORES', nombre: 'RF17DRS63L4', unidad: 'und', valorUnitario: 1152000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 16.0 },
    { id: 406, categoria: 'MOTOREDUCTORES', nombre: 'RF17DRS71S4', unidad: 'und', valorUnitario: 1200000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 16.0 },
    { id: 407, categoria: 'MOTOREDUCTORES', nombre: 'RF17DRS71M4', unidad: 'und', valorUnitario: 1300000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 16.0 },
    { id: 408, categoria: 'MOTOREDUCTORES', nombre: 'RF17DRS80S4', unidad: 'und', valorUnitario: 1416000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 16.0 },
    { id: 409, categoria: 'MOTOREDUCTORES', nombre: 'RF27DRS63L4', unidad: 'und', valorUnitario: 1215000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 21.0 },
    { id: 410, categoria: 'MOTOREDUCTORES', nombre: 'RF27DRS71S4', unidad: 'und', valorUnitario: 1274900.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 21.0 },
    { id: 411, categoria: 'MOTOREDUCTORES', nombre: 'RF27DRS71M4', unidad: 'und', valorUnitario: 1350000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 21.0 },
    { id: 412, categoria: 'MOTOREDUCTORES', nombre: 'RF27DRS80S4', unidad: 'und', valorUnitario: 1492202.8, proveedor: 'SEW', fecha: '2015', pesoUnitario: 21.0 },
    { id: 413, categoria: 'MOTOREDUCTORES', nombre: 'RF27DRS80M4', unidad: 'und', valorUnitario: 1620000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 21.0 },
    { id: 414, categoria: 'MOTOREDUCTORES', nombre: 'RF27DRS90M4', unidad: 'und', valorUnitario: 1688526.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 21.0 },
    { id: 415, categoria: 'MOTOREDUCTORES', nombre: 'RF37DRS63L4', unidad: 'und', valorUnitario: 1300000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 21.0 },
    { id: 416, categoria: 'MOTOREDUCTORES', nombre: 'RF37DRS71S4', unidad: 'und', valorUnitario: 1340000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 36.0 },
    { id: 417, categoria: 'MOTOREDUCTORES', nombre: 'RF37DRS71M4', unidad: 'und', valorUnitario: 1430000.0, proveedor: 'SEW', fecha: '2016-02-18', pesoUnitario: 36.0 },
    { id: 418, categoria: 'MOTOREDUCTORES', nombre: 'RF37DRS80S4', unidad: 'und', valorUnitario: 1560000.0, proveedor: 'SEW', fecha: '2016-02-18', pesoUnitario: 36.0 },
    { id: 419, categoria: 'MOTOREDUCTORES', nombre: 'RF37DRS80M4', unidad: 'und', valorUnitario: 1690000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 36.0 },
    { id: 420, categoria: 'MOTOREDUCTORES', nombre: 'RF37DRS90M4', unidad: 'und', valorUnitario: 1710000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 36.0 },
    { id: 421, categoria: 'MOTOREDUCTORES', nombre: 'RF37DRS90L4', unidad: 'und', valorUnitario: 1850000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 36.0 },
    { id: 422, categoria: 'MOTOREDUCTORES', nombre: 'RF47DRS71S4', unidad: 'und', valorUnitario: 1540000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 36.0 },
    { id: 423, categoria: 'MOTOREDUCTORES', nombre: 'RF47DRS71M4', unidad: 'und', valorUnitario: 1605000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 36.0 },
    { id: 424, categoria: 'MOTOREDUCTORES', nombre: 'RF47DRS80S4', unidad: 'und', valorUnitario: 1730000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 36.0 },
    { id: 425, categoria: 'MOTOREDUCTORES', nombre: 'RF47DRS80M4', unidad: 'und', valorUnitario: 1882100.0000000002, proveedor: 'SEW', fecha: '2015', pesoUnitario: 43.0 },
    { id: 426, categoria: 'MOTOREDUCTORES', nombre: 'RF47DRS90M4', unidad: 'und', valorUnitario: 1993000.0, proveedor: 'SEW', fecha: '2016-07-27', pesoUnitario: 43.0 },
    { id: 427, categoria: 'MOTOREDUCTORES', nombre: 'RF47DRS90S4', unidad: 'und', valorUnitario: 1940274.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 43.0 },
    { id: 428, categoria: 'MOTOREDUCTORES', nombre: 'RF47DRS90L4', unidad: 'und', valorUnitario: 1893000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 43.0 },
    { id: 429, categoria: 'MOTOREDUCTORES', nombre: 'RF47DRS100L4', unidad: 'und', valorUnitario: 2270000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 43.0 },
    { id: 430, categoria: 'MOTOREDUCTORES', nombre: 'RF57DRS63L4', unidad: 'und', valorUnitario: 1515000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 58.0 },
    { id: 431, categoria: 'MOTOREDUCTORES', nombre: 'RF57DRS71S4', unidad: 'und', valorUnitario: 1562652.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 58.0 },
    { id: 432, categoria: 'MOTOREDUCTORES', nombre: 'RF57DRS71M4', unidad: 'und', valorUnitario: 1650000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 58.0 },
    { id: 433, categoria: 'MOTOREDUCTORES', nombre: 'RF57DRS80S4', unidad: 'und', valorUnitario: 1800000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 58.0 },
    { id: 434, categoria: 'MOTOREDUCTORES', nombre: 'RF57DRS80M4', unidad: 'und', valorUnitario: 1915000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 58.0 },
    { id: 435, categoria: 'MOTOREDUCTORES', nombre: 'RF57DRS90M4', unidad: 'und', valorUnitario: 1986000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 58.0 },
    { id: 436, categoria: 'MOTOREDUCTORES', nombre: 'RF57DRS90L4', unidad: 'und', valorUnitario: 2052000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 58.0 },
    { id: 437, categoria: 'MOTOREDUCTORES', nombre: 'RF57DRS100M4', unidad: 'und', valorUnitario: 2122000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 58.0 },
    { id: 438, categoria: 'MOTOREDUCTORES', nombre: 'RF57DRS100L4', unidad: 'und', valorUnitario: 2350000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 58.0 },
    { id: 439, categoria: 'MOTOREDUCTORES', nombre: 'RF57DRS132M4', unidad: 'und', valorUnitario: 4370000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 65.0 },
    { id: 440, categoria: 'MOTOREDUCTORES', nombre: 'RF67DRS71S4', unidad: 'und', valorUnitario: 2140000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 73.0 },
    { id: 441, categoria: 'MOTOREDUCTORES', nombre: 'RF67DRS71M4', unidad: 'und', valorUnitario: 2250000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 73.0 },
    { id: 442, categoria: 'MOTOREDUCTORES', nombre: 'RF67DRS80M4', unidad: 'und', valorUnitario: 2490000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 73.0 },
    { id: 443, categoria: 'MOTOREDUCTORES', nombre: 'RF67DRS90M4', unidad: 'und', valorUnitario: 2560000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 73.0 },
    { id: 444, categoria: 'MOTOREDUCTORES', nombre: 'RF67DRS90L4', unidad: 'und', valorUnitario: 2650000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 73.0 },
    { id: 445, categoria: 'MOTOREDUCTORES', nombre: 'RF67DRS100M4', unidad: 'und', valorUnitario: 2486000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 73.0 },
    { id: 446, categoria: 'MOTOREDUCTORES', nombre: 'RF67DRS100L4', unidad: 'und', valorUnitario: 2800000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 73.0 },
    { id: 447, categoria: 'MOTOREDUCTORES', nombre: 'RF67DRS112M4', unidad: 'und', valorUnitario: 2800000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 73.0 },
    { id: 448, categoria: 'MOTOREDUCTORES', nombre: 'RF67DRS132S4', unidad: 'und', valorUnitario: 3060000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 74.0 },
    { id: 449, categoria: 'MOTOREDUCTORES', nombre: 'RF77DRS71S4', unidad: 'und', valorUnitario: 2570000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 112.0 },
    { id: 450, categoria: 'MOTOREDUCTORES', nombre: 'RF77DRS71M4', unidad: 'und', valorUnitario: 2660000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 112.0 },
    { id: 451, categoria: 'MOTOREDUCTORES', nombre: 'RF77DRS80S4', unidad: 'und', valorUnitario: 2787000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 112.0 },
    { id: 452, categoria: 'MOTOREDUCTORES', nombre: 'RF77DRS80M4', unidad: 'und', valorUnitario: 2950000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 112.0 },
    { id: 453, categoria: 'MOTOREDUCTORES', nombre: 'RF77DRS90M4', unidad: 'und', valorUnitario: 3000000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 112.0 },
    { id: 454, categoria: 'MOTOREDUCTORES', nombre: 'RF77DRS90L4', unidad: 'und', valorUnitario: 3065000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 115.0 },
    { id: 455, categoria: 'MOTOREDUCTORES', nombre: 'RF77DRS100L4', unidad: 'und', valorUnitario: 2870000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 120.0 },
    { id: 456, categoria: 'MOTOREDUCTORES', nombre: 'RF77DRS100M4', unidad: 'und', valorUnitario: 3150000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 120.0 },
    { id: 457, categoria: 'MOTOREDUCTORES', nombre: 'RF77DRS132S4', unidad: 'und', valorUnitario: 3530000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 120.0 },
    { id: 458, categoria: 'MOTOREDUCTORES', nombre: 'RF77DRS132M4', unidad: 'und', valorUnitario: 5200000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 120.0 },
    { id: 459, categoria: 'MOTOREDUCTORES', nombre: 'RF87DRS80S4', unidad: 'und', valorUnitario: 3750000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 145.0 },
    { id: 460, categoria: 'MOTOREDUCTORES', nombre: 'RF87DRS80M4', unidad: 'und', valorUnitario: 3900000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 145.0 },
    { id: 461, categoria: 'MOTOREDUCTORES', nombre: 'RF87DRS90M4', unidad: 'und', valorUnitario: 3970000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 145.0 },
    { id: 462, categoria: 'MOTOREDUCTORES', nombre: 'RF87DRS100M4', unidad: 'und', valorUnitario: 4102000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 145.0 },
    { id: 463, categoria: 'MOTOREDUCTORES', nombre: 'RF87DRS100L4', unidad: 'und', valorUnitario: 4100000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 145.0 },
    { id: 464, categoria: 'MOTOREDUCTORES', nombre: 'RF87DRS112M4', unidad: 'und', valorUnitario: 4415000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 145.0 },
    { id: 465, categoria: 'MOTOREDUCTORES', nombre: 'RF87DRS132S4', unidad: 'und', valorUnitario: 4680000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 145.0 },
    { id: 466, categoria: 'MOTOREDUCTORES', nombre: 'RF87DRS132M4', unidad: 'und', valorUnitario: 6300000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 145.0 },
    { id: 467, categoria: 'MOTOREDUCTORES', nombre: 'RF87DRS160L4', unidad: 'und', valorUnitario: 6780000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 146.0 },
    { id: 468, categoria: 'MOTOREDUCTORES', nombre: 'RF87DRS160M4', unidad: 'und', valorUnitario: 6890000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 146.0 },
    { id: 469, categoria: 'MOTOREDUCTORES', nombre: 'RF97DRS80M4', unidad: 'und', valorUnitario: 5367000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 146.0 },
    { id: 470, categoria: 'MOTOREDUCTORES', nombre: 'RF97DRS90M4', unidad: 'und', valorUnitario: 5450000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 145.0 },
    { id: 471, categoria: 'MOTOREDUCTORES', nombre: 'RF97DRS100M4', unidad: 'und', valorUnitario: 5600000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 145.0 },
    { id: 472, categoria: 'MOTOREDUCTORES', nombre: 'RF97DRS100L4', unidad: 'und', valorUnitario: 5779200.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 145.0 },
    { id: 473, categoria: 'MOTOREDUCTORES', nombre: 'RF97DRS132S4', unidad: 'und', valorUnitario: 6200000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 190.0 },
    { id: 474, categoria: 'MOTOREDUCTORES', nombre: 'RF97DRS132M4', unidad: 'und', valorUnitario: 7800000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 190.0 },
    { id: 475, categoria: 'MOTOREDUCTORES', nombre: 'RF97DRS160S4', unidad: 'und', valorUnitario: 7900000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 190.0 },
    { id: 476, categoria: 'MOTOREDUCTORES', nombre: 'RF97DRS160M4', unidad: 'und', valorUnitario: 8220000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 190.0 },
    { id: 477, categoria: 'MOTOREDUCTORES', nombre: 'RF107DRS112M4', unidad: 'und', valorUnitario: 8520000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 220.0 },
    { id: 478, categoria: 'MOTOREDUCTORES', nombre: 'RF107DRS132M4', unidad: 'und', valorUnitario: 10420000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 220.0 },
    { id: 479, categoria: 'MOTOREDUCTORES', nombre: 'RF107DRS160S4', unidad: 'und', valorUnitario: 10550000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 220.0 },
    { id: 480, categoria: 'MOTOREDUCTORES', nombre: 'RF107DRS160M4', unidad: 'und', valorUnitario: 10860000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 220.0 },
    { id: 481, categoria: 'MOTOREDUCTORES', nombre: 'RF107DRS180S4', unidad: 'und', valorUnitario: 10300000.0, proveedor: 'SEW', fecha: '2016-09-30', pesoUnitario: 220.0 },
    { id: 482, categoria: 'MOTOREDUCTORES', nombre: 'RF137DRS132S4', unidad: 'und', valorUnitario: 10770000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 310.0 },
    { id: 483, categoria: 'MOTOREDUCTORES', nombre: 'RF137DRS132M4', unidad: 'und', valorUnitario: 13500000.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 310.0 },
    { id: 484, categoria: 'MOTOREDUCTORES', nombre: 'RF137DRS160M4', unidad: 'und', valorUnitario: 14000000.0, proveedor: 'SEW', fecha: '2016-09-30', pesoUnitario: 310.0 },
    { id: 485, categoria: 'MOTOREDUCTORES', nombre: 'RF137DRS180L4', unidad: 'und', valorUnitario: 14545000.0, proveedor: 'SEW', fecha: '2017-07-14', pesoUnitario: 310.0 },
    { id: 486, categoria: 'MOTOREDUCTORES', nombre: 'RF167DRS180S4', unidad: 'und', valorUnitario: 26550000.0, proveedor: 'SEW', fecha: '2016-07-12', pesoUnitario: 836.0 },
    { id: 487, categoria: 'MOTOREDUCTORES', nombre: 'FAF47DRS80S4', unidad: 'und', valorUnitario: 2400000.0, proveedor: 'SEW', fecha: '2016-07-21', pesoUnitario: 43.0 },
    { id: 488, categoria: 'MOTOREDUCTORES', nombre: 'FAF57DRS80S4', unidad: 'und', valorUnitario: 2700000.0, proveedor: 'SEW', fecha: '2016-07-21', pesoUnitario: 74.0 },
    { id: 489, categoria: 'MOTOREDUCTORES', nombre: 'FAF67DRS132S4', unidad: 'und', valorUnitario: 3650000.0, proveedor: 'SEW', fecha: '2016-07-28', pesoUnitario: 78.0 },
    { id: 490, categoria: 'MOTOREDUCTORES', nombre: 'FAF67DRS112M4', unidad: 'und', valorUnitario: 3360000.0, proveedor: 'SEW', fecha: '2016-07-28', pesoUnitario: 78.0 },
    { id: 491, categoria: 'MOTOREDUCTORES', nombre: 'FAF77DRS100M4', unidad: 'und', valorUnitario: 4500000.0, proveedor: 'SEW', fecha: '2016-07-21', pesoUnitario: 100.0 },
    { id: 492, categoria: 'MOTOREDUCTORES', nombre: 'FAF77DRS112M4', unidad: 'und', valorUnitario: 5300000.0, proveedor: 'SEW', fecha: 'ESTIMADO', pesoUnitario: 100.0 },
    { id: 493, categoria: 'MOTOREDUCTORES', nombre: 'FAF87DRS132M4', unidad: 'und', valorUnitario: 6728000.0, proveedor: 'SEW', fecha: '2016-08-09', pesoUnitario: 150.0 },
    { id: 494, categoria: 'MOTOREDUCTORES', nombre: 'FAF97DRS160M4', unidad: 'und', valorUnitario: 11860000.0, proveedor: 'SEW', fecha: '2016-09-26', pesoUnitario: 180.0 },
    { id: 495, categoria: 'MOTOREDUCTORES', nombre: 'FAF97DRS180S4', unidad: 'und', valorUnitario: 13200000.0, proveedor: 'SEW', fecha: 'ESTIMADO', pesoUnitario: 180.0 },
    { id: 496, categoria: 'MOTOREDUCTORES', nombre: 'FAF127DRS160S4', unidad: 'und', valorUnitario: 17812000.0, proveedor: 'SEW', fecha: '2018-05-16', pesoUnitario: 591.0 },
    { id: 497, categoria: 'MOTOREDUCTORES', nombre: 'FAF127DRS180L4', unidad: 'und', valorUnitario: 21450000.0, proveedor: 'SEW', fecha: '2017-01-04', pesoUnitario: 623.0 },
    { id: 498, categoria: 'MOTOREDUCTORES', nombre: 'SK12-90L/4', unidad: 'und', valorUnitario: 1259874.0, proveedor: 'SEW', fecha: '2015', pesoUnitario: 43.0 },
    { id: 499, categoria: 'MOTOREDUCTORES', nombre: 'SK1SMI40', unidad: 'und', valorUnitario: 800000.0, proveedor: 'VARIADORES', fecha: '2016-07-28', pesoUnitario: 12.0 },
    { id: 500, categoria: 'MOTOREDUCTORES', nombre: 'SK1SMI31', unidad: 'und', valorUnitario: 800000.0, proveedor: 'VARIADORES', fecha: 'SUPUESTO', pesoUnitario: 12.0 },
    { id: 501, categoria: 'MOTOREDUCTORES', nombre: 'SK1SMI50', unidad: 'und', valorUnitario: 950000.0, proveedor: 'VARIADORES', fecha: 'SUPUESTO', pesoUnitario: 16.0 },
    { id: 502, categoria: 'MOTOREDUCTORES', nombre: 'SK1SMI63', unidad: 'und', valorUnitario: 1400000.0, proveedor: 'VARIADORES', fecha: 'SUPUESTO', pesoUnitario: 22.0 },
    { id: 503, categoria: 'MOTOREDUCTORES', nombre: 'SK1SMI75', unidad: 'und', valorUnitario: 1800000.0, proveedor: 'VARIADORES', fecha: 'SUPUESTO', pesoUnitario: 31.0 },
    { id: 504, categoria: 'MOTOREDUCTORES', nombre: 'SK0721IEC71SK71S4', unidad: 'und', valorUnitario: 850000.0, proveedor: 'VARIADORES', fecha: '2016-02-14', pesoUnitario: 9.0 },
    { id: 505, categoria: 'MOTOREDUCTORES', nombre: 'SK1721IEC80SK80S4', unidad: 'und', valorUnitario: 1100000.0, proveedor: 'VARIADORES', fecha: '2016-02-14', pesoUnitario: 13.0 },
    { id: 506, categoria: 'MOTOREDUCTORES', nombre: 'SK5721IEC90SK90S4', unidad: 'und', valorUnitario: 1400000.0, proveedor: 'VARIADORES', fecha: '2016-02-14', pesoUnitario: 29.0 },
    { id: 507, categoria: 'MOTOREDUCTORES', nombre: 'SK5721IEC90SK90L4', unidad: 'und', valorUnitario: 1410000.0, proveedor: 'VARIADORES', fecha: '2016-02-14', pesoUnitario: 29.0 },
    { id: 508, categoria: 'MOTOREDUCTORES', nombre: 'SK3721IEC71SK71L4', unidad: 'und', valorUnitario: 1040000.0, proveedor: 'VARIADORES', fecha: '2016-02-14', pesoUnitario: 28.0 },
    { id: 509, categoria: 'MOTOREDUCTORES', nombre: 'SK7721IEC100SK100LA4', unidad: 'und', valorUnitario: 2260000.0, proveedor: 'VARIADORES', fecha: '2016-02-14', pesoUnitario: 87.0 },
    { id: 510, categoria: 'MOTOREDUCTORES', nombre: 'SK8721IEC132SK132S4', unidad: 'und', valorUnitario: 4900000.0, proveedor: 'VARIADORES', fecha: '2018-11-01', pesoUnitario: 97.0 },
    { id: 511, categoria: 'MOTOREDUCTORES', nombre: 'SF37DRS71S4', unidad: 'und', valorUnitario: 950000.0, proveedor: 'SEW', fecha: '1905-07-07', pesoUnitario: 25.0 },
    { id: 512, categoria: 'MOTOREDUCTORES', nombre: 'SK2282AF VL', unidad: 'und', valorUnitario: 2600000.0, proveedor: 'NORD', fecha: '2017-03-21', pesoUnitario: 0 },
    { id: 513, categoria: 'EXTRAS', nombre: 'PERNOS AG PEQUEÑO', unidad: 'und', valorUnitario: 50000.0, proveedor: '', fecha: '2016-02-02', pesoUnitario: 3.0 },
    { id: 514, categoria: 'EXTRAS', nombre: 'PERNOS AG MEDIANO', unidad: 'und', valorUnitario: 80000.0, proveedor: '', fecha: '2016-02-02', pesoUnitario: 5.0 },
    { id: 515, categoria: 'EXTRAS', nombre: 'PERNOS AG GRANDE', unidad: 'und', valorUnitario: 120000.0, proveedor: '', fecha: '2016-02-02', pesoUnitario: 9.0 },
    { id: 516, categoria: 'EXTRAS', nombre: 'PLACA AGITADOR', unidad: 'und', valorUnitario: 50000.0, proveedor: '', fecha: '2016-02-02', pesoUnitario: 0 },
    { id: 517, categoria: 'EXTRAS', nombre: 'LINTERNA DISEÑO BASICO', unidad: 'und', valorUnitario: 3000000.0, proveedor: 'INDUPROMET', fecha: 'ESTIMADO', pesoUnitario: 20.0 },
    { id: 518, categoria: 'INGENIERIA', nombre: 'ING. DE PROYECTOS', unidad: 'und', valorUnitario: 205000.0, proveedor: '', fecha: '', pesoUnitario: 0 },
    { id: 519, categoria: 'INGENIERIA', nombre: 'INGENIERO JUNIOR', unidad: 'und', valorUnitario: 129000.0, proveedor: '', fecha: '', pesoUnitario: 0 },
    { id: 520, categoria: 'INGENIERIA', nombre: 'DIRECTOR DE PROYECTOS', unidad: 'und', valorUnitario: 61862.0, proveedor: '', fecha: 'HORA', pesoUnitario: 0 },
    { id: 521, categoria: 'INGENIERIA', nombre: 'ING. PROYECTOS JUNIOR', unidad: 'und', valorUnitario: 129249.0, proveedor: '', fecha: '', pesoUnitario: 0 },
    { id: 522, categoria: 'INGENIERIA', nombre: 'ASISTENTE ADMINISTRATIVA', unidad: 'und', valorUnitario: 85000.0, proveedor: '', fecha: '', pesoUnitario: 0 },
    { id: 523, categoria: 'INGENIERIA', nombre: 'CONTADOR', unidad: 'und', valorUnitario: 30931.0, proveedor: '', fecha: 'HORA', pesoUnitario: 0 },
  ];

  function _persist() {
    try { localStorage.setItem(KEY, JSON.stringify(_items)); } catch (_) {}
  }

  async function _writeFile() {
    if (!_fileHandle) return;
    try {
      const ok = await NFS_HANDLES.ensurePermission(_fileHandle);
      if (!ok) { _fileHandle = null; _materialsUpdateFileStatus(); return; }
      const writable = await _fileHandle.createWritable();
      await writable.write(JSON.stringify(_items, null, 2));
      await writable.close();
      _materialsFlashSaved();
    } catch (_) {
      _fileHandle = null;
      _materialsUpdateFileStatus();
    }
  }

  function _afterMutate() {
    _persist();
    _writeFile();
  }

  function _norm(s) { return String(s || '').trim(); }

  function _normalizeItem(raw, fallbackId) {
    const x = raw || {};
    return {
      id: Number(x.id) || fallbackId,
      categoria: _norm(x.categoria).toUpperCase(),
      nombre: _norm(x.nombre),
      unidad: _norm(x.unidad) || 'und',
      valorUnitario: Number(x.valorUnitario) || 0,
      proveedor: _norm(x.proveedor),
      fecha: _norm(x.fecha),
      pesoUnitario: Number(x.pesoUnitario) || 0,
    };
  }

  function _nextId() {
    return _items.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) + 1;
  }

  function _load() {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) {
        _items = parsed.map((x, i) => _normalizeItem(x, i + 1));
        return;
      }
    } catch (_) {}
    _items = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
    _persist();
  }

  return {
    load: _load,
    getAll() { return [..._items]; },
    getCategories() {
      return [...new Set(_items.map(x => x.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
    },
    findById(id) {
      return _items.find(x => Number(x.id) === Number(id)) || null;
    },
    add(item) {
      const it = _normalizeItem(item, _nextId());
      it.id = _nextId();
      _items.push(it);
      _afterMutate();
      return it;
    },
    update(id, patch) {
      const it = _items.find(x => Number(x.id) === Number(id));
      if (!it) return false;
      Object.assign(it, _normalizeItem({ ...it, ...patch }, it.id));
      _afterMutate();
      return true;
    },
    remove(id) {
      _items = _items.filter(x => Number(x.id) !== Number(id));
      _afterMutate();
    },
    reset() {
      _items = JSON.parse(JSON.stringify(DEFAULT_ITEMS));
      _afterMutate();
    },
    exportJSON() {
      return JSON.stringify(_items, null, 2);
    },
    importJSON(text) {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('Formato inválido.');
      _items = parsed.map((x, i) => _normalizeItem(x, i + 1));
      _afterMutate();
    },
    setFileHandle(h) { _fileHandle = h; },
    getFileHandle() { return _fileHandle; },
    handleKey: HANDLE_KEY,
  };
})();

function _escMat(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _fmtCOPMat(n) {
  return '$' + (Number(n) || 0).toLocaleString('es-CO');
}

function openMaterialsModal() {
  _renderMaterialsTable();
  _populateMaterialCategoryDatalist();
  _materialsUpdateFileStatus();
  document.getElementById('materialsModal').classList.remove('hidden');
}

function closeMaterialsModal() {
  document.getElementById('materialsModal').classList.add('hidden');
  if (typeof recalcCostPartsFromMaterials === 'function') recalcCostPartsFromMaterials();
  if (typeof calculateCosteo === 'function') calculateCosteo();
}

function _materialsModalOverlayClick(e) {
  if (e.target.id === 'materialsModal') closeMaterialsModal();
}

function _populateMaterialCategoryDatalist() {
  const dl = document.getElementById('mat_categorias');
  if (!dl) return;
  dl.innerHTML = NFS_MATERIALS.getCategories().map(c => `<option value="${_escMat(c)}"></option>`).join('');
}

function _renderMaterialsTable() {
  const tbody = document.getElementById('materialsTableBody');
  if (!tbody) return;
  const filter = (document.getElementById('mat_filter')?.value || '').trim().toLowerCase();
  let rows = NFS_MATERIALS.getAll();
  if (filter) {
    rows = rows.filter(r =>
      r.nombre.toLowerCase().includes(filter) ||
      r.categoria.toLowerCase().includes(filter) ||
      r.proveedor.toLowerCase().includes(filter));
  }
  tbody.innerHTML = '';
  rows.forEach(m => {
    const tr = document.createElement('tr');
    tr.dataset.id = m.id;
    tr.innerHTML =
      `<td>${_escMat(m.categoria)}</td>` +
      `<td>${_escMat(m.nombre)}</td>` +
      `<td>${_escMat(m.unidad)}</td>` +
      `<td>${_escMat(_fmtCOPMat(m.valorUnitario))}</td>` +
      `<td>${_escMat(m.proveedor)}</td>` +
      `<td>${_escMat(m.fecha)}</td>` +
      `<td class="db-td-actions">` +
      `<button class="btn-db btn-db-edit" onclick="_editMaterial(${m.id},this)">✏ Editar</button>` +
      `<button class="btn-db btn-db-del" onclick="_deleteMaterial(${m.id})">🗑</button>` +
      `</td>`;
    tbody.appendChild(tr);
  });
}

function _editMaterial(id, btn) {
  const tr = btn.closest('tr');
  const m = NFS_MATERIALS.findById(id);
  if (!tr || !m) return;
  tr.innerHTML =
    `<td><input class="db-input" list="mat_categorias" value="${_escMat(m.categoria)}" /></td>` +
    `<td><input class="db-input" value="${_escMat(m.nombre)}" /></td>` +
    `<td><input class="db-input" value="${_escMat(m.unidad)}" /></td>` +
    `<td><input class="db-input" type="number" step="1" min="0" value="${Number(m.valorUnitario) || 0}" /></td>` +
    `<td><input class="db-input" value="${_escMat(m.proveedor)}" /></td>` +
    `<td><input class="db-input" value="${_escMat(m.fecha)}" /></td>` +
    `<td class="db-td-actions">` +
    `<button class="btn-db btn-db-save" onclick="_saveMaterial(${m.id},this)">✔ Guardar</button>` +
    `<button class="btn-db btn-db-cancel" onclick="_renderMaterialsTable()">✖</button>` +
    `</td>`;
}

function _saveMaterial(id, btn) {
  const tr = btn.closest('tr');
  const inputs = tr.querySelectorAll('input');
  const [categoria, nombre, unidad, valorUnitario, proveedor, fecha] = [...inputs].map(i => i.value);
  if (!nombre.trim()) { alert('El nombre/descripción es obligatorio.'); return; }
  NFS_MATERIALS.update(id, { categoria, nombre, unidad, valorUnitario, proveedor, fecha });
  _renderMaterialsTable();
  _populateMaterialCategoryDatalist();
  if (typeof recalcCostPartsFromMaterials === 'function') recalcCostPartsFromMaterials();
}

function _deleteMaterial(id) {
  if (!confirm('¿Eliminar este material/servicio de la base?\n(Las partes que lo usan en su lista de materiales quedarán con una referencia inválida.)')) return;
  NFS_MATERIALS.remove(id);
  _renderMaterialsTable();
}

function addMaterialRow() {
  const categoria = document.getElementById('mat_new_categoria').value.trim();
  const nombre = document.getElementById('mat_new_nombre').value.trim();
  const unidad = document.getElementById('mat_new_unidad').value.trim() || 'und';
  const valorUnitario = Number(document.getElementById('mat_new_valor').value) || 0;
  const proveedor = document.getElementById('mat_new_proveedor').value.trim();
  if (!nombre) { alert('Ingrese el nombre/descripción del material o servicio.'); return; }
  NFS_MATERIALS.add({ categoria, nombre, unidad, valorUnitario, proveedor, fecha: '' });
  document.getElementById('mat_new_categoria').value = '';
  document.getElementById('mat_new_nombre').value = '';
  document.getElementById('mat_new_unidad').value = '';
  document.getElementById('mat_new_valor').value = '';
  document.getElementById('mat_new_proveedor').value = '';
  _renderMaterialsTable();
  _populateMaterialCategoryDatalist();
}

function resetMaterials() {
  if (!confirm('¿Restaurar base de materiales por defecto?')) return;
  NFS_MATERIALS.reset();
  _renderMaterialsTable();
  _populateMaterialCategoryDatalist();
}

function exportMaterialsJSON() {
  const blob = new Blob([NFS_MATERIALS.exportJSON()], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: 'materiales.json' });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importMaterialsJSON() {
  const input = Object.assign(document.createElement('input'), { type: 'file', accept: '.json,application/json' });
  input.onchange = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      if (!confirm('Esto reemplazará la base de materiales actual. ¿Continuar?')) return;
      NFS_MATERIALS.importJSON(text);
      _renderMaterialsTable();
      _populateMaterialCategoryDatalist();
      if (typeof recalcCostPartsFromMaterials === 'function') recalcCostPartsFromMaterials();
    } catch (err) {
      alert('No fue posible importar el archivo: ' + err.message);
    }
  };
  input.click();
}

/* ── File System Access API – connect materials file ── */

async function materialsConnectFile() {
  if (!window.showOpenFilePicker) {
    alert('Tu navegador no soporta escritura directa a archivos (File System Access API).\n\nUsa "Exportar"/"Importar". Chrome/Edge 86+ soportan esta función.');
    return;
  }
  try {
    const [handle] = await window.showOpenFilePicker({
      id: 'nfs-materials',
      types: [{ description: 'Base de materiales NFS (JSON)', accept: { 'application/json': ['.json'] } }],
      multiple: false,
    });
    const ok = await NFS_HANDLES.ensurePermission(handle);
    if (!ok) { alert('Se requiere permiso de escritura para vincular el archivo.'); return; }

    const file = await handle.getFile();
    const text = await file.text();
    if (text.trim()) {
      try { NFS_MATERIALS.importJSON(text); } catch (_) { /* keep current if invalid */ }
    }

    NFS_MATERIALS.setFileHandle(handle);
    await NFS_HANDLES.save(NFS_MATERIALS.handleKey, handle);
    _renderMaterialsTable();
    _populateMaterialCategoryDatalist();
    _materialsUpdateFileStatus();
  } catch (e) {
    if (e.name !== 'AbortError') alert('Error al conectar con el archivo:\n' + e.message);
  }
}

async function _materialsTryAutoReconnect() {
  const handle = await NFS_HANDLES.load(NFS_MATERIALS.handleKey);
  if (!handle) return;
  const ok = await NFS_HANDLES.ensurePermission(handle);
  if (!ok) return;
  NFS_MATERIALS.setFileHandle(handle);
  _materialsUpdateFileStatus();
}

function _materialsUpdateFileStatus() {
  const el = document.getElementById('materialsFileStatus');
  if (!el) return;
  const h = NFS_MATERIALS.getFileHandle();
  if (h) {
    el.className = 'db-file-status db-file-connected';
    el.innerHTML =
      '<span class="db-file-icon">🔗</span>' +
      'Vinculado a <strong>' + _escMat(h.name) + '</strong> – cambios guardados automáticamente en el archivo' +
      '<span id="materialsSaveIndicator" class="db-save-indicator"></span>';
  } else {
    el.className = 'db-file-status db-file-disconnected';
    el.innerHTML =
      '<span class="db-file-icon">💾</span>' +
      'Cambios guardados en el navegador. ' +
      '<button class="btn-db-link" onclick="materialsConnectFile()">Vincular archivo JSON…</button>' +
      ' para persistencia permanente.';
  }
}

function _materialsFlashSaved() {
  const el = document.getElementById('materialsSaveIndicator');
  if (!el) return;
  el.textContent = ' ✓ guardado';
  el.style.opacity = '1';
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => { el.style.opacity = '0'; }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
  NFS_MATERIALS.load();
  _materialsTryAutoReconnect();
});
