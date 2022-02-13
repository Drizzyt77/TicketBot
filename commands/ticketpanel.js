const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ticketpanel')
		.setDescription('Creates the ticket panel'),
	async execute(interaction) {
		const { MessageActionRow, MessageButton } = require('discord.js')
		const { servers } = require('../config.json')
		const row = new MessageActionRow()
		const row2 = new MessageActionRow()
		let count = 0
		for (let [server, color] of Object.entries(servers)) {
			if (count >= 5) {
				row.addComponents(
				new MessageButton()
					.setCustomId(`${server.toLowerCase().replace(/\s/g, '')}`)
					.setLabel(`${server}`)
					.setStyle(`${color}`)

				);
			} else {
				row2.addComponents(
					new MessageButton()
						.setCustomId(`${server.toLowerCase().replace(/\s/g, '')}`)
						.setLabel(`${server}`)
						.setStyle(`${color}`)
				);
            }
			
			count += 1
		}
		sql.query("SELECT type, description FROM titles WHERE id <> 4 AND id <> 5 AND id <> 6", null, async function (er, result) {
			if (err) { }
			let results = Object.values(result);
			let descriptions =[];
			for (const r of results) {
				descriptions.push([`${Object.values(r)[0]}`, `${Object.values(r)[1]}`])
			}
			embed = new MessageEmbed()
				.setTitle('Please read below to ensure the correct ticket is opened. An admin will respond as soon as possible!');
			for (const d of descriptions) {
				embed.addField(`${d[0]}`, `${d[1]}`, false);
			}
			await interaction.reply({ embeds: [embed], components: [row2, row] })
		})
	},
};