<?php
$includefile = 'compulifeapi/config.php';
$included = false;
if (file_exists($includefile)) {
	$included = true;
  include_once($includefile);
}
class Request {
};
$publicip = file_get_contents("https://www.compulifeapi.com/api/ip/");
$publicip = json_decode($publicip);
$obj = new Request();
$obj->COMPULIFEAUTHORIZATIONID=$config['COMPULIFEAUTHORIZATION'];
$obj->REMOTE_IP = $_SERVER['REMOTE_ADDR'];
/* this is so this file can be run from another server then the compulifeapi one */
/*/if ($_SERVER['SERVER_ADDR'] != $publicip->IPADDRESS)
	$obj->IPADDRESS = $publicip->IPADDRESS;
else
	$obj->IPADDRESS = $_SERVER['REMOTE_ADDR'];
*/
$debug = $obj;
$passedin = false; 
ksort($_REQUEST);
foreach($_REQUEST as $key => $value)	{
	$v = htmlspecialchars($value);
	$ukey = strtoupper($key);
	//print('key="' . $ukey . '" value="' . $value .'" cleaned="' . $v . '"<br>');
	switch(strtoupper($key)) {
	case 'TEMPLATEFILE':	$obj->TemplateFile=$v; break;
	//case 'USERLOCATION': 	$obj->UserLocation=$v; break;
	//case 'STATE': 		$obj->State=$v; break;
	case 'BIRTHMONTH': 	$obj->BirthMonth=$v; break;
	case 'BIRTHDAY': 	$obj->Birthday=$v; break;
	case 'BIRTHYEAR': 	$obj->BirthYear=$v; break;
	case 'SEX': 		$obj->Sex=$v; break;
	case 'COMPRATING': 	$obj->CompRating=$v; break;
	case 'SMOKER': 		$obj->Smoker=$v; break;
	case 'HEALTH': 		$obj->Health=$v; break;
	case 'NEWCATEGORY': 	$obj->NewCategory=$v; break;
	case 'FACEAMOUNT': 	$obj->FaceAmount=$v; break;
	case 'LANGUAGE': 	$obj->LANGUAGE=$v; break;
	case 'MODEUSED': 	$obj->ModeUsed=$v; break;
	case 'SORTOVERRIDE1': 	$obj->SortOverride1=$v; break;
	case 'ZIPCODE': 	$obj->ZipCode = $v; break;
	case 'COMPULIFEAUTHORIZATION': $obj->COMPULIFEAUTHORIZATIONID=$v;
				$obj->REMOTE_IP = $_SERVER['REMOTE_ADDR'];
					$passedin = true;
					$config['COMPULIFEAUTHORIZATION'] = $v;
       				break;

	}
}
$faction ="https://www.compulifeapi.com/api/request"; 
$json = json_encode($obj);
$defaultList = json_encode(json_decode("{}"));
$defaultID = json_encode(array(
    "COMPULIFEAUTHORIZATIONID"=> $config['COMPULIFEAUTHORIZATION']
));
$defaultComparison = json_encode(array(
    "COMPULIFEAUTHORIZATIONID"=> $config['COMPULIFEAUTHORIZATION'],
    "REMOTE_IP"=>$_SERVER['REMOTE_ADDR'],
    "BirthMonth"=> "6",
    "BirthYear"=> "1970",
    "Birthday"=> "15",
    "CompRating"=> "4",
    "FaceAmount"=> "500000",
    "Health"=> "PP",
    "LANGUAGE"=> "E",
    "ModeUsed"=> "M",
    "NewCategory"=> "5",
    "Sex"=> "M",
    "Smoker"=> "N",
    "SortOverride1"=> "A",
    "State"=> "0",
));

