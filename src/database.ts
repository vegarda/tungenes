import * as  mysql from 'mysql';

const mysqlPool = mysql.createPool({
    host:     process.env.DB_HOST,
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

mysqlPool.on('acquire',     () => console.log('mysqlPool acquire'));
mysqlPool.on('connection',  () => console.log('mysqlPool connection'));
mysqlPool.on('enqueue',     () => console.log('mysqlPool enqueue'));
mysqlPool.on('error',       () => console.log('mysqlPool error'));
mysqlPool.on('release',     () => console.log('mysqlPool release'));

let timeout = 250;

function makePromise(): Promise<mysql.MysqlError | mysql.PoolConnection> {
    let promise = new Promise<mysql.MysqlError | mysql.PoolConnection>((resolve: (connection: mysql.PoolConnection) => void, reject: (connection: mysql.MysqlError) => void) => {
        mysqlPool.getConnection( (mysqlError: mysql.MysqlError, mysqlPoolConnection: mysql.PoolConnection) => {
            if (mysqlError) {
                if (mysqlError.code === 'PROTOCOL_CONNECTION_LOST') {
                    console.error('Database connection was closed.');
                }
                if (mysqlError.code === 'ER_CON_COUNT_ERROR') {
                    console.error('Database has too many connections.');
                }
                if (mysqlError.code === 'ECONNREFUSED') {
                    console.error('Database connection was refused.');
                }
                if (mysqlError.code === 'ETIMEDOUT') {
                    console.error('Database connection timed out.');
                }
                reject(mysqlError);
            }
            if (mysqlPoolConnection) {
                mysqlPoolConnection.release();
                resolve(mysqlPoolConnection);
            }
        });
    });
    return promise;
}

function getConnection() {
    console.log('getConnection ' + timeout);
    makePromise().then((connection: mysql.PoolConnection) => {
        console.log('got connection to db');
        timeout = 1000;
    })
    .catch((err: mysql.MysqlError) =>  {
        // console.log(err);
        timeout = timeout + timeout;
        if (timeout > 32000) {
            timeout = 32000;
        }
        setTimeout(() => {
            getConnection();
        }, timeout);
    })
}

getConnection();


export default mysqlPool;


