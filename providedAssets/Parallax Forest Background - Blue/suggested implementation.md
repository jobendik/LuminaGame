I analyzed the pack.

What you have is a proper layered parallax set, not just one background image.

### What is inside the zip

You have 10 separate PNG layers plus one already-combined preview image:

* `10_Sky.png`
* `09_Forest.png`
* `08_Forest.png`
* `07_Forest.png`
* `06_Forest.png`
* `05_Particles.png`
* `04_Forest.png`
* `03_Particles.png`
* `02_Bushes.png`
* `01_Mist.png`

And also:

* `Combined background - Blue.png`

### What this means

The separate PNGs are the important files for parallax.

The combined image is only useful if you want:

* a static background
* or a quick placeholder

If you want a real parallax effect, use the separate layers.

---

## My analysis of the layers

All 10 layers are:

* `1920 x 1080`
* `RGBA`
* transparent where needed
* designed to be stacked on top of each other

That is exactly what you want for parallax.

Also, they appear to be made for horizontal looping. Most of them are perfectly seamless left-to-right. A couple of forest layers have a very small edge mismatch, but likely small enough that you may never notice it in motion.

---

# Best layer order

Use them from back to front like this:

1. `10_Sky.png`
   Completely static far background.

2. `09_Forest.png`
   Very distant foggy tree line / atmosphere.

3. `08_Forest.png`
   Far background trunks.

4. `07_Forest.png`
   Mid-far forest.

5. `06_Forest.png`
   Midground trunks.

6. `05_Particles.png`
   Floating particles in mid depth.

7. `04_Forest.png`
   Nearer forest trunks.

8. `03_Particles.png`
   Foreground particles.

9. `02_Bushes.png`
   Foreground silhouette.

10. `01_Mist.png`
    Front mist overlay.

That order will look natural.

---

# How parallax works

Parallax means:

* distant layers move very little
* closer layers move more
* the player/world moves the most

So if your player/camera moves 100 pixels:

* sky might move 0 px
* far trees might move 10 px
* mid trees might move 25 px
* near trees might move 45 px
* front bushes/mist might move 60–80 px

That difference creates depth.

---

# Exact scroll factors I would start with

Use these as a starting point:

| Layer | File               | Scroll factor |
| ----- | ------------------ | ------------: |
| 1     | `10_Sky.png`       |        `0.00` |
| 2     | `09_Forest.png`    |        `0.05` |
| 3     | `08_Forest.png`    |        `0.10` |
| 4     | `07_Forest.png`    |        `0.16` |
| 5     | `06_Forest.png`    |        `0.24` |
| 6     | `05_Particles.png` |        `0.32` |
| 7     | `04_Forest.png`    |        `0.42` |
| 8     | `03_Particles.png` |        `0.52` |
| 9     | `02_Bushes.png`    |        `0.68` |
| 10    | `01_Mist.png`      |        `0.80` |

If your gameplay is fast, increase the spread a little.
If your gameplay is calm, keep the layers closer together.

---

# The most important implementation detail

Since these are seamless horizontally, the correct way to use them is:

## Option A: repeat each image endlessly

This is the best option for a side-scrolling game.

You either:

* use a repeating/tiled background feature from your engine
* or place two copies side by side and wrap them when one leaves the screen

## Option B: keep them fixed to the camera with scroll factors

This is easiest if the level is not huge.

---

# Exact Phaser 3 way

If your game is in Phaser, this is the cleanest method:

## 1. Load all images

```javascript
function preload() {
  this.load.image('sky', 'assets/10_Sky.png');
  this.load.image('forest9', 'assets/09_Forest.png');
  this.load.image('forest8', 'assets/08_Forest.png');
  this.load.image('forest7', 'assets/07_Forest.png');
  this.load.image('forest6', 'assets/06_Forest.png');
  this.load.image('particles5', 'assets/05_Particles.png');
  this.load.image('forest4', 'assets/04_Forest.png');
  this.load.image('particles3', 'assets/03_Particles.png');
  this.load.image('bushes2', 'assets/02_Bushes.png');
  this.load.image('mist1', 'assets/01_Mist.png');
}
```

## 2. Create tileSprites for looping parallax

