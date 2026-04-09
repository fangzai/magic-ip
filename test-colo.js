const http = require('http');
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

function checkColo(ipAddr) {
    return new Promise((resolve) => {
      const req = http.get(`http://${ipAddr}/cdn-cgi/trace`, { timeout: 2500 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const match = data.match(/colo=([A-Z]+)/);
          resolve({ip: ipAddr, colo: match ? match[1] : 'UNK'});
        });
      });
      req.on('error', () => resolve({ip: ipAddr, colo: 'ERR'}));
      req.on('timeout', () => { req.destroy(); resolve({ip: ipAddr, colo: 'T/O'}); });
    });
}

async function run() {
    console.log('Testing 200 random IPs for Colo distribution (ignoring latency limits)...');
    const tests = [];
    for(let i=0; i<200; i++) {
        const cidr = cloudflareIps[Math.floor(Math.random() * cloudflareIps.length)];
        const testIp = getRandomIP(cidr);
        tests.push(checkColo(testIp));
    }
    const results = await Promise.all(tests);
    const counts = {};
    for (const r of results) {
        counts[r.colo] = (counts[r.colo] || 0) + 1;
    }
    console.log('Distribution:', counts);
}
run();
