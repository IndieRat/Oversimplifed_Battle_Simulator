//**
// Base Setup
// Following code below is just functions used by the game to make it easier to create elements and graphics
// and handle resizing of the canvas.
// This is not the game logic itself, but rather the setup for the game.
//  */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const controlGroup = document.getElementById('control-group');
const unitGroup = document.getElementById('unit-group');

let zoom = 0.6; // zoom level for the canvas, can be adjusted as needed

let oldWidth = undefined; // old width of the canvas
let oldHeight = undefined; // old height of the canvas

// resizes the canvas to fit the window size
// and sets the canvas width and height mutliplied by zoom
// This is to ensure that the canvas is not too large for the screen
function resizeCanvas() {
    oldWidth = canvas.width;
    oldHeight = canvas.height;

    canvas.width = window.innerWidth*zoom;
    canvas.height = window.innerHeight*zoom;

    controlGroup.style.width = `${canvas.width}px`;
    controlGroup.style.height = `100px`;

    unitGroup.style.width = `${canvas.width/2}px`;
    unitGroup.style.height = `${(window.innerHeight*zoom)}px`;

    unitGroup.style.position = 'absolute';
    unitGroup.style.left = `65%`;
    unitGroup.style.top = `130px`;

    canvas.style.position = 'relative';
    canvas.style.left = `-18.5%`;
}

// sets the position of an element to absolute and places it at the specified x and y coordinates
// This is used to position elements on the canvas
function setPosition(element, x, y) {
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
}

// creates an HTML element with the specified tag, id, x, and y coordinates
// This is used to create buttons, divs, and other elements on the canvas
// mostly used for UI elements
function createElement(tag, id, x, y) {
    let element = document.createElement(tag);
    element.style.position = 'relative';
    element.id = id;
    if (x !== undefined && y !== undefined) {
        setPosition(element, x, y);
    }
    document.body.appendChild(element);
    return element;
}

// draws a rectangle on the canvas with the specified x, y, width, height, and color
function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

// draws a circle on the canvas with the specified x, y, radius, and color
function drawCircle(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}

// draws a triangle on the canvas with the specified x, y coordinates for each point and color
function drawTriangle(x1, y1, x2, y2, x3, y3, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.fill();
}

