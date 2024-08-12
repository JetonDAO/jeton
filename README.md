# jeton
Decentralized poker protocol enabling trustless, transparent, and community-governed gameplay – powered by JatonDAO.

## What's inside?
This Turborepo includes the following packages/apps:

### Apps and Packages
- `web`: a [Next.js](https://nextjs.org/) app
- `@jeton/ui`: a React component library shared by `web` application
- `@jeton/typescript-config`: `tsconfig.json`s used throughout the monorepo
Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities
This Turborepo has some additional tools already setup for you:
- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [Biome](https://biomejs.dev/) for code linting and formatting

### Build
To build all apps and packages, run the following command:

```
cd jeton
npm run build
```

### Develop Web
To develop all apps and packages, run the following command:

```
cd jeton
npm run dev-web
```

### Develop All
To develop all apps and packages, run the following command:

```
cd jeton
npm run dev
```

### Remote Caching
Turborepo can use a technique known as [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup), then enter the following commands:

```
cd jeton
npx turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
npx turbo link
```
