const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  conn.exec('cat /www/server/panel/vhost/nginx/attendence.satahinvoice.com.conf', (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '89.116.32.98', port: 22, username: 'root', password: 'CabNet@2025#' });
