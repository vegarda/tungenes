
import { Router, Request, Response } from 'express';

import { ValidParams, RequestTime } from './../types';

import { validateParams } from './route-helpers';
import { getRequestTime } from './../helpers';

import connection from './../database';

const router = Router();

let calculated: RequestTime;



const getAverages = async (requestTime: RequestTime, hiLo: HiLo): Promise<HiLo> => {
    let promise: Promise<HiLo> = new Promise((resolve, reject) => {
        connection.query(`
            SELECT dateTime,
            AVG(outTemp) outTemp,
            AVG(barometer) barometer,
            FROM weewx.archive
            WHERE dateTime >= ${requestTime.startTime}`,
            (err, rows) => {
                if (err) {
                    console.error(err);
                }
                if (rows && rows[0]) {
                    hiLo.outTemp.average = rows[0].outTemp;
                    hiLo.outHumidity.average = rows[0].outHumidity;
                    hiLo.barometer.average = rows[0].barometer;
                }
                resolve(hiLo);
            }
        );
    });
    return promise;
};


const getOutTempLow = async (requestTime: RequestTime, hiLo: HiLo): Promise<HiLo> => {
    let promise: Promise<HiLo> = new Promise((resolve, reject) => {
        connection.query(`
        SELECT dateTime, outTemp
        FROM weewx.archive
        WHERE outTemp=(
            SELECT MIN(outTemp)
            FROM weewx.archive
            WHERE dateTime >= ${calculated.startTime}
            AND dateTime < ${calculated.endTime}
            ORDER BY dateTime DESC
        )
        ORDER BY dateTime DESC LIMIT 1`,
            (err, rows) => {
                if (err) {
                    console.error(err);
                }
                if (rows && rows[0]) {
                    hiLo.outTemp.low = rows[0].outTemp;
                    hiLo.outTemp.lowTime = rows[0].dateTime;
                }
                resolve(hiLo);
            }
        );
    });
    return promise;
};

const getOutTempHigh = async (requestTime: RequestTime, hiLo: HiLo): Promise<HiLo> => {
    let promise: Promise<HiLo> = new Promise((resolve, reject) => {
        connection.query(`
        SELECT dateTime, outTemp
        FROM weewx.archive
        WHERE outTemp=(
            SELECT MAX(outTemp)
            FROM weewx.archive
            WHERE dateTime >= ${calculated.startTime}
            AND dateTime < ${calculated.endTime}
            ORDER BY dateTime DESC
        )
        ORDER BY dateTime DESC LIMIT 1`,
            (err, rows) => {
                if (err) {
                    console.error(err);
                }
                if (rows && rows[0]) {
                    hiLo.outTemp.high = rows[0].outTemp;
                    hiLo.outTemp.highTime = rows[0].dateTime;
                }
                resolve(hiLo);
            }
        );
    });
    return promise;
};



const getBarometerLow = async (requestTime: RequestTime, hiLo: HiLo): Promise<HiLo> => {
    let promise: Promise<HiLo> = new Promise((resolve, reject) => {
        connection.query(`
        SELECT dateTime, barometer
        FROM weewx.archive
        WHERE barometer=(
            SELECT MIN(barometer)
            FROM weewx.archive
            WHERE dateTime >= ${calculated.startTime}
            AND dateTime < ${calculated.endTime}
            ORDER BY dateTime DESC
        )
        ORDER BY dateTime DESC LIMIT 1`,
            (err, rows) => {
                if (err) {
                    console.error(err);
                }
                if (rows && rows[0]) {
                    hiLo.barometer.low = rows[0].barometer;
                    hiLo.barometer.lowTime = rows[0].dateTime;
                }
                resolve(hiLo);
            }
        );
    });
    return promise;
};

const getBarometerHigh = async (requestTime: RequestTime, hiLo: HiLo): Promise<HiLo> => {
    let promise: Promise<HiLo> = new Promise((resolve, reject) => {
        connection.query(`
        SELECT dateTime, barometer
        FROM weewx.archive
        WHERE barometer=(
            SELECT MAX(barometer)
            FROM weewx.archive
            WHERE dateTime >= ${calculated.startTime}
            AND dateTime < ${calculated.endTime}
            ORDER BY dateTime DESC
        )
        ORDER BY dateTime DESC LIMIT 1`,
            (err, rows) => {
                if (err) {
                    console.error(err);
                }
                if (rows && rows[0]) {
                    hiLo.barometer.high = rows[0].barometer;
                    hiLo.barometer.highTime = rows[0].dateTime;
                }
                resolve(hiLo);
            }
        );
    });
    return promise;
};



