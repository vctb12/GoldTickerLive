class IntegrationEngine {
    constructor() {
        this.cache = new Map();
        this.providers = {
            primary: 'https://api.goldprice.org/v1',
            secondary: 'https://api.metals-api.com/v1'
        };
        this.rateLimiter = new Map();
        this.circuitBreaker = new Map();
    }

    async unifiedAPICall(endpoint, options = {}) {
        const cacheKey = `${endpoint}_${JSON.stringify(options)}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < cached.ttl) {
                return cached.data;
            }
        }

        try {
            // Rate limiting
            await this.enforceRateLimit(endpoint);
            
            // Circuit breaker check
            if (this.isCircuitOpen(endpoint)) {
                throw new Error('Service temporarily unavailable');
            }

            let response;
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                try {
                    response = await this.makeRequestWithFallback(endpoint, options);
                    break;
                } catch (error) {
                    attempts++;
                    if (attempts >= maxAttempts) throw error;
                    await this.delay(1000 * attempts); // Exponential backoff
                }
            }

            // Cache successful response
            this.cache.set(cacheKey, {
                data: response,
                timestamp: Date.now(),
                ttl: 300000 // 5 minutes
            });

            return response;
        } catch (error) {
            console.error('API call failed:', error);
            // Try stale fallback
            return this.getStaleData(cacheKey);
        }
    }

    async makeRequestWithFallback(endpoint, options) {
        try {
            const primaryResponse = await this.makeSingleRequest(
                `${this.providers.primary}${endpoint}`, 
                options
            );
            return this.normalizeResponse(primaryResponse);
        } catch (primaryError) {
            console.warn('Primary provider failed, trying secondary:', primaryError);
            try {
                const secondaryResponse = await this.makeSingleRequest(
                    `${this.providers.secondary}${endpoint}`, 
                    options
                );
                return this.normalizeResponse(secondaryResponse);
            } catch (secondaryError) {
                throw new Error(`Both providers failed: ${primaryError.message}, ${secondaryError.message}`);
            }
        }
    }

    async makeSingleRequest(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout exceeded');
            }
            throw error;
        }
    }

    normalizeResponse(data) {
        // Normalize different provider responses
        if (data.price) {
            return {
                timestamp: data.timestamp || Date.now(),
                price: data.price,
                currency: data.currency || 'USD',
                source: data.source || 'unknown'
            };
        }
        return data;
    }

    async enforceRateLimit(endpoint) {
        const key = `${endpoint}_${Date.now() - (Date.now() % 86400000)}`; // Daily window
        const count = this.rateLimiter.get(key) || 0;
        
        if (count > 999) { // 1000 requests per day limit
            throw new Error('Rate limit exceeded');
        }
        
        this.rateLimiter.set(key, count + 1);
    }

    isCircuitOpen(endpoint) {
        const breaker = this.circuitBreaker.get(endpoint);
        if (!breaker) return false;
        
        if (Date.now() - breaker.lastFailure < 60000) { // 1 minute cooldown
            return true;
        }
        
        // Reset after cooldown
        this.circuitBreaker.delete(endpoint);
        return false;
    }

    getStaleData(cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour stale
            console.warn('Using stale data due to provider failure');
            return cached.data;
        }
        return null;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
const integrationEngine = new IntegrationEngine();