$defaultHealthAnalizer= json_encode(array(
    "COMPULIFEAUTHORIZATIONID"=> $config['COMPULIFEAUTHORIZATION'],
    "REMOTE_IP"=>$_SERVER['REMOTE_ADDR'],
    "BirthMonth"=> "6",
    "BirthYear"=> "1970",
    "Birthday"=> "15",
    "CompRating"=> "4",
    "FaceAmount"=> "500000",
    "Health"=> "PP",
    "LANGUAGE"=> "E",
    "ModeUsed"=> "M",
    "NewCategory"=> "5",
    "Sex"=> "M",
    "Smoker"=> "N",
    "SortOverride1"=> "A",
    "DoCigarettes"=>"ON",
    "PeriodCigarettes"=>"0",
    "NumCigarettes"=>"20",
    "DoCigars"=>"ON",
    "PeriodCigars"=>"0",
    "NumCigars"=>"1",
    "DoPipe"=>"ON",
    "PeriodPipe"=>"0",
    "DoChewingTobacco"=>"ON",
    "PeriodChewingTobacco"=>"0",
    "DoNicotinePatchesOrGum"=>"ON",
    "PeriodNicotinePatchesOrGum"=>"0",
    "DoCholesterol"=>"ON",
    "CholesterolLevel"=>"196",
    "HDLRatio"=>"4.40",
    "CholesterolMedication"=>"Y",
    "PeriodCholesterol"=>"0",
    "PeriodCholesterolControlDuration"=>"0",
    "DoDriving"=>"ON",
    "HadDriversLicense"=>"Y",
    "MovingViolations0"=>"2",
    "MovingViolations1"=>"1",
    "MovingViolations2"=>"1",
    "MovingViolations3"=>"1",
    "MovingViolations4"=>"1",
    "RecklessConviction"=>"Y",
    "DwiConviction"=>"Y",
    "SuspendedConviction"=>"Y",
    "MoreThanOneAccident"=>"Y",
    "PeriodRecklessConviction"=>"0",
    "PeriodDwiConviction"=>"0",
    "PeriodSuspendedConviction"=>"0",
    "PeriodMoreThanOneAccident"=>"0",
    "DoFamily"=>"ON",
    "NumDeaths"=>"1",
    "NumContracted"=>"1",
    "AgeDied00"=>"70",
    "AgeContracted00"=>"70",
    "IsParent00"=>"Y",
    "CVD00"=>"Y",
    "ColonCancer00"=>"Y",
    "AgeContracted10"=>"70",
    "IsParent10"=>"Y",
    "CVD10"=>"Y",
    "ColonCancer10"=>"Y",
    "ZipCode"=>"90210",
    //"State"=>"5",
    "Birthday"=>"15",
    "BirthMonth"=>"6",
    "BirthYear"=>"1976",
    "Health"=>"PP",
    "FaceAmount"=>"500000",
    "Sex"=>"M",
    "Smoker"=>"N",
    "NewCategory"=>"5%2320",
    "ModeUsed"=>"M",
    "EmbeddedAccums"=>"ON",
    "EmbeddedAccumColor"=>"%23FF0000",
    "DoSmokingTobacco"=>"ON",
    "DoHeightWeight"=>"ON",
    "DoBloodPressure"=>"OFF",
    "DoCholesterol"=>"ON",
    "DoDriving"=>"ON",
    "DoFamily"=>"ON",
    "DoCigarettes"=>"ON",
    "DoCigars"=>"ON",
    "DoPipe"=>"ON",
    "DoChewingTobacco"=>"ON",
    "DoNicotinePatchesOrGum"=>"ON",
    "Weight"=>"172",
    "Feet"=>"5",
    "Inches"=>"8",
    "Systolic"=>"-1",
    "Dystolic"=>"-1",
    "BloodPressureMedication"=>"",
    "CholesterolLevel"=>"196",
    "HDLRatio"=>"4.40",
    "CholesterolMedication"=>"Y",
    "HadDriversLicense"=>"Y",
    "MovingViolations0"=>"2",
    "MovingViolations1"=>"1",
    "MovingViolations2"=>"1",
    "MovingViolations3"=>"1",
    "MovingViolations4"=>"1",
    "RecklessConviction"=>"Y",
    "DwiConviction"=>"Y",
    "SuspendedConviction"=>"Y",
    "MoreThanOneAccident"=>"Y",
    "NumDeaths"=>"1",
    "NumContracted"=>"1",
    "DoSubAbuse"=>"ON",
    "Alcohol"=>"Y",
    "AlcYearsSinceTreatment"=>"10",
    "Drugs"=>"Y",
    "DrugsYearsSinceTreatment"=>"9",
    "NoRedX"=>"OFF"
));
/*var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystagechange=function() {
	if (this.readyState==4 && this.status==200)	{
	var myObj = JSON.parse(this.responseText);
	document.getElementById("demo).innterHTML = myObj.name;
	}
};
xmlhttp.open("POST","compulifejson2get.php");
xmlhttp.send();
 */
