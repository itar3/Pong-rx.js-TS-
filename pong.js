"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var operators_1 = require("rxjs/operators");
var rxjs_1 = require("rxjs");
function pong() {
    // Inside this function you will use the classes and functions 
    // from rx.js
    // to add visuals to the svg element in pong.html, animate them, and make them interactive.
    // Study and complete the tasks in observable exampels first to get ideas.
    // Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/ 
    // You will be marked on your functional programming style
    // as well as the functionality that you implement.
    // Document your code!  
    //initializing HTML elements
    var paddle = document.getElementById("paddle");
    var ball = document.getElementById("ball");
    var compPaddle = document.getElementById("paddle2");
    var gameOver = document.getElementById('gameOver');
    var compScoreHTML = document.getElementById('compScore');
    var playerScoreHTML = document.getElementById('playerScore');
    //State of the player paddle used for tracking the paddle
    var paddleState = {
        x: Number(paddle.getAttribute('x')),
        y: Number(paddle.getAttribute('y'))
    };
    //Keyboard controls for player, parts of the code are taken from Asteroids example given
    //
    var keydown$ = rxjs_1.fromEvent(document, 'keydown').pipe(operators_1.filter(function (_a) {
        var code = _a.code;
        return code === 'ArrowDown' || code === 'ArrowUp';
    }), operators_1.flatMap(function (d) { return rxjs_1.interval(10).pipe(operators_1.takeUntil(rxjs_1.fromEvent(document, 'keyup')), operators_1.map(function (_) { return d; })); }), operators_1.map(function (_a) {
        var key = _a.key;
        return key === 'ArrowDown' ? 5 : -5;
    }), operators_1.scan(movePaddle, paddleState))
        .subscribe(function (state) { return paddle.setAttribute('y', String(state.y)); });
    //function for moving the paddle, that takes into the account boundaries of top and bottow walls
    function movePaddle(s, dis) {
        return __assign(__assign({}, s), { x: s.x, y: s.y + dis > 0 && s.y + dis < 500 ? s.y + dis : s.y });
    }
    //random number generator, used in deciding ball direction
    var randomDirection = (Math.random() > 0.5 ? 1 : -1);
    var ballDirX = randomDirection, //the movement for ball's x-coordinate
    ballDirY = randomDirection; //the movement for ball's y-coordinate
    //Observable
    var observer = rxjs_1.interval(1);
    //////////////////////////////////////////////// Single mode //////////////////////////
    //for single player press 1 on the keyboard
    var singlePlayer$ = rxjs_1.fromEvent(document, "keydown").pipe(operators_1.filter(function (_a) {
        var code = _a.code;
        return code === 'Digit1';
    })).subscribe(function () {
        var compScore = 0;
        var playerScore = 0;
        //stream of ball position
        var ballAttributes = observer.pipe(operators_1.map(function () { return ({
            ballX: Number(ball.getAttribute('x')),
            ballY: Number(ball.getAttribute('y')),
            ballW: Number(ball.getAttribute('width'))
        }); }));
        //stream of comp paddle position
        var compPaddlePosition = observer.pipe(operators_1.map(function () { return ({
            compY: Number(compPaddle.getAttribute('y'))
        }); }));
        //Moving the ball if the scores are below 7
        var moveBall = observer.pipe(operators_1.filter(function () { return playerScore < 7 && compScore < 7; })).subscribe(function () {
            ball.setAttribute('y', String(ballDirY + Number(ball.getAttribute('y'))));
            ball.setAttribute('x', String(ballDirX + Number(ball.getAttribute('x'))));
        });
        //moving paddle up based on the ball Y coordinate value, if the ball is above the centre of the paddle  - move up
        var moveCompPaddleUp = ballAttributes.pipe(operators_1.filter(function (_a) {
            var ballY = _a.ballY;
            return ballY > Number(compPaddle.getAttribute('y')) + Number(compPaddle.getAttribute('height')) / 2;
        })).subscribe(function () { return compPaddle.setAttribute('y', String(Number(compPaddle.getAttribute('y')) + 0.7)); });
        //moving paddle down using same way, if the ball is below centre of the paddle - move down
        var moveCompPaddleDown = ballAttributes.pipe(operators_1.filter(function (_a) {
            var ballY = _a.ballY;
            return ballY < Number(compPaddle.getAttribute('y')) + Number(compPaddle.getAttribute('height')) / 2;
        })).subscribe(function () { return compPaddle.setAttribute('y', String(Number(compPaddle.getAttribute('y')) - 0.7)); }); //0.7 is tuned so the computer isn't too hard
        //Restricting comp paddle from getting outside of the top wall of the canvas
        var compPaddleTopBarrier = compPaddlePosition.pipe(operators_1.filter(function (_a) {
            var compY = _a.compY;
            return (compY <= 0);
        })) //constatly checking the Y coordinate of the comp paddle, if its less the value of 0
            .subscribe(function () { return (compPaddle.setAttribute('y', String(0))); }); //if it does restricting it at the value of 0
        //Restricting comp paddle from getting outside of the bottom wall of the canvas
        var compPaddleBottomBarrier = compPaddlePosition.pipe(operators_1.filter(function (_a) {
            var compY = _a.compY;
            return (compY > 500);
        })) //constatly checking the Y coordinate of the comp paddle, if its exceeding the value of 500 
            .subscribe(function () { return (compPaddle.setAttribute('y', String(500))); }); //if it does restricting it at the value of 500
        //Adding to the player's score if the ball goes over comp paddle's goals and reset the ball
        var playerScored = ballAttributes.pipe(operators_1.filter(function (_a) {
            var ballX = _a.ballX, ballW = _a.ballW;
            return ballX + ballW > 600;
        }))
            .subscribe(function () {
            ball.setAttribute('y', "300");
            ball.setAttribute('x', "300");
            playerScore += 1;
            playerScoreHTML.innerHTML = String(playerScore);
        });
        //Adding to the comp paddle's score if the ball goes over player's goals and reset the ball
        var compScored = ballAttributes.pipe(operators_1.filter(function (_a) {
            var ballX = _a.ballX, ballW = _a.ballW;
            return ballX - ballW < 0;
        }))
            .subscribe(function () {
            ball.setAttribute('y', "300");
            ball.setAttribute('x', "300");
            compScore += 1;
            compScoreHTML.innerHTML = String(compScore);
        });
        //Hadling collissions of the ball with paddles
        var handlePaddleCollisions = observer.pipe(operators_1.map(function () { return ({
            ballX: Number(ball.getAttribute('x')),
            ballY: Number(ball.getAttribute('y')),
            ballW: Number(ball.getAttribute('width')),
            paddleX: Number(paddle.getAttribute('x')),
            paddleY: Number(paddle.getAttribute('y')),
            compX: Number(compPaddle.getAttribute('x')),
            compY: Number(compPaddle.getAttribute('y')),
            paddleHeight: Number(paddle.getAttribute('height')),
            paddleWidth: Number(paddle.getAttribute('width'))
        }); }), operators_1.filter(function (_a) {
            var ballX = _a.ballX, ballW = _a.ballW, ballY = _a.ballY, paddleX = _a.paddleX, paddleHeight = _a.paddleHeight, paddleWidth = _a.paddleWidth, paddleY = _a.paddleY, compX = _a.compX, compY = _a.compY;
            return (ballX + ballW == compX - paddleWidth && ballY + ballW / 2 >= compY && ballY - ballW / 2 <= compY + paddleHeight //checking if the ball touches comp paddle
                ||
                    (ballX + ballW / 2 == paddleX + paddleWidth && ballY + ballW / 2 >= paddleY) && ballY - ballW / 2 <= paddleY + paddleHeight);
        })) //checking of the ball touches player paddle
            .subscribe(function () { return (ballDirX *= -1); }); //if it does - change direction on the x coordinate
        //Handling top and bottom wall collisions with the ball
        var handleWallCollisions = ballAttributes.pipe(operators_1.filter(function (_a) {
            var ballY = _a.ballY;
            return (ballY >= 600 || ballY <= 0);
        }) //if ball's Y cooridntae goes over 600 or less or equal 0
        ).subscribe(function () { return (ballDirY *= -1); }); //if it does - change the direction on Y coordinate 
        //when the playerScore or compScore reaches 7 - print the winner
        observer.pipe(operators_1.filter(function () { return playerScore == 7; })).subscribe(function () { return gameOver.innerHTML = 'You have won!'; });
        observer.pipe(operators_1.filter(function () { return compScore == 7; })).subscribe(function () { return gameOver.innerHTML = 'You have lost!'; });
    });
    ////////////////////////////////////// MultiPlayer /////////////////////////////
    //for multiplayer press 2 on the keyboard
    var multiPlayer$ = rxjs_1.fromEvent(document, "keydown").pipe(operators_1.filter(function (_a) {
        var code = _a.code;
        return code === 'Digit2';
    })).subscribe(function () {
        var compScore = 0;
        var playerScore = 0;
        var ballAttributes = observer.pipe(operators_1.map(function () { return ({
            ballX: Number(ball.getAttribute('x')),
            ballY: Number(ball.getAttribute('y')),
            ballW: Number(ball.getAttribute('width'))
        }); }));
        //moving paddle up based on the ball Y coordinate value
        var canvas = document.getElementById('canvas');
        //mouse control for second player
        var mousemove$ = rxjs_1.fromEvent(canvas, 'mousemove')
            .subscribe(function (_a) {
            var clientY = _a.clientY;
            return compPaddle.setAttribute('y', String(clientY - Number(compPaddle.getAttribute('height')) / 2));
        });
        //Adding to the player's score if the ball goes over comp paddle's goals and reset the ball
        var playerScored = ballAttributes.pipe(operators_1.filter(function (_a) {
            var ballX = _a.ballX, ballW = _a.ballW;
            return ballX + ballW > 600;
        }))
            .subscribe(function () {
            ball.setAttribute('y', "300");
            ball.setAttribute('x', "300");
            playerScore += 1;
            playerScoreHTML.innerHTML = String(playerScore);
        });
        //Adding to the comp paddle's score if the ball goes over player's goals and reset the ball
        var compScored = ballAttributes.pipe(operators_1.filter(function (_a) {
            var ballX = _a.ballX, ballW = _a.ballW;
            return ballX - ballW < 0;
        }))
            .subscribe(function () {
            ball.setAttribute('y', "300");
            ball.setAttribute('x', "300");
            compScore += 1;
            compScoreHTML.innerHTML = String(compScore);
        });
        //
        var moveBall = observer.pipe(operators_1.filter(function () { return playerScore < 7 && compScore < 7; })).subscribe(function () {
            ball.setAttribute('y', String(ballDirY + Number(ball.getAttribute('y'))));
            ball.setAttribute('x', String(ballDirX + Number(ball.getAttribute('x'))));
        });
        //Hadling collissions of the ball with paddles
        var handlePaddleCollisions = observer.pipe(operators_1.map(function () { return ({
            ballX: Number(ball.getAttribute('x')),
            ballY: Number(ball.getAttribute('y')),
            paddleX: Number(paddle.getAttribute('x')),
            paddleY: Number(paddle.getAttribute('y')),
            compX: Number(compPaddle.getAttribute('x')),
            compY: Number(compPaddle.getAttribute('y')),
            paddleHeight: Number(paddle.getAttribute('height')),
            paddleWidth: Number(paddle.getAttribute('width'))
        }); }), operators_1.filter(function (_a) {
            var ballX = _a.ballX, ballY = _a.ballY, paddleX = _a.paddleX, paddleHeight = _a.paddleHeight, paddleWidth = _a.paddleWidth, paddleY = _a.paddleY, compX = _a.compX, compY = _a.compY;
            return (ballX == compX - paddleWidth && ballY >= compY && ballY <= compY + paddleHeight //checking if the ball touches comp paddle
                ||
                    (ballX == paddleX + paddleWidth && ballY >= paddleY) && ballY <= paddleY + paddleHeight);
        })) //checking of the ball touches player paddle
            .subscribe(function () { return (ballDirX *= -1); }); //if it does - change direction on the x coordinate
        //Handling top and bottom wall collisions with the ball
        var handleWallCollisions = ballAttributes.pipe(operators_1.filter(function (_a) {
            var ballY = _a.ballY;
            return (ballY >= 600 || ballY <= 0);
        }) //if ball's Y cooridntae goes over 600 or less or equal 0
        ).subscribe(function () { return (ballDirY *= -1); }); //if it does - change the direction on Y coordinate 
        observer.pipe(operators_1.filter(function () { return playerScore == 7; })).subscribe(function () { return gameOver.innerHTML = 'Player 1 won!'; });
        observer.pipe(operators_1.filter(function () { return compScore == 7; })).subscribe(function () { return gameOver.innerHTML = 'Player 2 won!'; });
    });
    /////////////////////////////////Training mode////////////////////////
    //for training mode press 3 on the keyboard
    var training$ = rxjs_1.fromEvent(document, "keydown").pipe(operators_1.filter(function (_a) {
        var code = _a.code;
        return code === 'Digit3';
    })).subscribe(function () {
        //chaning playerScore text field to indicate that we are in training mode, since we dont need the score
        playerScoreHTML.innerHTML = 'Training mode';
        playerScoreHTML.setAttribute('font-size', '20px');
        //taking away the computer score counter
        compScoreHTML.innerHTML = ' ';
        var ballAttributes = observer.pipe(operators_1.map(function () { return ({
            ballX: Number(ball.getAttribute('x')),
            ballY: Number(ball.getAttribute('y')),
            ballW: Number(ball.getAttribute('width'))
        }); }));
        var compPaddleAttributes = observer.pipe(operators_1.map(function () { return ({
            compX: Number(compPaddle.getAttribute('x')),
            compY: Number(compPaddle.getAttribute('y'))
        }); }));
        //chaning comp paddle into training big paddle
        observer.subscribe(function () { compPaddle.setAttribute('y', "0"), compPaddle.setAttribute('x', '580'), compPaddle.setAttribute('height', '600'); });
        //Adding to the comp paddle's score if the ball goes over player's goals and reset the ball
        var compScored = ballAttributes.pipe(operators_1.filter(function (_a) {
            var ballX = _a.ballX, ballW = _a.ballW;
            return ballX - ballW < 0;
        }))
            .subscribe(function () {
            ball.setAttribute('y', "300");
            ball.setAttribute('x', "300");
        });
        //
        var moveBall = observer.subscribe(function () {
            ball.setAttribute('y', String(ballDirY + Number(ball.getAttribute('y'))));
            ball.setAttribute('x', String(ballDirX + Number(ball.getAttribute('x'))));
        });
        //Hadling collissions of the ball with paddles
        var handlePaddleCollisions = observer.pipe(operators_1.map(function () { return ({
            ballX: Number(ball.getAttribute('x')),
            ballY: Number(ball.getAttribute('y')),
            paddleX: Number(paddle.getAttribute('x')),
            paddleY: Number(paddle.getAttribute('y')),
            compX: Number(compPaddle.getAttribute('x')),
            compY: Number(compPaddle.getAttribute('y')),
            paddleHeight: Number(paddle.getAttribute('height')),
            paddleWidth: Number(paddle.getAttribute('width')),
            compH: Number(compPaddle.getAttribute('height')),
            compW: Number(compPaddle.getAttribute('width'))
        }); }), operators_1.filter(function (_a) {
            var ballX = _a.ballX, ballY = _a.ballY, paddleX = _a.paddleX, paddleHeight = _a.paddleHeight, paddleWidth = _a.paddleWidth, paddleY = _a.paddleY, compX = _a.compX, compY = _a.compY, compH = _a.compH, compW = _a.compW;
            return (ballX == compX - compW && ballY >= compY && ballY <= compY + compH //checking if the ball touches comp paddle
                ||
                    (ballX == paddleX + paddleWidth && ballY >= paddleY) && ballY <= paddleY + paddleHeight);
        })) //checking of the ball touches player paddle
            .subscribe(function () { return (ballDirX *= -1); }); //if it does - change direction on the x coordinate
        //Handling top and bottom wall collisions with the ball
        var handleWallCollisions = ballAttributes.pipe(operators_1.filter(function (_a) {
            var ballY = _a.ballY;
            return (ballY >= 600 || ballY <= 0);
        }) //if ball's Y cooridntae goes over 600 or less or equal 0
        ).subscribe(function () { return (ballDirY *= -1); }); //if it does - change the direction on Y coordinate 
    });
}
// the following simply runs your pong function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
    window.onload = function () {
        pong();
    };
