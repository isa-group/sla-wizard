# SLA Wizard

## How it works

![SLA Wizard workflow](img/workflow.png)

1. The user provides to SLA Wizard an OpenAPI Specification v3 and one or more SLAs agreement. 
2. SLA Wizard generates a proxy configuration file which includes the rate limiting indicated in the SLA(s). 
3. The obtained configuration is provided to the proxy server when launching it. The proxy can be one of: Envoy, HAProxy, Nginx or Traefik.
4. The API requests will be rate-limited according to the proxy configuratin file, which matches what the API SLA(s) indicate. 

## Usage

Once the tool is published in npm, it will be possible to install it using `npm install sla-wizard` but until then, to get the tool clone the repository and install dependencies:

```bash
git clone https://github.com/isa-group/sla-wizard
cd sla-wizard
npm install
```

Displayed below is the output of the `-h` option of SLA Wizard CLI:

```bash
$ node src/index.js -h
Usage: sla-wizard <arguments> <options>

Options:
  -h, --help                display help for command

Commands:
  config [options] <proxy>
  runTest [options]         Run test with APIPecker.
  help [command]            display help for command
```

### Commands

SLA Wizard includes currently two commands:

| Command  |  Explanation |
|---|---|
| `config`  |  Takes an SLA document and generates a proxy configuration file which includes rate limiting as specified on the provided SLA. |
| `runTest` |  Performs validation testing of the rate limiting defined on a proxy by an SLA Wizard-generated configuration file. |

To control log levels define the environment variable `LOGGER_LEVEL` prior to the run. The possible values are `error`, `warn`, `custom`, `info` and `debug`.

### Options

The following table describes all the options that SLA Wizard includes for its commands:

| Option/Argument  |  Command | Required  |  Explanation |
|---|---|---|---|
| `proxy` | `config` | Yes | Proxy for which the configuration should be generated. (choices: "nginx", "haproxy", "traefik", "envoy") |
| `-o`, `--outFile <configFile>` | `config` | Yes | Config output file. |
| `--sla <slaPath>` | `config` & `runTest`| No | One of: 1) single SLA, 2) folder containing SLAs, 3) URL returning an array of SLA objects (default: "./specs/sla.yaml"). Note in the case of `runTest` the URL option is not supported. |
| `--oas <pathToOAS>` | `config` & `runTest` | No | Path to an OAS v3 file. (default: "./specs/oas.yaml") |
| `--customTemplate <customTemplate>` | `config` | No | Custom proxy configuration template. |
| `--authLocation <authLocation>` | `config` | No | Where to look for the authentication parameter. (default: "header") |
| `--authName <authName>` | `config` | No | Name of the authentication parameter, such as "token" or "apikey". (default: "apikey") |
| `--specs <testSpecs>` | `runTest` | Yes | Path to a test config file. |
      

## Considerations

### SLA types

SLA Wizard only works with SLAs of type `agreement`. It validates the provided SLAs with the [SLA4OAI-Specification JSON schema](https://github.com/isa-group/SLA4OAI-Specification/blob/main/schemas/1.0.0-Draft.schema.json).
If any of the provided SLAs is not valid (does not conform to schema or is not of type agreement), the execution will stop. Additionally, duplicated SLAs will be ignored.

### API server reference in OAS

The API server must be indicated on the OAS document. While it is possible to specify multiple servers in the OAS' `servers` section, SLA Wizard will consider only the first one.
For instance, in the following example only `http://server1:8080` is considered:

```yaml
openapi: 3.0.0
servers:
  - url: 'http://server1:8080'
  - url: 'http://server2:8080'
  - url: 'http://server3:8080'
  ...
```

### SLA reference

Both SLA Wizard functionalities provided by the commands `config` and `runTest` require an SLA document. While it is possible to reference the SLA directly in the OAS document (`info.x-sla.$ref`), the tool will not consider it. Instead, please use the commands' `--sla` option to indicate where the SLA document(s) can be found. This option can take a path to a single file, a folder containing multiple files or even a URL (note GET to the URL must receive an array, even if there's only one SLA).

### API Authentication 

APIs support different authentication methods. When authenticating with an API key, generally, it is possible to provide it in different places of the request: 

1. As a header
2. As a query parameter
3. As part of the URL

All the proxies supported by SLA Wizard allow using API keys on these three locations. When creating a proxy configuration file, the option `--authLocation` of SLA Wizard's `config` command should be used to set this, it can take the values `header`, `query` and `url`. In any case, the usage of the option is not compulsory, its default value is `header`. 

SLA Wizard will need to know the set of possible API keys to be used on the API, the SLA must then include the property `context.apikeys`, containing a list of API keys valid for authentication of API calls. 

## Creating proxy configurations

SLA Wizard can create configuration files from scratch for four different proxy technologies: Envoy, HAProxy, Nginx and Traefik. Also, it can modify an already existing configuration file, to add the SLA logic. 

For more information on how to use the tool for each of the four proxies, refer to their specific docs:

- [Envoy](docs/envoy.md)
- [HAProxy](docs/haproxy.md)
- [Nginx](docs/nginx.md)
- [Traefik](docs/traefik.md)


## License

Copyright 2022, [ISA Group](http://www.isa.us.es), [University of Sevilla](http://www.us.es)

[![ISA Group](http://www.isa.us.es/2.0/assets/img/theme/logo2.png)](http://www.isa.us.es)

Licensed under the **Apache License, Version 2.0** (the "[License](./LICENSE)"); you may not use this file except in compliance with the License. You may obtain a copy of the License at apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.