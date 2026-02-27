import type { Hooks, PluginInput, Plugin as PluginInstance } from "@opencode-ai/plugin"
import { authenticateWithDeviceAuthTUI } from "./auth.js"
import { KILO_API_BASE, KILO_OPENROUTER_BASE } from "./constants.js"
import { fetchKiloModels } from "./models.js"

const KiloGatewayPlugin: PluginInstance = async (input: PluginInput): Promise<Hooks> => {
  return {
    config: async (config) => {
      const providers = config.provider ?? {}
      const existingProvider = providers.kilo ?? {}
      const existingModels = existingProvider.models ?? {}

      const baseURL =
        typeof existingProvider.options?.baseURL === "string" ? existingProvider.options.baseURL : undefined

      const fetchedModels = await fetchKiloModels({ baseURL })
      const hasFetchedModels = Object.keys(fetchedModels).length > 0

      providers.kilo = {
        ...existingProvider,
        name: existingProvider.name ?? "Kilo Gateway",
        models: hasFetchedModels ? { ...fetchedModels, ...existingModels } : existingModels,
      }

      config.provider = providers

      if (hasFetchedModels) {
        console.log(`[opencode-kilo-auth] Synced ${Object.keys(fetchedModels).length} models from Kilo`)
      }
    },
    auth: {
      provider: "kilo",
      async loader(getAuth, providerInfo) {
        const auth = await getAuth()
        
        const baseOptions = {
          baseURL: KILO_OPENROUTER_BASE,
          headers: {
            "HTTP-Referer": "https://kilo.ai",
            "X-Title": "Kilo Gateway",
          },
        }

        if (!auth) {
          return baseOptions
        }

        if (auth.type === "api") {
          return {
            ...baseOptions,
            apiKey: auth.key,
          }
        }

        if (auth.type === "oauth") {
          const result: Record<string, any> = {
            ...baseOptions,
            apiKey: auth.access,
          }
          const maybeAccountId = (auth as any).accountId
          if (maybeAccountId) {
            result.baseURL = `${KILO_API_BASE}/api/organizations/${maybeAccountId}`
          }
          return result
        }

        return baseOptions
      },
      methods: [
        {
          type: "oauth",
          label: "Kilo Gateway (Device Authorization)",
          async authorize() {
            return await authenticateWithDeviceAuthTUI()
          },
        },
        {
          type: "api",
          label: "Kilo Gateway (API Key)",
          async authorize(inputs) {
            const key = inputs?.apiKey
            if (!key) {
              return { type: "failed" }
            }
            return {
              type: "success",
      provider: "kilo",
              key,
            }
          },
        },
      ],
    },
  }
}

export default KiloGatewayPlugin
