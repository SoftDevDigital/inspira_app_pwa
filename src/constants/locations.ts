/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LocationState {
  name: string;
  cities: string[];
}

export interface Country {
  name: string;
  states: LocationState[];
}

export const MEXICO_STATES: LocationState[] = [
  { name: 'Aguascalientes', cities: ['Aguascalientes', 'Jesús María', 'Calvillo', 'Pabellón de Arteaga'] },
  { name: 'Baja California', cities: ['Tijuana', 'Mexicali', 'Ensenada', 'Rosarito', 'Tecate'] },
  { name: 'Baja California Sur', cities: ['La Paz', 'Los Cabos', 'Loreto', 'Mulegé'] },
  { name: 'Campeche', cities: ['Campeche', 'Ciudad del Carmen', 'Champotón', 'Escárcega'] },
  { name: 'Chiapas', cities: ['Tuxtla Gutiérrez', 'Tapachula', 'San Cristóbal de las Casas', 'Comitán'] },
  { name: 'Chihuahua', cities: ['Chihuahua', 'Ciudad Juárez', 'Cuauhtémoc', 'Delicias', 'Parral'] },
  { name: 'Ciudad de México', cities: ['Álvaro Obregón', 'Benito Juárez', 'Coyoacán', 'Cuauhtémoc', 'Gustavo A. Madero', 'Iztapalapa', 'Miguel Hidalgo', 'Tlalpan'] },
  { name: 'Coahuila', cities: ['Saltillo', 'Torreón', 'Monclova', 'Piedras Negras', 'Acuña'] },
  { name: 'Colima', cities: ['Colima', 'Manzanillo', 'Villa de Álvarez', 'Tecomán'] },
  { name: 'Durango', cities: ['Durango', 'Gómez Palacio', 'Lerdo', 'Santiago Papasquiaro'] },
  { name: 'Estado de México', cities: ['Toluca', 'Naucalpan', 'Tlalnepantla', 'Ecatepec', 'Nezahualcóyotl', 'Huixquilucan', 'Metepec'] },
  { name: 'Guanajuato', cities: ['León', 'Irapuato', 'Celaya', 'Salamanca', 'Guanajuato', 'San Miguel de Allende'] },
  { name: 'Guerrero', cities: ['Acapulco', 'Chilpancingo', 'Iguala', 'Taxco', 'Zihuatanejo'] },
  { name: 'Hidalgo', cities: ['Pachuca', 'Tulancingo', 'Tula', 'Ixmiquilpan', 'Mineral de la Reforma'] },
  { name: 'Jalisco', cities: ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tonalá', 'Puerto Vallarta', 'Tlajomulco'] },
  { name: 'Michoacán', cities: ['Morelia', 'Uruapan', 'Zamora', 'Lázaro Cárdenas', 'Pátzcuaro'] },
  { name: 'Morelos', cities: ['Cuernavaca', 'Jiutepec', 'Cuautla', 'Temixco', 'Emiliano Zapata'] },
  { name: 'Nayarit', cities: ['Tepic', 'Bahía de Banderas', 'Compostela', 'Xalisco'] },
  { name: 'Nuevo León', cities: ['Monterrey', 'San Pedro Garza García', 'San Nicolás de los Garza', 'Guadalupe', 'Apodaca', 'Santa Catarina'] },
  { name: 'Oaxaca', cities: ['Oaxaca de Juárez', 'San Juan Bautista Tuxtepec', 'Salina Cruz', 'Juchitán'] },
  { name: 'Puebla', cities: ['Puebla de Zaragoza', 'Tehuacán', 'San Andrés Cholula', 'San Pedro Cholula', 'Atlixco'] },
  { name: 'Querétaro', cities: ['Santiago de Querétaro', 'San Juan del Río', 'Corregidora', 'El Marqués'] },
  { name: 'Quintana Roo', cities: ['Cancún', 'Playa del Carmen', 'Chetumal', 'Cozumel', 'Tulum'] },
  { name: 'San Luis Potosí', cities: ['San Luis Potosí', 'Soledad de Graciano Sánchez', 'Ciudad Valles', 'Matehuala'] },
  { name: 'Sinaloa', cities: ['Culiacán', 'Mazatlán', 'Los Mochis', 'Guasave'] },
  { name: 'Sonora', cities: ['Hermosillo', 'Ciudad Obregón', 'Nogales', 'San Luis Río Colorado', 'Guaymas'] },
  { name: 'Tabasco', cities: ['Villahermosa', 'Cárdenas', 'Comalcalco', 'Huimanguillo'] },
  { name: 'Tamaulipas', cities: ['Reynosa', 'Matamoros', 'Nuevo Laredo', 'Tampico', 'Ciudad Victoria'] },
  { name: 'Tlaxcala', cities: ['Tlaxcala', 'Apizaco', 'Huamantla', 'Chiautempan'] },
  { name: 'Veracruz', cities: ['Veracruz', 'Xalapa', 'Coatzacoalcos', 'Minatitlán', 'Boca del Río', 'Orizaba'] },
  { name: 'Yucatán', cities: ['Mérida', 'Kanasín', 'Valladolid', 'Tizimín', 'Progreso'] },
  { name: 'Zacatecas', cities: ['Zacatecas', 'Fresnillo', 'Guadalupe', 'Jerez'] },
];

export const COUNTRIES: Country[] = [
  {
    name: 'México',
    states: MEXICO_STATES,
  },
  {
    name: 'Estados Unidos',
    states: [
      { name: 'California', cities: ['Los Angeles', 'San Francisco', 'San Diego'] },
      { name: 'Texas', cities: ['Houston', 'Austin', 'Dallas'] },
      { name: 'Florida', cities: ['Miami', 'Orlando', 'Tampa'] }
    ],
  },
  {
    name: 'Colombia',
    states: [
      { name: 'Bogotá D.C.', cities: ['Bogotá'] },
      { name: 'Antioquia', cities: ['Medellín', 'Envigado', 'Itagüí'] },
      { name: 'Valle del Cauca', cities: ['Cali', 'Palmira', 'Buenaventura'] }
    ],
  },
  {
    name: 'España',
    states: [
      { name: 'Madrid', cities: ['Madrid', 'Alcalá de Henares', 'Móstoles'] },
      { name: 'Cataluña', cities: ['Barcelona', 'L\'Hospitalet de Llobregat', 'Badalona'] },
      { name: 'Andalucía', cities: ['Sevilla', 'Málaga', 'Córdoba'] }
    ],
  },
  {
    name: 'Otro',
    states: [],
  }
];
