# ARCHANGEL London Host Bootstrap

Use `archangel-london-bootstrap.sh` only on a **fresh Ubuntu 24 OS-only** instance intended for the London ARCHANGEL host. The script establishes a system user, an observe-only local service, a hardened systemd unit, and an empty configuration template. It does not enroll nodes, create a public endpoint, open a firewall port, store secrets, or grant remote execution capability.

Run the reviewed file from the London host with:

```bash
sudo bash archangel-london-bootstrap.sh
```

The service binds only to `127.0.0.1:8080`. Its local health and capability report can be checked with:

```bash
curl --fail --silent http://127.0.0.1:8080/v1/capabilities
```

The next stage should be a separately reviewed, mutually authenticated signed-status ingestion component. It must remain distinct from any future intent execution path.
