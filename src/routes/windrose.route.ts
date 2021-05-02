import { DatabaseConnection } from 'database';
import { Application } from 'express';
import { Pool } from 'mysql';

import { RequestTime } from './../types';

import { QueryRoute } from './route';

interface WindQueryData {
    dateTime: number;
    windSpeed: number;
    windDir: number;
}

interface WindResponseData {
    windFrequency: number[];
    windVelocity: number[];
    windVector: number[];
}


export class WindroseRoute extends QueryRoute<WindResponseData, WindQueryData[]> {

    public static readonly routeName: string = 'windrose';
    public static readonly route: string = '/api/windrose/:timeUnit/:amount';

    constructor(
        express: Application,
        databaseConnection: DatabaseConnection,
    ) {
        super(WindroseRoute.route, express, databaseConnection);
    }

    protected getQueryString(requestTime: RequestTime): string {
        return `
        SELECT
        dateTime,
        ROUND(MAX(windSpeed), 1) windSpeed,
        ROUND(MAX(windDir), 1) windDir
        FROM weewx.archive
        WHERE dateTime >= ${ requestTime.startTime } AND dateTime <= ${ requestTime.endTime }
        GROUP BY dateTime
        ORDER BY dateTime ASC`;
    }

    protected convertQueryData(querydata: WindQueryData[]): WindResponseData {

        const windResposeData: WindResponseData = {
            windFrequency : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            windVelocity    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            windVector    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        }

        const windFrequency = windResposeData.windFrequency;
        const windVelocity = windResposeData.windVelocity;
        const windVector = windResposeData.windVector;

        querydata.forEach(dataPoint => {
            let ordinal = Math.round(dataPoint.windDir / 22.5);
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

        return windResposeData;

    };

}
