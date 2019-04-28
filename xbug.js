
function Board(cols, rows, fields) {
    let self = this;
    if (cols * rows != fields.length) {
        throw "number of fields does not match board dimensions!";
    }
    self.cols = () => cols;
    self.rows = () => rows;
    self.fieldAt = function(col, row, value) {
        let index = row * cols + col;
        if (value != null) {
            fields[index] = value;
        }
        return fields[index];
    }
}

const INITIAL_FUEL = 10;

function Critter(col, row) {
    let self = this;
    let _img = document.getElementById("critter");
    let _col = col;
    let _row = row;
    let _moving = false;
    let _orientation = 'N';
    let _fuel = INITIAL_FUEL;

    _img.src = critterStillSrc;
    _img.style.left = _col * cx + 1;
    _img.style.top = _row * cy + 1;

    self.isMoving = () => _moving;
    self.col = () => _col;
    self.row = () => _row;
    self.orientation = () => _orientation;

    self.startMoving = function() {
        _img.src = critterMovingSrc;
        _moving = true;
    };

    self.reset = function(col, row) {
        self.setPosition(col, row);
        self.setOrientation('N');
        self.stopMoving();
        self.fuel(INITIAL_FUEL);
    };

    self.stopMoving = function() {
        _img.src = critterStillSrc;
        _moving = false;
    };

    self.setPosition = function(col, row) {
        _col = col;
        _row = row;
        _img.style.left = col * cx + 1;
        _img.style.top = row * cy + 1;
    };

    self.setOrientation = function(orientation) {
        _orientation = orientation;
        let angle;
        switch (orientation) {
            case 'N':
                angle = 0;
                break;
            case 'W':
                angle = 270;
                break;
            case 'E':
                angle = 90;
                break;
            case 'S':
                angle = 180;
                break;
        }
        _img.style.transform = "rotate(" + angle + "deg)";
    };

    self.fuel = function(value) {
        if (value != null) {
            _fuel = value;
        }
        return _fuel;
    };
}

function Program(opcodes, board, critter) {
    let self = this;
    let _pc = 0;

    self.advance = function() {
        if (_pc >= opcodes.length || critter.fuel() == 0) {
            critter.stopMoving();
            return false;
        }
        if (_pc == 0) {
            critter.startMoving();
        }
        let col = critter.col();
        let row = critter.row();
        let operation = getCritterOperation(opcodes[_pc]);
        let orientation = operation;
        switch (operation) {
            case 'N':
                row = critter.row() - 1;
                break;
            case 'W':
                col = critter.col() - 1;
                break;
            case 'E':
                col = critter.col() + 1;
                break;
            case 'S':
                row = critter.row() + 1;
                break;
            case '*E':
                orientation = null;
                if (board.fieldAt(col, row) == 1) {
                    critter.fuel(INITIAL_FUEL);
                    board.fieldAt(col, row, 0);
                }
                break;
        }
        if (orientation) {
            critter.setOrientation(operation);
        }
        critter.setPosition(col, row);
        critter.fuel(critter.fuel() - 1);
        _pc++;
        return true;
    };

    function getCritterOperation(opcode) {
        switch (opcode) {
            case 'E': return '*E';
        }
        switch (opcode + critter.orientation()) {
            case 'GN': return 'N';
            case 'GW': return 'W';
            case 'GE': return 'E';
            case 'GS': return 'S';
            case 'BN': return 'S';
            case 'BW': return 'E';
            case 'BE': return 'W';
            case 'BS': return 'N';
            case 'LN': return 'W';
            case 'LW': return 'S';
            case 'LE': return 'N';
            case 'LS': return 'E';
            case 'RN': return 'E';
            case 'RW': return 'N';
            case 'RE': return 'S';
            case 'RS': return 'W';
        }
    }
}

function compile(code) {
    let tokens = code.split("\n");
    let opcodes = [];
    for (let token of tokens) {
        let opcode;
        switch (token.toLowerCase()) {
            case 'vor':
                opcode = 'G';
                break;
            case 'links':
                opcode = 'L'
                break;
            case 'rechts':
                opcode = 'R'
                break;
            case 'zurück':
                opcode = 'B'
                break;
            case 'fressen':
                opcode = 'E'
                break;
            case '':
                break;
            default:
                throw 'Fehler: der Käfer kann nur vor, links, rechts, zurück oder fressen, nicht ' + token + '!';
        }
        if (opcode) {
            opcodes.push(opcode);
        }
    }
    return opcodes;
}

///////////////////////////////////////////////// Rendering

const surface = document.getElementById("surface");
const fuelGauge = document.getElementById("fuel");
const sourceEdit = document.getElementById("source");
const cx = 20;
const cy = 20;
const critterMovingSrc = 'critter_moving.gif';
const critterStillSrc = 'critter_still.png';
const board = new Board(10, 10, [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 3,
    0, 1, 0, 0, 0, 0, 0, 0, 1, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 1, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    2, 2, 2, 2, 2, 0, 2, 2, 2, 2,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
]);

let width = board.cols() * cx;
let height = board.rows() * cy;
let critter = new Critter(0, board.rows() - 1);
let program;
let ticker;

function render() {
    let ctx = surface.getContext("2d");
    let cols = board.cols();
    let rows = board.rows();

    // clear
    ctx.clearRect(0, 0, surface.width, surface.height);

    // draw lines
    for (col = 1; col < cols; col++) {
        ctx.moveTo(col * cx + 0.5, 0);
        ctx.lineTo(col * cx + 0.5, height);
    }
    for (row = 1; row < rows; row++) {
        ctx.moveTo(0, row * cy + 0.5);
        ctx.lineTo(width, row * cy + 0.5);
    }

    // draw board
    let leaf = document.getElementById("leaf");
    let goal = document.getElementById("goal");
    let block = document.getElementById("block");
    for (row = 0; row < rows; row++) {
        for (col = 0; col < cols; col++) {
            switch (board.fieldAt(col, row)) {
                case 1: // leaf
                    ctx.drawImage(leaf, col * cx + 0.5, row * cx + 0.5, cx, cy);
                    break;
                case 2: // block
                    // ctx.fillStyle = "black";
                    // ctx.rect(col * cx + 0.5, row * cx + 0.5, cx, cy);
                    // ctx.fill();
                    ctx.drawImage(block, col * cx, row * cy);
                    break;
                case 3: // goal
                    ctx.drawImage(goal, col * cx, row * cx);
                    break;
            }
        }
    }

    ctx.strokeStyle = "#c0c0c0";
    ctx.stroke(); 
}

function tick() {
    fuelGauge.innerText = critter.fuel();
    render();
    if (program.advance()) {
        let code = sourceEdit.value;
        sourceEdit.value = code.slice(code.indexOf('\n') + 1);
        ticker = window.setTimeout(tick, 500);
    }
}

function run() {
    let code = sourceEdit.value;
    let opcodes;
    try {
        opcodes = compile(code);
    } catch(ex) {
        window.alert(ex);
    }
    program = new Program(opcodes, board, critter);
    if (ticker) {
        window.clearTimeout(ticker);
    }
    ticker = window.setTimeout(tick, 500);
}

document.getElementById("runbtn").onclick = function(e) {
    run();
}

window.onload = function() {
    surface.width = width;
    surface.height = height;
    fuelGauge.innerText = critter.fuel();
    render();
}
