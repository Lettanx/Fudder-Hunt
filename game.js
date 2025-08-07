// Oyunun temel konfigürasyon ayarları
const config = {
    type: Phaser.AUTO,
    width: 2560,
    height: 1440,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Global değişkenler
let duck;
let score = 0;
let bullets = 3;
let isGameOver = false;
let speedMultiplier = 1;
let startScreen;
let startArea;
let loadingText;

function preload() {
    this.load.image('background', 'assets/images/background.png');
    this.load.image('duck', 'assets/images/fudders.png');
    this.load.audio('gun_shot', 'assets/sounds/shoot.mp3');
    this.load.audio('duck_death', 'assets/sounds/death.mp3');
    this.load.audio('start_music', 'assets/sounds/start.mp3'); // 🎵 Müzik eklendi
    this.load.image('entrance', 'assets/images/entrance.png');
}

function create() {
    startScreen = this.add.image(config.width / 2, config.height / 2, 'entrance').setOrigin(0.5);
    startScreen.displayHeight = config.height;
    startScreen.displayWidth = (startScreen.width * config.height) / startScreen.height;

    startArea = this.add.rectangle(config.width / 2, config.height - 150, 400, 100, 0xffffff, 0);
    startArea.setInteractive();
    startArea.on('pointerdown', function (pointer) {
        pointer.event.stopPropagation();
        startGameMusic.call(this); // 🎵 Önce müziği çal
    }, this);

    isGameOver = true;
}

function update() {
    if (isGameOver) return;

    if (duck.y < 50 && duck.active && !duck.isFalling) {
        duck.setVelocityY(Math.abs(duck.body.velocity.y));
    }

    if (duck.y > config.height - 50 && duck.active && !duck.isFalling) {
        duck.setVelocityY(-Math.abs(duck.body.velocity.y));
    }

    if (duck.x > config.width - 700 && duck.active) {
        duck.setVelocityX(-Math.abs(duck.body.velocity.x));
    } else if (duck.x < 700 && duck.active) {
        duck.setVelocityX(Math.abs(duck.body.velocity.x));
    }

    if (duck.y > config.height + 50 && duck.isFalling) {
        duck.disableBody(true, true);
        this.time.delayedCall(100, spawnDuck, [], this);
    }
}

// 🎵 Start ekranından sonra müzik çalacak
function startGameMusic() {
    // Giriş ekranını ve alanı kaldır
    startScreen.destroy();
    startArea.destroy();

    // Loading yazısı
    loadingText = this.add.text(config.width / 2, config.height / 2, 'Loading...', {
        fontSize: '64px',
        fill: '#ffffff',
        fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    // Müziği çal
    const music = this.sound.add('start_music');
    music.play();

    // Müzik bitince oyunu başlat
    music.once('complete', () => {
        loadingText.destroy(); // Loading yazısını kaldır
        realStartGame.call(this); // Gerçek oyun başlasın
    });
}

// 🎮 Asıl oyun başlangıcı
function realStartGame() {
    const bg = this.add.image(config.width / 2, config.height / 2, 'background').setOrigin(0.5);
    bg.displayHeight = config.height;
    bg.displayWidth = (bg.width * config.height) / bg.height;

    isGameOver = false;
    spawnDuck.call(this);

    this.time.delayedCall(200, () => {
        this.input.on('pointerdown', function (pointer) {
            if (bullets > 0 && !isGameOver) {
                bullets--;
                document.getElementById('bullets-container').innerHTML = 'Bullets: ' + bullets;
                this.sound.play('gun_shot');
                if (duck.getBounds().contains(pointer.x, pointer.y) && duck.active && !duck.isFalling) {
                    handleDuckHit.call(this);
                }
            }
            if (bullets === 0 && !isGameOver && (!duck || !duck.isFalling)) {
                createGameOverScreen.call(this);
            }
        }, this);
    });
}

function createGameOverScreen() {
    isGameOver = true;
    duck.disableBody(true, true);

    const gameOverText = this.add.text(config.width / 2, config.height / 2 - 100, 'GAME OVER!', {
        fontSize: '128px',
        fill: '#ff0000',
        fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    const buttonBg = this.add.rectangle(config.width / 2, config.height / 2 + 50, 400, 100, 0x888888).setInteractive();
    const tryAgainText = this.add.text(config.width / 2, config.height / 2 + 50, 'Try Again', {
        fontSize: '64px',
        fill: '#ffffff',
        fontFamily: 'sans-serif'
    }).setOrigin(0.5);

    buttonBg.on('pointerover', function () {
        buttonBg.setFillStyle(0xaaaaaa);
        tryAgainText.setFill('#eeeeee');
    });
    buttonBg.on('pointerout', function () {
        buttonBg.setFillStyle(0x888888);
        tryAgainText.setFill('#ffffff');
    });

    buttonBg.on('pointerdown', function () {
        location.reload();
    });
}

function spawnDuck() {
    const spawnX = Phaser.Math.Between(700, config.width - 700);
    const directionX = Phaser.Math.Between(0, 1) === 0 ? 1 : -1;
    let horizontalVelocity = 0;
    if (Phaser.Math.Between(0, 1) === 0) {
        horizontalVelocity = directionX * Phaser.Math.Between(100, 200) * speedMultiplier;
    }

    const verticalVelocity = -Phaser.Math.Between(200, 300) * speedMultiplier;

    if (duck) {
        duck.enableBody(true, spawnX, config.height + 50, true, true);
        duck.setVelocityY(verticalVelocity);
        duck.setVelocityX(horizontalVelocity);
        duck.isFalling = false;
        duck.setRotation(0);
        duck.setInteractive();
    } else {
        duck = this.physics.add.image(spawnX, config.height + 50, 'duck');
        duck.setInteractive();
        duck.setScale(1);
        duck.setVelocityY(verticalVelocity);
        duck.setVelocityX(horizontalVelocity);
        duck.isFalling = false;
        duck.on('pointerdown', function () {
            handleDuckHit.call(this);
        }, this);
    }

    bullets = 3;
    document.getElementById('bullets-container').innerHTML = 'Bullets: ' + bullets;
}

function handleDuckHit() {
    this.sound.play('duck_death');
    duck.disableInteractive();
    duck.isFalling = true;
    duck.body.setVelocityY(800);
    duck.body.setVelocityX(0);
    duck.setRotation(0);
    score += 10;
    speedMultiplier += 0.2;
    document.getElementById('score-container').innerHTML = 'Score: ' + score;
}
