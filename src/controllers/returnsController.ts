import tzlookup from "tz-lookup";
import swisseph from "swisseph-v2";
import moment from "moment";
import { Request, Response } from "express";
import {
  allPlanets,
  calculateJulianDayAndUT,
  getSign,
  getSouthNode,
} from "../utils";
import { PlanetPosition } from "../interfaces";

export const solar = (req: Request, res: Response) => {
  // const { birthDate, birthTime, targetDate } = req.body;
  const { birthDate, targetDate } = req.body;
  const coordinates = birthDate.coordinates;

  if (
    !birthDate ||
    // birthTime == null ||
    !targetDate ||
    coordinates.latitude == null ||
    coordinates.longitude == null
  ) {
    res.status(400).json({ error: "Parâmetros obrigatórios ausentes." });
  }

  // Birth Sun Calc
  const timezone = tzlookup(coordinates.latitude, coordinates.longitude);
  // const sunPosData = calculateJulianDayAndUT(timezone, birthDate, birthTime);
  const sunPosData = calculateJulianDayAndUT(
    timezone,
    birthDate,
    birthDate.time
  );

  const pos = swisseph.swe_calc_ut(
    sunPosData.julianDay,
    swisseph.SE_SUN,
    0
  ) as PlanetPosition;
  const birthSunLongitude = Number.parseFloat(pos.longitude.toFixed(2));

  const housesData = swisseph.swe_houses(
    sunPosData.julianDay,
    coordinates.latitude,
    coordinates.longitude,
    "P"
  );

  const planets = allPlanets.map((planet) => {
    const pos = swisseph.swe_calc_ut(
      sunPosData.julianDay,
      planet.id,
      swisseph.SEFLG_SPEED
    ) as PlanetPosition;
    return {
      name: planet.name,
      id: planet.id,
      longitude: Number.parseFloat(pos.longitude.toFixed(2)),
      sign: getSign(pos.longitude),
      isRetrograde: pos.longitudeSpeed < 0,
    };
  });

  const southNode = getSouthNode(sunPosData.julianDay);
  planets.push(southNode);

  // Estimate Sun Pos at Target Year

  let targetYearSunPosData = calculateJulianDayAndUT(
    timezone,
    targetDate,
    birthDate.time
  );

  let jsTime = (targetYearSunPosData.julianDay - 2440587.5) * 86400000;
  let returnTime = moment(new Date(jsTime))
    .tz(timezone)
    .format("YYYY-MM-DD HH:mm:ss");

  const targetYearPos = swisseph.swe_calc_ut(
    targetYearSunPosData.julianDay,
    swisseph.SE_SUN,
    0
  ) as PlanetPosition;
  let longitude = Number.parseFloat(targetYearPos.longitude.toFixed(2));
  const diffLongitude = Number.parseFloat(
    (longitude - birthSunLongitude).toFixed(2)
  );

  let sunSpeed = 0;

  swisseph.swe_calc(
    targetYearSunPosData.julianDay,
    swisseph.SE_SUN,
    swisseph.SEFLG_SPEED,
    (planetPosition) => {
      const typedPlanetPosition = planetPosition as PlanetPosition;
      // console.log(typedPlanetPosition); // velocidade em graus por dia
      sunSpeed = typedPlanetPosition.longitudeSpeed;
    }
  );

  // Tempo em horas que precisa ajustar
  const timeAdjustmentHours = (diffLongitude / sunSpeed) * 24;

  // Aplica o ajuste no correctedUT
  let correctedUT = targetYearSunPosData.universalTime - timeAdjustmentHours;
  let targetYearJulianDay = swisseph.swe_julday(
    targetDate.year,
    birthDate.month,
    birthDate.day,
    correctedUT,
    swisseph.SE_GREG_CAL
  );

  let estimatedSunPos = swisseph.swe_calc_ut(
    targetYearJulianDay,
    swisseph.SE_SUN,
    0
  ) as PlanetPosition;

  let difference = estimatedSunPos.longitude - pos.longitude;
  const deadzone = 0.00001;
  const loopLimit = 500;
  let counter = 0;

  while (Math.abs(difference) > deadzone && counter < loopLimit) {
    correctedUT -= difference;
    targetYearJulianDay = swisseph.swe_julday(
      targetDate.year,
      birthDate.month,
      birthDate.day,
      correctedUT,
      swisseph.SE_GREG_CAL
    );

    estimatedSunPos = swisseph.swe_calc_ut(
      targetYearJulianDay,
      swisseph.SE_SUN,
      0
    ) as PlanetPosition;

    difference = estimatedSunPos.longitude - pos.longitude;
    counter++;
    // console.log("iterou " + counter + " vezes. Diferença: " + difference);
  }

  // console.log("Saiu do while. Consegui reduzir a diferença pra: " + difference);
  // Calcular essas paradas só quando tiver encontrado a posição exata do Sol

  jsTime = (targetYearJulianDay - 2440587.5) * 86400000;
  returnTime = moment(new Date(jsTime))
    .tz(timezone)
    .format("YYYY-MM-DD HH:mm:ss");

  const returnHousesData = swisseph.swe_houses(
    targetYearJulianDay,
    coordinates.latitude,
    coordinates.longitude,
    "P"
  );

  const returnPlanets = allPlanets.map((planet) => {
    const pos = swisseph.swe_calc_ut(
      targetYearJulianDay,
      planet.id,
      swisseph.SEFLG_SPEED
    ) as PlanetPosition;
    return {
      name: planet.name,
      id: planet.id,
      longitude: Number.parseFloat(pos.longitude.toFixed(2)),
      sign: getSign(pos.longitude),
      isRetrograde: pos.longitudeSpeed < 0,
    };
  });

  const returnSouthNode = getSouthNode(targetYearJulianDay);
  planets.push(returnSouthNode);

  res.json({
    // targetYearSunData,
    housesData,
    planets,
    returnTime,
    timezone,
    returnHousesData,
    returnPlanets,
    // sunDataAtBirth: pos,
    // sunData: estimatedSunPos,
    // difference,
    // correctedUT,
  });
};