// const getOutHumidityLow = async (requestTime: RequestTime, hiLo: HiLo): Promise<HiLo> => {
//     let promise: Promise<HiLo> = new Promise((resolve, reject) => {
//         connection.query(`
//         SELECT dateTime, outHumidity
//         FROM weewx.archive
//         WHERE outHumidity=(
//             SELECT MIN(outHumidity)
//             FROM weewx.archive
//             WHERE dateTime >= ${calculated.startTime}
//             AND dateTime < ${calculated.endTime}
//             ORDER BY dateTime DESC
//         )
//         ORDER BY dateTime DESC LIMIT 1`,
//             (err, rows) => {
//                 if (rows && rows[0]) {
//                     hiLo.outHumidity.low = rows[0].outHumidity;
//                     hiLo.outHumidity.lowTime = rows[0].dateTime;
//                 }
//                 resolve(hiLo);
//             }
//         );
//     });
//     return promise;
// };

// const getOutHumidityHigh = async (requestTime: RequestTime, hiLo: HiLo): Promise<HiLo> => {
//     let promise: Promise<HiLo> = new Promise((resolve, reject) => {
//         connection.query(`
//         SELECT dateTime, outHumidity
//         FROM weewx.archive
//         WHERE outHumidity=(
//             SELECT MAX(outHumidity)
//             FROM weewx.archive
//             WHERE dateTime >= ${calculated.startTime}
//             AND dateTime < ${calculated.endTime}
//             ORDER BY dateTime DESC
//         )
//         ORDER BY dateTime DESC LIMIT 1`,
//             (err, rows) => {
//                 if (rows && rows[0]) {
//                     hiLo.outHumidity.high = rows[0].outHumidity;
//                     hiLo.outHumidity.highTime = rows[0].dateTime;
//                 }
//                 resolve(hiLo);
//             }
//         );
//     });
//     return promise;
// };



const getWindSpeedHigh = async (requestTime: RequestTime, hiLo: HiLo): Promise<HiLo> => {
    let promise: Promise<HiLo> = new Promise((resolve, reject) => {
        connection.query(`
        SELECT dateTime, windSpeed
        FROM weewx.archive
        WHERE windSpeed=(
            SELECT MAX(windSpeed)
            FROM weewx.archive
            WHERE dateTime >= ${calculated.startTime}
            AND dateTime < ${calculated.endTime}
            ORDER BY dateTime DESC
        )
        ORDER BY dateTime DESC LIMIT 1`,
            (err, rows) => {
                if (err) {
                    console.error(err);
                }
                if (rows && rows[0]) {
                    hiLo.windSpeed.high = rows[0].windSpeed;
                    hiLo.windSpeed.highTime = rows[0].dateTime;
                }
                resolve(hiLo);
            }
        );
    });
    return promise;
};


const getWindGustHigh = async (requestTime: RequestTime, hiLo: HiLo): Promise<HiLo> => {
    let promise: Promise<HiLo> = new Promise((resolve, reject) => {
        connection.query(`
        SELECT dateTime, windGust
        FROM weewx.archive
        WHERE windGust=(
            SELECT MAX(windGust)
            FROM weewx.archive
            WHERE dateTime >= ${calculated.startTime}
            AND dateTime < ${calculated.endTime}
            ORDER BY dateTime DESC
        )
        ORDER BY dateTime DESC LIMIT 1`,
            (err, rows) => {
                if (err) {
                    console.error(err);
                }
                if (rows && rows[0]) {
                    hiLo.windGust.high = rows[0].windGust;
                    hiLo.windGust.highTime = rows[0].dateTime;
                }
                resolve(hiLo);
            }
        );
    });
    return promise;
};







router.get('/hilo/:timeUnit/:amount', async (req: Request, res: Response) => {

    let requestStartTime: number = Date.now();

    console.log('get hilo');

    let params: ValidParams = validateParams(req, res);

    if (!params) {
        return;
    }
    
    calculated = getRequestTime(params.timeUnit, params.amount);

    let hiLo: HiLo = new HiLo();

    
    hiLo = await getAverages(calculated, hiLo);

    hiLo = await getOutTempLow(calculated, hiLo);
    hiLo = await getOutTempHigh(calculated, hiLo);
    
    hiLo = await getBarometerLow(calculated, hiLo);
    hiLo = await getBarometerHigh(calculated, hiLo);
    
    hiLo = await getWindSpeedHigh(calculated, hiLo);
    hiLo = await getWindGustHigh(calculated, hiLo);
    
    res.setHeader('X-Request-Time', ((Date.now() - requestStartTime) / 1000) + 's');
    res.send(hiLo);

});



class HiLoValue {
    high: number = null;
    highTime: number = null;
    low: number = null;
    lowTime: number = null;
    average: number = null;
}

class HiLo {
    outTemp: HiLoValue = new HiLoValue();
    barometer: HiLoValue = new HiLoValue();
    outHumidity: HiLoValue = new HiLoValue();
    windSpeed: HiLoValue = new HiLoValue();
    windGust: HiLoValue = new HiLoValue();
}




export default router;


