export const mapCoordinations = {
  homePosition: [59.9287, 11.7025], // Coordinates for Mads' House
  madsForestPosition: { name: 'forest1', coord: [59.945, 11.695] }, // Coordinates for Mads' Dad's Forest
  bjoernForestPosition: { name: 'forest2', coord: [60, 11.755] }, // Coordinates for Bjoern's Forest
  knutForestPosition: { name: 'forest3', coord: [59.9677, 11.56005] }, // Coordinates for Knut's Forest 59.96070,11.56955, you can get these from QGIS, by right click inthe center of where you want and get the coordinates of the desired CRS
  akselForestPosition: { name: 'forest4', coord: [59.962, 11.72415] }, // Coordinates for Knut's Forest 59.96070,11.56955, you can get these from QGIS, by right click inthe center of where you want and get the coordinates of the desired CRS
  norwayPosition: [59.9139, 10.7522], // Coordinates for Oslo, Norway
};
export const initialPrices = {
  granSagtommerPrice: '',
  granMassevirkePrice: '',
  furuSagtommerPrice: '',
  furuMassevirkePrice: '',
  lauvSagtommerPrice: '',
  lauvMassevirkePrice: '',
  hogstUtkPrice: '',
};
export const nibioGetFeatInfoHKBaseParams = {
  language: 'nor',
  SERVICE: 'WMS',
  VERSION: '1.3.0',
  REQUEST: 'GetFeatureInfo',
  LAYERS: 'hogstklasser',
  STYLES: '',
  FORMAT: 'image/png',
  QUERY_LAYERS: 'hogstklasser',
  INFO_FORMAT: 'application/vnd.ogc.gml', // text/html, application/vnd.ogc.gml, text/plain
  FEATURE_COUNT: 10,
};
export const nibioGetFeatInfoMISBaseParams = {
  language: 'nor',
  SERVICE: 'WMS',
  LAYERS:
    'Livsmiljo_ikkeutvalgt,Livsmiljo,Hule_lauvtrar_punkt,Rikbarkstrar_alle,Trar_m_hengelav_alle,Bekkeklofter,Leirraviner,Rik_bakkevegetasjon,Brannflater,Gamle_trar,Eldre_lauvsuksesjon,Liggende_dod_ved,Staende_dod_ved,Nokkelbiotop,Bergvegger_alle',
  VERSION: '1.3.0',
  REQUEST: 'GetFeatureInfo',
  STYLES: '',
  FORMAT: 'image/png',
  QUERY_LAYERS:
    'Livsmiljo_ikkeutvalgt,Livsmiljo,Hule_lauvtrar_punkt,Rikbarkstrar_alle,Trar_m_hengelav_alle,Bekkeklofter,Leirraviner,Rik_bakkevegetasjon,Brannflater,Gamle_trar,Eldre_lauvsuksesjon,Liggende_dod_ved,Staende_dod_ved,Nokkelbiotop,Bergvegger_alle',
  INFO_FORMAT: 'application/vnd.ogc.gml', // text/html, application/vnd.ogc.gml, text/plain
  FEATURE_COUNT: 10,
};

export const CSV_URLS = {
  GRAN: '/csvs/gran.csv',
  FURU: '/csvs/furu.csv',
  FEATUREINFOS: '/csvs/featureInfos.csv',
};
export const MIS_BESTAND_IDs = [
  '1-298',
  '1-248',
  '1-207',
  '1-217',
  '1-251',
  '1-26',
  '1-161',
];
export const TREANTALL_PER_HEKTAR = 200;

export const SPECIES = {
  GRAN: 'Gran',
  FURU: 'Furu',
  LAU: 'Bjørk / lauv',
};

export const SPECIES_PRICES = {
  GRAN: 674,
  FURU: 598,
  LAU: 574,
};

export const HIDE_POLYGON_ZOOM_LEVEL = 10;
export const MAP_DEFAULT_ZOOM_LEVEL = 13;

export const madsPolygonsPNGBounds = [
  [59.9283312840000022, 11.6844372829999994], // Bottom-left corner
  [59.9593366419999967, 11.7499393919999999], // Top-right corner
];
export const bjoernPolygonsPNGBounds = [
  [59.963530782, 11.892033508], // Bottom-left corner
  [60.033538097, 11.694021503], // Top-right corner
];

// I got these info from the QGIS PNG layer properties
// Make sure the polygons are reprojected to 4236 and then print out the PNG
export const knutPolygonsPNGBounds = [
  [59.9133344939999972, 11.4617220300000007], // Bottom-left corner
  [60.0107517499999972, 11.6901970350000006], // Top-right corner
];

export const akselPolygonsPNGBounds = [
  [59.9209034235166982, 11.6422669866217117], // Bottom-left corner
  [60.0127997021416988, 11.8577935105911383], // Top-right corner
];

export const forbideanAreas = [
  21, 29, 39, 92, 70, 35, 31, 18, 123, 101, 201, 173, 222, 220, 273, 161, 305,
  268, 321, 137, 218, 285, 310, 312, 316, 317, 299, 294, 381, 109, 105, 82, 362,
  395,
];

export const unwantedMISFeatureKeys = ['boundedBy', 'uuid_tekst', 'ogc_fid'];

export const desiredFeatInfoAttrHKLayer = {
  teig_best_nr: 'Bestand nr',
  hogstkl_verdi: 'Hogstklasse',
  bonitet_beskrivelse: 'Bonitet',
  bontre_beskrivelse: 'Treslag',
  alder: 'Alder',
  arealDAA: 'Areal',
  carbon_stored: 'CO2 lagret totalt',
  carbon_captured_next_year: 'CO2 lagret årlig',
};

export const desiredFeatInfoAttrHKLayerWithUnits = {
  ...desiredFeatInfoAttrHKLayer,
  arealDAA: 'Areal (daa)',
  carbon_stored: 'CO2 lagret totalt (T)',
  carbon_captured_next_year: 'CO2 lagret årlig (T)',
};
