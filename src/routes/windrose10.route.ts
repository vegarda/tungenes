

import { RequestTimeParams } from '../utils/request-time-params';

/*
import { WindroseRoute } from './windrose.route';

export class Windrose10Route extends WindroseRoute {

    public static readonly routeName = 'windrose10';
    public static readonly route = '/api/windrose10';

    protected getQueryString(requestTime: RequestTimeParams): string {
        return `
        SELECT
            dateTime,
            ROUND(MAX(windSpeed), 1) windSpeed,
            ROUND(MAX(windDir), 1) windDir
        FROM weewx.archive
        WHERE dateTime >= ${(Date.now() / 1000) - 600}
        GROUP BY dateTime
        ORDER BY dateTime ASC`;
    }

}
*/