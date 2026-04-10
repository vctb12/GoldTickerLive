/**
 * Admin Dashboard JavaScript
 * Handles authentication, CRUD operations, and UI management
 * Connects to real backend API
 */

// Configuration
const ADMIN_CONFIG = {
    API_BASE: '/api/admin',
    STORAGE_KEY: 'gold_admin_session',
    DEFAULT_USER: {
        email: 'admin@goldprices.com',
        password: 'admin123',
        role: 'admin'
    }
};

// State
let currentUser = null;
let shopsData = [];
let citiesData = [];
let guidesData = [];
let auditLogs = [];
let authToken = null;

// API Helper
async function apiRequest(endpoint, options = {}) {
    const url = `${ADMIN_CONFIG.API_BASE}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (err) {
        console.error(`API Error (${endpoint}):`, err);
        throw err;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// Authentication Functions
async function checkAuth() {
    const session = localStorage.getItem(ADMIN_CONFIG.STORAGE_KEY);
    if (session) {
        try {
            const data = JSON.parse(session);
            authToken = data.token;
            currentUser = data.user;
            
            // Verify token is still valid
            try {
                const result = await apiRequest('/auth/verify');
                showDashboard();
            } catch (err) {
                // Token expired or invalid
                localStorage.removeItem(ADMIN_CONFIG.STORAGE_KEY);
                authToken = null;
                currentUser = null;
                showLogin();
            }
        } catch (e) {
            localStorage.removeItem(ADMIN_CONFIG.STORAGE_KEY);
            showLogin();
        }
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    document.getElementById('user-name').textContent = currentUser?.name || 'Admin';
    document.getElementById('user-role').textContent = currentUser?.role || 'Administrator';
    loadDashboardData();
}

async function login(email, password) {
    try {
        const response = await fetch(`${ADMIN_CONFIG.API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }
        
        authToken = data.token;
        currentUser = data.user;
        
        localStorage.setItem(ADMIN_CONFIG.STORAGE_KEY, JSON.stringify({
            token: authToken,
            user: currentUser
        }));
        
        showDashboard();
        return true;
    } catch (err) {
        throw err;
    }
}

function logout() {
    localStorage.removeItem(ADMIN_CONFIG.STORAGE_KEY);
    authToken = null;
    currentUser = null;
    showLogin();
}

// Event Listeners Setup
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;
            const errorDiv = document.getElementById('login-error');
            
            try {
                await login(email, password);
                errorDiv.style.display = 'none';
            } catch (err) {
                errorDiv.textContent = err.message;
                errorDiv.style.display = 'block';
            }
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            switchSection(section);
        });
    });
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
    
    // Modal close
    const modalClose = document.getElementById('modal-close');
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalClose && modalOverlay) {
        modalClose.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
        });
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.style.display = 'none';
            }
        });
    }
    
    // Add buttons
    document.getElementById('add-shop-btn')?.addEventListener('click', () => openShopModal());
    document.getElementById('add-city-btn')?.addEventListener('click', () => openCityModal());
    document.getElementById('add-guide-btn')?.addEventListener('click', () => openGuideModal());
    
    // Search and filters
    document.getElementById('shop-search')?.addEventListener('input', filterShops);
    document.getElementById('shop-filter-status')?.addEventListener('change', filterShops);
    document.getElementById('shop-filter-type')?.addEventListener('change', filterShops);
    
    // Threshold sliders
    document.getElementById('threshold-high')?.addEventListener('input', (e) => {
        document.getElementById('threshold-high-val').textContent = e.target.value;
    });
    document.getElementById('threshold-medium')?.addEventListener('input', (e) => {
        document.getElementById('threshold-medium-val').textContent = e.target.value;
    });
}

// Section Switching
function switchSection(section) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.section === section);
    });
    
    // Update sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.toggle('active', sec.id === `section-${section}`);
    });
    
    // Load data for section
    switch(section) {
        case 'shops':
            renderShops();
            break;
        case 'cities':
            renderCities();
            break;
        case 'content':
            renderContent();
            break;
        case 'audit':
            renderAuditLogs();
            break;
        case 'overview':
            loadDashboardData();
            break;
    }
}

