import { onRequest as __api_director_generate_ts_onRequest } from "/Users/hamza/Desktop/m31/apps/web/functions/api/director/generate.ts"
import { onRequest as __api_proxy___catchall___ts_onRequest } from "/Users/hamza/Desktop/m31/apps/web/functions/api/proxy/[[catchall]].ts"

export const routes = [
    {
      routePath: "/api/director/generate",
      mountPath: "/api/director",
      method: "",
      middlewares: [],
      modules: [__api_director_generate_ts_onRequest],
    },
  {
      routePath: "/api/proxy/:catchall*",
      mountPath: "/api/proxy",
      method: "",
      middlewares: [],
      modules: [__api_proxy___catchall___ts_onRequest],
    },
  ]