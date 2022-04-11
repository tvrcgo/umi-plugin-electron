import type { IApi } from 'umi'
import { buildApp, buildSrc } from './build'
import electronDev from './dev'

export default function(api: IApi) {

  const launchElectron = ['--electron'].every(v => process.argv.includes(v))

  api.onStart(() => {
    if (launchElectron) {
      // buildElectronSrc(api)
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
