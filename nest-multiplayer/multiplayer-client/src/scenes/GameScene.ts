import Phaser from 'phaser';
import io from 'socket.io-client';

export class GameScene extends Phaser.Scene {
  private socket: any; // todo SocketIOClient.Socket; fix any
  private players: { [id: string]: Phaser.GameObjects.Sprite } = {};
  private player: Phaser.GameObjects.Sprite;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.image('human', 'assets/human.png');
    this.load.image('monster', 'assets/monster.png');
    this.load.image('neutral', 'assets/neutral.png');
  }

  create() {
    this.socket = io('http://localhost:3000');
    this.cursors = this.input.keyboard!.createCursorKeys(); // todo check keyboard exists

    this.socket.on('connect', () => {
      this.socket.emit('joinGame', { type: 'human', subtype: 'warrior' });
    });

    this.socket.on('playerJoined', (player: any) => {
      this.addPlayer(player);
    });

    this.socket.on('playerMoved', (playerInfo: { id: string, x: number, y: number }) => {
      this.players[playerInfo.id].setPosition(playerInfo.x, playerInfo.y);
    });

    this.socket.on('playerDamaged', (data: { id: string, health: number }) => {
      // Обновить отображение здоровья игрока
    });

    this.socket.on('playerDied', (id: string) => {
      if (this.players[id]) {
        this.players[id].destroy();
        delete this.players[id];
      }
    });
  }

  update() {
    if (this.player) {
      let moved = false;
      if (this.cursors.left.isDown) {
        this.player.x -= 5;
        moved = true;
      } else if (this.cursors.right.isDown) {
        this.player.x += 5;
        moved = true;
      }
      if (this.cursors.up.isDown) {
        this.player.y -= 5;
        moved = true;
      } else if (this.cursors.down.isDown) {
        this.player.y += 5;
        moved = true;
      }

      if (moved) {
        this.socket.emit('movePlayer', { x: this.player.x, y: this.player.y });
      }
    }
  }

  private addPlayer(playerInfo: any) {
    const sprite = playerInfo.type === 'human' ? 'human' : 'monster';
    const player = this.add.sprite(playerInfo.x, playerInfo.y, sprite);
    if (playerInfo.id === this.socket.id) {
      this.player = player;
    }
    this.players[playerInfo.id] = player;
  }
}