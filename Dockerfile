FROM oven/bun

COPY index.ts .

ENTRYPOINT [ "/usr/local/bin/bun", "run", "index.ts" ]
