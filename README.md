# mysql-typebox

Generate Typebox interfaces from MySQL database

## Installation

Install `mysql-typebox` with npm

```bash
npm install mysql-typebox --save-dev
```

## Usage/Examples

Create a file named `mysql-typebox.json` and fill it as follows (adjust to your needs):

```json
{
  "host": "127.0.0.1",
  "port": 3306,
  "user": "root",
  "password": "secret",
  "database": "myapp"
}
```

Create User table:

```sql
CREATE TABLE `user` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `role` enum('admin','user') NOT NULL,
  PRIMARY KEY (`id`)
);
```
Then run the command:

```bash
npx mysql-typebox
```

The above command will create a `user.ts` file with the following contents:

```typescript
import { Type } from '@sinclair/typebox'
import type { Static } from '@sinclair/typebox'

export const user = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  username: Type.String(),
  password: Type.String(),
  profile_picture: Type.Union([Type.String(), Type.Null()]),
  role: Type.Unsafe<'admin' | 'user'>({ type: 'string', enum: ['admin', 'user'] }),
})

export type userType = Static<typeof user>
```
## Config

`mysql-typebox.json`
```json
{
  "host": "127.0.0.1",
  "port": 3306,
  "user": "root",
  "password": "secret",
  "database": "myapp",
  "tables": ["User", "Log"],
  "ignore": ["Log"],
  "folder": "@typebox",
  "suffix": "table",
  "camelCase": false,
  "nullish": false,
  "requiredString": false
}
```

| Option | Description |
| ------ | ----------- |
| tables | Filter the tables to include only those specified. |
| ignore | Filter the tables to exclude those specified. |
| folder | Specify the output directory. |
| suffix | Suffix to the name of a generated file. (eg: `user.table.ts`) |
| camelCase | Convert all table names and their properties to camelcase. (eg: `profile_picture` becomes `profilePicture`) |
| nullish | Set schema as `nullish`. Nullish schemas will accept both `undefined` and `null` |
| requiredString | Add `minLength: 1` for string schema |
