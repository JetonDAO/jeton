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

This repo has some additional tools setuped:

- [TurboRepo](https://turbo.build/) for running monorepo tasks
- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [Biome](https://biomejs.dev/) for code linting and formatting

## Getting Started

### Prerequisites

Make sure you have the correct versions of Node.js and npm installed:

- **Node.js**: v20.16 or later
- **npm**: v10.8 or later

You can use [NVM](https://github.com/nvm-sh/nvm) to install the required version of node and npm.

### Cloning the Repository

To get started, first clone the repository:

```shell
git clone https://github.com/JetonDAO/jeton.git
cd jeton
```

### Build

To build all apps and packages, run the following command:

```shell
cd jeton
npm run build
```

### Adding NPM Packages

🚫 Avoid Adding packages directly inside your package

To add a npm package `pkg` use the following command:

```shell
cd jeton
npm install --workspace=<YOUR PROJECT/WORKSPACE> [--save|--save-dev] pkg
```

For example:

```shell
cd jeton
npm install --workspace=apps/web --save-dev @cloudflare/next-on-pages
```

### Lint Project

To lint all apps and packages, run the following command:

```shell
cd jeton
npm run check
```

To run the linter and automatically fix problems run:

```shell
cd jeton
npm run fix
```

### Develop All

To develop all apps and packages, run the following command:

```shell
cd jeton
npm run dev
```

### Develop Web

To develop only the web app, run the following command:

```shell
cd jeton
npm run dev-web
```

### Remote Caching

Turborepo can use a technique known as [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup), then enter the following commands:

```shell
cd jeton
npx turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```shell
npx turbo link
```

### Recommended VSCode Plugins

- [Turborepo LSP](https://marketplace.visualstudio.com/items?itemName=Vercel.turbo-vsc)
- [Biome](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
