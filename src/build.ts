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
      }
    },
    externals: {
      'electron': 'electron',
      'electron-updater': 'electron-updater',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true
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
  compiler.run((err) => {
    if (err) {
      api.logger.error(err)
    }
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
  compiler.run((err) => {
    if (err) {
      api.logger.error(err)
    }
  })
}

export function buildElectronSrc(api: IApi) {
  api.logger.info('Build src/electron')
  buildElectronMain(api)
  buildElectronPreload(api)
}

export function buildApp(api: IApi) {
  api.logger.info('Build app')
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
