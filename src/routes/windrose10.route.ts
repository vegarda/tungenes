import { Router, Request, Response } from 'express';

import { ValidParams, RequestTime } from './../types';

import { validateParams } from './route-helpers';
import { getRequestTime } from './../helpers';

import connection from './../database';


const getWindData = async (): Promise<any> => {
    let promise: Promise<any> = new Promise((resolve, reject) => {
        connection.query(`
        SELECT 
        dateTime, 
        ROUND(MAX(windSpeed), 1) windSpeed, 
        ROUND(MAX(windDir), 1) windDir 
        FROM weewx.archive 
        WHERE dateTime >= ${(Date.now() / 1000) - 600}
        GROUP BY dateTime 
        ORDER BY dateTime ASC`,
        (err, rows) => {
            if (rows && rows[0]) {
                resolve(rows);
            }
        });
    });
    return promise;
};


const router = Router();

router.get('/windrose10', async (req: Request, res: Response) => {

    console.log('get windrose10');

    let windData: any[] = await getWindData();

    let windFrequency = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let windVelocity  = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let windVector    = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    let ordinal: number = 0;

    windData.forEach(dataPoint => {
        ordinal = Math.round(dataPoint.windDir / 22.5);
        ordinal = ordinal === 16 ? 0 : ordinal;
        windVelocity[ordinal] += dataPoint.windSpeed;
        windFrequency[ordinal] += 1;
    });

    let windFrequencySum: number = windFrequency.reduce((a, b) => a + b);

    let i: number;
    for (i = 0; i < 16; i++) {
        if (windFrequency[i] > 0) {
            windVelocity[i] = windVelocity[i] / windFrequency[i];
            windFrequency[i] = windFrequency[i] / windFrequencySum;
        }
        windVector[i] = windFrequency[i] * windVelocity[i];
        windFrequency[i] = windFrequency[i] * 100;
    }

    res.send({
        windFrequency: windFrequency,
        windVelocity: windVelocity,
        windVector: windVector
    });

});

  
export default router;

