### NGINX

| API key location  |  Implementation |
|-------------------|---|
| Header            |  . |
| Query             |  . |
| URL               |  . |

To create a configuration file for a NGINX proxy, use the argument `nginx` of the `config` command, for example:

```bash
node src/index.js config nginx --oas tests/specs/simple_api_oas.yaml --sla tests/specs/slas/ --outFile tests/proxy-configuration-nginx.conf
```

#### Custom Template

Refer to [`templates/nginx.conf`](../templates/nginx.conf). The placeholders are the strings that start and end with `%%`, SLA Wizard will replace these with actual configuration content when its run. 

| Placeholder  | Required |  Implementation |
|-------------------|---|---|
| `%%LIMIT_REQ_ZONE_PH%%` | | | 
| `%%MAP_APIKEYS_PH%%` | | | 
| `%%PROXY_PORT_PH%%` | | | 
| `%%GET_APIKEY_FROM_URL_PH%%` | | | 
| `%%AUTH_LOCATION_PH%%` | | | 
| `%%URI_ORIGINAL_SAVE_PH%%` | | | 
| `%%URI_REWRITES_PH%%` | | | 
| `%%LOCATIONS_PH%%` | | | 