const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketsearch')
        .setDescription('Search all tickets from a User')
        .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true)),

    async execute(interaction) {
        let user = interaction.options.getUser('user')
        sql.query("SELECT channel FROM open WHERE user = ?", [user.id], async function (err, result) {
            if (err) { }
            if (!result.length) {
                console.log("No results")
                interaction.reply({ content: "User has created no tickets!", ephemeral: true })
            } else {
                console.log("Results")
                let channels = []
                let results = Object.values(result)
                for (const r of results) {
                    channels.push(`<#${Object.values(r)[0]}>`)
                }
                embed = new MessageEmbed()
                    .setTitle("Ticket Search")
                    .setColor('DARK_BLUE')
                    .addField(`${user.username}`, `${channels.join(' | ')}`);
                interaction.reply({ embeds: [embed] });

            }
        })
    }

};