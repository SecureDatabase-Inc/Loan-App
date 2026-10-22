# Security

## Measures
- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with configurable expiry
- HTTP-only cookies for token storage
- Rate limiting on auth endpoints
- CORS configured for specific origins
- Input validation with Zod
- SQL injection prevention via Prisma (parameterized queries)
- Identity-document uploads: magic-byte validation, 5 MB cap, one file per request, per-user rate limiting
- Identity documents stored with private (authenticated) delivery; admins receive short-lived signed URLs only
- Server-side storage configuration validation with fail-fast startup
- Atomic verification writes with compensating asset cleanup and an append-only review audit trail
- Admin routes separated with dedicated middleware

## Best Practices
- Use strong JWT_SECRET (32+ chars)
- Enable HTTPS in production
- Keep dependencies updated
- Monitor failed login attempts
- Regular database backups
- Keep `CLOUDINARY_API_SECRET` server-only; never use `NEXT_PUBLIC_*` for credentials
