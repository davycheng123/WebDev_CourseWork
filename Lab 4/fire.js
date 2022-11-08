// This function defines the Gem module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the fire
// - `y` - The initial y position of the fire
const Fire = function(ctx, x, y) {

    // This is the sprite sequences of the fire
    const sequences = {
        x: 0, y:  160, width: 16, height: 16, count: 8, timing: 200, loop: true
    };

    // This is the sprite object of the gem created from the Sprite module.
    const sprite = Sprite(ctx, x, y);

    // The sprite object is configured for the fire sprite here.
    sprite.setSequence(sequences)
          .setScale(2)
          .setShadowScale({ x: 0.75, y: 0.2 })
          .useSheet("object_sprites.png");


    // The methods are returned as an object here.
    return {
        getXY: sprite.getXY,
        setXY: sprite.setXY,
        draw: sprite.draw,
        update: sprite.update
    };
};
