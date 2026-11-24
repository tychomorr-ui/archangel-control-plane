> **Historical planning record — superseded for active deployment.** This document contains earlier provider or placement assumptions. The current canonical deployment is UpCloud; use `docs/ARCHANGEL_UPCLOUD_CANONICALIZATION.md` and the active source declarations for present operations. Historical text is retained unchanged for auditability.

# ARCHANGEL Host and Project Reclaim Baseline

## Current Working Decisions

ARCHANGEL is a **logical center** and a dedicated **London (`eu-west-2`) control-plane host**. It should not be installed as a WordPress, LAMP, CMS, ecommerce, OpenClaw, or preconfigured Node.js appliance. The recommended Lightsail image is **Ubuntu 24, OS only**.

Project Reclaim is a separate **Oregon (`us-west-2`) field-program node** serving the initial Lake and Mendocino County work. It remains separate from Root-Gate despite sharing a Region: it must have its own instance, keypair, credentials, ingress rules, audit identity, and bounded permissions. Regional co-location supports local field operations; it does not grant Project Reclaim sovereign identity or control-plane authority.

| Component | Region | Host baseline | Purpose |
|---|---|---|---|
| Root-Gate | Oregon (`us-west-2`) | Existing instance | Sovereign identity anchor |
| Project Reclaim | Oregon (`us-west-2`) | Separate field-program host | Physical–digital bridge for Lake and Mendocino County programs |
| ARCHANGEL | London (`eu-west-2`) | Ubuntu 24 OS-only Lightsail instance | Signed status, intent, approval, receipt, and audit coordination |

## Why Ubuntu 24 OS Only

Ubuntu 24 maintains consistency with the existing Ubuntu fleet and provides an intentionally minimal baseline for a purpose-built control-plane service. AWS states that Lightsail instances created from the Ubuntu 24 blueprint have IMDSv2 enforced by default. The image should be configured only with the components the approved ARCHANGEL service requires, rather than inheriting a CMS, database, admin panel, agent framework, or web-store stack that introduces unnecessary software and administrative surface area. [1]

Amazon Linux 2023 is a viable alternative when an AWS-native operating model is desired, but the project has no stated need to diverge from its existing Ubuntu operations. Windows is unsuitable without a Windows-only workload. Debian, AlmaLinux, CentOS Stream, openSUSE, and FreeBSD are technically viable but do not offer a demonstrated advantage for this host.

AWS does not patch operating systems or application software on existing Lightsail instances after creation. The chosen image is therefore only the baseline; ongoing update management remains an operational responsibility. [2]

## Excluded Preconfigured Images

| Image category | Exclusion reason |
|---|---|
| WordPress, WordPress Multisite, Joomla, Drupal, Ghost | Content-management systems, not control-plane services |
| LAMP, MEAN, Magento, Django, Node.js blueprint | Preinstalls a broader runtime/database surface than the control plane requires |
| OpenClaw | A continuously running agent appliance; it should not be conflated with ARCHANGEL’s bounded approval and audit role |
| Windows | Adds a distinct platform and licensing/administration model without a Windows-only dependency |

## References

[1] [AWS Lightsail instance blueprint offerings](https://docs.aws.amazon.com/lightsail/latest/userguide/compare-options-choose-lightsail-instance-image.html)

[2] [AWS Lightsail update management](https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-update-management.html)
