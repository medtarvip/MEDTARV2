let handler = async (m, { conn, text, usedPrefix, command }) => {
  // 1. التحقق من كتابة الاسم الجديد بجانب الأمر
  if (!text) {
    return m.reply(`⚠️ *يرجى كتابة الاسم الجديد الذي تريده للبوت!*\n\n*مثال:* \n${usedPrefix + command} MED TAR CR7 DEV`)
  }

  try {
    // 2. إرسال أمر التحديث إلى سيرفر واتساب مباشرة بدون قيود على الطول
    await conn.updateProfileName(text)
    
    return m.reply(`✅ *تم تغيير اسم البوت بنجاح!*\n\n✨ الاسم الجديد: *${text}*`)

  } catch (err) {
    console.error('❌ خطأ في تغيير اسم البوت:', err)
    return m.reply(`❌ حدث خطأ أثناء محاولة تغيير الاسم:\n\`\`\`${err.message}\n(ملاحظة: قد يرفض واتساب الأسماء الطويلة جداً التي تتجاوز الحد الأقصى للسيرفر نفسه)\`\`\``)
  }
}

// إعدادات الأمر والتشغيل
handler.help = ['nabo <الاسم الجديد>', 'setname <الاسم الجديد>']
handler.command = ['nabo', 'setname', 'تغيير_الاسم']
handler.tags = ['owner']
handler.rowner = true // مخصص للمالك فقط للأمان

export default handler