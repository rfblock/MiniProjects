'use strict';

const width = 7;
const height = 6;
const size = width * height;

const board = [];
let gameEnd = false;

const PLAYER1 = 1;
const PLAYER2 = 2;

let player1Timer = 5 * 1000;
let player2Timer = 5 * 1000;

const timerIncrement = 1 * 1000;

let timerStarted = false;

let turn = PLAYER1;

const formatTime = ms => {
	const m = String(ms / 60000 | 0);
	if (ms > 60 * 1000) { // M:ss
		const s = String((ms / 1000) % 60 | 0).padStart(2, '0');
		return `${m}:${s}`
	} else { // ss.mm
		const s = String((ms / 1000) % 60 | 0);
		const _ms = String(ms % 1000 | 0).padEnd(2, '0').slice(0, 2);
		return `${s}.${_ms}`
	}
}

const updateClock = () => {
	const timer1Element = document.getElementById('timer-1');
	const timer2Element = document.getElementById('timer-2');

	timer1Element.innerText = formatTime(player1Timer);
	timer2Element.innerText = formatTime(player2Timer);
}

const swapTurn = () => {
	const timer1Element = document.getElementById('timer-1');
	const timer2Element = document.getElementById('timer-2');

	if (!timerStarted) {
		timerStarted = true;

		let start;
		let done = false;

		const tickTimer = ts => {
			if (start === undefined) { start = ts; }
			const elapsed = ts - start;
			start = ts;
			
			if (turn == PLAYER1) { player1Timer -= elapsed }
			else { player2Timer -= elapsed }

			if (player1Timer < 0) {
				player1Timer = 0;
				done = true;
				turn = (PLAYER1 + PLAYER2) - turn;
				highlightWin([]);
			}
			if (player2Timer < 0) {
				player2Timer = 0;
				done = true;
				turn = (PLAYER1 + PLAYER2) - turn;
				highlightWin([]);
			}

			updateClock();

			if (!done && !gameEnd) {
				window.requestAnimationFrame(tickTimer);
			}
		}

		requestAnimationFrame(tickTimer);
	}

	turn = (PLAYER1 + PLAYER2) - turn;

	if (turn == PLAYER2) {
		player2Timer += timerIncrement;
		timer2Element.classList.add('active');
		timer1Element.classList.remove('active');
	} else {
		player1Timer += timerIncrement;
		timer1Element.classList.add('active');
		timer2Element.classList.remove('active');
	}
}

const placePiece = col => {
	for (let i = col + width * (height - 1); i >= 0; i -= width) {
		if (board[i]) { continue; }
		board[i] = turn;
		document.getElementById(`tile-${i}`).classList.add(['', 'player-1', 'player-2'][turn]);
		checkWin(i);

		swapTurn();
		return true;
	}

	return false;
}

const highlightWin = idxs => {
	gameEnd = true;

	const ids = idxs.map(i => `tile-${i}`);
	console.log(ids);
	for (const element of document.getElementsByClassName('tile')) {
		console.log(element.id);
		if (ids.includes(element.id)) { console.log('skip'); continue; }
		element.classList.add('desaturated')
	}

	const bannerElement = document.getElementById('banner');
	bannerElement.innerText = ['Red', 'Yellow'][turn-1] + ' Wins!'
	bannerElement.classList.add('shown');
}

const checkWin = idx => {
	const row = idx / width | 0;
	const col = idx % width;

	let colorToMatch = board[idx];

	const checkDirection = (dx, dy) => {
		const streak = [idx]
		let sum = 1;
		for (let x = col + dx, y = row + dy; 0 <= x && x < width && 0 <= y && y <= height; x += dx, y += dy) {
			const i = y * width + x;
			if (board[i] != colorToMatch) { break; }
			streak.push(i);
			sum++;
		}
		for (let x = col - dx, y = row - dy; 0 <= x && x < width && 0 <= y && y <= height; x -= dx, y -= dy) {
			const i = y * width + x;
			if (board[i] != colorToMatch) { break; }
			streak.push(i);
			sum++;
		}
		if (sum >= 4) {
			highlightWin(streak);
		}
	}

	checkDirection(1, 0); // LR
	checkDirection(0, 1); // UD
	checkDirection(1, 1); // DR
	checkDirection(1, -1); // UR
}

const loadBoard = () => {
	const parentElement = document.getElementById('game-container');
	for (let i = 0; i < size; i++) {
		board.push(0);
		const element = document.createElement('div');
		element.id = `tile-${i}`
		element.classList.add('tile');
		element.addEventListener('click', () => {
			if (gameEnd) { return; }
			let move = placePiece(i % width);
		});

		parentElement.appendChild(element);
	}
}

const main = () => {
	updateClock();
	loadBoard();
}

window.addEventListener('load', main);