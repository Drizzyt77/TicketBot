const { SlashCommandBuilder } = require('@discordjs/builders')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketban')
        .setDescription('Bans a user from Opening Tickets')
        .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true)),

    async execute(interaction) {
        let user = interaction.options.getUser('user')
    }
}