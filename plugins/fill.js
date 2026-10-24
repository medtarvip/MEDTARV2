import fs from 'fs'
import path from 'path'
import os from 'os'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const handler = async (m, { conn }) => {
  const root = process.cwd()
  const name = `bot-backup-${Date.now()}`
  const archive = path.join(os.tmpdir(), `${name}.tar.gz`)

  try {
    await m.reply('⏳ جاري ضغط جميع ملفات البوت...')

    /*
     * يتم ضغط المشروع كاملًا من مجلد البوت.
     *
     * المستثنى:
     * node_modules  ← لا نحتاجه لأن npm install يعيده
     * session       ← حماية جلسة واتساب
     * .git          ← ملفات Git
     * .npm          ← ملفات npm المؤقتة
     * tmp           ← الملفات المؤقتة
     * logs          ← السجلات
     */

    await execFileAsync('tar', [
      '-czf',
      archive,

      '--exclude=./node_modules',
      '--exclude=./session',
      '--exclude=./.git',
      '--exclude=./.npm',
      '--exclude=./tmp',
      '--exclude=./logs',

      '-C',
      root,
      '.'
    ], {
      maxBuffer: 10 * 1024 * 1024
    })

    if (!fs.existsSync(archive)) {
      throw new Error('لم يتم إنشاء الملف المضغوط')
    }

    const stats = fs.statSync(archive)

    if (stats.size === 0) {
      throw new Error('الملف المضغوط فارغ')
    }

    await conn.sendMessage(
      m.chat,
      {
        document: fs.readFileSync(archive),
        fileName: `${name}.tar.gz`,
        mimetype: 'application/gzip',
        caption:
          `📦 *نسخة ملفات البوت*\n\n` +
          `📁 تم ضغط جميع ملفات المشروع\n` +
          `📊 الحجم: ${(stats.size / 1024 / 1024).toFixed(2)} MB`
      },
      { quoted: m }
    )

    await sleep(1000)

    try {
      fs.unlinkSync(archive)
    } catch {}

  } catch (e) {
    console.error('خطأ في أمر ملف:', e)

    try {
      if (fs.existsSync(archive)) {
        fs.unlinkSync(archive)
      }
    } catch {}

    await m.reply(
      `❌ حدث خطأ أثناء ضغط ملفات البوت:\n\n${e.message}`
    )
  }
}

handler.command = /^(ملف|نسخة|نسخه)$/i
handler.owner = true

export default handler