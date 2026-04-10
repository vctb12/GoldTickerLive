class SearchService {
    constructor() {
        this.index = {};
        this.documents = {};
    }

    async buildIndex(dataSources) {
        for (const [type, data] of Object.entries(dataSources)) {
            data.forEach(item => {
                const docId = `${type}-${item.id}`;
                this.documents[docId] = item;
                
                // Create searchable terms
                const terms = this.extractSearchTerms(item);
                terms.forEach(term => {
                    if (!this.index[term]) {
                        this.index[term] = [];
                    }
                    this.index[term].push(docId);
                });
            });
        }
    }

    extractSearchTerms(item) {
        const terms = new Set();
        
        // Extract from common fields
        ['name', 'title', 'description', 'location', 'country'].forEach(field => {
            if (item[field]) {
                const words = item[field].toLowerCase().split(/\W+/);
                words.forEach(word => {
                    if (word.length > 2) {
                        terms.add(word);
                    }
                });
            }
        });
        
        return Array.from(terms);
    }

    search(query) {
        const searchTerm = query.toLowerCase();
        const results = new Set();
        
        Object.keys(this.index).forEach(term => {
            if (term.includes(searchTerm)) {
                this.index[term].forEach(docId => results.add(docId));
            }
        });
        
        return Array.from(results).map(id => this.documents[id]);
    }
}
