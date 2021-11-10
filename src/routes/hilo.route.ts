
import { Application } from 'express';

import { RequestTime } from './../types';

import { MultiQueryRoute } from './route';
import { ArchiveProperty } from './archive.route';
import { DatabaseConnection } from 'database';


class HiLoValue {
    high: number = null;
    highTime: number = null;
    low: number = null;
    lowTime: number = null;
    average: number = null;
}

enum HiLoType {
    Average = 'AVG',
    Minimum = 'MIN',
    Maximum = 'MAX',
}

class HiLo {
    outTemp: HiLoValue = new HiLoValue();
    barometer: HiLoValue = new HiLoValue();
    // outHumidity: HiLoValue = new HiLoValue();
    windSpeed: HiLoValue = new HiLoValue();
    windGust: HiLoValue = new HiLoValue();
}


type HiLoProperty = keyof HiLo;


type HiLoQueryResponse =    {
    dateTime: number;
    property: HiLoProperty;
    value: number;
    type: HiLoType;
};


export class HiLoRoute extends MultiQueryRoute<HiLo, HiLoQueryResponse[]> {

    public static readonly routeName = 'hilo';
    public static readonly route = '/api/hilo/:timeUnit/:amount';

    public static readonly avgProperties: ReadonlyArray<HiLoProperty> = [
        'outTemp',
        'barometer',
        'windSpeed',
        'windGust',
    ];

    public static readonly minProperties: ReadonlyArray<HiLoProperty> = [
        'outTemp',
        'barometer',
    ];

    public static readonly maxProperties: ReadonlyArray<HiLoProperty> = [
        'outTemp',
        'barometer',
        'windSpeed',
        'windGust',
    ];

    constructor(
        express: Application,
        databaseConnection: DatabaseConnection,
    ) {
        super(HiLoRoute.route, express, databaseConnection);
    }

    protected convertQueriesData(hiLoQueryResponses: HiLoQueryResponse[][]): HiLo {
        const hiLo = new HiLo();
        hiLoQueryResponses.forEach(flqr => {
            const hiLoQueryResponse = flqr[0];
            const type = hiLoQueryResponse.type;
            const property = hiLoQueryResponse.property;
            const value = hiLoQueryResponse.value;
            const dateTime = hiLoQueryResponse.dateTime;
            switch (type) {
                case HiLoType.Average: {
                    hiLo[property].average = value;
                    break;
                }
                case HiLoType.Minimum: {
                    hiLo[property].low = value;
                    hiLo[property].lowTime = dateTime;
                    break;
                }
                case HiLoType.Maximum: {
                    hiLo[property].high = value;
                    hiLo[property].highTime = dateTime;
                    break;
                }
            }
        });
        return hiLo;
    }

    protected getQueryStrings(requestTime: RequestTime): string[] {
        const min = HiLoRoute.minProperties.map(ap => this.getMinMaxArchivePropertyQueryString(HiLoType.Minimum, ap, requestTime));
        const max = HiLoRoute.maxProperties.map(ap => this.getMinMaxArchivePropertyQueryString(HiLoType.Maximum, ap, requestTime));
        const avg = HiLoRoute.avgProperties.map(ap => this.getAvgArchivePropertyQueryString(ap, requestTime));

        const queryStrings = min.concat(max).concat(avg);

        return queryStrings;
    }

    private getAvgArchivePropertyQueryString(archiveProperty: ArchiveProperty, requestTime: RequestTime): string {
        return `
        SELECT dateTime,
        "${ HiLoType.Average }" as type,
        "${ archiveProperty }" as property,
        AVG(${ archiveProperty }) value
        FROM weewx.archive
        WHERE dateTime >= ${requestTime.startTime};
        `;
    }

    private getMinMaxArchivePropertyQueryString(type: HiLoType.Minimum | HiLoType.Maximum, archiveProperty: ArchiveProperty, requestTime: RequestTime): string {
        return `
        SELECT dateTime,
        "${ type }" as type,
        "${ archiveProperty }" as property,
        ${ archiveProperty } value
        FROM weewx.archive
        WHERE ${ archiveProperty }=(
            SELECT ${ type }(${ archiveProperty })
            FROM weewx.archive
            WHERE dateTime >= ${ requestTime.startTime }
            AND dateTime < ${ requestTime.endTime }
            ORDER BY dateTime DESC
        )
        ORDER BY dateTime DESC LIMIT 1;
        `;
    }


}