?>
<HEAD>
<style>
body {
	background-color: #ffffff;
}
div {
	background-color: #f5f5f5;
  display : 'none'; 
  width: 600px;
  border: 1px solid #287cc1;
  border-radius: 7px;
  padding: 10px;
  margin: 10px;
  font-family: Arial, Verdana, Helvetica, sans-serif;
  font-size: 11pt; 
  font-weight: normal; 
  text-align: left; 
}

		h1 { color: #262626; 
			font-family: Arial, Verdana, Helvetica, sans-serif; 
			font-size: 17pt; 
			font-weight: bold; 
			text-align: left; 
			}
		h2 { color: #262626; 
			font-family: Arial, Verdana, Helvetica, sans-serif; 
			font-size: 17pt; 
			font-weight: bold; 
			text-align: left;
			} 
		h3 { color: #0148CB; 
			font-family: Arial, Verdana, Helvetica, sans-serif; 
			font-size: 14pt; 
			font-weight: bold; 
			text-align: left;
			}
		p { color: #262626; 
			font-family: Arial, Verdana, Helvetica, sans-serif;
			font-size: 12pt; 
			font-weight: normal; 
			text-align: left;
			}
			
		ol{ color: #262626; 
			font-family: Arial, Verdana, Helvetica, sans-serif; 
			font-weight: normal; 
			text-align: left;
			line-height: 200%; 
			} 
		ul{ color: #262626;
			font-family: Arial, Verdana, Helvetica, sans-serif; 
			font-weight: normal; 
			text-align: left;
			line-height: 200%; 
			}
		.default_table {
    		border-collapse: collapse;
    		border: 1px solid #004080;
    		background-color: #FFFFFF;
    		padding: 2px;
    		color: #000000; 
    		font-family: Arial, Verdana, Helvetica, sans-serif; 
    		font-size: 11pt; 
    		font-weight: normal; 
    		text-align: left;
    		margin-left:auto; 
    		margin-right:auto;
			}

</style>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
<script>
function addCode()
{
	var Code = document.getElementById("ENABLECOMPANYCODES").value;
	var y = document.getElementById("COMPINC").value;
	if (y.length>0)
		y += ',';
	y += Code;
	document.getElementById("COMPINC").value = y;
	document.getElementById("CompCodeEnable").innerHTML = JSON.stringify(y);
	modifyAction();
}
function clearCodes()
{
	y = '';
	document.getElementById("COMPINC").value = '';//JSON.stringify(y);
	document.getElementById("CompCodeEnable").innerHTML = '';//JSON.stringify(y);
	modifyAction();
}
function loadFromServer()
{
	var	y = JSON.parse(document.getElementById("listjson").value);
	y = extend(y,JSON.parse(document.getElementById("ID").value));
	<?php echo 'var faction = \'https://www.compulifeapi.com/api/CompanyProductList/?COMPULIFE={"COMPULIFEAUTHORIZATIONID":"' . $config['COMPULIFEAUTHORIZATION'] . '"}\';';
 ?>
	$("#LOADFROMSERVERBUTTON").hide();
	var xhttp = new XMLHttpRequest();
	if (!xhttp) {
		alert('Cannot create XMLHTTP instance');
		return false;
	}
	xhttp.open("GET", faction,true);
	xhttp.onreadystatechange = function() {
		//  alert(this.readyState);
		if (this.readyState==1) {
			// server connection established
		}
		if (this.readyState == 4) {
			console.log("Status" + this.status);
			console.log(this.responseText);
			if (this.status == 200) {
				myObj = JSON.parse(this.responseText);
				var sel = document.getElementById('DISPRODCODES');
				while(sel.options.length>0)
					sel.options.remove(0);
				for(i in myObj){
					for(p in myObj[i].Products) {
						var cat = myObj[i].Products[p].CategoryLetter;
						var prodcode = myObj[i].Products[p].ProdCode;
						var name = myObj[i].Name + " " +  myObj[i].Products[p].Name;
						var c = document.createElement("option");
						c.text = name;
						c.value = cat + prodcode;
						sel.options.add(c);

					}
				}
			}
		}
	}
	xhttp.send('');
}
function addDisCode()
{
	var Code = document.getElementById("DISPRODCODES").value;
	var y = document.getElementById("PRODDIS").value;
	if (y.length>0)
		y += ',';
	y += Code;
	document.getElementById("PRODDIS").value = y;
	document.getElementById("ProdCodeDis").innerHTML = JSON.stringify(y);
	modifyAction();
}