export const lunar = (req: Request, res: Response) => {
  // const { birthDate, birthTime, targetDate } = req.body;
  const { birthDate, targetDate } = req.body;
  const coordinates = birthDate.coordinates;

  if (
    !birthDate ||
    // birthTime == null ||
    !targetDate ||
    coordinates.latitude == null ||
    coordinates.longitude == null
  ) {
    res.status(400).json({ error: "Parâmetros obrigatórios ausentes." });
  }

  // Birth Moon Calc
  const timezone = tzlookup(coordinates.latitude, coordinates.longitude);
  const moonPosData = calculateJulianDayAndUT(
    timezone,
    birthDate,
    birthDate.time
  );

  const pos = swisseph.swe_calc_ut(
    moonPosData.julianDay,
    swisseph.SE_MOON,
    0
  ) as PlanetPosition;
  const birthMoonLongitude = Number.parseFloat(pos.longitude.toFixed(2));

  const housesData = swisseph.swe_houses(
    moonPosData.julianDay,
    coordinates.latitude,
    coordinates.longitude,
    "P"
  );

  const planets = allPlanets.map((planet) => {
    const pos = swisseph.swe_calc_ut(
      moonPosData.julianDay,
      planet.id,
      swisseph.SEFLG_SPEED
    ) as PlanetPosition;
    return {
      name: planet.name,
      id: planet.id,
      longitude: Number.parseFloat(pos.longitude.toFixed(2)),
      sign: getSign(pos.longitude),
      isRetrograde: pos.longitudeSpeed < 0,
    };
  });

  const southNode = getSouthNode(moonPosData.julianDay);
  planets.push(southNode);

  // Estimate Moon Pos at Target Date

  let targetDateMoonPosData = calculateJulianDayAndUT(
    timezone,
    targetDate,
    birthDate.time
  );

  let jsTime = (targetDateMoonPosData.julianDay - 2440587.5) * 86400000;
  let returnTime = moment(new Date(jsTime))
    .tz(timezone)
    .format("YYYY-MM-DD HH:mm:ss");

  const targetYearPos = swisseph.swe_calc_ut(
    targetDateMoonPosData.julianDay,
    swisseph.SE_MOON,
    0
  ) as PlanetPosition;
  let longitude = Number.parseFloat(targetYearPos.longitude.toFixed(2));
  const diffLongitude = Number.parseFloat(
    (longitude - birthMoonLongitude).toFixed(2)
  );

  let moonSpeed = 0;

  swisseph.swe_calc(
    targetDateMoonPosData.julianDay,
    swisseph.SE_MOON,
    swisseph.SEFLG_SPEED,
    (planetPosition) => {
      const typedPlanetPosition = planetPosition as PlanetPosition;
      // console.log(typedPlanetPosition); // velocidade em graus por dia
      moonSpeed = typedPlanetPosition.longitudeSpeed;
    }
  );

  // Tempo em horas que precisa ajustar
  const timeAdjustmentHours = (diffLongitude / moonSpeed) * 24;

  // Aplica o ajuste no correctedUT
  let correctedUT = targetDateMoonPosData.universalTime - timeAdjustmentHours;
  let targetYearJulianDay = swisseph.swe_julday(
    targetDate.year,
    targetDate.month,
    targetDate.day,
    correctedUT,
    swisseph.SE_GREG_CAL
  );

  let estimatedMoonPos = swisseph.swe_calc_ut(
    targetYearJulianDay,
    swisseph.SE_MOON,
    0
  ) as PlanetPosition;

  let difference = estimatedMoonPos.longitude - pos.longitude;
  const deadzone = 0.00001;
  const loopLimit = 500;
  let counter = 0;

  while (Math.abs(difference) > deadzone && counter < loopLimit) {
    correctedUT -= difference;
    targetYearJulianDay = swisseph.swe_julday(
      targetDate.year,
      targetDate.month,
      targetDate.day,
      correctedUT,
      swisseph.SE_GREG_CAL
    );

    estimatedMoonPos = swisseph.swe_calc_ut(
      targetYearJulianDay,
      swisseph.SE_MOON,
      0
    ) as PlanetPosition;

    difference = estimatedMoonPos.longitude - pos.longitude;
    counter++;
    // console.log("iterou " + counter + " vezes. Diferença: " + difference);
  }

  // console.log("Saiu do while. Consegui reduzir a diferença pra: " + difference);
  // Calcular essas paradas só quando tiver encontrado a posição exata do Sol

  jsTime = (targetYearJulianDay - 2440587.5) * 86400000;
  returnTime = moment(new Date(jsTime))
    .tz(timezone)
    .format("YYYY-MM-DD HH:mm:ss");

  const returnHousesData = swisseph.swe_houses(
    targetYearJulianDay,
    coordinates.latitude,
    coordinates.longitude,
    "P"
  );

  const returnPlanets = allPlanets.map((planet) => {
    const pos = swisseph.swe_calc_ut(
      targetYearJulianDay,
      planet.id,
      swisseph.SEFLG_SPEED
    ) as PlanetPosition;
    return {
      name: planet.name,
      id: planet.id,
      longitude: Number.parseFloat(pos.longitude.toFixed(2)),
      sign: getSign(pos.longitude),
      isRetrograde: pos.longitudeSpeed < 0,
    };
  });

  const returnSouthNode = getSouthNode(targetYearJulianDay);
  returnPlanets.push(returnSouthNode);

  res.json({
    housesData,
    planets,
    returnTime,
    timezone,
    returnHousesData,
    returnPlanets,
    // moonDataAtBirth: pos,
    // moonData: estimatedMoonPos,
    // difference,
    // correctedUT,
  });
};
