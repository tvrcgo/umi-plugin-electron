import type { IApi } from 'umi'
import { buildApp, buildSrc } from './build'
import electronDev from './dev'

export default function(api: IApi) {

  const launchElectron = ['--electron'].every(v => process.argv.includes(v))

  api.describe({
    key: 'electron',
    config: {
      default: {
        inspectPort: 8889,
        srcPath: 'src/electron',
        tmpPath: 'src/.umi/electron',
        appPath: 'build/electron',
        packPath: 'build/release',
      },
      schema(joi) {
        return joi.object({
          inspectPort: joi.number(),
          srcPath: joi.string(),
          tmpPath: joi.string(),
          appPath: joi.string(),
          packPath: joi.string(),
        })
      }
    }
  })

  api.onDevCompileDone(async ({ isFirstCompile, stats }) => {

    if (isFirstCompile && launchElectron) {
      // build electron source
      await buildSrc(api)
      // run electron
      electronDev(api)
    }

  })

  api.onBuildComplete(async ({ stats }) => {
    if (launchElectron) {
      // build electron source
      await buildSrc(api)
      // build app
      buildApp(api)
    }
  })

}
