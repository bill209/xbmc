<?php
	$file = 'movies.json';

	if (file_exists($file)) {
		echo file_get_contents($file);
	} else {
		echo  'error';
	}

?>




