#!/usr/bin/env node
import d from"path";import c from"fs-extra";import h from"knex";import u from"camelcase";process.stdout.write(process.platform==="win32"?"\x1B[2J\x1B[0f":"\x1B[2J\x1B[3J\x1B[H");const s=c.readJSONSync(d.join(process.cwd(),"mysql-typebox.json"));s.folder&&s.folder!==""&&c.emptyDirSync(s.folder);const y=s.camelCase&&s.camelCase===!0,S=s.nullish&&s.nullish===!0,$=s.requiredString&&s.requiredString===!0;function f(e){return S?`Type.Optional(Type.Union([${e}, Type.Null()]))`:`Type.Union([${e}, Type.Null()])`}function w(e,n){const p=e.split("(")[0],r=n==="YES";switch(p){case"date":case"datetime":case"timestamp":case"time":case"year":case"char":case"varchar":case"tinytext":case"text":case"mediumtext":case"longtext":case"json":case"decimal":return r?f("Type.String()"):$?"Type.String({ minLength: 1 })":"Type.String()";case"tinyint":case"smallint":case"mediumint":case"int":case"bigint":case"float":case"double":const o=e.endsWith(" unsigned")?"Type.Number({ minimum: 0 })":"Type.Number()";return r?f(o):o;case"enum":const i=e.replace("enum(","").replace(")","").replaceAll(",",", ");return`Type.Unsafe<${i.replaceAll(", "," | ")}>({ type: 'string', enum: [${i}] })`}}async function C(e){const n=h({client:"mysql2",connection:{host:e.host,port:e.port,user:e.user,password:e.password,database:e.database}});let r=(await n.raw("SELECT table_name FROM information_schema.tables WHERE table_schema = ?",[e.database]))[0].map(t=>t.table_name).filter(t=>!t.startsWith("knex_")).sort();e.tables&&e.tables.length&&(r=r.filter(t=>e.tables.includes(t))),e.ignore&&e.ignore.length&&(r=r.filter(t=>!e.ignore.includes(t)));for(let t of r){const i=(await n.raw(`DESC ${t}`))[0];y&&(t=u(t));let a=`import { Type } from '@sinclair/typebox'
import type { Static } from '@sinclair/typebox'

export const ${t} = Type.Object({`;for(const l of i){const x=y?u(l.Field):l.Field,T=w(l.Type,l.Null);a=`${a}
  ${x}: ${T},`}a=`${a}
})

export type ${u(`${t}Type`)} = Static<typeof ${t}>
`;const b=e.folder&&e.folder!==""?e.folder:".",g=e.suffix&&e.suffix!==""?`${t}.${e.suffix}.ts`:`${t}.ts`,m=d.join(b,g);console.log("Created:",m),c.outputFileSync(m,a)}await n.destroy()}(async()=>await C(s))();
