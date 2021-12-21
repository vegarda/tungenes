import { createPool, Pool, PoolConnection, QueryError } from 'mysql2';
import { take } from 'rxjs';

import { DataCache } from './utils/data-cache';
import { RequestTimeParams } from './utils/request-time-params';
import { BetterPromise } from './utils/promise';

import { Archive } from './data/archive';
import { Raw } from './data/raw';


class Query<T> {

    private queryIsEnded: boolean = false;
    private queryIsCancelled: boolean = false;

    private poolConnection: PoolConnection;

    private requestTimeout: NodeJS.Timeout;

    private promise: BetterPromise<T[]>;

    constructor(
        private queryString: string,
        private mysqlPool: Pool,
        private timeout: number = 30000,
    ) {
        if (!queryString) {
            throw new Error('!queryString');
        }
        if (!mysqlPool) {
            throw new Error('!mysqlPool');
        }
        this.init();
    }

    private async init(): Promise<void> {

        this.promise = new BetterPromise<T[]>();

        this.promise.onFulfilled$.pipe(take(1)).subscribe(() => {
            clearTimeout(this.requestTimeout);
        });

        this.requestTimeout = setTimeout(() => {
            if (!this.queryIsEnded) {
                if (this.poolConnection) {
                    this.poolConnection.destroy();
                }
                this.promise.reject();
            }
        }, this.timeout);

        this.mysqlPool.getConnection((mysqlError: QueryError, _poolConnection: PoolConnection) => {

            if (this.queryIsCancelled) {
                _poolConnection.release();
                return;
            }

            this.poolConnection = _poolConnection;

            if (mysqlError) {
                this.queryIsEnded = true;
                this.promise.reject(mysqlError);
                return;
            }

            const queryStartTime = Date.now();

            const query = _poolConnection.query(this.queryString, (queryError: QueryError, rows: T[]) => {

                this.queryIsEnded = true;

                _poolConnection.release();

                if (queryError) {
                    // console.error('_poolConnection.query()');
                    console.error(this.queryString);
                    console.error('QueryError', queryError);
                    this.promise.reject(queryError);
                    return;
                }

                // console.log('query time', (Date.now() - queryStartTime) / 1000);

                this.promise.resolve(rows);

            });

        });
    }

    public getValue(): BetterPromise<T[]> {
        return this.promise;
    }

    public get value(): T[] {
        return this.promise.value;
    }

    public cancel(): void {
        console.log('Query.cancel()', 'queryIsEnded', this.queryIsEnded);
        if (this.queryIsEnded) {
            return;
        }
        this.queryIsCancelled = true;
        if (this.poolConnection) {
            // this.poolConnection.destroy();
            this.poolConnection.release();
        }
        this.promise.reject('Query.cancel()');
    }

}

export class DatabaseConnection {

    public readonly mysqlPool: Pool;

    constructor() {
        const mysqlPool = createPool({
            host:     process.env.DB_HOST,
            database: process.env.DB_NAME,
            user:     process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });
        this.mysqlPool = mysqlPool;
    }

    public query<T>(queryString: string): Query<T> {
        return new Query<T>(queryString, this.mysqlPool);
    }

}



export interface DataMethods {
    getArchiveData(rtp: RequestTimeParams, signal?: AbortSignal): Promise<Archive[]>;
    getRawData(): Promise<Raw[]>;
}


export class Database implements DataMethods {

    constructor(
        private databaseConnection: DatabaseConnection,
    ) { }

    public query<T>(queryString: string): Query<T> {
        return this.databaseConnection.query(queryString);
    }

    public async getArchiveData(rtp: RequestTimeParams, signal?: AbortSignal): Promise<Archive[]> {
        console.log('DatabaseCacher.Database()', rtp);
        const queryString = `
            SELECT
                dateTime,
                barometer,
                outTemp,
                outHumidity,
                rainRate,
                windSpeed,
                windDir,
                windGust,
                windGustDir,
                rain
            FROM weewx.archive
            WHERE dateTime >= ${ rtp.startTime } and dateTime <= ${ rtp.endTime }
            ORDER BY dateTime ASC
        `;
        const query = this.query<Archive>(queryString);
        if (signal) {
            signal.addEventListener('abort', () => query.cancel(), { once: true });
        }
        const queryPromise = query.getValue();
        return queryPromise;
    }

    public getRawData(): Promise<Raw[]> {
        const queryString = `
            SELECT
                barometer,
                dateTime,
                dayRain,
                heatindex,
                outHumidity,
                outTemp,
                rainRate,
                windDir,
                windSpeed
            FROM raw ORDER BY dateTime DESC LIMIT 1
        `;
        const query = this.query<Raw>(queryString);
        const queryPromise = query.getValue();
        return queryPromise;
    }

}



export class DatabaseCacher implements DataMethods {


    constructor(
        private database: Database,
    ) { }

    public query<T>(queryString: string): Query<T> {
        return this.database.query(queryString);
    }

    private archiveDataCache = new DataCache<Archive[]>();
    public async getArchiveData(rtp: RequestTimeParams, signal?: AbortSignal): Promise<Archive[]> {
        console.log('DatabaseCacher.getArchiveData()', rtp);
        const cachedData = this.archiveDataCache.getDataForRequestTimeParams(rtp);
        if (cachedData) {
            return cachedData;
        }
        const data = await this.database.getArchiveData(rtp, signal);
        this.archiveDataCache.setDataForRequestTimeParams(rtp, data);
        return data;
    }

    public getRawData(): Promise<Raw[]> {
        return this.database.getRawData();
    }

}