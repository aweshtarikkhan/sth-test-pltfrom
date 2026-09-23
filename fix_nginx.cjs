const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmd = `sed -i '/root \\/www\\/wwwroot\\/sth-test-pltfrom\\/dist;/a \\    location \\/ {\\n        try_files $uri $uri\\/ \\/index.html;\\n    }' /www/server/panel/vhost/nginx/attendence.satahinvoice.com.conf && nginx -t && nginx -s reload`;
  conn.exec(cmd, (err, stream) => {
    stream.on('data', d => process.stdout.write(d));
    stream.stderr.on('data', d => process.stderr.write(d));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '89.116.32.98', port: 22, username: 'root', password: 'CabNet@2025#' });
