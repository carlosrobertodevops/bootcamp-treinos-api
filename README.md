# Bootcamp-treinos-api

## 1. INTRODUÇÃO

### 1.1. Aula 0: Setup do Projeto

### 1.1.1 Node 24

> Instalação do Node

```bash
nvm install 24
```

> usar o node 24 como padrão

```bash
nvm use 24
```

> Instalação do pnpm

```bash
npm install pnpm  -y
```

### 1.1.2. Typescript

> Dependências de Dev no Node (atentar para as verses)

```bash
pnpm add -D typescript@5.9.3 @types/node@24
```

```bash
pnpm add -D prettier@3.8.1 eslint@9.39.2
```

> Configurar o Typescript

```bash
npx tsc --init
```

- Apagar os comentários do tsconfig.json gerado pelo comando acima
- Deixar no padrão abaixo

```js
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "target": "es2024",
    "skipLibCheck": true,
    "strict": true,
    "allowJs": true,
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

- Servidor TSX com Hot relood

```bash
pnpm add -D tsx@4.21.0
```

- Padronizar com script '"dev": "tsx watch src/index.ts"', dentro do 'package.json'

```js
{
  "name": "bootcamp-treinos-api",
  "version": "1.0.0",
  "description": "",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "packageManager": "pnpm@10.30.0",
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@types/node": "24",
    "eslint": "9.39.2",
    "globals": "^17.4.0",
    "prettier": "3.8.1",
    "tsx": "4.21.0",
    "typescript": "5.9.3",
    "typescript-eslint": "^8.56.1"
  }
}
```

- testar com "pnpm run dev"

### 1.1.3. Criando os Commits

> Criação de Commits padronizados "Conventional Commits"

- fix: (corrigir erros)
- feat: (para feactures)
- chore: (grandes implementações)
- outros como build: , ci: , docs: , style: , refactor: , perf: , test: , entre outros

```bash
git add .
git commit -m "chore: add typescript and tsx setup "
```

> Observações ()

- Para evitar conflito de versões do NODE com sua equipe de Dev, coloque abaixo do objetvo "scrips:" do package.json

```js
"engine": {
    "node": "24"
},
```

- Criar um arquivo ".npmrc" na raiz do projeto para controlar erros de versões e coloque "engine-strict=true"

```js
engine-strict=true
```

### 1.1.4. Configurar os controles de códigos: ESLint e Prettier

> ESLint

- Usado para verificar sintaxe e problemas no código

```bash
pnpm create @eslint/config@1.11.0
```

- Respostas da Opções após o comando acima:
  - [x] Javascript
  - [x] Javacript modules (import/export)
  - [x] None of these
  - [x] yes
  - [x] Node
  - [x] Javascript
  - [x] Yes
  - [x] pnpm

- instalar no seu VS Code ou Cursor a extenção/plugin "ESLint"

- Ficará assim o arquivo "eslint.config.js":

```js
import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      semi: ['error', 'never'],
    },
  },

  tseslint.configs.recommended,
])
```

- eslint-plugin-simples-sort (dependência de dev)
  [link do ithub do eslint-plugin-simple-import-sort](https://github.com/lydell/eslint-plugin-simple-import-sort)

```bash
pnpm add -D eslint-plugin-simple-import-sort@12.1.1
```

- ajustes no eslint.config.js

```js
import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: globals.node,
    },
  },

  tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
])
```

> Criar o diretório e arquivo "/.vscode/setting.json"

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "always"
  }
}
```

> Git Commit

```bash
git add .
git commit -m "chore: add eslint and prettier setup"

```

> Prettier

- Faz todas as formatações em nosso código após salvar os mesmos: indentação e etc;
- Instalar no VS Code ou Cursor à extenção/plugin "Prettier - Code formatter"

> ESLint + Prettier (eslint config prettier)

- [Link Git do eslint config prettier](https://github.com/prettier/eslint-config-prettier)

```bash
pnpm add -D eslint-config-prettier@10.1.8
```

### 1.1.5. Frameworks Backend

#### 1.1.5.1. express

- mais lento
- desatualizado e com poucas feactures
- não opnativo

#### 1.1.5.2. fastify (padrão em nosso App)

- [Link do Fastify](https://www.fastify.io)

- mais moderno
- mais rápido
- pouco opnativo

> Instalação da versão 5.7.4 (usada no Bootcamp)

```bash
pnpm add fastify@5.7.4
```

#### 1.1.5.3. NEST

- muito opnativo
- muito complexo e com poucas feactures

## 2. DESENVOLVIMENTO

## 2.1 AULA 1

## AULA 2

## AULA 3

## III. CONCLUSÃO
