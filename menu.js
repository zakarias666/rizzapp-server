const readline = require('readline');
const crypto = require('crypto');

class Menu {
    constructor(db) {
        this.db = db;
        this.selected = 1;
        this.state = 'menu';
        this.menu = [
            'Create new token',
            'Show all tokens',
            'Exit',
        ];
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        this.init();
    }

    init() {
        console.clear();
        this.drawMenu();
        this.listenForInput();
    }

    selectUp() {
        if (this.selected > 1 && this.state === 'menu') {
            this.selected--;
            this.drawMenu();
        }
        
    }

    selectDown() {
        if (this.selected < this.menu.length && this.state === 'menu') {
            this.selected++;
            this.drawMenu();
        }
        
    }

    drawMenu() {
        console.clear();
        for (let i = 1; i <= this.menu.length; i++) {
            if (this.selected === i) {
                console.log(`> ${this.menu[i - 1]}`);
            } else {
                console.log(`${this.menu[i - 1]}`);
            }
        }
    }

    listenForInput() {
        this.rl.input.on('keypress', (char, key) => {
            if (key.name === 'w') {
                this.selectUp();
            } else if (key.name === 's') {
                this.selectDown();
            } else if (key.name === 'return') {
                this.selectOption();
            } else if (key.name === 'q') {
                this.drawMenu();
                this.state = 'menu';
            }
        });
    }

    selectOption() {
        console.clear();
        this.state = this.menu[this.selected - 1].toLowerCase();
        console.log(`You selected: ${this.menu[this.selected - 1]}`);
        if (this.menu[this.selected - 1] === 'Exit') {
            console.log('Exiting...');
            this.rl.close();
            process.exit(0);
        } else if (this.menu[this.selected - 1] === 'Create new token') {
            this.rl.question('Number of uses: ', (answer) => {
                const numberOfUses = parseInt(answer, 10);
    
                if (isNaN(numberOfUses) || numberOfUses <= 0) {
                    console.log('Invalid number. Please enter a positive integer.');
                } else {
                    let token = crypto.randomBytes(3).toString('hex');
                    console.log(`New token: ${token}`);
                    console.log('\n')
                    this.db.insertKey(token, numberOfUses);
                }
            });
        } else if (this.menu[this.selected - 1] === 'Show all tokens') {
            this.db.getAllKeys().then((rows) => {
                rows.forEach((row) => {
                    console.log(`Token: ${row.key} | Uses left: ${row.uses}`);
                });
            });
        }
    }
}

module.exports = Menu;
