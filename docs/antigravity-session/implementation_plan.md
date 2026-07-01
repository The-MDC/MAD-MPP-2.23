# Domain Management & Deployment Plan

You've requested to manage and use a custom domain for MAD Gambit. To properly configure DNS and point a domain to our application, we need to finalize where the application will be hosted and who the domain registrar is. 

## Open Questions

> [!WARNING]
> Please answer the following before we proceed:
> 1. **What is the exact domain name** you want to use? (e.g., `madgambit.com`, `play.madgambit.io`)
> 2. **Where is this domain currently registered?** (e.g., GoDaddy, Namecheap, Google Domains, Cloudflare, Route53)
> 3. **Where are we deploying the frontend?** Since this is a Next.js app, Vercel is the easiest and most native choice for managing custom domains, but we can also use AWS, GCP Cloud Run, or Firebase Hosting.
> 4. Do you have access to the registrar's DNS settings, or do you want me to write a Terraform/Pulumi script to manage the DNS records programmatically?

## Proposed Changes

Once you provide the domain details, the implementation will generally follow these steps:

### 1. Platform Deployment
- Deploy the Next.js frontend to a hosting provider (e.g., Vercel).
- Deploy the FastAPI backend to a scalable container service (e.g., GCP Cloud Run).

### 2. DNS Configuration
- Generate the necessary `A`, `CNAME`, and `TXT` records from the hosting provider.
- If using Vercel, I will provide you with the exact Vercel Nameservers to configure in your domain registrar, or the specific DNS records to add.

### 3. Environment Variable Updates
- Update the backend's CORS settings to allow traffic from the new custom domain.
- Update the frontend's `.env` files to point `fetch()` calls to the production backend URL instead of `localhost`.
- Update any OAuth redirect URIs (if configuring real social auth providers) to match the new domain.

## Verification Plan

### Automated Tests
- Run `curl -I https://yourdomain.com` to verify SSL/TLS certificates and successful 200 OK responses.

### Manual Verification
- Access the domain in a browser to confirm the frontend loads successfully and that API calls to the backend succeed without CORS errors.
