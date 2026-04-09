const net = require('net');
const ip = require('ip');
const http = require('http');
const EventEmitter = require('events');

class IPScanner extends EventEmitter {
  constructor() {
    super();
    this.isScanning = false;
    this.results = [];
    this.progress = {
      total: 0,
      completed: 0,
      currentBlock: ''
    };
  }

  getRandomIPs(cidrStr, count) {
    try {
      const { networkAddress, broadcastAddress } = ip.cidrSubnet(cidrStr);
      
      const startNum = ip.toLong(networkAddress) + 1; 
      const endNum = ip.toLong(broadcastAddress) - 1; 
      
      const ipRange = endNum - startNum;
      if (ipRange <= 0) return [];
      
      const ips = [];
      const actualCount = Math.min(count, ipRange);
      
      const seen = new Set();
      while (ips.length < actualCount) {
        const randomOffset = Math.floor(Math.random() * ipRange);
        const targetLong = startNum + randomOffset;
        
        if (!seen.has(targetLong)) {
          seen.add(targetLong);
          ips.push(ip.fromLong(targetLong));
        }
      }
      return ips;
    } catch (e) {
      return [];
    }
  }

  tcpPing(targetIp, port = 443, timeout = 2000) {
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

  getColo(targetIp) {
    return new Promise((resolve) => {
      const req = http.get(`http://${targetIp}/cdn-cgi/trace`, { timeout: 1500 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const match = data.match(/colo=([A-Z]+)/);
          resolve(match ? match[1] : 'UNK');
        });
      });
      
      req.on('error', () => resolve('ERR'));
      req.on('timeout', () => {
        req.destroy();
        resolve('T/O');
      });
    });
  }

  async scanIpPool(ipList, config = {}) {
    const concurrency = config.concurrency || 20;
    const timeout = config.timeout || 2000;
    const contextUrl = config.contextUrl || '';
    let i = 0;
    const promises = [];
    
    const execNext = async () => {
      if (!this.isScanning || i >= ipList.length) return;
      
      const index = i++;
      const item = ipList[index];
      
      const latency = await this.tcpPing(item.ip, 443, timeout);
      this.progress.completed++;
      
      // USER REQUIREMENT: Discard if strict latency > 200ms
      if (latency <= 200 && latency < timeout) {
        const colo = await this.getColo(item.ip);
        
        if (!config || !config.targetColo || config.targetColo.toUpperCase() === 'ANY' || config.targetColo === '' || colo === config.targetColo.toUpperCase()) {
          const result = {
            ip: item.ip,
            cidr: item.cidr,
            latency: latency,
            colo: colo,
            speedTestUrl: contextUrl
          };
          this.results.push(result);
          this.emit('result', result);
        }
      }
      
      this.emit('progress', this.progress);
      await execNext();
    };

    for (let c = 0; c < Math.min(concurrency, ipList.length); c++) {
      promises.push(execNext());
    }

    await Promise.all(promises);
  }

  async startScan(cidrList, config = {}) {
    if (this.isScanning) {
      this.stopScan();
    }

    this.isScanning = true;
    this.results = [];
    
    const countPerCidr = config.countPerCidr || 15;
    const concurrency = config.concurrency || 20;
    const timeout = config.timeout || 200;

    const ipPool = [];
    for (const cidr of cidrList) {
      const randomIps = this.getRandomIPs(cidr, countPerCidr);
      for (const ip of randomIps) {
        ipPool.push({ ip, cidr });
      }
    }

    this.progress = {
      total: ipPool.length,
      completed: 0,
    };
    
    this.emit('progress', this.progress);
    await this.scanIpPool(ipPool, config);
    
    this.isScanning = false;
    this.emit('done', this.results.sort((a, b) => a.latency - b.latency));
  }

  stopScan() {
    this.isScanning = false;
  }
}

module.exports = IPScanner;
