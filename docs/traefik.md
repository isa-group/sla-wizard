# Traefik

To check that a request is correct and to decide to which middlewares and services it should be sent, the following is used:

- Path(): to check the request's path
- Method(): to check the request's method

Besides that, additonal checks are needed depending on the location of the authentication key, as described in the table below.

Once the request is validated, rate limiting can be applied prior to forwarding it to the API server. Traefik [supports rate limiting](https://doc.traefik.io/traefik/middlewares/http/ratelimit/).

| API key location | Implementation                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header           | The apikey is validated using `HeadersRegexp()`. Rate limiting based on a header is nateively supported, done using [`sourceCriterion`s `requestHeaderName`](https://doc.traefik.io/traefik/middlewares/http/ratelimit/#sourcecriterionrequestheadername).                                                                                                                                                                                                                         |
| Query            | The apikey is validated using `Query()`. Rate limiting based on a query parameter is not nateively supported, so a header is created with the received query parameter using the middleware [`customRequestHeaders`](https://doc.traefik.io/traefik/middlewares/http/headers/#adding-and-removing-headers). Then, [`sourceCriterion`s `requestHeaderName`](https://doc.traefik.io/traefik/middlewares/http/ratelimit/#sourcecriterionrequestheadername) is used for rate limiting. |
| URL              | Similar to the query case but in addition, the middleware `[replacePathRegex](https://doc.traefik.io/traefik/middlewares/http/replacepathregex/)` is used to remove the apikey from the URL.                                                                                                                                                                                                                                                                                       |

Unlike in the other three proxies supported by SLA Wizard, besides the main configuration file a dynamic configuration file is needed. This file is the one that SLA Wizard creates. To do that, use the argument `traefik` of the `config` command, for example:

```bash
node src/index.js config traefik --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-traefik.yaml
```

## Custom Template

Refer to [`templates/traefik.yaml`](../templates/traefik.yaml). The template provided to SLA Wizard must follow that exact structure. Note `sla-wizard` adds the rate limiting relateed configuration under `routers:` and `middlewares:`.