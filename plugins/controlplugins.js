import fs from 'fs/promises'
import path from 'path'

const ROOT = await fs.realpath(process.cwd())

function isInsideRoot(target) {
return target.startsWith(ROOT + path.sep)
}

function getOwners() {
return (global.owner || []).map(owner => {
const number = Array.isArray(owner) ? owner[0] : owner
return String(number).replace(/\D/g, '')
})
}

function isBotOwner(m) {
if (m.isOwner) return true

const sender = String(m.sender || '')
    .split('@')[0]
    .replace(/\D/g, '')

return Boolean(sender && getOwners().includes(sender))

}

async function getSafeFile(filePath) {
if (!filePath || path.isAbsolute(filePath)) {
throw new Error('اكتب مسارًا نسبيًا داخل مجلد البوت.')
}

const target = path.resolve(ROOT, filePath)

if (!isInsideRoot(target)) {
    throw new Error('لا يمكنك الوصول إلى ملفات خارج مجلد البوت.')
}

const info = await fs.lstat(target)

if (info.isSymbolicLink()) {
    throw new Error('لا يمكن التعامل مع الروابط الرمزية.')
}

if (!info.isFile()) {
    throw new Error('المسار المحدد ليس ملفًا عاديًا.')
}

const realTarget = await fs.realpath(target)

if (!isInsideRoot(realTarget)) {
    throw new Error('المسار خارج مجلد البوت.')
}

return { target, info }

}

function getQuotedCode(m) {
const quoted = m.quoted

if (!quoted) return null

return (
    quoted.text ??
    quoted.body ??
    quoted.message?.conversation ??
    quoted.message?.extendedTextMessage?.text ??
    quoted.message?.imageMessage?.caption ??
    quoted.message?.videoMessage?.caption ??
    null
)

}

const handler = async (m, { args }) => {
if (!isBotOwner(m)) {
return m.reply('⛔ هذا الأمر مخصص لمطور البوت فقط.')
}

const command = String(m.text || '')
    .trim()
    .split(/\s+/)[0]
    .replace(/^[.!#/]+/, '')

const filePath = args.join(' ').trim()

if (!filePath) {
    return m.reply(
        '╭━━〔 📂 إدارة الملفات 〕━━╮\n' +
        '┃\n' +
        '┃ 🗑️ حذف ملف:\n' +
        '┃ .حذف ملف plugins/test.js\n' +
        '┃\n' +
        '┃ ♻️ استبدال ملف:\n' +
        '┃ قم بالرد على الكود الجديد واكتب:\n' +
        '┃ .استبدال plugins/test.js\n' +
        '┃\n' +
        '╰━━━━━━━━━━━━━━━━━━╯'
    )
}

try {
    const { target, info } = await getSafeFile(filePath)

    if (/^(حذف|حذف_ملف|delete|del)$/i.test(command)) {
        await fs.unlink(target)

        return m.reply(
            `✅ تم حذف الملف بنجاح.\n\n📁 المسار: ${filePath}`
        )
    }

    if (/^(استبدال|استبدل|replace)$/i.test(command)) {
        const code = getQuotedCode(m)

        if (typeof code !== 'string' || !code.trim()) {
            return m.reply(
                '⚠️ يجب الرد على رسالة تحتوي على الكود الجديد.\n\n' +
                `مثال: .استبدال ${filePath}`
            )
        }

        const temp = path.join(
            path.dirname(target),
            `.${path.basename(target)}.${process.pid}.tmp`
        )

        try {
            await fs.writeFile(temp, code, {
                encoding: 'utf8',
                flag: 'wx',
                mode: info.mode & 0o777
            })

            await fs.chmod(temp, info.mode & 0o777)
            await fs.rename(temp, target)
        } catch (error) {
            await fs.unlink(temp).catch(() => {})
            throw error
        }

        return m.reply(
            `✅ تم استبدال محتوى الملف بنجاح.\n\n` +
            `📁 المسار: ${filePath}\n` +
            `📦 الحجم الجديد: ${Buffer.byteLength(code, 'utf8')} بايت\n\n` +
            '⚠️ إذا كان الملف جزءًا من كود البوت، فقد تحتاج إلى إعادة تشغيله.'
        )
    }

    return m.reply('❌ أمر غير معروف. استخدم .حذف أو .استبدال')
} catch (error) {
    console.error('File management error:', error)

    return m.reply(`❌ تعذرت العملية: ${error.message}`)
}

}

handler.help = [
'حذف ملف <المسار>',
'استبدال <المسار>'
]

handler.tags = ['owner']
handler.command = /^(حذف|حذف_ملف|delete|del|استبدال|استبدل|replace)$/i
handler.owner = true

export default handler