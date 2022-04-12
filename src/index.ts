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

  let step = 0
  const next = async () => {
    switch (step) {
      case 2:
        // run electron
        electronDev(api)
        break
      case 4:
        // build app
        buildApp(api)
        break
      default:
        break
    }
  }

  api.onStart(async () => {
    if (launchElectron) {
      // build electron source
      buildSrc(api)
        .then(() => {
          step += 1
          next()
        })
    }
  })

  api.onDevCompileDone(async ({ isFirstCompile, stats }) => {
    if (isFirstCompile && launchElectron) {
      step += 1
      next()
    }

  })

  api.onBuildComplete(async ({ stats }) => {
    if (launchElectron) {
      step += 3
      next()
    }
  })

}