// Tab Switching
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `content-panel-${tab}`);
    });
}

// Data Loading
async function loadDashboardData() {
    try {
        // Load shops
        const savedShops = localStorage.getItem('gold_shops');
        shopsData = savedShops ? JSON.parse(savedShops) : [];
        
        // Load cities
        const savedCities = localStorage.getItem('gold_cities');
        citiesData = savedCities ? JSON.parse(savedCities) : [];
        
        // Load guides
        const savedGuides = localStorage.getItem('gold_guides');
        guidesData = savedGuides ? JSON.parse(savedGuides) : [];
        
        // Load audit logs
        const savedLogs = localStorage.getItem('gold_audit_logs');
        auditLogs = savedLogs ? JSON.parse(savedLogs) : [];
        
        // Update stats
        document.getElementById('stat-shops').textContent = shopsData.length;
        document.getElementById('stat-verified').textContent = shopsData.filter(s => s.verified).length;
        document.getElementById('stat-cities').textContent = citiesData.length;
        document.getElementById('stat-guides').textContent = guidesData.length;
        document.getElementById('stat-alerts').textContent = '0'; // Could load from alerts
        document.getElementById('stat-audit').textContent = auditLogs.length;
        
        // Update badge
        document.getElementById('shops-badge').textContent = shopsData.length;
        
        // Recent activity
        renderRecentActivity();
        
    } catch (err) {
        console.error('Error loading dashboard data:', err);
    }
}

// Render Functions
function renderRecentActivity() {
    const container = document.getElementById('recent-logs');
    if (!container) return;
    
    const recent = auditLogs.slice(-5).reverse();
    container.innerHTML = recent.map(log => `
        <div class="activity-item">
            <span class="activity-icon">${getActionIcon(log.action)}</span>
            <div class="activity-details">
                <div class="activity-action">${log.action.toUpperCase()}</div>
                <div class="activity-entity">${log.entityType}: ${log.entityId}</div>
            </div>
            <span class="activity-time">${formatTime(log.timestamp)}</span>
        </div>
    `).join('');
}

function getActionIcon(action) {
    const icons = {
        create: '➕',
        update: '✏️',
        delete: '🗑️',
        login: '🔐',
        logout: '🚪'
    };
    return icons[action] || '📝';
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
}

