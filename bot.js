// index.js
const fs = require('fs');
const { Client, Collection, Intents, MessageEmbed, MessageActionRow, MessageButton, MessageCollector, MessageSelectMenu } = require('discord.js');
const { token, guildId } = require('./config.json');
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS] });
const Rcon = require('rcon');
const sql = require('./mysql/pool')
const kalpve = require('./mysql/kalpvepool')
const kalprimal = require('./mysql/kalprimalpool')
const kalomega = require('./mysql/kal50pool')
const log = require('./log')


client.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}


client.once('ready', () => {
	console.log("Ready!");
	client.guilds.fetch(`${guildId}`).then(guild => {
		setCmdPerms(guild)
		log.info("Ticket Bot Started Up!")
	});
});

async function setCmdPerms(guild) {
	const permissions2 = {
		id: guild.roles.everyone.id,
		type: 'ROLE',
		permission: false,
	};
	const permissions1 = {
		id: "702310697563979846",
		type: 'ROLE',
		permission: true,
	};
	let commandsList = await guild.commands.fetch();
	await commandsList.forEach(slashCommand => {
		log.info(`Changing command ${slashCommand.id}`);
		//set the permissions for each slashCommand
		guild.commands.permissions.add({
			command: slashCommand.id,
			permissions: [permissions1, permissions2]
		});
	});
};

let sql_results;
let link_results;

