import fs from 'fs';
import path from 'path';

/**
 * Synchronously read and parse a JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {any|null} Parsed JSON data or null if failed
 */
export function readJsonFileSync(filePath) {
  try {
    const resolvedPath = path.resolve(filePath);
    const rawData = fs.readFileSync(resolvedPath, { encoding: 'utf-8' });
    return JSON.parse(rawData);
  } catch (error) {
    console.error(` Failed to read or parse JSON file "${filePath}":`, error.message);
    return null;
  }
}

/**
 * Asynchronously read and parse a JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<any|null>} Parsed JSON data or null if failed
 */
export async function readJsonFile(filePath) {
  try {
    const resolvedPath = path.resolve(filePath);
    const rawData = await fs.promises.readFile(resolvedPath, { encoding: 'utf-8' });
    return JSON.parse(rawData);
  } catch (error) {
    console.error(` Failed to read or parse JSON file "${filePath}":`, error.message);
    return null;
  }
}
