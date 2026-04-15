const net = require('net');
const ip = require('ip');

const cloudflareIps = [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22",
  "103.31.4.0/22", "141.101.64.0/18", "108.162.192.0/18",
  "190.93.240.0/20", "188.114.96.0/20", "197.234.240.0/22",
  "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13",
  "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22"
];

function getRandomIP(cidrStr) {
    const { networkAddress, broadcastAddress } = ip.cidrSubnet(cidrStr);
    const startNum = ip.toLong(networkAddress) + 1; 
    const endNum = ip.toLong(broadcastAddress) - 1; 
    const ipRange = endNum - startNum;
    return ip.fromLong(startNum + Math.floor(Math.random() * ipRange));
}

function tcpPing(targetIp, port = 443, timeout = 2500) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const startTime = process.hrtime.bigint();
      let hasResolved = false;

      const finish = (latencyMs = Infinity) => {
        if (!hasResolved) {
          hasResolved = true;
          socket.destroy();
          resolve(latencyMs);
        }
      };

      socket.setTimeout(timeout);
      socket.on('connect', () => {
        const endTime = process.hrtime.bigint();
        const latencyMs = Number(endTime - startTime) / 1000000;
        finish(latencyMs);
      });
      socket.on('timeout', () => finish(Infinity));
      socket.on('error', () => finish(Infinity));

      try {
        socket.connect(port, targetIp);
      } catch (e) {
        finish(Infinity);
      }
    });
}

async function run() {
    console.log('Testing 50 random IPs on port 443 (Parallel)...');
    const tests = [];
    for(let i=0; i<50; i++) {
        const cidr = cloudflareIps[Math.floor(Math.random() * cloudflareIps.length)];
        const targetIp = getRandomIP(cidr);
        tests.push(tcpPing(targetIp).then(latency => ({ip: targetIp, latency})));
    }
    
    const results = await Promise.all(tests);
    const success = results.filter(r => r.latency !== Infinity);
    console.log(`Success rate: ${success.length}/${results.length}`);
    if (success.length > 0) {
        success.sort((a, b) => a.latency - b.latency);
        console.log('Results (top 10):');
        success.slice(0, 10).forEach(r => console.log(` - ${r.ip}: ${r.latency.toFixed(2)}ms`));
    } else {
        console.log('All failed. Checking 1.1.1.1 manually...');
        const dnsLatency = await tcpPing('1.1.1.1');
        console.log(`1.1.1.1 latency: ${dnsLatency}`);
    }
}
run();