```javascript
function create() {
  const w = this.scale.width;
  const h = this.scale.height;

  this.bgLayers = [
    { sprite: this.add.tileSprite(0, 0, w, h, 'sky').setOrigin(0, 0).setScrollFactor(0), factor: 0.00 },
    { sprite: this.add.tileSprite(0, 0, w, h, 'forest9').setOrigin(0, 0).setScrollFactor(0), factor: 0.05 },
    { sprite: this.add.tileSprite(0, 0, w, h, 'forest8').setOrigin(0, 0).setScrollFactor(0), factor: 0.10 },
    { sprite: this.add.tileSprite(0, 0, w, h, 'forest7').setOrigin(0, 0).setScrollFactor(0), factor: 0.16 },
    { sprite: this.add.tileSprite(0, 0, w, h, 'forest6').setOrigin(0, 0).setScrollFactor(0), factor: 0.24 },
    { sprite: this.add.tileSprite(0, 0, w, h, 'particles5').setOrigin(0, 0).setScrollFactor(0), factor: 0.32 },
    { sprite: this.add.tileSprite(0, 0, w, h, 'forest4').setOrigin(0, 0).setScrollFactor(0), factor: 0.42 },
    { sprite: this.add.tileSprite(0, 0, w, h, 'particles3').setOrigin(0, 0).setScrollFactor(0), factor: 0.52 },
    { sprite: this.add.tileSprite(0, 0, w, h, 'bushes2').setOrigin(0, 0).setScrollFactor(0), factor: 0.68 },
    { sprite: this.add.tileSprite(0, 0, w, h, 'mist1').setOrigin(0, 0).setScrollFactor(0), factor: 0.80 }
  ];
}
```

## 3. Move them based on camera position

```javascript
function update() {
  const camX = this.cameras.main.scrollX;

  for (const layer of this.bgLayers) {
    layer.sprite.tilePositionX = camX * layer.factor;
  }
}
```

That gives you a proper endless parallax background.

---

# Why this Phaser method works well

`tileSprite` repeats the texture automatically.

So instead of manually placing many copies, Phaser keeps reusing the image as the camera moves.

That is exactly what these seamless PNGs are good for.

---

# If you do not want repeating, but want simple parallax

Then use normal images:

```javascript
this.add.image(0, 0, 'sky').setOrigin(0, 0).setScrollFactor(0);
this.add.image(0, 0, 'forest9').setOrigin(0, 0).setScrollFactor(0.05);
this.add.image(0, 0, 'forest8').setOrigin(0, 0).setScrollFactor(0.10);
this.add.image(0, 0, 'forest7').setOrigin(0, 0).setScrollFactor(0.16);
this.add.image(0, 0, 'forest6').setOrigin(0, 0).setScrollFactor(0.24);
this.add.image(0, 0, 'particles5').setOrigin(0, 0).setScrollFactor(0.32);
this.add.image(0, 0, 'forest4').setOrigin(0, 0).setScrollFactor(0.42);
this.add.image(0, 0, 'particles3').setOrigin(0, 0).setScrollFactor(0.52);
this.add.image(0, 0, 'bushes2').setOrigin(0, 0).setScrollFactor(0.68);
this.add.image(0, 0, 'mist1').setOrigin(0, 0).setScrollFactor(0.80);
```

But this only works well if your level is not much wider than the background view, because the image itself is only 1920 px wide.

For a real side-scroller, use `tileSprite`.

---

# Where to place them vertically

All files are full-screen `1920x1080`, so place all of them at:

* `x = 0`
* `y = 0`
* `origin = 0,0`

Do not try to manually offset each layer vertically at first. They were clearly designed to align naturally.

Only after that should you tweak.

---

# Good practical setup for your game

If your game is a 2D side-scroller:

* use these images as background only
* let the player/world use normal movement at full speed
* keep all parallax layers behind platforms and enemies
* put mist and bushes in front of distant forest, but still behind gameplay objects unless you want intentional foreground occlusion

A good display order is:

* back layers
* gameplay world
* UI

If you want mist in front of the player for atmosphere, put `01_Mist.png` above the gameplay layer with a reduced alpha, for example:

```javascript
mistLayer.setAlpha(0.6);
```

---

# Recommended polish

To make it look much better:

## Mist

Give `01_Mist.png` a slight independent drift:

```javascript
mist.tilePositionX = camX * 0.80 + time * 0.01;
```

## Particles

Let particle layers drift a tiny bit:

```javascript
particles.tilePositionX = camX * 0.52 + time * 0.02;
```

## Sky

Keep sky almost fixed:

```javascript
sky.tilePositionX = camX * 0.00;
```

This makes the scene feel more alive.

---

# One important warning

Do not scale each layer differently unless necessary.

Because these layers were painted to align together, different scaling can break the composition.

Scale all equally if your game resolution is different from `1920x1080`.

---

# Best simple rule

Use:

* **combined image** = static background only
* **separate PNG layers** = real parallax background

---

# My exact recommendation for you

If you are making a side-scrolling Phaser game, do this:

1. Put all separate PNGs in your assets folder.
2. Load them individually.
3. Create one `tileSprite` per layer.
4. Stack them in the order I listed.
5. Use the scroll factors I listed.
6. Update `tilePositionX` from camera scroll every frame.

That is the correct way to use this pack.
