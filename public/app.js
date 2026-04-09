const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${wsProtocol}//${window.location.host}`;
let ws;

// DOM Elements
const connectionStatus = document.getElementById('connectionStatus');
const indicatorLine = document.querySelector('.status-indicator');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');
const resultCount = document.getElementById('resultCount');
const resultsBody = document.getElementById('resultsBody');
const toastContainer = document.getElementById('toastContainer');

// Inputs
const concurrencyInput = document.getElementById('concurrency');
const countPerCidrInput = document.getElementById('countPerCidr');
const timeoutInput = document.getElementById('timeout');

let isScanning = false;
let currentResults = [];

function connectWS() {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        connectionStatus.textContent = 'SYS_ONLINE';
        indicatorLine.classList.add('connected');
        showToast('WebSocket connected', 'success');
    };

    ws.onclose = () => {
        connectionStatus.textContent = 'SYS_OFFLINE';
        indicatorLine.classList.remove('connected', 'scanning');
        disableInputs(true);
        setTimeout(connectWS, 3000); // Reconnect
    };

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        handleMessage(msg);
    };
}

function handleMessage(msg) {
    switch (msg.type) {
        case 'status':
            updateScanningState(msg.data.isScanning);
            break;
            
        case 'progress':
            const { total, completed } = msg.data;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
            
            progressBar.style.width = `${percent}%`;
            progressText.textContent = `${completed} / ${total}`;
            progressPercent.textContent = `${percent}%`;
            break;
            
        case 'result':
            currentResults.push(msg.data);
            // Sort by latency
            currentResults.sort((a, b) => a.latency - b.latency);
            renderResults();
            break;
            
        case 'done':
            updateScanningState(false);
            currentResults = msg.data;
            renderResults();
            showToast('Scan Sequence Complete', 'success');
            break;
    }
}

function updateScanningState(scanning) {
    isScanning = scanning;
    
    if (scanning) {
        indicatorLine.classList.add('scanning');
        connectionStatus.textContent = 'SCAN_ACTIVE';
        startBtn.disabled = true;
        stopBtn.disabled = false;
        disableInputs(true);
    } else {
        indicatorLine.classList.remove('scanning');
        connectionStatus.textContent = 'SYS_ONLINE';
        startBtn.disabled = false;
        stopBtn.disabled = true;
        disableInputs(false);
    }
}

function disableInputs(disabled) {
    concurrencyInput.disabled = disabled;
    countPerCidrInput.disabled = disabled;
    timeoutInput.disabled = disabled;
}

function renderResults() {
    resultCount.textContent = currentResults.length;
    resultsBody.innerHTML = '';
    
    // Pick top 100
    const topResults = currentResults.slice(0, 100);
    
    topResults.forEach((result, index) => {
        const tr = document.createElement('tr');
        tr.style.animationDelay = `${index * 0.05}s`;
        
        let latencyClass = 'latency-fair';
        if (result.latency < 150) latencyClass = 'latency-good';
        if (result.latency < 80) latencyClass = 'latency-excellent';
        
        tr.innerHTML = `
            <td>#${index + 1}</td>
            <td style="color: var(--accent-cyan); font-weight: bold;">${result.ip}</td>
            <td class="${latencyClass}">${result.latency.toFixed(2)} ms</td>
            <td style="font-weight: bold; color: var(--accent-orange);">${result.colo || 'UNK'}</td>
            <td>${result.cidr}</td>
            <td>
                <button class="action-btn" onclick="copyIp('${result.ip}')">COPY</button>
            </td>
        `;
        
        resultsBody.appendChild(tr);
    });
}

// Global copy function for inline handler
window.copyIp = function(ip) {
    navigator.clipboard.writeText(ip).then(() => {
        showToast(`Copied ${ip} to clipboard`);
    }).catch(err => {
        console.error('Could not copy text: ', err);
        showToast('Copy failed', 'error');
    });
};

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    if (type === 'error') toast.style.borderLeftColor = 'var(--accent-red)';
    if (type === 'success') toast.style.borderLeftColor = 'var(--accent-green)';
    
    toast.textContent = `[SYS_MSG] ${message}`;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Event Listeners
startBtn.addEventListener('click', () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    currentResults = [];
    renderResults();
    
    progressBar.style.width = '0%';
    progressText.textContent = '0 / 0';
    progressPercent.textContent = '0%';
    
    ws.send(JSON.stringify({
        type: 'start',
        config: {
            concurrency: parseInt(concurrencyInput.value) || 20,
            countPerCidr: parseInt(countPerCidrInput.value) || 15,
            timeout: parseInt(timeoutInput.value) || 200,
            targetColo: document.getElementById('targetColo').value.trim()
        }
    }));
});

stopBtn.addEventListener('click', () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    ws.send(JSON.stringify({
        type: 'stop'
    }));
});

// Initialize
connectWS();
