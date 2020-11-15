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

    const id = Date.now();
    console.log(id, 'get archive#############################################');

    response.on('close',    () => console.log(id, 'response close'));
    response.on('drain',    () => console.log(id, 'response drain'));
    response.on('error',    () => console.log(id, 'response error'));
    response.on('finish',   () => console.log(id, 'response finish'));
    response.on('pipe',     () => console.log(id, 'response pipe'));
    response.on('unpipe',   () => console.log(id, 'response unpipe'));

    request.on('data',      () => console.log(id, 'request data'));
    request.on('end',       () => console.log(id, 'request end'));
    request.on('error',     () => console.log(id, 'request error'));
    request.on('pause',     () => console.log(id, 'request pause'));
    request.on('readable',  () => console.log(id, 'request readable'));
    request.on('resume',    () => console.log(id, 'request resume'));

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
    let poolConnection: PoolConnection;

    const requestTimeout = setTimeout(() => {
        console.log(id, 'timeout queryIsEnded', queryIsEnded);
        if (!queryIsEnded) {
            if (poolConnection) {
                // console.log(id, 'poolConnection.release()');
                // poolConnection.release();
                console.log(id, 'poolConnection.destroy()');
                poolConnection.destroy();
            }
            response.sendStatus(500);
        }
    }, 5000);


    let poolConnectionThreadId = 0;
    let requestIsClosed: boolean = false;

    request.on('close', () => {
        requestIsClosed = true;
        clearTimeout(requestTimeout);
        console.log(id, 'request close');
        console.log(id, 'poolConnectionThreadId', poolConnectionThreadId);
        console.log(id, 'queryIsEnded', queryIsEnded);
        if (!queryIsEnded) {
            if (poolConnection) {
                console.log(id, 'poolConnection.destroy()');
                poolConnection.destroy();
            }
        }
    });

    mysqlPool.getConnection((mysqlError: MysqlError, _poolConnection: PoolConnection) => {

        console.log(id, 'mysqlPool.getConnection() requestIsClosed', requestIsClosed);

        if (requestIsClosed) {
            _poolConnection.release();
            return;
        }

        poolConnection = _poolConnection;
        poolConnectionThreadId = _poolConnection.threadId;

        if (mysqlError) {
            console.error(mysqlError);
            response.sendStatus(500);
            return;
        }

        const query = _poolConnection.query(queryString, (_mysqlError: MysqlError, rows: Archive[], fields: FieldInfo[]) => {

            queryIsEnded = true;

            console.log(poolConnectionThreadId, '_poolConnection.release()');
            _poolConnection.release();
            // console.log('_poolConnection.destroy()');
            // _poolConnection.destroy();

            if (_mysqlError) {
                console.error(_mysqlError);
                response.sendStatus(500);
                return;
            }

            response.send(rows);

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

            // response.send(rows);
            // setTimeout(() => {

            // }, 1000);

        });

    });

});


export default router;
