<?php

	//Create connection to database server
	if(!$con = mysql_connect("mysql.metropolia.fi:3306", "hanschrh", "sKtP7490"))
		exit("Could not connect to database server.".mysql_error());

	//Connect to database
	if(!mysql_select_db("hanschrh", $con))
		exit("Could not connect to space_invaders database.".mysql_error());

	//Select database table
	$sql = "select * from space_invaders";
	if(!$result = mysql_query($sql,$con))
		exit("Could not read from database table.".mysql_error());

	//Read first (only) row in table
	if(!$table_row = mysql_fetch_row ($result))
		exit("Could not read database table row.".mysql_error());

	//Read current hi-score value
	if(!$db_hiscore = $table_row[0])
		exit("Unvalid hiscore value.");
	
	//When new score is sent from client
	if(isset($_POST['gscore'])){
		
		//Store game score in DB, if bigger than hi-score	
		//$client_hiscore = $_POST['hiscore'];
		//Write hiscore to database

		$gscore = $_POST['gscore'];

		//Check if score is bigger than hi-score
		if($gscore > $db_hiscore){
			//Update hi-score in database
			$sql = "UPDATE space_invaders SET hiscore='$gscore'";
			if(!$result = mysql_query($sql,$con))
				exit("Could not update database table.".mysql_error());
		}
	}
	
	//When hi-score is read from client
	if(isset($_GET['hiscore'])){
		
		//Indicate that message body will contain JSON
		header("content-type:application/json");
		
		//Create response message body
		$result_string = array('hiscore' => $db_hiscore);
		
		//Send response
		echo json_encode($result_string);
	}
	
	//Close connection to database
	mysql_close($con);
?>
