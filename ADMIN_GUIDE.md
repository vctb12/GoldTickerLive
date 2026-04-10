# Admin Panel Access Guide

## How to Access the Admin Dashboard

### URL
Navigate to: `https://yourusername.github.io/Gold-Prices/admin.html`

Or from the main site, add `/admin.html` to your base URL.

### Default Login Credentials
- **Email:** `admin@goldprices.com`
- **Password:** `admin123`

⚠️ **IMPORTANT:** Change these default credentials immediately in production by modifying the `ADMIN_CONFIG.DEFAULT_USER` object in `admin.js`.

## Features

### 1. Dashboard Overview
- Real-time statistics for shops, cities, guides, and audit entries
- Recent activity feed showing latest admin actions
- Quick metrics for verified vs pending shops

### 2. Shop Management
- View all shops with filtering by status (verified/pending/unverified) and type (direct/market)
- Add new shops with name, city, type, verification status, and confidence score
- Edit existing shop details
- Toggle verification status with one click
- Delete shops with confirmation
- Search shops by name or city

### 3. Cities & Markets Management
- Add new cities with country association
- Edit city details
- Delete cities (with confirmation)
- View shop count per city

### 4. Content Management
- Manage buying guides and editorial content
- Create, edit, and delete guides
- Track author and update timestamps
- Tabbed interface for guides, flags, and FAQs

### 5. Trust & Confidence Settings
- Configure confidence score thresholds (high/medium/low)
- Visual sliders for threshold adjustment
- Trust badge management

### 6. Audit Logs
- Complete audit trail of all admin actions
- Filter by action type (create/update/delete/login)
- Filter by entity type (shop/city/guide/user)
- Search functionality
- Export to CSV capability
- Shows user, timestamp, action, entity, and changes

### 7. Settings
- User management (add/remove admin users)
- Cache management
- Data export functionality
- System reset options

## Technical Details

### Authentication
- Session-based authentication using localStorage
- JWT-ready architecture for backend integration
- Automatic session validation on page load
- Secure logout with audit logging

### Data Storage
- Currently uses localStorage for demo purposes
- Ready for backend API integration via `ADMIN_CONFIG.API_BASE`
- All CRUD operations logged to audit system

### Security Notes
1. Change default credentials before deploying to production
2. Implement server-side authentication for production use
3. Enable HTTPS for all admin traffic
4. Consider adding rate limiting for login attempts
5. Review audit logs regularly for suspicious activity

## Integration with Backend

To connect to a real backend API:

1. Update `ADMIN_CONFIG.API_BASE` in `admin.js` to point to your API endpoint
2. Modify the `login()` function to make real API calls
3. Update CRUD functions (`saveShop`, `saveCity`, etc.) to use fetch/Axios
4. Implement proper JWT token handling
5. Add refresh token logic for session persistence

Example API integration:
```javascript
async function login(email, password) {
    const response = await fetch(`${ADMIN_CONFIG.API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) throw new Error('Invalid credentials');
    
    const data = await response.json();
    currentUser = data.user;
    localStorage.setItem(ADMIN_CONFIG.STORAGE_KEY, JSON.stringify({
        ...data.user,
        token: data.token
    }));
    
    showDashboard();
}
```

## File Structure
```
/workspace/
├── admin.html          # Admin dashboard HTML
├── admin.css           # Admin-specific styles
├── admin.js            # Admin dashboard logic
└── dist/
    ├── admin.html      # Built admin page
    └── assets/
        ├── admin-*.js  # Bundled admin JS
        └── admin-*.css # Bundled admin CSS
```

## Troubleshooting

### Can't access admin page?
- Ensure you're using the correct URL with `/Gold-Prices/` base path
- Check browser console for 404 errors on assets
- Verify the build completed successfully

### Login not working?
- Clear browser localStorage and try again
- Check browser console for JavaScript errors
- Verify default credentials match `ADMIN_CONFIG.DEFAULT_USER`

### Changes not persisting?
- localStorage may be cleared by browser settings
- For production, implement backend database storage
- Check browser's storage limits

## Next Steps

1. **Immediate:** Change default admin password
2. **Short-term:** Implement backend API for data persistence
3. **Medium-term:** Add role-based permissions (Editor, Viewer roles)
4. **Long-term:** Add two-factor authentication and IP whitelisting
