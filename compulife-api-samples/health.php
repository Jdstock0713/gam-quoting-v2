<?php ?>
<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="">
  <meta name="keywords" content="">
  <title>Health Analyzer</title>
  
<!-- head start --> 


  <link rel="stylesheet" href="/compulife-api-samples/css/coffeegrinder.min.css">
  <link rel="stylesheet" href="/compulife-api-samples/css/wireframe-theme.min.css">
  <script>document.createElement( "picture" );</script>
  <script src="/compulife-api-samples/js/picturefill.min.js" class="picturefill" async="async"></script>
   
  
  <link rel="stylesheet" href="/compulife-api-samples/css/main.css">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Cantata+One%7CCantora+One%7CRoboto:400,500,b">
  


<script type="text/javascript">
function changeUrl() {
var redirect;
redirect = document.getElementById('newUrl').value;
document.location.href = redirect;
}   
function setStyle(x,show)
{
	x.style.display="block";
	if (show) {
		x.style.transition="opacity 1s ease-in";
		x.style.opacity=1;
		x.style.height="auto";
		x.style.width = "90%";
		x.style.borderRadius="10px";
		x.style.backgroundColor = "#f5f5f5";
		x.style.padding="5px";
		x.style.border="1px solid #287cc1";
		x.style.boxShadow="1px 1px 1px #287cc1"
//'hsla(120,100%,75%,0.3)';
	}
	else	{
		x.style.transition="opacity 1s ease-out";
		x.style.opacity=0;
		x.style.height=0;
		x.style.overflow= "hidden";
	}

}
function ShowDivClick(divName,cbname)
{
	var x = document.getElementById(divName);
	if (x==null)
		alert('unknown ' + cbname);
	else
		setStyle(x,(document.getElementsByName(cbname)[0].checked));
	SetMainSelections();
}
function GetRB(cbname) {
	var radios = document.getElementsByName(cbname);
	var selected = Array.from(radios).find(radio => radio.checked);
	return  (selected.value=='Y');
}

function ShowDivRBClick(divName,cbname)
{
	var x = document.getElementById(divName);
	if (x==null)
		alert('unknown div ' + divName + ' used by ' + cbname);
	setStyle(x,GetRB(cbname));
	SetMainSelections();
}
function ShowDivNSelClick(divName,selName)
{
	var divName1 = divName + '1';
	var divName2 = divName + '2';
	var divName3 = divName + '3';

	ShowDivSelClick(divName,selName,'1');// only show when > 0
	ShowDivSelClick(divName1,selName,'1');
	ShowDivSelClick(divName2,selName,'2');
	ShowDivSelClick(divName3,selName,'3');
}
function ShowDivSelClick(divName,selName,val='1')
{
	var x = document.getElementById(divName);
	var y = document.getElementById(selName);
	if (x==null || y==null)
		alert('unknown div ' + divName + ' used by ' + selName);
	setStyle(x,y.value>=val);	
	SetMainSelections();
}
function DoCigarsClick()
{
var x = document.getElementById("Cigars");
	setStyle(x,document.getElementsByName("DoCigars")[0].checked);
	SetMainSelections();
}
function SetEle(Name,val)
{
	if (val) 
		document.getElementsByName(Name)[0].value = "Y";
	else
		document.getElementsByName(Name)[0].value = "N";
}
function SetMainSelections() 
{
	SetEle("DoSmokingTobacco",
	       	(document.getElementsByName("DoCigarettes")[0].checked ||
  	    document.getElementsByName("DoCigars")[0].checked ||
  	    document.getElementsByName("DoPipe")[0].checked ||
	    document.getElementsByName("DoChewingTobacco")[0].checked ||
	    document.getElementsByName("DoNicotinePatchesOrGum")[0].checked));
	SetEle("DoBloodPressure",GetRB('BloodPressureMedication'));
	SetEle("DoCholesterol",GetRB("CholesterolMedication"));
	SetEle("HadDriversLicense",GetRB("DoDriving"));
	SetEle("DoSubAbuse",(GetRB("Alcohol") || GetRB("Drugs")));
	// doing family if either numdeaths is > 0 or numcontracted>0
	SetEle("DoFamily",((document.getElementById("NumDeaths").value >= '0') || 
				(document.getElementById("NumContracted").value >= '0'))
		);

}
</script>

