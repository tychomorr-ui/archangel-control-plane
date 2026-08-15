# ARCHANGEL Terminal Mesh Runbook

## Purpose and Boundary

This runbook activates the private control mesh described in `ARCHANGEL_PRIVATE_MESH_AUTHORITATIVE_DESIGN.md`. It is designed for the existing Ubuntu 24 Lightsail fleet and is entirely terminal-driven. It establishes encrypted transport and read-only signed status; it does **not** enable remote execution, a public API, browser-held administrator keys, or automatic cross-node application access.

The private mesh is a hub-and-spoke control overlay. London hosts the hub at `10.42.0.1`; every declared node receives its own `/32` address and can initially reach only the hub through the tunnel.

## Before Running Any Command

The following conditions are mandatory. The public IP addresses used in Lightsail firewall rules must be current static addresses, not copied from historical notes. Administrative SSH must remain restricted to trusted operator sources. The London baseline must continue to pass `launch/verify-archangel-baseline.sh` before the mesh hub material is prepared.

| Node | Overlay address | Node-bootstrap command |
|---|---|---|
| Root-Gate | `10.42.0.11/32` | `sudo bash archangel-mesh-node-bootstrap.sh --node-id root-gate --node-role "sovereign-identity" --overlay-address 10.42.0.11/32` |
| Tesseract-Terminus | `10.42.0.12/32` | `sudo bash archangel-mesh-node-bootstrap.sh --node-id tesseract-terminus --node-role "provenance-and-attestation" --overlay-address 10.42.0.12/32` |
| XinUS-Clarity | `10.42.0.13/32` | `sudo bash archangel-mesh-node-bootstrap.sh --node-id xinus-clarity --node-role "flagship-application-layer" --overlay-address 10.42.0.13/32` |
| Kether-Gate | `10.42.0.14/32` | `sudo bash archangel-mesh-node-bootstrap.sh --node-id kether-gate --node-role "monarch-os" --overlay-address 10.42.0.14/32` |
| Tesseract-A | `10.42.0.15/32` | `sudo bash archangel-mesh-node-bootstrap.sh --node-id tesseract-a --node-role "recovery-and-mirror" --overlay-address 10.42.0.15/32` |
| KEIRA | `10.42.0.16/32` | `sudo bash archangel-mesh-node-bootstrap.sh --node-id keira --node-role "intelligence-analysis" --overlay-address 10.42.0.16/32` |
| Project Reclaim | `10.42.0.17/32` | `sudo bash archangel-mesh-node-bootstrap.sh --node-id project-reclaim --node-role "field-activation" --overlay-address 10.42.0.17/32` |

## Stage 1: Prepare London

Transfer `archangel-mesh-hub-bootstrap.sh` through the same verified administrative path used for the existing London bootstrap, verify its SHA-256 before use, and run it in the London terminal as root. The output file `/etc/archangel/mesh/hub-manifest.json` contains only public data and is the only hub identity artifact to distribute. The hub private key stays in `/etc/archangel/mesh/keys/` and is never copied.

The Lightsail console firewall change is manual and deliberate: add **one IPv4 custom UDP rule on port 51820** on the London instance, restricted to the current public IPv4 addresses of the seven declared spoke hosts. Mirror the restriction in the IPv6 firewall only if IPv6 peer endpoints will be used. Lightsail maintains independent IPv4 and IPv6 firewall policies, and public ingress rules do not govern private-IP traffic.[1]

## Stage 2: Prepare Every Node

Run the row-specific node-bootstrap command in the table on each node. Each invocation creates two node-owned private keys: a WireGuard key for encrypted transport and an Ed25519 key for receipt signing. It prints the location of a public enrollment manifest. Copy **only** that manifest from each node back through the administrative terminal channel.

The node bootstrap intentionally leaves both `wg-archangel` and `archangel-status-agent` disabled. This permits the full identity review before any node joins the transport mesh.

## Stage 3: Authorize and Configure

