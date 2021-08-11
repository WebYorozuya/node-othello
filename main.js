import deepcopy from 'deepcopy';
import keypress from 'keypress';

const CURSORS = ['up', 'down', 'right', 'left'];

class Point {
  constructor (x, y) {
    if (Number.isInteger(x) && Number.isInteger(y) && (x < 0 || 7 < x || y < 0 || 7 < y)) {
      throw new Error(`x and y must be 0 to 7 interger. actual x: ${x}, y: ${y}.`);
    }
    this.x = x;
    this.y = y;
    Object.freeze(this);
  }
}

const Stone = Object.freeze({
  WHITE: 1,
  BLACK: -1
});

class ReversiController {
  constructor (reversi, view) {
    this.cursor = new Point(0, 0);
    this.reversi = reversi;
    this.view = view;
    this.view.render(this.cursor, this.reversi);
  }

  input (key) {
    const ctrl_c = key => key.ctrl && key.name === 'c';
    const escape = key => key.name === 'escape';
    const quit = key => key.name === 'q';

    if (key && (ctrl_c(key) || escape(key) || quit(key))) {
      console.log('\x1b[18B')
      process.stdin.pause();
      return;
    }

    if (CURSORS.includes(key.name)) {
      this._handleCursors(key.name);
    }

    const triggers = ['enter', 'space'];
    if (triggers.includes(key.name)) {
      try {
        this.reversi.put(this.cursor);
      } catch {
        // do nothing
      }
    }

    this.view.render(this.cursor, this.reversi);
  }

  _handleCursors (key) {
    const [x, y]= [this.cursor.x, this.cursor.y];
    if (key === 'up') {
      if (y === 0) { 
        return
      }
      this.cursor = new Point(x, y - 1);
    }

    if (key === 'down') {
      if (y === 7) { 
        return
      }
      this.cursor = new Point(x, y + 1);
    }
        
    if (key === 'left') {
      if (x === 0) { 
        return
      }
      this.cursor = new Point(x - 1, y);
    }

    if (key === 'right') {
      if (x === 7) { 
        return
      }
      this.cursor = new Point(x + 1, y);
    }
  }
}

class Reversi {
  constructor () {
    this.board = [...Array(8).keys()].map(_ => { return [...Array(8).keys()].map(_ => { return null })});
    this.board[3][3] = Stone.BLACK;
    this.board[4][4] = Stone.BLACK;
    this.board[3][4] = Stone.WHITE;
    this.board[4][3] = Stone.WHITE;
    this.turn = Stone.WHITE;
  }

  put (p) {
    if (this.ref(p) !== null) {
      throw new Error(`There are already stones there. x: ${p.x}, y: ${p.y}`);
    }
    const ps = this.search(p);
    if (ps.length === 0) {
      return;
    }

    ps.forEach(p => this._put(p));

    this.board[p.y][p.x] = this.turn
    this.turn *= -1;
  }

  _put (p) {
    this.board[p.y][p.x] = this.turn;
  }

  ref (p) {
    return this.board[p.y][p.x];
  }

  search (p) {
    const self = this;
    const _search = (p, ps, _next) => {
      try {
        p = _next(p);
        if (self.ref(p) === null) {
          return [];
        }
        if (self.ref(p) !== self.turn) {
          ps.push(p);
          return _search(p, ps, _next);
        } else {
          return ps;
        }
      } catch {
        return [];
      }
    }
    let ps = [];
    ps = ps.concat(_search(p, [], p => new Point(p.x + 1, p.y)));
    ps = ps.concat(_search(p, [], p => new Point(p.x - 1, p.y)));
    ps = ps.concat(_search(p, [], p => new Point(p.x, p.y + 1)));
    ps = ps.concat(_search(p, [], p => new Point(p.x, p.y - 1)));
    ps = ps.concat(_search(p, [], p => new Point(p.x + 1, p.y + 1)));
    ps = ps.concat(_search(p, [], p => new Point(p.x + 1, p.y - 1)));
    ps = ps.concat(_search(p, [], p => new Point(p.x - 1, p.y + 1)));
    ps = ps.concat(_search(p, [], p => new Point(p.x - 1, p.y - 1)));
    return ps;
  }
}

class ReversiView {
  render (cursor, reversi) {
    const board = deepcopy(reversi.board);
    board[cursor.y][cursor.x] = '__cursor__';

    const mapper = (c) => {
      if (c === null) {
          return '   ';
      } else if (c === Stone.BLACK) {
          return ' ● ';
      } else if (c === Stone.WHITE) {
          return ' ○ ';
      } else {
        return ' ☆ ';
      }
    }

    const arr = [];
    const turn = reversi.turn === Stone.WHITE ? '黒' : '白';
    console.log(`${turn}の番`);
    arr.push('---------------------------------');
    for(const r of board) {
      const s = '|' + r.map(mapper).join('|') + '|';
      arr.push(s);
      arr.push('---------------------------------');
    }
    console.log(arr.join('\n') + '\x1B[18A');
  }
}

const main = () => {
  const reversi = new Reversi();
  const view = new ReversiView();
  const controller = new ReversiController(reversi, view);
  process.stdin.on('keypress', function (_, key) {
    controller.input(key);
  });
}

keypress(process.stdin);
process.stdin.setRawMode(true);
main();