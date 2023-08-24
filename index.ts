const configPath = process.env.CONFIG_PATH || "./config.json";
const port = process.env.PORT || 3000;

type Hook = {
  /// URL to fetch
  url: string;

  /// ID to re-serve this cached hook onto
  cacheId: string;

  /// Time in seconds between refetching cache
  refetchTime: number;
};

type Config = {
  hooks: Hook[];
};

const config: Config = await Bun.file(configPath).json();

const cacheMap = new Map<string, Blob>();

const cacheHook = async (hook: Hook) => {
  console.log(`Caching [${hook.cacheId}] from [${hook.url}]`);

  for (let tries = 0; tries < 3; tries++) {
    const response = await fetch(hook.url);
    if (response.ok) {
      cacheMap.set(hook.cacheId, await response.blob());
      return;
    }
  }

  console.log(`Failed to cache [${hook.cacheId}] from [${hook.url}]`);
};

const setupHooks = config.hooks.map(async (hook) => {
  await cacheHook(hook);
  setInterval(() => cacheHook(hook), hook.refetchTime * 1000);
});

await Promise.all(setupHooks);

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const hook = config.hooks.find(
      (hook) => url.pathname === `/${hook.cacheId}`
    );
    if (!hook)
      return new Response(
        `${url.pathname} not found in [${config.hooks
          .map((hook) => `/${hook.cacheId}`)
          .join(", ")}]`
      );

    return new Response(cacheMap.get(hook.cacheId));
  },
});

console.log(`Listening on localhost:${server.port}`);
