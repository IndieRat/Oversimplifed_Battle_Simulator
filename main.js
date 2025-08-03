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

const randomText = creditsTexts[randomInt(1, creditsTexts.length)]
credits.textContent = randomText

const speedText = document.getElementById('speedText')
const speedInput = document.getElementById('speedInput')

const startButton = document.getElementById('startBattle');
const resetButton = document.getElementById('resetBattle');
const pauseButton = document.getElementById('togglePause');

const unitType = document.getElementById('unitType');

// Game related code
const fixedRows = 15; // number of rows in the grid
const fixedCols = 10; // number of columns in the grid

let unlockedUnits = ['Infantry', 'Archer', 'Commander', 'HeavyInfantry']; // list of unlocked units
let occupiedCells = []; // array to keep track of occupied cells in the grid
let projectiles = [];

const teamColors = {
    player: 'lightgreen',
    enemy: 'red',
    neutral: 'white',
};

const unitColors = {
    Infantry: 'lightblue',
    Archer: 'lightgreen',
    Commander: 'lightcoral',
    HeavyInfantry: `grey`
}

const maxAttempts = 12
const angleStep = Math.PI / 12;

// classes and their inherits
class Projectile {
    constructor(teamCasted, x, y, radius, dx, dy, speed, damage) {
        this.teamCasted = teamCasted;
        this.x = x;
        this.y = y;

        this.radius = radius
        
        this.dx = dx;
        this.dy = dy;

        this.speed = speed;
        this.damage = damage;
        projectiles.push(this)
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

        const hit = this.checkUnitCollision(newX, newY)
        if (!hit) {
            this.x = newX
            this.y = newY
        } else {
            hit.takeDamage(this.damage)
            
            projectiles = projectiles.filter(p => p !== this);
        }
    }

    draw() {
        let color = teamColors[this.teamCasted] || teamColors['neutral']
        drawCircle(this.x, this.y, this.radius, color);
    }
}

class AOEProjectile extends Projectile {
    constructor(teamCasted, x, y, radius, dx, dy, speed, damage, range) {
        super(teamCasted, x, y, radius, dx, dy, speed, damage);
        this.range = range;
    }

    checkAOE(newX, newY) {
        for (let unit of currentUnits) {
            if (unit === this || unit.isDead || unit.team == this.teamCasted) {
                continue;
            }

            const directionX = newX - unit.x;
            const directionY = newY - unit.y;
            const distance = Math.sqrt(directionX * directionX + directionY * directionY);

            if (distance < this.range) {
                return unit; // Collision detected
            }
        }
    }

    update() {
        const distance = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        const normalizedDirectionX = this.dx / distance;
        const normalizedDirectionY = this.dy / distance;

        const newX = this.x + normalizedDirectionX * this.speed;
        const newY = this.y + normalizedDirectionY * this.speed;

        const hit = this.checkUnitCollision(newX, newY)
        if (!hit) {
            this.x = newX
            this.y = newY
        } else {
            hit.takeDamage(this.damage)
            let otherHits = this.checkAOE(hit.x. hit.y)
            for (let otherHit of otherHits) {
                otherHit.takeDamage(this.damage)
            }
            
            projectiles = projectiles.filter(p => p !== this);
        }
    }


}

