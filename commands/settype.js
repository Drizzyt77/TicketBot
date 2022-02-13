const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('settype')
		.setDescription('Changes the Ticket Type')
		.addStringOption(option => option.setName('type').setRequired(true).setDescription('Type of Ticket')
			.addChoices([['General', 'General'],
			['Donation', 'Donation'],
			['Staff', 'Staff'],
			['25xPVP', '25xPVP'],
			['25xPVE', '25xPVE'],
			['50xPVE', '50xPVE'],
			['Empyrion', 'Empyrion'],
			['MOE', 'MOE'],
			['Report An Admin', 'Report']])),
	async execute(interaction) {
		sql.query("SELECT message FROM open WHERE channel = ?", [interaction.channel.id], function (err, result) {
			if (err) { }
			if (!result.length) {
				interaction.reply({ content: 'Invalid Channel!', ephemeral: true })
				return;
			}
			let results = Object.values(result[0])
			console.log(results[0])
			let intreply = interaction.options.getString('type')
			console.log(intreply)
			interaction.channel.messages.fetch(results[0])
				.then(message => sql.query("SELECT openmsg FROM titles WHERE type = ?", [intreply], function (err, result) {
					if (err) { }
					let msg = Object.values(result[0])[0]
					embed = new MessageEmbed()
						.setTitle('Please provide the following:')
						.setColor('#42f5e3')
						.addField('\u200b', `${msg}`)
					message.edit({ embeds: [embed] })
					sql.query("SELECT COUNT(type) FROM open WHERE type = ?", [intreply], function (err, result) {
						if (err) { }
						let new_num = Object.values(result[0])[0] + 1
						interaction.channel.edit({ name: `${intreply}-${("000" + new_num).slice(-4)}` })
						interaction.reply(`Updated ticket to ${intreply}`)
					})

				}))

		});
	}
};