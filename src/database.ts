import { createPool, MysqlError, Pool, PoolConnection } from 'mysql';
import { first } from 'rxjs/operators';
import { BetterPromise } from './promise';

interface CancelableQuery {
    cancel(): void;
}

class QueryPromise<T> implements CancelableQuery {

    private queryIsEnded: boolean = false;
    private queryIsCancelled: boolean = false;

    private poolConnection: PoolConnection;

    private requestTimeout: NodeJS.Timeout;

    public readonly promise: BetterPromise<T[]> = new BetterPromise();

    constructor(
        queryString: string,
        mysqlPool: Pool,
        timeout: number = 30000,
    ) {

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
        }, timeout);

        mysqlPool.getConnection((mysqlError: MysqlError, _poolConnection: PoolConnection) => {

            if (this.queryIsCancelled) {
                _poolConnection.release();
                return;
            }

            this.poolConnection = _poolConnection;

            if (mysqlError) {
                this.promise.reject(mysqlError);
                return;
            }

            const queryStartTime = Date.now();

            const query = _poolConnection.query(queryString, (_mysqlError: MysqlError, rows: T[]) => {

                this.queryIsEnded = true;

                _poolConnection.release();

                if (_mysqlError) {
                    console.log('_mysqlError', _mysqlError);
                    this.promise.reject(_mysqlError);
                    return;
                }

                console.log('query time', (Date.now() - queryStartTime) / 1000);

                this.promise.resolve(rows);

            });

        });
    }

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
        this.mysqlPool = mysqlPool;
    }

    public query<T>(queryString: string): QueryPromise<T> {
        return new QueryPromise<T>(queryString, this.mysqlPool);
    }

}
