<?php
?><!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="">
  <meta name="keywords" content="">
  <title>Health Analyzer Quote Results</title>
  
  <!-- head start -->    
  
  <link rel="stylesheet" href="/compulife-api-samples/css/coffeegrinder.min.css">
  <link rel="stylesheet" href="/compulife-api-samples/css/wireframe-theme.min.css">
  <script>document.createElement( "picture" );</script>
  <script src="/compulife-api-samples/js/picturefill.min.js" class="picturefill" async="async"></script>
  
  <link rel="stylesheet" href="/compulife-api-samples/css/mainhealth.css">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Cantata+One%7CCantora+One%7CRoboto:400,500,b">
  


<script src="compulifeapi/compulifeapi.js" async="async"></script>
<script>
function addClass(id,txt) {
	var x = document.getElementsByClassName(id);
	var i;
	for(i=0;i<x.length;i++){
		var output = x[i].innerHTML + txt;
		x[i].innerHTML = output;
	}
}
function setClass(id,txt) {
	var x = document.getElementsByClassName(id);
	var i;
	for(i=0;i<x.length;i++)
		x[i].innerHTML = txt;
	x = document.getElementById(id);
	if (x!=null)
		x.value = txt;
}


var BuildTableItem;
var Compulife;
var RequestType;
var ResponseID;
function BuildComparison(item){
	BuildTableItem = item;
	if (typeof logos != 'undefined')
		complogos = logos;
	else complogos = 0;
	
	txt += 	BuildTableCategory(item);
var 	SortByHealth = $('#SortByHealth').val(); 
	item.Compulife_Results.sort(function(a,b){
if (SortByHealth=='H') { // sort by health
	if (a.HealthAnalysisResult==b.HealthAnalysisResult) return 0;

	if (a.HealthAnalysisResult=='go')
		return  -1;
	
	if (b.HealthAnalysisResult=='go')
		return  1;
	if (a.HealthAnalysisResult=='dk')
		return  -1;
	if (b.HealthAnalysisResult=='dk')
		return  1;
	return 1; // shouldn't get here
	}
	if (SortByHealth=='A')	// sort by annual
		return a.Compulife_premiumAnnual - b.Compulife_premiumAnnual;
	else 		// sort by monthly
		return a.Compulife_premiumM - b.Compulife_premiumM;
});
	addClass('comparisonRepeat',txt);		
        item.Compulife_Results.forEach(BuildTableRowResults);
	setClass("sex",SexText(myObj));
	setClass("aage",myObj.Lookup.Birthdate.ActualAge);
	setClass("nage",myObj.Lookup.Birthdate.NearestAge);
	setClass("statetxt", StateText(myObj));
	setClass("birthdate",BirthDateText(myObj));
	setClass("lookupdate",LookupDateText(myObj));
	setClass("healthtxt",HealthText(myObj));
	setClass("faceamount",FaceAmountText(myObj));

}
function BuildTableCategory(CatItem) {
var txt = '';
//$comparisonrepeat$	

//$nonsmoketable$	
		
 txt +='<div class="container container-rates" style="min-height: 1.0em; margin-bottom: 0px;">\
        <div class="subgrid subgrid-results-title">\
          <div class="row subgrid-row-25">\
            <div class="coffee-span-12 coffee-839-span-6 coffee-545-span-12 subgrid-column-47">\
              <span class="text-element text-results-category"><span class="text-category">';
	txt += CatItem.Compulife_title;
	txt += '</span>\
              </span>\
            </div>\
            <div class="coffee-span-12 coffee-839-span-6 coffee-545-span-12 subgrid-column-50">\
              <span class="text-element text-results-ambest">\
		<span class="text-text-44">\
			<span class="text-quote-result-label">\
			<span class="text-text-48">A.M. Best&nbsp;Ratings as of:</span>\
			 &nbsp;<span class="text-quote-result-value-white">';
		txt += myObj.AccessDate.ambestdate; 
		txt += '</span></span>\
               </span>\
              </span>\
            </div>\
          </div>\
        </div>';
	return txt;
}
function BuildTableRowResults(item)
{
//$prodline=12$
	if ((item.HealthAnalysisResult=='no')  
		&& $('#NoRedX').val()=='ON'
) 
		return '';
 var txt = 	'<div class="subgrid subgrid-5">\
          <div class="row">\
            <div class="coffee-span-12 subgrid-column-51">\
              <span class="text-element text-company-name" name="company">';
	txt += item.Compulife_company;
		txt += '</span>\
              <a href="javascript:window.open(\'http://www3.ambest.com/consumers/CompanyProfile.aspx?BL=36&ambnum=%20';
	txt += item.Compulife_ambnumber;
	txt += '&PPP=\'" onclick="window.location.href=\'http://www3.ambest.com/consumers/CompanyProfile.aspx?BL=36&ambnum=%20';
	txt += item.Compulife_ambnumber;
	txt += '&PPP=\'"><span class="text-element text-results-right-AMB"><span class="text-amb-value">';
	txt += item.Compulife_amb;
	txt += '</span></a>\
              </span>\
              <a href="javascript:window.open(\'http://www3.ambest.com/consumers/CompanyProfile.aspx?BL=36&ambnum=%20';
	txt += item.Compulife_ambnumber;
	txt += '&PPP=\'" onclick="window.location.href=\'http://www3.ambest.com/consumers/CompanyProfile.aspx?BL=36&ambnum=%20';
	txt += item.Compulife_ambnumber;
	txt += '&PPP=\'"><span class="text-element text-amb">A.M. Best Rating: &nbsp;<span class="text-amb-value">';
	txt += item.Compulife_amb;
	txt += '</span></a><br>\
              </span>\
            </div>\
          </div>\
          <div class="row subgrid-row-30">\
            <div class="coffee-span-12 subgrid-column-health" style="background-color: #';
	if (item.HealthAnalysisResult=='go') txt += 'CCFFCC';
	if (item.HealthAnalysisResult=='dk') txt += 'FFFFBB';
	if (item.HealthAnalysisResult=='no') txt += 'FFDDDD';

	txt += ';">\
              <div class="responsive-picture health-icon-result">\
                <picture>\
				<img onclick="overhealth(\'info';
	txt += item.Compulife_compprodcode;
	txt += '\',\'';
	txt += item.HealthRejReason;
	txt += '\')" alt="Placeholder Picture" src="../images/';
	txt += item.HealthAnalysisResult
	txt += '.png">\
                </picture>\
              </div>\
              <span class="text-element text-results-right-pp" style="background-color: #';
	if (item.HealthAnalysisResult=='go') txt += 'CCFFCC';
	if (item.HealthAnalysisResult=='dk') txt += 'FFFFBB';
	if (item.HealthAnalysisResult=='no') txt += 'FFDDDD';
	txt += ';"><span class="text-health-value">P+</span>\
              </span>\
              <span class="text-element text-result-list-right-health">';
	txt += item.Compulife_healthcat;
	txt += '&nbsp;&nbsp;<span class="text-health-value">';
	txt += item.Compulife_rgpfpp;
	txt += '</span>\
              </span>\
              <span class="text-element text-result-list">';
	txt += item.Compulife_product;
	txt += '<br>\
              </span>\
              <span class="text-element text-health-reason" id="info';
	txt += item.Compulife_compprodcode;
	txt += '"></span>\
            </div>\
          </div>\
		    <div class="row subgrid-row-26">\
            <div class="coffee-span-12 coffee-545-span-12 coffee-839-span-7 subgrid-column-49"><span class="text-element text-premium"><span class="text-text-mode-label"><span class="text-prem">$';
	txt += item.Compulife_premiumAnnual;
	txt += '</span><span class="text-text-mode"><span class="text-text-52">&nbsp;<span class="text-text-47">/yr</span></span>&nbsp; &nbsp; <span class="text-text-39">or</span> &nbsp; &nbsp;</span>\
              </span>\
              </span><span class="text-element text-premium"><span class="text-text-mode-label"><span class="text-prem">';
	txt += item.Compulife_premiumM;
	txt += '</span><span class="text-text-mode"><span class="text-text-57">&nbsp;<span class="text-text-51">/mo</span></span>\
              </span>\
              </span>\
              </span>\
            </div>\
            <div class="coffee-span-6 coffee-839-span-5 subgrid-column-48">\
<form name="';
	txt += item.Compulife_compprodcode;
	txt += '" id="';
	txt += item.Compulife_compprodcode;
	txt += '" action ="../actionbutton.php" method="POST">\
\
<input type="hidden" name="ZipCode" value="';
	txt += myObj.Lookup.ZipCode;
	txt += '">\
<input type="hidden" name="State" value="';
	txt += myObj.Lookup.state_fromzipcode;
	txt += '"> 			\
	  		  \
		  <button type="submit" onclick="PostMoreInfo(\'';
	txt += item.Compulife_compprodcode;
	txt += '\',\'';
	txt += item.Compulife_company;
	txt += '\',\'';
	txt += item.Compulife_product;
	txt += '\',\'';
	txt += myObj.Lookup.Mode;
	txt += '\',\'';
	txt += BuildTableItem.Compulife_title;
	txt += '\',\'';
	txt += item.Compulife_premiumAnnual;
	txt += '\',\'';
	txt += item.Compulife_premiumM;
	txt += '\',\'';
	txt += item.Compulife_healthcat;
	txt += '\',\'';
	txt += item.HealthAnalysisResult;
	txt += '\')" name="More Info" value="More Info" class="button-select"></button>\
     		  \
            </div>\
          </div>		  \
		  \
		  \
		  \
          <div class="row subgrid-row-27">\
            <div class="coffee-span-12 subgrid-column-46">\
			\
		  <button type="submit" onclick="PostMoreInfo(\'';
	txt += item.Compulife_compprodcode;
	txt += '\',\'';
	txt += item.Compulife_company;
	txt += '\',\'';
	txt += item.Compulife_product;
	txt += '\',\'';
	txt += myObj.Lookup.Mode;
	txt += '\',\'';
	txt += BuildTableItem.Compulife_title;
	txt += '\',\'';
	txt += item.Compulife_premiumAnnual;
	txt += '\',\'';
	txt += item.Compulife_premiumM;
	txt += '\',\'';
	txt += item.Compulife_healthcat;
	txt += '\',\'';
	txt += item.HealthAnalysisResult;
	txt += '\')" name="More Info" value="More Info" class="button-select"></button>\
</form> \
\
            </div>\
          </div>\
        </div>\
\
\
		\
';
	//txt += '$/prodline$';
	txt += '\
\
\
	  \
    </div>';

//$/nonsmoketable$	

//$/comparisonrepeat$
	
	addClass('comparisonRepeat',txt);		
}

