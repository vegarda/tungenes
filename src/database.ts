import * as  mysql from 'mysql';

const pool = mysql.createPool({
    host:     process.env.DB_HOST,
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

let timeout = 250;

function makePromise(): Promise<mysql.MysqlError | mysql.PoolConnection> {
    let promise = new Promise<mysql.MysqlError | mysql.PoolConnection>((resolve: (connection: mysql.PoolConnection) => void, reject: (connection: mysql.MysqlError) => void) => {
        pool.getConnection((err, connection) => {
            if (err) {
                if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                    console.error('Database connection was closed.');
                }
                if (err.code === 'ER_CON_COUNT_ERROR') {
                    console.error('Database has too many connections.');
                }
                if (err.code === 'ECONNREFUSED') {
                    console.error('Database connection was refused.');
                }
                if (err.code === 'ETIMEDOUT') {
                    console.error('Database connection timed out.');
                }
                reject(err);
            }
            if (connection) {
                connection.release();
                resolve(connection);
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


export default pool;


