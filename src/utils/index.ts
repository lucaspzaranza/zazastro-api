import swisseph from "swisseph-v2";
import { BirthDate, Planet } from "../interfaces";
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