function clearDisCodes()
{
	y = '';
	document.getElementById("PRODDIS").value = '';//JSON.stringify(y);
	document.getElementById("ProdCodeDis").innerHTML = '';//JSON.stringify(y);
	modifyAction();
}
function modifyAuth()
{
	var x = document.getElementById("COMPULIFEAUTHORIZATIONID").value;	
	var y = JSON.parse(document.getElementById("ID").value);	
	y.COMPULIFEAUTHORIZATIONID= x;	
	document.getElementById("ID").value = JSON.stringify(y);
	modifyAction();
}
function modifyCat()
{
	y = '';
	var x = document.getElementById("NewCategory").value;
	modifyAction();
}
function modifyZip()
{
	var zip = document.getElementById("ZipCode").value;
	var y = JSON.parse(document.getElementById("ZipCode").value);	
	y.ZipCode = zip;
	document.getElementById("ZipCode").value = JSON.stringify(y);
	modifyAction();
}

function extend(dest, src) {
	for(var key in src) {
		dest[key] = src[key];
	}
	return dest;
}
function SetStyleVisibility(id,Visible)
{
	/*if (Visible)
		id.style.visibility = 'visible';
	else
		id.style.visibility = 'collapse';*/
	if (Visible)
		id.style.display = 'block';		
	else {
		id.style.display = 'none';
	}
 
}
function modifyAction()
{
	var action = document.getElementById("SelAction").value;
	var y='';	
	var EnableCompCodes = false;
	var DisableCompCodes = false;
	var DisableCompSel = false;
	var EnableZipCode = false;
	var Auth = false;
	switch(action) {
		case 'ListStates':
			//y = JSON.parse(document.getElementById("listjson").value);
			y = '';
			document.getElementById("faction").innerHTML = "https://www.compulifeapi.com/api/StateList";
			break;
		case 'ListProvinces':
			//y = JSON.parse(document.getElementById("listjson").value);
			y = '';
			document.getElementById("faction").innerHTML = "https://www.compulifeapi.com/api/ProvinceList";
			break;
		case 'ListLogos':
			y = '';
			document.getElementById("faction").innerHTML = "https://www.compulifeapi.com/api/CompanyLogoList";
			break;
		case 'ListLogosSmall':
			y = '';
			document.getElementById("faction").innerHTML = "https://www.compulifeapi.com/api/CompanyLogoList/small";
			break;
		case 'ListLogosMedium':
			y = '';
			document.getElementById("faction").innerHTML = "https://www.compulifeapi.com/api/CompanyLogoList/medium";
			break;
		case 'ListLogosLarge':
			y = '';
			document.getElementById("faction").innerHTML = "https://www.compulifeapi.com/api/CompanyLogoList/large";
			break;
		case 'ListLogosAll':
			y = '';
			document.getElementById("faction").innerHTML = "https://www.compulifeapi.com/api/CompanyLogoList/all";
			break;
		case 'ListLogosCan':
			y = '';
			document.getElementById("faction").innerHTML = "https://www.compulifeapi.com/api/CompanyLogoListCanada";
			break;
		case 'ListLogosSmallCan':
			y = '';
			document.getElementById("faction").innerHTML = "https://www.compulifeapi.com/api/CompanyLogoListCanada/small";
			break;
		case 'ListLogosMediumCan':
			y = '';
			document.getElementById("faction").innerHTML = "https://www.compulifeapi.com/api/CompanyLogoListCanada/medium";
			break;
		case 'ListLogosLargeCan':
			y = '';
			document.getElementById("faction").innerHTML = "https://www.compulifeapi.com/api/CompanyLogoListCanada/large";
			break;
		case 'ListLogosAllCan':
			y = '';
			document.getElementById("faction").innerHTML = "https://www.compulifeapi.com/api/CompanyLogoListCanada/all";
			break;
		case 'ListCategories':
			Auth = true;
			y = JSON.parse(document.getElementById("listjson").value);
			y = extend(y,JSON.parse(document.getElementById("ID").value));
			document.getElementById("faction").innerHTML = "https://www.compulifeapi.com/api/CategoryList";
			break;
		case 'ListCompanies':
			y = JSON.parse(document.getElementById("listjson").value);
			y = '';
			document.getElementById("faction").innerHTML = "https://www.compulifeapi.com/api/CompanyList";
			break;
		case 'ListCanadaCompanies':
			y = JSON.parse(document.getElementById("listjson").value);
			y = '';
			document.getElementById("faction").innerHTML = "https://www.compulifeapi.com/api/CompanyListCanada";
			break;
		case 'ListCompaniesAndProducts':
			Auth = true;
			y = JSON.parse(document.getElementById("listjson").value);
			y = extend(y,JSON.parse(document.getElementById("ID").value));
			document.getElementById("faction").innerHTML = "https://www.compulifeapi.com/api/CompanyProductList";
			break;
		case 'ListACompany':
			Auth = true;
			EnableCompCodes = true;
			y = JSON.parse(document.getElementById("listjson").value);
			y = extend(y,JSON.parse(document.getElementById("ID").value));
			var t = document.getElementById("COMPINC").value;
			if (t.length > 0)
				y.COMPINC = document.getElementById("COMPINC").value;
			document.getElementById("faction").innerHTML = "https://www.compulifeapi.com/api/CompanyProductList";
			break;
		case 'Comparison':
			Auth = true;
			DisableCompCodes  = true;
			EnableCompCodes = true;
			DisableCompSel = true;
			EnableZipCode = true;
			y = JSON.parse(document.getElementById("Comparison").value);	
			y = extend(y,JSON.parse(document.getElementById("ID").value));
			if (document.getElementById('ErrorZip').checked) 
				y.ErrOnMissingZipCode = 'ON';
			if (document.getElementById('ZipCode').value!='')
				y.ZipCode = document.getElementById('ZipCode').value;
			
			y.NewCategory = document.getElementById("NewCategory").value;
			var t = document.getElementById("COMPINC").value;
			if (t.length > 2)
				y.COMPINC = document.getElementById("COMPINC").value;
			t = document.getElementById("PRODDIS").value;
			if (t.length > 2)
				y.PRODDIS = document.getElementById("PRODDIS").value;
			document.getElementById("faction").innerHTML = "https://www.compulifeapi.com/api/request";
			break;
		case 'SideBySide':
			Auth = true;
			DisableCompCodes  = true;
			EnableCompCodes = true;
			DisableCompSel = true;
			EnableZipCode = true;
			y = JSON.parse(document.getElementById("Comparison").value);	
			y = extend(y,JSON.parse(document.getElementById("ID").value));
			if (document.getElementById('ErrorZip').checked) 
				y.ErrOnMissingZipCode = 'ON';
			y.ZipCode = document.getElementById('ZipCode').value;
			y.NewCategory = document.getElementById("NewCategory").value;
			var t = document.getElementById("COMPINC").value;
			if (t.length > 2)
				y.COMPINC = document.getElementById("COMPINC").value;
			if (t.length > 2)
				y.PRODDIS = document.getElementById("PRODDIS").value;
			document.getElementById("faction").innerHTML = "https://www.compulifeapi.com/api/sidebyside";
			break;
		case 'HealthAnalyzer':
			Auth = true;
			DisableCompCodes  = true;
			EnableCompCodes = true;
			DisableCompSel = true;
			y = JSON.parse(document.getElementById("HealthAnalizer").value);	
			y = extend(y,JSON.parse(document.getElementById("ID").value));
			y.NewCategory = document.getElementById("NewCategory").value;
			var t = document.getElementById("COMPINC").value;
			if (t.length > 2)
				y.COMPINC = document.getElementById("COMPINC").value;
			if (t.length > 2)
				y.PRODDIS = document.getElementById("PRODDIS").value;
			document.getElementById("faction").innerHTML = "https://www.compulifeapi.com/api/request";
			break;

	}
		// set the url that will be Requested
	document.getElementById("FORM").action = document.getElementById("faction").innerHTML;	
		// set the display of the json sent
	document.getElementById("demo").innerHTML=JSON.stringify(y,'<br>',4);	
		// set the json to be sent
	var submitvalue = document.getElementById("SubmitValue");
	var old = submitvalue.value;// the json string being submitted (if one is needed)
	var l = old.length;
	submitvalue.value=JSON.stringify(y);	

	// move stuff out of the form if not needed
	var na = document.getElementById("na");
	var form = document.getElementById("FORM");
	if (y=='') {	// move submitted value outside of form
		if (l!=2){	// used to be id or something, but not now
			na.appendChild(form.removeChild(submitvalue));
			form.method = "POST";
		}
	}
	else {
		if (l==2) { // was list or something, but not now
			form.appendChild(na.removeChild(submitvalue));
			form.method = "GET";
		}
	}
	// enable/disable selecting CompanyCodes
	SetStyleVisibility(document.getElementById("SelectCompCodes"),EnableCompCodes);
	SetStyleVisibility(document.getElementById("DisableProdCodes"),DisableCompCodes);
	SetStyleVisibility(document.getElementById("COMPSEL"),DisableCompSel);
	SetStyleVisibility(document.getElementById("ZipCodeDiv"),EnableZipCode);
	SetStyleVisibility(document.getElementById("AuthDiv"),Auth);
	SetStyleVisibility(document.getElementById("NoAuth"),!Auth);
}
function updateAll()
{
	clearCodes();
	modifyAuth();
}

