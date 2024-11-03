import { SteeringOutput } from "./Kinematic";


function newOrientation(current, velocity) {
    if (velocity.length() > 0) {
      // Calcula el ángulo usando atan2. En Phaser, y aumenta hacia abajo.
      return Math.atan2(velocity.y, velocity.x);
    } else {
      // Mantiene la orientación actual si no hay movimiento.
      return current;
    }
  }

export class Seek {
    constructor(character, target, maxAcceleration) {
      this.character = character; // Kinematic
      this.target = target; // Kinematic
      this.maxAcceleration = maxAcceleration;
    }
  
    getSteering() {
      var result = new SteeringOutput();
  
      result.linear = this.target.position.subtract(this.character.position);
  
      result.linear = result.linear.normalize();
  
      result.linear = result.linear.scale(this.maxAcceleration);
  
      // this.character.orientation = newOrientation(
      //   this.character.orientation,
      //   this.character.velocity
      // );
  

      // Actualiza la orientación del personaje hacia el objetivo
      this.character.orientation = Math.atan2(
        this.target.position.y - this.character.position.y,
        this.target.position.x - this.character.position.x
      );
      result.angular = 0;
  
      return result;
    }
  }