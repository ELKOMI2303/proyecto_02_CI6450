import { Vector } from "./Vector.js";

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

export class KinematicSteeringBehaviors {
    constructor(staticc = new Staticc(), velocity, rotation) {
      this.position = staticc.position;
      this.orientation = staticc.orientation; // en radianes
      this.velocity = velocity;
      this.rotation = rotation;
    }
  
    update(steering, time, maxSpeed) {
      // Actualizar posición
      this.position = this.position.add(this.velocity.scale(time));
  
      this.orientation += this.rotation * time;
  
      // Verificar que steering no sea null y actualizar la velocidad y rotación basados en steering
      if (steering && steering.linear !== undefined)
        this.velocity = this.velocity.add(steering.linear.scale(time));
  
      // if (steering && steering.velocity !== undefined)
      //      this.velocity = steering.velocity
  
      if (steering && steering.angular !== undefined)
        this.rotation += steering.angular * time;
  
      //     if (steering && steering.rotation !== undefined)
      //        this.rotation += steering.rotation * time;
  
      if (this.velocity.length() > maxSpeed) {
        this.velocity = this.velocity.normalize();
        this.velocity = this.velocity.scale(maxSpeed);
      }
    }
  }