import webpack from 'webpack'
import { resolve } from 'path'
import type { IApi } from 'umi'
import * as electronBuilder from 'electron-builder'
import electronDev from './dev'

const webpackBaseConfig = (api: IApi) => {
  const env: 'development'| 'production' = (api.env === 'development' ? 'development' : 'production')
  const config = api.config.electron
  const outputPath = resolve(api.paths.cwd, env === 'development' ? config.tmpPath : config.appPath)
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
        '@': api.paths.absSrcPath,
        '@@': api.paths.absTmpPath,
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

export function buildSrc(api: IApi) {
  api.logger.info('Build electron source ...')
  return Promise.all([
    buildElectronMain(api),
    buildElectronPreload(api)
  ])
}

function buildElectronMain(api: IApi) {
  const { srcPath } = api.config.electron
  const compiler = webpack({
    ...webpackBaseConfig(api),
    target: 'electron-main',
    entry: {
      main: resolve(srcPath, 'main.ts')
    },
  })
  return handleCompiler('main', compiler, api)
}

function buildElectronPreload(api: IApi) {
  const { srcPath } = api.config.electron
  const compiler = webpack({
    ...webpackBaseConfig(api),
    target: 'electron-preload',
    entry: {
      preload: resolve(srcPath, 'preload.ts'),
    }
  })
  return handleCompiler('preload', compiler, api)
}

function handleCompiler(entry, compiler, api) {
  return new Promise((resolve, reject) => {
    let isFirstBuild = true
    if (api.env === 'development') {
      compiler.watch({
        aggregateTimeout: 500,
        poll: 1000,
        stdin: true
      }, (err, stats) => {
        if (err) {
          api.logger.error(err)
          return
        }
        api.logger.info(`Build electron <${entry}> complete`)
        resolve(1)

        if (!isFirstBuild) {
          api.logger.info('Restart electron')
          electronDev(api)
        }
        isFirstBuild = false
      })
    } else {
      compiler.run((err) => {
        if (err) {
          api.logger.error(err)
          return reject(err)
        }
        api.logger.info(`Build electron <${entry}> complete`)
        resolve(1)
      })
    }
  })
}

export function buildApp(api: IApi) {
  api.logger.info('Build app ...')
  const { appPath, packPath } = api.config.electron
  return electronBuilder.build({
    targets: electronBuilder.Platform.MAC.createTarget(),
    config: {
      ...api.pkg.build,
      files: [
        `${appPath}/**/*`,
        `${api.config.outputPath}/**/*`,
        "package.json"
      ],
      directories: {
        output: packPath,
      }
    }
  }).then(() => {
    api.logger.info('Build app done')
  })
}
