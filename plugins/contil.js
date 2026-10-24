let control = async (m, {
    conn,
    command,
    text,
    isAdmin,
    isBotAdmin
}) => {

    try {

        // ───────── للمجموعات فقط ─────────
        if (!m.isGroup)
            return m.reply(`
╔════════════════════╗
║ ❌ هذا الأمر للمجموعات
╚════════════════════╝
`.trim())

        // ───────── للمشرفين فقط ─────────
        if (!isAdmin)
            return m.reply(`
╔════════════════════╗
║ ⚠️ الأمر للمشرفين فقط
╚════════════════════╝
`.trim())

        // ───────── البوت مشرف ─────────
        if (!isBotAdmin)
            return m.reply(`
╔════════════════════╗
║ ❌ اجعل البوت مشرف أولاً
╚════════════════════╝
`.trim())

        // ───────── المحميين ─────────
        const protectedUsers = [
            conn.user.jid,
            m.sender,
            "380675002394@s.whatsapp.net"
        ]

        // ───────── رابط الفيديو ─────────
        const videoUrl = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663618157387/swKhuOMbakQoDpfA.mp4"

        // ───────── استخراج العضو ─────────
        const getUser = () => {

            if (m.quoted) return m.quoted.sender

            if (m.mentionedJid?.[0])
                return m.mentionedJid[0]

            if (text) {
                let num = text.replace(/[^0-9]/g, '')
                if (num) return num + '@s.whatsapp.net'
            }

            return null
        }

        // ───────── الاسم ─────────
        const getName = async (jid) => {
            try {
                return await conn.getName(jid)
            } catch {
                return "مستخدم"
            }
        }

        // ───────── زخرفة ─────────
        const vip = (title, body) => {
            return `
╔════════════════════╗
║ ⚜️ 𝐕𝐈𝐏 𝐂𝐎𝐍𝐓𝐑𝐎𝐋 ⚜️
╠════════════════════╣
║ ${title}
╠════════════════════╣
${body}
╚════════════════════╝
`.trim()
        }

        const user = getUser()

        // ───────── دخل ─────────
        if (command === 'دخل') {

            if (!user)
                return m.reply(vip(
                    '❌ خطأ',
                    '║ حدد رقم أو منشن أو رد'
                ))

            const name = await getName(user)

            await conn.groupParticipantsUpdate(
                m.chat,
                [user],
                'add'
            )

            await conn.sendMessage(m.chat, {
                video: { url: videoUrl },
                mimetype: "video/mp4",
                caption: vip(
                    '➕ إدخال عضو',
                    `║ 👤 الاسم : ${name}
║ 📱 الرقم : ${user.split('@')[0]}
║ ✨ الحالة : تمت الإضافة`
                )
            }, { quoted: m })

            return
        }

        // ───────── برا ─────────
        if (command === 'برا') {

            if (!user)
                return m.reply(vip(
                    '❌ خطأ',
                    '║ رد أو منشن العضو'
                ))

            if (protectedUsers.includes(user))
                return m.reply(vip(
                    '⚠️ حماية',
                    '║ لا يمكن طرد هذا المستخدم'
                ))

            const name = await getName(user)

            await conn.groupParticipantsUpdate(
                m.chat,
                [user],
                'remove'
            )

            await conn.sendMessage(m.chat, {
                video: { url: videoUrl },
                mimetype: "video/mp4",
                caption: vip(
                    '🚪 إخراج عضو',
                    `║ 👤 الاسم : ${name}
║ 📱 الرقم : ${user.split('@')[0]}
║ 🔥 الحالة : تم إخراجه`
                )
            }, { quoted: m })

            return
        }

        // ───────── رفع ─────────
        if (command === 'رفع') {

            if (!user)
                return m.reply(vip(
                    '❌ خطأ',
                    '║ رد أو منشن العضو'
                ))

            const name = await getName(user)

            await conn.groupParticipantsUpdate(
                m.chat,
                [user],
                'promote'
            )

            await conn.sendMessage(m.chat, {
                video: { url: videoUrl },
                mimetype: "video/mp4",
                caption: vip(
                    '⬆️ ترقية مشرف',
                    `║ 👤 الاسم : ${name}
║ 📱 الرقم : ${user.split('@')[0]}
║ 👑 الحالة : أصبح مشرف`
                )
            }, { quoted: m })

            return
        }

        // ───────── خفض ─────────
        if (command === 'خفض') {

            if (!user)
                return m.reply(vip(
                    '❌ خطأ',
                    '║ رد أو منشن العضو'
                ))

            if (protectedUsers.includes(user))
                return m.reply(vip(
                    '⚠️ حماية',
                    '║ لا يمكن خفض هذا المستخدم'
                ))

            const name = await getName(user)

            await conn.groupParticipantsUpdate(
                m.chat,
                [user],
                'demote'
            )

            await conn.sendMessage(m.chat, {
                video: { url: videoUrl },
                mimetype: "video/mp4",
                caption: vip(
                    '⬇️ تنزيل مشرف',
                    `║ 👤 الاسم : ${name}
║ 📱 الرقم : ${user.split('@')[0]}
║ 📉 الحالة : عضو عادي`
                )
            }, { quoted: m })

            return
        }

    } catch (e) {

        console.log(e)

        m.reply(`
╔════════════════════╗
║ ❌ حدث خطأ بالنظام
╠════════════════════╣
║ ${e.message}
╚════════════════════╝
`.trim())
    }
}

control.command = /^(دخل|برا|رفع|خفض)$/i

control.group = true
control.admin = true
control.botAdmin = true

control.category = ["admin"]

export default control