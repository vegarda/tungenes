import * as fs from 'fs';
import { execSync } from 'child_process';
import { exit } from 'process';


console.log('build.ts');

console.log('process.platform', process.platform);

if (process.platform === 'win32') {
    exit();
}


const distDirPath = `${ __dirname }/dist`;

const serviceFileName = `tungenes.service`;

const serviceFile = `
[Unit]
Description=Tungenes

[Service]
ExecStart=${ distDirPath }/server.js
Restart=always
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
WorkingDirectory=${ distDirPath }

[Install]
WantedBy=multi-user.target
Alias=sshd.service${ serviceFileName }
`;



const serviceFilePath = `${ distDirPath }/${ serviceFileName }`;

fs.writeFileSync(serviceFilePath, serviceFile);
fs.chmodSync(serviceFilePath, 0o664);