</script>
<title>COMPULIFE API Demo Page</title>
</HEAD>
<BODY onload="updateAll()">
<?php
echo "<input type='HIDDEN' id='listjson' value='$defaultList'>";
echo "
<input type='HIDDEN' id='ID' value='$defaultID'>";
echo "
<input type='HIDDEN' id='COMPINC' value=''>";
echo "
<input type='HIDDEN' id='PRODDIS' value=''>";
echo "
<input type='HIDDEN' id='ZIPCODE' value=''>";
echo "
<input type='HIDDEN' id='Comparison' value='$defaultComparison'>";
echo "
<input type='HIDDEN' id='HealthAnalizer' value='$defaultHealthAnalizer'>";
//echo '
//Your IP address ';
//echo $obj->IPADDRESS;
//echo '<br>';
?>
</p>

<h1>COMPULIFE API - Sample Requests</h1>
<p>
The following are examples of Requests that can be done with the COMPULIFE API.
It is used to show the possible JSON calls to the api, and to guide you when creating your own php code.</p>
<p>
<ul>
<li>This code would normally call other php code on your server which then calls the compulifeapi, which returns JSON formatted data.</li>
<li>The included <a href="./quoter-sample.php">quoter-sample.php</a> code is an example of calling local php/javascript code to retrieve and format the JSON results.</li>