<script language="JavaScript" type="text/javascript">

function checkform()
  {
  	if (document.hinit.Weight.options[document.hinit.Weight.selectedIndex].value ==-1)
	{
		alert('Please enter your weight');
		return false;
	}
	return true;
  }

  </script>


<style>

a:link.nocolor {text-decoration: none; border-bottom:2px solid #D50000; color: #000000 }
a:visited.nocolor {text-decoration: none; border-bottom:2px solid #D50000; color: #000000 }
a:hover.nocolor {text-decoration: none; border-bottom:2px solid #D50000; color: #000000 }
a:active.nocolor {text-decoration: none; border-bottom:2px solid #D50000; color: #000000 }

.styled-select select {
   width: auto;
   padding: 0px;
   font-size:12px;
   line-height:20px;
   height: 25px;
   padding-left: 0px;
   }
   
</style> 

<!-- head end -->
  
  
</head>
<?php

function AddOptionTextStr($from,$to,$selected,$selectedText,$appendText)
{
	$result = '';
	for($i=$from;$i<=$to;$i++) {
		$txt = $i . $appendText . (($i==1) ? '' : 's'); // to handle plurel if not 1
		if ($i==$selected) {
			if ($selectedText!='')
				$txt = $selectedText;
			$result .= '<option selected value="'.$i . '">'.$txt.'</option>
';
		}
		else
			$result .= '<option value="'.$i.'">'.$txt.'</option>
';
	}
	return $result;
}
function AddOptionsStr($from,$to,$selected,$selectedText = '',$first='',$last='') {
	$result = '';
	for($i = $from;$i<=$to;$i++) {
		if ($i==$selected) {
			if ($selectedText==''){
				$result .= '<option selected value="' . $i . '">' . $i . '</option>
';
				continue;
			}
			else
				$result .= '<option selected value="-1">' . $selectedText . '</option>
';
		}
			if ($first!=''){
				$result .= '<option value="' . $i . '">'.$first.'</option>
';
				$first='';
			}
			elseif ($i==$to && $last!='')
				$result .= '<option value="' . $i . '">'.$last.'</option>
';
			else
			$result .= '<option value="' . $i . '">'.$i.'</option>
';

	}
	return $result;
}
function AddSelectStr($name,$from,$to,$selected,$selectedText='',$first='',$last='') {
	$result = '<select class="select drop-down-health" name="'. $name .'">
';
	$result .= AddOptionsStr($from,$to,$selected,$selectedText,$first,$last);
	$result .= '</select>';
	return $result;
}
function AddTextArrayOptionsStr($value,$text,$sel)
{
	$result = '';
	foreach($value as $i => $v) {
		if ($sel==$v)
			$result .= '<option selected value="'. $v. '">'.$text[$i] . '</option>
';
		else
			$result .= '<option value="'. $v. '">'.$text[$i] . '</option>
';
	}
	return $result;
}
function AddTextArraySelectStr($name,$values,$text,$sel) {
	$result = '<select class="select drop-down-health" name="'. $name .'">
';
	$result .= AddTextArrayOptionsStr($values,$text,$sel);
	$result .= '</select>';
	return $result;
}
function AddTextSelectStr($name,$from,$to,$select,$selectText,$appendText) {
	$result = '<select class="select drop-down-health" name="'. $name .'">
';
	$result .= AddOptionTextStr($from,$to,$select,$selectText,$appendText);
	$result .= '</select>
';
	return $result;
}
function AddTicketSelectStr($name)
{
	return AddTextSelectStr($name,0,9,0,'No Tickets',' Ticket');
}
function AddFamilySelectStr($name,$Div)
{
	$result =  '<select name="' . $name . '" class="select drop-down-health" onclick="ShowDivNSelClick(\'' .
		$Div . '\',\'' . $name . '\')" id="'. $name .'">
';		
	$result .=  '<option selected value="-1">Don\'t Know</option>
	<option value="0">No Family Members</option>
';
	$result .= AddOptionTextStr(1,3,-1,'',' Family Member');
	$result .=  '</select>
';
	return $result;
}

function AddYearsSelectStr($name)
{
	$result =  '<select class="select drop-down-health" name="'. $name .'">
';
	$result .= '<option value="0">6 months or less</option>
<option value="1">1 year or less</option>
<option value="2">2 years or less</option>
<option value="3">3 years or less</option>
<option value="4">4 years or less</option>
<option value="5">5 years or less</option>
<option value="6">7 years or less</option>
<option value="7">10 years or less</option>
<option value="8">15 years or less</option>
<option value="9">more than 15 years</option>
</select>';
 	return $result;
}

function PromptYearsSelectStr($prompt,$name) {
	return '
<span class="text-element text-results-health">'. $prompt .
	 '</span>' .
	AddYearsSelectStr($name);
}
function PromptAgeSelectStr($prompt,$name,$default) {
	$s = '
<span class="text-element text-results-health">'. $prompt .  '</span>'. 
	AddSelectStr($name,0,99,$default);
	return $s;
}
function AddHiddenStr($name) {
	if (isset($_REQUEST[$name]))
		return  '<input type="hidden" name="' . $name . '" value="'. $_REQUEST[$name] . '">
';
	else return '';
}
function AddArrayHiddenStr($a) {
	$result = '';
	foreach($a as $v) {
		$result .= AddHiddenStr($v);
	}
	return $result;
}
function AddDivContainer($txt) 
{
              return '<div class="container container-height">' . $txt . '</div>';
}
function DivR76($txt)
{
	return  '<div class="row"><div class="coffee-span-12 subgrid-column-7"><div class="container container-6">' . 
		$txt. 
		'</div></div></div>';
}
function Div6BreakStr()
{
	return '</div>
              <div class="container container-6">';
}
function AddRowColDivStr($txt) {
	return  '<div class="row subgrid-row-1">
            <div class="coffee-span-12 coffee-490-span-12 subgrid-column-health">' . $txt . '</div></div>';
}

function SubRowColDivStr() {
	return '</div>
</div>';
}		
function Divs_SplitStr() { // </div><div back in>
	return SubRowColDivStr() .  
	'<div class="row subgrid-row-1">
            <div class="coffee-span-12 coffee-490-span-12 subgrid-column-health">';
}
function HideDivStr($name,$txt) {
	return '
<!-- hide block -->
<div id="' . $name . '" style="display:block;height:0;opacity:0;overflow:hidden">' . $txt . '</div><!--end hide block-->';
}
function MovingViolationsStr($prompt,$name)
{
	return '
<span class="text-element text-results-health">' . $prompt . '</span>' .
	AddTicketSelectStr($name);
}
function AddSmokeTypeStr($DoName,$PeriodName,$Name,$CheckBoxLabel,$namep,$smokedA,$defaultPerDay) {
	$extra = '';
	if ($namep!=='') {
		$extra = Divs_SplitStr() . 	// <-->
		 '<span class="text-element text-results-health">On average, how many '. $namep . ' per day do/did you smoke?&nbsp;&nbsp;</span>' . 
		 AddSelectStr('Num'. $Name,1,99,$defaultPerDay); 
	}

	$result = Divs_SplitStr();	// <->
	$result .= '
<label class="checkbox checkbox-1"><span class="text-element text-results-health">
		<input type="checkbox" onclick="ShowDivClick('. "'$Name','$DoName'" . ')" name="'. $DoName . '" value="Y">
'. $CheckBoxLabel . '</span></label>';
	$result .= HideDivStr($Name,  
	 AddRowColDivStr(
	'<span class="text-element text-results-health">How long has it been since you last '. $smokedA . '?&nbsp;&nbsp;</span>' . 
	 AddYearsSelectStr($PeriodName) . $extra )); 
	return $result;
}

function DivC7($txt)
{
 return '<div class="row row-health-question" style="padding-right: 0; padding-bottom: 0; padding-left: 0;">
    <div class="coffee-span-12 column-7">
      <div class="container container-1">
		<div class="subgrid subgrid-1">' . $txt . 
'       	</div>
     </div>
     </div>
</div>';
}
function StartSection($text,$section) {
	return '<div class="row row-9" style="padding-right: 0; padding-bottom: 0; padding-left: 0; width:100%;">
	<div class="coffee-span-12 column-15" style="min-height: 1.25em; width: 100%;">
		<h2 class="heading-health-sub"><span class="heading-text-3">' . $text . '</span><br>
		</h2></div></div>'. $section;
}
function SetupSmokingQuestions(){
/* If all 5 sub smoking categories are not checked, then DoSmokingTobacco 
 is turned off and the smoking tobacco segment on the next page is 
 not shown. */
	return DivC7(
	AddRowColDivStr( 
'<input type="hidden" name="DoSmokingTobacco" value="N"> 
<span class="text-element text-results-title"> 
<span class="text-text-10">
Check each tobacco product that you have 
<span class="text-text-11">EVER</span> 
smoked or used:
</span>&nbsp;</span>' . 
	AddSmokeTypeStr('DoCigarettes','PeriodCigarettes','Cigarettes','Cigarette','cigarettes','smoked a cigarette',20) . 
	AddSmokeTypeStr('DoCigars','PeriodCigars','Cigars','Cigar','cigars','smoked a cigar',1) . 
	AddSmokeTypeStr('DoPipe','PeriodPipe','Pipes','Pipe','','smoked a pipe',0) . 
	AddSmokeTypeStr('DoChewingTobacco','PeriodChewingTobacco','ChewingTobacco','Chewing Tobacco','','used chewing tobacco',0) . 
	AddSmokeTypeStr('DoNicotinePatchesOrGum','PeriodNicotinePatchesOrGum','NicotinePatchesOrGum','Nicotine Patches or Gum','','used nicotine patches or gum',0)
	)); 
}
function AddBPQuestions() {
	 		  
/* If the user selects Don't Know (-1), then DoBloodPressure gets set -->
<!-- to N and the Blood Pressure segment on the next page is not shown -->
 */
	$s =  DivC7('<input type="hidden" name="DoBloodPressure" value="N">' . 
	AddRadioYNStr("Have you ever been treated for or taken medication for high blood pressure? &nbsp; &nbsp; &nbsp;<br>",'BloodPressureMedication','BloodPressureMedication') . 
 HideDivStr("BloodPressureMedication",
 AddRowColDivStr( 
 '<span class="text-element text-results-health">What is your systolic pressure?&nbsp;&nbsp;</span>' . 
	 AddSelectStr('Systolic',119,251,119,"Don't know",'less than 120','>250') . 
	 Divs_SplitStr() . 
	  '<span class="text-element text-results-health">What is your diastolic pressure?&nbsp;&nbsp;</span>' . 
	AddSelectStr('Dystolic',78,181,78,"Don't Know",'less than 80','>180') .
	Divs_SplitStr() . 
	PromptYearsSelectStr('When were you last treated for high blood pressure?&nbsp;&nbsp;','PeriodBloodPressure') .
	PromptYearsSelectStr('If currently taking blood pressure medication, How long has your blood pressure been successfully controlled by medication?&nbsp;&nbsp;','PeriodBloodPressureControlDuration') 
)));
	return $s;
};

function AddCholQuestions() {
	$v=array("2.50", "2.60", "2.70", "2.80", "2.90", "3.00", "3.10", "3.20", "3.30", "3.40", "3.50", "3.60", "3.70", "3.80", "3.90", "4.00", "4.10", "4.20", "4.30", "4.40", 
		"4.50", "4.60", "4.70", "4.80", "4.90", "-1", "5.00", "5.10", "5.20", "5.30", "5.40", "5.50", "5.60", "5.70", "5.80", "5.90", "6.00", "6.10", "6.20", "6.30", "6.40",
		"6.50", "6.60", "6.70", "6.80", "6.90", "7.00", "7.10", "7.20", "7.30", "7.40", "7.50", "7.60", "7.70", "7.80", "7.90", "8.00", "8.10", "8.20", "8.30", "8.40", 
		"8.50", "8.60", "8.70", "8.80", "8.90", "9.00", "9.10", "9.20", "9.30", "9.40", "9.50", "9.60", "9.70", "9.80", "9.90", "10.00");
	$t = $v;
	$t[25]="Don't know";

	/* If the user selects Don't Know (-1), then DoCholesterol gets set to off */
	$s = DivC7('<input type="hidden" name="DoCholesterol" value="N">' . 
	AddRadioYNStr("Have you ever been treated for or taken medication for high cholesterol? &nbsp; &nbsp; &nbsp;<br>",'CholesterolMedication','CholesterolMedication') . 
	HideDivStr("CholesterolMedication",
				  
	AddRowColDivStr(
		'<span class="text-element text-results-health">What is your cholesterol level?&nbsp;&nbsp;</span>' . 		
	AddSelectStr('CholesterolLevel',100,300,200,"Don't Know") . 
	Divs_SplitStr().
	'<span class="text-element text-results-health">What is your HDL ratio?&nbsp;&nbsp;</span>
' .	
	AddTextArraySelectStr("HDLRatio",$v,$t,'-1') . 
	Divs_SplitStr().
	PromptYearsSelectStr('When were you last treated for high cholesterol?&nbsp;&nbsp','PeriodCholesterol') .
	PromptYearsSelectStr('If currently taking cholesterol medication, How long has your cholesterol been successfully controlled by medication?&nbsp;&nbsp','PeriodCholesterolControlDuration') 
	)) 
);
       	return $s;
}


function AddFamilyHistoryQuestions()
{
 return DivC7(DivR76(
 ('<input type="hidden" name="DoFamily" value="N">
<span class="text-element text-results-title">Family related deaths: &nbsp;</span><br>' . '
<span class="text-element text-results-health">Please indicate the total number of family members (parents or siblings)<br> 
who have died from cardiovascular disease (heart attacks and strokes), cancer, diabetes or kidney disease before the age of 70:&nbsp;&nbsp;</span>
' .
	 AddFamilySelectStr('NumDeaths','NumDeathDiv')) . 
HideDivStr('NumDeathDiv',	// outer case shows up if NumDeaths!=-1
 	HideDivStr('NumDeathDiv1',
		 FamilyDeathStr('<span class="text-element text-results-title">Youngest Family Death Due to Disease (father, mother, brother or sister): &nbsp;</span>',
			'Please indicate the age of the youngest family member&nbsp;who died due the named illnesses which follow:&nbsp;&nbsp;',
			'0','0')
	) . 
	HideDivStr('NumDeathDiv2',
		 FamilyDeathStr('<span class="text-element text-results-title">2nd Youngest Family Death Due to Disease (father, mother, brother or sister): &nbsp;</span>',
	'<span class="text-element text-results-health">Please indicate the age of the 2nd youngest family member&nbsp;who died due the named illnesses which follow:&nbsp;&nbsp;</span>',
	'0','1')
	). 
	HideDivStr('NumDeathDiv3',
		 FamilyDeathStr('<span class="text-element text-results-title">3rd Youngest Family Death Due to Disease (father, mother, brother or sister): &nbsp;</span>',
	'<span class="text-element text-results-health">Please indicate the age of the 3rd youngest family member&nbsp;who died due the named illnesses which follow:&nbsp;&nbsp;</span>',
	'0','2')
)) . 
	DivR76(
'<span class="text-element text-results-title">Family related occurance of disease: &nbsp;</span>
<span class="text-element text-results-health">Not including those who died, please indicate the total number of family members (parents or siblings) 
who have contracted cardiovascular disease (heart attacks and strokes), cancer, diabetes or kidney disease before the age of 70:&nbsp;&nbsp;</span>' .

AddFamilySelectStr('NumContracted','NumContractedDiv') . 
HideDivStr('NumContractedDiv',
HideDivStr('NumContractedDiv1',
		 FamilyDeathStr('<span class="text-element text-results-title">Youngest Family Member to contract one of the following diseases (father, mother, brother or sister): &nbsp;</span>',
		 'Please indicate the age of the youngest family member who contracted any of the named illnesses which follow:',
		 '1','0')
).	HideDivStr('NumContractedDiv2',
FamilyDeathStr('<span class="text-element text-results-title">2nd Youngest Family Member to contract one of the following diseases (father, mother, brother or sister):</span>',
	'<span class="text-element text-results-health">Please indicate the age of the youngest family member who contracted any of the named illnesses which follow:</span>',
	'1','1')
).	HideDivStr('NumContractedDiv3',
FamilyDeathStr('<span class="text-element text-results-title">3rd Youngest Family Member to contract one of the following diseases (father, mother, brother or sister): </span>',
		 '<span class="text-element text-results-health">Please indicate the age of the youngest family member who contracted any of the named illnesses which follow:</span>',
	'1','2')
)  )

)// . " after all"
));
}
function AddSubstanceAbuse(){
	$v=array( "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11");
	$t=array( "1 year or less", "then 2 years (1 year or more)", "then 3 years (2 years or more)", "then 4 years (3 years or more)", "then 5 years (4 years or more)",
	"then 6 years (5 years or more)", "then 7 years (6 years or more)", "then 8 years (7 years or more)", "then 9 years (8 years or more)", "then 10 years (9 years or more)",
	"then 20 years (10 years or more)", "more then 20 years");
$s = DivC7(DivR76(
 '<input type="hidden" name="DoSubAbuse" value="N">' .
	AddRadioYNStr("Have you ever been treated for alcohol abuse? &nbsp; &nbsp;",'AlcoholDiv','Alcohol') .
HideDivStr('AlcoholDiv',
              '<span class="text-element text-results-health">The number of years since treatment:&nbsp;&nbsp;</span>'.
	AddTextArraySelectStr('AlcYearsSinceTreatment',$v,$t,$v[0])
	)) .

	DivR76(
	AddRadioYNStr('<span class="text-element text-results-health">Have you ever been treated for drug abuse? &nbsp; &nbsp;</span>','DrugDiv','Drugs') .
	HideDivStr('DrugDiv','<span class="text-element text-results-health">The number of years since treatment:&nbsp;&nbsp;</span>'.

	AddTextArraySelectStr('DrugsYearsSinceTreatment',$v,$t,$v[0])).
	Div6BreakStr()));
	return $s;
}

function AddDrivingQuestions() {
	$s = HideDivStr('EmptyDiv',''); // just a place to let radiobuttons hide, so I can use common code for other radio buttons that actually do need a hide div
// If the user has never had a driver's license, then DoDriving gets set to N
$s .=  DivC7('
<input type="hidden" name="HadDriversLicense" value="N">' .
AddRadioYNStr("Have you ever had a drivers license? &nbsp; &nbsp;<br>",'DrivingDiv','DoDriving',
'<span class="text-element text-results-health-italic"><span class="text-text-7">&nbsp; &nbsp; &nbsp; if you answer No, driving record is ignored</span><br>
</span>') . 
HideDivStr('DrivingDiv' ,
	AddRadioYNStr("Have you ever been convicted of drunken driving (DUI/DWI)? &nbsp; &nbsp;<br>",'DrunkenDiv','DwiConviction') .
HideDivStr('DrunkenDiv', PromptYearsSelectStr("&nbsp;&nbsp;How long since the most recent conviction for drunken driving (DUI/DWI)?&nbsp;&nbsp;",'PeriodDwiConviction')) .
AddRadioYNStr("Have you ever been convicted of reckless driving? &nbsp; &nbsp;<br>",'RecklessDiv','RecklessConviction') .
HideDivStr('RecklessDiv', PromptYearsSelectStr("&nbsp;&nbsp;How long since the most recent conviction for reckless driving?&nbsp;&nbsp;",'PeriodRecklessConviction')) .
AddRadioYNStr("Has your license ever been revoked or suspended? &nbsp; &nbsp;<br>",'SuspendDiv','SuspendedConviction') .
HideDivStr('SuspendDiv',PromptYearsSelectStr("&nbsp;&nbsp;How long since the most recent conviction resulting in a revoked or suspended license?&nbsp;&nbsp;",'PeriodSuspendedConviction')) .
AddRadioYNStr("Have you ever had more than one accident? &nbsp; &nbsp;<br>",'AccidentDiv','MoreThanOneAccident').
HideDivStr('AccidentDiv',PromptYearsSelectStr("&nbsp;&nbsp;Not counting your last accident, how long has it been since the accident which preceeded your last?&nbsp;&nbsp;",'PeriodMoreThanOneAccident')).
 '<div class="row">
            <div class="coffee-span-12 subgrid-column-16">
              <span class="text-element text-results-title">Please indicate the total number of moving violations/tickets (ie. not parking tickets) that you have received in each of the last time periods: &nbsp;</span>
            </div>
	  </div>' .
AddRowColDivStr(
MovingViolationsStr('during the last 6 months:&nbsp;&nbsp;','MovingViolations0') .
Divs_SplitStr() .
MovingViolationsStr('during the last last year, more than 6 months:&nbsp;&nbsp;','MovingViolations1') .
Divs_SplitStr() .
MovingViolationsStr('during the last 2 years, more than 1 year:&nbsp;&nbsp;','MovingViolations2') .
Divs_SplitStr() .
MovingViolationsStr('during the last 3 years, more than 2 year:&nbsp;&nbsp;','MovingViolations3') .
Divs_SplitStr() .
MovingViolationsStr('during the last 5 years, more than 3 year:&nbsp;&nbsp;','MovingViolations4'))));
	return $s;
}
function AddCheckBoxStr($Name,$Prompt)
{
	return '<label class="checkbox checkbox-1"><input type="checkbox" name="' . $Name . '" value="Y"><span>'. $Prompt .'</span></label>
';
}
function FamilyDeathStr($prompt1,$prompt2,$d,$i)
{ 
	$s =  	AddRowColDivStr($prompt1);  // div txt /div

	if ($d=='0') // death==0,contracted==1 
		$s .= PromptAgeSelectStr($prompt2,"AgeDied".$d . $i,70); // span prompt /span select ... /select
//	if ($d=='0') // death==0,contracted==1 
	$s .= PromptAgeSelectStr("
Please indicate the age when this person first contracted any of the named illnesses:&nbsp;&nbsp;","AgeContracted".$d .$i,70);
	$s .= AddRowColDivStr( AddRadioYNStr("Was this person a parent? &nbsp; &nbsp;",'',"IsParent".$d .$i) ) .
DivR76(' <span class="text-element text-results-health">Please check off any and all illnesses which this family member experienced: &nbsp; &nbsp;<br></span>' . 
AddRowColDivStr(
	    AddCheckBoxStr("CVD".$d.$i ,"Cardiovascular Disease CVD") .
AddCheckBoxStr("CAD".$d .$i ,"Coronary Artery Disease CAD (or Heart attack)").
AddCheckBoxStr("CVI".$d .$i ,"Cardiovascular Impairments").
AddCheckBoxStr("CVA".$d .$i ,"Cerebrovascular Disease CVA (or Stroke)").
AddCheckBoxStr("Diabetes".$d .$i ,"Diabetes").
AddCheckBoxStr("KidneyDisease".$d .$i ,"Kidney Disease").
AddCheckBoxStr("ColonCancer".$d .$i ,"colon cancer").
AddCheckBoxStr("IntestinalCancer".$d .$i ,"intestinal cancer").
AddCheckBoxStr("BreastCancer".$d .$i ,"breast cancer").
AddCheckBoxStr("ProstateCancer".$d .$i ,"prostate cancer").
AddCheckBoxStr("OvarianCancer".$d .$i ,"ovarian cancer").
AddCheckBoxStr("OtherInternalCancer".$d .$i ,"other internal cancer").
AddCheckBoxStr("MalignantMelanoma".$d .$i ,"malignant melanoma").
AddCheckBoxStr("BasalCellCarcinoma".$d .$i ,"basal cell carcinoma")));

	return $s;
}
function AddRadioYNStr($Prompt,$DivName,$RBName,$supplimental='')
{
	$click = '';
	if ($DivName!='') $click =  ' onclick="ShowDivRBClick(\''. $DivName . '\',\''. $RBName. '\')"';
	$s = DivR76( 
	 '<span class="text-element text-results-health">' . $Prompt . '</span>' .
	Div6BreakStr() .
	 '<label class="radio radio-button-left">'.
	 '<input type="radio" ' . $click . 
         ' name="' . $RBName . '" checked value="N">' .
	'<span>No</span></label>' .
	'<label class="radio radio-button-right">' .
	'<input type="radio"' . $click . 
         ' name="' . $RBName . '" value="Y">' . 
		'<span>Yes</span></label>' .  $supplimental );
	return $s;
}
function SetupHeightWeight() {
 	return 	DivC7(AddRowColDivStr(
 ' <input type="hidden" name="DoHeightWeight" value="Y">
	      <span class="text-element text-results-title">Height: &nbsp;</span>' .
	AddDivContainer(
		AddSelectStr('Feet',4,7,5) . 
		 '<span class="text-element text-results">&nbsp; feet &nbsp;<br></span>' . 
	 	AddSelectStr('Inches',0,11,8) . 
		'<span class="text-element text-results">&nbsp; inches &nbsp;<br></span>'
	) . 
	Divs_SplitStr() . 	// <-->
        '<span class="text-element text-results-title">Weight: &nbsp;</span>' .
	'<select class="select drop-down-health" name="Weight">' .
	'<option value="74"><75</option>' . 
	AddOptionsStr(75,149,-1) .
	'<option selected value="-1">Please Select</option>' . 
	AddOptionsStr(150,400,-1) . 
	'<option value="401">>400</option>'.
	'</select>' . 
        '<span class="text-element text-results">&nbsp; lbs.<br></span>'));
}
?>

<body class="grid-home"> 


  <div class="row row-result-1">
    <div class="coffee-span-12 column-6"></div>
  </div>
    <div class="row row-top-spacer">
    <div class="coffee-span-12 column-top-spacer"></div>
  </div>
  <div class="row row-health-header">
    <div class="coffee-span-12 column-4">
      <h2 class="heading-health">Health Analyzer Questionnaire<br>
      </h2>
    </div>
  </div>
</div>
</div>
  

  <div class="row row-health-question" style="padding-right: 0; padding-bottom: 0; padding-left: 0;">
    <div class="coffee-span-12 column-7" style="padding-right: .3125em; padding-bottom: .4375em; padding-left: .3125em;">
 

<form action="results.php" name="hinit" onSubmit="return checkform()" method="POST">
  
  
<?php 
$req = '';
foreach($_REQUEST as $n => $v) {
	$req .= '
<input type="hidden" name="' . $n .'" value="'.$v.'">';
}

	echo ' ' . $req;
echo StartSection('Height and Weight',
	// If the user selects Don't Know (-1), then DoHeightWeight gets turned 
// off and the Height Weight section on the next page is not shown 
	SetupHeightWeight() );


	echo StartSection('Current &amp; Past Smoking/Tobacco use', SetupSmokingQuestions());

	echo StartSection('Blood Pressure', AddBPQuestions());

	echo StartSection('Cholesterol', AddCholQuestions());
	echo StartSection('Driving', AddDrivingQuestions());

	echo StartSection('Family History', AddFamilyHistoryQuestions());

	echo StartSection('Substance Abuse', AddSubstanceAbuse());

	
	echo '<div align="center" style="text-align: center;"><div align="center"><button type="submit" class="button-submit-health" style="width: 200px;" value="Click Here">View Results</button></div>';
	// Pass some hidden values onto the next page 
	echo AddArrayHiddenStr(array('ZipCode','State','Birthday','BirthMonth','BirthYear',
	"Health","FaceAmount","Sex", "Smoker","NewCategory","UserLocation","ModeUsed","SortOverride1","MaxNumResults","NoRedX","SortByHealth","RejectReasonBr","GoMessage","DoNotKnowMessage"));
?>	  
		  

	  
</div></div></div>

  <div class="row row-health-question-bottom">
    <div></div>
  </div>

  
  <div class="row">
    <div class="coffee-span-12 column-14"></div>
  </div>
  <div class="row">
    <div class="coffee-span-12 coffee-490-span-12">
	<div style="font-family: Arial; font-weight: bold; font-style: normal; text-decoration: none; font-size: 11pt; text-align:center; margin-top:0px">Powered by <a class="nocolor" href="http://www.compulife.com" target="_blank">COMPULIFE</a><sup>&reg;</sup></b><br><br><br><br></div>
    </div>
  </div>
  



  

  <script src="/compulife-api-samples/js/jquery-1.11.0.min.js"></script>
</body>

</html>
	      

