
import { DataMethods } from '../database';

import { DataRoute} from './route';

import { RequestTimeParams } from '../utils/request-time-params';
import { DataCache } from '../utils/data-cache';

import { amountParamName, timeUnitParamName } from '../models/route';
import { Archive } from '../data/archive';



class HiLoValue {

    private _avgSum: number = 0;
    private _avgCount: number = 0;

    high: number = Number.MIN_SAFE_INTEGER;
    highTime: number = 0;
    low: number = Number.MAX_SAFE_INTEGER;
    lowTime: number = 0;
    average: number = 0;

    constructor(
        public property: string,
    ) { }

    public addValue(value: number, dateTime: number): void {
        if (!Number.isFinite(value)) {
            return;
        }
        if (value > this.high) {
            this.high = value;
            this.highTime = dateTime;
        }
        if (value < this.low) {
            this.low = value;
            this.lowTime = dateTime;
        }
        this._avgSum += value;
        this._avgCount++;
        this.average = this._avgSum / this._avgCount;
    }

}

class HiLo {

    outTemp: HiLoValue = new HiLoValue('outTemp');
    barometer: HiLoValue = new HiLoValue('barometer');
    windSpeed: HiLoValue = new HiLoValue('windSpeed');
    windGust: HiLoValue = new HiLoValue('windGust');

    constructor(data: Archive[]) {

        data.forEach(d => {
            this.outTemp.addValue(d.outTemp, d.dateTime);
            this.barometer.addValue(d.barometer, d.dateTime);
            this.windSpeed.addValue(d.windSpeed, d.dateTime);
            this.windGust.addValue(d.windGust, d.dateTime);
        });

    }

}


export class HiLoRoute extends DataRoute<Archive, HiLo> {

    public static readonly method = 'GET';
    public static readonly route = `/api/hilo/:${ timeUnitParamName }/:${ amountParamName }`;

    constructor() {
        super();
        this.dataCache = new DataCache<HiLo>();
    }

    public async getData(dataMethods: DataMethods, rtp: RequestTimeParams, signal?: AbortSignal): Promise<HiLo> {
        const data = await dataMethods.getArchiveData(rtp, signal);;
        return this.convertData(data);
    }

    public convertData(data: Archive[], rtp?: RequestTimeParams): HiLo {
        return new HiLo(data);
    }

}

