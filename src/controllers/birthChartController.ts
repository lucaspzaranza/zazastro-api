import { Request, Response } from "express";
import swisseph from "swisseph-v2";
import tzlookup from "tz-lookup";
import moment from "moment-timezone";
import { getSign, allPlanets, getSouthNode } from "../utils";
import { PlanetPosition } from "../interfaces";

export const birthChart = (req: Request, res: Response) => {
  // const { day, month, year, hour, latitude, longitude } = req.body;
  const { birthDate } = req.body;
  const coordinates = birthDate.coordinates;

  try {
    const timezone = tzlookup(coordinates.latitude, coordinates.longitude);
    const data = moment.tz(
      { year: birthDate.year, month: birthDate.month - 1, day: birthDate.day },
      timezone
    );

    const hours = Math.floor(birthDate.time);
    const minutes = Math.round((birthDate.time - hours) * 60);
    data.set({ hour: hours, minute: minutes });

    const ut = data.utc().hour() + data.utc().minute() / 60;

    const jd = swisseph.swe_julday(
      birthDate.year,
      birthDate.month,
      birthDate.day,
      ut,
      swisseph.SE_GREG_CAL
    );

    const results = allPlanets.map((planet) => {
      const pos = swisseph.swe_calc_ut(
        jd,
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

    const southNode = getSouthNode(jd);
    results.push(southNode);

    const housesRawData = swisseph.swe_houses(
      jd,
      coordinates.latitude,
      coordinates.longitude,
      "P"
    );

    res.json({ planets: results, housesData: housesRawData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao calcular o mapa." });
  }
};
