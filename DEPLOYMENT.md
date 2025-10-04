# Deployment Guide

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up Cloudflare resources**
   ```bash
   npm run setup
   ```

3. **Update configuration**
   - Update `wrangler.json` with the database ID from step 2
   - Verify R2 bucket name matches your setup

4. **Deploy**
   ```bash
   npm run deploy
   ```

## Detailed Setup

### 1. Cloudflare D1 Database

```bash
# Create database
wrangler d1 create ducklytics-db

# Apply schema
wrangler d1 execute ducklytics-db --file=./schema.sql

# Test connection
wrangler d1 execute ducklytics-db --command="SELECT COUNT(*) FROM participants"
```

### 2. Cloudflare R2 Storage

```bash
# Create bucket
wrangler r2 bucket create event-check-in-storage

# Verify bucket exists
wrangler r2 bucket list
```

### 3. Update Configuration

Update `wrangler.json` with your actual database ID:

```json
{
  "d1_databases": [
    {
      "binding": "DUCKLYTICS_PROD",
      "database_name": "ducklytics-db",
      "database_id": "YOUR_ACTUAL_DATABASE_ID"
    }
  ]
}
```

### 4. Deploy Application

```bash
# Build and deploy
npm run deploy

# Verify deployment
wrangler tail
```

## Testing

### Local Development

```bash
# Start dev server
npm run dev

# Test API endpoints
curl http://localhost:8788/api/stats
```

### Production Testing

1. Visit your deployed worker URL
2. Test search functionality
3. Test photo capture (requires HTTPS)
4. Test signature capture
5. Complete a full check-in process

## Monitoring

### Cloudflare Dashboard

- **Workers**: Monitor function invocations and errors
- **D1**: Check database queries and performance
- **R2**: Monitor storage usage and requests

### Logs

```bash
# View real-time logs
wrangler tail

# View specific function logs
wrangler tail --format=pretty
```

## Troubleshooting

### Common Issues

1. **Database binding errors**
   - Verify database ID in wrangler.json
   - Check database exists in Cloudflare dashboard

2. **R2 storage errors**
   - Verify bucket name matches configuration
   - Check R2 bucket permissions

3. **Camera access issues**
   - Ensure HTTPS is enabled
   - Check browser permissions

4. **API endpoint errors**
   - Check worker logs with `wrangler tail`
   - Verify CORS headers are set correctly

### Debug Mode

Enable debug logging by adding to your worker:

```typescript
// In workers/app.ts
console.log('Debug info:', { url: request.url, method: request.method });
```

## Security Checklist

- [ ] HTTPS enabled
- [ ] Database access restricted
- [ ] R2 bucket permissions configured
- [ ] CORS headers properly set
- [ ] Input validation implemented
- [ ] Error handling in place

## Performance Optimization

- [ ] Database indexes created
- [ ] Image compression enabled
- [ ] CDN caching configured
- [ ] Worker memory limits monitored

## Backup Strategy

### Database Backup

```bash
# Export database
wrangler d1 export ducklytics-db --output=backup.sql
```

### R2 Storage Backup

- Use Cloudflare R2's built-in replication
- Set up automated backups if needed

## Scaling Considerations

- **Database**: D1 scales automatically
- **Storage**: R2 scales to petabyte scale
- **Workers**: Auto-scales based on demand
- **CDN**: Global edge caching included

## Support

For deployment issues:

1. Check Cloudflare dashboard for errors
2. Review worker logs
3. Test API endpoints individually
4. Contact Cloudflare support if needed
