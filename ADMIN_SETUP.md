# Admin Panel Setup Guide

## Overview
The admin panel is now fully functional with real backend API integration. It provides secure authentication, CRUD operations for shops, audit logging, and role-based access control.

## Quick Start

### 1. Start the Server
```bash
npm start
```
Server runs on `http://localhost:3000`

### 2. Access Admin Panel
Navigate to: `http://localhost:3000/admin`

### 3. Login Credentials
- **Email:** `admin@goldprices.com`
- **Password:** `admin123`

## Features

### Authentication
- JWT-based secure login
- Token expiry: 24 hours
- Automatic session validation
- Role-based access (Admin, Editor, Viewer)

### Shop Management
- View all shops with filtering (status, type, search)
- Add new shops
- Edit existing shops
- Verify/unverify shops
- Delete shops
- Confidence score auto-calculation
- Contact quality assessment

### Audit Logs
- View all system actions
- Filter by action type, entity, user
- Export to CSV
- Immutable log storage

### Dashboard
- Real-time statistics
- Recent activity feed
- System health indicators

## API Endpoints

### Authentication
- `POST /api/admin/auth/login` - Login
- `GET /api/admin/auth/verify` - Verify token

### Shops
- `GET /api/admin/shops` - List shops (with filters)
- `GET /api/admin/shops/:id` - Get single shop
- `POST /api/admin/shops` - Create shop
- `PUT /api/admin/shops/:id` - Update shop
- `DELETE /api/admin/shops/:id` - Delete shop
- `POST /api/admin/shops/batch-import` - Batch import

### Audit Logs
- `GET /api/admin/audit-logs` - List logs
- `GET /api/admin/audit-logs/export` - Export CSV

## Security

### Default Admin User
Created automatically on first start:
- Email: `admin@goldprices.com`
- Password: `admin123` (hashed with bcrypt)

### Environment Variables (Optional)
```bash
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
```

### Best Practices
1. Change default password immediately
2. Set strong JWT_SECRET in production
3. Use HTTPS in production
4. Regular audit log reviews

## Data Storage
- Shops: `/data/shops-data.json`
- Users: `/data/users.json`
- Audit Logs: `/data/audit-logs.json`

All data persists across server restarts.

## Troubleshooting

### Cannot Login
- Ensure server is running (`npm start`)
- Check browser console for errors
- Verify API endpoint accessibility

### Permission Denied
- Check user role in session
- Some actions require Admin or Editor role

### Data Not Persisting
- Check write permissions on `/data` directory
- Verify JSON files are valid

## Production Deployment

1. Set environment variables:
   ```bash
   export JWT_SECRET="strong-random-secret"
   export PORT=3000
   ```

2. Enable HTTPS (reverse proxy recommended)

3. Set up log rotation for audit logs

4. Regular backups of `/data` directory

5. Consider database migration for scale
