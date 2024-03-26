declare module 'svgo/lib/parser.js' {
  import { XastRoot } from 'svgo/lib/types'
  export const parseSvg: (data: string, from?: string) => XastRoot
}

declare module 'svgo/lib/builtin.js' {
  import { Plugin } from 'svgo/lib/types'
  export const builtin = [
    { name: 'mergeStyles', description: string, fn: Plugin<any> } as const,
    { name: 'inlineStyles', description: string, fn: Plugin<any> } as const,
    { name: 'convertStyleToAttrs', description: string, fn: Plugin<any> } as const,
    { name: 'cleanupNumericValues', description: string, fn: Plugin<any> } as const,
    { name: 'moveGroupAttrsToElems', description: string, fn: Plugin<any> } as const,
    { name: 'collapseGroups', description: string, fn: Plugin<any> } as const,
    { name: 'convertPathData', description: string, fn: Plugin<any> } as const,
    { name: 'convertShapeToPath', description: string, fn: Plugin<any> } as const,
    { name: 'mergePaths', description: string, fn: Plugin<any> } as const,
    { name: 'removeStyleElement', description: string, fn: Plugin<any> } as const,
    { name: 'removeOffCanvasPaths', description: string, fn: Plugin<any> } as const,
    { name: 'convertOneStopGradients', description: string, fn: Plugin<any> } as const,
  ]
}

declare module 'svgo/plugins/applyTransforms.js' {
  export const applyTransforms: Plugin<any>
}

declare module 'svgo/lib/svgo/plugins.js' {
  import { Plugin, XastRoot } from 'svgo/lib/types'
  export const invokePlugins: (
    ast: XastRoot,
    info: object,
    plugins: { name: string, params?: object, fn: Plugin<any> }[],
    override?: object,
    globalOverrides?: object,
  ) => void
}
