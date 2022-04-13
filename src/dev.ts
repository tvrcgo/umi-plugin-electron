import { resolve } from 'path'
import { existsSync } from 'fs'
import type { IApi } from 'umi'
import respawn from 'respawn'

let proc = null

export default (api: IApi) => {
  const config = api.config.electron

  const electronPath = [
    resolve(__dirname, '../node_modules/.bin/electron'),
    resolve(api.paths.absNodeModulesPath, '.bin/electron')
  ].filter(v => existsSync(v))[0]

  if (!proc) {
    proc = respawn([
      electronPath,
      `--inspect=${config.inspectPort}`,
      resolve(config.tmpPath, 'main.js'),
    ])

    proc.on('exit', (code, signal) => {
      // 主动退出应用
      if (code === 0) {
        proc.stop()
        process.exit(0)
      }
    })
  }

  if (proc.status === 'running') {
    proc.stop(() => {
      proc.start()
    })
  } else {
    proc.start()
  }

}
