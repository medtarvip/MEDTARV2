import gtts from 'node-gtts'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return m.reply(`🗣️ يرجى كتابة النص المراد تحويله إلى صوت.\n\n*مثال:*\n*${usedPrefix + command} هلا بك يا مبدع*`)
  }

  // تحديد اللغة (افتراضياً العربية 'ar')
  let lang = 'ar'
  let txt = text

  // يمكنك تحديد لغة أخرى إذا أردت مثل: .tts en Hello
  if (text.includes('|')) {
    let parts = text.split('|')
    lang = parts[0].trim()
    txt = parts[1].trim()
  }

  let filePath = path.join(__dirname, `temp_tts_${Date.now()}.mp3`)

  try {
    await conn.sendMessage(m.chat, { react: { text: '🎙️', key: m.key } })

    // توليد ملف الصوت باستخدام مكتبة node-gtts
    let gttsInstance = gtts(lang)
    
    await new Promise((resolve, reject) => {
      gttsInstance.save(filePath, txt, () => {
        resolve()
      })
    })

    if (!fs.existsSync(filePath)) {
      return m.reply('❌ فشل توليد الملف الصوتي.')
    }

    let audioBuffer = fs.readFileSync(filePath)

    // إرسال الملف كبصمة صوتية (Voice Note)
    await conn.sendMessage(m.chat, {
      audio: audioBuffer,
      mimetype: 'audio/mp4',
      ptt: true
    }, { quoted: m })

  } catch (err) {
    console.error('❌ خطأ في تحويل النص إلى صوت:', err)
    m.reply(`❌ حدث خطأ: ${err.message}`)
  } finally {
    // تنظيف الملف المؤقت
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath)
      } catch (e) {}
    }
  }
}

handler.help = ['قول <نص>']
handler.command = ['قول', 'نص_إلى_صوت', 'قول']
handler.tags = ['tools']

export default handler