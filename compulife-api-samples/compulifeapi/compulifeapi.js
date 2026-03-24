// get results that do not require authorization
function getPublicResults(RequestType,destination) {
	var xhttp = new XMLHttpRequest();

	if (!xhttp) {
		alert('Cannot create XMLHTTP instance');
		return false;
	}
	var faction = "compulifeapi/apipublic.php/?requestType=" + RequestType;
	PublicResults = 0;
	xhttp.open("GET", faction, true);
	xhttp.onreadystatechange = function() {
		//  alert(this.readyState);
		if (this.readyState==1) {
			// server connection established
		}
		if (this.readyState == 4) {
			console.log("Status" + this.status);
			console.log(this.responseText);
			if (this.status == 200) {
				$(destination).html(this.responseText);
				myObj = JSON.parse(this.responseText);
				document.getElementById("logos").innerHTML = myObj.name;
			}
		}
	};
	xhttp.send('');

}
function getResultsWithLogos(requestID,ResponseID,RequestType)
{

}
// get results that do require authoriaztion
function getPrivateResults(requestID,ResponseID,RequestType,BuildTableCallback) {
	var myObj;
	var faction = "compulifeapi/api.php/?" + $(requestID).serialize();
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
				BuildTableCallback(ResponseID,RequestType,this.responseText);

/*				myObj = JSON.parse(this.responseText);
				x = myObj.Compulife_ComparisonResults;
				if (typeof x!=='undefined') {
					txt = "";
					if (RequestType=='R') {
						// regular comparison results
						if (x instanceof Array) 
							x.forEach(BuildTable);

						else
							BuildTable(x,0);
					}
					else
						// sidebyside comparison results
						BuildSideBySideTable(x);
				}
				else txt = 'Error occurred, check log files';
				$(ResponseID).html(txt);*/
			} else {
				if (this.status == 500) {
					alert("Server error Status 500");
				}
			}
		}
	}
	xhttp.send('');
	return;
}
// utility functions
function SexText(myObj) 
{
	if (myObj.Lookup.sex=='M') return 'Male';
	else return 'Female';
}
function BirthDateText(myObj)
{
	return DateText(myObj.Lookup.Birthdate.day,myObj.Lookup.Birthdate.month,myObj.Lookup.Birthdate.year);
}
function LookupDateText(myObj)
{
	return myObj.AccessDate.month + ' ' + myObj.AccessDate.day+', ' + myObj.AccessDate.year;
}

function DateText(day,month,year)
{
var months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];
	month--;	// indexed from 0
			var mtxt = months[ month];
			var st; 
			switch (day) {
			case '1': st = '1st, '; break;
			case '2': st = '2nd, '; break;
			case '3': st = '3rd, '; break;
			case '4': st = '4th, '; break;
			case '5': st = '5th, '; break;
			case '6': st = '6th, '; break;
			case '7': st = '7th, '; break;
			case '8': st = '8th, '; break;
			case '9': st = '9th, '; break;
			default: st = day + 'th, '; break;

			}
	return mtxt + ' ' + st + year;
}

function GetStateList() 
{
return 	{
1: "Alabama",
2: "Alaska",
3: "Arizona",
4: "Arkansas",
5: "California",
6: "Colorado",
7: "Connecticut",
8: "Delaware",
9: "Dist.Columbia",
10: "Florida",
11: "Georgia",
12: "Hawaii",
13: "Idaho",
14: "Illinois",
15: "Indiana",
16: "Iowa",
17: "Kansas",
18: "Kentucky",
19: "Louisiana",
20: "Maine",
21: "Maryland",
22: "Massachusetts",
23: "Michigan",
24: "Minnesota",
25: "Mississippi",
26: "Missouri",
27: "Montana",
28: "Nebraska",
29: "Nevada",
30: "New Hampshire",
31: "New Jersey",
32: "New Mexico",
33: "NY Business",
34: "North Carolina",
35: "North Dakota",
36: "Ohio",
37: "Oklahoma",
38: "Oregon",
39: "Pennsylvania",
40: "Rhode Island",
41: "South Carolina",
42: "South Dakota",
43: "Tennessee",
44: "Texas",
45: "Utah",
46: "Vermont",
47: "Virginia",
48: "Washington",
49: "West Virginia",
50: "Wisconsin",
51: "Wyoming",
52: "NY Non-Bus",
53: "Guam",
54: "Puerto Rico",
55: "Virgin Islands",
56: "Amer. Samoa"
};
}
function StateText(myObj)
{
return GetStateList()[myObj.Lookup.state_fromzipcode];
}
function ProvText(myObj)
{
return GetProvList()[myObj.Lookup.state_fromzipcode];
}
function FaceAmountText(myObj)
{
	var formatter = new Intl.NumberFormat();
	return '$' + formatter.format(myObj.Lookup.faceamount);
}
function Dollar(v)
{
var formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

	return  formatter.format(1.0 * v);
}
function HealthText(myObj)
{
 return myObj.Lookup.healthtxt + ' ' + (myObj.Lookup.smoker=='N' ? 'Non-Smoker' : 'Smoker');
}
