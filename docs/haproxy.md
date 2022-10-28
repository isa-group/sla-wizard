### HAProxy

Rate limiting in HAProxy is based in its stick tables functionality: the server stores information from a client, allowing it to track user activities and differentiate between clients. The requests can be categorizing by client IP, for example but also other keys such as headers or query parameters. SLA Wizard uses such keys instead of client addresses. 

Different ACLs are used to validate the request: 1) check apikey was provided and is valid 2) check the combination method+path is valid

If the request is valid it is forwarded to its right backend, where the stick-table directive will apply the rate limiting.

| API key location  |  Implementation |
|-------------------|---|
| Header            | [hdr(apikey)](https://www.haproxy.com/documentation/hapee/latest/onepage/#7.3.6-hdr) . |
| Query             | [url_param(apikey)](https://www.haproxy.com/documentation/hapee/latest/onepage/#7.3.6-url_param) . |
| URL               | The path of the request (which includes the apikey) is taken and with it a header is created in the request: `http-request add-header apikey %[url]`. Then, the checks are based on hdr(apikey). The backend's rewrite the path of the request to remove the APIkey from the url. |

To create a configuration file for an HAProxy proxy, use the argument `haproxy` of the `config` command, for example:

```bash
node src/index.js config haproxy --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-haproxy.cfg
```

#### Custom Template

Refer to [`templates/haproxy.cfg`](../templates/haproxy.cfg). The placeholders are the strings that start and end with `%%`, SLA Wizard will replace these with actual configuration content when its run. 

| Placeholder  | Required |  Implementation |
|-------------------|---|---|
| `%%PROXY_PORT_PH%%` |  |  | 
| `%%GET_APIKEY_FROM_URL_PH%%` |  |  | 
| `%%APIKEY_CHECKS_PH%%` |  |  | 
| `%%REMOVE_API_FROM_URL_PH%%` |  |  | 
| `%%FRONTEND_PH%%` |  |  | 
| `%%DEFAULT_BACKEND_PH%%` |  |  | 
| `%%BACKENDS_PH%%` |  |  | 
