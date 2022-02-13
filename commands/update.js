const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Updates Ticket Bot to latest version'),

    async execute(interaction) {
    }
}