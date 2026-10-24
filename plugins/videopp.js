import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from 'ffmpeg-static'

ffmpeg.setFfmpegPath(ffmpegInstaller)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

global.videoppProcess = global.videoppProcess || {
  interval: null,
  originalProfileBuffer: null,
  outputDir: null,
  videoPath: null
}

let handler = async (m, { conn, usedPrefix, command }) => {
  const quoted = m.quoted ? m.quoted : m
  const mime = (quoted.msg || quoted).mimetype || ''

  if (!/video/.test(mime)) {
    return m.reply(`🎬 أرسل فيديو أو رد على فيديو مع الأمر: *${usedPrefix + command}*\nلإيقاف العملية، أرسل: *${usedPrefix}stoppp*`)
  }

  if (global.videoppProcess.interval) {
    clearInterval(global.videoppProcess.interval)
    global.videoppProcess.interval = null
  }

  try {
    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })
    await m.reply('⏳ جاري معالجة الفيديو وإعداده للبروفايل بشكل آمن وسلس...')

    try {
      const currentPic = await conn.profilePictureUrl(conn.user.id, 'image').catch(() => null)
      if (currentPic) {
        const res = await fetch(currentPic)
        global.videoppProcess.originalProfileBuffer = Buffer.from(await res.arrayBuffer())
      }
    } catch (e) {}

    const videoBuffer = await quoted.download()
    global.videoppProcess.videoPath = path.join(__dirname, `temp_video_${Date.now()}.mp4`)
    global.videoppProcess.outputDir = path.join(__dirname, `frames_output_${Date.now()}`)

    if (!fs.existsSync(global.videoppProcess.outputDir)) {
      fs.mkdirSync(global.videoppProcess.outputDir, { recursive: true })
    }

    fs.writeFileSync(global.videoppProcess.videoPath, videoBuffer)

    // تقطيع الإطارات بمعدل مستقر (1 إطار في الثانية لضمان عدم حدوث ضغط على السيرفر وواتساب)
    ffmpeg(global.videoppProcess.videoPath)
      .outputOptions([
        '-vf', 'fps=1,scale=512:512:force_original_aspect_ratio=increase,crop=512:512',
        '-q:v', '2'
      ])
      .save(`${global.videoppProcess.outputDir}/frame-%d.jpg`)
      .on('end', async () => {
        await m.reply(`✅ تم تجهيز الفيديو بنجاح! بدأ عرض الإطارات في البروفايل.\nلإيقافه في أي وقت أرسل: *${usedPrefix}stoppp*`)

        const files = fs.readdirSync(global.videoppProcess.outputDir).filter(file => file.endsWith('.jpg'))
        
        if (files.length === 0) {
          return m.reply('❌ لم يتم العثور على إطارات صالحة.')
        }

        let index = 0
        let isUpdating = false // لمنع تداخل الطلبات

        global.videoppProcess.interval = setInterval(async () => {
          if (isUpdating) return // إذا كان الطلب السابق لم ينتهِ بعد، انتظر للدورة القادمة

          if (index < files.length) {
            isUpdating = true
            try {
              const framePath = path.join(global.videoppProcess.outputDir, files[index])
              const imageBuffer = fs.readFileSync(framePath)

              await conn.updateProfilePicture(conn.user.id, imageBuffer)
              console.log(`🔄 [فيديو بروفايل] تم تحديث الإطار بنجاح: ${files[index]}`)
              index++
            } catch (err) {
              console.error('⚠️ تحذير تحديث الإطار (قد يكون بسبب ضغط واتساب مؤقت):', err.message)
            } finally {
              isUpdating = false
            }
          } else {
            // إعادة تكرار الفيديو من البداية لضمان استمرار الحركة (Loop)
            index = 0
          }
        }, 1500) // الفاصل الزمني 1.5 ثانية (1500ms) وهو المعدل الأكثر استقراراً مع حماية واتساب

      })
      .on('error', async (err) => {
        console.error('❌ خطأ FFmpeg:', err)
        await m.reply(`❌ خطأ FFmpeg: ${err.message}`)
        cleanupPaths()
      })

  } catch (err) {
    console.error('❌ خطأ عام:', err)
    await m.reply(`❌ حدث خطأ: ${err.message}`)
  }
}

function cleanupPaths() {
  try {
    if (global.videoppProcess.videoPath && fs.existsSync(global.videoppProcess.videoPath)) {
      fs.unlinkSync(global.videoppProcess.videoPath)
    }
    if (global.videoppProcess.outputDir && fs.existsSync(global.videoppProcess.outputDir)) {
      fs.rmSync(global.videoppProcess.outputDir, { recursive: true, force: true })
    }
  } catch (e) {}
}

handler.help = ['videopp']
handler.command = ['videopp']
handler.tags = ['owner']

export default handler