function BuildTableCallback(ResponseID_,RequestType_,response) {
				myObj = JSON.parse(response);
				Compulife = myObj;
				RequestType = RequestType_;
				ResponseID = ResponseID_;
				ReDisplay();
}
function ReDisplay() {
				x = myObj.Compulife_ComparisonResults;
	setClass('comparisonRepeat','');		
				if (typeof x!=='undefined') {
					txt = "";
					if (RequestType=='R') {
						// regular comparison results
						if (x instanceof Array) {
							x.forEach(BuildComparison);
						}

						else
							BuildComparison(x);
					}
					else
						// sidebyside comparison results
						BuildSideBySideTable(x);
				}
				else txt = 'Error occurred, check log files';
				$(ResponseID).html(txt);
	
}
var Last='?';
function getRequest() {
	var test = $('#landing :input').serialize();
	Last = 'R';
	$('input[name="requestType"]').val("request");
	getPrivateResults('#landing :input','#results','R',BuildTableCallback);
}
function getSideBySide() {
	Last = 'S';
	$('input[name="requestType"]').val("sidebyside");
	getPrivateResults('#landing :input','#results','S',BuildTableCallback);
}
function updateResults() {
	if ($('input[name="requestType"]').val()=="sidebyside")
		getSideBySide();
	else getPrivateRequest();
}	
</script>
<script type="text/javascript">

  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', 'UA-34349636-1']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();

