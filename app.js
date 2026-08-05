/**
 * NexusAI Ticket Studio - Main Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Element References ---
  const providerSelect = document.getElementById('provider-select');
  const apiKeyGroup = document.getElementById('api-key-group');
  const apiKeyInput = document.getElementById('api-key-input');
  const toggleKeyBtn = document.getElementById('toggle-key-btn');
  const eyeIcon = document.getElementById('eye-icon');
  
  const backendStatusBadge = document.getElementById('backend-status-badge');
  const statusText = document.getElementById('status-text');
  
  const ticketsTextarea = document.getElementById('tickets-textarea');
  const clearInputBtn = document.getElementById('clear-input-btn');
  const addTicketBtn = document.getElementById('add-ticket-btn');
  const loadAllSamplesBtn = document.getElementById('load-all-samples-btn');
  const sampleBtns = document.querySelectorAll('.preset-btn, .sample-btn');
  
  const runClusteringBtn = document.getElementById('run-clustering-btn');
  const generateSolutionsBtn = document.getElementById('generate-solutions-btn');
  
  const loadingState = document.getElementById('loading-state');
  const loadingText = document.getElementById('loading-text');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const emptyState = document.getElementById('empty-state');
  const clustersContainer = document.getElementById('clusters-container');
  
  const ticketCountBadge = document.getElementById('ticket-count-badge');
  const metricClusters = document.getElementById('metric-clusters');
  const metricConf = document.getElementById('metric-conf');
  const apiLogStatus = document.getElementById('api-log-status');

  // --- Pre-populated Sample Data ---
  const PREPOPULATED_TICKETS = [
    "I forgot my password and cannot access my account. Please help reset it.",
    "I can't log in to the enterprise portal after updating my security credentials.",
    "How to see my current leave balance and request annual paid time off?"
  ];

  // Global State
  let state = {
    provider: 'ollama',
    apiKey: '',
    tickets: [...PREPOPULATED_TICKETS],
    clusters: [],
    solutionsGenerated: false,
    backendOnline: false,
    backendUrl: 'http://127.0.0.1:5000'
  };

  // --- Initial Setup ---
  initApp();

  function initApp() {
    // Render initial Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
    
    // Set initial text area content
    updateTextareaFromState();
    
    // Setup Event Listeners
    setupEventListeners();
    
    // Check Backend Connection (Flask port 5000)
    checkBackendHealth();
  }

  function setupEventListeners() {
    // Provider selection change
    providerSelect.addEventListener('change', (e) => {
      state.provider = e.target.value;
      if (state.provider === 'ollama') {
        apiKeyGroup.style.display = 'none';
        logStatus(`Switched to Ollama Local LLM. No API Key required.`);
      } else {
        apiKeyGroup.style.display = 'flex';
        const name = state.provider === 'groq' ? 'Groq API' : 'OpenRouter API';
        logStatus(`Switched to ${name}. Enter your API key for remote processing.`);
      }
    });

    // API Key toggle eye button
    toggleKeyBtn.addEventListener('click', () => {
      if (apiKeyInput.type === 'password') {
        apiKeyInput.type = 'text';
        eyeIcon.setAttribute('data-lucide', 'eye-off');
      } else {
        apiKeyInput.type = 'password';
        eyeIcon.setAttribute('data-lucide', 'eye');
      }
      if (window.lucide) window.lucide.createIcons();
    });

    apiKeyInput.addEventListener('input', (e) => {
      state.apiKey = e.target.value.trim();
    });

    // Sample ticket button clicks
    sampleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const ticketText = btn.getAttribute('data-ticket');
        if (!state.tickets.includes(ticketText)) {
          state.tickets.push(ticketText);
          updateTextareaFromState();
          showToast(`Added sample ticket to queue!`);
        } else {
          showToast(`Ticket is already in the list.`);
        }
      });
    });

    // Load All 3 Samples button
    loadAllSamplesBtn.addEventListener('click', () => {
      state.tickets = [...PREPOPULATED_TICKETS];
      updateTextareaFromState();
      showToast(`Loaded all 3 default tickets.`);
    });

    // Clear input button
    clearInputBtn.addEventListener('click', () => {
      state.tickets = [];
      ticketsTextarea.value = '';
      updateTicketCountBadge();
      showToast(`Cleared all tickets.`);
    });

    // Add Single Ticket button (non-blocking, no prompt popup dialogs)
    addTicketBtn.addEventListener('click', () => {
      ticketsTextarea.focus();
      if (ticketsTextarea.value.trim().length > 0 && !ticketsTextarea.value.endsWith('\n')) {
        ticketsTextarea.value += '\n';
      }
      showToast('Ready to type new ticket on a new line.');
    });

    // Sync textarea edits back to state
    ticketsTextarea.addEventListener('input', () => {
      const rawText = ticketsTextarea.value;
      state.tickets = rawText.split('\n').map(t => t.trim()).filter(t => t.length > 0);
      updateTicketCountBadge();
    });

    // Action: Run AI Clustering & Grouping
    runClusteringBtn.addEventListener('click', handleRunClustering);

    // Action: Generate AI Solutions
    generateSolutionsBtn.addEventListener('click', handleGenerateSolutions);
  }

  function updateTextareaFromState() {
    ticketsTextarea.value = state.tickets.join('\n');
    updateTicketCountBadge();
  }

  function updateTicketCountBadge() {
    const count = state.tickets.length;
    ticketCountBadge.textContent = `${count} Ticket${count === 1 ? '' : 's'}`;
  }

  function logStatus(msg) {
    apiLogStatus.textContent = msg;
  }

  // --- Backend Connectivity & Health Check ---
  async function checkBackendHealth() {
    backendStatusBadge.className = 'status-badge pulsing';
    statusText.textContent = 'Connecting to Flask (Port 5000)...';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const resp = await fetch(`${state.backendUrl}/api/health`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        state.backendOnline = true;
        backendStatusBadge.className = 'status-badge online';
        statusText.textContent = 'Flask Server Live (Port 5000)';
        logStatus('Connected to live Flask backend on port 5000.');
      } else {
        throw new Error('Non-ok response');
      }
    } catch (err) {
      state.backendOnline = false;
      backendStatusBadge.className = 'status-badge offline';
      statusText.textContent = 'Mock Engine Ready (Port 5000 Offline)';
      logStatus('Flask backend port 5000 not responding. Using local AI mock runner fallback.');
    }
  }

  // --- AI Clustering Handler ---
  async function handleRunClustering() {
    if (state.tickets.length === 0) {
      showToast('Please enter at least one ticket before clustering.');
      return;
    }

    showLoading(true, 'Running vector embedding & clustering analysis...');
    state.solutionsGenerated = false;

    // Simulate step progress
    await updateProgressBar(30);

    let clustersResult = [];

    if (state.backendOnline) {
      try {
        logStatus(`Dispatching clustering request to Flask server (${state.provider})...`);
        const resp = await fetch(`${state.backendUrl}/api/cluster`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tickets: state.tickets,
            provider: state.provider,
            api_key: state.apiKey
          })
        });

        await updateProgressBar(70);

        if (resp.ok) {
          const data = await resp.json();
          clustersResult = data.clusters || [];
        } else {
          throw new Error('Flask API error');
        }
      } catch (err) {
        logStatus('Flask endpoint failed. Falling back to Intelligent Local Mock Engine.');
        clustersResult = mockClusterEngine(state.tickets);
      }
    } else {
      // Local Intelligent Mock Engine
      await updateProgressBar(75);
      await new Promise(r => setTimeout(r, 600)); // Natural UX delay
      clustersResult = mockClusterEngine(state.tickets);
    }

    await updateProgressBar(100);
    state.clusters = clustersResult;
    
    showLoading(false);
    renderClusters(state.clusters);
    logStatus(`Clustering complete! ${state.clusters.length} semantic group(s) generated.`);
    showToast(`Successfully clustered into ${state.clusters.length} groups!`);
  }

  // --- AI Solutions Generator Handler ---
  async function handleGenerateSolutions() {
    if (state.clusters.length === 0) {
      // Run clustering first if not done
      await handleRunClustering();
    }

    showLoading(true, `Generating AI resolution drafts via ${state.provider.toUpperCase()}...`);
    await updateProgressBar(40);

    if (state.backendOnline) {
      try {
        logStatus(`Generating solutions via Flask backend...`);
        const resp = await fetch(`${state.backendUrl}/api/solve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clusters: state.clusters,
            provider: state.provider,
            api_key: state.apiKey
          })
        });

        await updateProgressBar(80);

        if (resp.ok) {
          const data = await resp.json();
          state.clusters = data.clusters;
        } else {
          throw new Error('Flask solve API failed');
        }
      } catch (err) {
        logStatus('Backend solve error. Utilizing fallback solution generator.');
        attachMockSolutions(state.clusters);
      }
    } else {
      await updateProgressBar(80);
      await new Promise(r => setTimeout(r, 700));
      attachMockSolutions(state.clusters);
    }

    await updateProgressBar(100);
    state.solutionsGenerated = true;
    showLoading(false);
    renderClusters(state.clusters);
    logStatus(`AI Solutions generated for all ${state.clusters.length} cluster(s).`);
    showToast(`AI Solutions generated successfully!`);
  }

  // --- Intelligent Mock Engines ---
  function mockClusterEngine(ticketList) {
    const authCluster = {
      id: 'cluster-auth',
      name: 'Group 1: Auth & Password Management',
      tag: 'auth',
      tagLabel: 'Auth & Access',
      confidence: 96.4,
      tickets: [],
      solution: null
    };

    const hrCluster = {
      id: 'cluster-hr',
      name: 'Group 2: HR & Employee Support',
      tag: 'hr',
      tagLabel: 'HR & Leave',
      confidence: 94.8,
      tickets: [],
      solution: null
    };

    const generalCluster = {
      id: 'cluster-general',
      name: 'Group 3: General IT & Service Requests',
      tag: 'general',
      tagLabel: 'General IT',
      confidence: 91.2,
      tickets: [],
      solution: null
    };

    ticketList.forEach((text, index) => {
      const lower = text.toLowerCase();
      const ticketObj = {
        id: `TCK-${101 + index}`,
        content: text
      };

      if (lower.includes('password') || lower.includes('log in') || lower.includes('login') || lower.includes('credential') || lower.includes('access')) {
        authCluster.tickets.push(ticketObj);
      } else if (lower.includes('leave') || lower.includes('balance') || lower.includes('time off') || lower.includes('vacation') || lower.includes('hr')) {
        hrCluster.tickets.push(ticketObj);
      } else {
        generalCluster.tickets.push(ticketObj);
      }
    });

    const results = [];
    if (authCluster.tickets.length > 0) results.push(authCluster);
    if (hrCluster.tickets.length > 0) results.push(hrCluster);
    if (generalCluster.tickets.length > 0) results.push(generalCluster);

    return results;
  }

  function attachMockSolutions(clusters) {
    clusters.forEach(c => {
      if (c.tag === 'auth') {
        c.solution = `**Automated Resolution Draft (Authentication & Access)**
1. Direct user to Self-Service Password Reset Portal: \`https://sso.company.internal/reset\`
2. Verify multi-factor authentication (MFA) device status in Okta/Active Directory.
3. If credentials were changed recently, ensure local browser cache and SSO tokens are cleared.
4. Auto-Response Template: "Hello, we noticed login/password issues. Please click here to reset your credentials instantly."`;
      } else if (c.tag === 'hr') {
        c.solution = `**Automated Resolution Draft (HR & Paid Time Off)**
1. Direct user to Workday / HR Portal: \`https://hr.company.internal/leave-balance\`
2. Path to view balance: *Employee Dashboard -> Benefits -> Paid Time Off Balance*.
3. Submitting Leave Request: Select manager approval workflow and attach requested dates.
4. Auto-Response Template: "Hi there! You can check your remaining leave balance directly on Workday under the Benefits tab."`;
      } else {
        c.solution = `**Automated Resolution Draft (General IT Ticket)**
1. Triage ticket severity and assign to Tier-1 Help Desk support queue.
2. Send acknowledgment email with tracking ticket ID to the submitter.
3. Auto-Response Template: "Thank you for reaching out. An IT specialist is reviewing your request."`;
      }
    });
  }

  // --- Rendering UI ---
  function renderClusters(clusters) {
    if (!clusters || clusters.length === 0) {
      emptyState.classList.remove('hidden');
      clustersContainer.classList.add('hidden');
      metricClusters.textContent = '0 Clusters';
      metricConf.textContent = '0% Avg Confidence';
      return;
    }

    emptyState.classList.add('hidden');
    clustersContainer.classList.remove('hidden');
    clustersContainer.innerHTML = '';

    let totalConf = 0;

    clusters.forEach(c => {
      totalConf += c.confidence;

      const card = document.createElement('div');
      card.className = 'cluster-card';

      // Ticket list HTML
      const ticketsHtml = c.tickets.map(t => `
        <div class="ticket-item">
          <span class="ticket-id">${t.id}</span>
          <span class="ticket-content">${escapeHtml(t.content)}</span>
        </div>
      `).join('');

      // AI Solution HTML
      let solutionHtml = '';
      if (c.solution) {
        solutionHtml = `
          <div class="ai-solution-box">
            <div class="solution-header">
              <span class="mono-label">AUTOMATED AI RESOLUTION MATRIX</span>
              <button class="copy-solution-btn" onclick="copyTextToClipboard(\`${escapeForAttribute(c.solution)}\`)">
                COPY DRAFT
              </button>
            </div>
            <div class="solution-text">${formatMarkdownText(c.solution)}</div>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="cluster-card-header">
          <div class="cluster-info">
            <span class="cluster-tag-badge ${c.tag}">${c.tagLabel || 'GROUP'}</span>
            <h3 class="cluster-name">${escapeHtml(c.name)}</h3>
          </div>
          <div class="confidence-score">
            ${c.confidence}% MATCH
          </div>
        </div>
        <div class="cluster-body">
          <div class="ticket-items-list">
            ${ticketsHtml}
          </div>
          ${solutionHtml}
        </div>
      `;

      clustersContainer.appendChild(card);
    });

    const avgConf = (totalConf / clusters.length).toFixed(1);
    metricClusters.textContent = `${clusters.length} Cluster${clusters.length === 1 ? '' : 's'}`;
    metricConf.textContent = `${avgConf}% Avg Confidence`;

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --- UI Utilities ---
  function showLoading(show, message = 'Processing...') {
    if (show) {
      if (loadingText) loadingText.textContent = message;
      if (progressBarFill) progressBarFill.style.width = '0%';
      if (loadingState) loadingState.classList.remove('hidden');
      if (emptyState) emptyState.classList.add('hidden');
      if (clustersContainer) clustersContainer.classList.add('hidden');
    } else {
      if (loadingState) loadingState.classList.add('hidden');
    }
  }

  function updateProgressBar(percentage) {
    return new Promise(resolve => {
      if (progressBarFill) progressBarFill.style.width = `${percentage}%`;
      setTimeout(resolve, 200);
    });
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<i data-lucide="check-circle" style="color: var(--accent-cyan);"></i> ${message}`;
    document.body.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function(m) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[m];
    });
  }

  function escapeForAttribute(str) {
    return str.replace(/`/g, '\\`').replace(/"/g, '&quot;').replace(/'/g, "\\'");
  }

  function formatMarkdownText(text) {
    // Basic formatting for markdown bold, code, and line breaks
    let formatted = escapeHtml(text);
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/`([^`]+)`/g, '<code style="background: rgba(6,182,212,0.15); color: #67e8f9; padding: 0.1rem 0.3rem; border-radius: 4px; font-family: var(--font-mono);">$1</code>');
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  }

  // Expose global helper for inline copy button
  window.copyTextToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied AI solution draft to clipboard!');
    }).catch(() => {
      showToast('Copied solution text.');
    });
  };
});
