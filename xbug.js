
const surface = document.getElementById("surface")
const cols = 10
const rows = 10
const cx = 20
const cy = 20
const critterMovingSrc = 'critter_moving.gif'
const critterStillSrc = 'critter_still.png'

let width = cols * cx
let height = rows * cy

function Critter() {
    let self = this;
    let _img = document.getElementById("critter");
    var _col = 0;
    var _row = rows - 1;
    var _moving = false;
    var _orientation = 'N';

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
    }

    self.reset = function() {
        self.setPosition(0, rows - 1);
        self.setOrientation('N');
        self.stopMoving();
    }

    self.stopMoving = function() {
        _img.src = critterStillSrc;
        _moving = false;
    }

    self.setPosition = function(col, row) {
        _col = col;
        _row = row;
        _img.style.left = col * cx + 1;
        _img.style.top = row * cy + 1;
    }

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
    }
}

function Program(opcodes, critter) {
    let self = this;
    var _pc = 0;

    self.advance = function() {
        if (_pc >= opcodes.length) {
            critter.stopMoving();
            return false;
        }
        if (_pc == 0) {
            critter.startMoving();
        }
        let col, row;
        let orientation = getCritterMovement(opcodes[_pc]);
        switch (orientation) {
            case 'N':
                col = critter.col();
                row = critter.row() - 1;
                break;
            case 'W':
                col = critter.col() - 1;
                row = critter.row();
                break;
            case 'E':
                col = critter.col() + 1;
                row = critter.row();
                break;
            case 'S':
                col = critter.col();
                row = critter.row() + 1;
                break;
        }
        critter.setOrientation(orientation);
        critter.setPosition(col, row);
        _pc++;
        return true;
    }

    function getCritterMovement(opcode) {
        switch (opcode + critter.orientation()) {
            case 'GN': return 'N'
            case 'GW': return 'W'
            case 'GE': return 'E'
            case 'GS': return 'S'
            case 'BN': return 'S'
            case 'BW': return 'E'
            case 'BE': return 'W'
            case 'BS': return 'N'
            case 'LN': return 'W'
            case 'LW': return 'S'
            case 'LE': return 'N'
            case 'LS': return 'E'
            case 'RN': return 'E'
            case 'RW': return 'N'
            case 'RE': return 'S'
            case 'RS': return 'W'
        }
    }
}

function render() {
    let ctx = surface.getContext("2d");

    for (col = 1; col < cols; col++) {
        ctx.moveTo(col * cx + 0.5, 0);
        ctx.lineTo(col * cx + 0.5, height);
    }
    for (row = 1; row < rows; row++) {
        ctx.moveTo(0, row * cy + 0.5);
        ctx.lineTo(width, row * cy + 0.5);
    }

    ctx.strokeStyle = "#c0c0c0";
    ctx.stroke(); 
}

let critter = new Critter();
var program;
var ticker;

function tick() {
    render()
    if (program.advance()) {
        ticker = window.setTimeout(tick, 500);
    }
}

function run() {
    let code = document.getElementById("source").value;
    let opcodes
    try {
        opcodes = compile(code);
    } catch(ex) {
        window.alert(ex);
    }
    critter.reset();
    program = new Program(opcodes, critter);
    if (ticker) {
        window.clearTimeout(ticker);
    }
    ticker = window.setTimeout(tick, 500);
}

function compile(code) {
    let tokens = code.split("\n");
    let opcodes = [];
    for (var token of tokens) {
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
            case '':
                break;
            default:
                throw 'Fehler: der Käfer kann nur vor, links, rechts oder zurück, nicht ' + token + '!';
        }
        if (opcode) {
            opcodes.push(opcode);
        }
    }
    return opcodes;
}

document.getElementById("runbtn").onclick = function(e) {
    run();
}

window.onload = function() {
    surface.width = width;
    surface.height = height;
    render();
}