<?php 
if ($included && !$passedin) { // assume it's on the api server no need to show this stuff
$link = '';
if ($included and isset($config['COMPULIFEAUTHORIZATION'])){
	$link =  '<a href="./api-sample-requests.php/?COMPULIFEAUTHORIZATION=';
	$link .= $config['COMPULIFEAUTHORIZATION']; 
	$link .= '">api-sample-requests.php</a> using your development COMPULIFEAUTHORIZATIONID to run sample requests.';
}
else
	$link =  '<a href="./api-sample-requests.php">api-sample-requests.php</a> (apparently not yet configured locally)';
}
	echo '<li>This page is a direct call to the API, and will not work for all examples unless your browser is located at the same IP address as your server.  ';
if ($included && !$passedin) { // assume it's on the api server no need to show this stuff
	echo 'However, during development you can return to this '. $link . '</li>';
}
?>

<li>The sample JSON call is always shown at the bottom of this page, so even if you are not able to have a browser located on your development server you can see the sample call.</li>
</ul>
</p>
<hr style="border: 1px solid #287cc1;">
<div>
Select Action
<select id="SelAction" NAME="SelAction" onchange="modifyAction();">
<option selected value="ListStates">List States</option>
<option value="ListProvinces">List Provices</option>
<option value="ListLogos">List Company Logos</option>
<option value="ListLogosSmall">List Company Logos-small</option>
<option value="ListLogosMedium">List Company Logos-medium</option>
<option value="ListLogosLarge">List Company Logos-large</option>
<option value="ListLogosAll">List Company Logos-All</option>
<option value="ListLogosCan">List Canadian Company Logos</option>
<option value="ListLogosSmallCan">List Canadian Company Logos-small</option>
<option value="ListLogosMediumCan">List Canadian Company Logos-medium</option>
<option value="ListLogosLargeCan">List Canadian Company Logos-large</option>
<option value="ListLogosAllCan">List Canadian Company Logos-All</option>
<option value="ListCategories">List Categories (Us or Can depending on ID)</option>
<option value="ListCompanies">List All Companies</option>
<option value="ListCanadaCompanies">List All Canadian Companies</option>
<option value="ListCompaniesAndProducts">List All Companies and Products (Us or Can depending on ID)</option>
<option value="ListACompany">List a Company and Products (option to select companies) (Us or Can depending on ID)</option>
<option value="Comparison">Comparison</option>
<option value="SideBySide">Side by side Comparison (consumer version)</option>
<option value="HealthAnalyzer">Health Analyzer</option>
</select>
</div>

