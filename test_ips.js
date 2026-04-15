const ip = require('ip');

function getRandomIPs(cidrStr, count) {
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
      console.error(e);
      return [];
    }
}

console.log('Testing 1.1.1.0/24:');
console.log(getRandomIPs('1.1.1.0/24', 5));

console.log('Testing 104.16.0.0/13:');
console.log(getRandomIPs('104.16.0.0/13', 5));
