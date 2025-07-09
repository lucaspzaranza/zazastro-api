import { Request, Response } from "express";

export const hello = (req: Request, res: Response) => {
  res.json({
    message:
      "Bem-vindo à Zazastro API! Aqui está encapsulada a lógica dos cálculos do mapa astral e das revoluções solares e lunares.",
  });
};
