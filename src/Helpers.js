export function checkCollides(tileX, tileY, map) {
    const layers = ["nivel1", "grass"]; // Agregar más capas si es necesario
    for (let layer of layers) {
      const tile = map.getTileAt(tileX, tileY, true, layer);
      if (tile && tile.properties.collides) {
        return true;
      }
    }
    return false;
  }


  export function getNextTilePosition(x, y, cursors, map, player) {
    if (!player) {
      console.error("Player is undefined");
      return {
        tileX: Math.floor(x / map.tileWidth),
        tileY: Math.floor(y / map.tileHeight),
      };
    }
  
    const tileWidth = map.tileWidth;
    const tileHeight = map.tileHeight;
  
    // Considerar el tamaño real del jugador
    const scaledWidth = player.displayWidth * player.scaleX; // Ajustar por el escalado
    const scaledHeight = player.displayHeight * player.scaleY;
  
    // Posición central ajustada del jugador
    const centerX = x + scaledWidth / 2;
    const centerY = y + scaledHeight / 2;
  
    let tileX = Math.floor(centerX / tileWidth);
    let tileY = Math.floor(centerY / tileHeight);
  
    // Calcular la siguiente posición basada en la dirección del movimiento
    if (cursors.left.isDown) {
      tileX = Math.floor((centerX - scaledWidth / 2 - 10) / tileWidth); // Ajustar a la izquierda
    } else if (cursors.right.isDown) {
      tileX = Math.floor((centerX + scaledWidth / 2 + 5) / tileWidth); // Ajustar a la derecha (añadiendo 5 píxeles)
    } else if (cursors.up.isDown) {
      tileY = Math.floor((centerY - scaledHeight / 2) / tileHeight); // Ajustar hacia arriba
    } else if (cursors.down.isDown) {
      tileY = Math.floor((centerY + scaledHeight / 2 + 5) / tileHeight); // Ajustar hacia abajo (añadiendo 5 píxeles)
    }
  
    return { tileX, tileY };
  }
  
  
export function canSeePlayer(character, player) {
    const distance = Phaser.Math.Distance.Between(
      character.kinematicSteering.position.x,
      character.kinematicSteering.position.y,
      player.x,
      player.y
    );
    if (distance >= 3 * 16) {
      return false;
    }
  
    // Calcular el ángulo hacia el jugador
    const angleToPlayer = Math.atan2(
      player.y - character.kinematicSteering.position.y,
      player.x - character.kinematicSteering.position.x
    );
  
    // Verificar la orientación del NPC (suponiendo que orientación es el ángulo en radianes)
    const angleDiff = Math.abs(
      Phaser.Math.Angle.ShortestBetween(
        character.kinematicSteering.orientation,
        angleToPlayer
      )
    );
  
    // Considerar una tolerancia en la orientación, por ejemplo, ±45 grados
    const tolerance = Math.PI / 4;
    return angleDiff <= tolerance;
  }
  
  // Función para verificar si el jugador se aleja más de 5 casillas
  export function isPlayerFarAway(character, player) {
    const distance = Phaser.Math.Distance.Between(
      character.kinematicSteering.position.x,
      character.kinematicSteering.position.y,
      player.x,
      player.y
    );
    return distance > 5 * 16; // Retorna verdadero si el jugador está a más de 5 casillas
  }
  export function checkForNearbyPokeball(position, map) {
    const tileX = Math.floor(position.x / 16); // Convertir la posición a coordenadas de tile
    const tileY = Math.floor(position.y / 16);

    // Obtener la capa donde se encuentran las pokebolas
    const pokeballLayer = map.getLayer("nivel1").data; // Cambia "nivel1" al nombre de tu capa si es necesario

    // Iterar a través de los tiles vecinos en un rango de 5 casillas
    for (let dx = -5; dx <= 5; dx++) {
        for (let dy = -5; dy <= 5; dy++) {
            const neighborX = tileX + dx; // Calcular las coordenadas del vecino
            const neighborY = tileY + dy;

            // Asegurarse de que las coordenadas estén dentro de los límites del mapa
            if (neighborX >= 0 && neighborX < pokeballLayer[0].length && neighborY >= 0 && neighborY < pokeballLayer.length) {
                const tile = pokeballLayer[neighborY][neighborX]; // Acceder al tile usando las coordenadas

                // Comprobar si el tile existe y tiene la propiedad 'pokeball'
                if (tile && tile.properties && tile.properties.pokeball === true) {
                    return true; // Pokebola detectada en rango
                }
            }
        }
    }

    return false; // No hay pokebolas en rango
}
