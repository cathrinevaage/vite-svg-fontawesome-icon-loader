# Vite SVG Fontawesome icon loader
Vite plugin that lets you import svg files as fontawesome icons.

This plugin is heavily inspired by [vite-svg-loader](https://github.com/jpkleemans/vite-svg-loader).

```ts
import cuMyIcon from './my-icon.svg?fontawesome'
import { library, dom } from '@fortawesome/fontawesome-svg-core'

library.add(cuMyIcon)

dom.watch()
```
```html
<i class="cu fa-my-icon" />
```

## Install
```bash
npm install --save-dev vite-svg-fontawesome-icon-loader
```
```bash
yarn add --dev vite-svg-fontawesome-icon-loader
```

## Setup

### Vite config
In your `vite.config.js` or `vite.config.ts` file
```ts

import { defineConfig } from 'vite'
import svgFontawesomeIconLoader from 'vite-svg-fontawesome-icon-loader'

export default defineConfig({
  plugins: [svgFontawesomeIconLoader()],
})
```

### Typescript config
In your `src/vite-env.d.ts`, or in a ts file elsewhere in your code.
```ts
/// <reference types="vite-svg-fontawesome-icon-loader" />
```

Or in `tsconfig.json`.
```json
{
  "compilerOptions": {
    "types": ["vite-svg-fontawesome-icon-loader"]
  }
}
```

## Usage
To invoke the loader, the svg icons must be imported with the fontawesome query parameter.
```ts
import cuMyIcon from './my-icon.svg?fontawesome'
```
They must then be registered in the fontawesome library before they can be used.
```ts
import { library, dom } from '@fortawesome/fontawesome-svg-core'

library.add(cuMyIcon)
```

### Rendering
Use one of the following approaches to render custom icon.

#### `<i>` element with class:
```html
<i class="ca fa-my-icon" />
```

#### Manual rendering
```js
import { icon } from '@fortawesome/fontawesome-svg-core'

document.body.appendChild(icon({ prefix: 'cu', iconName: 'my-icon' }).node[0])
```

#### Vue
```vue
<script>
  import FontAwesomeIcon from '@fortawesome/vue-fontawesome'
</script>

<template>
  <FontAwesomeIcon :icon="['cu', 'my-icon']" />
</template>
```

#### React
```tsx
import ReactDOM from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const element = <FontAwesomeIcon icon={['cu', 'my-icon']} />

ReactDOM.render(element, document.body)
```

#### Other methods
Refer to the official [Fontawesome docs](https://docs.fontawesome.com/) for additional information about how to render
icons in various ways.

### Query overrides
Overriding prefix, icon name, and icon name aliases per svg file is possible through additional query parameters.  
These are overriden by using the `prefix`, `icon-name`, and `aliases` query parameters respectively.

Example:

```ts
import cusTestIcon from './solid-test-icon.svg?fontawesome&prefix=cus&icon-name=test-icon&aliases=these-are,all-some,aliases'
```

This results in an icon with the prefix `'cus'`, icon name `'test-icon'`, and aliases `['these-are', 'all', 'aliases']`.

‼️ There is no Typescript support for this. ‼️  
⚠️ If the `fileNameParser` is specified, it must parse out and apply options from query parameters, if that is desired.
⚠️

## Plugin options
### `prefix`
Sets the default prefix. Defaults to `'cu'`, which is short for «custom».

### `inferPrefix`
Determines whether prefix should be inferred from the svg filename. Defaults to `false`.  
More about it [here](#infer-prefix).

### `fileNameParser`
Lets you specify a filename parser which overrides all prefix, icon name, and aliases resolution.

### `svgoPlugins`
Lets you add additional svgo plugins to be run before and/or after the default plugins.  
Given either as an array, which are run before, or as an object with before and/or after properties.
```ts
SvgoPlugin[] | { before?: SvgoPlugin[], after?: SvgoPlugin[] }
```

## Icon name parsing
Icon names will be parsed from the svg file names.  

It will detect individual words, and format the icon name as kebab-case before it's passed to fontawesome.
It does this by using the following regular expression `/[-_.\s]+|(?=(?<![A-Z])[A-Z])/`.  
I.e. splitting on hyphens, underscores, periods, whitespace, and before initial uppercase letters.  
Sequential uppercase letters are treated as a single word.  

Example:  
`my-icon.svg` => `my-icon`  
`my_icon.svg` => `my-icon`  
`my.icon.svg` => `my-icon`  
`my icon.svg` => `my-icon`  
`myIcon.svg` => `my-icon`  
`myICON.svg` => `my-icon`  

All non-alphanumeric characters are removed from words.

## Infer prefix
When the `inferPrefix` option is enabled, it will attempt to infer the prefix from first word of the icon name, if it
contains more than one word.  
If the first word starts with the prefix (default: `'cu'`), it will treat that whole word as 

## SVGO
This plugin uses [SVGO](https://svgo.dev) to parse and simplify the svg data.  

SVGO is pinned to a specific version as it uses package internals. We're not interested in the resulting svg as a
string, so we import the parser and plugin runner and call them manually.  

## ⚠️ Custom prefix and icon name caveats ⚠️
Lookup functions exported by `@fortawesome/fontawesome-svg-core`, like `icon` and `findIconDefinition`, are typed to
only accept predefined icon prefixes and icon names.  
This does not impact "normal" usage through the dom watcher, or the Vue implementation `@fortawesome/vue-fontawesome`.  
You will however run into this when using the React implementation `@fortawesome/react-fontawesome`. They address this
specifically [here](https://docs.fontawesome.com/web/use-with/react/add-icons#typescript-and-custom-icons-issue).