// draws text on the canvas with the specified x, y coordinates, text, font size, and color
function drawText(x, y, text, fontSize, color) {
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px Arial`;
    ctx.fillText(text, x, y);
}

// draws a line on the canvas with the specified start and end coordinates and color
function drawLine(x1, y1, x2, y2, width, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 1; // default line width is 1
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

resizeCanvas();

window.addEventListener('resize', resizeCanvas);
// Setup ends here ^

// HTML related code
const credits = document.getElementById('credits');
const creditsTexts = ["Made by Rumor", "Made by Dante Swofford", "Rumor is cool B)", "Dante is cool B)" || "Made by Rumor who is known as Dante Swofford", "Made by Dante Swofford who is known as Rumor"];

const randomText = creditsTexts[randomInt(1, creditsTexts.length)];
credits.textContent = randomText;

const startButton = document.getElementById('startBattle');
const resetButton = document.getElementById('resetBattle');
const pauseButton = document.getElementById('togglePause');

const unitType = document.getElementById('unitType');

// Game related code
const fixedRows = 15; // number of rows in the grid
const fixedCols = 10; // number of columns in the grid

let unlockedUnits = ['Infantry', 'Archer', 'Commander', 'HeavyInfantry', 'Mage', 'Medic', 'Barrack']; // list of unlocked units
let occupiedCells = []; // array to keep track of occupied cells in the grid
let projectiles = []; // array to keep track of projectiles

const teamColors = {
    player: 'lightgreen',
    enemy: 'red',
    neutral: 'white',
};

const unitColors = {
    Infantry: 'lightblue',
    Archer: 'lightgreen',
    Commander: 'lightcoral',
    HeavyInfantry: `grey`,
    Mage: `darkblue`,
    Medic: `lightyellow`,
    Barrack: `brown`
};

const maxAttempts = 12;
const angleStep = Math.PI / 12;

// classes and their inherits
class Projectile {
    constructor(teamCasted, x, y, radius, dx, dy, speed, damage) {
        this.teamCasted = teamCasted;
        this.x = x;
        this.y = y;

        this.radius = radius;
        
        this.dx = dx;
        this.dy = dy;

        this.speed = speed;
        this.damage = damage;
        projectiles.push(this);
    }

    checkUnitCollision(newX, newY) {
        for (let unit of currentUnits) {
            if (unit === this || unit.isDead || unit.team == this.teamCasted) {
                continue;
            }

            const directionX = newX - unit.x;
            const directionY = newY - unit.y;
            const distance = Math.sqrt(directionX * directionX + directionY * directionY);

            if (distance < (this.radius + unit.radius)) {
                return unit; // Collision detected
            }
        }
    }

    checkBoundaryCollision(newX, newY) {
        if (newX - this.radius < 0 || newX + this.radius > canvas.width) {
            return true; // Collision with vertical boundary
        }
        if (newY - this.radius < 0 || newY + this.radius > canvas.height) {
            return true; // Collision with horizontal boundary
        }
        return false;
    }

    update() {
        const distance = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        const normalizedDirectionX = this.dx / distance;
        const normalizedDirectionY = this.dy / distance;

        const newX = this.x + normalizedDirectionX * this.speed;
        const newY = this.y + normalizedDirectionY * this.speed;

        const hit = this.checkUnitCollision(newX, newY);
        if (!hit) {
            this.x = newX;
            this.y = newY;
        } else {
            hit.takeDamage(this.damage);
            
            projectiles = projectiles.filter(p => p !== this);
        }
    }

    draw() {
        let color = teamColors[this.teamCasted] || teamColors['neutral'];
        drawCircle(this.x, this.y, this.radius, color);
    }
}

class AOEProjectile extends Projectile {
    constructor(teamCasted, x, y, radius, dx, dy, speed, damage, range) {
        super(teamCasted, x, y, radius, dx, dy, speed, damage);
        this.range = range;
    }

    checkAOE(newX, newY) {
        let hits = [];
        for (let unit of currentUnits) {
            if (unit === this || unit.isDead || unit.team == this.teamCasted) {
                continue;
            }

            const directionX = newX - unit.x;
            const directionY = newY - unit.y;
            const distance = Math.sqrt(directionX * directionX + directionY * directionY);

            if (distance < this.range) {
                hits.push(unit);
            }
        }
        return hits;
    }

    update() {
        const distance = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        const normalizedDirectionX = this.dx / distance;
        const normalizedDirectionY = this.dy / distance;

        const newX = this.x + normalizedDirectionX * this.speed;
        const newY = this.y + normalizedDirectionY * this.speed;

        const hit = this.checkUnitCollision(newX, newY);
        if (!hit) {
            this.x = newX;
            this.y = newY;
        } else {
            hit.takeDamage(this.damage);
            let otherHits = this.checkAOE(hit.x, hit.y);
            for (let otherHit of otherHits) {
                otherHit.takeDamage(this.damage);
            }
            
            projectiles = projectiles.filter(p => p !== this);
        }
    }


}

let unitTracker = {
    player: 0,
    enemy: 0
}


class Unit {
    constructor(team, x, y, behavior, projectileType) {
        this.team = team; // team the unit belongs to
        this.x = x;
        this.y = y;
        this.type = 'None';

        this.isDead = false; // flag to check if the unit is dead
        this.beingBuffed = false;
        this.finishedDeath = false;

        this.health = 100; // default health for the unit
        this.maxHealth = 100;
        this.originalAttackPower = 10; // origin attack power for the unit
        this.attackPower = this.originalAttackPower; // current attack power for the unit
        
        this.attackCooldown = 1.5; // cooldown for the unit's attack
        this.currentAttackCooldown = 1.5; // cooldown for the unit's attack
        this.damageReduction = 0;

        this.originalSpeed = 1;
        this.speed = this.originalSpeed; // default speed for the unit
        this.range = 25; // default range for the unit
        this.radius = 10 

        this.behavior = behavior;

        this.projectileType = projectileType || "";
        currentUnits.push(this); // Add the new unit to the current units array
   
        // adds team count
        if (this.team == "player") {
            unitTracker.player += 1
            unitTracker.enemy += 1
        }
    }

    update() {
        if (!this.isDead) {
            if (this.behavior === "melee") {
                let target = this.findOptimalTarget();
                if (target) {
                    const directionX = target.x - this.x;
                    const directionY = target.y - this.y;
                    const distance = Math.sqrt(directionX * directionX + directionY * directionY);
                    if (distance > this.range) {
                        // Move towards the target
                        this.move(target.x, target.y);
                    } else {
                        // Attack the target if within range, and cooldown
                        if (this.currentAttackCooldown <= 0) {
                            target.takeDamage(this.attackPower); // Deal damage to the target
                            this.currentAttackCooldown = this.attackCooldown; // Reset cooldown
                        } else {
                            this.currentAttackCooldown -= 1 / 60; // Decrease cooldown based on game speed
                        }
                    }

                }
                
            } else if (this.behavior === "ranged") {
                let target = this.findOptimalTarget();
                if (target) {
                    const directionX = target.x - this.x;
                    const directionY = target.y - this.y;
                    const distance = Math.sqrt(directionX * directionX + directionY * directionY);
                    if (distance > this.range) {
                        this.move(target.x, target.y);
                    } else {
                        if (this.currentAttackCooldown <= 0) {
                            if (this.projectileType == "hit") {
                                let projectile = new Projectile(this.team, this.x, this.y, 5, directionX, directionY, 2, this.attackPower)
                                console.log(`Created ${projectile.teamCasted} Projectile`)
                            } else if (this.projectileType == "aoe") {
                                let projectile = new AOEProjectile(this.team, this.x, this.y, this.radius, directionX, directionY, this.speed, this.attackPower, this.radius*3)
                                console.log(`Created ${projectile.teamCasted} AOEProjectile`)
                            }
                            this.currentAttackCooldown = this.attackCooldown; // Reset cooldown
                        } else {
                            this.currentAttackCooldown -= 1 / 60; // Decrease cooldown based on game speed
                        }
                    }
                }
            }
        } else {
            // If the unit is dead, it should not move or attack
            this.x = this.x; // Keep the unit's position unchanged
            this.y = this.y; // Keep the unit's position unchanged
        }
    }

    draw() {
        let color = '';
        if (this.isDead) {
            color = 'gray'; // Color for dead units

            ctx.save();
            if (!this.explosionBits) {
                // Generate explosion bits only once
                this.explosionBits = [];
                const bitCount = 12;
                for (let i = 0; i < bitCount; i++) {
                    const angle = (2 * Math.PI * i) / bitCount;
                    const speed = randomInt(2, 5);
                    this.explosionBits.push({
                        x: this.x,
                        y: this.y,
                        dx: Math.cos(angle) * speed,
                        dy: Math.sin(angle) * speed,
                        radius: randomInt(2, 4),
                        color: color,
                        alpha: 1
                    });
                }
            }
            for (let bit of this.explosionBits) {
                bit.x += bit.dx;
                bit.y += bit.dy;
                bit.alpha -= 0.03;
                ctx.globalAlpha = Math.max(bit.alpha, 0);
                drawCircle(bit.x, bit.y, bit.radius, bit.color);
            }
            ctx.globalAlpha = 1;
            ctx.restore();
            if (!this.finishedDeath) {
                setTimeout(() => { this.finishedDeath = true; }, 350);
            }
        } else {
            color = unitColors[this.type] || 'lightgray'; // Default color based on unit type
            drawCircle(this.x, this.y, this.radius, color); // Draw the unit as a circle with its type color
            this.drawHealth();
        }   
        
    }

    drawHealth() {
        ctx.save();
        const healthPercentage = this.health / 100; // Assuming max health is 100
        const crossSize = 20; // Size of the cross
        // Ensure this.team is correctly assigned and teamColors has the key
        const crossColor = teamColors[this.team] || teamColors["neutral"];

        ctx.filter = `brightness(${healthPercentage})`;

        // Draw the horizontal line of the cross
        drawLine(this.x - crossSize / 2, this.y, this.x + crossSize / 2, this.y, 5, crossColor);
        // Draw the vertical line of the cross
        drawLine(this.x, this.y - crossSize / 2, this.x, this.y + crossSize / 2, 5, crossColor);
        ctx.restore();
    }
    

    checkUnitCollision(newX, newY) {
        for (let otherUnit of currentUnits) {
            if (otherUnit === this || otherUnit.isDead) {
                continue;
            }

            const directionX = newX - otherUnit.x;
            const directionY = newY - otherUnit.y;
            const distance = Math.sqrt(directionX * directionX + directionY * directionY);

            if (distance < (this.radius + otherUnit.radius)) {
                return true; // Collision detected
            }
        }
    }

    checkBoundaryCollision(newX, newY) {
        if (newX - this.radius < 0 || newX + this.radius > canvas.width) {
            return true; // Collision with vertical boundary
        }
        if (newY - this.radius < 0 || newY + this.radius > canvas.height) {
            return true; // Collision with horizontal boundary
        }
        return false;
    }

    move(x, y) {
        const directionX = x - this.x;
        const directionY = y - this.y;

        const distance = Math.sqrt(directionX * directionX + directionY * directionY);
        const normalizedDirectionX = directionX / distance;
        const normalizedDirectionY = directionY / distance;

        const newX = this.x + normalizedDirectionX * this.speed;
        const newY = this.y + normalizedDirectionY * this.speed;
        const collidingWithUnits = this.checkUnitCollision(newX, newY)
        const collidingWithBoundary = this.checkBoundaryCollision(newX, newY)

        if (!collidingWithUnits && !collidingWithBoundary) {
            this.x = newX;
            this.y = newY;

        } else {
            if (collidingWithUnits) {
                let foundPath = false;
                let attempt = 0;

                // The unit's current direction.
                const currentAngle = Math.atan2(directionY, directionX);

                while (attempt < maxAttempts) {
                    // We'll check both left and right angles
                    const angleOffset = (attempt % 2 === 0) ? (attempt / 2) * angleStep : -((attempt + 1) / 2) * angleStep;
                    const newAngle = currentAngle + angleOffset;

                    const tryX = this.x + Math.cos(newAngle) * this.speed;
                    const tryY = this.y + Math.sin(newAngle) * this.speed;

                    // Check for both unit and boundary collisions.
                    if (!this.checkUnitCollision(tryX, tryY) && !this.checkBoundaryCollision(tryX, tryY)) {
                        this.x = tryX;
                        this.y = tryY;
                        foundPath = true;
                        break;
                    }

                    attempt++;
                }
            } else if (collidingWithBoundary) {
                // Prevent moving out of bounds
                this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, newX));
                this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, newY));
            }
        }
    }

    takeDamage(amount) {
        let newAmount = amount * ((this.damageReduction/100) || 1)
        this.health -= newAmount; // Reduce health by the damage amount
        if (this.health <= 0) {
            console.log(`${this.type} has died`)
            this.isDead = true; // Mark the unit as dead if health is 0 or less
            this.beingBuffed = false;
            this.health = 0; // Ensure health does not go below 0
        }
    }

    applyDamageBuff(percent) {
        let newDamage = Math.round(this.originalAttackPower + this.originalAttackPower * (percent/100));
        this.attackPower = newDamage;
        this.beingBuffed = true;
    }

    removeDamageBuff() {
        this.attackPower = this.originalAttackPower;
        this.beingBuffed = false;
    }

    applySpeedBuff(percent) {
        let newSpeed = Math.round(this.originalSpeed + this.originalSpeed * (percent/100))
        this.speed = newSpeed;
        this.beingBuffed = true;
    }

    removeSpeedBuff(percent) {
        this.speed = this.originalSpeed;
        this.beingBuffed = false;
    }

    findOptimalTarget() {
        let largestDistance = Infinity;
        let target = null;
        for (let unit of currentUnits) {
            if (unit.team !== this.team && !unit.isDead) {
                let distance = Math.sqrt((unit.x - this.x) ** 2 + (unit.y - this.y) ** 2);
                if (distance < largestDistance) {
                    target = unit;
                    largestDistance = distance;
                }
                
            }
        }

        return target;
    }

    findAlliesInRange() {
        let alliesInRange = [];
        let allies = [];
        for (let otherUnit of currentUnits) {
            if (otherUnit == this || otherUnit.isDead  || otherUnit.team !== this.team) {
                continue;
            }

            if (this.behavior == "support" && otherUnit.behavior == "support") {
                continue;
            }

            const directionX = this.x - otherUnit.x;
            const directionY = this.y - otherUnit.y;
            const distance = Math.sqrt(directionX * directionX + directionY * directionY);
            if (distance <= this.range) {
                alliesInRange.push(otherUnit);
                allies.push(otherUnit);
            } else {
                allies.push(otherUnit);
            }
        }

        // the position where the most allies are together or in radius
        let generalAreaPosition = null;
        if (alliesInRange.length > 0) {
            // Calculate the average position of all allies in range
            let sumX = 0;
            let sumY = 0;
            for (let ally of alliesInRange) {
                sumX += ally.x;
                sumY += ally.y;
            }

            generalAreaPosition = {
                x: sumX / alliesInRange.length,
                y: sumY / alliesInRange.length
            };
        }

        return { allies: alliesInRange, area: generalAreaPosition };
    }
    
}

class Infantry extends Unit {
    constructor(team, x, y) {
        super(team, x, y, "melee");
        this.type = 'Infantry';
    }
}

class Archer extends Unit {
    constructor(team, x, y) {
        super(team, x, y, "ranged", "hit");
        this.type = 'Archer';
        this.attackCooldown = this.attackCooldown*2.5
        this.range *= 5;
        this.health = 80;
        this.maxHealth = 80;
    }
}

class Commander extends Unit {
    constructor(team, x, y) {
        super(team, x, y, "support");
        this.type = "Commander";
        this.range *= 2;
        this.originalAttackPower = 5;
        this.attackPower = 5;
        this.attackCooldown = 3;
        this.originalSpeed = 3;
        this.speed = this.originalSpeed;
        this.health = 85;
        this.maxHealth = 85;

        this.isFleeing = false;
        this.isAggro = false;

        this.unitsBuffed = [];
        
    }

    update() {
        if (!this.isDead) {
            let inRange = [];
            let info = this.findAlliesInRange();
            let allies = info["allies"];
            if (allies.length > 0) {
                for (let ally of allies) {
                    if (!this.unitsBuffed.includes(ally)) {
                        
                        this.unitsBuffed.push(ally);
                    }
                    inRange.push(ally);
                }
            }   

            if (this.unitsBuffed.length > 0) {
                for (let unit of this.unitsBuffed) {
                    if (!inRange.includes(unit)) {
                        unit.removeDamageBuff();
                        unit.removeSpeedBuff();
                    } else if (unit) {
                        unit.applyDamageBuff(25);
                        unit.applySpeedBuff(50);
                    }
                }
            }

            let area = info["area"]
            if (area !== null) {
                const directionX = area.x - this.x;
                const directionY = area.y - this.y;
                const distance = Math.sqrt(directionX * directionX + directionY * directionY);
                if (distance > 1) {
                    this.move(area.x, area.y);
                }
            } else {
                let largestDistance = Infinity;
                let nearestAlly = {};
                for (let otherUnit of currentUnits) {
                    if (otherUnit == this || otherUnit.behavior == "support" || otherUnit.isDead || otherUnit.team !== this.team) {
                        continue;
                    }

                    const directionX = this.x - otherUnit.x;
                    const directionY = this.y - otherUnit.y;
                    const distance = Math.sqrt(directionX * directionX + directionY * directionY);
                    if (distance < largestDistance) {
                        console.log(`Found ${otherUnit.type}`);
                        nearestAlly = {
                            x: otherUnit.x,
                            y: otherUnit.y
                        };
                        largestDistance = distance;
                    }
                }

                if (nearestAlly && typeof nearestAlly.x === "number" && typeof nearestAlly.y === "number") {
                    this.isFleeing = true;
                    this.move(nearestAlly.x, nearestAlly.y);
                } else {
                    this.isAggro = true;
                }

                
            }

            let target = this.findOptimalTarget();
            if (target) {
                const directionX = target.x - this.x;
                const directionY = target.y - this.y;
                const distance = Math.sqrt(directionX * directionX + directionY * directionY);
                if (distance <= this.range/2 || this.isFleeing == true && distance <= this.range || this.isAggro && distance <= this.range) {
                     if (this.currentAttackCooldown <= 0) {
                        let projectile = new Projectile(this.team, this.x, this.y, 5, directionX, directionY, 2, this.attackPower)
                        console.log(`Created ${projectile.teamCasted} Projectile`)
                        this.currentAttackCooldown = this.attackCooldown; // Reset cooldown
                    } else {
                        this.currentAttackCooldown -= 1 / 60; // Decrease cooldown based on game speed
                    }
                } 

                if (this.isAggro && distance > this.range) {
                    this.move(target.x, target.y)
                }
            }
        } else {
            // If the unit is dead, it should not move or attack
            this.x = this.x; // Keep the unit's position unchanged
            this.y = this.y; // Keep the unit's position unchanged

            for (let unit of this.unitsBuffed) {
                unit.removeDamageBuff();
                unit.removeSpeedBuff();
            }
            this.unitsBuffed = [];
        }
    }

    draw() {
        let color = '';
        if (this.isDead) {
            color = 'gray'; // Color for dead units

            ctx.save();
            if (!this.explosionBits) {
                // Generate explosion bits only once
                this.explosionBits = [];
                const bitCount = 12;
                for (let i = 0; i < bitCount; i++) {
                    const angle = (2 * Math.PI * i) / bitCount;
                    const speed = randomInt(2, 5);
                    this.explosionBits.push({
                        x: this.x,
                        y: this.y,
                        dx: Math.cos(angle) * speed,
                        dy: Math.sin(angle) * speed,
                        radius: randomInt(2, 4),
                        color: color,
                        alpha: 1
                    });
                }
            }
            for (let bit of this.explosionBits) {
                bit.x += bit.dx;
                bit.y += bit.dy;
                bit.alpha -= 0.03;
                ctx.globalAlpha = Math.max(bit.alpha, 0);
                drawCircle(bit.x, bit.y, bit.radius, bit.color);
            }
            ctx.globalAlpha = 1;
            ctx.restore();
            if (!this.finishedDeath) {
                setTimeout(() => { this.finishedDeath = true; }, 350);
            }
        } else {
            color = unitColors[this.type] || 'lightgray'; // Default color based on unit type
            
            drawCircle(this.x, this.y, this.radius, color); // Draw the unit as a circle with its type color
            this.drawHealth();

            ctx.save();
            ctx.globalAlpha = 0.15;
            drawCircle(this.x, this.y, this.range, 'yellow');
            ctx.restore();
        }
        
    }
    
}

class HeavyInfantry extends Unit {
    constructor(team, x, y) {
        super(team, x, y, "melee");
        this.type = "HeavyInfantry";
        this.health = 120;
        this.maxHealth = 120;
        this.damageReduction = 15;
        this.speed = 0.85;
    }
}

class Mage extends Unit {
    constructor(team, x, y) {
        super(team, x, y, "ranged", "aoe");
        this.type = "Mage";
        this.range *= 5.5;
        this.attackCooldown = this.attackCooldown*2
        this.attackPower = this.attackPower/2
        this.health = 90;
        this.maxHealth = 90;

    }
}

class Medic extends Unit {
    constructor(team, x, y) {
        super(team, x, y, "support");
        this.type = "Medic";
        this.health = 80;
        this.maxHealth = 80;
        this.attackPower = 3;
        this.originalAttackPower = this.attackPower;
        this.range *= 2.5;

        this.healingUnits = [];

        this.healFrames = 120
        this.currentBeams = 0;
        this.maxBeams = 3;
    }
    
    update() {
        if (!this.isDead) {
            let info = this.findAlliesInRange();
            let allies = info["allies"];

            // Filter allies that need healing (health < max and not dead)
            let healableAllies = allies.filter(unit => unit.health < unit.maxHealth && !unit.isDead);

            // Sort by lowest health first
            healableAllies.sort((a, b) => a.health - b.health);

            // Only keep up to maxBeams
            this.healingUnits = healableAllies.slice(0, this.maxBeams);

            // Gradually heal each selected unit
            if (this.healingUnits.length > 0) {
                for (let unit of this.healingUnits) {
                    // Heal a small amount per frame
                    unit.health += (this.attackPower * (1 / this.healFrames));
                    if (unit.health > unit.maxHealth) {
                        unit.health = unit.maxHealth;
                    }
                }
            }

            // Remove units that are fully healed or dead from healingUnits
            this.healingUnits = this.healingUnits.filter(unit => unit.health < unit.maxHealth && !unit.isDead);

            // Optionally, follow the lowest health ally if any
            let area = info["area"];
            if (area) {
                // Find nearest enemy to the group area
                let nearestEnemy = null;
                let minDist = Infinity;
                for (let unit of currentUnits) {
                    if (unit.team !== this.team && !unit.isDead) {
                        let dist = Math.sqrt((unit.x - area.x) ** 2 + (unit.y - area.y) ** 2);
                        if (dist < minDist) {
                            minDist = dist;
                            nearestEnemy = unit;
                        }
                    }
                }
                let behindX = area.x;
                let behindY = area.y;
                if (nearestEnemy) {
                    // Vector from enemy to group area
                    let dx = area.x - nearestEnemy.x;
                    let dy = area.y - nearestEnemy.y;
                    let len = Math.sqrt(dx * dx + dy * dy) || 1;
                    // Stay 50px behind the group area (adjust as needed)
                    behindX = area.x + (dx / len) * this.range/2;
                    behindY = area.y + (dy / len) * this.range/2;
                }
                this.move(behindX, behindY);
            } else {
                let largestDistance = Infinity;
                let nearestAlly = {};
                for (let otherUnit of currentUnits) {
                    if (otherUnit == this || otherUnit.isDead || otherUnit.behavior == "support" || otherUnit.team !== this.team) {
                        continue;
                    }
                    const directionX = this.x - otherUnit.x;
                    const directionY = this.y - otherUnit.y;
                    const distance = Math.sqrt(directionX * directionX + directionY * directionY);
                    if (distance < largestDistance) {
                        nearestAlly = {
                            x: otherUnit.x,
                            y: otherUnit.y
                        };
                        largestDistance = distance;
                    }
                }
                if (nearestAlly && typeof nearestAlly.x === "number" && typeof nearestAlly.y === "number") {
                    // Try to stay behind the nearest ally (relative to nearest enemy)
                    let nearestEnemy = null;
                    let minDist = Infinity;
                    for (let unit of currentUnits) {
                        if (unit.team !== this.team && !unit.isDead) {
                            let dist = Math.sqrt((unit.x - nearestAlly.x) ** 2 + (unit.y - nearestAlly.y) ** 2);
                            if (dist < minDist) {
                                minDist = dist;
                                nearestEnemy = unit;
                            }
                        }
                    }
                    let behindX = nearestAlly.x;
                    let behindY = nearestAlly.y;
                    if (nearestEnemy) {
                        let dx = nearestAlly.x - nearestEnemy.x;
                        let dy = nearestAlly.y - nearestEnemy.y;
                        let len = Math.sqrt(dx * dx + dy * dy) || 1;
                        behindX = nearestAlly.x + (dx / len) * this.range/2;
                        behindY = nearestAlly.y + (dy / len) * this.range/2;
                    }
                    this.move(behindX, behindY);
                }
            }
        }
    }

    draw() {
        let color = '';
        if (this.isDead) {
            color = 'gray'; // Color for dead units

            ctx.save();
            if (!this.explosionBits) {
                // Generate explosion bits only once
                this.explosionBits = [];
                const bitCount = 12;
                for (let i = 0; i < bitCount; i++) {
                    const angle = (2 * Math.PI * i) / bitCount;
                    const speed = randomInt(2, 5);
                    this.explosionBits.push({
                        x: this.x,
                        y: this.y,
                        dx: Math.cos(angle) * speed,
                        dy: Math.sin(angle) * speed,
                        radius: randomInt(2, 4),
                        color: color,
                        alpha: 1
                    });
                }
            }
            for (let bit of this.explosionBits) {
                bit.x += bit.dx;
                bit.y += bit.dy;
                bit.alpha -= 0.03;
                ctx.globalAlpha = Math.max(bit.alpha, 0);
                drawCircle(bit.x, bit.y, bit.radius, bit.color);
            }
            ctx.globalAlpha = 1;
            ctx.restore();
            if (!this.finishedDeath) {
                setTimeout(() => { this.finishedDeath = true; }, 350);
            }
        } else {
            color = unitColors[this.type] || 'lightgray'; // Default color based on unit type
            
            drawCircle(this.x, this.y, this.radius, color); // Draw the unit as a circle with its type color
            this.drawHealth();

            ctx.save();
            ctx.globalAlpha = 0.7;
            for (let unit of this.healingUnits) {
                drawLine(this.x, this.y, unit.x, unit.y, 4, 'lightyellow');
            }
            ctx.restore();
        }
        
    }
}

class Barrack extends Unit {
    constructor(team, x, y) {
        super(team, x, y, "support");
        this.type = "Barrack";

        this.health = 200;
        this.maxHealth = 200;
        this.attackPower = 0;
        this.originalAttackPower = 0;
        this.currentAttackCooldown = 10;
        this.attackCooldown = 2; 

        this.originalSpeed = 0;
        this.speed = this.originalSpeed;
        this.range = 0;

        this.regenFrames = 100;
    }

    update() {
        if (!this.isDead) {
           if (this.health - 25 > 0) {
                if (this.currentAttackCooldown <= 0) {
                    this.spawnRandomUnitFromPool(["Infantry", "Archer"]);
                    this.takeDamage(25);
                
                    this.currentAttackCooldown = this.attackPower;
                } else {
                    this.currentAttackCooldown -= 1 / 60; // Decrease cooldown based on game speed  
                }
           } else {
                // begins regenerating to half hp
                if (this.health < this.maxHealth/2) {
                    this.health += 5 * (1 / this.regenFrames);
                }
           }
        } else {
            // If the unit is dead, it should not move or attack
        }
    }

    draw() {
        let color = '';
        if (this.isDead) {
            color = 'gray'; // Color for dead units

            ctx.save();
            if (!this.explosionBits) {
                // Generate explosion bits only once
                this.explosionBits = [];
                const bitCount = 12;
                for (let i = 0; i < bitCount; i++) {
                    const angle = (2 * Math.PI * i) / bitCount;
                    const speed = randomInt(2, 5);
                    this.explosionBits.push({
                        x: this.x,
                        y: this.y,
                        dx: Math.cos(angle) * speed,
                        dy: Math.sin(angle) * speed,
                        radius: randomInt(2, 4),
                        color: color,
                        alpha: 1
                    });
                }
            }
            for (let bit of this.explosionBits) {
                bit.x += bit.dx;
                bit.y += bit.dy;
                bit.alpha -= 0.03;
                ctx.globalAlpha = Math.max(bit.alpha, 0);
                drawCircle(bit.x, bit.y, bit.radius, bit.color);
            }
            ctx.globalAlpha = 1;
            ctx.restore();
            if (!this.finishedDeath) {
                setTimeout(() => { this.finishedDeath = true; }, 350);
            }
        } else {
            color = unitColors[this.type] || 'lightgray'; // Default color based on unit type

            // draws triangle centered on position
            let x1 = this.x;
            let y1 = this.y - this.radius;
            let x2 = this.x - this.radius;
            let y2 = this.y + this.radius;
            let x3 = this.x + this.radius;
            let y3 = this.y + this.radius;

            drawTriangle(x1, y1, x2, y2, x3, y3, color);
            this.drawHealth()
        }
    }

    spawnRandomUnitFromPool(pool) {
        if (pool.length > 0) {
            let randomIndex = Math.floor(Math.random() * pool.length);
            let randomUnit = pool[randomIndex];

            let unit = undefined;
            switch (randomUnit) {
                case 'Infantry':
                    unit = new Infantry(this.team, this.x, this.y);
                    break;
                case 'Archer':
                    unit = new Archer(this.team, this.x, this.y);
                    break;
                case 'Commander':
                    unit = new Commander(this.team, this.x, this.y);
                    break;
                case 'HeavyInfantry':
                    unit = new HeavyInfantry(this.team, this.x, this.y);
                    break;
                case 'Mage':
                    unit = new Mage(this.team, this.x, this.y);
                    break;
                case 'Medic':
                    unit = new Medic(this.team, this.x, this.y);
                    break;
                default:
                    unit = new Unit(this.team, this.x, this.y, "melee");
                    break;

            }
        }
    }
}

function generateUnit(type, team, x, y) {
    switch (type) {
        case 'Infantry':
            unit = new Infantry(team, x, y);
            break;
        case 'Archer':
            unit = new Archer(team, x, y);
            break;
        case 'Commander':
            unit = new Commander(team, x, y);
            break;
        case 'HeavyInfantry':
            unit = new HeavyInfantry(team, x, y);
            break;
        case 'Mage':
            unit = new Mage(team, x, y);
             break;
        case 'Medic':
            unit = new Medic(team, x, y);
            break;
        case 'Barrack':
            unit = new Barrack(team, x, y);
            break;
        default:
            unit = new Unit(team, x, y, "melee");
            break;
    }
}

let currentUnits = []; // array to store current units on the battlefield



let gameStarted = false; // flag to check if the battle/game has started
let gameRunning = false; // flag to check if the game is running
let gamePaused = false; // flag to check if the game is paused


let currentUnitType = unlockedUnits[0]; // default unit type


unitType.addEventListener('input', function() {
    currentUnitType = unitType.value;
    console.log(`Selected unit type: ${currentUnitType}`);
});

// draws a full screen grid for the battle area and stores the positions in an array
function createBattleGrid() {
    // Calculate the size of each grid cell.
    // The horizontal and vertical sizes will be different unless the canvas is a perfect square.
    const cellWidth = canvas.width / fixedRows;
    const cellHeight = canvas.height / fixedCols;

    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 20; i++) {
        drawLine(0, i * cellHeight, canvas.width, i * cellHeight, ctx.strokeStyle);
    }
    for (let j = 0; j <= 20; j++) {
        drawLine(j * cellWidth, 0, j * cellWidth, canvas.height, ctx.strokeStyle);
    }
    
}

function loadUnlockedUnits() {
    if (document.getElementById("unitType")) {
        let unitTypeSelect = document.getElementById("unitType");
        unitTypeSelect.innerHTML = ''; // Clear existing options

        // Categorize units by behavior
        const categories = {
            Melee: [],
            Ranged: [],
            Support: [],
            Extras: []
        };

        unlockedUnits.forEach(unit => {
            // Determine behavior by unit type
            let behavior = '';
            switch (unit) {
                case 'Infantry':
                case 'HeavyInfantry':
                    behavior = 'Melee';
                    break;
                case 'Archer':
                case 'Mage':
                    behavior = 'Ranged';
                    break;
                case 'Commander':
                case 'Medic':
                    behavior = 'Support';
                    break;
                default:
                    behavior = 'Extras';
            }
            if (categories[behavior]) {
                categories[behavior].push(unit);
            }
        });

        // Add options grouped by category
        Object.keys(categories).forEach(category => {
            if (categories[category].length > 0) {
                let optgroup = document.createElement('optgroup');
                optgroup.label = category;
                categories[category].forEach(unit => {
                    let option = document.createElement('option');
                    option.value = unit;
                    option.textContent = unit;
                    optgroup.appendChild(option);
                });
                unitTypeSelect.appendChild(optgroup);
            }
        });
    }
}

// runs the game logic
let previousUnlocked = []


function updateGameFrame(now) {
    if (gameRunning) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        createBattleGrid();

        for (let unit of currentUnits) {
            if (!unit.finishedDeath) {
                unit.update();
                unit.draw();
            } else {
                currentUnits = currentUnits.filter(other => other !== unit)
            }
        }

        for (let projectile of projectiles) {
            projectile.update();
            projectile.draw();
        }
    } else if (!gameStarted) {
        if (previousUnlocked !== unlockedUnits) {
            loadUnlockedUnits();
            previousUnlocked = unlockedUnits;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        createBattleGrid();

        for (let unit of currentUnits) {
            unit.draw();
        }
    }

    requestAnimationFrame(updateGameFrame);
}

requestAnimationFrame(updateGameFrame);



window.addEventListener('resize', function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    createBattleGrid(); // Recreate the grid
    const oldCellWidth = oldWidth / fixedRows;
    const oldCellHeight = oldHeight / fixedCols;

    const cellWidth = canvas.width / fixedRows;
    const cellHeight = canvas.height / fixedCols;
    for (let unit of currentUnits) {
        // repositions and resizes units based on the new canvas size
        const oldGridX = Math.floor(unit.x / oldCellWidth);
        const oldGridY = Math.floor(unit.y / oldCellHeight);

        let unitX = oldGridX * cellWidth + cellWidth / 2; // Center the unit in the cell
        let unitY = oldGridY * cellHeight + cellHeight / 2; // Center
        unit.x = unitX; // Update unit's x position
        unit.y = unitY; // Update unit's y position
        unit.draw(); // Redraw each unit on the canvas
    }
});

createBattleGrid();

// gets if we have clicked on the canvas
let boundaryTeam  = '';
let mouseDown = false;

function handleCanvasClick(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (!gameStarted) {
        if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
            const cellWidth = canvas.width / fixedRows;
            const cellHeight = canvas.height / fixedCols;
            const gridX = Math.floor(x / cellWidth);
            const gridY = Math.floor(y / cellHeight);

            boundaryTeam  = '';
            if (gridY < fixedCols/2) {
                boundaryTeam = 'enemy';
            } else {
                boundaryTeam = 'player';
            }

            let unitX = gridX * cellWidth + cellWidth / 2;
            let unitY = gridY * cellHeight + cellHeight / 2;

            if (event.buttons === 1) { // left click or hold
                if (!occupiedCells.includes(`${gridX},${gridY}`)) {
                    if (currentUnitType && unlockedUnits.includes(currentUnitType)) {
                        generateUnit(currentUnitType, boundaryTeam, unitX, unitY);
                        occupiedCells.push(`${gridX},${gridY}`);
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        createBattleGrid();
                        for (let unit of currentUnits) {
                            unit.draw();
                        }
                    } else {
                        console.log("No unit type selected.");
                    }
                }
            } else if (event.buttons === 2) { // right click or hold
                if (occupiedCells.includes(`${gridX},${gridY}`)) {
                    let unitX = gridX * cellWidth + cellWidth / 2;
                    let unitY = gridY * cellHeight + cellHeight / 2;
                    const index = currentUnits.findIndex(unit => unit.x === unitX && unit.y === unitY);
                    console.log(`Removing unit at (${gridX}, ${gridY}) - Index: ${index}`);
                    if (index !== -1) {
                        currentUnits.splice(index, 1);
                        occupiedCells = occupiedCells.filter(cell => cell !== `${gridX},${gridY}`);
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        createBattleGrid();
                        for (let unit of currentUnits) {
                            unit.draw();
                        }
                    }
                }
            }
        }
    }
}

canvas.addEventListener('mousedown', function(event) {
    mouseDown = true;
    handleCanvasClick(event);
});

canvas.addEventListener('mouseup', function() {
    mouseDown = false;
});

canvas.addEventListener('mouseleave', function() {
    mouseDown = false;
});

canvas.addEventListener('mousemove', function(event) {
    if (mouseDown) {
        handleCanvasClick(event);
    }
});

let unitDescriptions = {
    Infantry: "The backbone of your army, this versatile melee unit is effective in most combat situations.",
    Archer: "A ranged unit that fires projectiles at the closest enemy within its sight. While not as durable as other units, they are crucial for providing support from a distance.",
    Commander: "A powerful leader who inspires nearby troops. The Commander provides a significant attack and speed boost to all allied units in their radius. This buff does not stack, so careful positioning is key.",
    HeavyInfantry: "A heavily armored and more resilient version of the standard Infantry. These units are excellent at soaking up damage, thanks to their increased health and damage reduction.",
    Mage: "A powerful magic-user who deals damage with slower but more potent projectiles. Their spells explode on impact, dealing light damage to all enemies in a small area.",
    Medic: "A dedicated support unit that focuses on keeping your troops in the fight. The Medic fires a healing beam that slowly restores the health of injured allies. A Medic can support up to three units at a time."
}

canvas.addEventListener('mousemove', function(event) {
    const rect = canvas.getBoundingClientRect();
    // Remove any existing stat menu
    const existingMenu = document.getElementById('unitStatMenu');
    if (existingMenu) {
        existingMenu.remove();
    }
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    for (let unit of currentUnits) {
        const dx = mouseX - unit.x;
        const dy = mouseY - unit.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= unit.radius) {
            // Create a stat menu div
            const statMenu = document.createElement('div');
            statMenu.id = 'unitStatMenu';
            statMenu.style.position = 'absolute';
            statMenu.style.background = 'rgba(30,30,30,0.95)';
            statMenu.style.color = 'white';
            statMenu.style.border = '1px solid #888';
            statMenu.style.borderRadius = '8px';
            statMenu.style.padding = '10px';
            statMenu.style.zIndex = 1000;
            statMenu.style.fontSize = '14px';
            statMenu.style.pointerEvents = 'none';

            // Position the menu beside the unit
            statMenu.style.left = `${rect.left + unit.x + unit.radius + 10}px`;
            statMenu.style.top = `${rect.top + unit.y - 20}px`;

            // Fill in the stats
            statMenu.innerHTML = `
                <strong>${unit.type}</strong><br>
                Team: ${unit.team}<br>
                Health: ${unit.health}<br>
                Power: ${unit.attackPower}<br>
                Range: ${unit.range}<br>
                Speed: ${unit.speed}<br>
                Resistance: ${unit.damageReduction}<br>
                Description: ${unitDescriptions[unit.type]}<br>
                ${unit.isDead ? "<span style='color:red'>DEAD</span>" : ""}
                ${unit.beingBuffed && !unit.isDead ? "<span style='color:gold'>Buffed!</span>" : ""}
            `;

            // Add the menu to the body
            document.body.appendChild(statMenu);

            // Remove the menu when mouse leaves the canvas
            canvas.addEventListener('mouseout', function() {
                const menu = document.getElementById('unitStatMenu');
                if (menu) menu.remove();
            });
        }
    }
})

startButton.addEventListener('click', function() {
    if (!gameRunning) {
        gameRunning = true;
        gameStarted = true;
        startButton.textContent = "Battle Started";
    }
});

pauseButton.addEventListener('click', function() {
    if (gameStarted) {
        gameRunning = !gameRunning;
        if (gameRunning) {
            pauseButton.textContent = "Pause";
            gamePaused = false;
        } else {
            pauseButton.textContent = "Resume";
            gamePaused = true;
        }
    }
});

resetButton.addEventListener('click', function() {
    if (gameStarted) {
        pauseButton.textContent = "Pause";
        gamePaused = false;

        gameRunning = false;
        gameStarted = false;
        startButton.textContent = "Start Battle";

        currentUnits = []; // Clear current units
        occupiedCells = []; // Clear occupied cells
        gamePaused = false; // Reset pause state
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        createBattleGrid(); // Recreate the grid
    }
});



