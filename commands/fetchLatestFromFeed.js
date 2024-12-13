const { SlashCommandBuilder } = require('discord.js');
const Parser = require('rss-parser');

const parser = new Parser();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('fetch')
		.setDescription('Fetch latest post from RSS feed at URL')
        .addStringOption(option => option
            .setName('rss_url')
            .setDescription('The RSS feed URL')
            .setRequired(true)
        ),
	async execute(interaction) {
        console.log(interaction.options.getString('rss_url'));
        await interaction.deferReply({ ephemeral: true });

        const feed = await parser.parseURL(interaction.options.getString('rss_url'));

		const firstItemUrl = feed.items[0].content.match(/https?:\/\/.*?.jpg/)[0];
		await interaction.editReply(`${firstItemUrl}`);
	},
};