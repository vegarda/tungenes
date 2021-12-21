
import { DataMethods } from '../database';

import { RequestTimeParams } from '../utils/request-time-params';
import { DataCache } from '../utils/data-cache';
import { amountParamName, timeUnitParamName } from '../models/route';

import { DataRoute } from './route';
import { Archive } from '../data/archive';





export interface ArchiveData extends Archive {
    minOutTemp: number;
    maxOutTemp: number;
}


export type ArchiveProperty = Exclude<keyof ArchiveData, 'dateTime'>;


export class ArchiveRoute extends DataRoute<Archive, ArchiveData[]> {

    public static readonly method = 'GET';
    public static readonly route = `/api/archive/:${ timeUnitParamName }/:${ amountParamName }`;

    constructor() {
        super();
        this.dataCache = new DataCache<ArchiveData[]>();
    }

    public async getData(dataMethods: DataMethods, rtp: RequestTimeParams, signal?: AbortSignal): Promise<ArchiveData[]> {
        const data = await dataMethods.getArchiveData(rtp, signal);
        return this.convertData(data, rtp);
    }

    private convertData(data: Archive[], requestTimeParams: RequestTimeParams): ArchiveData[] {

        if (data.length === 0) {
            return [];
        }

        let outTempSum: number = 0;
        let outTempCount: number = 0;
        let minOutTemp: number = Number.MAX_SAFE_INTEGER;
        let maxOutTemp: number = Number.MIN_SAFE_INTEGER;

        let rainRateSum: number = 0;
        let rainRateCount: number = 0;

        let outHumiditySum: number = 0;
        let outHumidityCount: number = 0;

        let barometerSum: number = 0;
        let barometerCount: number = 0;

        let rainSum: number = 0;

        let windSpeedSum = 0;
        let windSpeedCount = 0;
        let windSpeedVector = [0, 0];

        let windGustSum = 0;
        let windGustCount = 0;
        let windGustVector = [0, 0];

        let dateTime: number = data[0].dateTime;

        const convertData: ArchiveData[] = [];

        const pushData = () => {
            if (outTempCount === 0) {
                return;
            }
            const windSpeedVectorLength = Math.sqrt(Math.pow(windSpeedVector[0], 2) + Math.pow(windSpeedVector[1], 2));
            const windGustVectorLength = Math.sqrt(Math.pow(windGustVector[0], 2) + Math.pow(windGustVector[1], 2));
            const windDir = Math.acos(windSpeedVector[0] / windSpeedVectorLength) * 180 / Math.PI;
            const windGustDir = Math.acos(windGustVector[0] / windGustVectorLength) * 180 / Math.PI;
            convertData.push({
                dateTime: dateTime,
                outTemp: outTempSum / outTempCount,
                minOutTemp: minOutTemp,
                maxOutTemp: maxOutTemp,
                rainRate: rainRateSum / rainRateCount,
                outHumidity: outHumiditySum / outHumidityCount,
                barometer: barometerSum / barometerCount,
                rain: rainSum,

                windSpeed: windSpeedSum / windSpeedCount,
                windDir: windDir,

                windGust: windGustSum / windGustCount,
                windGustDir: windGustDir,

            });
        }

        for (let i = 0; i < data.length; i++) {

            let _data = data[i];

            if (Number.isFinite(_data.outTemp)) {
                outTempCount++;
                outTempSum += _data.outTemp;
                if (_data.outTemp > maxOutTemp) {
                    maxOutTemp = _data.outTemp;
                }
                if (_data.outTemp < minOutTemp) {
                    minOutTemp = _data.outTemp;
                }
            }

            if (Number.isFinite(_data.rainRate)) {
                rainRateSum += _data.rainRate;
                rainRateCount++;
            }

            if (Number.isFinite(_data.outHumidity)) {
                outHumiditySum += _data.outHumidity;
                outHumidityCount++;
            }

            if (Number.isFinite(_data.barometer)) {
                barometerSum += _data.barometer;
                barometerCount++;
            }

            if (Number.isFinite(_data.rain)) {
                rainSum += _data.rain;
            }

            if (Number.isFinite(_data.windSpeed)) {
                windSpeedSum += _data.windSpeed;
                windSpeedCount++;
                if (Number.isFinite(_data.windDir)) {
                    const radians = _data.windDir * Math.PI / 180;
                    const cos = Math.cos(radians);
                    const sin = Math.sin(radians);
                    windSpeedVector[0]+= cos * _data.windSpeed;
                    windSpeedVector[1]+= sin * _data.windSpeed;
                }
            }

            if (Number.isFinite(_data.windGust)) {
                windGustSum += _data.windGust;
                windGustCount++;
                if (Number.isFinite(_data.windGustDir)) {
                    const radians = _data.windGustDir * Math.PI / 180;
                    const cos = Math.cos(radians);
                    const sin = Math.sin(radians);
                    windGustVector[0]+= cos * _data.windGust;
                    windGustVector[1]+= sin * _data.windGust;
                }
            }



            if (_data.dateTime >= dateTime + requestTimeParams.interval) {

                pushData();

                dateTime += requestTimeParams.interval;

                outTempSum = 0;
                outTempCount = 0;
                minOutTemp = Number.MAX_SAFE_INTEGER;
                maxOutTemp = Number.MIN_SAFE_INTEGER;

                rainRateSum = 0;
                rainRateCount = 0;

                outHumiditySum = 0;
                outHumidityCount = 0;

                barometerSum = 0;
                barometerCount = 0;

                rainSum = 0;

                windSpeedSum = 0;
                windSpeedCount = 0;
                windSpeedVector = [0, 0];

                windGustSum = 0;
                windGustCount = 0;
                windGustVector = [0, 0];

            }

        }

        pushData();

        return convertData;

    }

}
