
		var key_pressed = false;

		var game_state;			//State of game: 0 - Start : 1 - Game running : 2 - Game Over : 3 - Ready for re-start
		
		var start_game = false;
		
		var hiscore = 0;		//Hi-score value, from server
		var gscore = 0;			//Score value for a particular game
		var level = 0;			//Game level
		var fps = 0;			//Frames per second
		var oldTime;			//Time when gameloop function was previously called
		var dt;					//Delta time

		
		var numAlien = 30;		//Number of aliens
				
		var score = 0;			//Score of current game
		var hi_score = 0;		//Highest score (read from server)

		var width_can;			//Width of canvas
		var width_ship = 20;	//Width of ship
		var width_alien = 20;	//Width of alien
		var width_bullet = 2;	//Width of bullet
		var height_can;			//Height of canvas
		var height_ship = 10;	//Height of ship
		var height_alien = 20;	//Height of alien
		var height_bullet = 5;	//Height of bullet
		
		var ship_y_pos;			//Y position of ship
		
		var max_x_alien;		//Max x value for alien
		var min_x_alien;		//Min x value for alien
		var max_y_alien;		//Max y value for alien
		
		var shot = false;		//Active shot
		
		var alien_dx;			//Initial alien delta x per frame
		var alien_dy = 0;		//Alien delta y when reaching canvas boundary
		var alien_boundary = false;
		var alien_bottom = false;
		var old_dt;

		//Image variables
		var image_explode;
		var image_ship;
		var image_alien;
		
		//Alien object
		function objAlien(x_pos,y_pos,dx,dy,width,height) {
			this.x_pos = x_pos;
			this.y_pos = y_pos;
			this.dx = dx;
			this.dy = dy;
			this.width = width;
			this.height = height;
			this.sprite_state = 0;
			this.sprite_id = 0;
		}
		
		//Ship object
		function objShip(x_pos,y_pos,dx,width,height) {
			this.x_pos = x_pos;
			this.y_pos = y_pos;
			this.dx = dx;
			this.width = width;
			this.height = height;
			this.sprite_state = 0;
			this.sprite_id = 0;
		}
		
		//Bullet object
		function objBullet(x_pos,y_pos,dy,width,height) {
			this.x_pos = x_pos;
			this.y_pos = y_pos;
			this.dy = dy;
			this.width = width;
			this.height = height;
			this.sprite_state = 0;
			this.sprite_id = 0;
		}
		
		//Arrays to store objects 
		var ship = [];				//Ship array (currently there is only one ship, but in future the player may get two ships)
		var arrayAliens = [];		//Alien array
		var arrayBullets = [];		//Bullet array (ship)
		var arrayAlienBullets = [];	//Bullet array (aliens)
		
		
		//GAME INITIALIZE FUNCTION
		
		function init()
		{						
			//Get canvas context
			var canvas = document.getElementById("canvas");
			if(!canvas){
				console.log("There is no canvas!");
			}
			
			if (canvas.getContext)
			{
				if(window.innerWidth > window.innerHeight)
				{
					canvas.height = window.innerHeight;
					canvas.width = canvas.height/2;
				}else{
					canvas.height = window.innerHeight;
					canvas.width = window.innerWidth;
				}

				ship_y_pos = canvas.height - 100;
				
				width_can = canvas.width;
				height_can = canvas.height;
				
				ctx = canvas.getContext("2d");
								
				// Load pictures
				image_explode = new Image();
				image_explode.src = "explosion_50FR.png";	//Alien explosion sprite sheet
				image_ship = new Image();
				image_ship.src = "ship.png";				//Ship
				image_alien = new Image();
				image_alien.src = "alien.png";				//Alien
											
				//Lock orientation
				if (window.screen.orientation) {
					console.log("Screen orientation supported");
					window.screen.orientation.lock('portrait');
				}else{
					console.log("Screen orientation NOT supported");				
				}

				//Load hi-score from server				
				getHiScore();
				
				game_state = 0;
				
				// Set key event listener callback functions
				window.onkeydown = keypressed;	
				window.onkeyup = keyreleased;
				
				// Set tap listener (if touch screen)				
				$("canvas").on("tap",function(e){
				
					if((game_state == 0) || (game_state == 3))
					{
						// If game has not begun, begin game
						game_state = 1;
					}else{
						// If game is running, fire a new shot
						shot = true;
					}
				});
				
				// Set screen swipte listener (if touch screen)
				$("canvas").on("swipeleft",function(){
					ship.dx = -5;
				});
				
				$("canvas").on("swiperight",function(){
					ship.dx = 5;
				});
	
				// Set motion listener (if supported)
				if (window.DeviceOrientationEvent) {
					console.log("DeviceOrientation is supported");
					window.addEventListener('deviceorientation', function(e) {
						var dLR = e.gamma;
						var dFB = e.beta;
						if(dLR < 0) ship.dx = -5;
						if(dLR > 0) ship.dx = 5;
						if(dFB < 0) {
							if(!key_pressed){
								shot = true;
								key_pressed = true;
							}
						}
						if(dFB > 0) key_pressed = false;
					}, false);
				}else{
					console.log("DeviceOrientation is NOT supported");
				}

				//Enable device vibration
				navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate 

				if (navigator.vibrate) {
					console.log("DeviceVibration is supported");
				}else{
					console.log("DeviceVibration is NOT supported");
				}
												
				//Set alien boundaries
				min_x_alien = 10;
				max_x_alien = width_can - 10;

				//Set max alien y value
				max_y_alien = 400 + height_ship;

				//resetGame(true);
				
				startScreen();
			}
		}
				
		function startScreen(){		
			//paint();			
			if(game_state == 0 || game_state == 3)
			{
				paint();
				requestAnimationFrame(startScreen);
			}else{				
				resetGame(true);
				requestAnimationFrame(gameloop);
			}
		}
		
		//GAME RESET FUNCTION		
		function resetGame(reset_level){
			
			if(reset_level){
				alien_dx = 4;
				level = 1;				
				//Reset score
				gscore = 0;
			}else if(level > 100){
				level = 1;
			}else{
				level += 1;
			}
						
			//Reset alien array and bullet array
			arrayAliens = [];  
			arrayBullets = [];

			//Initiate ship	array (there will only be one ship)
			ship = new objShip(width_can/2,ship_y_pos,0,width_ship,height_ship);			
			
			//Initiate alien array
			var col = 0;
			var row = 0;
			for(var i=0;i<numAlien;i++)
			{
				var tempAlien = new objAlien(10+(col*60),30+(row*40),alien_dx,0,width_alien,height_alien);
				arrayAliens.push(tempAlien);						
				col +=1;					
				if((col*60)>(width_can - 100)){
					col = 0;
					row += 1
				}
			}
			oldTime = null;
		}
		
		//SERVER COMMUNICATION FUNCTION
				
		// Get hi-score from server
		function getHiScore() {
			console.log("Retrieving hi-score to server");
			$.ajax({
                    type: "GET",
                    url: "space_invaders_server.php",
					data: "hiscore",
					dataType: "json",
                    cache: false,
                    success: onGetSuccess,
                    error: function (request,error){
						console.log("Error from server (GET)");
					}
            });
		}

		// Post game score to server
		function postScore() {			
			console.log("Sending score to server");
			$.ajax({
                    type: "POST",
                    url: "space_invaders_server.php",
					data: {gscore:gscore},
                    cache: false,
                    success: onPostSuccess,
                    error: function (request,error){
						console.log("Error from server (POST)");
					}
            });
		}
	
		// GET response callback function
		function onGetSuccess(data,status)
        {
			console.log("Server status (GET): " + status);			
			if(status=="success" && data.hiscore)
			{
				console.log("Hi-score from server: " + data.hiscore);
				hiscore = data.hiscore;
			}
        }
  
		// POST response callback function
		function onPostSuccess(data,status)
        {
			console.log("Server status (POST): " + status);
        }
  		
		
		// USER KEYBOARD INPUT
		function keypressed(e)
		{			
			// left key (move ship left)
			if(e.keyCode == 37 && game_state == 1){
				ship.dx = -5;
			}
			
			// right key (move ship right)
			if(e.keyCode == 39 && game_state == 1){
				ship.dx = 5;
			}
			
			// space key (shoot)
			if(e.keyCode == 32 && !key_pressed && game_state == 1){
				shot = true;
				key_pressed = true;
			}
			
			// enter (start game)
			if(e.keyCode == 13){
				if((game_state == 0) || (game_state == 3)){
					game_state = 1;
				}
			}
		}
		
		function keyreleased(e)
		{			
			key_pressed = false;
		}
		
		
		//CANVAS PAINT FUNCTION		
		function paint()
		{
				// Draw canvas background
				ctx.fillStyle = "#000000";
				ctx.fillRect (0,0,canvas.width,canvas.height);

				if (game_state == 0)
				{
					ctx.textAlign = "center";
					ctx.font="30px Arial";
					ctx.fillStyle = "#FF00FF";
					ctx.textBaseline = "ideographic";
					ctx.fillText("SPACE INVADERS", canvas.width/2,150);
					ctx.font="15px Arial";
					ctx.fillText("Press enter to start", canvas.width/2,180);
				}else if (game_state == 3){
					ctx.textAlign = "center";
					ctx.font="30px Arial";
					ctx.fillStyle = "#FF00FF";
					ctx.textBaseline = "ideographic";
					ctx.fillText("GAME OVER", canvas.width/2,150);
					ctx.font="15px Arial";
					ctx.fillText("Press enter to start", canvas.width/2,180);
				}else{
					// Draw ship
					if (ship.sprite_state == 0 && game_state == 1)
					{				
						ctx.drawImage(image_ship,ship.x_pos,ship.y_pos,ship.width,ship.height);
					}else if(ship.sprite_state > 0 && ship.sprite_state <= 40 && game_state == 2)
					{
						ctx.drawImage(image_explode,ship.sprite_state.toFixed()*81,0,81,123,ship.x_pos-ship.width*2,ship.y_pos-ship.height*2,ship.width*4,ship.height*4);						
						ship.sprite_state += 1*dt;									
					}

					// Draw ship bullets
					if(game_state == 1)
					{						
						for(var i=0;i<arrayBullets.length;i++) {
							ctx.fillStyle = "#FFFF00";
							ctx.fillRect(arrayBullets[i].x_pos,arrayBullets[i].y_pos,arrayBullets[i].width,arrayBullets[i].height);
						}
					}

					// Draw alien bullets
					if(game_state == 1)
					{						
						for(var i=0;i<arrayAlienBullets.length;i++) {
							ctx.fillStyle = "#FFFF00";
							ctx.fillRect(arrayAlienBullets[i].x_pos,arrayAlienBullets[i].y_pos,arrayAlienBullets[i].width,arrayAlienBullets[i].height);
						}
					}
					
					// Draw aliens
					for(var i=arrayAliens.length-1;i>=0;i--) {				
						if(arrayAliens[i].sprite_state > 40) {
							arrayAliens.splice(i,1);
						}else if (arrayAliens[i].sprite_state == 0) {
							ctx.drawImage(image_alien,arrayAliens[i].x_pos,arrayAliens[i].y_pos,arrayAliens[i].width,arrayAliens[i].height);
						}else{
							ctx.drawImage(image_explode,(arrayAliens[i].sprite_state).toFixed()*81,0,81,123,arrayAliens[i].x_pos,arrayAliens[i].y_pos,arrayAliens[i].width,arrayAliens[i].height);
							arrayAliens[i].sprite_state +=1*dt;					
						}
					}
				}
				
				//Draw score
				ctx.textAlign = "start";
				ctx.font="20px Arial";
				ctx.fillStyle = "#FF000F";
				ctx.textBaseline = "ideographic";
				ctx.fillText("SCORE: " + gscore, 10,25);

				//Draw hi-score
				ctx.textAlign = "end";
				ctx.font="20px Arial";
				ctx.fillStyle = "#FF000F";
				ctx.textBaseline = "ideographic";
				ctx.fillText("HI SCORE: " + hiscore, canvas.width-10,25);
				
		}
				
		// BULLET COLLISION DETECTION FUNCTIONS

		// Function to check if an alien has been hit by a ship bullet
		function alienCollision()
		{
			var hit = false;
			for(var i=arrayBullets.length-1;i>=0;i--) {				
				for(var k=arrayAliens.length-1;k>=0;k--) {
						//Check if bullet is within alien x coordinate boundaries
						if( ((arrayBullets[i].x_pos + arrayBullets[i].width) > arrayAliens[k].x_pos) &&
						(arrayBullets[i].x_pos < (arrayAliens[k].x_pos + arrayAliens[k].width)) &&
						(arrayAliens[k].sprite_state == 0) ) {	
							//Check if bullet is within alien y coordinate boundaries
							if( (arrayBullets[i].y_pos < (arrayAliens[k].y_pos + arrayAliens[k].height)) &&
							(arrayBullets[i].y_pos > arrayAliens[k].y_pos) )
							{
								arrayAliens[k].sprite_state = 1;
								hit=true;
							}
						}
				}
				if(hit){
					gscore++;
					arrayBullets.splice(i,1);
					hit=false;
					break;	//No need to see if bullet will hit another alien
				}							
			}									
		}
		
		//Function to check whether the ship has been hit by an alien bullet
		function shipCollision()
		{
			for(var i=0;i < arrayAlienBullets.length;i++) {	
				//Check if bullet y position is equal or larger than ship y position
				if(arrayAlienBullets[i].y_pos >= ship.y_pos) {
					//Check if bullet x position matches ship x position
					if((arrayAlienBullets[i].x_pos >= ship.x_pos) && (arrayAlienBullets[i].x_pos + arrayAlienBullets[i].width <= ship.x_pos + ship.width)) {
						//Ship has been hit by alien bullet
						game_state = 2;
						break;
					}
				}
			}
		}
		
		//GAME LOOP FUNCTION	
		function gameloop()
		{
			// Calculate FPS and delta time
			var now = new Date().getTime();
			if(oldTime){
				fps = 1000 / (now - oldTime);
				dt = (25/fps);
			}else{
				dt = 1;
			}
			oldTime = now;
				
			if(game_state == 2)
			{
				alien_dx = 0;
				if(ship.sprite_state == 0)
				{			
					if(navigator.vibrate){
						navigator.vibrate(1000);
					}
					ship.sprite_state = 1;
				}else if (ship.sprite_state > 40)
				{
					game_state = 3;
					postScore();
					resetGame(true);
				}
			}else if(arrayAliens.length == 0)
			{
				// All aliens shot
				resetGame(false);
			}else{
			
				// Ship position
				if(ship.x_pos + ship.dx < 0){
					ship.x = 0;
					ship.dx = 0;
				}else if(ship.x_pos + ship.width + ship.dx > width_can){
					ship.x = width_can - ship.width;
					ship.dx = 0;
				}else{
					ship.x_pos += (dt*ship.dx);
				}
			
				// Does the shit fire new shot?
				if(shot){													
					var tempBullet = new objBullet((ship.x_pos+ship.width/2), ship.y_pos-height_bullet, -10,width_bullet,height_bullet);
					arrayBullets.push(tempBullet);
					shot = false;
				}
				
				// Use random generator to determine whether an alien fires a new shot
				for(var i=0;i<arrayAliens.length-1;i++) {			
					// For each new level, the likelihood of an alien fireing a shot is bigger
					if((Math.floor((Math.random() * 1000-(level*10) + 1))) == 1) {						
						var tempAlienBullet = new objBullet((arrayAliens[i].x_pos+width_alien/2),arrayAliens[i].y_pos+height_alien,5,width_bullet,height_bullet); 
						arrayAlienBullets.push(tempAlienBullet);		
					}												
				}
								
				// Bullets positions (ship)
				for(var i=arrayBullets.length-1;i>=0;i--) {			
					if(arrayBullets[i].y_pos + arrayBullets[i].height + (dt*arrayBullets[i].dy) < 0){
						arrayBullets.splice(i,1);
					}else{
						arrayBullets[i].y_pos += (dt*arrayBullets[i].dy);
					}
				}

				// Bullets positions (aliens)
				for(var i=arrayAlienBullets.length-1;i>=0;i--) {			
					if(arrayAlienBullets[i].y_pos + arrayAlienBullets[i].height + (dt*arrayAlienBullets[i].dy) > ship.y_pos + height_ship){
						arrayAlienBullets.splice(i,1);
					}else{
						arrayAlienBullets[i].y_pos += (dt*arrayAlienBullets[i].dy);
					}
				}
										
				// If an alien has reached a canvas boundary, change the alien x direction and move aliens downwards (y direction)
				if (alien_boundary)
				{
					alien_dx = -alien_dx;
					alien_dy = 5;
					dt = old_dt;
					alien_boundary = false;
				}

				// Update position of aliens
				for(var i=arrayAliens.length-1;i>=0;i--) 
				{
					arrayAliens[i].x_pos += (dt*alien_dx);
					arrayAliens[i].y_pos += alien_dy;
					
					
					if( ((arrayAliens[i].y_pos + arrayAliens[i].height) >= max_y_alien))
					{
						// Check if an alien has reached the ground level
						game_state = 2;
						break;
					}else if ( ((arrayAliens[i].y_pos + arrayAliens[i].height) >= ship.y_pos))
					{
						//Check if an alien has hit the ship
						if( ((arrayAliens[i].x_pos+arrayAliens[i].width) >= ship.x_pos) && (arrayAliens[i].x_pos <= ship.x_pos) )
						{							
							game_state = 2;
							break;
						}					
					}else if( ((arrayAliens[i].x_pos+arrayAliens[i].width) > max_x_alien) && (arrayAliens[i].sprite_state == 0))
					{
						//Check if an alien has reached the right canvas boundary
						old_dt = dt;
						alien_boundary = true;
					}else if ( (arrayAliens[i].x_pos < min_x_alien) && (arrayAliens[i].sprite_state == 0))
					{
						//Check if an alien has reached the left canvas boundary
						old_dt = dt;
						alien_boundary = true;
					}
				}
				alien_dy = 0;
					
				if((arrayBullets.length > 0) && (game_state == 1))
				{
					//Check if a ship bullet has hit an alien
					alienCollision();
				}
				
				if((arrayAlienBullets.length > 0) && (game_state == 1))
				{
					//Check if an alien bullet has hit the ship					
					shipCollision();
				}
			}	
			// Paint canvas
			paint();
			// Request the gameloop function to be executed again
			requestAnimationFrame(gameloop);
		}
		
		onload=init;
