import { amountParamName, timeUnitParamName } from '../models/route';
import { TimeUnit } from '../models/time-unit';

const allowedTimeUnits = [TimeUnit.Yesterday, TimeUnit.Day, TimeUnit.Week, TimeUnit.Month, TimeUnit.Year, TimeUnit.Ytd];

const minuteInSeconds: number = 60
const hourInSeconds: number = 60 * 60;
const dayInSeconds: number = hourInSeconds * 24;
const weekInSeconds: number = dayInSeconds * 7;
const monthInSeconds: number = weekInSeconds * 4;
const yearInSeconds: number = monthInSeconds * 12;

export class RequestTimeParams {

    public static fromParams(params: any): RequestTimeParams {

        let timeUnit: TimeUnit = TimeUnit.Day;
        let amount: number = 1;

        try {
            amount = Number.parseInt(params[amountParamName], 10);
            timeUnit = params[timeUnitParamName].toLowerCase();
        }
        catch (error) {
            throw new Error(`Illegal params.`);
        }

        if (!allowedTimeUnits.includes(timeUnit)) {
            throw new Error(`Illegal TimeUnit: "${ timeUnit }".`);
        }

        if (amount < 1 || !Number.isFinite(amount)) {
            amount = 1;
        }

        return RequestTimeParams.calculate(timeUnit, amount);

    }

    public static calculate(timeUnit: TimeUnit, amount: number = 1): RequestTimeParams {

        let startTime: number = 0;
        let endTime: number = 0;
        let interval: number = 0;

        const today: number = ((new Date()).setHours(0, 0, 0, 0)) / 1000;
        const tomorrow: number = today + dayInSeconds;
        const yesterday: number = today - dayInSeconds;

        if (timeUnit === TimeUnit.Yesterday) {
            startTime = yesterday;
            endTime = today;
        }
        else if (timeUnit === TimeUnit.Ytd) {
            const date = new Date();
            date.setMonth(0, 0);
            date.setHours(0, 0, 0, 0);
            startTime = date.getTime() / 1000;
        }
        else {
            let tempUnit: number = 0;
            switch (timeUnit) {
                case TimeUnit.Week:
                    tempUnit = weekInSeconds;
                    break;
                case TimeUnit.Month:
                    tempUnit = monthInSeconds;
                    break;
                case TimeUnit.Year:
                    tempUnit = yearInSeconds;
                    break;
                default:
                    tempUnit = dayInSeconds;
                    break;
            }
            startTime = tomorrow - (amount * tempUnit);
        }

        if (!endTime) {
            endTime = tomorrow;
        }

        console.log('startTime', startTime, new Date(startTime));
        console.log('endTime', endTime, new Date(endTime));

        switch (timeUnit) {
            case TimeUnit.Week:
                interval = 1 * hourInSeconds;
                break;
            case TimeUnit.Month:
                interval = 6 * hourInSeconds;
                break;
            case TimeUnit.Ytd:
            case TimeUnit.Year:
                interval = dayInSeconds;
                break;
            default:
                interval = 30 * minuteInSeconds;
                break;
        }

        interval = interval * Math.ceil(amount / 2);

        // console.log('startTime', startTime, new Date(startTime * 1000));
        // console.log('endTime', endTime, new Date(endTime * 1000));
        // console.log('interval', interval);

        return new RequestTimeParams(startTime, endTime, interval, timeUnit, amount);

    }

    private constructor(
        public readonly startTime: number,
        public readonly endTime: number,
        public readonly interval: number,
        public readonly timeUnit: TimeUnit,
        public readonly amount: number,
    ) { }

}
