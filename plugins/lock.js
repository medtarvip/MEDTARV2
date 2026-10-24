const handler = async (m, { conn, command }) => {

  if (command === "ليك") {

    await conn.groupSettingUpdate(m.chat, 'announcement');

    m.reply(`
╭━━━〔 🔒 𝐊𝐀𝐈𝐓𝐎 𝐊𝐈𝐃 𝐁𝐎𝐓 🔒 〕━━━╮
┃
┃ ✦ تم قفل الشـات بنجـاح
┃ ✦ الآن الأعضاء لا يمكنهم الإرسال
┃
╰━━━━━━━━━━━━━━━━━━╯
`);

  } else if (command === "ليك") {

    await conn.groupSettingUpdate(m.chat, 'not_announcement');

    m.reply(`
╭━━━〔 🔓 𝐊𝐀𝐈𝐓𝐎 𝐊𝐈𝐃 𝐁𝐎𝐓 🔓 〕━━━╮
┃
┃ ✦ تم فتح الشـات بنجـاح
┃ ✦ يمكن لجميع الأعضاء الإرسال الآن
┃
╰━━━━━━━━━━━━━━━━━━━━╯
`);

  }

};

handler.usage = ["لوك", "ليك"];
handler.category = "admin";
handler.command = ["لوك", "ليك"];
handler.admin = true;
handler.botAdmin = true;

export default handler;