import * as fs from 'fs';
import { execSync } from 'child_process';
import { exit } from 'process';


console.log('build.ts');

console.log('process.platform', process.platform);

if (process.platform === 'win32') {
    exit();
}


const distDirPath = `${ __dirname }/dist`;

const serviceFile = `
[Unit]
Description=Tungenes

[Service]
ExecStart=${ distDirPath }/server.js
Restart=always
User=nobody
Group=nogroup
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
WorkingDirectory=${ distDirPath }

[Install]
WantedBy=multi-user.target
`;


const serviceFileName = `tungenes.service`;
const serviceFilePath = `${ distDirPath }/${ serviceFileName }`;

fs.writeFileSync(serviceFilePath, serviceFile);
fs.chmodSync(serviceFilePath, 0o665);
