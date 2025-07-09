export interface Planet {
  id: number;
  name: string;
}

export interface BirthDate {
  year: number;
  month: number;
  day: number;
}

export interface SolarRequestBody {
  birthDate: BirthDate;
  birthTime: number;
  sunLongitude: number;
  targetYear: number;
  birthLatitude: number;
  birthLongitude: number;
}

export interface PlanetPosition {
  longitude: number;
  latitude: number;
  distance: number;
  longitudeSpeed: number;
  latitudeSpeed: number;
  distanceSpeed: number;
  rflag: number;
}

export interface BirthDate {
  day: number;
  month: number;
  year: number;
}