</script>

<script language="JavaScript" type="text/javascript">

function overhealth(id,gonodk)
{
var text = '<ul class="unorder-list health-reason">';
var index;
gonodk = gonodk.split("<br>");
	for(index=0;index<gonodk.length;index++)
		text += '<li class="list-item-health">' + gonodk[index] + '<//li>';
	text += '<//ul>';
	document.getElementById(id).innerHTML =text;
}
function getdetailed (id,selectedtype)
{
  addHInput(id,'DetailedProduct',selectedtype);
  addHInput(id,'DetailedAnalysisJava',selectedtype);
  addHInput(id,'DETAILEDFILE','DETAILED_R.HTM');
  var aform = document.getElementById(id);
  aform.submit();
}


/* function getdetailed (prodcode, healthpref, gonodk, company, product, healthclass)
{		
  document.comparisonform.ProductCode.value = prodcode;
  document.comparisonform.HealthPref.value = healthpref;  
  document.comparisonform.GoNoDk.value = gonodk;
  document.comparisonform.CompanyName.value = company;
  document.comparisonform.ProductName.value = product;
  document.comparisonform.HealthClass.value = healthclass;
  document.comparisonform.AmBest.value = 'false';
  document.comparisonform.OnClick=abc=window.open('','reason','width=700,height=300,left=20,top=20,scrollbars=yes');
  document.comparisonform.target='reason';
  abc.focus();
  document.comparisonform.submit();
} */

