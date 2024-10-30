export class Vector {
    constructor(x = 0, y = 0) {
      // Cambiado de z a y
      this.x = x;
      this.y = y;
    }
  
    add(v) {
      return new Vector(this.x + v.x, this.y + v.y);
    }
  
    subtract(v) {
      return new Vector(this.x - v.x, this.y - v.y);
    }
  
    scale(scalar) {
      return new Vector(this.x * scalar, this.y * scalar);
    }
  
    length() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    }
  
    normalize() {
      const len = this.length();
      if (len === 0) return new Vector(0, 0);
      return new Vector(this.x / len, this.y / len);
    }
  
    angle() {
      return Math.atan2(this.y, this.x); // Ángulo en radianes
    }
  
    invertX() {
      return new Vector(-this.x, this.y);
    }
  
    invertY() {
      return new Vector(this.x, -this.y);
    }
  
    clone() {
      return new Vector(this.x, this.y);
    }
  }
  