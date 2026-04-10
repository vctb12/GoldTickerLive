/**
 * Audit Log System
 * Immutable logging for all admin actions
 */

const fs = require('fs');
const path = require('path');

const AUDIT_LOG_FILE = path.join(__dirname, '../data/audit-logs.json');

// Ensure data directory exists
const dataDir = path.dirname(AUDIT_LOG_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize audit logs file if not exists
function initAuditLog() {
    if (!fs.existsSync(AUDIT_LOG_FILE)) {
        fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify([], null, 2));
    }
}

// Read all audit logs
function getAuditLogs() {
    initAuditLog();
    try {
        const data = fs.readFileSync(AUDIT_LOG_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading audit logs:', err);
        return [];
    }
}

// Write audit log entry
function addAuditLog(entry) {
    initAuditLog();
    try {
        const logs = getAuditLogs();
        logs.push({
            id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            ...entry
        });
        fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(logs, null, 2));
        return logs[logs.length - 1];
    } catch (err) {
        console.error('Error writing audit log:', err);
        return null;
    }
}

// Log an action
function logAction(actor, action, entityType, entityId, changes = {}, metadata = {}) {
    return addAuditLog({
        actor,
        action,
        entityType,
        entityId,
        changes,
        metadata,
        ipAddress: metadata.ip || null,
        userAgent: metadata.userAgent || null
    });
}

// Get logs with filters
function getFilteredLogs(options = {}) {
    let logs = getAuditLogs();
    
    if (options.action) {
        logs = logs.filter(log => log.action === options.action);
    }
    
    if (options.entityType) {
        logs = logs.filter(log => log.entityType === options.entityType);
    }
    
    if (options.actor) {
        logs = logs.filter(log => log.actor === options.actor);
    }
    
    if (options.startDate) {
        logs = logs.filter(log => new Date(log.timestamp) >= new Date(options.startDate));
    }
    
    if (options.endDate) {
        logs = logs.filter(log => new Date(log.timestamp) <= new Date(options.endDate));
    }
    
    // Sort by timestamp descending
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Pagination
    const page = options.page || 1;
    const limit = options.limit || 50;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
        logs: logs.slice(start, end),
        total: logs.length,
        page,
        limit,
        totalPages: Math.ceil(logs.length / limit)
    };
}

// Export logs to CSV
function exportToCSV() {
    const logs = getAuditLogs();
    const headers = ['Timestamp', 'Actor', 'Action', 'Entity Type', 'Entity ID', 'Changes'];
    const rows = logs.map(log => [
        log.timestamp,
        log.actor,
        log.action,
        log.entityType,
        log.entityId,
        JSON.stringify(log.changes).replace(/"/g, "'")
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Clear old logs (optional maintenance)
function clearOldLogs(daysToKeep = 90) {
    const logs = getAuditLogs();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysToKeep);
    
    const filtered = logs.filter(log => new Date(log.timestamp) >= cutoff);
    
    if (filtered.length !== logs.length) {
        fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(filtered, null, 2));
        return logs.length - filtered.length;
    }
    
    return 0;
}

module.exports = {
    logAction,
    getAuditLogs,
    getFilteredLogs,
    exportToCSV,
    clearOldLogs
};
