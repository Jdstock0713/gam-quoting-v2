<?php
/*
api.php?testing
will display configuration
*/
$isTesting = (isset($_REQUEST['testing']));
class Request {

};
//$system_path = 'compulifeapi/';
$system_path = '';
define('BASEPATH',str_replace('\\','/',$system_path));
require_once(BASEPATH.'config.php');
require_once(BASEPATH. 'logging.php');
if ($isTesting) {

echo "log path = " . 	logPath() . '<br>';
log_message('INFO','===== LogPath test =====');
die('testing done');
}
log_message('INFO','===== Request Start =====');
$url = "https://www.compulifeapi.com/api/";
//$url = "//www.compulifeapi.com/api/";
if (isset($_REQUEST['requestType']))
	$url .= $_REQUEST['requestType'] . '/';
else {
	log_message('ERROR','No requestType specified');
	die('{ "message": "Error, check the log files" }');
}
$obj = new Request();
$obj->COMPULIFEAUTHORIZATIONID = get_config()['COMPULIFEAUTHORIZATION'];
$_REQUEST['REMOTE_IP'] = $_SERVER['REMOTE_ADDR'];
ksort($_REQUEST);
foreach($_REQUEST as $key => $value) {
	if ($key=='requestType')
		continue;
	if ($key[0]=='_') // try to get rid of any google tracking info
		continue;
    $v = htmlspecialchars($value);
    $v = str_replace('#','%23',$v);
    $v = str_replace(' ','%20',$v);
    $ukey = strtoupper($key);
    $obj->$key = $v;
}
//$obj->$key['REMOTE_IP'] = $_SERVER['REMOTE_ADDR'];
$json = json_encode($obj);
log_message('INFO','json=' . $json);
$url .= '?COMPULIFE=' . $json;
//$url = urlencode($url);
log_message('INFO','api request string = ' . $url);
try {
	$r = file_get_contents($url);
	if ($r === false) {
		// uncomment to do see the response,
		//var_dump($http_response_header);
		log_message(
'ERROR','file_get_contents returned an error,
try manually with a browser
	'. $url);
		// uncomment to do see the response,
/*		foreach ($http_response_header as $i => $d)
	log_message('ERROR','Response Header '.$i .' ' .  $d);*/
		echo '{ "message": "Error, check the log files" }';
	}
	else
		echo $r;
} catch (Exception $e) {
	log_message('ERROR',$e);
	log_message(
'ERROR','file_get_contents returned an exception,
try mannually with a browser
'. $url);
	echo '{ "message": "Error, check the log files" }';
}