function getbest (ambest, company, compcode)
{
  document.comparisonform.AmBest.value = ambest;
  document.comparisonform.CompanyName.value = company;
  document.comparisonform.CompanyCode.value = compcode;
  document.comparisonform.OnClick=abc=window.open('','reason','width=700,height=500,left=20,top=20,scrollbars=yes');
  document.comparisonform.target='reason';
  abc.focus();
  document.comparisonform.submit();
}


function addHInput(aform,name,value)
{
if (value=="") return;
var field = document.createElement("input");
	field.setAttribute("type","hidden");
	field.setAttribute("value",value);
	field.setAttribute("name",name);
	aform.appendChild(field);
}

function addBasicInputFields(aform)
{
/*	addHInput(aform,"ZipCode",Compulife.Lookup.ZipCode);
	addHInput(aform,"State",Compulife.Lookup.state_fromzipcode);
	//addHInput(aform,"DoingHealth","ON");
	addHInput(aform,"Birthday",myObj.Lookup.Birthdate.day);
	addHInput(aform,"BirthMonth",myObj.Lookup.Birthdate.month);
	addHInput(aform,"BirthYear",myObj.Lookup.Birthdate.year);
	addHInput(aform,"Health",myObj.Lookup.health);
	addHInput(aform,"FaceAmount",myObj.Lookup.faceamount);
	//addHInput(aform,"css","$css$");

addHInput(aform,"Sex",myObj.Lookup.sex);
addHInput(aform,"Smoker",myObj.Lookup.smoker);
addHInput(aform,"NewCategory",myObj.Lookup.NewCategory);*/
var x = $('#landing :input');
for(var i=0;i<x.length;i++) {
	addHInput(aform,x[i].name,x[i].value);
}
/*addHInput(aform,"DoSmokingTobacco","$origdosmokingtobacco$");
addHInput(aform,"DoCigarettes","$origdocigarettes$");
addHInput(aform,"DoCigars","$origdocigars$");
addHInput(aform,"DoPipe","$origdopipe$");
addHInput(aform,"DoChewingTobacco","$origdochewingtobacco$");
addHInput(aform,"DoNicotinePatchesOrGum","$origdonicotinepatchesorgum$");
addHInput(aform,"NumCigarettes","$orignumcigarettes$");
addHInput(aform,"PeriodCigarettes","$origperiodcigarettes$");
addHInput(aform,"NumCigars","$orignumcigars$");
addHInput(aform,"PeriodCigars","$origperiodcigars$");
addHInput(aform,"PeriodPipe","$origperiodpipe$");
addHInput(aform,"PeriodChewingTobacco","$origperiodchewingtobacco$");
addHInput(aform,"PeriodNicotinePatchesOrGum","$origperiodnicotinepatchesorgum$");
addHInput(aform,"DoHeightWeight","$origdoheightweight$");
addHInput(aform,"Weight","$origweight$");
addHInput(aform,"Feet","$origfeet$");
addHInput(aform,"Inches","$originches$");
addHInput(aform,"DoBloodPressure","$origdobloodpressure$");
addHInput(aform,"Systolic","$origsystolic$");
addHInput(aform,"Dystolic","$origdystolic$");
addHInput(aform,"BloodPressureMedication","$origbloodpressuremedication$");
addHInput(aform,"PeriodBloodPressure","$origperiodbloodpressure$");
addHInput(aform,"PeriodBloodPressureControlDuration","$origperiodbloodpressurecontrolduration$");
addHInput(aform,"DoCholesterol","$origdocholesterol$");
addHInput(aform,"CholesterolLevel","$origcholesterollevel$");
addHInput(aform,"HDLRatio","$orighdlratio$");
addHInput(aform,"CholesterolMedication","$origcholesterolmedication$");
addHInput(aform,"PeriodCholesterol","$origperiodcholesterol$");
addHInput(aform,"PeriodCholesterolControlDuration","$origperiodcholesterolcontrolduration$");
addHInput(aform,"DoDriving","$origdodriving$");
addHInput(aform,"HadDriversLicense","$orighaddriverslicense$");
addHInput(aform,"MovingViolations0","$origmovingviolations0$");
addHInput(aform,"MovingViolations1","$origmovingviolations1$");
addHInput(aform,"MovingViolations2","$origmovingviolations2$");
addHInput(aform,"MovingViolations3","$origmovingviolations3$");
addHInput(aform,"MovingViolations4","$origmovingviolations4$");
addHInput(aform,"RecklessConviction","$origrecklessconviction$");
addHInput(aform,"PeriodRecklessConviction","$origperiodrecklessconviction$");
addHInput(aform,"DwiConviction","$origdwiconviction$");
addHInput(aform,"PeriodDwiConviction","$origperioddwiconviction$");
addHInput(aform,"SuspendedConviction","$origsuspendedconviction$");
addHInput(aform,"PeriodSuspendedConviction","$origperiodsuspendedconviction$");
addHInput(aform,"MoreThanOneAccident","$origmorethanoneaccident$");
addHInput(aform,"PeriodMoreThanOneAccident","$origperiodmorethanoneaccident$");
addHInput(aform,"DoFamily","$origdofamily$");
addHInput(aform,"NumDeaths","$orignumdeaths$");
addHInput(aform,"NumContracted","$orignumcontracted$");
addHInput(aform,"AgeDied00","$origagedied00$");
addHInput(aform,"AgeDied01","$origagedied01$");
addHInput(aform,"AgeDied02","$origagedied02$");
addHInput(aform,"AgeContracted00","$origagecontracted00$");
addHInput(aform,"AgeContracted01","$origagecontracted01$");
addHInput(aform,"AgeContracted02","$origagecontracted02$");
addHInput(aform,"AgeContracted10","$origagecontracted10$");
addHInput(aform,"AgeContracted11","$origagecontracted11$");
addHInput(aform,"AgeContracted12","$origagecontracted12$");
addHInput(aform,"IsParent00","$origisparent00$");
addHInput(aform,"IsParent01","$origisparent01$");
addHInput(aform,"IsParent02","$origisparent02$");
addHInput(aform,"IsParent10","$origisparent10$");
addHInput(aform,"IsParent11","$origisparent11$");
addHInput(aform,"IsParent12","$origisparent12$");
addHInput(aform,"CVD00","$origcvd00$");
addHInput(aform,"CVD01","$origcvd01$");
addHInput(aform,"CVD02","$origcvd02$");
addHInput(aform,"CVD10","$origcvd10$");
addHInput(aform,"CVD11","$origcvd11$");
addHInput(aform,"CVD12","$origcvd12$");
addHInput(aform,"CAD00","$origcad00$");
addHInput(aform,"CAD01","$origcad01$");
addHInput(aform,"CAD02","$origcad02$");
addHInput(aform,"CAD10","$origcad10$");
addHInput(aform,"CAD11","$origcad11$");
addHInput(aform,"CAD12","$origcad12$");
addHInput(aform,"CVI00","$origcvi00$");
addHInput(aform,"CVI01","$origcvi01$");
addHInput(aform,"CVI02","$origcvi02$");
addHInput(aform,"CVI10","$origcvi10$");
addHInput(aform,"CVI11","$origcvi11$");
addHInput(aform,"CVI12","$origcvi12$");
addHInput(aform,"CVA00","$origcva00$");
addHInput(aform,"CVA01","$origcva01$");
addHInput(aform,"CVA02","$origcva02$");
addHInput(aform,"CVA10","$origcva10$");
addHInput(aform,"CVA11","$origcva11$");
addHInput(aform,"CVA12","$origcva12$");
addHInput(aform,"Diabetes00","$origdiabetes00$");
addHInput(aform,"Diabetes01","$origdiabetes01$");
addHInput(aform,"Diabetes02","$origdiabetes02$");
addHInput(aform,"Diabetes10","$origdiabetes10$");
addHInput(aform,"Diabetes11","$origdiabetes11$");
addHInput(aform,"Diabetes12","$origdiabetes12$");
addHInput(aform,"KidneyDisease00","$origkidneydisease00$");
addHInput(aform,"KidneyDisease01","$origkidneydisease01$");
addHInput(aform,"KidneyDisease02","$origkidneydisease02$");
addHInput(aform,"KidneyDisease10","$origkidneydisease10$");
addHInput(aform,"KidneyDisease11","$origkidneydisease11$");
addHInput(aform,"KidneyDisease12","$origkidneydisease12$");
addHInput(aform,"ColonCancer00","$origcoloncancer00$");
addHInput(aform,"ColonCancer01","$origcoloncancer01$");
addHInput(aform,"ColonCancer02","$origcoloncancer02$");
addHInput(aform,"ColonCancer10","$origcoloncancer10$");
addHInput(aform,"ColonCancer11","$origcoloncancer11$");
addHInput(aform,"ColonCancer12","$origcoloncancer12$");
addHInput(aform,"IntestinalCancer00","$origintestinalcancer00$");
addHInput(aform,"IntestinalCancer01","$origintestinalcancer01$");
addHInput(aform,"IntestinalCancer02","$origintestinalcancer02$");
addHInput(aform,"IntestinalCancer10","$origintestinalcancer10$");
addHInput(aform,"IntestinalCancer11","$origintestinalcancer11$");
addHInput(aform,"IntestinalCancer12","$origintestinalcancer12$");
addHInput(aform,"BreastCancer00","$origbreastcancer00$");
addHInput(aform,"BreastCancer01","$origbreastcancer01$");
addHInput(aform,"BreastCancer02","$origbreastcancer02$");
addHInput(aform,"BreastCancer10","$origbreastcancer10$");
addHInput(aform,"BreastCancer11","$origbreastcancer11$");
addHInput(aform,"BreastCancer12","$origbreastcancer12$");
addHInput(aform,"ProstateCancer00","$origprostatecancer00$");
addHInput(aform,"ProstateCancer01","$origprostatecancer01$");
addHInput(aform,"ProstateCancer02","$origprostatecancer02$");
addHInput(aform,"ProstateCancer10","$origprostatecancer10$");
addHInput(aform,"ProstateCancer11","$origprostatecancer11$");
addHInput(aform,"ProstateCancer12","$origprostatecancer12$");
addHInput(aform,"OvarianCancer00","$origovariancancer00$");
addHInput(aform,"OvarianCancer01","$origovariancancer01$");
addHInput(aform,"OvarianCancer02","$origovariancancer02$");
addHInput(aform,"OvarianCancer10","$origovariancancer10$");
addHInput(aform,"OvarianCancer11","$origovariancancer11$");
addHInput(aform,"OvarianCancer12","$origovariancancer12$");
addHInput(aform,"OtherInternalCancer00","$origotherinternalcancer00$");
addHInput(aform,"OtherInternalCancer01","$origotherinternalcancer01$");
addHInput(aform,"OtherInternalCancer02","$origotherinternalcancer02$");
addHInput(aform,"OtherInternalCancer10","$origotherinternalcancer10$");
addHInput(aform,"OtherInternalCancer11","$origotherinternalcancer11$");
addHInput(aform,"OtherInternalCancer12","$origotherinternalcancer12$");
addHInput(aform,"MalignantMelanoma00","$origmalignantmelanoma00$");
addHInput(aform,"MalignantMelanoma01","$origmalignantmelanoma01$");
addHInput(aform,"MalignantMelanoma02","$origmalignantmelanoma02$");
addHInput(aform,"MalignantMelanoma10","$origmalignantmelanoma10$");
addHInput(aform,"MalignantMelanoma11","$origmalignantmelanoma11$");
addHInput(aform,"MalignantMelanoma12","$origmalignantmelanoma12$");
addHInput(aform,"BasalCellCarcinoma00","$origbasalcellcarcinoma00$");
addHInput(aform,"BasalCellCarcinoma01","$origbasalcellcarcinoma01$");
addHInput(aform,"BasalCellCarcinoma02","$origbasalcellcarcinoma02$");
addHInput(aform,"BasalCellCarcinoma10","$origbasalcellcarcinoma10$");
addHInput(aform,"BasalCellCarcinoma11","$origbasalcellcarcinoma11$");
addHInput(aform,"BasalCellCarcinoma12","$origbasalcellcarcinoma12$");
addHInput(aform,"DoSubAbuse","$origdosubabuse$");
addHInput(aform,"Alcohol","$origalcohol$");
addHInput(aform,"AlcYearsSinceTreatment","$origalcyearssincetreatment$");
addHInput(aform,"Drugs","$origdrugs$");
addHInput(aform,"DrugsYearsSinceTreatment","$origdrugsyearssincetreatment$");
addHInput(aform,"GoString","$origgostring$");
addHInput(aform,"NoGoString","$orignogostring$");
addHInput(aform,"DoNotKnowString","$origdonotknowstring$");
addHInput(aform,"GoColor","$origgocolor$");
addHInput(aform,"NoGoColor","$orignogocolor$");
addHInput(aform,"DoNotKnowColor","$origdonotknowcolor$");
addHInput(aform,"DoNotKnowMessage","$origdonotknowmessage$");*/
}


