# Kilo Auth Plugin for OpenCode

[![npm version](https://img.shields.io/npm/v/%40melodyoftears%2Fopencode-kilo-auth.svg)](https://www.npmjs.com/package/@melodyoftears/opencode-kilo-auth)
[![npm downloads](https://img.shields.io/npm/dw/%40melodyoftears%2Fopencode-kilo-auth.svg)](https://www.npmjs.com/package/@melodyoftears/opencode-kilo-auth)
[![GitHub stars](https://img.shields.io/github/stars/1579364808/opencode-kilo-auth)](https://github.com/1579364808/opencode-kilo-auth/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/1579364808/opencode-kilo-auth/blob/main/LICENSE)

Use Kilo Gateway in OpenCode without using a separate Kilo CLI fork.

> Disclaimer: This is an independent community plugin. It is not affiliated with, endorsed by, or sponsored by Kilo.ai or OpenCode.

## What is included

- Adds `kilo` as an OpenCode provider
- Supports OAuth device flow and API key login
- Auto-syncs models from Kilo at plugin load time
- Filters to free model IDs (`:free`) and applies a whitelist

## Installation

Add this plugin to `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["@melodyoftears/opencode-kilo-auth@latest"]
}
```

Restart OpenCode after updating config.

## Authentication

```bash
opencode auth login
```

Then choose `Other` and enter `kilo`.

## Links

- npm: https://www.npmjs.com/package/@melodyoftears/opencode-kilo-auth
- GitHub: https://github.com/1579364808/opencode-kilo-auth
- Kilo Gateway: https://kilo.ai

## License

MIT. See `LICENSE`.