// Shops Management
function renderShops() {
    const container = document.getElementById('shops-list');
    if (!container) return;
    
    const filtered = getFilteredShops();
    
    container.innerHTML = filtered.map(shop => `
        <div class="data-card">
            <div class="data-card-header">
                <h3 class="data-card-title">${escapeHtml(shop.name)}</h3>
                <span class="data-card-status status-${shop.verified ? 'verified' : 'unverified'}">
                    ${shop.verified ? '✅ Verified' : '⏳ Pending'}
                </span>
            </div>
            <div class="data-card-meta">
                <div class="meta-item">📍 ${escapeHtml(shop.city || 'Unknown')}</div>
                <div class="meta-item">🏷️ ${shop.type === 'direct' ? 'Direct Shop' : 'Market Area'}</div>
                <div class="meta-item">⭐ Confidence: ${shop.confidence || 0}%</div>
                ${shop.contactQuality ? `<div class="meta-item">📞 Contact: ${shop.contactQuality}</div>` : ''}
            </div>
            <div class="data-card-actions">
                <button class="btn-primary btn-sm" onclick="editShop('${shop.id}')">Edit</button>
                <button class="btn-secondary btn-sm" onclick="toggleVerification('${shop.id}')">
                    ${shop.verified ? 'Unverify' : 'Verify'}
                </button>
                <button class="btn-danger btn-sm" onclick="deleteShop('${shop.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function getFilteredShops() {
    const search = document.getElementById('shop-search')?.value.toLowerCase() || '';
    const status = document.getElementById('shop-filter-status')?.value || 'all';
    const type = document.getElementById('shop-filter-type')?.value || 'all';
    
    return shopsData.filter(shop => {
        const matchesSearch = !search || 
            shop.name.toLowerCase().includes(search) ||
            (shop.city && shop.city.toLowerCase().includes(search));
        
        const matchesStatus = status === 'all' ||
            (status === 'verified' && shop.verified) ||
            (status === 'pending' && !shop.verified) ||
            (status === 'unverified' && !shop.verified);
        
        const matchesType = type === 'all' || shop.type === type;
        
        return matchesSearch && matchesStatus && matchesType;
    });
}

function filterShops() {
    renderShops();
}

function openShopModal(shopId = null) {
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const content = document.getElementById('modal-content');
    
    const shop = shopId ? shopsData.find(s => s.id === shopId) : null;
    
    title.textContent = shop ? 'Edit Shop' : 'Add New Shop';
    
    content.innerHTML = `
        <form id="shop-form" onsubmit="saveShop(event, '${shopId || ''}')">
            <div class="form-group">
                <label for="shop-name">Shop Name *</label>
                <input type="text" id="shop-name" required value="${escapeHtml(shop?.name || '')}">
            </div>
            <div class="form-group">
                <label for="shop-city">City</label>
                <input type="text" id="shop-city" value="${escapeHtml(shop?.city || '')}">
            </div>
            <div class="form-group">
                <label for="shop-type">Type</label>
                <select id="shop-type">
                    <option value="direct" ${shop?.type === 'direct' ? 'selected' : ''}>Direct Shop</option>
                    <option value="market" ${shop?.type === 'market' ? 'selected' : ''}>Market Area</option>
                </select>
            </div>
            <div class="form-group">
                <label for="shop-verified">Verified</label>
                <input type="checkbox" id="shop-verified" ${shop?.verified ? 'checked' : ''}>
            </div>
            <div class="form-group">
                <label for="shop-confidence">Confidence Score (0-100)</label>
                <input type="number" id="shop-confidence" min="0" max="100" value="${shop?.confidence || 50}">
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="submit" class="btn-primary">Save</button>
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    
    modal.style.display = 'flex';
}

function saveShop(event, shopId) {
    event.preventDefault();
    
    const name = document.getElementById('shop-name').value;
    const city = document.getElementById('shop-city').value;
    const type = document.getElementById('shop-type').value;
    const verified = document.getElementById('shop-verified').checked;
    const confidence = parseInt(document.getElementById('shop-confidence').value) || 50;
    
    if (shopId) {
        // Update existing
        const index = shopsData.findIndex(s => s.id === shopId);
        if (index !== -1) {
            shopsData[index] = { ...shopsData[index], name, city, type, verified, confidence };
            logAudit('update', 'shop', shopId, { name, city, type, verified, confidence });
        }
    } else {
        // Create new
        const newShop = {
            id: 'shop_' + Date.now(),
            name,
            city,
            type,
            verified,
            confidence,
            contactQuality: 'medium'
        };
        shopsData.push(newShop);
        logAudit('create', 'shop', newShop.id, newShop);
    }
    
    // Save to localStorage
    localStorage.setItem('gold_shops', JSON.stringify(shopsData));
    
    closeModal();
    renderShops();
    loadDashboardData();
}

function editShop(shopId) {
    openShopModal(shopId);
}

function toggleVerification(shopId) {
    const shop = shopsData.find(s => s.id === shopId);
    if (shop) {
        shop.verified = !shop.verified;
        localStorage.setItem('gold_shops', JSON.stringify(shopsData));
        logAudit('update', 'shop', shopId, { verified: shop.verified });
        renderShops();
        loadDashboardData();
    }
}

function deleteShop(shopId) {
    if (confirm('Are you sure you want to delete this shop?')) {
        shopsData = shopsData.filter(s => s.id !== shopId);
        localStorage.setItem('gold_shops', JSON.stringify(shopsData));
        logAudit('delete', 'shop', shopId, {});
        renderShops();
        loadDashboardData();
    }
}

// Cities Management
function renderCities() {
    const container = document.getElementById('cities-list');
    if (!container) return;
    
    container.innerHTML = citiesData.map(city => `
        <div class="data-card">
            <div class="data-card-header">
                <h3 class="data-card-title">${escapeHtml(city.name)}</h3>
                <span class="data-card-status status-verified">📍 ${city.country || 'Unknown'}</span>
            </div>
            <div class="data-card-meta">
                <div class="meta-item">🏪 ${city.shopCount || 0} Shops</div>
                ${city.marketAreas ? `<div class="meta-item">🏛️ ${city.marketAreas.length} Market Areas</div>` : ''}
            </div>
            <div class="data-card-actions">
                <button class="btn-primary btn-sm" onclick="editCity('${city.id}')">Edit</button>
                <button class="btn-danger btn-sm" onclick="deleteCity('${city.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function openCityModal(cityId = null) {
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const content = document.getElementById('modal-content');
    
    const city = cityId ? citiesData.find(c => c.id === cityId) : null;
    
    title.textContent = city ? 'Edit City' : 'Add New City';
    
    content.innerHTML = `
        <form id="city-form" onsubmit="saveCity(event, '${cityId || ''}')">
            <div class="form-group">
                <label for="city-name">City Name *</label>
                <input type="text" id="city-name" required value="${escapeHtml(city?.name || '')}">
            </div>
            <div class="form-group">
                <label for="city-country">Country</label>
                <input type="text" id="city-country" value="${escapeHtml(city?.country || '')}">
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="submit" class="btn-primary">Save</button>
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    
    modal.style.display = 'flex';
}

function saveCity(event, cityId) {
    event.preventDefault();
    
    const name = document.getElementById('city-name').value;
    const country = document.getElementById('city-country').value;
    
    if (cityId) {
        const index = citiesData.findIndex(c => c.id === cityId);
        if (index !== -1) {
            citiesData[index] = { ...citiesData[index], name, country };
            logAudit('update', 'city', cityId, { name, country });
        }
    } else {
        const newCity = {
            id: 'city_' + Date.now(),
            name,
            country,
            shopCount: 0
        };
        citiesData.push(newCity);
        logAudit('create', 'city', newCity.id, newCity);
    }
    
    localStorage.setItem('gold_cities', JSON.stringify(citiesData));
    closeModal();
    renderCities();
    loadDashboardData();
}

function editCity(cityId) {
    openCityModal(cityId);
}

function deleteCity(cityId) {
    if (confirm('Are you sure you want to delete this city?')) {
        citiesData = citiesData.filter(c => c.id !== cityId);
        localStorage.setItem('gold_cities', JSON.stringify(citiesData));
        logAudit('delete', 'city', cityId, {});
        renderCities();
        loadDashboardData();
    }
}

// Content Management
function renderContent() {
    renderGuides();
}

function renderGuides() {
    const container = document.getElementById('guides-list');
    if (!container) return;
    
    container.innerHTML = guidesData.map(guide => `
        <div class="data-card">
            <div class="data-card-header">
                <h3 class="data-card-title">${escapeHtml(guide.title)}</h3>
                <span class="data-card-status status-pending">${guide.status || 'Draft'}</span>
            </div>
            <div class="data-card-meta">
                <div class="meta-item">📅 Updated: ${formatTime(guide.updatedAt)}</div>
                <div class="meta-item">👤 Author: ${escapeHtml(guide.author || 'Unknown')}</div>
            </div>
            <div class="data-card-actions">
                <button class="btn-primary btn-sm" onclick="editGuide('${guide.id}')">Edit</button>
                <button class="btn-danger btn-sm" onclick="deleteGuide('${guide.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function openGuideModal(guideId = null) {
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-title');
    const content = document.getElementById('modal-content');
    
    const guide = guideId ? guidesData.find(g => g.id === guideId) : null;
    
    title.textContent = guide ? 'Edit Guide' : 'Add New Guide';
    
    content.innerHTML = `
        <form id="guide-form" onsubmit="saveGuide(event, '${guideId || ''}')">
            <div class="form-group">
                <label for="guide-title">Title *</label>
                <input type="text" id="guide-title" required value="${escapeHtml(guide?.title || '')}">
            </div>
            <div class="form-group">
                <label for="guide-author">Author</label>
                <input type="text" id="guide-author" value="${escapeHtml(guide?.author || '')}">
            </div>
            <div class="form-group">
                <label for="guide-content">Content</label>
                <textarea id="guide-content" rows="6" style="width: 100%; padding: 10px; border: 2px solid var(--admin-border); border-radius: 8px;">${escapeHtml(guide?.content || '')}</textarea>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button type="submit" class="btn-primary">Save</button>
                <button type="button" class="btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    
    modal.style.display = 'flex';
}

function saveGuide(event, guideId) {
    event.preventDefault();
    
    const title = document.getElementById('guide-title').value;
    const author = document.getElementById('guide-author').value;
    const content = document.getElementById('guide-content').value;
    
    if (guideId) {
        const index = guidesData.findIndex(g => g.id === guideId);
        if (index !== -1) {
            guidesData[index] = { 
                ...guidesData[index], 
                title, 
                author, 
                content,
                updatedAt: Date.now()
            };
            logAudit('update', 'guide', guideId, { title, author });
        }
    } else {
        const newGuide = {
            id: 'guide_' + Date.now(),
            title,
            author,
            content,
            status: 'draft',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        guidesData.push(newGuide);
        logAudit('create', 'guide', newGuide.id, newGuide);
    }
    
    localStorage.setItem('gold_guides', JSON.stringify(guidesData));
    closeModal();
    renderGuides();
    loadDashboardData();
}

function editGuide(guideId) {
    openGuideModal(guideId);
}

function deleteGuide(guideId) {
    if (confirm('Are you sure you want to delete this guide?')) {
        guidesData = guidesData.filter(g => g.id !== guideId);
        localStorage.setItem('gold_guides', JSON.stringify(guidesData));
        logAudit('delete', 'guide', guideId, {});
        renderGuides();
        loadDashboardData();
    }
}

// Audit Logs
function renderAuditLogs() {
    const container = document.getElementById('audit-tbody');
    if (!container) return;
    
    const filtered = getFilteredAuditLogs();
    
    container.innerHTML = filtered.map(log => `
        <tr>
            <td>${new Date(log.timestamp).toLocaleString()}</td>
            <td>${escapeHtml(log.user)}</td>
            <td><span class="data-card-status status-${log.action === 'delete' ? 'unverified' : 'verified'}">${log.action}</span></td>
            <td>${log.entityType}</td>
            <td>${escapeHtml(JSON.stringify(log.changes || {}))}</td>
        </tr>
    `).join('');
}

function getFilteredAuditLogs() {
    const search = document.getElementById('audit-search')?.value.toLowerCase() || '';
    const action = document.getElementById('audit-filter-action')?.value || 'all';
    const entity = document.getElementById('audit-filter-entity')?.value || 'all';
    
    return auditLogs.filter(log => {
        const matchesSearch = !search || 
            log.user.toLowerCase().includes(search) ||
            log.entityId.toLowerCase().includes(search);
        
        const matchesAction = action === 'all' || log.action === action;
        const matchesEntity = entity === 'all' || log.entityType === entity;
        
        return matchesSearch && matchesAction && matchesEntity;
    }).reverse();
}

// Audit Logging
async function logAudit(action, entityType, entityId, changes) {
    const log = {
        id: 'log_' + Date.now(),
        timestamp: Date.now(),
        user: currentUser?.email || 'unknown',
        action,
        entityType,
        entityId,
        changes
    };
    
    auditLogs.push(log);
    
    // Keep only last 1000 logs
    if (auditLogs.length > 1000) {
        auditLogs = auditLogs.slice(-1000);
    }
    
    localStorage.setItem('gold_audit_logs', JSON.stringify(auditLogs));
}

// Utilities
function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export functions for global access
window.editShop = editShop;
window.saveShop = saveShop;
window.toggleVerification = toggleVerification;
window.deleteShop = deleteShop;
window.editCity = editCity;
window.saveCity = saveCity;
window.deleteCity = deleteCity;
window.editGuide = editGuide;
window.saveGuide = saveGuide;
window.deleteGuide = deleteGuide;
window.closeModal = closeModal;
