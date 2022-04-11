import webpack from 'webpack'
import { resolve } from 'path'
import type { IApi } from 'umi'
import * as electronBuilder from 'electron-builder'

const webpackBaseConfig = (api: IApi) => {
  const env: 'development'| 'production' = (api.env === 'development' ? 'development' : 'production')
  const outputPath = env === 'development' ?
    resolve(api.paths.absTmpPath!, 'electron') :
    resolve(api.paths.absOutputPath!, '../electron')
  return {
    mode: env,
    output: {
      path: outputPath,
      filename: '[name].js',
      libraryTarget: 'commonjs2',
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@': api.paths.absSrcPath!,
      },
      modules: [
        api.paths.absNodeModulesPath!,
        resolve(__dirname, '../node_modules')
      ]
    },
    externals: {
      'electron': 'electron',
      'electron-updater': 'electron-updater',
    },
    resolveLoader: {
      modules: [
        api.paths.absNodeModulesPath!,
        resolve(__dirname, '../node_modules')
      ]
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                compilerOptions: {
                  target: 'es6',
                  module: 'commonjs',
                  esModuleInterop: true,
                  allowSyntheticDefaultImports: true,
                  importHelpers: false
                }
              }
            }
          ],
          exclude: /node_modules/
        }
      ]
    },
    optimization: {
      minimize: env === 'production',
    }
  }
}

function buildElectronMain(api: IApi) {
  const compiler = webpack({
    ...webpackBaseConfig(api),
    target: 'electron-main',
    entry: {
      main: resolve(api.paths.absSrcPath!, 'electron/main.ts')
    },
  })
  return new Promise((resolve, reject) => {
    compiler.run((err) => {
      if (err) {
        api.logger.error(err)
        return reject(err)
      }
      resolve(1)
    })
  })
}

function buildElectronPreload(api: IApi) {
  const compiler = webpack({
    ...webpackBaseConfig(api),
    target: 'electron-preload',
    entry: {
      preload: resolve(api.paths.absSrcPath!, 'electron/preload.ts'),
    }
  })
  return new Promise((resolve, reject) => {
    compiler.run((err) => {
      if (err) {
        api.logger.error(err)
        return reject(err)
      }
      resolve(1)
    })
  })
}

export function buildElectronSrc(api: IApi) {
  api.logger.info('Build src/electron ...')
  return Promise.all([
    buildElectronMain(api),
    buildElectronPreload(api)
  ]).then(([main, preload]) => {
    api.logger.info('Build src/electron done')
  })
}

export function buildApp(api: IApi) {
  api.logger.info('Build app ...')
  return electronBuilder.build({
    targets: electronBuilder.Platform.MAC.createTarget(),
    config: {
      ...api.pkg.build,
      files: [
        "build/electron/**/*",
        "build/web/**/*",
        "package.json"
      ],
      directories: {
        output: 'build/release',
      }
    }
  }).then(() => {
    api.logger.info('Build app done')
  })
}
