import swisseph from "swisseph-v2";
import { BirthDate, Planet, PlanetPosition } from "../interfaces";
import moment from "moment";

export const allPlanets: Planet[] = [
  { id: swisseph.SE_SUN, name: "Sol" },
  { id: swisseph.SE_MOON, name: "Lua" },
  { id: swisseph.SE_MERCURY, name: "Mercúrio" },
  { id: swisseph.SE_VENUS, name: "Vênus" },
  { id: swisseph.SE_MARS, name: "Marte" },
  { id: swisseph.SE_JUPITER, name: "Júpiter" },
  { id: swisseph.SE_SATURN, name: "Saturno" },
  { id: swisseph.SE_URANUS, name: "Urano" },
  { id: swisseph.SE_NEPTUNE, name: "Netuno" },
  { id: swisseph.SE_PLUTO, name: "Plutão" },
  { id: swisseph.SE_TRUE_NODE - 1, name: "Nodo Norte" }, // Subtraindo 1 pra casar com a ordem do array
];

export function getSign(longitude: number) {
  const signs = [
    "Áries",
    "Touro",
    "Gêmeos",
    "Câncer",
    "Leão",
    "Virgem",
    "Libra",
    "Escorpião",
    "Sagitário",
    "Capricórnio",
    "Aquário",
    "Peixes",
  ];
  return signs[Math.floor(longitude / 30) % 12];
}

export function calculateJulianDayAndUT(
  timezone: string,
  date: BirthDate,
  time: number
) {
  const birthData = moment.tz(
    { year: date.year, month: date.month - 1, day: date.day },
    timezone
  );

  const hours = Math.floor(time);
  const minutes = Math.round((time - hours) * 60);

  birthData.set({ hour: hours, minute: minutes });
  const universalTime = birthData.utc().hour() + birthData.utc().minute() / 60;

  const julianDay = swisseph.swe_julday(
    date.year,
    date.month,
    date.day,
    universalTime,
    swisseph.SE_GREG_CAL
  );

  return { julianDay, universalTime };
}

export function getSouthNode(julianDay: number) {
  const trueNodePos = swisseph.swe_calc_ut(
    julianDay,
    swisseph.SE_TRUE_NODE,
    swisseph.SEFLG_SPEED
  ) as PlanetPosition;
  const northLon = Number(trueNodePos.longitude.toFixed(2));
  const northSpeed = Number(trueNodePos.longitudeSpeed.toFixed(4));

  // 3) Nodo Sul (South Node) = posição oposta + 180°
  const southLon = Number(((northLon + 180) % 360).toFixed(2));

  return {
    name: "Nodo Sul",
    id: swisseph.SE_TRUE_NODE, // Subtraindo 1 pra casar com a ordem do array
    longitude: southLon,
    sign: getSign(southLon),
    isRetrograde: northSpeed < 0,
  };
}
