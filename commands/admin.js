const fs = require('node:fs');
const path = require('node:path');
const { SlashCommandBuilder } = require('discord.js')

const cogs = require('../cogs')

module.exports = {
    commands: [{
        data: new SlashCommandBuilder()
            .setName('reload')
            .setDescription('Reloads a command cog.')
            .addStringOption(option => option
                .setName('cog_name')
                .setDescription('The cog that you want to reload')
                .setRequired(true)
            ),
        async execute(interaction) {
            await interaction.deferReply({ ephemeral: true });

            if (interaction.user.id != process.env.ADMIN_USER_ID) {
                await interaction.editReply('You must be an admin to run this command.');
                return;
            }

            const cogName = interaction.options.getString('cog_name', true);
            const cogPath = interaction.client.cogs.get(cogName);

            if (!cogPath) {
                await interaction.editReply(`There is no such cog loaded: \`${cogName}\`.`);
                return;
            }

            cogs.unloadCog(cogPath, interaction.client);
            cogs.initializeCog(cogPath, interaction.client);
            await interaction.editReply(`Cog ${cogName} reloaded!`);
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('unload')
            .setDescription('Unloads a command cog.')
            .addStringOption(option => option
                .setName('cog_name')
                .setDescription('The cog that you want to unload')
                .setRequired(true)
            ),
        async execute(interaction) {
            await interaction.deferReply({ ephemeral: true });

            if (interaction.user.id != process.env.ADMIN_USER_ID) {
                await interaction.editReply('You must be an admin to run this command.');
                return;
            }

            const cogName = interaction.options.getString('cog_name', true);
            const cogPath = interaction.client.cogs.get(cogName);

            if (!cogPath) {
                await interaction.editReply(`There is no such cog loaded: \`${cogName}\`.`);
                return;
            }

            cogs.unloadCog(cogPath, interaction.client);
            await interaction.editReply(`Cog ${cogName} unloaded.`);
        }
    },
    {
        data: new SlashCommandBuilder()
            .setName('load')
            .setDescription('Loads a command cog.')
            .addStringOption(option => option
                .setName('cog_name')
                .setDescription('The cog that you want to load')
                .setRequired(true)
            ),
        async execute(interaction) {
            await interaction.deferReply({ ephemeral: true });

            if (interaction.user.id != process.env.ADMIN_USER_ID) {
                await interaction.editReply('You must be an admin to run this command.');
                return;
            }

            const cogName = interaction.options.getString('cog_name', true);

            if (interaction.client.cogs.get(cogName)) {
                await interaction.editReply(`Cog is already loaded: \`${cogName}\`.`);
                return;
            }

            const cogFile = fs.readdirSync(__dirname).filter(file => file.endsWith('.js') && path.parse(file).name == cogName);
            const cogPath = path.join(__dirname, cogFile[0]);

            cogs.initializeCog(cogPath, interaction.client);
            await interaction.editReply(`Cog ${cogName} loaded.`);
        }
    }]
}