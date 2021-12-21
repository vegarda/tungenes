import { Raw } from 'data/raw';
import { Database, DataMethods } from 'database';
import * as express from 'express';
import * as http from 'http';
import { BehaviorSubject } from 'rxjs';
import * as WebSocket from 'ws';




export default class DataSocket {

    private wss: WebSocket.Server;
    private openSockets: WebSocket[] = [];

    private consoleData$ = new BehaviorSubject<Raw>({
        dateTime: 0,
        outHumidity: 0,
        barometer: 0,
        outTemp: 0,
        windSpeed: 0,
        windDir: 0,
        windGust: 0,
        windGustDir: 0,
        dayRain: 0,
        rainRate: 0,
    });

    constructor(
        private dataMethods: DataMethods,
        private port: number = 800,
    ) {
        this.init();
    }

    private async init(): Promise<void> {

        this.consoleData$.subscribe(consoleData => {
            // console.log('DataSocket.consoleData$', consoleData);
            this.updateSocketsWithData();
        })

        this.configWebSocket();
        this.updateSockets();

    }


    private configWebSocket() {
        console.log('DataSocket.configWebSocket()');

        const app = express();
        const server = http.createServer(app);
        this.wss = new WebSocket.Server({server});

        this.wss.on('connection', async (socket: WebSocket) => {

            if (this.openSockets.length === 0) {
                await this.updateData();
            }

            this.openSockets.push(socket);
            this.updateSocket(socket);

            console.log('DataSocket.openSockets: ' + this.openSockets.length);

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
        // console.log('DataSocket.updateSockets()');
        await this.updateData();
        this.sleepAndUpdate();
    }

    private updateSocketsWithData() {
        // console.log('DataSocket.updateSocketsWithData()');
        this.openSockets.forEach(socket => {
            this.updateSocket(socket);
        });
    }

    private async sleepAndUpdate(sleepDuration: number = 10000) {
        // console.log('DataSocket.sleepAndUpdate()');
        await this.sleep(sleepDuration);
        this.updateSockets();
    }

    private updateSocket(socket: WebSocket) {
        const consoleData = this.consoleData$.value;
        if (consoleData) {
            socket.send(JSON.stringify(consoleData));
        }
    }

    private async sleep(ms: number){
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    private async getData(): Promise<Raw> {
        // console.log('DataSocket.getData()');
        const rawData = await this.dataMethods.getRawData();
        if (rawData) {
            return rawData[0];
        }
        return null;
    }

    private async updateData(): Promise<void> {
        // console.log('DataSocket.updateData()');
        try {
            const data = await this.getData();
            if (this.consoleData$.value.dateTime < data.dateTime) {
                this.consoleData$.next(data);
            }
        }
        catch (error) {
            if (error) {
                console.error(error.name);
                console.error(error.message);
            }
        }
    }

}

