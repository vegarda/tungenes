import { DatabaseConnection } from 'database';
import { Request, RequestHandler, Response, Application } from 'express';

import { DataCache } from './../data-cache';


export interface ValidParams {
    timeUnit: string;
    amount: number;
}

export interface RequestTime {
    startTime: number;
    endTime: number;
    interval: number;
}

export class Route<ResponseData> {

    public static validateParams(request: Request, respones: Response): ValidParams {

        const params: ValidParams = {
            timeUnit: 'day',
            amount: 1
        };

        const allowedTimeUnits: string[] = ['yesterday', 'day', 'week', 'month', 'year', 'ytd'];

        try {
            params.amount = Number(request.params.amount);
            params.timeUnit = request.params.timeUnit.toLowerCase();
        }
        catch (err) {
            respones.sendStatus(400);
            return null;
        }

        if (allowedTimeUnits.indexOf(params.timeUnit) < 0) {
            respones.sendStatus(400);
            return null;
        }

        if (params.amount < 1) {
            params.amount = 1;
        }

        // console.log(params);

        return params;

    }

    public static getRequestTime(timeUnit: string, amount: number): RequestTime {

        timeUnit = timeUnit.toLowerCase();

        let startTime: number = 0;
        let endTime:     number = 0;
        let interval:    number = 0;

        let now: number = Date.now() / 1000;

        let minute: number = 60
        let hour:     number = 60 * 60;
        let day:    number = hour * 24;
        let week:     number = day * 7;
        let month:    number = week * 4;
        let year:     number = month * 12;

        let today:     number = Math.floor(now / day) * day;
        let tomorrow:    number = today + day;
        let yesterday: number = today - day;

        if (timeUnit === 'yesterday') {
            startTime = yesterday;
            endTime = today;
        }
        else if (timeUnit === 'ytd') {
            let date: Date = new Date();
            date.setUTCMonth(0);
            date.setUTCDate(0);
            date.setUTCMinutes(0);
            date.setUTCSeconds(0);
            date.setUTCMilliseconds(0);
            startTime = date.valueOf();
        }
        else {
            let tempUnit: number = 0;
            switch (timeUnit) {
                case 'week':
                    tempUnit =    week;
                    break;
                case 'month':
                    tempUnit =    month;
                    break;
                case 'year':
                    tempUnit =    year;
                    break;
                default:
                    tempUnit =    day;
                    break;
            }
            startTime = tomorrow - (amount * tempUnit);
        }
        if (!endTime) {
            endTime = tomorrow;
        }

        switch (timeUnit) {
            case 'week':
                interval =    1 * hour;
                break;
            case 'month':
                interval =    6 * hour;
                break;
            case 'year':
                interval =    day;
                break;
            default:
                interval =    30 * minute;
                break;
        }

        interval = interval * Math.ceil(amount / 2);

        return <RequestTime>{
            startTime: startTime,
            endTime: endTime,
            interval: interval
        };

    }

    public static readonly routeName: string;
    public readonly routeName: string;

    protected dataCache = new DataCache<ResponseData>();

    constructor(
        route: string,
        express: Application,
    ) {
        this.routeName = (Object.getPrototypeOf(this).constructor as typeof QueryRoute).routeName;
        if (!this.routeName) {
            throw new Error('!routeName');
        }

    }

    protected requestHandler: RequestHandler = async (request: Request, response: Response) => {
        console.log('requestHandler1');
        throw new Error('requestHandler not implemented');
    }

}


export class MultiQueryRoute<ResponseData, QueryData = ResponseData> extends Route<ResponseData> {

    constructor(
        route: string,
        express: Application,
        protected databaseConnection: DatabaseConnection,
    ) {
        super(route, express);
        express.use(route, this.requestHandler);
    }

    protected convertQueriesData(queryData: QueryData[]): ResponseData {
        return queryData as unknown as ResponseData;
    }

    protected getQueryStrings(requestTime: RequestTime): string[] {
        throw new Error('getQueryStrings not implemented');
    }

    protected requestHandler: RequestHandler = async (request: Request, response: Response) => {

        const validParams: ValidParams = QueryRoute.validateParams(request, response);
        if (!validParams) {
            return;
        }

        const calculatedRequestTime: RequestTime = QueryRoute.getRequestTime(validParams.timeUnit, validParams.amount);

        const cacheId = validParams.amount * calculatedRequestTime.interval * calculatedRequestTime.startTime;

        const cachedValue = this.dataCache.getData(cacheId);
        if (cachedValue) {
            cachedValue
            response.send(cachedValue);
            return;
        }

        const queryStrings = this.getQueryStrings(calculatedRequestTime);
        const queries = queryStrings.map(queryString => this.databaseConnection.query<QueryData>(queryString));

        request.on('close', () => {
            queries.forEach(qp => qp.cancel());
        });


        try {
            const value = await Promise.all(queries.map(qp => qp.getData()));
            // const convertedData = value.map(v => this.convertQueryData(v));
            const convertedData = this.convertQueriesData(value as unknown as QueryData[]);

            response.send(convertedData);

            const now    = Date.now();
            const cacheExpiresAt = now + ((calculatedRequestTime.interval * 1000) / 2);

            this.dataCache.setData(cacheId, {
                cacheDate: now,
                params: validParams,
                requestTime: calculatedRequestTime,
                data: convertedData,
                expiresAt: cacheExpiresAt,
            });
        }
        catch (error) {
            console.error(error);
            response.status(500).send(null);
        }

    }

}



export class QueryRoute<ResponseData, QueryData = ResponseData> extends MultiQueryRoute<ResponseData, QueryData> {

    constructor(
        route: string,
        express: Application,
        protected databaseConnection: DatabaseConnection,
    ) {
        super(route, express, databaseConnection);
        express.use(route, this.requestHandler);
    }

    protected convertQueriesData(queryData: QueryData[]): ResponseData {
        return this.convertQueryData(queryData[0]);
    }

    protected convertQueryData(queryData: QueryData): ResponseData {
        return queryData as unknown as ResponseData;
    }

    protected getQueryString(requestTime: RequestTime): string {
        throw new Error('getQueryString not implemented');
    }

    protected getQueryStrings(requestTime: RequestTime): string[] {
        return [this.getQueryString(requestTime)];
    }


}
