import { DatabaseConnection } from 'database';
import * as express from 'express';
import * as http from 'http';
import { MysqlError, Pool, PoolConnection } from 'mysql';
import * as WebSocket from 'ws';



interface IConsoleData {
    barometer?: number;
    dateTime?: number;
    dayRain?: number;
    heatindex?: number;
    outHumidity?: number;
    outTemp?: number;
    windDir?: number | null;
    windGust?: number;
    windGustDir?: number | null;
    windSpeed?: number;
}

export default class DataSocket {

    private wss: WebSocket.Server;
    private openSockets: WebSocket[] = [];

    private consoleData: IConsoleData = {
        dateTime: 0
    };

    // private poolConnection: PoolConnection;

    constructor(
        private databaseConnection: DatabaseConnection,
        private port: number = 800,
    ) {
        this.init();
    }

    private async init(): Promise<void> {
        this.configWebSocket();
        // await this.waitForDatabaseConnection();
        this.updateSockets();
    }

    // private _getDatabaseConnection(): Promise<PoolConnection> {
    //     return new Promise((resolve, reject) => {
    //         this.mysqlPool.getConnection((mysqlError: MysqlError, poolConnection: PoolConnection) => {
    //             if (mysqlError) {
    //                 // console.log('mysqlError');
    //                 // console.log(mysqlError);
    //                 reject(mysqlError);
    //                 return;
    //             }
    //             resolve(poolConnection);
    //         });
    //     });
    // }

    // private getDatabaseConnection(): Promise<void> {
    //     return new Promise((resolve) => {
    //         this.mysqlPool.getConnection((mysqlError: MysqlError, _poolConnection: PoolConnection) => {
    //             if (mysqlError) {
    //                 console.log('mysqlError');
    //                 console.log(mysqlError);
    //                 return this.getDatabaseConnection();
    //             }
    //             this.poolConnection = _poolConnection;
    //             resolve();
    //         });
    //     });
    // }

    // private async waitForDatabaseConnection(): Promise<void> {
    //     if (this.poolConnection) {
    //         return;
    //     }
    //     const getDatabaseConnection = async () => {
    //         try {
    //             this.poolConnection = await this._getDatabaseConnection();
    //             console.log(this.poolConnection);
    //         }
    //         catch (error) {
    //             return getDatabaseConnection();
    //         }
    //     }
    //     while(!this.poolConnection) {
    //         await getDatabaseConnection();
    //     }
    // };

    private configWebSocket() {
        console.log('configWebSocket');

        const app = express();
        const server = http.createServer(app);
        this.wss = new WebSocket.Server({server});

        this.wss.on('connection', (socket: WebSocket) => {

            this.openSockets.push(socket);
            console.log('openSockets: ' + this.openSockets.length);
            this.updateSocket(socket);

            socket.on('close', () => {
                console.log('socket close');
                this.openSockets.splice(this.openSockets.indexOf(socket));
                console.log('openSockets: ' + this.openSockets.length);
            });

            socket.on('error', () => {
                console.log('socket error');
            });

        });

        // console.log(wss);
        server.listen(this.port, () => {
            console.log(`socket server started on port ${(server.address() as WebSocket.AddressInfo).port} :)`);
        });

    }

    private async updateSockets() {
        console.log('updateSockets');
        if (this.openSockets.length > 0 || true) {
            try {
                const data = await this.getData();
                // console.log(data);
                if (this.consoleData.dateTime < data.dateTime) {
                    this.consoleData = data;
                    this.openSockets.forEach(socket => {
                        this.updateSocket(socket);
                    });
                }
            }
            catch (error) {
                console.error('getData reject');
                if (error) {
                    console.error(error.name);
                    console.error(error.message);
                }
            }
        }
        this.sleepAndUpdate();
    }

    private async sleepAndUpdate() {
        await this.sleep(1000);
        this.updateSockets();
    }

    private updateSocket(socket: WebSocket) {
        if (this.consoleData) {
            socket.send(JSON.stringify(this.consoleData));
        }
    }

    private async sleep(ms: number){
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    private async getData(): Promise<IConsoleData> {
        const rawDataQueryString = 'SELECT * from raw order by dateTime desc limit 1';
        const rawDataQuery = this.databaseConnection.query<IConsoleData>(rawDataQueryString);
        const rawData = await rawDataQuery.getData();
        if (rawData) {
            return rawData[0];
        }
        return null;
    }

}

