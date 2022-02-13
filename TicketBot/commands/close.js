const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Send Ticket Close Message'),

    async execute(interaction) {
        const { MessageActionRow, MessageButton } = require('discord.js')
        sql.query("SELECT user FROM open WHERE channel = ?", [interaction.channel.id], function (err, result) {
            if (err) { }
            if (!result.length) {
                interaction.reply({ content: "Invalid Channel!", ephemeral: true })
            } else {
                interaction.reply({ content: `Keep up the good work ${interaction.user.username}`, ephemeral: true });
                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId('close_ticket')
                            .setLabel('Close')
                            .setStyle('DANGER')
                    )
                interaction.channel
                    .send({
                        content: 'https://tenor.com/view/satisfied-are-you-satisfied-with-your-care-care-big-hero-six-disney-gif-5752382'})
                interaction.channel.send({ content: "If so press Close below!", components: [row] })
            }
        })
    }
}