import { Router, Request, Response } from 'express';

import { ValidParams, RequestTime } from './../types';

import { validateParams } from './route-helpers';
import { getRequestTime } from './../helpers';

import connection from './../database';


const router = Router();

router.get('/archive/:timeUnit/:amount', (req: Request, res: Response) => {

    console.log('get archive');

    let params: ValidParams = validateParams(req, res);

    if (!params) {
        return;
    }
    
    let calculated: RequestTime = getRequestTime(params.timeUnit, params.amount);

    connection.query(`
    SELECT dateTime, 
    ROUND(AVG(barometer), 1) barometer, 
    ROUND(MIN(outTemp), 1) minoutTemp, 
    ROUND(MAX(outTemp), 1) maxoutTemp, 
    ROUND(AVG(outTemp), 1) outTemp, 
    ROUND(AVG(outHumidity), 1) outHumidity,
    ROUND(MAX(rainRate), 1) rainRate, 
    ROUND(MAX(windSpeed), 1) windSpeed, 
    ROUND(AVG(windDir), 1) windDir, 
    ROUND(MAX(windGust), 1) windGust, 
    ROUND(AVG(windGustDir), 1) windGustDir, 
    ROUND(SUM(rain), 1) rain 
    FROM weewx.archive 
    WHERE dateTime >= ${calculated.startTime} and dateTime <= ${calculated.endTime} 
    GROUP BY FLOOR(dateTime/${calculated.interval}) 
    ORDER BY dateTime ASC`, (err, rows, fields) => {
        if (err){
            console.error(err);
            res.sendStatus(500);
        }
        res.send(rows);
    });

  });

  
export default router;