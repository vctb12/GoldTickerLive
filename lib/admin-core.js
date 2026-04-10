class AdminCore {
    constructor() {
        this.data = {
            shops: [],
            alerts: [],
            portfolio: [],
            users: [],
            content: [],
            auditLog: []
        };
        this.loadFromStorage();
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem('goldPricesAdminData');
            if (stored) {
                this.data = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load admin data:', error);
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('goldPricesAdminData', JSON.stringify(this.data));
        } catch (error) {
            console.error('Failed to save admin data:', error);
        }
    }

    logAction(action, details) {
        this.data.auditLog.push({
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            action,
            details,
            userId: 'admin'
        });
        this.saveToStorage();
    }

    // CRUD Operations
    createShop(shopData) {
        const shop = {
            id: Date.now().toString(),
            ...shopData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            confidenceScore: 95 // Default high confidence
        };
        this.data.shops.push(shop);
        this.logAction('CREATE_SHOP', { shopId: shop.id, name: shop.name });
        this.saveToStorage();
        return shop;
    }

    updateShop(id, updates) {
        const index = this.data.shops.findIndex(s => s.id === id);
        if (index !== -1) {
            this.data.shops[index] = {
                ...this.data.shops[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.logAction('UPDATE_SHOP', { shopId: id, updates });
            this.saveToStorage();
            return this.data.shops[index];
        }
        throw new Error('Shop not found');
    }

    deleteShop(id) {
        const shop = this.data.shops.find(s => s.id === id);
        if (shop) {
            this.data.shops = this.data.shops.filter(s => s.id !== id);
            this.logAction('DELETE_SHOP', { shopId: id, name: shop.name });
            this.saveToStorage();
            return true;
        }
        return false;
    }

    getAllShops() {
        return this.data.shops.sort((a, b) => b.confidenceScore - a.confidenceScore);
    }

    // Portfolio Management
    addTransaction(transaction) {
        const tx = {
            id: Date.now().toString(),
            ...transaction,
            timestamp: new Date().toISOString(),
            status: 'completed'
        };
        this.data.portfolio.push(tx);
        this.logAction('ADD_TRANSACTION', { transactionId: tx.id, userId: tx.userId });
        this.saveToStorage();
        return tx;
    }

    // Alert Management
    createAlert(alert) {
        const alertObj = {
            id: Date.now().toString(),
            ...alert,
            createdAt: new Date().toISOString(),
            isActive: true
        };
        this.data.alerts.push(alertObj);
        this.saveToStorage();
        return alertObj;
    }

    getActiveAlerts() {
        return this.data.alerts.filter(a => a.isActive);
    }

    // Export functionality
    exportData() {
        return {
            shops: this.data.shops,
            alerts: this.data.alerts,
            portfolio: this.data.portfolio,
            auditLog: this.data.auditLog,
            exportTimestamp: new Date().toISOString()
        };
    }

    // Import functionality
    importData(data) {
        if (data.shops) this.data.shops = data.shops;
        if (data.alerts) this.data.alerts = data.alerts;
        if (data.portfolio) this.data.portfolio = data.portfolio;
        if (data.auditLog) this.data.auditLog = data.auditLog;
        this.saveToStorage();
    }
}

const adminCore = new AdminCore();
