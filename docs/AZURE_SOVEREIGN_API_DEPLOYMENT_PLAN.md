# ARCHANGEL Sovereign API — Azure Deployment Plan

**Status:** Blocked before provisioning because the authenticated Azure tenant currently exposes no subscriptions.

## Verified Azure session

The Azure portal session is authenticated as `hello@nexinusrisystemsllc.com` in the default directory `hellonexinusrisystemsllc.onmicrosoft.com`. The Subscriptions blade reports **“Filtered (0 of 0)”** and **“None of the entries matched the given filter.”** No Azure resource was created or modified during this inspection.

The immediate prerequisite is therefore to make an active Azure subscription visible to this account, or to switch the portal to the directory containing the subscription and grant this identity sufficient rights. A subscription-level Contributor role is sufficient for most infrastructure provisioning; Key Vault secret operations additionally require an appropriate data-plane role such as Key Vault Secrets Officer, while role assignment creation requires Owner or User Access Administrator.

## Recommended production topology

| Layer | Azure resource | Initial posture | Reason |
|---|---|---|---|
| Public edge and application host | Ubuntu 24.04 Generation 2 Linux VM with Trusted Launch, static public IP, NSG, and Caddy | 4 vCPU / 16 GiB RAM class, managed OS disk | Matches the existing Docker Compose package, provides OS-level control, fixed IP, and straightforward TLS termination. The API remains bound to localhost behind Caddy. |
| Database | Azure Database for PostgreSQL Flexible Server | General Purpose, private access through a delegated subnet, TLS required, automated backups | Removes PostgreSQL from the VM while retaining managed backups, patching, private networking, and optional zone-redundant high availability. |
| Rate limiting | Azure Managed Redis, private endpoint | Small production-capable tier initially | Removes Redis state from the VM and preserves the API’s Redis-backed request-window limiter. |
| Secrets | Azure Key Vault | Standard tier with Azure RBAC, soft delete, purge protection | Stores `DATABASE_URL`, `REDIS_URL`, `API_KEY_CHECKSUM_SECRET`, `ENABLE_PUBLIC_REGISTRATION`, `TRUSTED_PROXY_CIDRS`, and the one-time IWA-Sage API key. |
| Monitoring | Azure Monitor / Log Analytics | Diagnostic logs and availability alert | Captures service and platform health without storing API credentials or request bodies. |
| DNS/TLS | Existing ARCHANGEL API hostname in the user’s DNS provider, Caddy on the VM | DNS A/AAAA record to the static IP; ports 80/443 only | Caddy obtains and renews the public certificate. The FastAPI process is never directly exposed. |

The application VM should use a managed identity to read only the required Key Vault secrets. PostgreSQL and Redis should not have public network access. The NSG should allow HTTPS from the Internet, SSH only from explicitly trusted administrative source addresses, and no direct access to API port 8081, PostgreSQL, or Redis.

## Viable implementation choices

| Approach | Tradeoffs | Cost | Setup complexity |
|---|---|---|---|
| **Recommended: Ubuntu VM + managed PostgreSQL + managed Redis + Key Vault + Caddy** | Best fit for the existing Compose package and fixed-IP/TLS requirements. Separates stateful services from the application host and keeps rollback straightforward. Requires VM patching and Docker lifecycle management. | Moderate; VM, managed database, managed Redis, storage, IP, and monitoring are billed separately. | Medium |
| Lighter initial deployment: one Ubuntu VM running API, PostgreSQL, Redis, and Caddy in Docker Compose | Fastest and closest to the repository’s current topology. Lowest initial service count, but the database and Redis share the VM’s failure domain and require local backup/restore discipline. | Lowest initial Azure service count; exact cost depends on region and SKUs. | Low |
| Managed application hosting: containerized FastAPI on Azure App Service or Container Apps, with managed PostgreSQL, Redis, Key Vault, and an Azure-managed ingress | Less host maintenance and easier managed deployment, but requires adapting the current Caddy/Compose assumptions and validating forwarded-header behavior, health probes, and private networking. | Moderate to high; more managed components and ingress costs. | High |

The recommended choice is the first option for a production service. The lighter VM-only option is acceptable only as a temporary staging or controlled first release, not as the long-term sovereign production posture.

## Deployment sequence after subscription access is restored

1. Create a resource group and VNet with separate application, PostgreSQL, and private-endpoint subnets in one Azure region. London/UK South is the natural first candidate only if the subscription supports it and latency/cost policy agrees; the final region should be confirmed from the subscription’s available regions and quota.
2. Provision the Ubuntu VM with Trusted Launch, static public IP, NSG, managed identity, automatic security updates, and restricted SSH.
3. Provision PostgreSQL Flexible Server with private access, a dedicated database/user, TLS enforcement, backups, and the database name used by the API.
4. Provision Azure Managed Redis with private networking and TLS.
5. Create Key Vault with soft delete and purge protection. Grant the VM identity `Key Vault Secrets User` and the deployment identity the minimum secret-management roles required.
6. Generate production-only random values for the database password and `API_KEY_CHECKSUM_SECRET`; store them directly in Key Vault. Do not place them in Git, chat, shell history, or a committed `.env` file.
7. Deploy the existing `sovereign-api/` package to the VM. Configure the service with `SOVEREIGN_API_DATABASE_URL`, `SOVEREIGN_API_REDIS_URL`, `ENABLE_PUBLIC_REGISTRATION=true` for the controlled onboarding window, `API_KEY_CHECKSUM_SECRET`, and the reviewed `TRUSTED_PROXY_CIDRS` containing only the Caddy/ingress peer range.
8. Run `alembic upgrade head` against the production PostgreSQL server before starting the API.
9. Configure Caddy for the approved API hostname, proxying to `127.0.0.1:8081`. Keep port 8081 closed externally.
10. Verify `GET /v1/health` using the newly issued credential, then issue the real IWA-Sage scoped credential through `POST /v1/sovereign-keys/register`. Store the returned plaintext credential immediately in Key Vault; it is only returned once.
11. Verify `/v1/status` and `/v1/audit` with the real credential. Confirm that the audit record contains the observed source IP and that forwarded metadata is accepted only from the configured trusted proxy range.
12. Disable public registration after the IWA-Sage onboarding window unless another reviewed onboarding is explicitly required. The service must remain `integration_state=build-only` and `execution_state=paused`; no application or node is directly connected by this deployment.

## Required verification evidence

The final deployment report should include the public HTTPS endpoint, timestamped command output for health/status/audit checks, migration success, TLS certificate validation, the Key Vault secret names (not secret values), and the observed source IP from the audit response. It must not include the plaintext API key, database password, Redis credential, private key, or full authorization header.

## Current conclusion

Azure is a technically suitable destination for the Sovereign API, but deployment cannot start from the current session because there is no visible Azure subscription. The next action is account-side: make an active subscription visible in the current directory or switch to the correct directory, then grant the authenticated identity the required subscription/resource and Key Vault permissions. Once that is true, the existing API repository can be deployed without fabricating keys or connecting IWA Sage, KEIRA, Root-Gate, or any other application.

## References

- [Azure Linux virtual machines](https://learn.microsoft.com/en-us/azure/virtual-machines/linux/overview)
- [Azure Database for PostgreSQL Flexible Server](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/overview)
- [Azure Managed Redis](https://learn.microsoft.com/en-us/azure/redis/overview)
- [Azure Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/general/overview)
- [ARCHANGEL Sovereign API configuration](../sovereign-api/CONFIGURATION.md)
- [ARCHANGEL Sovereign API deployment package](../sovereign-api/README.md)