<div id="AuthDiv">
COMPULIFE Authorization ID<br>Calling IP address must be the same as expected at the server, so it will only work if run locally or by entering your Development COMPULIFEAUTHORIZATIONID.<br>
<?php
echo "<input id='COMPULIFEAUTHORIZATIONID' name='COMPULIFEAUTHORIZATIONID' type='text' onkeyup='modifyAuth()' value='" . $config['COMPULIFEAUTHORIZATION'];
if ($passedin)
	echo "'></input> from passed in authorization";
else 
	echo "'></input> from configured authorization";
?>
</div>
<div id="NoAuth">
No Authorization needed for this function so will run from any IP address.
</div>
<div id="ZipCodeDiv">
Zip or Postal Code <br>
<?php echo "Error on missing ZipCode<input type='checkbox' name='ErrOnMissingZipCode' id='ErrorZip' onclick='modifyZip()' value = 'ON'><br>
<input id='ZipCode' name = 'ZipCode' type = 'text' onkeyup='modifyZip()' value = '90210'>";
?>
</div>
<div id="SelectCompCodes">
Sample Enable Company codes:
<select id="ENABLECOMPANYCODES" NAME="ENABLECOMPANYCODES" >
<?php
	$Companies = file_get_contents("https://www.compulifeapi.com/api/CompanyList/");
	$Companies = json_decode($Companies);
	foreach($Companies as $Value){
		echo('
<Option  value="'. $Value->CompCode . '">'.$Value->Name . '(US)</OPTION>');
	}
	$Companies = file_get_contents("https://www.compulifeapi.com/api/CompanyListCanada/");
	$Companies = json_decode($Companies);
	foreach($Companies as $Value){
		echo('
<Option  value="'. $Value->CompCode . '">'.$Value->Name . '(Canada)</OPTION>');
	}
?>
</select><br>
<button onclick="addCode()">Add CompCode</button>
<button onclick="clearCodes()">Clear CompCodes</button>
<pre id='CompCodeEnable'></pre>
<br></div>
<div id="DisableProdCodes">
Sample Disable Product Codes 
<select id="DISPRODCODES" NAME="DISPRODCODES" >
<option value="">none</option>
<option value="5BONN">Category 5 Banner Opterm</option>
<option value="5PCPP">Category 5Pacific PL Promise</option>
<option value="5BONN,5PCPP">Category 5 Banner Opterm and Pacific PL Promise</option>
</select>
<button onclick="addDisCode()">Add Disable Code</button>
<button onclick="clearDisCodes()">Clear Disable Codes</button>
<button id = "LOADFROMSERVERBUTTON" onclick="loadFromServer()">Load all possiblities from server</button>
<pre id='ProdCodeDis'></pre>
<br></div>
<div id="COMPSEL">
<td style="text-align:right;" class="gray_cell">&nbsp;<b>Type of Insurance:</b>&nbsp;</td>
<td class="gray_cell">
<select id="NewCategory"  name="NewCategory" onchange="modifyCat();">
<option value="1">1 Year Level Term</option>
<option value="2">5 Year Level Term</option>
<option value="3">10 Year Level Term</option>
<option value="4">15 Year Level Term</option>
<option SELECTED value="5">20 Year Level Term</option>
<option value="6">25 Year Level Term</option>
<option value="7">30 Year Level Term</option>
<option value="0">40 Year Level Term</option>
<option value="T">To Age 65 Level</option>
<option value="U">To Age 70 Level</option>
<option value="V">To Age 75 Level</option>
<option value="A">To Age 80 Level</option>
<option value="B">To Age 85 Level</option>
<option value="C">To Age 90 Level</option>
<option value="D">To Age 95 Level</option>
<option value="E">To Age 100 Level</option>
<option value="G">To Age 105 Level</option>
<option value="H">To Age 110 Level</option>
<option value="F">Other Term</option>
<option value="Z:357">10, 20, 30 Year Term</option>
<option value="Z:12345670TUVABCDEGH#10">All Level Term Products (max 10 results)</option>
<option value="J">15 Year Return of Premium</option>
<option value="K">20 Year Return of Premium</option>
<option value="L">25 Year Return of Premium</option>
<option value="M">30 Year Return of Premium</option>
<option value="W">To age 65 Return of Premium</option>
<option value="X">To age 70 Return of Premium</option>
<option value="Y">To age 75 Return of Premium</option>
<option value="N">Other Return of Premium</option>
<option value="Z:JKM">15, 20, 30 Year with ROP</option>
<option value="Z:JKLMWXYN#10">All Return of Premium Products (max 10 results)</option>
<option value="8">To Age 121 Level  (No Lapse U/L)</option>
<option value="P">To Age 121 Level - Pay to 100</option>
<option value="Q">To Age 121 Level - Pay to 65</option>
<option value="R">To Age 121 Level - 20 Pay</option>
<option value="S">To Age 121 Level - 10 Pay</option>
<option value="O">To Age 121 Level - Single Pay</option>
<option value="Z:8PQRSO#10">All To Age 121 Level Products</option>
</select>
</div>

<FORM id="FORM" action = "https://www.compulifeapi.com/api/request" method ="GET">&nbsp;&nbsp;&nbsp;<input type="submit">



<?php
echo "<p>Request URL =  <text id='faction'>$faction</text></p>";
?>

<!-- <p>The JSON string note that when an id is needed the <b>IP ADDRESS sent, must match the Remote IP address received and must also match the COMPULIFEAUTHORIZATIONID</b></p>-->

<p>Additional Key(s) and Value(s) passed to the above URL

<?php 
echo "<pre id='demo'>$json</pre>";
echo "<input name='COMPULIFE' type='hidden' id='SubmitValue' value='". $json. "'>";
?>
</FORM>
<hr style="border: 1px solid #287cc1;">
<form id='na'>
</form>
