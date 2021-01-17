import { DatabaseConnection } from 'database';
import { Application } from 'express';
import { Pool } from 'mysql';

import { RequestTime } from './../types';

import { QueryRoute } from './route';

export interface ArchiveData {
    dateTime: number;
    outTemp: number;
    minOutTemp: number;
    maxOutTemp: number;
    rainRate: number;
    windSpeed: number;
    windDir: number;
    windGust: number;
    windGustDir: number;
    rain: number;
    outHumidity: number;
    barometer: number;
}

export type ArchiveProperty = Exclude<keyof ArchiveData, 'dateTime'>;


export class ArchiveRoute extends QueryRoute<ArchiveData[]> {

    public static readonly routeName: string = 'archive';
    public static readonly route: string = '/api/archive/:timeUnit/:amount';

    constructor(
        express: Application,
        databaseConnection: DatabaseConnection,
    ) {
        super(ArchiveRoute.route, express, databaseConnection);
    }

    protected getQueryString(requestTime: RequestTime): string {
        return `
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
        WHERE dateTime >= ${ requestTime.startTime } and dateTime <= ${ requestTime.endTime }
        GROUP BY FLOOR(dateTime/${ requestTime.interval })
        ORDER BY dateTime ASC`;
    }

    protected convertQueryData(queryData: ArchiveData[]): ArchiveData[] {
        return queryData.filter(qd => qd.outTemp !== null);
    }

}
