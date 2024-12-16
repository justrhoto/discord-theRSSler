const { SlashCommandBuilder } = require('discord.js')

const cogs = require('../cogs')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reloads a command cog.')
        .addStringOption(option => option
            .setName('cog_name')
            .setDescription('The name of the cog you want to reload')
            .setRequired(true)
        ),
    async execute(interaction) {
        interaction.deferReply({ ephemeral: true });

        if (interaction.user.id != process.env.ADMIN_USER_ID) {
            interaction.editReply('You must be an admin to run this command.');
            return;
        }

        const cogName = interaction.options.getString('cogName', true);
        const cogPath = interaction.client.cogs.get(cogName);

        if (!cogPath) {
            return interaction.editReply(`There is no such cog loaded: \`${cogName}\`.`);
        }

        delete require.cache[require.resolve(cogPath)];
        cogs.initializeCog(cogPath, interaction.client);
        interaction.editReply(`Cog ${cogName} reloaded!`);
    }
}