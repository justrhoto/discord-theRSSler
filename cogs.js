const path = require('node:path')

module.exports = {
    initializeCog(filePath, client) {
        module = require(filePath)
        module.name = path.parse(filePath).name;

        if (module.init) {
            module.init(client);
        }

        const loadCommand = (command) => {
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                console.log(`${module.name} command loaded: ${command.data.name}`);
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property`);
            }
        }

        if (module.commands) {
            module.commands.forEach((command) => loadCommand(command));
        } else {
            loadCommand(module);
        }
        client.cogs.set(module.name, filePath);
        console.log(`${module.name} cog finished loading.`);
    }
}
