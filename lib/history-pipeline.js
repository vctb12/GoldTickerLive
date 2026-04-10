class HistoryPipeline {
    constructor(integrationEngine) {
        this.integration = integrationEngine;
        this.localHistory = new Map();
    }

    async ingestHistoricalData(symbol, startDate, endDate) {
        try {
            // Fetch from external API
            const externalData = await this.integration.unifiedAPICall(`/history/${symbol}`, {
                params: { start: startDate, end: endDate }
            });

            // Merge with local data using precedence logic
            const mergedData = this.mergeHistoricalData(externalData, this.getLocalHistory(symbol));
            
            // Store merged result
            this.localHistory.set(symbol, mergedData);
            
            return mergedData;
        } catch (error) {
            console.error('Historical data ingestion failed:', error);
            return this.getLocalHistory(symbol);
        }
    }

    mergeHistoricalData(external, local) {
        const merged = new Map();
        
        // Add all external data (higher precedence)
        external.forEach(item => {
            merged.set(item.date, item);
        });
        
        // Add local data only if not present in external
        local.forEach(item => {
            if (!merged.has(item.date)) {
                merged.set(item.date, item);
            }
        });
        
        return Array.from(merged.values()).sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );
    }

    getLocalHistory(symbol) {
        return this.localHistory.get(symbol) || [];
    }
}
