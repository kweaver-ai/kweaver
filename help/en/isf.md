# Info Security Fabric (ISF)

## Overview

The **Info Security Fabric** is the **cross-cutting security layer**: unified **identity**, **permissions**, **policies**, and **audit** across data access, model output, and tool invocation. In full installs it may integrate with OAuth2/OIDC stacks (e.g. Hydra) and business-domain services.

With **`--minimum` install**, many auth components are disabled for a simpler lab setup — APIs may not require tokens. For production, enable the full auth profile per [deploy/README.md](../../deploy/README.md).

**Related modules:** All subsystems that accept `Authorization` headers; [Decision Agent](decision-agent.md) and [VEGA Engine](vega.md) are primary consumers.

## Prerequisites

```bash
export KWEAVER_BASE="https://<access-address>"
export TOKEN="<bearer-token>"   # often unused when auth.enabled=false
```

---

## CLI

### Authentication — Login

```bash
# Basic login (opens browser for OAuth flow)
kweaver auth login https://<access-address>

# Skip TLS certificate verification (self-signed certs)
kweaver auth login https://<access-address> -k

# Save the connection with an alias for easy switching
kweaver auth login https://<access-address> --alias prod -k

# Login with no auth (for --minimum installs where auth is disabled)
kweaver auth login https://<access-address> --no-auth

# Login with username/password directly (non-interactive)
kweaver auth login https://<access-address> -u admin -p secretpass -k

# Login via Playwright browser automation (headless OAuth flow)
kweaver auth login https://<access-address> --playwright -k

# Custom OAuth redirect port (useful when default 8400 is taken)
kweaver auth login https://<access-address> --port 9090

# Custom OAuth redirect URI
kweaver auth login https://<access-address> --redirect-uri http://localhost:9090/callback
```

### Session Management

```bash
# List all saved server connections
kweaver auth list

# Switch to a different saved connection
kweaver auth use prod

# List users in the current server
kweaver auth users

# Switch to a different user on the current server
kweaver auth switch <user_id>

# Show the current authenticated identity
kweaver auth whoami

# Show connection status and token expiry
kweaver auth status

# Export the current token (for use in scripts or curl)
kweaver auth export
# Usage: export TOKEN=$(kweaver auth export)

# Logout from the current server
kweaver auth logout

# Delete a saved connection entirely
kweaver auth delete <alias>
```

### Multi-Account Workflow

```bash
# 1. Login to multiple environments
kweaver auth login https://dev.kweaver.example.com --alias dev -k
kweaver auth login https://staging.kweaver.example.com --alias staging -k
kweaver auth login https://prod.kweaver.example.com --alias prod -k -u admin -p secretpass

# 2. List all connections
kweaver auth list
# Output:
#   * dev     https://dev.kweaver.example.com     (active)
#     staging https://staging.kweaver.example.com
#     prod    https://prod.kweaver.example.com

# 3. Switch between environments
kweaver auth use staging
kweaver auth whoami
# → user: admin@staging.kweaver.example.com

kweaver auth use prod
kweaver auth status
# → server: https://prod.kweaver.example.com
# → user: admin
# → token expires: 2026-04-14T22:30:00Z

# 4. Export a token for scripting
export TOKEN=$(kweaver auth export)
curl -sk "https://prod.kweaver.example.com/api/agent-factory/v1/agents" \
  -H "Authorization: Bearer $TOKEN"

# 5. Cleanup
kweaver auth logout           # logout from active connection
kweaver auth delete staging   # remove a saved connection
```

### Configuration and Business Domain

```bash
# Show current configuration (server, user, business domain)
kweaver config show

# List available business domains
kweaver config list-bd

# Set the active business domain
kweaver config set-bd <bd_uuid>
```

### Business Domain Priority

Some resources are scoped to a business domain. If queries return empty results, verify you are in the correct domain:

```bash
# 1. Check current domain
kweaver config show
# → bd: bd_public (default)

# 2. List available domains
kweaver config list-bd
# →  bd_public    (default)
#    bd-sales     Sales Division
#    bd-finance   Finance Division

# 3. Switch to the correct domain
kweaver config set-bd bd-sales

# 4. Retry your query
kweaver bkn list
kweaver agent list
```

---

## Python SDK

```python
from kweaver_sdk import KWeaverClient

client = KWeaverClient(base_url="https://<access-address>")

# Login with username/password
client.auth.login(username="admin", password="secretpass")

# Check identity
whoami = client.auth.whoami()
print(whoami["user_id"], whoami["username"], whoami["roles"])

# Check status
status = client.auth.status()
print("token expires:", status["token_expires_at"])

# Export token for external use
token = client.auth.export_token()
print(token)

# List available business domains
domains = client.config.list_business_domains()
for bd in domains:
    print(bd["id"], bd["name"], bd["is_default"])

# Set business domain
client.config.set_business_domain("bd-sales")

# Show current config
config = client.config.show()
print("server:", config["server"])
print("user:", config["user"])
print("bd:", config["business_domain"])

# Logout
client.auth.logout()
```

---

## TypeScript SDK

```typescript
import { KWeaverClient } from '@kweaver-ai/kweaver-sdk';

const client = new KWeaverClient({ baseUrl: 'https://<access-address>' });

// Login
await client.auth.login({ username: 'admin', password: 'secretpass' });

// Check identity
const whoami = await client.auth.whoami();
console.log(whoami.userId, whoami.username, whoami.roles);

// Check status
const status = await client.auth.status();
console.log('token expires:', status.tokenExpiresAt);

// Export token
const token = await client.auth.exportToken();

// List business domains
const domains = await client.config.listBusinessDomains();
domains.forEach((bd) => console.log(bd.id, bd.name, bd.isDefault));

// Set business domain
await client.config.setBusinessDomain('bd-sales');

// Show config
const config = await client.config.show();
console.log('server:', config.server);
console.log('user:', config.user);
console.log('bd:', config.businessDomain);

// Logout
await client.auth.logout();
```

---

## curl

```bash
# Discover OpenID configuration
curl -sk "$KWEAVER_BASE/.well-known/openid-configuration"

# Get an access token via OAuth2 password grant
curl -sk -X POST "$KWEAVER_BASE/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=admin&password=secretpass&client_id=kweaver-cli&scope=openid"

# Get an access token via client credentials
curl -sk -X POST "$KWEAVER_BASE/oauth2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=<client_id>&client_secret=<client_secret>&scope=openid"

# Verify a token (introspection)
curl -sk -X POST "$KWEAVER_BASE/oauth2/introspect" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=$TOKEN"

# Get current user info
curl -sk "$KWEAVER_BASE/userinfo" \
  -H "Authorization: Bearer $TOKEN"

# Use the token to call a protected API
curl -sk "$KWEAVER_BASE/api/agent-factory/v1/agents" \
  -H "Authorization: Bearer $TOKEN"

# List business domains
curl -sk "$KWEAVER_BASE/api/bkn-backend/v1/business-domains" \
  -H "Authorization: Bearer $TOKEN"

# Set business domain header for scoped requests
curl -sk "$KWEAVER_BASE/api/agent-factory/v1/agents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Business-Domain: bd-sales"
```
