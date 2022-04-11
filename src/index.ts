import type { IApi } from 'umi'
import { resolve } from 'path'
import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { buildApp, buildElectronSrc } from './build'

export default function(api: IApi) {

  const launchElectron = ['--electron'].every(v => process.argv.includes(v))

  api.onStart(() => {
    if (launchElectron) {
      buildElectronSrc(api)
    }
  })

  api.onDevCompileDone(({ isFirstCompile, stats }) => {

    if (isFirstCompile && launchElectron) {
      // run electron
      const electronPath = resolve(api.paths.absNodeModulesPath!, '.bin/electron')
      let elecProc: ChildProcessWithoutNullStreams | null = null

      if (elecProc !== null) {
        (elecProc as any).kill('SIGKILL')
        elecProc = null
      }

      elecProc = spawn(electronPath, [
        `--inspect=8889`,
        resolve(api.paths.absTmpPath!, 'electron/main.js'),
      ])

      elecProc.on('close', (code, signal) => {
        if (signal != 'SIGKILL') {
          process.exit(-1)
        }
      })
    }

  })

  api.onBuildComplete(async ({ stats }) => {
    if (launchElectron) {
      buildApp(api)
    }
  })

}
