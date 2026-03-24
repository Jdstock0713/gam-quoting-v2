var complogos=0;
var Logocol;
function BuildTableResult(item,index) {
	if (Logocol==0) {
		txt += '<td style="display:none;">hid ' + compcode + '</td>';
	}
	else {
	var compcode;	
		if (typeof item.Compulife_compprodcode !== 'undefined')	{
			compcode = item.Compulife_compprodcode.substring(0,4);
			txt += '<tr style="border: 1px solid #000000;" id="'+ compcode +'">';	// mark each row with an id of the company code
		txt += '<td style="height:50px;"><img src="' + Logocol[compcode] + '"></td>';
		}
		else {
			compcode = '';
			txt += '<tr>';	// no idea, probably header
		txt += '<td>show ' +  '</td>';
		}
	}
	txt += '<td>' + item.Compulife_company + '</td>';
	if (typeof item.Compulife_ambest !== 'undefined') {
		txt += '<td>' + item.Compulife_ambest + '</td>';
	}
	txt += '<td>' + item.Compulife_product+ '</td>';

	txt += '<td>' + item.Compulife_compprodcode + '</td>';
	if (typeof item.Compulife_amb !== 'undefined') {
	txt += '<td>' + item.Compulife_amb + '</td>';
	}
	txt += '<td>$' + item.Compulife_premiumAnnual+ '</td>';
	if (typeof item.Compulife_premiumM != 'undefined')
		txt += '<td>$' + item.Compulife_premiumM + '</td>';
	if (typeof item.Compulife_premiumQ != 'undefined')
		txt += '<td>$' + item.Compulife_premiumQ + '</td>';
	if (typeof item.Compulife_premiumH != 'undefined')
		txt += '<td>$' + item.Compulife_premiumH + '</td>';
	txt += '<td>' + item.Compulife_rgpfpp+ '</td>';
	txt += '</tr>';
}
function BuildTable(item){
	if (typeof logos != 'undefined')
		complogos = logos;
	else complogos = 0;
    txt += "<table style='border: 1px solid #000000;'>";
	var Mode = '';
	  txt += '<caption style="border: 1px solid #000000; background-color: #5D5D5D; color: #ffffff; border-bottom: none; font-weight: bold; font-size: 16px;">' + item.Compulife_title + '</caption>';
	if (typeof item.Compulife_Results[0].Compulife_premiumM != 'undefined')
		Mode += "<th style='background-color: #f5f5f5; font-weight: bold; font-size: 14px'>Monthly</th>";
	if (typeof item.Compulife_Results[0].Compulife_premiumQ != 'undefined')
		Mode += "<th style='background-color: #f5f5f5; font-weight: bold; font-size: 14px'>Quarterly</th>";
	if (typeof item.Compulife_Results[0].Compulife_premiumH != 'undefined')
		Mode += "<th style='background-color: #f5f5f5; font-weight: bold; font-size: 14px'>Semi-Annual</th>";
	  if (complogos==0)
		Logocol = '<th style="display:none;">Logo</th>';
	  else 
		Logocol = '<th style="background-color: #f5f5f5; font-weight: bold; font-size: 14px;">Logo</th>'; 
	  if (typeof item.Compulife_Results[0].Compulife_ambest != 'undefined')
          txt += '<tr>' + Logocol + '<th style="background-color: #f5f5f5; font-weight: bold; font-size: 16px;">Company</th><th style="background-color: #f5f5f5; font-weight: bold; font-size: 14px;">AM Best ID</th><th style="background-color: #f5f5f5; font-weight: bold; font-size: 14px;">Product</th><th style="background-color: #f5f5f5; font-weight: bold; font-size: 14px;">Code</th><th style="background-color: #f5f5f5; font-weight: bold; font-size: 14px;">AMB</th><th style="background-color: #f5f5f5; font-weight: bold; font-size: 14px;">Annual</th>' + Mode + '<th style="background-color: #f5f5f5; font-weight: bold; font-size: 14px;">Health</th></tr>';
	  else
          txt += '<tr>' + Logocol + '<th>Company</th><th>Product</th><th>code</th><th>Annual</th>' + Mode + '<th>Health</th></tr>';
	Logocol = complogos;
            item.Compulife_Results.forEach(BuildTableResult);
            /*for(rc in item.Compulife_Results) {
                r = parseInt(rc);
            txt += '<tr>';
                txt += '<td>' + item.Compulife_Results[r].Compulife_company + '</td>';
                txt += '<td>' + item.Compulife_Results[r].Compulife_ambest + '</td>';
                txt += '<td>' + item.Compulife_Results[r].Compulife_product+ '</td>';
                txt += '<td>' + item.Compulife_Results[r].Compulife_compprodcode + '</td>';
                txt += '<td>' + item.Compulife_Results[r].Compulife_amb + '</td>';
                txt += '<td>$' + item.Compulife_Results[r].Compulife_premiumAnnual+ '</td>';
                txt += '<td>$' + item.Compulife_Results[r].Compulife_premiumM+ '</td>';
                txt += '<td>' + item.Compulife_Results[r].Compulife_rgpfpp+ '</td>';
            txt += '</tr>';
            }*/
          txt += "</table>";
}
var RowIndex;
function BuildSideHead(columnData,colIndex)
{
	var temp,year;
	if (colIndex==0) {	// add labels
		switch(RowIndex){
			case 0: txt += '<th>Company</th>'; break;
			case 1: txt += '<th>Product</th>';break;
			case 2: txt += '<th>Health</th>';break;
			case 3: txt += '<th>Annual</th>'; break;
			case 4: txt += '<th>Monthly</th>'; break;
			case 5: txt += '<th>Quarterly</th>'; break;
			case 6: txt += '<th>Semi-Annual</th>'; break;
			default: year = RowIndex-6; temp = year.toString();
				txt += '<th>Year ' + temp + '</th>';break;
		}
	}
	switch(RowIndex){
		case 0:
			txt += '<td>' + columnData.Compulife_company + '</td>';
			break;
		case 1:
			txt += '<td>' + columnData.Compulife_product + '</td>';
			break;
		case 2:
			txt += '<td>' + columnData.Compulife_rgpfpp + '</td>';
			break;
		case 3:
			txt += '<td>$' + columnData.prodannual + '</td>';
			break;
		case 4:
			txt += '<td>$' + columnData.prodmonthly+ '</td>';
			break;
		case 5:
			txt += '<td>$' + columnData.prodquarterly+ '</td>';
			break;
		case 6:
			txt += '<td>$' + columnData.prodsemi+ '</td>';
			break;
	}
	if (RowIndex>=7)
			txt += '<td>' + columnData.details[RowIndex-7] + '</td>';
}
function BuildSideBySideTable(item)
{
	txt += "<table style='border: 1px solid #000000;'>";
	x = item.Compulife_Company_Results;
	txt += '<caption style="border: 1px solid #000000; background-color: #5D5D5D; color: #ffffff; border-bottom: none; font-weight: bold; font-size: 16px;">' + x[0].Mode + '</caption>';
	for(RowIndex=0;RowIndex<6+item.Details.length;RowIndex++){
		txt += "<tr>";
		x.forEach(BuildSideHead);
		txt += "</tr>";
	}
	txt += "</table>";
}


