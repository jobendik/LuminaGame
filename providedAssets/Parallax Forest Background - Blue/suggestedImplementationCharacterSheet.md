Excellent. This sheet can absolutely be used for your player.

## First: what this image actually is

Your file is a **sprite sheet**.

That means:

* one single PNG
* many animation frames packed into a grid
* the game shows one frame at a time very quickly
* that creates the illusion of movement

### Exact structure of your sheet

Your sheet is:

* **256 × 288 pixels**
* arranged as **8 columns × 9 rows**
* each frame is **32 × 32 pixels**

So Phaser should load it as:

```javascript
frameWidth: 32,
frameHeight: 32
```

---

# Important observation about this sheet

This is **not** a perfectly full sheet.

Some cells are empty, and some rows clearly belong to different actions.

So you should **not** just say “play row 0 to row 8 automatically.”

Instead, use **specific frame lists**.

That is the safe and correct way.

---

# What the animations appear to be

Based on the sheet, these are the most likely useful groups:

## Likely idle

Very small movement:

* `0, 1`
* also possibly `8, 9`
* also `16, 17, 18, 19` if you want a slightly more alive idle

## Likely walk / move

This row has clear repeated stepping motion:

* `24, 25, 26, 27, 28, 29, 30, 31`

That is the strongest candidate for the main walking animation.

## Likely another movement / float / run / special move

This row has more pronounced motion:

* `40, 41, 42, 43, 44, 45, 46, 47`

## Likely hurt / transition

This row looks like stronger body deformation:

* `32, 33, 34, 35, 36, 37`

## Likely dissolve / death beginning

These frames clearly break apart:

* `48, 49, 50, 51`

## Likely collapse / dead

These frames look like a flatten/collapse sequence:

* `56, 57, 58, 59, 60, 61, 62, 63`

## Likely attack / power / slash

This row has visible effect frames:

* `64, 65, 66, 67, 68, 69, 70, 71`

That last row is the strongest candidate for an attack or special ability.

---

# The correct way to use it for your player

There are really **4 parts**:

1. Load the sheet correctly
2. Create animations from frame groups
3. Create the player sprite
4. Switch animation depending on what the player is doing

---

# 1. Load the sheet

In `preload()`:

```javascript
preload() {
  this.load.spritesheet('player', 'assets/AnimationSheet_Character.png', {
    frameWidth: 32,
    frameHeight: 32
  });
}
```

---

# 2. Create the animations

Do this once in `create()`.

## Idle

```javascript
this.anims.create({
  key: 'player_idle',
  frames: this.anims.generateFrameNumbers('player', {
    frames: [0, 1]
  }),
  frameRate: 3,
  repeat: -1
});
```

## Walk

```javascript
this.anims.create({
  key: 'player_walk',
  frames: this.anims.generateFrameNumbers('player', {
    frames: [24, 25, 26, 27, 28, 29, 30, 31]
  }),
  frameRate: 10,
  repeat: -1
});
```

## Alternative movement

```javascript
this.anims.create({
  key: 'player_move_alt',
  frames: this.anims.generateFrameNumbers('player', {
    frames: [40, 41, 42, 43, 44, 45, 46, 47]
  }),
  frameRate: 10,
  repeat: -1
});
```

## Hurt

```javascript
this.anims.create({
  key: 'player_hurt',
  frames: this.anims.generateFrameNumbers('player', {
    frames: [32, 33, 34, 35, 36, 37]
  }),
  frameRate: 12,
  repeat: 0
});
```

## Attack

```javascript
this.anims.create({
  key: 'player_attack',
  frames: this.anims.generateFrameNumbers('player', {
    frames: [64, 65, 66, 67, 68, 69, 70, 71]
  }),
  frameRate: 12,
  repeat: 0
});
```

## Death start

```javascript
this.anims.create({
  key: 'player_death_start',
  frames: this.anims.generateFrameNumbers('player', {
    frames: [48, 49, 50, 51]
  }),
  frameRate: 10,
  repeat: 0
});
```

