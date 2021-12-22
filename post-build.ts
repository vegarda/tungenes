import * as fs from 'fs';
import { execSync } from 'child_process';
import { exit } from 'process';



console.log('build.ts');


console.log('process.platform', process.platform);

if (process.platform === 'win32') {
    exit();
}



const dir = `${ __filename }/dist`;

const serviceFile = `
[Unit]
Description=Tungenes

[Service]
ExecStart=${ dir }/server.js
Restart=always
User=nobody
Group=nogroup
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
WorkingDirectory=${ dir }

[Install]
WantedBy=multi-user.target
`;


const serviceFileName = `tungenes.service`;
const serviceFilePath = `${ dir }/${ serviceFileName }`;

fs.writeFileSync(serviceFilePath, serviceFile);
fs.chmodSync(serviceFilePath, 0o665);

const symlinkCommand = `ln -s ${ serviceFilePath } /etc/systemd/system/${ serviceFileName }`;
// console.log(symlinkCommand);
execSync(symlinkCommand);

const restartSystemctlCommand = `systemctl daemon-reload`;
execSync(restartSystemctlCommand);

const startServiceCommand = `systemctl enable tungenes`;
execSync(startServiceCommand);

const enableBootCommand = `systemctl enable tungenes`;
execSync(enableBootCommand);
