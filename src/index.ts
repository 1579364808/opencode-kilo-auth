import type { Hooks, PluginInput, Plugin as PluginInstance } from "@opencode-ai/plugin"
import { authenticateWithDeviceAuthTUI } from "./auth.js"
import { KILO_API_BASE, KILO_OPENROUTER_BASE } from "./constants.js"
import { fetchKiloModels } from "./models.js"

function isLikelyFreeModel(modelID: string, model: any): boolean {
  return modelID.includes(":free")
}

function pickLikelyFreeModels(models: Record<string, any>): Record<string, any> {
  const entries = Object.entries(models).filter(([modelID, model]) => isLikelyFreeModel(modelID, model))
  return Object.fromEntries(entries)
}

function stripReasoningPartsFromMessages(messages: any[]): any[] {
  return messages.map((message) => {
    const parts = Array.isArray(message?.parts) ? message.parts : []
    return {
      ...message,
      parts: parts.filter((part: any) => part?.type !== "reasoning"),
    }
  })
}

const KiloGatewayPlugin: PluginInstance = async (input: PluginInput): Promise<Hooks> => {
  return {
    config: async (config) => {
      const providers = config.provider ?? {}
      const existingProvider = providers.kilo ?? {}
      const existingModels = pickLikelyFreeModels(existingProvider.models ?? {})

      const baseURL =
        typeof existingProvider.options?.baseURL === "string" ? existingProvider.options.baseURL : undefined

      const fetchedModels = await fetchKiloModels({ baseURL })
      const fetchedFreeModels = pickLikelyFreeModels(fetchedModels)
      const hasFetchedModels = Object.keys(fetchedFreeModels).length > 0
      const finalModels = hasFetchedModels ? { ...fetchedFreeModels, ...existingModels } : existingModels
      const finalModelIDs = Object.keys(finalModels)

      providers.kilo = {
        ...existingProvider,
        name: existingProvider.name ?? "Kilo Gateway",
        models: finalModels,
        whitelist: finalModelIDs,
      }

      config.provider = providers

      if (hasFetchedModels) {
        console.log(`[opencode-kilo-auth] Synced ${Object.keys(fetchedFreeModels).length} free models from Kilo`)
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
            result.headers = {
              ...baseOptions.headers,
              "X-KILO-ORGANIZATIONID": maybeAccountId,
            }
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
    "experimental.chat.messages.transform": async (_input, output) => {
      output.messages = stripReasoningPartsFromMessages(output.messages)
    },
  }
}

export default KiloGatewayPlugin
