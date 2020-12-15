import {map, flatMap, takeUntil, filter, scan} from 'rxjs/operators';
import { fromEvent,interval, Observable} from 'rxjs'; 


//interface 
interface State {
  readonly x:number,
  readonly y:number,
}


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
  const paddle:HTMLElement = document.getElementById("paddle")!;
  const ball:HTMLElement = document.getElementById("ball")!;
  const compPaddle:HTMLElement = document.getElementById("paddle2")!;
  const gameOver = document.getElementById('gameOver')
  const compScoreHTML:HTMLElement = document.getElementById('compScore')
  const playerScoreHTML:HTMLElement = document.getElementById('playerScore')

  //State of the player paddle used for tracking the paddle
  const paddleState: State = { 
    x: Number(paddle.getAttribute('x')), 
    y: Number(paddle.getAttribute('y')),

  };

  //Keyboard controls for player, parts of the code are taken from Asteroids example given
  //
  const keydown$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
    filter(({code}) => code === 'ArrowDown' || code === 'ArrowUp'),
    flatMap(d=>interval(10).pipe(
      takeUntil(fromEvent<KeyboardEvent>(document, 'keyup')),
      map(_=>d))
    ),
    map(({key}) => key  === 'ArrowDown' ? 5: -5),
    scan(movePaddle, paddleState))
  .subscribe((state: State): void => paddle.setAttribute('y', String(state.y)))

  //function for moving the paddle, that takes into the account boundaries of top and bottow walls
  function movePaddle(s: State, dis: number): State{
    return {...s, x: s.x, y: s.y + dis > 0  && s.y + dis < 500 ? s.y + dis : s.y}
  }
  
  //random number generator, used in deciding ball direction
  const randomDirection: number = (Math.random()>0.5 ? 1 : -1)
  
  let ballDirX:number = randomDirection, //the movement for ball's x-coordinate
    ballDirY:number = randomDirection//the movement for ball's y-coordinate

  
  //Observable
  const observer: Observable<number> = interval(1)
  
  //////////////////////////////////////////////// Single mode //////////////////////////
  //for single player press 1 on the keyboard
  const singlePlayer$ = fromEvent<KeyboardEvent>(document , "keydown").pipe(
    filter(({code}) => code === 'Digit1'),
  ).subscribe( () => {
    let compScore: number = 0
    let playerScore: number = 0


    //stream of ball position
    const ballAttributes = observer.pipe(map( () => ({
      ballX: Number(ball.getAttribute('x')),
      ballY: Number(ball.getAttribute('y')),
      ballW: Number(ball.getAttribute('width'))
    })))

    //stream of comp paddle position
    const compPaddlePosition = observer.pipe(map( () => ({
      compY: Number(compPaddle.getAttribute('y'))
    })))
    
    //Moving the ball if the scores are below 7
    const moveBall = observer.pipe(filter(() => playerScore < 7 && compScore < 7  )).subscribe(() => {
      ball.setAttribute('y', String(ballDirY + Number(ball.getAttribute('y'))))
      ball.setAttribute('x', String(ballDirX + Number(ball.getAttribute('x'))))
    });
    
    //moving paddle up based on the ball Y coordinate value, if the ball is above the centre of the paddle  - move up
    const moveCompPaddleUp = ballAttributes.pipe(filter(({ballY}) => ballY > Number(compPaddle.getAttribute('y')) + Number(compPaddle.getAttribute('height'))/2)
    ).subscribe(() =>  compPaddle.setAttribute('y', String(Number(compPaddle.getAttribute('y')) + 0.7)))
    
    //moving paddle down using same way, if the ball is below centre of the paddle - move down
    const moveCompPaddleDown = ballAttributes.pipe(filter(({ballY}) => ballY < Number(compPaddle.getAttribute('y')) + Number(compPaddle.getAttribute('height'))/2)
    ).subscribe(() => compPaddle.setAttribute('y', String(Number(compPaddle.getAttribute('y')) - 0.7))) //0.7 is tuned so the computer isn't too hard
    
    
    //Restricting comp paddle from getting outside of the top wall of the canvas
    const compPaddleTopBarrier = compPaddlePosition.pipe(filter(({compY}) => (compY <= 0))) //constatly checking the Y coordinate of the comp paddle, if its less the value of 0
    .subscribe(() => (compPaddle.setAttribute('y', String(0)))) //if it does restricting it at the value of 0

    //Restricting comp paddle from getting outside of the bottom wall of the canvas
    const compPaddleBottomBarrier = compPaddlePosition.pipe(filter(({compY}) => (compY > 500))) //constatly checking the Y coordinate of the comp paddle, if its exceeding the value of 500 
    .subscribe(() => (compPaddle.setAttribute('y', String(500)))) //if it does restricting it at the value of 500



    //Adding to the player's score if the ball goes over comp paddle's goals and reset the ball
    const playerScored = ballAttributes.pipe(filter(({ballX, ballW}) => ballX + ballW > 600))
    .subscribe(() => {
      ball.setAttribute('y', "300")
      ball.setAttribute('x', "300")
      playerScore += 1
      playerScoreHTML.innerHTML = String(playerScore)
    });
    
    //Adding to the comp paddle's score if the ball goes over player's goals and reset the ball
    const compScored = ballAttributes.pipe(filter(({ballX, ballW}) => ballX - ballW < 0))
    .subscribe(() => {
      ball.setAttribute('y', "300")
      ball.setAttribute('x', "300")
      compScore += 1
      compScoreHTML.innerHTML = String(compScore)
    });

    

    //Hadling collissions of the ball with paddles
    const handlePaddleCollisions = observer.pipe(map(()=> ({    //
      ballX : Number(ball.getAttribute('x')),
      ballY : Number(ball.getAttribute('y')),
      ballW : Number(ball.getAttribute('width')),
      paddleX : Number(paddle.getAttribute('x')),
      paddleY : Number(paddle.getAttribute('y')),
      compX : Number(compPaddle.getAttribute('x')),
      compY : Number(compPaddle.getAttribute('y')),
      paddleHeight : Number(paddle.getAttribute('height')),
      paddleWidth : Number(paddle.getAttribute('width'))
    }))
    ,filter(({ballX,ballW, ballY, paddleX, paddleHeight, paddleWidth, paddleY, compX, compY}) => 
    (ballX + ballW  == compX - paddleWidth && ballY + ballW/2 >= compY && ballY - ballW/2<= compY + paddleHeight  //checking if the ball touches comp paddle
    ||
    (ballX + ballW/2 == paddleX + paddleWidth && ballY + ballW/2 >= paddleY) && ballY - ballW/2 <= paddleY + paddleHeight))) //checking of the ball touches player paddle
    .subscribe(() => (ballDirX *= -1));   //if it does - change direction on the x coordinate

    //Handling top and bottom wall collisions with the ball
    const handleWallCollisions = ballAttributes.pipe(filter(({ballY}) => (ballY >= 600 || ballY <= 0)) //if ball's Y cooridntae goes over 600 or less or equal 0
    ).subscribe(() => (ballDirY *= -1)); //if it does - change the direction on Y coordinate 

    //when the playerScore or compScore reaches 7 - print the winner
    observer.pipe(filter( () => playerScore == 7)).subscribe( () => gameOver.innerHTML = 'You have won!')
    observer.pipe(filter( () => compScore == 7)).subscribe( () => gameOver.innerHTML = 'You have lost!') 

    })
  






