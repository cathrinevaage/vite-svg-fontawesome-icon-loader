import { applyTransforms } from 'svgo/plugins/applyTransforms.js'
import { builtin as svgoBuiltIn } from 'svgo/lib/builtin.js'
import { parseSvg } from 'svgo/lib/parser.js'
import { invokePlugins } from 'svgo/lib/svgo/plugins.js';
import { Plugin as VitePlugin } from 'vite'
import { readFile } from 'fs/promises'
import { XastRoot, Plugin as SvgoPluginFunction, XastElement } from 'svgo/lib/types'
import '../ambient.d.ts'

const builtinPluginsMap = Object.fromEntries(svgoBuiltIn.map((plugin) => ([plugin.name, plugin])))

export type SvgoPlugin<Params = {}> = {
  name: string,
  params?: Params,
  fn: SvgoPluginFunction<Params>,
}

const MAX_SVG_OPTIMIZATION_ITERATIONS = 10

const svgoPlugins = [
  { name: 'mergeStyles', fn: builtinPluginsMap.mergeStyles.fn },
  { name: 'inlineStyles', fn: builtinPluginsMap.inlineStyles.fn },
  { name: 'convertStyleToAttrs', fn: builtinPluginsMap.convertStyleToAttrs.fn },
  { name: 'removeStyleElement', fn: builtinPluginsMap.removeStyleElement.fn },
  { name: 'cleanupNumericValues', fn: builtinPluginsMap.cleanupNumericValues.fn },
  { name: 'moveGroupAttrsToElems', fn: builtinPluginsMap.moveGroupAttrsToElems.fn },
  {
    name: 'convertShapeToPath',
    params: {
      convertArcs: true,
    },
    fn: builtinPluginsMap.convertShapeToPath.fn,
  },
  { name: 'removeOffCanvasPaths', fn: builtinPluginsMap.removeOffCanvasPaths.fn },
  {
    name: 'removeFill',
    fn: () => ({
      element: {
        enter (node) {
          if (node.type !== 'element' || node.name !== 'path') {
            return
          }

          delete node.attributes.fill
        }
      }
    }),
  },
  {
    name: 'removeClass',
    fn: () => ({
      element: {
        enter (node) {
          if (node.type !== 'element' || node.name !== 'path') {
            return
          }

          delete node.attributes.class
        }
      }
    }),
  },
  { name: 'applyTransforms', fn: applyTransforms },
  { name: 'mergePaths', params: {force: true}, fn: builtinPluginsMap.mergePaths.fn },
  { name: 'convertPathData', fn: builtinPluginsMap.convertPathData.fn },
  { name: 'collapseGroups', fn: builtinPluginsMap.collapseGroups.fn },
  {
    name: 'removeIrrelevantElements',
    fn: () => ({
      element: {
        enter (node, parentNode) {
          if (parentNode.type !== 'element' || parentNode.name !== 'svg') {
            return
          }

          if (node.type !== 'element' || ['g', 'path'].includes(node.name)) {
            return
          }

          parentNode.children.splice(parentNode.children.indexOf(node), 1)
        }
      }
    })
  }
] satisfies SvgoPlugin[]

const recursiveSimplifySvg = (
  ast: XastRoot,
  plugins: SvgoPlugin[],
  previousIterationSize = Infinity,
  iterations = 1
): XastRoot => {
  invokePlugins(ast, {}, plugins)

  const size = JSON.stringify(ast).length

  if (size !== previousIterationSize && iterations >= MAX_SVG_OPTIMIZATION_ITERATIONS) {
    return recursiveSimplifySvg(ast, plugins, size, iterations + 1)
  }

  return ast
}

const simplifySvg = (
  svgData: string,
  additionalSvgoPlugins?: SvgoPlugin[] | { before?: SvgoPlugin[], after?: SvgoPlugin[] },
) => {
  let plugins: SvgoPlugin[]

  if (Array.isArray(additionalSvgoPlugins)) {
    plugins = [...additionalSvgoPlugins, ...svgoPlugins]
  } else if (typeof additionalSvgoPlugins === 'object') {
    plugins = [
      ...(additionalSvgoPlugins.before ?? []),
      ...svgoPlugins,
      ...(additionalSvgoPlugins.after ?? []),
    ]
  } else {
    plugins = svgoPlugins
  }

  return recursiveSimplifySvg(parseSvg(svgData), plugins)
}