client.on('interactionCreate', async interaction => {
	async function openTicket(user, type) {
		console.log(`${type} ticket opened by ${user.displayName}`)
		log.info(`${type} ticket opened by ${user.displayName}`)
		sql.query("SELECT active, channel FROM open WHERE user = ? AND active = true", [user.id], function (err, result) {
			if (err) {
				log.err(err)
			}
			if (!result.length) {
				sql.query("SELECT COUNT(type) FROM open WHERE type = ?", [type], async function (err, result) {
					if (err) {
						log.err(err)
					}
					sql_results = JSON.stringify(Object.values(result[0])[0] + 1);
					const thread = interaction.channel.threads.create({
						name: `${type}-${("000" + sql_results).slice(-4)}`,
						reason: `Ticket opened by ${user}`,
						type: "GUILD_PRIVATE_THREAD",
						invitable: false,
						autoArchiveDuration: 4320
					}).then(ticket => replyTicket(ticket, user, type))

				})
			} else {
				let chid = Object.values(result[0])[1]
				log.info(`${interaction.user.username} attempted to open secondary ticket`)
				interaction.reply({ content: `You already have a ticket open here <#${chid}>`, ephemeral: true })
				return;
			}
		});

	}
	async function replyTicket(ticket, user, type) {
		interaction.reply({ content: `Your ticket has been created here <#${ticket.id}>`, ephemeral: true })
		let results;
		sql.query("SELECT openmsg FROM titles WHERE type = ?", type, async function (err, result) {
			if (err) {
				log.err(err)
			}
			results = Object.values(result[0])
			const embed = new MessageEmbed()
				.setColor('#42f5e3')
				.addField('Please provide the following:', `${results}`)
			const btn = new MessageActionRow()
				.addComponents(
					new MessageButton()
						.setCustomId('close_ticket')
						.setLabel('Close')
						.setStyle('DANGER')
				);

			await ticket.members.add(`${user.id}`);
			ticket.send({ content: `<@&845872958199431188>\n\n<@${user.id}>, Welcome! Please fill out the information below so we can better assist you!`, embeds: [embed], components: [btn] })
				.then(msg => sql.query("INSERT INTO open (type, user, channel, message, closemsg, active) VALUES (?, ?, ?, ?, ?, ?)", [type, user.id, ticket.id, msg.id, false, true], function(err, result){
					if (err) {
						log.err(err)
					}
				}))
		})
	}

	async function closeTicket() {
		const ticket = interaction.channel;
		interaction.deferUpdate();
		embed = new MessageEmbed()
			.setTitle(`Ticket closed by ${interaction.user.username}`)
			.setColor('#0xff0000');
		ticket.send({ embeds: [embed] });
		await new Promise(r => setTimeout(r, 1000));
		await ticket.setArchived(true);
		log.info(`${interaction.channel.name} closed by ${interaction.user.username}`)
		sql.query("Select closemsg FROM open WHERE channel = ?", [ticket.id], function (err, result) {
			if (err) {
				log.err(err)
			}
			let messaged = Object.values(result[0])[0]
			if (messaged === 0) {
				sql.query("Select user FROM open WHERE channel = ?", [ticket.id], async function (err, result) {
					if (err) {
						log.err(err)
					}
					let userid = Object.values(result[0])[0]
					const user = interaction.guild.members.cache.get(userid)
					const embed = new MessageEmbed()
						.setColor('0x00ff00')
					.addField(`Your ticket has been closed by ${interaction.user.username}`, `If you missed the response or wanted to look over the ticket you can find it here <#${ticket.id}>`);
					try {
						user.send({ embeds: [embed] }).catch(err => console.log("Failed to DM user"))
					} catch { }
					sql.query("UPDATE open SET closemsg = true, active = false WHERE channel = ?", [ticket.id], function (err, result) {
						if (err) {
							log.err(err)
						}
					});
				})
			} else { }
		})


	};

	async function openTestTicket(user, type) {
		console.log(`${type} ticket opened by ${user.displayName}`)
		log.info(`${type} ticket opened by ${user.username}`)
		sql.query("SELECT active, channel FROM open WHERE user = ? AND active = true", [user.id], function (err, result) {
			if (err) {
				log.err(err)
			}
			if (!result.length) {
				sql.query("SELECT COUNT(type) FROM open WHERE type = ?", [type], async function (err, result) {
					if (err) {
						log.err(err)
					}
					sql_results = JSON.stringify(Object.values(result[0])[0] + 1);
					const thread = interaction.channel.threads.create({
						name: `${interaction.member.displayName}'s Ticket`,
						reason: `Ticket opened by ${user}`,
						type: "GUILD_PRIVATE_THREAD",
						invitable: false,
						autoArchiveDuration: 60
					}).then(ticket => replyTestTicket(ticket, user, type))

				})
			} else {
				let chid = Object.values(result[0])[1]
				log.info(`${interaction.user.username} attempted to open secondary ticket`)
				interaction.reply({ content: `You already have a ticket open here <#${chid}>`, ephemeral: true })
				return;
			}
		});
	};

	async function replyTestTicket(ticket, user, type) {
		interaction.reply({ content: `Your ticket has been created here <#${ticket.id}>`, ephemeral: true })
		const closeBtn = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('cancel_ticket')
					.setLabel('Cancel')
					.setStyle('DANGER')
			);

		await ticket.members.add(`${user.id}`);
		ticket.send({
			content: `<@!143211928347475969>\n\n<a:sirin:937391110509182976> **IMPORTANT** <a:sirin:937391110509182976>\nYour ticket is not fully opened!\n<@${user.id}>, Please fill out the information requested or your ticket will not be responded to!`,
			components: [closeBtn]
		})
			.then(msg => sql.query("INSERT INTO open (type, user, channel, message, closemsg, active) VALUES (?, ?, ?, ?, ?, ?)", [type, user.id, ticket.id, msg.id, false, true], function (err, result) {
				if (err) {
					log.err(err)
				}
			}));
		sendClusterSelect(ticket);
	};

	function sendMapSelect(channel) {
		const embed1 = new MessageEmbed()
			.setTitle('Please Select the Map you need assistance on')
			.setColor('#0x00ff00')
		const btn = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('not_online_ark')
					.setLabel('I am not online')
					.setStyle('DANGER'),
				new MessageButton()
					.setCustomId('wrong_cluster_selected')
					.setLabel('Change Cluster')
					.setStyle('SUCCESS')
			);
		const row = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId('map_selection')
					.setPlaceholder('Select Map!')
					.addOptions([
						{
							label: 'Crystal Isles',
							value: 'Crystal Isles',
						},
						{
							label: 'Genesis Part:2',
							value: 'Genesis Part:2',
						},
						{
							label: 'Lost Island',
							value: 'Lost Island',
						},
						{
							label: 'Ragnarok',
							value: 'Ragnarok',
						},
						{
							label: 'The Island',
							value: 'The Island',
						},
						{
							label: 'Extinction',
							value: 'Extinction',
						},
						{
							label: 'Fjordur',
							value: 'Fjordur',
						},
						{
							label: 'Talamh',
							value: 'Talamh',
						},
					]),
			);
		channel.send({ embeds: [embed1], components: [btn, row] });

	}

	function sendClusterSelect(channel) {
		const embed1 = new MessageEmbed()
			.setTitle('Please Select the Cluster you need assistance on')
			.setColor('#0x00ff00')

		const row = new MessageActionRow()
			.addComponents(
				new MessageSelectMenu()
					.setCustomId('cluster_selection')
					.setPlaceholder('Select Cluster!')
					.addOptions([
						{
							label: 'Omega',
							value: 'omega',
						},
						{
							label: '25x PVE',
							value: '25xpve',
						},
						{
							label: '50x PVE',
							value: '50xpve',
						},
					]),
			);
		channel.send({ embeds: [embed1], components: [row] });

	}

	function checkLinked(user, channel, db) {
		var sqldb = db.replace('25x', '').replace('50xpve', 'primal') + 'kaldiscord'
		if (sqldb === 'pvekaldiscord') {
			kalpve.query("SELECT SteamId FROM discordsteamlinks WHERE DiscordId = ?", [user.id], function (err, player) {
				if (err) {
					log.err(err)
				}
				if (!player.length) {
					const btn = new MessageActionRow()
						.addComponents(
							new MessageButton()
								.setCustomId('retry_steam')
								.setLabel("I've linked my steam!")
								.setStyle('SUCCESS')
						);
					let embed = new MessageEmbed()
						.setTitle("Retry after linking")
						.setColor('FUCHSIA')
						.addField('Steam to Discord Link', `To link your SteamID to discord go here <#867869506566357032> and find your cluster and press the Link button`)
					interaction.channel.send({ embeds: [embed], components: [btn] });
				} else {
					sql.query("UPDATE open SET linked = ? WHERE channel = ?", [true, channel.id], function (err, results) {
						if (err) {
							log.err(err)
						}
					});
					sendTicketInfo(user, channel, Object.values(player[0])[0]);
				}
			})
		} else if (sqldb === 'primalkaldiscord') {
			kalprimal.query("SELECT SteamId FROM discordsteamlinks WHERE DiscordId = ?", [user.id], function (err, player) {
				if (err) {
					log.err(err)
				}
				if (!player.length) {
					const btn = new MessageActionRow()
						.addComponents(
							new MessageButton()
								.setCustomId('retry_steam')
								.setLabel("I've linked my steam!")
								.setStyle('SUCCESS')
						);
					let embed = new MessageEmbed()
						.setTitle("Retry after linking")
						.setColor('FUCHSIA')
						.addField('Steam to Discord Link', `To link your SteamID to discord go here <#867869506566357032> and find your cluster and press the Link button`)
					interaction.channel.send({ embeds: [embed], components: [btn] });
				} else {
					sql.query("UPDATE open SET linked = ? WHERE channel = ?", [true, channel.id], function (err, results) {
						if (err) {
							log.err(err)
						}
					});
					sendTicketInfo(user, channel, Object.values(player[0])[0]);
				}
			})
		} else if (sqldb === 'omegakaldiscord') {
			kalomega.query("SELECT SteamId FROM discordsteamlinks WHERE DiscordId = ?", [user.id], function (err, player) {
				if (err) {
					log.err(err)
				}
				if (!player.length) {
					const btn = new MessageActionRow()
						.addComponents(
							new MessageButton()
								.setCustomId('retry_steam')
								.setLabel("I've linked my steam!")
								.setStyle('SUCCESS')
						);
					let embed = new MessageEmbed()
						.setTitle("Retry after linking")
						.setColor('FUCHSIA')
						.addField('Steam to Discord Link', `To link your SteamID to discord go here <#867869506566357032> and find your cluster and press the Link button`)
					interaction.channel.send({ embeds: [embed], components: [btn] });
				} else {
					sql.query("UPDATE open SET linked = ? WHERE channel = ?", [true, channel.id], function (err, results) {
						if (err) {
							log.err(err)
						}
					});
					sendTicketInfo(user, channel, Object.values(player[0])[0]);
				}
			})
		}
    }

	async function sendTicketInfo(user, channel, steamid) {
		let full_open;
		let t_info = [];
		let embed = new MessageEmbed()
			.setTitle("Gathering Player Information...")
		channel.send({ embeds: [embed] }).then(message => {
			setTimeout(() => message.delete(), 15000)
		}
		);
		sql.query("SELECT mapname, type FROM open WHERE channel = ?", [channel.id], async function (err, mapname) {
			if (err) { }
			map = Object.values(mapname[0])[0]
			cluster = Object.values(mapname[0])[1]
			console.log(map)
			console.log(cluster)
			var port;
			var ip;
			var pass;
			switch (cluster) {
				case 'omega':
					ip = '108.61.29.210';
					pass = 'rcon247ayyitslit247';
					switch (map) {
						case 'Fjordur':
							port = 32331;
							break;
						case 'Ragnarok':
							port = 32330;
							break;
						case 'Talamh':
							port = 32332;
							break;
					};
					break;
				case '25xpve':
					ip = '108.61.40.26';
					pass = 'rcon247ayyitslit247.!!';
					switch (map) {
						case 'Crystal Isles':
							port = 27028;
							break;
						case 'Genesis Part:2':
							port = 27023;
							break;
						case 'Lost Island':
							port = 27024;
							break;
						case 'Ragnarok':
							port = 27030;
							break;
						case 'The Island':
							port = 27022;
							break;
						case 'Extinction':
							port = 27020;
							break;
						case 'Aberration':
							port = 27018;
							break;
					}
					break;
				case '50xpve':
					ip = '108.61.8.66'
					pass = 'CGHBFXT9utenYtUL';
					switch (map) {
						case 'Crystal Isles':
							port = 27031;
							break;
						case 'Genesis Part:2':
							port = 27023;
							break;
						case 'Lost Island':
							port = 27027;
							break;
						case 'Ragnarok':
							port = 27021;
							break;
						case 'The Island':
							port = 27029;
							break;
						case 'Extinction':
							port = 27025;
							break;
					}
					break;
			};
			console.log(port)
			console.log(steamid)
			let conn = new Rcon(ip, port, pass);
			conn.on('auth', async function () {
				console.log("Authenticated RCON")
			}).on('response', function (str) {
				t_info.push(str)
				response = str
				console.log(`RCON Response: ${str}`);
			}).on('error', function (err) {
				console.log(`RCON Error: ${err}`)
			}).on('end', function () {
				console.log("RCON Connected Closed");
			})
			conn.connect();
			await new Promise(r => setTimeout(r, 2000));
			conn.send(`GetPlayerName ${steamid}`)
			await new Promise(r => setTimeout(r, 2000));
			conn.send(`GetPlayerPos ${steamid}`)
			await new Promise(r => setTimeout(r, 2000));
			conn.send(`GetTribeName ${steamid}`)
			await new Promise(r => setTimeout(r, 2000));
			conn.disconnect();
			var info = t_info.filter(e => e !== 'Server received, But no response!! \n ' && e !== "Can't find player from the given steam id")
			console.log(info)
			try {
				embed1 = new MessageEmbed()
					.setTitle("Ticket Information")
					.setColor('DARK_PURPLE')
					.addField('Player', `${info[0].replace('Playername - ', '')}`, false)
					.addField('Map', `${map}`, false)
					.addField('Player Coordinates', `cheat SetPlayerPos ${info[1].replace('X=', '').replace('Y=', '').replace('Z=', '')}`, false)
					.addField('Tribe Name', `${info[2].replace('Tribename: ', '')}`, false);
				full_open = true;

			} catch (err) {
				log.err(err)
				channel.send(`Unable to find an Online player on ${map} please make sure you're logged on and try again`).then(message => {
					setTimeout(() => message.delete(), 10000)
				})
				await new Promise(r => setTimeout(r, 2000));
				return sendMapSelect(channel);
			}
			if (full_open) {
				channel.send({ embeds: [embed1] });
				sql.query("UPDATE open SET fullopen = ? WHERE channel = ?", [true, channel.id], function (err, results) {
					if (err) {
						log.err(err)
					}
				});
			}
			const btn = new MessageActionRow()
				.addComponents(
					new MessageButton()
						.setCustomId("ticket_ready")
						.setLabel("Ticket Filled Out")
						.setStyle("SUCCESS")
				);
			let final_embed = new MessageEmbed()
				.setTitle("Please list the issue you're having below and when you've finished press the button below!")
				.setColor("DARK_BLUE")
				.addField("Disclaimer", "If this information isn't filled out, this ticket may be closed with no response, the idea of this is to improve speed of our responses");
			channel.send({ embeds: [final_embed], components: [btn] });
		});
	};

	function sendNotOnlineInfo(channel) {
		const embed = new MessageEmbed()
			.setTitle("You've selected that you're not online!")
			.addField('Important', 'By selecting this option you are agreeing to supply all information requested so we can better assist you.\n\n \
						If this information is not supplied we will not be able to help you!\n\nPlease confirm below')
			.setColor('DARK_RED');

		const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId('deny_offline_ark')
					.setLabel('I am now online')
					.setStyle('SUCCESS'),
				new MessageButton()
					.setCustomId('confirm_offline_ark')
					.setLabel('I agree to the above')
					.setStyle('DANGER')
		);

		channel.send({ embeds: [embed], components: [row] });
    }

	function sendOfflineInfo(channel) {
		sql.query("SELECT type FROM open WHERE channel = ?", [channel.id], async function (err, cl) {
			if (err) {
				log.err(err)
			}
			cluster = Object.values(cl[0])
			sql.query("SELECT openmsg FROM titles WHERE type = ?", [cluster], async function (err, result) {
				if (err) {
					log.err(err)
				}
				results = Object.values(result[0])
				const embed = new MessageEmbed()
					.setColor('#42f5e3')
					.addField('Please provide the following:', `${results}`)
				const btn = new MessageActionRow()
					.addComponents(
						new MessageButton()
							.setCustomId('manual_open_ticket')
							.setLabel('Open Ticket')
							.setStyle('SUCCESS')
					);
				channel.send({ embeds: [embed], components: [btn] });
			})
		})
	}

	function cancelTicket(channel) {
		console.log(`${channel.name} ticket canceled by ${interaction.member.username}`)
		log.info(`${channel.name} ticket canceled by ${interaction.member.username}`)
		channel.delete();
    }

	if (interaction.isButton()) {
		if (interaction.customId === "general") {
			openTicket(interaction.user, 'general');
		} else if (interaction.customId === "donation") {
			openTicket(interaction.user, 'donation')
		} else if (interaction.customId === "staffapp") {
			openTicket(interaction.user, 'staff')
		} else if (interaction.customId === "25xpvp") {
			openTicket(interaction.user, '25xpvp')
		} else if (interaction.customId === "25xpve") {
			openTicket(interaction.user, '25xpve')
		} else if (interaction.customId === "50xpve") {
			openTicket(interaction.user, '50xpve')
		} else if (interaction.customId === "empyrion") {
			openTicket(interaction.user, 'empyrion')
		} else if (interaction.customId === "mythofempires") {
			openTicket(interaction.user, 'myth of empires')
		} else if (interaction.customId === "reportanadmin") {
			openTicket(interaction.user, 'report an admin')
		} else if (interaction.customId === 'ark') {
			openTestTicket(interaction.member, 'ark')
		} else if (interaction.customId === "close_ticket") {
			closeTicket()
		} else if (interaction.customId === "testticket") {
			if (interaction.user.id === "143211928347475969" || interaction.user.id === "114956072288124932") {
				openTestTicket(interaction.user, 'testticket')
			}
		} else if (interaction.customId === 'retry_steam') {
			interaction.message.delete();
			sendMapSelect(interaction.channel);
		} else if (interaction.customId === 'ticket_ready') {
			interaction.message.delete();

			sql.query("SELECT message FROM open WHERE channel = ?", [interaction.channel.id], function (err, result) {
				if (err) {
					log.err(err)
				}
				let row = new MessageActionRow()
					.addComponents(
						new MessageButton()
							.setCustomId('close_ticket')
							.setLabel('Close')
							.setStyle("DANGER")
					);
				interaction.channel.messages.fetch(`${Object.values(result[0])[0]}`).then(message => message.edit({ content: `<@&845872958199431188>\n\n${interaction.user} your ticket is now opened please wait for Staff to review!`, components: [row] }));
				sql.query("SELECT type FROM open WHERE channel = ?", [interaction.channel.id], function (err, results) {
					if (err) {
						log.err(err)
					}
					sql.query("SELECT COUNT(type) FROM open WHERE type = ?", [Object.values(results[0])[0]], function (err, result) {
						if (err) {
							log.err(err)
						}
						interaction.channel.edit({ name: `${Object.values(results[0])[0]}-${("000" + Object.values(result[0])[0]).slice(-4)}`, autoArchiveDuration: 4320 })
					})
				})
			})
		} else if (interaction.customId === 'not_online_ark') {
			interaction.message.delete();
			sendNotOnlineInfo(interaction.channel);
		} else if (interaction.customId === 'deny_offline_ark') {
			interaction.message.delete();
			sendMapSelect(interaction.channel);
		} else if (interaction.customId === 'confirm_offline_ark') {
			interaction.message.delete();
			sendOfflineInfo(interaction.channel);
		} else if (interaction.customId === 'manual_open_ticket') {
			interaction.deferUpdate();
			const btn = new MessageActionRow()
				.addComponents(
					new MessageButton()
						.setCustomId('close_ticket')
						.setLabel('Close')
						.setStyle('DANGER')
				);
			interaction.message.edit({ components: [btn] })
			sql.query("SELECT message FROM open WHERE channel = ?", [interaction.channel.id], function (err, result) {
				if (err) {
					log.err(err)
				}
				interaction.channel.messages.fetch(`${Object.values(result[0])[0]}`).then(msg => msg.edit({ content: `<@&845872958199431188>\n\n${interaction.user} your ticket is now open, please give admins some time to review!`, components: undefined }));
				sql.query("SELECT type FROM open WHERE channel = ?", [interaction.channel.id], function (err, results) {
					if (err) {
						log.err(er)
					}
					sql.query("SELECT COUNT(type) FROM open WHERE type = ?", [Object.values(results[0])[0]], function (err, result) {
						if (err) {
							log.err(err)
						}
						interaction.channel.edit({ name: `${Object.values(results[0])[0]}-${("000" + Object.values(result[0])[0]).slice(-4)}`, autoArchiveDuration: 4320 })
						console.log(`Ticket ${Object.values(results[0])[0]}-${("000" + Object.values(result[0])[0]).slice(-4)} closed by ${interaction.member.displayName}`)
					})
				})
			})

		} else if (interaction.customId === 'wrong_cluster_selected') {
			interaction.message.delete();
			sendClusterSelect(interaction.channel);
		} else if (interaction.customId === 'cancel_ticket') {
			interaction.deferUpdate();
			cancelTicket(interaction.channel);
		}
	};
	if (interaction.isSelectMenu()) {
		if (interaction.customId === 'map_selection') {
			interaction.deferUpdate();
			interaction.message.delete();
			sql.query("UPDATE open SET mapname = ? WHERE channel = ?", [interaction.values[0], interaction.channel.id], function (err, results) {
				if (err) {
					log.err(err)
				}
			});
			sql.query('SELECT type FROM open WHERE channel = ?', [interaction.channel.id], function (err, results) {
				if (err) {
					log.err(err)
				}
				checkLinked(interaction.user, interaction.channel, Object.values(results[0])[0]);
			})
		} else if (interaction.customId === 'cluster_selection') {
			let cluster = interaction.values[0]
			switch (cluster) {
				case 'omega':
					rname = 'ARK PVE';
					break;
				case '25xpve':
					rname = 'ARK PVE';
					break;
				case '50xpve':
					rname = 'ARK PVE';
					break;
			}
			let role = interaction.guild.roles.cache.find((r) =>
				r.name === `${rname}`);
			if (!interaction.member.roles.cache.some(erole => erole.name === role.name)) {
				interaction.member.roles.add(role)
			}
			interaction.deferUpdate();
			interaction.message.delete();
			sql.query("UPDATE open SET type = ? WHERE channel = ?", [interaction.values[0], interaction.channel.id], function (err, results) {
				if (err) {
					log.err(err)
				}
			});
			sendMapSelect(interaction.channel);
		}
	}
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		log.err(error)
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.on('threadUpdate', async interaction => {
	if (interaction.messages.channel.archived) {
		sql.query("UPDATE open SET active = ? WHERE channel = ?", [false, interaction.id], function (err, results) {
			if (err) {
				log.err(err)
			}
		})
	}
});

client.on('threadDelete', async channel => {
	log.info(`${channel.name} force deleted`)
	sql.query("DELETE FROM open WHERE channel  = ?", [channel.id], function (err, results) {
		if (err) {
			log.err(err)
		}
	});
})


client.login(token)