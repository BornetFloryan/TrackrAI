const net = require('net');

const TCP_HOST = process.env.CENTRAL_HOST || '127.0.0.1';
const TCP_PORT = Number(process.env.CENTRAL_PORT);

function sendToCentralServer(message) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let buffer = '';
    let finished = false;

    const finishResolve = (value) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      client.destroy();
      resolve(value);
    };

    const finishReject = (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      client.destroy();
      reject(err);
    };

    client.connect(TCP_PORT, TCP_HOST, () => {
      client.write(message + '\n');
    });

    client.on('data', (data) => {
      buffer += data.toString();

      const lines = buffer.split('\n');

      if (lines.length > 1) {
        const firstLine = lines[0].trim();
        console.log('Received from TCP server:', firstLine);
        finishResolve(firstLine);
      }
    });

    client.on('error', (err) => {
      finishReject(err);
    });

    const timeout = setTimeout(() => {
      finishReject(new Error('TCP timeout'));
    }, 3000);
  });
}

module.exports = { sendToCentralServer };
