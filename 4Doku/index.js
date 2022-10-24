'use strict';

// Weird terminology:
// Usually there is "row" and "column"
// Sometimes the 3rd dimension is referred to as a "tube"
// Since the 4th dimension doesn't have one, and is ususally labelled as "w"
// I have decided to call a 4th dimension slice a "Wumbo"
// If you have a better name (or found a preexisting one)
// Feel free to submit a pull request

const base = 2;
const basesqd = base ** 2;
const charset = '0123456789ABCDEF';

let board = [];
let selectedNumber = null;
let isSelected = false;
let selectedCell = [0, 0, 0, 0];

const prevBoard = [];

const loop4D = (s, ...funcs) => { // Loops a function over (w, x, y, z) < s
	funcs.unshift(() => {}, () => {}, () => {}, () => {}); // Pad the function list with empty functions
	const fx = funcs.pop();
	const fy = funcs.pop();
	const fz = funcs.pop();
	const fw = funcs.pop();
	for (let w = 0; w < s; w++) {
		fw(w);
		for (let z = 0; z < s; z++) {
			fz(z, w);
			for (let y = 0; y < s; y++) {
				fy(y, z, w);
				for (let x = 0; x < s; x++) {
					fx(x, y, z, w);
				}
			}
		}
	}
}
const randomItem = a => a[Math.random() * a.length | 0];

class Cell {
	constructor(element) {
		this.element = element;

		this.value = null;
		this.penciled = new Array(base ** 4).fill(false);
	}

	pencil(x) {
		this.value = null;
		this.penciled[x] = !this.penciled[x];
	}

	erase(x) {
		// this.value = null;
		this.penciled[x] = 0;
	}

	pen(x) {
		this.value = x;
		this.update();
	}

	update() {
		if (this.value === null) {
			this.element.innerText = '';
		} else {
			this.element.innerText = charset[this.value];
		}
	}

	clone() {
		const cloned = new Cell(this.element);
		cloned.value = this.value;
		cloned.penciled = [...this.penciled];
		return cloned;
	}
}

const getCell = (x, y, z, w) => board[w][z][y][x];
const cloneBoard = () => {
	const cloned = [];

	loop4D(basesqd, (w) => {
		cloned.push([]);
	}, (z, w) => {
		cloned[w].push([]);
	}, (y, z, w) => {
		cloned[w][z].push([]);
	}, (x, y, z, w) => {
		cloned[w][z][y].push(getCell(x, y, z, w).clone());
	});

	return cloned;
}

const updateBoard = () => {
	loop4D(basesqd, (x, y, z, w) => {
		getCell(x, y, z, w).update();
	});
}

const getNeighbors = (x, y, z, w) => {
	const neighbors = [[x, y, z, w]]; // Add the original cell for easier filtering

	const pushNonDuplicate = a => {
		for (const i in neighbors) {
			let isDuplicate = true;
			for (const j in neighbors[i]) {
				if (a[j] != neighbors[i][j]) {
					isDuplicate = false;
					break;
				}
			}
			if (isDuplicate) {
				return;
			}
		}
		neighbors.push(a)
	}

	for (let i = 0; i < basesqd; i++) {
		pushNonDuplicate([i, y, z, w]); // Row
		pushNonDuplicate([x, i, z, w]); // Column
		pushNonDuplicate([x, y, i, w]); // Tube
		pushNonDuplicate([x, y, z, i]); // Wumbo
	}

	const squareX = (x / base | 0) * base; // XOR 0 = Round Down
	const squareY = (y / base | 0) * base;
	const squareZ = (z / base | 0) * base;
	const squareW = (w / base | 0) * base;
	loop4D(base, (dx, dy, dz, dw) => {
		pushNonDuplicate([
			squareX + dx,
			squareY + dy,
			squareZ + dz,
			squareW + dw,
		]);
	});

	neighbors.splice(0, 1);
	return neighbors;
}

const removeAllHighlights = () => {
	Array.from(document.getElementsByClassName('selected')).forEach(x => x.classList.remove('selected'));
	Array.from(document.getElementsByClassName('highlighted')).forEach(x => x.classList.remove('highlighted'));
}

