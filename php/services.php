<?php
//$db = '';
echo call_user_func($_POST['service']);

function getMovies(){

	$file = 'movies.json';

	if (file_exists($file)) {
		return file_get_contents($file);
	} else {
		return false;
	}
}


?>




