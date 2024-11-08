import { Vector } from "./Vector.js";
import { Character } from "./Character.js";

export class Staticc {
  constructor(position = new Vector(), orientation) {
    this.position = position;
    this.orientation = orientation;
  }
}


export class SteeringOutput {
  constructor(linear = new Vector(), angular = 0) {
    this.linear = linear;
    this.angular = angular;
  }
}

// export class KinematicSteeringBehaviors {
//     constructor(staticc = new Staticc(), velocity, rotation) {
//       this.position = staticc.position;
//       this.orientation = staticc.orientation; // en radianes
//       this.velocity = velocity;
//       this.rotation = rotation;
//     }
  
//     update(steering, time, maxSpeed) {
//       // Actualizar posición
//       this.position = this.position.add(this.velocity.scale(time));
  
//       this.orientation += this.rotation * time;
  
//       // Verificar que steering no sea null y actualizar la velocidad y rotación basados en steering
//       if (steering && steering.linear !== undefined)
//         this.velocity = this.velocity.add(steering.linear.scale(time));
  
//       // if (steering && steering.velocity !== undefined)
//       //      this.velocity = steering.velocity
  
//       if (steering && steering.angular !== undefined)
//         this.rotation += steering.angular * time;
  
//       //     if (steering && steering.rotation !== undefined)
//       //        this.rotation += steering.rotation * time;
  
//       if (this.velocity.length() > maxSpeed) {
//         this.velocity = this.velocity.normalize();
//         this.velocity = this.velocity.scale(maxSpeed);
//       }
//     }
//   }


export class KinematicSteeringBehaviors {
  constructor(staticc = new Staticc(), velocity, rotation) {
    this.position = staticc.position;
    this.orientation = staticc.orientation; // en radianes
    this.velocity = velocity; // Inicialmente la velocidad
    this.rotation = rotation;
  }

  update(steering, time, maxSpeed) {
    // Si el steering está definido y tiene información de orientación
    if (steering && steering.angular !== undefined) {
      this.rotation += steering.angular * time; // Actualizar rotación
    }

    // Calcular dirección en función de la orientación actual
    const direction = new Vector(Math.cos(this.orientation), Math.sin(this.orientation));

    // Establecer la velocidad en función de la dirección
    this.velocity = direction.scale(maxSpeed); // Aplicar la velocidad máxima

    // Actualizar posición
    this.position = this.position.add(this.velocity.scale(time));
  
    // Actualizar orientación
    this.orientation += this.rotation * time;
  }
}


  export class KinematicCharacter {
    constructor(character, scene) {
      this.character = character;
      this.scene = scene;
      this.pokeballPosition =null;
      this.kinematicSteering = new KinematicSteeringBehaviors(
        new Staticc(new Vector(character.sprite.x, character.sprite.y), 0),
        new Vector(0, 0),
        0
      );
    }
  
    showExclamationMark() {
      this.character.showExclamationMark();
    }
  
    hideExclamationMark() {
      this.character.hideExclamationMark();
    }


    showCollectionMark() {
      this.character.showCollectionMark();
    }
  
    hideCollectionMark() {
      this.character.hideCollectionMark();
    }
  
    update(steering, time, maxSpeed) {
      this.kinematicSteering.update(steering, time, maxSpeed);
      this.character.update();

      // Actualiza la posición de la marca de exclamación
    }

    setPokeballPosition(pokeballPosition){
      this.pokeballPosition = pokeballPosition;
    }
  }
  