On **Root-Gate**, transfer and verify `archangel-root-authority-bootstrap.sh`, then run it once as root. This produces a Root-Gate admission signing identity and a safe-to-transfer public authority manifest. Its private key remains only on Root-Gate.

For each public node enrollment manifest collected in Stage 2, create a short-lived admission package on Root-Gate:

```bash
sudo python3 create-archangel-node-admission.py \
  --node-manifest /secure-transfer/tesseract-a-enrollment-manifest.json \
  --root-private-key /etc/archangel-root/keys/admission-ed25519.key.pem \
  --root-public-key /etc/archangel-root/keys/admission-ed25519.pub.pem \
  --output /secure-transfer/tesseract-a.admission.json
```

Transfer the signed admission package and the **Root-Gate public key** to the matching node. The matching node verifies the admission, compares it to its own local keys, and creates a signed proof of possession:

```bash
sudo python3 accept-archangel-node-admission.py \
  --admission /secure-transfer/tesseract-a.admission.json \
  --root-public-key /secure-transfer/root-admission-ed25519.pub.pem \
  --node-manifest /var/lib/archangel-node/enrollment-manifest.json \
  --node-status-private-key /etc/archangel-node/keys/status-ed25519.key.pem \
  --node-status-public-key /etc/archangel-node/keys/status-ed25519.pub.pem \
  --output /var/lib/archangel-node/admission-ack.json
```

Transfer the node acknowledgement, admission package, and Root-Gate public key to **London**. London verifies both signatures, records public material, and renders—but does not activate—the hub peer configuration:

```bash
sudo python3 install-archangel-node-admission.py \
  --admission /secure-transfer/tesseract-a.admission.json \
  --acknowledgement /secure-transfer/tesseract-a.admission-ack.json \
  --root-public-key /secure-transfer/root-admission-ed25519.pub.pem
```

Repeat this complete admission sequence for every declared node. The London registry will accumulate one public admission record and one public status key for each peer; it does not receive a node private key.

Do not create a public `/archangel/enroll` endpoint as a shortcut. The admission packages are deliberately transferred through existing administrative channels in the first rollout so enrollment does not become another exposed internet service.

## Stage 4: Activate Private Transport and Read-Only Status

After London has a reviewed hub configuration, activate it explicitly from the London terminal:

```bash
sudo bash activate-archangel-mesh-hub.sh --activate
```

On each node, copy the safe hub manifest, its signed admission package, and the Root-Gate public key. Render the node peer configuration first without starting it:

```bash
sudo bash activate-archangel-node-peer.sh \
  --hub-manifest /secure-transfer/hub-manifest.json \
  --hub-endpoint "<LONDON_STATIC_PUBLIC_IP>:51820" \
  --admission /secure-transfer/tesseract-a.admission.json \
  --root-public-key /secure-transfer/root-admission-ed25519.pub.pem
```

Inspect `/etc/wireguard/wg-archangel.conf`. It must contain exactly one peer, **ARCHANGEL London**, with `AllowedIPs = 10.42.0.1/32`; it must not contain a default route or another spoke address. Once reviewed, run the same command again with `--activate`. This starts the private WireGuard peer and the read-only signed-status agent.

## Stage 5: Verify a Node Receipt

Once a node has an assigned private tunnel address and its public Ed25519 PEM has been registered on London, verify its receipt from London with:

```bash
sudo python3 verify-archangel-signed-receipt.py \
  --url http://10.42.0.15:8787/v1/status \
  --public-key /etc/archangel/mesh/registry/tesseract-a-status-ed25519.pub.pem \
  --node-id tesseract-a
```

A successful command proves the node’s private receipt is fresh and verifies against the supplied public key. It does not prove every application on the host is healthy, nor does it create command authority.

## References

[1]: https://docs.aws.amazon.com/lightsail/latest/userguide/understanding-firewall-and-port-mappings-in-amazon-lightsail.html "AWS Lightsail: Control instance traffic with firewalls"
