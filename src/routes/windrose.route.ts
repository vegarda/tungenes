
import { DataCache } from '../utils/data-cache';
import { Archive } from '../data/archive';
import { DataMethods } from '../database';
import { amountParamName, timeUnitParamName } from '../models/route';
import { RequestTimeParams } from '../utils/request-time-params';
import { DataRoute } from './route';



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


export class WindroseRoute extends DataRoute<Archive, WindResponseData> {

    public static readonly method = `GET`;
    public static readonly route = `/api/windrose/:${ timeUnitParamName }/:${ amountParamName }`;

    constructor() {
        super();
        this.dataCache = new DataCache<WindResponseData>();
    }

    public async getData(dataMethods: DataMethods, rtp: RequestTimeParams, signal?: AbortSignal): Promise<WindResponseData> {
        const data = await dataMethods.getArchiveData(rtp, signal);
        return this.convertData(data);
    }

    protected convertData(querydata: Archive[]): WindResponseData {

        const windResposeData: WindResponseData = {
            windFrequency: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            windVelocity: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            windVector: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
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