## Death collapse

```javascript
this.anims.create({
  key: 'player_death_fall',
  frames: this.anims.generateFrameNumbers('player', {
    frames: [56, 57, 58, 59, 60, 61, 62, 63]
  }),
  frameRate: 10,
  repeat: 0
});
```

---

# 3. Create the player

In `create()`:

```javascript
this.player = this.physics.add.sprite(200, 400, 'player', 0);
```

That creates the sprite using frame `0` at start.

---

# 4. Make the player look right in the game

This is very important.

A sprite frame is **32×32**, but the visible body does **not** fill the whole square.

So you usually want:

* scale the sprite up
* shrink the collision box
* set the origin properly

## Good starting setup

```javascript
this.player.setScale(2);
this.player.setCollideWorldBounds(true);
this.player.setOrigin(0.5, 1);
```

### Why `setOrigin(0.5, 1)`?

That makes the character anchor from:

* center horizontally
* feet at the bottom

That usually feels much better for platformers.

---

# 5. Fix the collision box

This is one of the biggest beginner mistakes.

Do **not** use the full 32×32 frame as the hitbox if the character body is smaller.

A better start:

```javascript
this.player.body.setSize(14, 24);
this.player.body.setOffset(9, 8);
```

You may need to tweak those numbers a little.

### Why?

Because the real character seems to occupy roughly the middle of the frame.

So the collision box should be:

* narrower than the frame
* shorter than the full square
* aligned around the body, not the transparent area

---

# 6. Play animations based on movement

Here is the basic pattern in `update()`.

## Example movement + animation logic

```javascript
update() {
  const speed = 160;

  this.player.setVelocityX(0);

  if (this.cursors.left.isDown) {
    this.player.setVelocityX(-speed);
    this.player.setFlipX(true);
  } 
  else if (this.cursors.right.isDown) {
    this.player.setVelocityX(speed);
    this.player.setFlipX(false);
  }

  if (this.cursors.up.isDown && this.player.body.blocked.down) {
    this.player.setVelocityY(-350);
  }

  // Animation switching
  if (!this.player.body.blocked.down) {
    // airborne
    this.player.anims.play('player_move_alt', true);
  } else if (this.player.body.velocity.x !== 0) {
    // walking
    this.player.anims.play('player_walk', true);
  } else {
    // idle
    this.player.anims.play('player_idle', true);
  }
}
```

---

# 7. Add attack input

Suppose you want space bar to attack.

In `create()`:

```javascript
this.cursors = this.input.keyboard.createCursorKeys();
this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
this.isAttacking = false;
```

Then in `update()`:

```javascript
if (Phaser.Input.Keyboard.JustDown(this.attackKey) && !this.isAttacking) {
  this.isAttacking = true;
  this.player.setVelocityX(0);
  this.player.anims.play('player_attack');
}
```

And in `create()`, listen for animation completion:

```javascript
this.player.on('animationcomplete', (anim) => {
  if (anim.key === 'player_attack') {
    this.isAttacking = false;
  }
});
```

Then block normal movement while attacking:

```javascript
if (this.isAttacking) {
  return;
}
```

Put that near the top of `update()`.

---

# 8. Full working example

This is a clean complete example.

