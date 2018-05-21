
import { RequestTime } from 'types';

export function getRequestTime(timeUnit: string, amount: number): RequestTime {

    timeUnit = timeUnit.toLowerCase();

    let startTime: number = 0;
    let endTime:   number = 0;
    let interval:  number = 0;

    let now: number = Date.now() / 1000;
    let daysInCurrentMonth: number = 30;

    let minute: number = 60
    let hour:   number = 60 * 60;
    let day:    number = hour * 24;
    let week:   number = day * 7;
    let month:  number = week * 4;
    let year:   number = month * 12;

    let today:     number = Math.floor(now / day) * day;
    let tomorrow:  number = today + day;
    let yesterday: number = today - day;
  
    if (timeUnit === 'yesterday'){
        startTime = yesterday;
        endTime = today;   
    }
    else if (timeUnit === "ytd"){
        let date: Date = new Date();
        date.setUTCMonth(0);
        date.setUTCDate(0);
        date.setUTCMinutes(0);
        date.setUTCSeconds(0);
        date.setUTCMilliseconds(0);
        startTime = date.valueOf();
    }
    else{
        let tempUnit: number = 0;
        switch (timeUnit) {
            case 'week':
                tempUnit =  week;
                break;
            case 'month':
                tempUnit =  month;
                break;
            case 'year':
                tempUnit =  year;
                break;
            default:
                tempUnit =  day;
                break;
        }
        startTime = tomorrow - (amount * tempUnit);
    }
    if (!endTime) {
        endTime = tomorrow;
    }

    switch (timeUnit) {
        case 'week':
            interval =  1 * hour;
            break;
        case 'month':
            interval =  6 * hour;
            break;
        case 'year':
            interval =  day;
            break;
        default:
            interval =  30 * minute;
            break;
    }

    interval = interval * Math.ceil(amount / 2);

    return <RequestTime>{startTime, endTime, interval};
  }