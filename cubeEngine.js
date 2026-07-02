import * as puzzles from "https://cdn.cubing.net/js/cubing/puzzles";
import { Alg } from "https://cdn.cubing.net/js/cubing/alg";
import { KPattern } from "https://cdn.cubing.net/js/cubing/kpuzzle";

let kpuzzle = null;

export async function initCubeEngine() {
  if (!kpuzzle) {
    kpuzzle = await puzzles.cube3x3x3.kpuzzle();
  }
  return kpuzzle;
}

export function createSolvedPattern() {
  if (!kpuzzle) return null;
  return kpuzzle.defaultPattern();
}

export function createPatternFromData(patternData) {
  if (!kpuzzle) return null;
  return new KPattern(kpuzzle, patternData);
}

export function applyAlgorithm(pattern, algorithm) {
  if (!pattern) return null;
  return pattern.applyAlg(new Alg(algorithm));
}

export function isPatternSolved(pattern) {
  if (!pattern) return false;
  
  return pattern.experimentalIsSolved({
    ignorePuzzleOrientation: true,
    ignoreCenterOrientation: true
  });
}

export { Alg };