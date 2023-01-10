#!/usr/bin/env node
/* eslint-disable key-spacing */
/* eslint-disable no-case-declarations */
/* eslint-disable no-multi-spaces */

import path from 'path'
import fs from 'fs-extra'
import knex from 'knex'
import camelCase from 'camelcase'

// Cross platform clear console.
process.stdout.write(process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H')

const config = fs.readJSONSync(path.join(process.cwd(), 'mysql-typebox.json')) as Config
if (config.folder && config.folder !== '')
  fs.emptyDirSync(config.folder)

const isCamelCase      = config.camelCase && config.camelCase === true
const isNullish        = config.nullish && config.nullish === true
const isRequiredString = config.requiredString && config.requiredString === true
function nullable(type: string) {
  if (isNullish)
    return `Type.Optional(Type.Union([${type}, Type.Null()]))`
  else
    return `Type.Union([${type}, Type.Null()])`
}

function getType(descType: Desc['Type'], descNull: Desc['Null']) {
  const type   = descType.split('(')[0]
  const isNull = descNull === 'YES'
  switch (type) {
    case 'date':
    case 'datetime':
    case 'timestamp':
    case 'time':
    case 'year':
    case 'char':
    case 'varchar':
    case 'tinytext':
    case 'text':
    case 'mediumtext':
    case 'longtext':
    case 'json':
    case 'decimal':
      if (isNull)
        return nullable('Type.String()')
      else if (isRequiredString)
        return 'Type.String({ minLength: 1 })'
      else
        return 'Type.String()'
    case 'tinyint':
    case 'smallint':
    case 'mediumint':
    case 'int':
    case 'bigint':
    case 'float':
    case 'double':
      const unsigned = descType.endsWith(' unsigned')
      const numberType = unsigned ? 'Type.Number({ minimum: 0 })' : 'Type.Number()'
      if (isNull)
        return nullable(numberType)
      else
        return numberType
    case 'enum':
      const value = descType.replace('enum(', '').replace(')', '').replaceAll(',', ', ')
      return `Type.Unsafe<${value.replaceAll(', ', ' | ')}>({ type: 'string', enum: [${value}] })`
  }
}

async function generate(config: Config) {
  const db = knex({
    client: 'mysql2',
    connection: {
      host    : config.host,
      port    : config.port,
      user    : config.user,
      password: config.password,
      database: config.database,
    },
  })

  const t = await db.raw('SELECT table_name FROM information_schema.tables WHERE table_schema = ?', [config.database])
  let tables = t[0].map((row: any) => row.table_name).filter((table: string) => !table.startsWith('knex_')).sort() as Tables

  if (config.tables && config.tables.length)
    tables = tables.filter(table => config.tables.includes(table))

  if (config.ignore && config.ignore.length)
    tables = tables.filter(table => !config.ignore.includes(table))

  for (let table of tables) {
    const d = await db.raw(`DESC ${table}`)
    const describes = d[0] as Desc[]
    if (isCamelCase)
      table = camelCase(table)
    let content = `import { Type } from '@sinclair/typebox'
import type { Static } from '@sinclair/typebox'

export const ${table} = Type.Object({`
    for (const desc of describes) {
      const field = isCamelCase ? camelCase(desc.Field) : desc.Field
      const type = getType(desc.Type, desc.Null)
      content = `${content}
  ${field}: ${type},`
    }
    content = `${content}
})

export type ${camelCase(`${table}Type`)} = Static<typeof ${table}>
`
    const dir = config.folder && config.folder !== '' ? config.folder : '.'
    const file = config.suffix && config.suffix !== '' ? `${table}.${config.suffix}.ts` : `${table}.ts`
    const dest = path.join(dir, file)
    console.log('Created:', dest)
    fs.outputFileSync(dest, content)
  }
  await db.destroy()
}

(async () => {
  await generate(config)
})()

type Tables = string[]
interface Desc {
  Field: string
  Type: string
  Null: 'YES' | 'NO'
}
interface Config {
  host: string
  port: number
  user: string
  password: string
  database: string
  tables?: string[]
  ignore?: string[]
  folder?: string
  suffix?: string
  camelCase?: boolean
  nullish?: boolean
  requiredString?: boolean
}
