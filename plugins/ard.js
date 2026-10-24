import fs from 'fs'
import path from 'path'

export default async function before(m, { conn, bot }) {

  const text = (m.text || '').trim()

  if (!text.startsWith('.عرض')) return

  const target = text.slice(5).trim()

  if (!target) {
    return m.reply(
      '❌ استخدم الأمر هكذا:\n\n' +
      '.عرض auto/reply\n\n' +
      'أو:\n' +
      '.عرض plugins/auto/reply.js'
    )
  }

  try {

    let filePath = target

    // إذا كتب المسار بدون plugins/
    if (!filePath.startsWith('plugins/')) {
      filePath = `plugins/${filePath}`
    }

    // إذا لم يكتب الامتداد
    if (!path.extname(filePath)) {
      filePath += '.js'
    }

    const fullPath = path.resolve(process.cwd(), filePath)

    // منع الخروج من مجلد plugins
    const pluginsPath = path.resolve(process.cwd(), 'plugins')

    if (
      fullPath !== pluginsPath &&
      !fullPath.startsWith(pluginsPath + path.sep)
    ) {
      return m.reply('❌ المسار غير مسموح.')
    }

    if (!fs.existsSync(fullPath)) {
      return m.reply(
        `❌ الملف غير موجود:\n\n${filePath}`
      )
    }

    const stat = fs.statSync(fullPath)

    if (!stat.isFile()) {
      return m.reply('❌ المسار المحدد ليس ملفًا.')
    }

    const code = fs.readFileSync(fullPath, 'utf8')

    if (!code.trim()) {
      return m.reply('⚠️ الملف فارغ.')
    }

    const message =
      `📄 *الملف:* ${filePath}\n\n` +
      '```js\n' +
      code +
      '\n```'

    // واتساب لديه حد لطول الرسالة، لذلك نقسم الكود
    const maxLength = 60000

    if (message.length <= maxLength) {
      return m.reply(message)
    }

    for (let i = 0; i < message.length; i += maxLength) {
      await m.reply(message.slice(i, i + maxLength))
    }

  } catch (error) {
    console.error(error)

    return m.reply(
      `❌ حدث خطأ أثناء قراءة الملف:\n\n${error.message}`
    )
  }
}