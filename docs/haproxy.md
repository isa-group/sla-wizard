# HAProxy

Rate limiting in HAProxy is based primarly in its stick tables functionality: the server stores information from a client, allowing it to track user activities and differentiate between clients. The requests can be categorizing by client IP, for example but also other keys such as headers or query parameters. SLA Wizard uses such keys instead of client addresses.

Different ACLs are used to validate the request:

1. Check apikey was provided and verify it is valid
2. Check the combination method+path of the request is valid (i.e is available in the API server)

If the request is valid it is forwarded to its right backend, where the stick-table directive will apply the rate limiting.

| API key location | Implementation                                                                                                                                                                                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header           | [hdr(apikey)](https://www.haproxy.com/documentation/hapee/latest/onepage/#7.3.6-hdr) .                                                                                                                                                                                            |
| Query            | [url_param(apikey)](https://www.haproxy.com/documentation/hapee/latest/onepage/#7.3.6-url_param) .                                                                                                                                                                                |
| URL              | The path of the request (which includes the apikey) is taken and with it a header is created in the request: `http-request add-header apikey %[url]`. Then, the checks are based on hdr(apikey). The backend's rewrite the path of the request to remove the APIkey from the url. |

To create a configuration file for an HAProxy proxy, use the argument `haproxy` of the `config` command, for example:

```bash
node src/index.js config haproxy --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-haproxy.cfg
```

## Custom Template

Refer to [`templates/haproxy.cfg`](../templates/haproxy.cfg). The placeholders are the strings that start and end with `%%`, SLA Wizard will replace these with actual configuration content when its run.

| Placeholder                  | Required                                           | Explanation (what it is replaced with)                                                                                                   |
| ---------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `%%PROXY_PORT_PH%%`          | Yes                                                | The port on which the proxy will be running, which defaults to 80 but can be set with the option `--proxyPort`                           |
| `%%GET_APIKEY_FROM_URL_PH%%` | Yes, if `--authLocation` is `url`                  | Creation of a header with the apikey from the URL using `http-request add-header apikey %[url]`.                                         |
| `%%APIKEY_CHECKS_PH%%`       | Yes                                                | Validation of the apikey based on ACLs.                                                                                                  |
| `%%REMOVE_API_FROM_URL_PH%%` | Yes, if `--authLocation` is `url`                  | Removal of the apikey from the URL using `http-request replace-path (.*)/(apikey1| apikey2 | ... | aikeyN) \1`.                          |
| `%%FRONTEND_PH%%`            | Yes                                                | Definition of the [frontend](https://www.haproxy.com/documentation/hapee/latest/onepage/#4).                                             |
| `%%DEFAULT_BACKEND_PH%%`     | Yes, if there are endpoints without rate limiting. | Definition of the default [backend](https://www.haproxy.com/documentation/hapee/latest/onepage/#4), for which there is no rate limiting. |
| `%%BACKENDS_PH%%`            | Yes                                                | Definition of the backends (one for each plan-path-method combination) with rate limiting.                                               |

## Fixed Time Window Rate Limiting

In addition to what has been explained here so far, which is the implemantation for sliding window rate limiting (i.e SLA's `rates`), in HAProxy it is possible to have also [fixed or static window](https://www.haproxy.com/blog/four-examples-of-haproxy-rate-limiting/#rate-limit-by-fixed-time-window) for rate limiting (i.e SLA's `quotas`).

However, an external service is required to reset the counter at the end of the period, rather than relying on HAProxy's `expire` which starts counting when receiving the clients first request. For example, if the SLA quotas indicate it is possible to do 2 POST to /pets per minute, the service will be in charge of reseting the counter to 0 after one clock minute is over. Having an external service does not scale well. Supose there are quotas for 5 different endpoints, then 5 different services would be needed. These could be simply cron jobs, but still, is an extra thing that SLA Wizard can't take care of.
