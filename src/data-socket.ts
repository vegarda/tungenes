import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';

import connection from './database';

export default class DataSocket {

    private wss: WebSocket.Server;
    private openSockets: WebSocket[] = [];
    private consoleData: IConsoleData;

    constructor(private port: number = 800) {
        this.configWebSocket();
        this.updateSockets();
        this.getData().then(data => this.consoleData = data);
    }

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
            console.log(`Server started on port ${(server.address() as WebSocket.AddressInfo).port} :)`);
        });

    }

    private async updateSockets() {
        if (this.openSockets.length > 0) {
            this.getData().then(async (data) => {
                if (data.dateTime > this.consoleData.dateTime) {
                    // console.log(data);
                    this.consoleData = data;
                    this.openSockets.forEach(socket => {
                        this.updateSocket(socket);
                    });
                }
                this.sleepAndUpdate();
            })
        }
        else {
            this.sleepAndUpdate();
        }
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

    private async getData(): Promise<IConsoleData>  {
        let promise: Promise<IConsoleData> = new Promise((resolve, reject) => {
            connection.query('SELECT * from raw order by dateTime desc limit 1', (err, rows, fields) => {
                if (err) {
                    reject(null);
                }
                if (rows && rows[0]) {
                    resolve(rows[0]);
                }
                else {
                    reject(null);
                }
            });

        });
        return promise;
    }

}

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
