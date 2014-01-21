< ?php
header('Content-Type: application/json');

// Ta-da, using $_POST as normal; PHP is able to
// unserialize the AngularJS request no problem
echo json_encode($_POST);
?>
