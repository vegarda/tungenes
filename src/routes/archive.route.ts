import { Router, Request, Response } from 'express';

import { ValidParams, RequestTime } from './../types';

import { validateParams } from './route-helpers';
import { getRequestTime } from './../helpers';

import mysqlPool from './../database';
import { Archive } from 'models/archive.model';
import { FieldInfo, MysqlError, PoolConnection } from 'mysql';


interface Cache<T> {
    cacheDate: number;
    params: ValidParams;
    requestTime: RequestTime;
    data: T[];
    expires: number;
}

const cacheMap: Map<number, Cache<Archive>> = new Map();

const router = Router();

router.get('/archive/:timeUnit/:amount', async (request: Request, response: Response) => {

    console.log('get archive');

    const validParams: ValidParams = validateParams(request, response);

    if (!validParams) {
        return;
    }

    const calculatedRequestTime: RequestTime = getRequestTime(validParams.timeUnit, validParams.amount);

    const useCache: boolean = false;

    const cacheId = validParams.amount * calculatedRequestTime.interval * calculatedRequestTime.startTime;
    if (useCache) {
        if (cacheMap.has(cacheId)) {
            const cachedValue = cacheMap.get(cacheId);
            const remainingTime = Date.now() - cachedValue.expires;
            const cacheIsExpired = remainingTime > 0;
            if (!cacheIsExpired) {
                response.send(cachedValue.data);
                console.log(`used cache, expires in ${ remainingTime }`);
                return;
            }
            else {
                cacheMap.delete(cacheId);
            }
        }
    }

    const queryString = `SELECT dateTime,
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
    WHERE dateTime >= ${ calculatedRequestTime.startTime } and dateTime <= ${ calculatedRequestTime.endTime }
    GROUP BY FLOOR(dateTime/${ calculatedRequestTime.interval })
    ORDER BY dateTime ASC`;

    let queryIsEnded: boolean = false;

    mysqlPool.getConnection((mysqlError: MysqlError, poolConnection: PoolConnection) => {

        setTimeout(() => {
            if (!queryIsEnded) {
                poolConnection.destroy();
            }
        }, 5000);

        request.on('close', () => {
            if (!queryIsEnded) {
                poolConnection.destroy();
            }
        });

        poolConnection.on('connect',    () => console.log(poolConnection.threadId, 'poolConnection connect'));
        poolConnection.on('drain',      () => console.log(poolConnection.threadId, 'poolConnection drain'));
        poolConnection.on('end',        () => console.log(poolConnection.threadId, 'poolConnection end'));
        poolConnection.on('enqueue',    () => console.log(poolConnection.threadId, 'poolConnection enqueue'));
        poolConnection.on('error',      () => console.log(poolConnection.threadId, 'poolConnection error'));
        poolConnection.on('fields',     () => console.log(poolConnection.threadId, 'poolConnection fields'));

        if (mysqlError) {
            console.error(mysqlError);
            response.sendStatus(500);
            return;
        }

        const query = poolConnection.query(queryString, (_mysqlError: MysqlError, rows: Archive[], fields: FieldInfo[]) => {
            if (_mysqlError) {
                console.error(_mysqlError);
                response.sendStatus(500);
                return;
            }
            const now  = Date.now();
            const expires = calculatedRequestTime.interval * 1000 / 2;
            if (useCache) {
                cacheMap.set(cacheId, {
                    cacheDate: now,
                    params: validParams,
                    requestTime: calculatedRequestTime,
                    data: rows,
                    expires: expires,
                });
                console.log(`set cache, expires in ${ expires / 1000 }s`);
            }
            response.send(rows);
        });

        query.on('end', () => {
            queryIsEnded = true;
        });

    });

});


export default router;
