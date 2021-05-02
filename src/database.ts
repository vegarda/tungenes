import { createPool, MysqlError, Pool, PoolConnection } from 'mysql';
import { first } from 'rxjs/operators';
import { BetterPromise } from './promise';

interface CancelableQuery {
    cancel(): void;
}

class Query<T> implements CancelableQuery {

    private queryIsEnded: boolean = false;
    private queryIsCancelled: boolean = false;

    private poolConnection: PoolConnection;

    private requestTimeout: NodeJS.Timeout;

    private readonly promise: BetterPromise<T[]> = new BetterPromise();

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

        this.promise.onFulfilled$.pipe(first()).subscribe(() => {
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

        // await this.waitForPoolConnection();

        this.mysqlPool.getConnection((mysqlError: MysqlError, _poolConnection: PoolConnection) => {

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

            const query = _poolConnection.query(this.queryString, (_mysqlError: MysqlError, rows: T[]) => {

                this.queryIsEnded = true;

                _poolConnection.release();

                if (_mysqlError) {
                    console.error('_poolConnection.query()');
                    // console.error(_mysqlError);
                    this.promise.reject(_mysqlError);
                    return;
                }

                console.log('query time', (Date.now() - queryStartTime) / 1000);

                this.promise.resolve(rows);

            });

        });
    }

    public getData(): Promise<T[]> {
        return this.promise;
    }

    public getValue(): Promise<T[]> {
        return this.promise;
    }

    public get data(): T[] {
        return this.promise.value;
    }

    public get value(): T[] {
        return this.promise.value;
    }

    // private getPoolConnection(): Promise<PoolConnection> {
    //     return new Promise((resolve, reject) => {
    //         this.mysqlPool.getConnection((mysqlError: MysqlError, poolConnection: PoolConnection) => {
    //             if (mysqlError) {
    //                 reject(mysqlError);
    //                 return;
    //             }
    //             resolve(poolConnection);
    //         });
    //     });
    // }

    // private async waitForPoolConnection(): Promise<void> {
    //     // if (this.poolConnection) {
    //     //     return;
    //     // }
    //     const getPoolConnection = async () => {
    //         try {
    //             this.poolConnection = await this.getPoolConnection();
    //             console.log(this.poolConnection);
    //         }
    //         catch (error) {
    //             return getPoolConnection();
    //         }
    //     }
    //     while(!this.poolConnection) {
    //         await getPoolConnection();
    //     }
    // };

    public cancel(): void {
        if (!this.queryIsEnded) {
            if (this.poolConnection) {
                this.poolConnection.destroy();
            }
            this.promise.reject();
        }
    }

}


export class DatabaseConnection {

    public readonly mysqlPool: Pool;

    constructor() {
        const mysqlPool = createPool({
            host:     process.env.DB_HOST,
            database: process.env.DB_NAME,
            user:     process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });
        console.log(mysqlPool);
        this.mysqlPool = mysqlPool;
    }

    public query<T>(queryString: string): Query<T> {
        return new Query<T>(queryString, this.mysqlPool);
    }

}
