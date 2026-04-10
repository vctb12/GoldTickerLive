class AnalyticsService {
    constructor() {
        this.events = [];
        this.sessionId = this.generateSessionId();
    }

    trackEvent(eventType, properties = {}) {
        const event = {
            id: Date.now().toString(),
            sessionId: this.sessionId,
            eventType,
            timestamp: new Date().toISOString(),
            properties: this.validateProperties(properties),
            userAgent: navigator.userAgent,
            pageUrl: window.location.href
        };
        
        this.events.push(event);
        
        // Send to analytics endpoint (if available)
        if (window.fetch) {
            fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            }).catch(() => {
                // Fallback: store locally if server unavailable
                this.storeEventLocally(event);
            });
        }
    }

    validateProperties(props) {
        const validated = {};
        for (const [key, value] of Object.entries(props)) {
            if (typeof value === 'string' && value.length <= 1000) {
                validated[key] = value;
            } else if (typeof value === 'number' && !isNaN(value)) {
                validated[key] = value;
            } else if (typeof value === 'boolean') {
                validated[key] = value;
            }
        }
        return validated;
    }

    generateSessionId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    storeEventLocally(event) {
        try {
            const events = JSON.parse(localStorage.getItem('analyticsEvents') || '[]');
            events.push(event);
            localStorage.setItem('analyticsEvents', JSON.stringify(events));
        } catch (error) {
            console.error('Failed to store event locally:', error);
        }
    }
}
