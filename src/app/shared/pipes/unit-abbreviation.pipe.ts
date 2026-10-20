import { Pipe, PipeTransform } from '@angular/core';

export const UNIT_ABBREVIATIONS: Record<string, string> = {
  'UNIDAD': 'UND',
  'UNIDADES': 'UND',
  'UND': 'UND',
  'NIU': 'UND',

  'BLISTER': 'BLS',
  'BLÍSTER': 'BLS',
  'BLISTERS': 'BLS',
  'BLÍSTERES': 'BLS',
  'BLS': 'BLS',

  'CAJA': 'CJA',
  'CAJAS': 'CJA',
  'CJA': 'CJA',
  'CAJ': 'CJA',
  'BX': 'CJA',

  'FRASCO': 'FCO',
  'FRASCOS': 'FCO',
  'FCO': 'FCO',
  'FRC': 'FCO',

  'AMPOLLA': 'AMP',
  'AMPOLLAS': 'AMP',
  'AMP': 'AMP',

  'TUBO': 'TUB',
  'TUBOS': 'TUB',
  'TUB': 'TUB',

  'PAQUETE': 'PQT',
  'PAQUETES': 'PQT',
  'PQT': 'PQT',
  'PAQ': 'PQT',

  'SOBRE': 'SOB',
  'SOBRES': 'SOB',
  'SOB': 'SOB',

  'DISPLAY': 'DISP',
  'DISPLAYS': 'DISP',

  'KILOGRAMO': 'KG',
  'KILOGRAMOS': 'KG',
  'KILO': 'KG',
  'KILOS': 'KG',
  'KG': 'KG',
  'KGM': 'KG',

  'GRAMO': 'GR',
  'GRAMOS': 'GR',
  'GR': 'GR',
  'GRM': 'GR',
  'G': 'GR',

  'MILIGRAMO': 'MG',
  'MILIGRAMOS': 'MG',
  'MG': 'MG',

  'LITRO': 'LT',
  'LITROS': 'LT',
  'LT': 'LT',
  'LTR': 'LT',
  'L': 'LT',

  'MILILITRO': 'ML',
  'MILILITROS': 'ML',
  'ML': 'ML',
  'MLT': 'ML',

  'LATA': 'LTA',
  'LATAS': 'LTA',
  'LTA': 'LTA',

  'DOCENA': 'DOC',
  'DOCENAS': 'DOC',
  'DOC': 'DOC',
  'DZN': 'DOC',

  'BOTELLA': 'BOT',
  'BOTELLAS': 'BOT',
  'BOT': 'BOT',

  'SACO': 'SAC',
  'SACOS': 'SAC',

  'BALDE': 'BLD',
  'BALDES': 'BLD',

  'ROLLO': 'RLL',
  'ROLLOS': 'RLL',

  'CIENTO': 'CTO',
  'CIENTOS': 'CTO',

  'MILLAR': 'MIL',
  'MILLARES': 'MIL',

  'PACK': 'PCK',
  'PACKS': 'PCK',

  'TIRA': 'TRA',
  'TIRAS': 'TRA',

  'BARRA': 'BRR',
  'BARRAS': 'BRR',

  'BANDEJA': 'BDJ',
  'BANDEJAS': 'BDJ',

  'POTE': 'PTE',
  'POTES': 'PTE',

  'PAR': 'PAR',
  'PARES': 'PAR',

  'JUEGO': 'JGO',
  'JUEGOS': 'JGO',

  'PIEZA': 'PZA',
  'PIEZAS': 'PZA',

  'CAPSULA': 'CAP',
  'CÁPSULA': 'CAP',
  'CAPSULAS': 'CAP',
  'CÁPSULAS': 'CAP',

  'COMPRIMIDO': 'COMP',
  'COMPRIMIDOS': 'COMP',

  'TABLETA': 'TAB',
  'TABLETAS': 'TAB',

  'POMO': 'POM',
  'POMOS': 'POM',

  'GOTERO': 'GOT',
  'GOTEROS': 'GOT',

  'GALON': 'GLN',
  'GALÓN': 'GLN',
  'GALONES': 'GLN',

  'METRO': 'MTR',
  'METROS': 'MTR'
};

export function getUnitAbbreviation(unitName?: string | null): string {
  if (!unitName) return 'UND';
  const cleaned = unitName.trim().toUpperCase();

  if (UNIT_ABBREVIATIONS[cleaned]) {
    return UNIT_ABBREVIATIONS[cleaned];
  }

  if (cleaned.length <= 4) {
    return cleaned;
  }

  return cleaned.substring(0, 3);
}

@Pipe({
  name: 'unitAbbr',
  standalone: true
})
export class UnitAbbreviationPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return getUnitAbbreviation(value);
  }
}
