export class Character {
    constructor(sprite) {
      this.sprite = sprite;
  
      this.exclamationMark = sprite.scene.add.image(
        sprite.x,
        sprite.y - 32,
        "exclamation"
      );
      this.exclamationMark.setDisplaySize(10, 10);
      this.exclamationMark.setVisible(false);
    }
  
    showExclamationMark() {
      this.exclamationMark.setVisible(true);
      this.exclamationMark.setPosition(this.sprite.x, this.sprite.y -20); // Ajusta la posición según sea necesario
    }
  
    hideExclamationMark() {
      this.exclamationMark.setVisible(false);
    }
  
    update() {
      // Asegúrate de que el signo de exclamación siga al personaje
      if (this.exclamationMark.visible) {
        this.exclamationMark.setPosition(this.sprite.x, this.sprite.y - 20); // Ajusta la posición según sea necesario
      }
    }
  }