function addBasicInputFieldsToForm(id)
{
	var form= document.getElementById(id)
	addBasicInputFields(form);
}


function ProdLineSubmit(id,Company, Product,ModeUsed,Cat,PremiumAnnual,Premium,HealthCat,MoreInfo)
{
var aform = document.getElementById(id);
	if (MoreInfo==1)
		addHInput(aform,"MoreInfo","1");
addHInput(aform,"Company",Company);
addHInput(aform,"Product",Product);
addHInput(aform,"ModeUsed",ModeUsed);
addHInput(aform,"Category",Cat);
addHInput(aform,"PremiumAnnual",PremiumAnnual);
addHInput(aform,"PremiumMode",Premium);
addHInput(aform,"HealthCat",HealthCat);
addBasicInputFields(aform);
aform.submit();
return true;
}

function PostFindAgent(id,moreinfo)
{
	var form= document.getElementById(id)
	//document.createElement("form");
	form.setAttribute("method","post");
	form.setAttribute("action","../actionbutton.php");
	addBasicInputFields(form);
document.body.appendChild(form);
	form.submit();
}

function PostMoreInfo(id,company,product,modeused,cat,annual,monthly,healthcat,gonodk)
{
	var form= document.getElementById(id)
	//document.createElement("form");
	form.setAttribute("method","post");
	form.setAttribute("action","../actionbutton.php");

	addHInput(form,"MoreInfo","1");
	addHInput(form,"company",company);
	addHInput(form,"product",product);
	addHInput(form,"modeused",modeused);
	addHInput(form,"category",cat);
	addHInput(form,"annual",annual);
	addHInput(form,"monthly",monthly);
	addHInput(form,"healthcat",healthcat);
	if (gonodk=='go')
		addHInput(form,"HealthQualifies","Yes");
	if (gonodk=='no')
		addHInput(form,"HealthQualifies","No");
	if (gonodk=='dn')
		addHInput(form,"HealthQualifies","Unknown");
	
	addBasicInputFields(form);
document.body.appendChild(form);
	form.submit();

}