```javascript
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.spritesheet('player', 'assets/AnimationSheet_Character.png', {
      frameWidth: 32,
      frameHeight: 32
    });
  }

  create() {
    this.physics.world.setBounds(0, 0, 3000, 720);

    const ground = this.add.rectangle(1500, 690, 3000, 60, 0x3b7a3b);
    this.physics.add.existing(ground, true);

    this.player = this.physics.add.sprite(200, 600, 'player', 0);

    this.player.setScale(2);
    this.player.setOrigin(0.5, 1);
    this.player.setCollideWorldBounds(true);

    this.player.body.setSize(14, 24);
    this.player.body.setOffset(9, 8);

    this.physics.add.collider(this.player, ground);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setBounds(0, 0, 3000, 720);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.isAttacking = false;
    this.isDead = false;

    this.createPlayerAnimations();

    this.player.anims.play('player_idle');

    this.player.on('animationcomplete', (anim) => {
      if (anim.key === 'player_attack') {
        this.isAttacking = false;
      }

      if (anim.key === 'player_death_start') {
        this.player.anims.play('player_death_fall');
      }
    });
  }

  createPlayerAnimations() {
    this.anims.create({
      key: 'player_idle',
      frames: this.anims.generateFrameNumbers('player', { frames: [0, 1] }),
      frameRate: 3,
      repeat: -1
    });

    this.anims.create({
      key: 'player_walk',
      frames: this.anims.generateFrameNumbers('player', {
        frames: [24, 25, 26, 27, 28, 29, 30, 31]
      }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'player_air',
      frames: this.anims.generateFrameNumbers('player', {
        frames: [40, 41, 42, 43, 44, 45, 46, 47]
      }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'player_hurt',
      frames: this.anims.generateFrameNumbers('player', {
        frames: [32, 33, 34, 35, 36, 37]
      }),
      frameRate: 12,
      repeat: 0
    });

    this.anims.create({
      key: 'player_attack',
      frames: this.anims.generateFrameNumbers('player', {
        frames: [64, 65, 66, 67, 68, 69, 70, 71]
      }),
      frameRate: 12,
      repeat: 0
    });

    this.anims.create({
      key: 'player_death_start',
      frames: this.anims.generateFrameNumbers('player', {
        frames: [48, 49, 50, 51]
      }),
      frameRate: 10,
      repeat: 0
    });

    this.anims.create({
      key: 'player_death_fall',
      frames: this.anims.generateFrameNumbers('player', {
        frames: [56, 57, 58, 59, 60, 61, 62, 63]
      }),
      frameRate: 10,
      repeat: 0
    });
  }

  update() {
    if (this.isDead) return;

    if (this.isAttacking) {
      this.player.setVelocityX(0);
      return;
    }

    const speed = 160;
    this.player.setVelocityX(0);

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.setFlipX(false);
    }

    if (this.cursors.up.isDown && this.player.body.blocked.down) {
      this.player.setVelocityY(-350);
    }

    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.isAttacking = true;
      this.player.anims.play('player_attack');
      return;
    }

    if (!this.player.body.blocked.down) {
      this.player.anims.play('player_air', true);
    } else if (this.player.body.velocity.x !== 0) {
      this.player.anims.play('player_walk', true);
    } else {
      this.player.anims.play('player_idle', true);
    }
  }
}
```

---

# How this connects to your parallax background

Your player should be drawn:

* **in front of the background**
* **behind the UI**

So:

* parallax layers: depth `-100` to `-1`
* player: depth `10`
* enemies: depth `10`
* foreground effects: depth `20`
* UI: depth `1000`

Example:

```javascript
this.player.setDepth(10);
```

---

# A few very important tips

## 1. Use `flipX` for left/right

You probably only need one facing direction.

So instead of drawing left and right animations separately:

```javascript
this.player.setFlipX(true);  // facing left
this.player.setFlipX(false); // facing right
```

That is standard and efficient.

---

## 2. Keep pixel art crisp

If this is pixel art, use:

```javascript
pixelArt: true
```

in your Phaser game config.

Example:

```javascript
const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  scene: [GameScene]
};
```

This prevents blurry scaling.

---

## 3. The sheet already has transparency

That is good news.

You do **not** need to remove a white background manually.

The empty area is already transparent.

---

## 4. Do not trust the whole 32×32 square as the body

The visible character is smaller than the frame.

So always think of:

* **sprite frame** = what gets drawn
* **physics body** = what collides

Those are not the same thing.

---

## 5. Test animations one by one

Before wiring up your whole player logic, do this:

```javascript
this.player.anims.play('player_walk');
```

Then change to:

```javascript
this.player.anims.play('player_attack');
```

That lets you confirm each frame group is really what you think it is.

That is the fastest way to understand the sheet.

---