class Unit {
    constructor(team, x, y, behavior) {
        this.team = team; // team the unit belongs to
        this.x = x;
        this.y = y;
        this.type = 'None';

        this.isDead = false; // flag to check if the unit is dead
        this.beingBuffed = false;

        this.health = 100; // default health for the unit
        this.originalAttackPower = 10; // origin attack power for the unit
        this.attackPower = this.originalAttackPower; // current attack power for the unit
        
        this.attackCooldown = 0.5; // cooldown for the unit's attack
        this.currentAttackCooldown = 0.5; // cooldown for the unit's attack
        this.damageReduction = 0;

        this.originalSpeed = 1;
        this.speed = this.originalSpeed; // default speed for the unit
        this.range = 25; // default range for the unit
        this.radius = 10 

        this.behavior = behavior || "";

        this.projectileType = "";
        currentUnits.push(this); // Add the new unit to the current units array
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
        } else {
            color = unitColors[this.type] || 'lightgray'; // Default color based on unit type
        }
        drawCircle(this.x, this.y, this.radius, color); // Draw the unit as a circle with its type color
        this.drawHealth();
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
        let newDamage = Math.round(this.attackPower + this.originalAttackPower * (percent/100));
        this.attackPower = newDamage;
        this.beingBuffed = true;
    }

    removeDamageBuff() {
        this.attackPower = this.originalAttackPower;
        this.beingBuffed = false;
    }

    applySpeedBuff(percent) {
        let newSpeed = Math.round(this.speed + this.originalSpeed * (percent/100))
        this.speed = newSpeed
        this.beingBuffed = true;
    }

    removeSpeedBuff(percent) {
        this.speed = this.originalSpeed
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
        let alliesInRange = []
        let allies = []
        for (let otherUnit of currentUnits) {
            if (otherUnit == this || otherUnit.behavior == "" || otherUnit.isDead || otherUnit.team != this.team) {
                continue;
            }

            const directionX = this.x - otherUnit.x;
            const directionY = this.y - otherUnit.y;
            const distance = Math.sqrt(directionX * directionX + directionY * directionY);
            if (distance <= this.range) {
                alliesInRange.push(otherUnit);
                allies.push(otherUnit)
            } else {
                allies.push(otherUnit)
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
        super(team, x, y, "ranged");
        this.type = 'Archer';
        this.range *= 5;
        this.health = 80;
        this.projectileType = "hit";
    }
}

class Commander extends Unit {
    constructor(team, x, y) {
        super(team, x, y);
        this.type = "Commander";
        this.range *= 2;
        this.originalAttackPower = 0;
        this.attackCooldown = this.originalAttackPower;
        this.originalSpeed = 1.5;
        this.speed = this.originalSpeed;
        this.health = 80;

        this.unitsBuffed = [];
        
    }

    update() {
        if (!this.isDead) {
            let inRange = [];
            let info = this.findAlliesInRange()
            let allies = info["allies"]
            if (allies.length > 0) {
                for (let ally of allies) {
                    if (!this.unitsBuffed.includes(ally)) {
                        ally.applyDamageBuff(25);
                        ally.applySpeedBuff(50);
                        this.unitsBuffed.push(ally);
                    
                    } else if (!ally.isBuffed) {
                        ally.applyDamageBuff(25);
                        ally.applySpeedBuff(50);
                    }
                    inRange.push(ally);
                }
            }

            for (let unit of this.unitsBuffed) {
                if (!inRange.includes(unit) && unit.isBuffed) {
                    unit.removeDamageBuff();
                    unit.removeSpeedBuff();
                }
            }

            let area = info["area"]
            if (area) {
                const directionX = area.x - this.x;
                const directionY = area.y - this.y;
                const distance = Math.sqrt(directionX * directionX + directionY * directionY);
                if (distance > 1) {
                    this.move(area.x, area.y)
                }
            } else {
                let largestDistance = Infinity;
                let nearestAlly = {};
                for (let otherUnit of currentUnits) {
                    if (otherUnit == this ||  otherUnit.isDead || otherUnit.behavior == "" || otherUnit.team !== this.team) {
                        continue;
                    }

                    const directionX = this.x - otherUnit.x;
                    const directionY = this.y - otherUnit.y;
                    const distance = Math.sqrt(directionX * directionX + directionY * directionY);
                    if (distance < largestDistance) {
                        console.log(`Found ${otherUnit.type}`)
                        nearestAlly = {
                            x: otherUnit.x,
                            y: otherUnit.y
                        };
                        largestDistance = distance;
                    }
                }

                if (nearestAlly) {
                    this.move(nearestAlly.x, nearestAlly.y)
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
            this.unitsBuffed = []
        }
    }

    draw() {
        let color = '';
        if (this.isDead) {
            color = 'gray'; // Color for dead units
        } else {
            color = unitColors[this.type] || 'lightgray'; // Default color based on unit type
        }
        drawCircle(this.x, this.y, this.radius, color); // Draw the unit as a circle with its type color
        this.drawHealth();

        ctx.save();
        ctx.globalAlpha = 0.15;
        drawCircle(this.x, this.y, this.range, 'yellow');
        ctx.restore();
    }
    
}

class HeavyInfantry extends Unit {
    constructor(team, x, y) {
        super(team, x, y, "melee");
        this.type = "HeavyInfantry";
        this.health = 120;
        this.damageReduction = 15;
        this.speed = 0.85;
    }
}

let currentUnits = []; // array to store current units on the battlefield



let gameStarted = false; // flag to check if the battle/game has started
let gameRunning = false; // flag to check if the game is running
let gamePaused = false; // flag to check if the game is paused
let gameSpeed = 1;
speedText.textContent = `Speed: ${gameSpeed}`;


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
        unlockedUnits.forEach(unit => {
            // Check if the option already exists before adding it
            // This prevents duplicates in the dropdown
            if (!unitTypeSelect.querySelector(`option[value="${unit}"]`)) { 
                let option = createElement('option', unit);
                option.value = unit;
                option.textContent = unit;
                unitTypeSelect.appendChild(option);
            }
        });
    }
}

// runs the game logic
let previousUnlocked = []
let lastUpdateTime = performance.now();

function updateGameFrame(now) {
    let delta = (now - lastUpdateTime) * (gameSpeed || 1) / 100;
    lastUpdateTime = now;

    if (gameRunning) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        createBattleGrid();

        for (let unit of currentUnits) {
            unit.update();
            unit.draw();
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

speedInput.addEventListener('input', function() {
    gameSpeed = Number(speedInput.value) || 1;
    speedText.textContent = `Speed: ${gameSpeed}`;
});


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
let boundaryTeam  = ''
canvas.addEventListener('mousedown', function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (!gameStarted) {
        // checks if its a left or right click and the click is within the bounds of the canvas
        if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
            
           
            // snaps the click position to the grid
            const cellWidth = canvas.width / fixedRows;
            const cellHeight = canvas.height / fixedCols;
            const gridX = Math.floor(x / cellWidth);
            const gridY = Math.floor(y / cellHeight);

             // checks if its on the player side or enemy side
            boundaryTeam  = ''
            if (gridY < fixedCols/2) {
                boundaryTeam = 'enemy'
            } else {
                boundaryTeam = 'player'
            }

            let unitX = gridX * cellWidth + cellWidth / 2; // Center the unit in the cell
            let unitY = gridY * cellHeight + cellHeight / 2; // Center

            if (event.button === 0) { // left click
            
                if (!occupiedCells.includes(`${gridX},${gridY}`)) {
                    if (currentUnitType && unlockedUnits.includes(currentUnitType)) {
                        let unit = undefined;
                        switch (currentUnitType) {
                            case 'Infantry':
                                unit = new Infantry(boundaryTeam, unitX, unitY);
                                break;
                            case 'Archer':
                                unit = new Archer(boundaryTeam, unitX, unitY);
                                break;
                            case 'Commander':
                                unit = new Commander(boundaryTeam, unitX, unitY);
                                break;
                            case 'HeavyInfantry':
                                unit = new HeavyInfantry(boundaryTeam, unitX, unitY);
                                break;
                            default:
                                unit = new Unit(boundaryTeam, unitX, unitY, "melee");
                                break;
                        }
                        
                        occupiedCells.push(`${gridX},${gridY}`); // Mark the cell as occupied
                        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
                        createBattleGrid(); // Recreate the grid
                        for (let unit of currentUnits) {
                            unit.draw(); // Redraw units
                        }
                        
                    } else {
                        console.log("No unit type selected.");
                    }
                }
            } else if (event.button === 2) { // right click
                if (occupiedCells.includes(`${gridX},${gridY}`)) {
                    // Find the unit at the clicked position
                    let unitX = gridX * cellWidth + cellWidth / 2; // Center the unit in the cell
                    let unitY = gridY * cellHeight + cellHeight / 2; // Center
                    const index = currentUnits.findIndex(unit => unit.x === unitX && unit.y === unitY);
                    console.log(`Removing unit at (${gridX}, ${gridY}) - Index: ${index}`);
                    if (index !== -1) {
                        currentUnits.splice(index, 1); // Remove the unit from the current units array
                        occupiedCells = occupiedCells.filter(cell => cell !== `${gridX},${gridY}`); // Remove the occupied cell
                        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
                        createBattleGrid(); // Recreate the grid
                        for (let unit of currentUnits) {
                            unit.draw(); // Redraw remaining units
                        }
                    }
                }
            }

        }
    }
});

// gets if we are hovering over a unit

let unitDescriptions = {
    Infantry: "The general combat unit, well rounded, built for melee",
    Archer: "Weaker yet fires a projectile at whoever is in its range and is the closest",
    Commander: "The general buffers, gives all nearby units a attack and speed buff"

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
                Attack: ${unit.attackPower}<br>
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



