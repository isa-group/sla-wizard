### Traefik

| API key location  |  Implementation |
|-------------------|---|
| Header            |  . |
| Query             |  . |
| URL               |  . |

Unlike in the other three proxies supported by SLA Wizard, besides the main configuration file a dynamic configuration file is needed. This file is the one that SLA Wizard creates. To do that, use the argument `traefik` of the `config` command, for example:

```bash
node src/index.js config traefik --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-traefik.yaml
```

#### Custom Template

Refer to [`templates/traefik.yaml`](../templates/traefik.yaml). The template provided to SLA Wizard must follow that exact structure. 