const wordNormalizer = (string: string) => (
  string
    // split words at hyphens, underscores, periods, whitespace, and before initial uppercase letters
    .split(/[-_.\s]+|(?=(?<![A-Z])[A-Z])/g)
    .map((subString) => (
      subString
        .toLowerCase()
        // remove all non-alphanumeric characters.
        .replaceAll(/[^a-z\d\s]/g, '')
    ))
)

export type FileNameParserInput = {
  /** Filename without extension. */
  filename: string,
  /** Query string specified in module import. */
  query: string,
  /** Full file path. */
  filePath: string,
  /** Full module id. */
  moduleId: string,
}

export type PluginOptions = {
  /** Default icon prefix. Default value: 'cu'. Short for custom. */
  prefix?: string,
  /** If first word of filename starts with the prefix option, it will treat the first whole word as the prefix. */
  inferPrefix?: boolean,
  /** Overrides filename parsing and transform. */
  fileNameParser?: (input: FileNameParserInput) => {
    prefix?: string,
    iconName: string,
    aliases?: string[]
  }
  /** Add plugins to be given to svgo. When options is given as array, the plugins are run before. */
  svgoPlugins?: SvgoPlugin[] | { before: SvgoPlugin[], after: SvgoPlugin[] }
}

const svgFontawesomeIconLoader = (pluginOptions: PluginOptions = {}): VitePlugin => {
  const options = {
    prefix: 'cu',
    inferPrefix: false,
    ...pluginOptions
  }

  return {
    name: 'svg-fontawesome-icon-loader',

    enforce: 'pre',

    async load (moduleId) {
      if (!moduleId.match(/\.svg\?fontawesome/)) {
        return
      }

      const [filePath, rawQuery] = moduleId.split('?', 2)

      // filename without extension
      const filename = filePath.split('/').at(-1)!.slice(0, -4)

      if (filename.length === 0) {
        console.error(
          'vite-svg-fontawesome-icon-loader requires modules to have filenames beyond extension. ".svg" is rejected'
        )
        return
      }

      let prefix: string
      let iconName: string
      let aliases: string[]

      if (options.fileNameParser) {
        ({
          prefix = options.prefix,
          iconName,
          aliases = [],
        } = options.fileNameParser({
          filename,
          query: rawQuery,
          filePath,
          moduleId,
        }))
      } else {
        const query = new URLSearchParams(rawQuery)

        const nameWords = wordNormalizer(filename)

        if (options.inferPrefix && nameWords.length > 1 && nameWords[0].startsWith(options.prefix)) {
          prefix = nameWords[0]
          iconName = nameWords.slice(1).join('-')
        } else {
          prefix = query.get('prefix') ?? options.prefix
          iconName = query.get('icon-name') ?? nameWords.join('-')
        }

        aliases = query.get('aliases')?.split(',') ?? []
      }

      const svgFile = await readFile(filePath, 'utf-8')

      const optimizedSvgAst = simplifySvg(svgFile, options.svgoPlugins)

      const svgElement = optimizedSvgAst.children
        .find((node): node is XastElement => node.type === 'element' && node.name === 'svg')

      if (svgElement === undefined) {
        throw new Error(`Missing svg element in svg file: ${filePath}`)
      }

      const pathData = svgElement.children
        .filter((node): node is XastElement => node.type === 'element' && node.name === 'path')
        .map((node) => node.attributes.d) ?? []

      if (pathData.length === 0) {
        throw new Error(`Couldn't find path or path convertible elements in svg file: ${filePath}`)
      }

      const [
        ,
        ,
        width = svgElement.attributes.width,
        height = svgElement.attributes.height,
      ] = svgElement.attributes.viewBox?.split(' ').map(Number) ?? []

      return `export default ${JSON.stringify({
        prefix,
        iconName,
        icon: [
          width,
          height,
          aliases,
          '',
          pathData.length > 1 ? pathData : pathData[0],
        ],
      }, null, 2)}`
    },
  }
}

export default svgFontawesomeIconLoader
