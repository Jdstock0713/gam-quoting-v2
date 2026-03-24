<?php
?><!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Life Insurance Quotes - Compulife Software, Inc.</title>

  <link rel="stylesheet" href="/compulife-api-samples/css/coffeegrinder.min.css">
  <link rel="stylesheet" href="/compulife-api-samples/css/wireframe-theme.min.css">

  <script>document.createElement( "picture" );</script>
  <script src="/compulife-api-samples/js/picturefill.min.js" class="picturefill" async="async"></script>
  <link rel="stylesheet" href="/compulife-api-samples/css/main.css">
  
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
  <script src="compulifeapi/createtable.js" async="async"></script>
  <script src="compulifeapi/compulifeapi.js" async="async"></script>
  <script>
function BuildTableCallback(ResponseID,RequestType,response) {
				myObj = JSON.parse(response);
				x = myObj.Compulife_ComparisonResults;
				if (typeof x!=='undefined') {
					txt = "";
					if (RequestType=='R') {
						// regular comparison results
						if (x instanceof Array) {
							x.forEach(BuildTable);
						}

						else
							BuildTable(x);
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
	else getRequest();
}	
</script>
<style>
a:link { color: #0148CB }
a:visited { color: #0148CB }
a:hover {text-decoration: none; color: #0148CB }
a:active { color: #0148CB }
a:link.nocolor {text-decoration: none; border-bottom:2px solid #D50000; color: #000000 }
a:visited.nocolor {text-decoration: none; border-bottom:2px solid #D50000; color: #000000 }
a:hover.nocolor {text-decoration: none; border-bottom:2px solid #D50000; color: #000000 }
a:active.nocolor {text-decoration: none; border-bottom:2px solid #D50000; color: #000000 }

button.button-submit-1 {
  display: block;
  margin-right: 0;
  margin-left: 0;
  padding: .5em 1.05em;
  max-width: 30em;
  width: 50%;
  background-color: #287cc1;
  background-image: none;
  font-weight: 700;
  font-size: 1.05em;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

button[type=submit].button-submit-1 {
  width: 50%;
}
 
</style>   
  
</head>
<body class="grid-1">
  <div class="row">
    <div class="coffee-span-12 column-5"></div>
  </div>
  <div class="row row-5">
    <div class="coffee-span-12 column-6"></div>
  </div>
  <div class="row row-top-spacer">
    <div class="coffee-span-12 column-top-spacer"></div>
  </div>
  <div class="row row-4">
    <div class="coffee-span-12 column-4">
      <h2 class="heading-2">
        <font size="3"><span class="heading-text-7">Instant Life Insurance Quote</span>
        </font>
      </h2>
    </div>
  </div>
  <div class="row row-2">
    <div class="coffee-span-12 column-1"></div>
  </div>
  <div class="row row-1">
    <div class="coffee-span-12 column-2">
	<form action="health.php" method="POST">
<div id="companies">
</div>
	    <div id="landing">
<?php 
$logos = file_get_contents("https://www.compulifeapi.com/api/CompanyLogoList/small");
echo '<script> var logos = '. $logos . '; </script>';
?>
  <p id="logos"></p> 
<input type="hidden" name="requestType" value="results">      
      
	  <span class="text-element text-1">State<br></span>
	  <select class="select drop-down-1" name="State">
<option value="1">Alabama</option>
<option value="2">Alaska</option>
<option value="3">Arizona</option>
<option value="4">Arkansas</option>
<option selected value="5">California</option>
<option value="6">Colorado</option>
<option value="7">Connecticut</option>
<option value="8">Delaware</option>
<option value="9">Dist.Columbia</option>
<option value="10">Florida</option>
<option value="11">Georgia</option>
<option value="12">Hawaii</option>
<option value="13">Idaho</option>
<option value="14">Illinois</option>
<option value="15">Indiana</option>
<option value="16">Iowa</option>
<option value="17">Kansas</option>
<option value="18">Kentucky</option>
<option value="19">Louisiana</option>
<option value="20">Maine</option>
<option value="21">Maryland</option>
<option value="22">Massachusetts</option>
<option value="23">Michigan</option>
<option value="24">Minnesota</option>
<option value="25">Mississippi</option>
<option value="26">Missouri</option>
<option value="27">Montana</option>
<option value="28">Nebraska</option>
<option value="29">Nevada</option>
<option value="30">New Hampshire</option>
<option value="31">New Jersey</option>
<option value="32">New Mexico</option>
<option value="52">NY Non-Bus</option>
<option value="33">NY Business</option>
<option value="34">North Carolina</option>
<option value="35">North Dakota</option>
<option value="36">Ohio</option>
<option value="37">Oklahoma</option>
<option value="38">Oregon</option>
<option value="39">Pennsylvania</option>
<option value="40">Rhode Island</option>
<option value="41">South Carolina</option>
<option value="42">South Dakota</option>
<option value="43">Tennessee</option>
<option value="44">Texas</option>
<option value="45">Utah</option>
<option value="46">Vermont</option>
<option value="47">Virginia</option>
<option value="48">Washington</option>
<option value="49">West Virginia</option>
<option value="50">Wisconsin</option>
<option value="51">Wyoming</option>
<option value="53">Guam</option>
<option value="54">Puerto Rico</option>
<option value="55">Virgin Islands</option>
<option value="56">Amer. Samoa</option>
</select>
      <span class="text-element text-1">Birthdate</span>
	  <select class="select drop-down-2" name="BirthMonth">
<option value="1">January</option>
<option value="2">February</option>
<option value="3">March</option>
<option value="4">April</option>
<option value="5">May</option>
<option selected value="6">June</option>
<option value="7">July</option>
<option value="8">August</option>
<option value="9">September</option>
<option value="10">October</option>
<option value="11">November</option>
<option value="12">December</option></select>	  
	  
	  <select class="select drop-down-2" name="Birthday">
<option>1</option>
<option>2</option>
<option>3</option>
<option>4</option>
<option>5</option>
<option>6</option>
<option>7</option>
<option>8</option>
<option>9</option>
<option>10</option>
<option>11</option>
<option>12</option>
<option>13</option>
<option>14</option>
<option selected>15</option>
<option>16</option>
<option>17</option>
<option>18</option>
<option>19</option>
<option>20</option>
<option>21</option>
<option>22</option>
<option>23</option>
<option>24</option>
<option>25</option>
<option>26</option>
<option>27</option>
<option>28</option>
<option>29</option>
<option>30</option>
<option>31</option></select>	  
	  
	  <select class="select drop-down-2" name="BirthYear">
<option>1916</option>
<option>1917</option>
<option>1918</option>
<option>1919</option>
<option>1920</option>
<option>1921</option>
<option>1922</option>
<option>1923</option>
<option>1924</option>
<option>1925</option>
<option>1926</option>
<option>1927</option>
<option>1928</option>
<option>1929</option>
<option>1930</option>
<option>1931</option>
<option>1932</option>
<option>1933</option>
<option>1934</option>
<option>1935</option>
<option>1936</option>
<option>1937</option>
<option>1938</option>
<option>1939</option>
<option>1940</option>
<option>1941</option>
<option>1942</option>
<option>1943</option>
<option>1944</option>
<option>1945</option>
<option>1946</option>
<option>1947</option>
<option>1948</option>
<option>1949</option>
<option>1950</option>
<option>1951</option>
<option>1952</option>
<option>1953</option>
<option>1954</option>
<option>1955</option>
<option>1956</option>
<option>1957</option>
<option>1958</option>
<option>1959</option>
<option>1960</option>
<option>1961</option>
<option>1962</option>
<option>1963</option>
<option>1964</option>
<option>1965</option>
<option>1966</option>
<option>1967</option>
<option>1968</option>
<option>1969</option>
<option>1970</option>
<option>1971</option>
<option>1972</option>
<option>1973</option>
<option>1974</option>
<option selected>1975</option>
<option>1976</option>
<option>1977</option>
<option>1978</option>
<option>1979</option>
<option>1980</option>
<option>1981</option>
<option>1982</option>
<option>1983</option>
<option>1984</option>
<option>1985</option>
<option>1986</option>
<option>1987</option>
<option>1988</option>
<option>1989</option>
<option>1990</option>
<option>1991</option>
<option>1992</option>
<option>1993</option>
<option>1994</option>
<option>1995</option>
<option>1996</option>
<option>1997</option>
<option>1998</option>
<option>1999</option>
<option>2000</option>
<option>2001</option>
<option>2002</option>
<option>2003</option>
<option>2004</option>
<option>2005</option>
<option>2006</option>
<option>2007</option>
<option>2008</option>
<option>2009</option>
<option>2010</option>
<option>2011</option>
<option>2012</option>
<option>2013</option>
<option>2014</option>
<option>2015</option>
<option>2016</option>
</select>  
      <span class="text-element text-1">Gender</span><label class="radio radio-button-1"><input type="radio" name="Sex" checked value="M"><span>Male</span></label><label class="radio radio-button-1-right"><input type="radio" name="Sex" value="F"><span>Female</span></label>
      <span class="text-element text-1">Smoker / Tobacco</span><label class="radio radio-button-1"><input type="radio" name="Smoker" checked value="N"><span>No</span></label><label class="radio radio-button-1-right"><input type="radio" name="Smoker" value="Y"><span>Yes</span></label>
      
     
	  <span class="text-element text-1">Health Class<br></span>
<select class="select drop-down-1" name="Health">
<option selected value="PP">Preferred Plus</option>
<option value="P">Preferred</option>
<option value="RP">Regular Plus</option>
<option value="R">Regular</option>
<option value="T1 copyright Compulife Software Inc">Table Rating 1 or A</option>
<option value="T2 copyright Compulife Software Inc">Table Rating 2 or B</option>
<option value="T3 copyright Compulife Software Inc">Table Rating 3 or C</option>
<option value="T4 copyright Compulife Software Inc">Table Rating 4 or D</option>
<option value="T5 copyright Compulife Software Inc">Table Rating 5 or E</option>
<option value="T6 copyright Compulife Software Inc">Table Rating 6 or F</option>
<option value="T7 copyright Compulife Software Inc">Table Rating 7 or G</option>
<option value="T8 copyright Compulife Software Inc">Table Rating 8 or H</option>
<option value="T9 copyright Compulife Software Inc">Table Rating 9 or I</option>
<option value="T10 copyright Compulife Software Inc">Table Rating 10 or J</option>
<option value="T11 copyright Compulife Software Inc">Table Rating 11 or K</option>
<option value="T12 copyright Compulife Software Inc">Table Rating 12 or L</option>
<option value="T13 copyright Compulife Software Inc">Table Rating 13 or M</option>
<option value="T14 copyright Compulife Software Inc">Table Rating 14 or N</option>
<option value="T15 copyright Compulife Software Inc">Table Rating 15 or O</option>
<option value="T16 copyright Compulife Software Inc">Table Rating 16 or P</option>
</select>
      <span class="text-element text-1">Type of Insurance<br></span>
<select class="select drop-down-1" onchange="updateResults()" name="NewCategory">
<option value="1">1 Year Level Term</option>
<option value="2">5 Year Level Term</option>
<option value="3">10 Year Level Term</option>
<option value="4">15 Year Level Term</option>
<option SELECTED value="5">20 Year Level Term</option>
<option value="6">25 Year Level Term</option>
<option value="7">30 Year Level Term</option>
<option value="9">35 Year Level Term</option>
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
<option value="Z:123456790TUVABCDEGH">All Level Term Products</option>
<option value="J">15 Year Return of Premium</option>
<option value="K">20 Year Return of Premium</option>
<option value="L">25 Year Return of Premium</option>
<option value="M">30 Year Return of Premium</option>
<option value="W">To age 65 Return of Premium</option>
<option value="Z:JKM">15, 20, 30 Year with ROP</option>
<option value="Z:JKLMW">All Return of Premium Products</option>
<option value="8">To Age 121 Level  (No Lapse U/L)</option>
<option value="P">To Age 121 Level - Pay to 100</option>
<option value="Q">To Age 121 Level - Pay to 65</option>
<option value="R">To Age 121 Level - 20 Pay</option>
<option value="S">To Age 121 Level - 10 Pay</option>
<option value="O">To Age 121 Level - Single Pay</option>
<option value="Z:8PQRSO">All To Age 121 Level Products</option>
<option value="X">GIWL - Graded Benefit Whole Life</option>
</select>
<span class="text-element text-1"><span class="text-text-1">Annual + Mode</span>
      </span>
<select class="select select drop-down-1" onchange="updateResults()" name="ModeUsed">
		<option selected value="M">Monthly</option>
		<option value="Q">Quarterly</option>
		<option value="H">Semi-Annual</option>
		<option value="ALL">All</option>
	</select>
<span class="text-element text-1"><span class="text-text-1">Amount of Insurance</span>
      </span>
	  <select class="select drop-down-1" onchange="updateResults()" name="FaceAmount">
<option value="10000">$10,000</option>
<option value="25000">$25,000</option>
<option value="50000">$50,000</option>
<option value="75000">$75,000</option>
<option value="100000">$100,000</option>
<option value="125000">$125,000</option>
<option value="150000">$150,000</option>
<option value="175000">$175,000</option>
<option value="200000">$200,000</option>
<option value="225000">$225,000</option>
<option value="250000">$250,000</option>
<option value="300000">$300,000</option>
<option value="350000">$350,000</option>
<option value="400000">$400,000</option>
<option value="450000">$450,000</option>
<option selected value="500000">$500,000</option>
<option value="550000">$550,000</option>
<option value="600000">$600,000</option>
<option value="650000">$650,000</option>
<option value="700000">$700,000</option>
<option value="750000">$750,000</option>
<option value="800000">$800,000</option>
<option value="900000">$900,000</option>
<option value="1000000">$1,000,000</option>
<option value="1100000">$1,100,000</option>
<option value="1250000">$1,250,000</option>
<option value="1500000">$1,500,000</option>
<option value="1750000">$1,750,000</option>
<option value="2000000">$2,000,000</option>
<option value="2500000">$2,500,000</option>
<option value="3000000">$3,000,000</option>
<option value="4000000">$4,000,000</option>
<option value="5000000">$5,000,000</option>
<option value="6000000">$6,000,000</option>
<option value="7000000">$7,000,000</option>
<option value="8000000">$8,000,000</option>
<option value="9000000">$9,000,000</option>
<option value="10000000">$10,000,000</option>
</select>

<!-- <input type="hidden" name="LANGUAGE" value="E"> -->
<!-- <input type="hidden" name="MaxNumResults" value="10"> -->
<!-- <input type="hidden" name="CompRating" value="4"> -->
<!-- <input type="hidden" name="COMPINC" value="BANN,FIDL"> -->
<!-- <input type="hidden" name="PRODDIS" value="5BONN,5FLHM"> -->

<input type="hidden" name="SortOverride1" value="A">

<div align="center"><button type="button" onclick="getRequest()" name="CqsComparison" class="button-submit-1">Compare Now</button></div>
<div align="center"><button type="button" onclick="getSideBySide()" name="SideBySide" class="button-submit-1">Side by Side</button></div>
<div align="center"><button type="submit" name="HealthAnalysis" class="button-submit-1">Health Analyzer</button></div>
    </div>
  </div>
  </form>
  
  </div>
  
  <br>
  <p id="results"></p> 
<div style="font-family: Arial; font-weight: bold; font-style: normal; text-decoration: none; font-size: 11pt; text-align:center; margin-top:0px">Powered by <a class="nocolor" href="http://www.compulife.com" target="_blank">COMPULIFE</a><sup>&reg;</sup></b>&nbsp;&nbsp;|&nbsp;&nbsp;<a style="color: #333333; font-weight: normal;" href="https://www.compulife.net/termsofuse.php" target="_blank">Terms of Use</a></div>
</body>
</html>
