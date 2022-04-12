import { ChildProcessWithoutNullStreams, spawn } from 'child_process'
import { resolve } from 'path'
import { existsSync } from 'fs'
import type { IApi } from 'umi'

export default (api: IApi) => {
  const config = api.config.electron

  const electronPath = [
    resolve(__dirname, '../node_modules/.bin/electron'),
    resolve(api.paths.absNodeModulesPath, '.bin/electron')
  ].filter(v => existsSync(v))[0]
  let elecProc: ChildProcessWithoutNullStreams | null = null

  if (elecProc !== null) {
    (elecProc as any).kill('SIGKILL')
    elecProc = null
  }

  elecProc = spawn(electronPath, [
    `--inspect=${config.inspectPort}`,
    resolve(api.paths.absTmpPath!, 'electron/main.js'),
  ])

  elecProc.on('close', (code, signal) => {
    if (signal != 'SIGKILL') {
      process.exit(-1)
    }
  })
}
