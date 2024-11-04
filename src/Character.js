export class Character {
    constructor(sprite) {
      this.sprite = sprite;
  
      this.exclamationMark = sprite.scene.add.image(
        sprite.x,
        sprite.y - 32,
        "exclamation"
      );

      this.collectionMark = sprite.scene.add.image(
        sprite.x,
        sprite.y - 32,
        "collection"
      );
      this.exclamationMark.setDisplaySize(10, 10);
      this.exclamationMark.setOrigin(0.5, 1); // Centra la imagen
      this.exclamationMark.setVisible(false);


      this.collectionMark.setDisplaySize(10, 10);
      this.collectionMark.setOrigin(0.5, 1); // Centra la imagen
      this.collectionMark.setVisible(false);
    }
  
    showExclamationMark() {
      this.exclamationMark.setPosition(this.sprite.x, this.sprite.y -20); // Ajusta la posición según sea necesario
      this.exclamationMark.setVisible(true);
    }

    hideExclamationMark() {
      this.exclamationMark.setVisible(false);
    }

    showCollectionMark() {
      this.collectionMark.setPosition(this.sprite.x, this.sprite.y -20); // Ajusta la posición según sea necesario
      this.collectionMark.setVisible(true);
    }
  

    hideCollectionMark() {
      this.collectionMark.setVisible(false);
    }
  
    update() {
      // Asegúrate de que el signo de exclamación siga al personaje
  
      if (this.exclamationMark) {
        this.exclamationMark.x = this.sprite.x;
        this.exclamationMark.y=  this.sprite.y - 20; // Ajusta la posición según sea necesario
      }

      if (this.collectionMark.visible) {
        this.collectionMark.x = this.sprite.x;
        this.collectionMark.y=  this.sprite.y - 20; // Ajusta la posición según sea necesario
      }
    }
  }