function updateforms()
{
//	addBasicInputFieldsToForm('relookupform');
	addBasicInputFieldsToForm('comparisonform');
	getRequest();
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

<body onLoad="updateforms()" class="grid-2">
<!-- header start -->



 
<!-- header end -->




  <div class="row row-health-key">
    <div class="coffee-span-12 column-health-key"><div class="container container-health-key"><div class="subgrid subgrid-1"><div class="row"><div class="coffee-span-12 subgrid-column-health-icon coffee-545-span-12"><span class="text-element text-health-icons-header">Guide to Health Analyzer Icons<br></span></div></div><div class="row"><div class="coffee-span-12 subgrid-column-health-icon coffee-545-span-12"><span class="text-element text-health-sub"><span class="text-text-14">Click the icon which follows the premium for more information</span><br></span></div></div>
	<div class="row"><div class="coffee-span-12 subgrid-column-health-icon coffee-545-span-12">
	<div class="container container-health-icon"><div class="responsive-picture health-icon"><picture><img alt="Placeholder Picture" src="../../images/go.png" name="origgostring"></picture></div><span class="text-element text-health-yes"><span class="text-text-14">Based upon what you told the Health Analyzer, this <span class="text-text-13"><span class="text-text-16">premium is available</span> &nbsp;</span></span><br></span></div>
	<div class="container container-health-icon"><div class="responsive-picture health-icon"><picture><img alt="Placeholder Picture" src="../../images/dk.png" name="origdonotknowstring"></picture></div><span class="text-element text-health-no"><span class="text-text-14">Not have enough information from the company to make a determination<span class="text-text-13"> &nbsp;</span></span><br></span></div>
	<div class="container container-health-icon"><div class="responsive-picture health-icon"><picture><img alt="Placeholder Picture" src="../../images/no.png" name="orignogostring"></picture></div><span class="text-element text-health-dk"><span class="text-text-14">Based upon what you told the Health Analyzer, this <span class="text-text-15">premium is not available</span><span class="text-text-13"> &nbsp;</span></span><br></span></div></div></div></div></div>
    </div>
  </div>
  

	  
  
  <div class="row row-health-recalc"><a name="recalc" id="recalc"></a>
  
  
  
    <div class="coffee-span-12 column-7">
	


	<div class="container container-health-recalc">
	
<!--<form name="relookupform" id="relookupform" action="/cgi-bin/cqsl_Copyright_Compulife_2019.cgi" method="POST">	-->
	
<?php
echo '<div id="landing">
<input type="hidden" name="requestType" value="results">
';
foreach($_REQUEST as $n => $v) {
	echo '
<input type="hidden" name="' . $n .'" value="'.$v.'">';
}
echo '
</div>
';
?>
	<div class="subgrid subgrid-1">
	

	
	<div class="row subgrid-row-health-recalc"><div class="coffee-span-12 subgrid-column-health-recalc coffee-545-span-6">
	
	
	
	<span class="text-element text-results-title-health">Filter:</span>
	


<select class="select drop-down-results-health" onchange="ReDisplay()" id ="NoRedX" name="NoRedX">
<option  name="selectednoredxoff"value="OFF">include unqualified products</option>
<option  selected  name="selectednoredxon"value="ON">remove unqualified products</option>
</select>
	
	</div><div class="coffee-span-12 coffee-545-span-6 subgrid-column-health-recalc"><span class="text-element text-results-title-health">Sort:</span>
	
<select class="select drop-down-results-health" onchange="ReDisplay()" id="SortByHealth" name="SortByHealth">
<option   name="selectedsortbyhealthoff"value="A">by premium</option>
<option   name="selectedsortbyhealthoff"value="M">by monthly premium</option>
<option   name="selectedsortbyhealthon"value="H">by health</option>
</select>
	
	</div>

<input type="hidden" name="ModeUsed" value="$modeused$" name="modeused">
<input type="hidden" name="GoMessage" value="Based upon what you told the Health Analyzer, this premium is available">
<input type="hidden" name="DoNotKnowMessage" value="The Health Analyzer does not have enough information from the company to make a determination">
<input type="hidden" name="COMPANYFILE" value="$companyfile$" name="companyfile">
<input type="hidden" name="DETAILEDFILE" value="$detailedfile$" name="detailedfile">
<input type="hidden" name="AmBest" value="false">
<input type="hidden" name="MaxNumResults" value="$maxnumresults$" name="maxnumresults">

	</div>	
	</div>
	</div>		
    </div> 
	
<!-- </form>	-->
 	
  </div>



 
 
 <form name="comparisonform" id="comparisonform" action="/cgi-bin/cqsl_Copyright_Compulife_2019.cgi" method="POST">

 <input type="hidden" name="DetailedAnalysisJava" value="Detailed Analysis">
<input type="hidden" name="DetailedProduct">

<script type="text/javascript">
addBasicInputFieldsToForm('comparisonform');
</script>
<!-- The next 7 variables are passed through.  Their values will be defined later -->
<!-- on when the javascript function is called -->
<input type="hidden" name="HealthReason" value="Health Reason">
<input type="hidden" name="ProductCode">
<input type="hidden" name="HealthPref">
<input type="hidden" name="GoNoDk">
<input type="hidden" name="CompanyName">
<input type="hidden" name="CompanyCode">
<input type="hidden" name="ProductName">
<input type="hidden" name="HealthClass">
<input type="hidden" name="AmBest">
<input type="hidden" name="RejectReasonBr" value="on">
</form>

  
  <div class="row">
	<div class="coffee-span-12">
	
<span class="comparisonRepeat">Loading your results...</span>


</div>
</div>



	
	
    <div style="font-family: Arial; font-weight: bold; font-style: normal; text-decoration: none; font-size: 11pt; text-align:center; margin-top:0px">Powered by <a class="nocolor" href="http://www.compulife.com" target="_blank">COMPULIFE</a><sup>&reg;</sup></b><br><br></div>
	  
	  
	  
    </div>
  </div>
    <script src="/compulife-api-samples/js/jquery-1.11.0.min.js"></script>

</body>

</html>
