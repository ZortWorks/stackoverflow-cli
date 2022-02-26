import arg from 'arg';
import inquirer from 'inquirer';
import axios from 'axios';
function parseArgs(inpArgs) {
    const args = arg({ "--help": Boolean }, { argv: inpArgs.slice(2), });
    return {
        showHelp: args['--help'] || false
    };
}

async function ask(options) {
    if (options.showHelp) {
        return {
            ...options,
            select: options.select
        };
    }
    const questions = [];
    if (!options.select) {
        questions.push({
            type: 'list',
            name: 'select',
            message: 'What do you want to do?',
            choices: ['Search'],
        });
    }

    const answer = await inquirer.prompt(questions);
    return {
        ...options,
        select: options.select || answer.select
    };
}

export async function cli(args) {
    let options = parseArgs(args);
    options = await ask(options);
    if (options.showHelp) {
        console.log(`stackoverflow-cli - surf on stackoverflow with command line\n\n   Usage:\n        stackoverflow-cli <options>`)
    }
    if (options.select) {
        if (options.select === "Search") {
            const answer = await inquirer.prompt({
                type: "input",
                name: "search",
                message: "Search:",
            })
            axios({
                method: "GET",
                url: `https://api.stackexchange.com/2.3/search/advanced?q=${encodeURIComponent(answer.search)}&site=stackoverflow&filter=!nKzQUR30W7`//&filter=!)AOoHyu3SbfGkYn
            }).then(async (response) => {
                var data = response.data
                if (data.items.length < 1) return console.log("Can't find anything...")
                const itemArr = []
                for (var i = 0; i < 10; i++) {
                    if (data.items[i]) {
                        itemArr.push(data.items[i])
                    }
                }
                const itemStrings = []
                itemArr.forEach(items => {
                    itemStrings.push(items.title)
                })
                const selectQuestion = await inquirer.prompt({
                    type: "list",
                    name: "itemTitle",
                    message: "Search Queries:",
                    choices: itemStrings
                })
                const selectedItem = itemArr.find(item => item.title === selectQuestion.itemTitle)
                axios({
                    method: "GET",
                    url: `https://api.stackexchange.com/2.3/questions/${selectedItem.question_id}/answers?site=stackoverflow&filter=!nKzQURFm1M`
                }).then(async (response) => {
                    var data = response.data
                    if (!data) return
                    if (data.items.length > 0) {
                        console.log(`\x1b[1m\x1b[36mQuestion:\x1b[0m \x1b[33m[${selectedItem.owner.display_name}]\x1b[0m ${selectedItem.title} (https://stackoverflow.com/q/${selectedItem.question_id})\n${selectedItem.body_markdown.length > 250 ? selectedItem.body_markdown.slice(0, 250).concat(`...`) : selectedItem.body_markdown}`)
                        console.log(`\x1b[1m\x1b[36mAnswer:\x1b[0m \x1b[33m[${data.items[0].owner.display_name}]\x1b[0m (https://stackoverflow.com/a/${data.items[0].answer_id})\n${data.items[0].body_markdown.length > 250 ? data.items[0].body_markdown.slice(0, 250).concat(`...\n\n\x1b[37mFull page answer: https://stackoverflow/a/${data.items[0].answer_id}\x1b[0m`) : data.items[0].body_markdown}`)
                    } else {
                        console.log(`\x1b[1m\x1b[36mQuestion:\x1b[0m \x1b[33m[${selectedItem.owner.display_name}]\x1b[0m ${selectedItem.title} (https://stackoverflow.com/q/${selectedItem.question_id})`)
                        console.log(`\x1b[1m\x1b[36mAnswer:\x1b[0m No one answered this question.`)
                    }
                })
            })

        }
    }
}