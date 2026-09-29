/**
 * HEDS - Hospital Emergency Decision Simulator
 * Google Maps Grounding Geolocation & Emergency Dispatch Service
 * 
 * Interacts with server endpoint /api/geolocation/fire-stations
 * Grounded with real Google Maps data via gemini-3.5-flash with googleMaps tool.
 */

export interface MapGroundingLink {
  title: string;
  uri: string;
}

export interface GeolocationResult {
  success: boolean;
  text: string;
  groundingChunks?: any[];
  webSearchQueries?: string[];
  mapLinks: MapGroundingLink[];
  detectedCoordinates?: {
    lat: number;
    lng: number;
  } | null;
  queriedAddress: string;
  timestamp: string;
  error?: string;
  requiresKey?: boolean;
}

export const KNOWN_HOSPITAL_PRESETS = [
  {
    name: 'Complexo HEDS (Padrão do Sistema)',
    address: 'Av. das Nações da Saúde, 2500 - Complexo Médico, São Paulo - SP',
    lat: -23.5505,
    lng: -46.6333
  },
  {
    name: 'Hospital das Clínicas FMUSP (Cerqueira César)',
    address: 'Av. Dr. Enéas Carvalho de Aguiar, 255 - Cerqueira César, São Paulo - SP',
    lat: -23.5574,
    lng: -46.6713
  },
  {
    name: 'Hospital Sírio-Libanês (Bela Vista)',
    address: 'Rua Dona Adma Jafet, 91 - Bela Vista, São Paulo - SP',
    lat: -23.5579,
    lng: -46.6534
  },
  {
    name: 'Hospital Israelita Albert Einstein (Morumbi)',
    address: 'Av. Albert Einstein, 627 - Morumbi, São Paulo - SP',
    lat: -23.5998,
    lng: -46.7153
  },
  {
    name: 'Hospital São Paulo / UNIFESP (Vila Clementino)',
    address: 'Rua Napoleão de Barros, 715 - Vila Clementino, São Paulo - SP',
    lat: -23.5971,
    lng: -46.6438
  },
  {
    name: 'Hospital Municipal Souza Aguiar (Rio de Janeiro)',
    address: 'Praça da República, 111 - Centro, Rio de Janeiro - RJ',
    lat: -22.9068,
    lng: -43.1895
  }
];

export async function fetchHospitalAndFireStations(
  address: string,
  latitude?: number,
  longitude?: number
): Promise<GeolocationResult> {
  try {
    const res = await fetch('/api/geolocation/fire-stations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address,
        latitude,
        longitude
      })
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        text: '',
        mapLinks: [],
        queriedAddress: address,
        timestamp: new Date().toISOString(),
        error: data.error || 'Falha ao consultar geolocalização.',
        requiresKey: data.requiresKey
      };
    }

    return data as GeolocationResult;
  } catch (err: any) {
    return {
      success: false,
      text: '',
      mapLinks: [],
      queriedAddress: address,
      timestamp: new Date().toISOString(),
      error: `Erro de conexão com o servidor: ${err.message || err}`
    };
  }
}