const highlightCell = (x, y, z, w) => {
	const neighbors = getNeighbors(x, y, z, w);
	getCell(x, y, z, w).element.classList.add('selected');
	for (const i in neighbors) {
		const neighbor = neighbors[i];
		getCell(...neighbor).element.classList.add('highlighted');
	}
}

const checkCell = (x, y, z, w) => {
	const neighbors = getNeighbors(x, y, z, w);
	const value = getCell(x, y, z, w).value;

	for (const i in neighbors) {
		const neighbor = getCell(...neighbors[i]);
		if (neighbor.value === null) { continue; }
		if (neighbor.value === value) {
			return false;
		}
	}

	return true;
}

const checkBoard = () => {
	loop4D(basesqd, (x, y, z, w) => {
		const pos = [x, y, z, w];
		const cell = getCell(...pos);
		if (checkCell(...pos)) {
			cell.element.classList.remove('error');
		} else {
			cell.element.classList.add('error');
		}
	});
}

const selectCell = (x, y, z, w) => {
	removeAllHighlights();
	highlightCell(x, y, z, w);
	selectedCell = [x, y, z, w];
}

const loadBoard = () => {
	const gameContainerElement = document.getElementById('game-container');

	for (let w = 0; w < basesqd; w++) { // 1D
		board.push([]);

		for (let z = 0; z < basesqd; z++) { // 2D
			board[w].push([]);
			const boardElement = document.createElement('div');
			boardElement.classList.add('board');

			for (let y = 0; y < basesqd; y++) { // 3D
				board[w][z].push([]);

				for (let x = 0; x < basesqd; x++) { // 4D

					const cell = document.createElement('div');
					const div = document.createElement('div');

					cell.classList.add('cell-wrapper');
					div.id = `cell-${x}-${y}-${z}-${w}`;
					// div.innerText = charset[Math.`random`() * 16 | 0];
					div.addEventListener('click', () => {
						// div.innerText = charset[selectedNumber];
						selectCell(x, y, z, w);
					});

					board[w][z][y].push(new Cell(div));

					cell.appendChild(div);
					boardElement.appendChild(cell);
				}
			}

			gameContainerElement.appendChild(boardElement);
		}
	}
}

const generateCompleteBoard = () => {
	// Create a random board via Wave Function Collapse

	// Pencil in all possible numbers for every cell
	loop4D(basesqd, (...pos) => {
		getCell(...pos).penciled = new Array(16).fill(true);
	});

	// Wave Function Collapse
	let cellsRemaining = basesqd ** 4;
	while (cellsRemaining > 1) {
		// Find cells with lowest entropy
		let lowestEntropy = base ** 4 + 1;
		let lowestEntropyCells = [];
		cellsRemaining = 0;
		let needsToBacktrack = false;

		loop4D(basesqd, (...pos) => {

			const cell = getCell(...pos);
			if (cell.value !== null) { return; } // Ignore solved cells
			cellsRemaining += 1;

			if (needsToBacktrack) { return; }

			// Calculate entropy
			const entropy = cell.penciled.reduce((a, b) => a + b, 0);
			if (entropy == 0) { // No possible solutions; must backtrack
				needsToBacktrack = true;
				return;
			}
			if (entropy < lowestEntropy) {
				lowestEntropy = entropy;
				lowestEntropyCells = [pos];
			}
			if (entropy == lowestEntropy) {
				lowestEntropyCells.push(pos);
			}
		});
		
		// Revert to a previously pseudo-valid board
		if (needsToBacktrack) { 
			board = prevBoard.pop();
			continue;
		}
		
		// Pick a random cell with minimum entropy
		const randomPos = randomItem(lowestEntropyCells);
		const cell = getCell(...randomPos);

		// Pick a random value
		const possibleValues = [];
		cell.penciled.forEach((x, i) => {
			if (x) { possibleValues.push(i); }
		});
		const randomValue = randomItem(possibleValues);

		// Set value and push to backtracking stack
		cell.erase(randomValue);
		prevBoard.push(cloneBoard());
		cell.pen(randomValue);

		const neighbors = getNeighbors(...randomPos);
		for (const i in neighbors) {
			const neighbor = neighbors[i];
			const neighborCell = getCell(...neighbor);

			neighborCell.erase(randomValue);
		}
	}
	prevBoard.length = 0;
}