////////////////////////////////////// MultiPlayer /////////////////////////////


    //for multiplayer press 2 on the keyboard
    const multiPlayer$ = fromEvent<KeyboardEvent>(document , "keydown").pipe(
      filter(({code}) => code === 'Digit2'),
    ).subscribe( () => {
      let compScore: number = 0
      let playerScore: number = 0
      

      const ballAttributes = observer.pipe(map( () => ({
        ballX: Number(ball.getAttribute('x')),
        ballY: Number(ball.getAttribute('y')),
        ballW: Number(ball.getAttribute('width'))
      })))
  
      //moving paddle up based on the ball Y coordinate value
      
     
      const canvas = document.getElementById('canvas')

      //mouse control for second player
      const mousemove$ = fromEvent<MouseEvent>(canvas, 'mousemove')
      .subscribe(({clientY}) => compPaddle.setAttribute('y', String(clientY - Number(compPaddle.getAttribute('height'))!/2)))

  
  
      //Adding to the player's score if the ball goes over comp paddle's goals and reset the ball
      const playerScored = ballAttributes.pipe(filter(({ballX, ballW}) => ballX + ballW > 600))
      .subscribe(() => {
        ball.setAttribute('y', "300")
        ball.setAttribute('x', "300")
        playerScore += 1
        playerScoreHTML.innerHTML = String(playerScore)
      });
      
      //Adding to the comp paddle's score if the ball goes over player's goals and reset the ball
      const compScored = ballAttributes.pipe(filter(({ballX, ballW}) => ballX - ballW < 0))
      .subscribe(() => {
        ball.setAttribute('y', "300")
        ball.setAttribute('x', "300")

        compScore += 1
        compScoreHTML.innerHTML = String(compScore)
      });
  
      //
      const moveBall = observer.pipe(filter(() => playerScore < 7 && compScore < 7  )).subscribe(() => {
        ball.setAttribute('y', String(ballDirY + Number(ball.getAttribute('y'))))
        ball.setAttribute('x', String(ballDirX + Number(ball.getAttribute('x'))))
      });
  
      //Hadling collissions of the ball with paddles
      const handlePaddleCollisions = observer.pipe(map(()=> ({    //
        ballX : Number(ball.getAttribute('x')),
        ballY : Number(ball.getAttribute('y')),
        paddleX : Number(paddle.getAttribute('x')),
        paddleY : Number(paddle.getAttribute('y')),
        compX : Number(compPaddle.getAttribute('x')),
        compY : Number(compPaddle.getAttribute('y')),
        paddleHeight : Number(paddle.getAttribute('height')),
        paddleWidth : Number(paddle.getAttribute('width'))
      }))
      ,filter(({ballX, ballY, paddleX, paddleHeight, paddleWidth, paddleY, compX, compY}) => 
      (ballX == compX - paddleWidth && ballY >= compY && ballY<= compY + paddleHeight  //checking if the ball touches comp paddle
      ||
      (ballX == paddleX + paddleWidth && ballY >= paddleY) && ballY <= paddleY + paddleHeight))) //checking of the ball touches player paddle
      .subscribe(() => (ballDirX *= -1));   //if it does - change direction on the x coordinate
  
      //Handling top and bottom wall collisions with the ball
      const handleWallCollisions = ballAttributes.pipe(filter(({ballY}) => (ballY >= 600 || ballY <= 0)) //if ball's Y cooridntae goes over 600 or less or equal 0
      ).subscribe(() => (ballDirY *= -1)); //if it does - change the direction on Y coordinate 
  
      
      observer.pipe(filter( () => playerScore == 7)).subscribe( () => gameOver.innerHTML = 'Player 1 won!')
      observer.pipe(filter( () => compScore == 7)).subscribe( () => gameOver.innerHTML = 'Player 2 won!') 
  
      })



      /////////////////////////////////Training mode////////////////////////

      //for training mode press 3 on the keyboard
      const training$ = fromEvent<KeyboardEvent>(document , "keydown").pipe(
        filter(({code}) => code === 'Digit3'),
      ).subscribe( () => {
        
        //chaning playerScore text field to indicate that we are in training mode, since we dont need the score
        playerScoreHTML.innerHTML = 'Training mode'
        playerScoreHTML.setAttribute('font-size', '20px')
        
        //taking away the computer score counter
        compScoreHTML.innerHTML = ' '
  
        const ballAttributes = observer.pipe(map( () => ({
          ballX: Number(ball.getAttribute('x')),
          ballY: Number(ball.getAttribute('y')),
          ballW: Number(ball.getAttribute('width'))
        })))
        
        
        const compPaddleAttributes = observer.pipe(map( () => ({
          compX: Number(compPaddle.getAttribute('x')),
          compY: Number(compPaddle.getAttribute('y')),
        })))
       
        //chaning comp paddle into training big paddle
        observer.subscribe(() => {compPaddle.setAttribute('y', "0"), compPaddle.setAttribute('x', '580'), compPaddle.setAttribute('height', '600')})
  
        //Adding to the comp paddle's score if the ball goes over player's goals and reset the ball
        const compScored = ballAttributes.pipe(filter(({ballX, ballW}) => ballX - ballW < 0))
        .subscribe(() => {
          ball.setAttribute('y', "300")
          ball.setAttribute('x', "300")

        });
    
        //
        const moveBall = observer.subscribe(() => {
          ball.setAttribute('y', String(ballDirY + Number(ball.getAttribute('y'))))
          ball.setAttribute('x', String(ballDirX + Number(ball.getAttribute('x'))))
        });
    
        //Hadling collissions of the ball with paddles
        const handlePaddleCollisions = observer.pipe(map(()=> ({    //
          ballX : Number(ball.getAttribute('x')),
          ballY : Number(ball.getAttribute('y')),
          paddleX : Number(paddle.getAttribute('x')),
          paddleY : Number(paddle.getAttribute('y')),
          compX : Number(compPaddle.getAttribute('x')),
          compY : Number(compPaddle.getAttribute('y')),
          paddleHeight : Number(paddle.getAttribute('height')),
          paddleWidth : Number(paddle.getAttribute('width')),
          compH: Number(compPaddle.getAttribute('height')),
          compW: Number(compPaddle.getAttribute('width'))
        }))
        ,filter(({ballX, ballY, paddleX, paddleHeight, paddleWidth, paddleY, compX, compY, compH, compW}) => 
        (ballX == compX - compW && ballY >= compY && ballY<= compY + compH  //checking if the ball touches comp paddle
        ||
        (ballX == paddleX + paddleWidth && ballY >= paddleY) && ballY <= paddleY + paddleHeight))) //checking of the ball touches player paddle
        .subscribe(() => (ballDirX *= -1));   //if it does - change direction on the x coordinate
    
        //Handling top and bottom wall collisions with the ball
        const handleWallCollisions = ballAttributes.pipe(filter(({ballY}) => (ballY >= 600 || ballY <= 0)) //if ball's Y cooridntae goes over 600 or less or equal 0
        ).subscribe(() => (ballDirY *= -1)); //if it does - change the direction on Y coordinate 
    
        })
  
  
}
    
  // the following simply runs your pong function on window load.  Make sure to leave it in place.
  if (typeof window != 'undefined')
    window.onload = ()=>{
      pong();
    }
  