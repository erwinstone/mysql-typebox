#!/usr/bin/env node
var h=Object.create;var u=Object.defineProperty;var w=Object.getOwnPropertyDescriptor;var S=Object.getOwnPropertyNames;var E=Object.getPrototypeOf,N=Object.prototype.hasOwnProperty;var C=(e,s,a,r)=>{if(s&&typeof s=="object"||typeof s=="function")for(let t of S(s))!N.call(e,t)&&t!==a&&u(e,t,{get:()=>s[t],enumerable:!(r=w(s,t))||r.enumerable});return e};var i=(e,s,a)=>(a=e!=null?h(E(e)):{},C(s||!e||!e.__esModule?u(a,"default",{value:e,enumerable:!0}):a,e));var p=i(require("path")),o=i(require("./node_modules/fs-extra/lib/index.js")),y=i(require("./node_modules/knex/knex.js")),f=i(require("./node_modules/clear-any-console/index.js"));(0,f.default)();function j(e){switch(e.split("(")[0]){case"date":case"datetime":case"timestamp":case"time":case"year":case"char":case"varchar":case"tinytext":case"text":case"mediumtext":case"longtext":case"json":case"decimal":return"Type.String()";case"tinyint":case"smallint":case"mediumint":case"int":case"bigint":case"float":case"double":return"Type.Number()";case"enum":let a=e.replace("enum(","").replace(")","").replaceAll(",",", ");return`Type.Unsafe<${a.replaceAll(", "," | ")}>({ type: 'string', enum: [${a}] })`}}var l=o.default.readJSONSync(p.default.join(process.cwd(),"mysql-typebox.json"));l.folder&&l.folder!==""&&o.default.emptyDirSync(l.folder);async function D(e){let s=(0,y.default)({client:"mysql2",connection:{host:e.host,port:e.port,user:e.user,password:e.password,database:e.database}}),r=(await s.raw("SELECT table_name FROM information_schema.tables WHERE table_schema = ?",[e.database]))[0].map(t=>t.table_name).filter(t=>!t.startsWith("knex_")).sort();e.tables&&e.tables.length&&(r=r.filter(t=>e.tables.includes(t))),e.ignore&&e.ignore.length&&(r=r.filter(t=>!e.ignore.includes(t)));for(let t of r){let b=(await s.raw(`DESC ${t}`))[0],n=`import { Type } from '@sinclair/typebox'

export const ${t} = Type.Object({`;for(let c of b){let $=c.Field,m=j(c.Type),g=c.Null==="YES";n=`${n}
  ${$}: ${g?`Type.Optional(Type.Union([${m}, Type.Null()]))`:`${m}`},`}n=`${n}
})
`;let x=e.folder&&e.folder!==""?e.folder:".",T=e.suffix&&e.suffix!==""?`${t}.${e.suffix}.ts`:`${t}.ts`,d=p.default.join(x,T);console.log("Created:",d),o.default.outputFileSync(d,n)}process.exit(1)}(async()=>await D(l))();