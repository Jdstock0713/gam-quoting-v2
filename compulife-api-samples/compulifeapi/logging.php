<?php
/* Logging Class
* @package CompulifeAPI
* @subpackage Libraries
* @category Logging
* @author  Compulife 
*/

date_default_timezone_set('America/New_York');
defined ('BASEPATH') OR exit('No direct script access allowed');
include_once('config.php');
class My_log {
    protected $_log_path;
    protected $_file_permissions = 0644;
    protected $_threshold = 1;
    protected $_date_fmt = 'Y-m-d H:i:s';
    protected $_levels = array('ERROR' => '1', 'DEBUG' => '2', 'INFO' => '3', 'ALL' => '4');
    
    public function __construct()
    {
        $config = get_config();
        $this->_log_path = $config['log_path'];

        if (is_numeric($config['log_threshold'])) {
            $this->_threshold = $config['log_threshold'];            
        }
        if ($config['log_date_format'] != '') {
            $this->_date_fmt = $config['log_date_format'];
        }
    }
	public function logPath() {
        	$filepath = $this->_log_path.'log-'.date('Y-m-d').'.log';
		return $filepath;
	}
    public function write_log($level = 'error',$msg,$php_error = FALSE)    {
        $level = strtoupper($level);
        if (( ! isset($this->_levels[$level]) OR ($this->_levels[$level] > $this->_threshold))
                        && ! isset($this->_threshold_array[$this->_levels[$level]])) {
            return FALSE;
        }
	$filepath = logPath();
//        $filepath = $this->_log_path.'log-'.date('Y-m-d').'.log';
        $newfile = (!file_exists($filepath));
        if (!$fp = @fopen($filepath,'ab')) return false;
        $message = $level . ' - ' . date($this->_date_fmt). '-->' . $msg . "\n";
        flock($fp,LOCK_EX);
        for($written=0,$length = strlen($message);$written < $length;$written += $result)
            if (($result = fwrite($fp,substr($message,$written)))==FALSE)
                break;
        flock($fp,LOCK_UN);
        fclose($fp);
        if ($newfile)
                chmod($filepath,$this->_file_permissions);
        return is_int($result);
    }    
}


function logPath() {
	$log = new My_log();
	return $log->logPath();

}
function log_message($level='error',$message)
{

    static $_log;
    if ($_log===NULL) {
        $_log[0] = new My_log();
    }
    $_log[0]->write_log($level,$message);
}
