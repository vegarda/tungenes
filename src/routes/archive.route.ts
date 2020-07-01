import { Router, Request, Response } from 'express';

import { ValidParams, RequestTime } from './../types';

import { validateParams } from './route-helpers';
import { getRequestTime } from './../helpers';

import connection from './../database';
import { Archive } from 'models/Archive.model';


interface Cache<T> {
    cacheDate: number;
    params: ValidParams;
    requestTime: RequestTime;
    data: T[];
}

const cacheMap: Map<number, Cache<Archive>> = new Map();

const router = Router();

router.get('/archive/:timeUnit/:amount', async (req: Request, res: Response) => {

    console.log('get archive');

    let params: ValidParams = validateParams(req, res);

    if (!params) {
        return;
    }
    
    let calculated: RequestTime = getRequestTime(params.timeUnit, params.amount);
    console.log(calculated);

    let cacheId = params.amount * calculated.interval * calculated.startTime;
    if (cacheMap.has(cacheId)) {
        let cache = cacheMap.get(cacheId);
        let diff = ((Date.now() - cache.cacheDate) / 1000);
        if (diff < calculated.interval / 2) {
            res.send(cache.data);
            console.log('used cache, expires in ' + ((calculated.interval / 2) - diff));
            return;
        }
    }

    connection.query(`
    SELECT dateTime, 
    ROUND(AVG(barometer), 1) barometer, 
    ROUND(MIN(outTemp), 1) minOutTemp, 
    ROUND(MAX(outTemp), 1) maxOutTemp, 
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
    ORDER BY dateTime ASC`,
    (err, rows: Archive[], fields) => {
        if (err){
            console.error(err);
            res.sendStatus(500);
        }
        cacheMap.set(cacheId, {
            cacheDate: Date.now(),
            params: params,
            requestTime: calculated,
            data: rows
        });
        console.log('set cache, expires in' + calculated.interval / 2);
        res.send(rows);
    });

  });

  
export default router;