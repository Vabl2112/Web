import { generateTypes, schemaPath } from "./contract.mjs"

// pnpm api:gen: regenerates lib/api/schema.d.ts from the contract copy in contract/.
generateTypes({ projectDir: process.cwd(), output: schemaPath })
console.log(`api-gen: ${schemaPath} regenerated`)
