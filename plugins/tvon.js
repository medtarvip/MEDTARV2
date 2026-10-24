import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from 'ffmpeg-static'

ffmpeg.setFfmpegPath(ffmpegInstaller)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const quoted = m.quoted ? m.quoted : m
  const mime = (quoted.msg || quoted).mimetype || ''

  if (!/audio|video/.test(mime)) {
    return m.reply(`🎙️ يرجى الرد على بصمة صوتية أو مقطع صوتي/فيديو مع تحديد التأثير المطلوب.\n\n*التأثيرات المتاحة:*\n- *${usedPrefix + command} bass* (صوت مضخم/عميق)\n- *${usedPrefix + command} chipmunk* (صوت السنجاب الحاد)\n- *${usedPrefix + command} slow* (صوت بطيء)\n- *${usedPrefix + command} fast* (صوت سريع)\n- *${usedPrefix + command} robot* (صوت الروبوت)`)
  }

  let effect = (text || 'bass').toLowerCase()
  let audioFilter = ''

  // تحديد تأثير الفلتر حسب اختيار المستخدم
  switch (effect) {
    case 'bass':
      audioFilter = 'equalizer=f=100:width_type=o:width=2:g=20'
      break
    case 'chipmunk':
      audioFilter = 'asetrate=44100*1.5,aresample=44100,atempo=1.0'
      break
    case 'slow':
      audioFilter = 'atempo=0.8,asetrate=44100*0.8'
      break
    case 'fast':
      audioFilter = 'atempo=1.5,asetrate=44100*1.2'
      break
    case 'robot':
      audioFilter = 'afftiz,comprss,amersm' // أو فلتر بديل أبسط للبوتات
      audioFilter = 'aecho=0.8:0.88:60:0.4'
      break
    default:
      audioFilter = 'equalizer=f=100:width_type=o:width=2:g=20'
  }

  try {
    await conn.sendMessage(m.chat, { react: { text: '🎧', key: m.key } })

    const mediaBuffer = await quoted.download()
    const inputPath = path.join(__dirname, `temp_audio_${Date.now()}.mp3`)
    const outputPath = path.join(__dirname, `output_audio_${Date.now()}.mp3`)

    fs.writeFileSync(inputPath, mediaBuffer)

    // معالجة الصوت عبر FFmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioFilters(audioFilter)
        .save(outputPath)
        .on('end', resolve)
        .on('error', reject)
    })

    // قراءة الملف الناتج وإرساله كبصمة صوتية (Voice Note)
    const outputBuffer = fs.readFileSync(outputPath)
    
    await conn.sendMessage(m.chat, {
      audio: outputBuffer,
      mimetype: 'audio/mp4',
      ptt: true // لكي يظهر كبصمة صوتية مسجلة وليس مجرد ملف صوتي
    }, { quoted: m })

    // تنظيف الملفات المؤقتة
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)

  } catch (err) {
    console.error('❌ خطأ في تغيير الصوت:', err)
    m.reply(`❌ حدث خطأ أثناء معالجة الصوت: ${err.message}`)
  }
}

handler.help = ['tovn <effect>']
handler.command = ['tovn', 'changevoice', 'تغيير_الصوت', 'صوت']
handler.tags = ['tools']

export default handler