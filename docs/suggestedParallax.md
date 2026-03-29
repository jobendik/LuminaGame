Exact Phaser setup
1. Put the files here
assets/dawn/2.png
assets/dawn/3.png
assets/dawn/4.png
assets/dawn/5.png
assets/dawn/6.png
assets/dawn/7.png
assets/dawn/8.png
2. Load them
preload() {
  const p = 'assets/dawn/';

  this.load.image('dawn_sky',    p + '2.png');
  this.load.image('dawn_far',    p + '3.png');
  this.load.image('dawn_mid',    p + '4.png');
  this.load.image('dawn_near',   p + '5.png');
  this.load.image('dawn_fog',    p + '6.png');
  this.load.image('dawn_ground', p + '7.png');
  this.load.image('dawn_trees',  p + '8.png');
}
3. Create the repeating parallax layers
create() {
  this.createDawnParallax();
}

Then add this:

createDawnParallax() {
  const w = this.scale.width;
  const h = this.scale.height;

  this.dawnLayers = [];

  const addLayer = (key, factor, depth, alpha = 1) => {
    const layer = this.add.tileSprite(0, 0, w, h, key)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth)
      .setAlpha(alpha);

    this.dawnLayers.push({
      sprite: layer,
      factor: factor
    });

    return layer;
  };

  // Back to front
  addLayer('dawn_sky',    0.05, -100);
  addLayer('dawn_far',    0.12,  -99);
  addLayer('dawn_mid',    0.20,  -98);
  addLayer('dawn_near',   0.32,  -97);
  addLayer('dawn_fog',    0.42,  -96, 0.75);
  addLayer('dawn_ground', 0.55,  -95);
  addLayer('dawn_trees',  0.72,  -94);
}
4. Scroll them in update()
update() {
  this.updateDawnParallax();
}

Then add:

updateDawnParallax() {
  const camX = this.cameras.main.scrollX;

  for (const layer of this.dawnLayers) {
    layer.sprite.tilePositionX = camX * layer.factor;
  }
}

That is the core of the whole effect.

Why this is the correct solution

Because with tileSprite:

Phaser repeats the PNG endlessly
you do not need a super-wide source image
the pack can truly function as a scrolling background

This matches the creator’s description much better than treating it as one single 1980 px scene.

Recommended parallax speeds for this exact pack

Start here:

Layer	File	Factor
Sky	2.png	0.05
Far forest	3.png	0.12
Mid forest	4.png	0.20
Near forest	5.png	0.32
Fog	6.png	0.42
Ground	7.png	0.55
Foreground trees	8.png	0.72

These values should give a nice side-scroller feel.

If your game is slower and more atmospheric, reduce them slightly.
If it is faster and more arcadey, increase the front layers slightly.

What to expect visually
Layer 2 — sky

This should move the least.
It is the farthest away.

Layers 3–5 — forest bands

These create most of the depth.
They should move more and more as they get closer.

Layer 6 — fog/tint

This is not really “solid scenery.”
It is an atmosphere layer.
It usually looks best with:

lower alpha
soft drift
maybe slight color tint
Layer 7 — ground ridge

This should move quite a lot, because it feels close to the player.

Layer 8 — foreground trees

This is the strongest depth cue.
It should move the most.

Better polish

You can make the fog feel alive by adding slight drift:

updateDawnParallax() {
  const camX = this.cameras.main.scrollX;
  const t = this.time.now * 0.001;

  for (const layer of this.dawnLayers) {
    layer.sprite.tilePositionX = camX * layer.factor;
  }

  // Optional extra movement for fog
  const fogLayer = this.dawnLayers[4];
  if (fogLayer) {
    fogLayer.sprite.tilePositionX += Math.sin(t * 0.3) * 0.15;
  }
}

That makes the background feel less dead.

How to recolor it for night, like the creator mentions

The creator says you can change the environment using light or color settings.

In Phaser, the simplest way is not real lighting.
Just tint the layers.

For example:

this.dawnLayers[0].sprite.setTint(0x8899cc); // sky
this.dawnLayers[1].sprite.setTint(0x6677aa);
this.dawnLayers[2].sprite.setTint(0x556699);
this.dawnLayers[3].sprite.setTint(0x445588);

Or darker:

for (const layer of this.dawnLayers) {
  layer.sprite.setTint(0x8899ff);
  layer.sprite.setAlpha(0.85);
}

That gives you a “night version” without repainting the assets.