const countSolutions = () => {
	
}

const generatePartialBoard = () => {

}

const setSelectedCell = a => {
	if (!isSelected) { return; }
	const cell = getCell(...selectedCell);

	cell.pen(a);

	// Highlight itself and neighboring cells if incorrect
	const neighbors = getNeighbors(...selectedCell);
	let isCorrect = true;
	for (const i in neighbors) {
		const neighbor = getCell(...neighbors[i]); // Check every "neighbor"
		if (neighbor.value === null) { continue; }

		if (neighbor.value == cell.value) { // If they have the same number, highlight it red
			cell.element.classList.add('error');
			neighbor.element.classList.add('error');
			isCorrect = false;
		} else {
			if (Array.from(neighbor.element.classList).includes('error')) { // When removed, check to see if its neighbors are also correct
				if (checkCell(...neighbors[i])) { // Otherwise, highlight it in red
					neighbor.element.classList.remove('error');
				}
			}
		}
	}
	if (isCorrect) {
		cell.element.classList.remove('error');
	}
}

const selectNumber = a => {
	if (a === null) {
		isSelected = false;
		selectedNumber = null;
		removeAllHighlights();
		return;
	}
	isSelected = true;

	if (isSelected) {
		removeAllHighlights();
		highlightCell(...selectedCell);
		setSelectedCell(a);
	} else {
		selectedNumber = a;
	}
}

const moveSelection = (dx, dy) => {
	let dz = 0;
	let dw = 0;

	if (selectedCell === null) { return; }

	const x = selectedCell[0];
	const y = selectedCell[1];
	const z = selectedCell[2];
	const w = selectedCell[3];
	if (x + dx < 0) { dz -= 1; }
	if (x + dx >= basesqd) { dz += 1; }
	if (y + dy < 0) { dw -= 1; }
	if (y + dy >= basesqd) { dw += 1; }
	if (z + dz < 0 || z + dz >= basesqd) { return; }
	if (w + dw < 0 || w + dw >= basesqd) { return; }

	selectCell(
		(x + basesqd + dx) % 4,
		(y + basesqd + dy) % 4,
		(z + basesqd + dz) % 4,
		(w + basesqd + dw) % 4
	);
}

const loadControls = () => {

	document.body.addEventListener('keydown', e => {
		switch (e.code) {
			case 'ArrowUp':
				moveSelection(0, -1); break;
			case 'ArrowDown':
				moveSelection(0, 1); break;
			case 'ArrowLeft':
				moveSelection(-1, 0); break;
			case 'ArrowRight':
				moveSelection(1, 0); break;
			case 'Backspace':
				setSelectedCell(null); break;
			case 'Escape':
				selectNumber(null); break;
			case 'Digit0':
				selectNumber(0); break;
			case 'Digit1':
				selectNumber(1); break;
			case 'Digit2':
				selectNumber(2); break;
			case 'Digit3':
				selectNumber(3); break;
			case 'Digit4':
				selectNumber(4); break;
			case 'Digit5':
				selectNumber(5); break;
			case 'Digit6':
				selectNumber(6); break;
			case 'Digit7':
				selectNumber(7); break;
			case 'Digit8':
				selectNumber(8); break;
			case 'Digit9':
				selectNumber(9); break;
			case 'KeyA':
				selectNumber(10); break;
			case 'KeyB':
				selectNumber(11); break;
			case 'KeyC':
				selectNumber(12); break;
			case 'KeyD':
				selectNumber(13); break;
			case 'KeyE':
				selectNumber(14); break;
			case 'KeyF':
				selectNumber(15); break;
		}
	});
}

const main = () => {
	loadControls();
	loadBoard();
}

window.onload = main;