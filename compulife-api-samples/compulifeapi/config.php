<?php

/* edit your authorization code you recieved from Compulife here */
$config ['COMPULIFEAUTHORIZATION'] = 'INSERT_ID';

/* logging sets level of logging
'ERROR' => '1', 'DEBUG' => '2', 'INFO' => '3', 'ALL' => '4'
*/
$config ['log_threshold'] = 4;

/* feel free to edit, '../compulifeapi.logs/' will normally update one directory above public_html
but you may have to enter a full server path '/home/YOUR_DOMAIN_FOLDER_NAME/compulifeapi.logs/'
and depending on your permissions you may have to create the directory yourself before logfiles can be written to
*/
$config ['log_path'] = '../compulifeapi.logs/';


$config ['log_date_format'] = 'Y-m-d H:i:s';

/* don't touch this */
function get_config()
{
 global $config;   
    return $config;
}
