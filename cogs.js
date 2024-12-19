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
    },
    unloadCog(filePath, client) {
        module.name = path.parse(filePath).name;

        if (!client.cogs.get(module.name)) {
            console.log(`No such module loaded: ${module.name}`);
            return;
        }

        module = require(filePath);

        if (module.unload) {
            module.unload();
        }

        delete require.cache[require.resolve(filePath)];
        client.cogs.delete(module.name);
        console.log(`${module.name} cog unloaded.`);
    }
}
