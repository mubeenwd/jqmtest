

function showMessage(msg) {
    navigator.notification.alert(
        msg,
        function () { },
        'Sarkar - Vidhansabha 2014',
        'Ok'
    );
}

function CheckDbStatus() {
    try {
        $('div[data-role="content"]').waitMe({
            effect: 'ios',
            text: 'Please wait',
            bg: 'rgba(255,255,255,0.7)',
            color: '#000'
        });

        var db = window.sqlitePlugin.openDatabase({ name: "sarkar.db" });

        db.transaction(function (tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS Voters (VoterId integer primary key, PartNo integer,Srlno integer,Mname text,Ename text,Fname text,RlnName text,LName text,IdCard text,Age text,HouseNo text,Gender text,PsName text,PsLocation text)');

            tx.executeSql("SELECT count(VoterId) as cnt FROM Voters;", [], function (tx, res) {
                if (res.rows.length > 0) {
                    if (res.rows.item(0).cnt > 1) {
                        $('div[data-role="content"]').waitMe('hide');
                    }
                    else {

                        $.mobile.changePage("#UpdateDb", {
                            transition: "slide",
                            reverse: true,
                            changeHash: true
                        });

                        $('div[data-role="content"]').waitMe('hide');
                    }
                }
                else {
                    showMessage("Data not found");
                    $('div[data-role="content"]').waitMe('hide');
                }
            }, function (error) {
                $('div[data-role="content"]').waitMe('hide');
            });
        }, function (error) {
            $('div[data-role="content"]').waitMe('hide');
        });
    } catch (e) {
        showMessage(e);
        $('div[data-role="content"]').waitMe('hide');
    }
}

function StartUpdatingApp() {
    $("#progressBar").show();
    $("#btnUpdateButton").attr("disabled", "disabled");
    ReadLocaFiles(1);
}

function ReadLocaFiles(FileNo) {
    try {

        $.ajax({
            url: 'sarkar/' + FileNo + '.sql',
            type: 'get',
            contentType: "application/text; charset=utf-8",
            success: function (sql) {
                var db = window.sqlitePlugin.openDatabase({ name: "sarkar.db" });

                if (db) {
                    db.transaction(function (tx) {

                        try {
                            tx.executeSql(sql, [], function (tx, res) {
                                if (FileNo < configurations.FileCount) {
                                    $("#meter").val(FileNo);
                                    $("#logger").html('<span style="padding:5px;color:008A00;">' + FileNo + ' of ' + configurations.FileCount + ' files(s) has been updated').fadeIn('slow');
                                    ReadLocaFiles(parseInt(FileNo) + 1);
                                }
                                else {

                                    showMessage("Application has been updated successfully!");

                                    $.mobile.changePage("#home", {
                                        transition: "slide",
                                        reverse: true,
                                        changeHash: true
                                    });
                                }
                            }, function (e) {
                                showMessage("tx.executeSql ERROR: " + JSON.stringify(e));
                            });
                        } catch (e) {
                            showMessage("db.executeSql catch block ERROR: " + JSON.stringify(e));
                        }
                    }, function (e) {
                        showMessage("db.transaction ERROR: " + JSON.stringify(e));
                    });
                }
                else {
                    showMessage("Db not created<br/>");
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                showMessage("Ajax Error occured for " + FileNo + ", Error: " + JSON.stringify(xhr) + "<br/>");
            }
        });
    } catch (e) {
        showMessage("ReadLocaFiles Error " + JSON.stringify(e));
    }
}


function fillPartDropdown(dropdownName) {

    if ($("#" + dropdownName + " option").length <= 0) {
        $('div[data-role="content"]').waitMe({
            effect: 'ios',
            text: 'Please wait',
            bg: 'rgba(255,255,255,0.7)',
            color: '#000'
        });

        try {
            var db = window.sqlitePlugin.openDatabase({ name: "sarkar.db" });

            var sql = 'SELECT DISTINCT PsLocation AS TextField,PartNo AS ValueField FROM Voters;';

            if (db) {
                db.transaction(function (tx) {

                    try {
                        tx.executeSql(sql, [], function (tx, results) {
                            var str = '<option value="0">All Parts</option>';

                            if (results.rows.length > 0) {
                                for (var i = 0; i < results.rows.length; i++) {
                                    row = results.rows.item(i);
                                    str += '<option value="' + row.ValueField + '">' + row.TextField + '</option>';
                                }

                                $("#" + dropdownName).html(str);

                                $("#" + dropdownName).val(0).selectmenu('refresh');

                                $('div[data-role="content"]').waitMe('hide');
                            }
                            else {
                                showMessage("No Parts Found in Database");

                                $('div[data-role="content"]').waitMe('hide');
                            }

                        }, function (e) {
                            showMessage("tx.executeSql ERROR: " + JSON.stringify(e));
                            $('div[data-role="content"]').waitMe('hide');
                        });
                    } catch (e) {
                        showMessage("db.executeSql catch block ERROR: " + JSON.stringify(e));
                        $('div[data-role="content"]').waitMe('hide');
                    }
                }, function (e) {
                    showMessage("db.transaction ERROR: " + JSON.stringify(e));
                    $('div[data-role="content"]').waitMe('hide');
                });
            }
            else {
                showMessage("Db not created<br/>");
                $('div[data-role="content"]').waitMe('hide');
            }
        } catch (e) {
            showMessage(e);
            $('div[data-role="content"]').waitMe('hide');
        }
    }
}


function PartwiseGroupByList(partwiseContainer) {
    $('div[data-role="content"]').waitMe({
        effect: 'ios',
        text: 'Please wait',
        bg: 'rgba(255,255,255,0.7)',
        color: '#000'
    });

    try {

        $("#" + partwiseContainer).html('');

        var db = window.sqlitePlugin.openDatabase({ name: "sarkar.db" });

        var sql = 'SELECT COUNT(PartNo) AS VoterCount, PsLocation FROM Voters GROUP BY PartNo, PsLocation HAVING (VoterCount > 100) ORDER BY PartNo, PsLocation';

        if (db) {
            db.transaction(function (tx) {

                try {
                    tx.executeSql(sql, [], function (tx, results) {
                        var str = '<table style="width:100%;border-collapse:collapse;border:solid 1px #999999;">';

                        str += '<tr>';
                        str += '<th style="border:solid 1px #999999;padding:5px;">Part Name</th>';
                        str += '<th style="border:solid 1px #999999;padding:5px;"Voters</th>';
                        str += '</tr>';

                        if (results.rows.length > 0) {
                            for (var i = 0; i < results.rows.length; i++) {
                                row = results.rows.item(i);
                                str += '<tr>';
                                str += '<td style="border:solid 1px #999999;padding:5px;">' + row.PsLocation + '</td>';
                                str += '<td style="border:solid 1px #999999;padding:5px;">' + row.VoterCount + '</td>';
                                str += '</tr>';
                            }

                            str += '</table>';
                            $("#" + partwiseContainer).html(str);

                            $('div[data-role="content"]').waitMe('hide');
                        }
                        else {
                            showMessage("No Parts Found in Database");

                            $('div[data-role="content"]').waitMe('hide');
                        }

                    }, function (e) {
                        showMessage("tx.executeSql ERROR: " + JSON.stringify(e));
                        $('div[data-role="content"]').waitMe('hide');
                    });
                } catch (e) {
                    showMessage("db.executeSql catch block ERROR: " + JSON.stringify(e));
                    $('div[data-role="content"]').waitMe('hide');
                }
            }, function (e) {
                showMessage("db.transaction ERROR: " + JSON.stringify(e));
                $('div[data-role="content"]').waitMe('hide');
            });
        }
        else {
            showMessage("Db not created<br/>");
            $('div[data-role="content"]').waitMe('hide');
        }
    } catch (e) {
        showMessage(e);
        $('div[data-role="content"]').waitMe('hide');
    }
}

function PerformSearch(VAction) {
    try {

        switch (VAction) {
            case 1:
                {
                    if ($("#txtNameSearchVoterName").val() != '') {

                        nameSearchHolder.VPartNo = $("#ddlNameSearchPartNo").val();
                        nameSearchHolder.VName = $("#txtNameSearchVoterName").val();
                        nameSearchHolder.VPageNo = 1;
                        nameSearchHolder.VAction = VAction;

                        $.mobile.changePage("#nameSearchResult", {
                            transition: "slide",
                            reverse: true,
                            changeHash: true
                        });
                    }
                    else {
                        showMessage("Voter name is compulsory");
                        return false;
                    }
                    break;
                }
            case 2:
                {
                    if ($("#txtSurnameSearchSurname").val() != '') {

                        nameSearchHolder.VPartNo = $("#ddlSurnameSearchPartNo").val();
                        nameSearchHolder.VName = $("#txtSurnameSearchSurname").val();
                        nameSearchHolder.VPageNo = 1;
                        nameSearchHolder.VAction = VAction;

                        $.mobile.changePage("#nameSearchResult", {
                            transition: "slide",
                            reverse: true,
                            changeHash: true
                        });
                    }
                    else {
                        showMessage("Surname is compulsory");
                        return false;
                    }
                    break;
                }
            case 3:
                {
                    if ($("#txtFatherSearchFatherName").val() != '') {

                        nameSearchHolder.VPartNo = $("#ddlFatherSearchPartNo").val();
                        nameSearchHolder.VName = $("#txtFatherSearchFatherName").val();
                        nameSearchHolder.VPageNo = 1;
                        nameSearchHolder.VAction = VAction;

                        $.mobile.changePage("#nameSearchResult", {
                            transition: "slide",
                            reverse: true,
                            changeHash: true
                        });
                    }
                    else {
                        showMessage("Fathe name is compulsory");
                        return false;
                    }
                    break;
                }
            case 4:
                {
                    if ($("#txtHouseNoSearchHouseNo").val() != '') {

                        nameSearchHolder.VPartNo = $("#ddlHouseNoSearchPartNo").val();
                        nameSearchHolder.VName = $("#txtHouseNoSearchHouseNo").val();
                        nameSearchHolder.VPageNo = 1;
                        nameSearchHolder.VAction = VAction;

                        $.mobile.changePage("#nameSearchResult", {
                            transition: "slide",
                            reverse: true,
                            changeHash: true
                        });
                    }
                    else {
                        showMessage("House number is compulsory");
                        return false;
                    }
                    break;
                }
            case 5:
                {

                    nameSearchHolder.VPartNo = $("#ddlAgewiseSearchPartNo").val();
                    nameSearchHolder.VName = $("#ddlAgewiseAgeFrom").val() + "," + $("#ddlAgewiseAgeTo").val();
                    nameSearchHolder.VPageNo = 1;
                    nameSearchHolder.VAction = VAction;

                    $.mobile.changePage("#nameSearchResult", {
                        transition: "slide",
                        reverse: true,
                        changeHash: true
                    });

                    break;
                }
            case 6:
                {
                    if ($("#txtVoteIdNoSearchVoterId").val() != '') {

                        nameSearchHolder.VPartNo = $("#ddlVoteIdNoSearchPartNo").val();
                        nameSearchHolder.VName = $("#txtVoteIdNoSearchVoterId").val();
                        nameSearchHolder.VPageNo = 1;
                        nameSearchHolder.VAction = VAction;

                        $.mobile.changePage("#nameSearchResult", {
                            transition: "slide",
                            reverse: true,
                            changeHash: true
                        });
                    }
                    else {
                        showMessage("Voter id number is compulsory");
                        return false;
                    }
                    break;
                }
            default:
                break;
        }
    } catch (e) {
        showMessage(e);
        return false;
    }
}


function BuildSearchResult(VPageNo) {

    $("#nameSearchResultContainer").html('');

    $('div[data-role="content"]').waitMe({
        effect: 'ios',
        text: 'Please wait',
        bg: 'rgba(255,255,255,0.7)',
        color: '#000'
    });

    try {

        nameSearchHolder.VPageNo = VPageNo;

        var strCondition = '';
        var strCommand = 'SELECT * FROM Voters';
        var searchTypeCondition = '';

        switch (nameSearchHolder.VAction) {
            case 1:
                {
                    searchTypeCondition = 'Fname';
                    break;
                }
            case 2:
                {
                    searchTypeCondition = 'Lname';
                    break;
                }
            case 3:
                {
                    searchTypeCondition = 'RlnName';
                    break;
                }
            case 4:
                {
                    searchTypeCondition = 'HouseNo';
                    break;
                }
            case 6:
                {
                    searchTypeCondition = 'IdCard';
                    break;
                }
            default:
        }

        if (nameSearchHolder.VAction == 5) {
            var ageFrom = '';
            var ageTo = '';

            if (nameSearchHolder.VName != '') {
                var arr = nameSearchHolder.VName.split(',');
                ageFrom = arr[0];
                ageTo = arr[1];
            }

            if (parseInt(ageFrom) > 0 && parseInt(ageTo) > 0) {
                if (nameSearchHolder.VPartNo != '') {
                    if (parseInt(nameSearchHolder.VPartNo) > 0) {
                        strCondition = " WHERE PartNo = '" + partNo + "' AND ";
                    }
                    else {
                        strCondition += " WHERE "
                    }
                }
                else {
                    strCondition += " WHERE "
                }

                strCondition += "Age BETWEEN " + ageFrom + " AND " + ageTo;
            }
            else {
                showMessage("Age Selection is compulsory");
                return false;
            }
        }
        else {

            if (nameSearchHolder.VPartNo != '') {
                if (parseInt(nameSearchHolder.VPartNo) > 0) {
                    strCondition += " WHERE PartNo = '" + vPartNo + "'";
                }
            }

            if (nameSearchHolder.VName != '') {
                if (nameSearchHolder.VPartNo != '') {
                    if (parseInt(nameSearchHolder.VPartNo) > 0) {
                        strCondition += ' AND ';
                    }
                    else {
                        strCondition += ' WHERE ';
                    }
                }
                else {
                    strCondition += ' WHERE ';
                }

                if (nameSearchHolder.VAction == 4) {
                    strCondition += searchTypeCondition + " = '" + nameSearchHolder.VName + "'";
                }
                else {
                    strCondition += searchTypeCondition + " LIKE '%" + nameSearchHolder.VName + "%'";
                }
            }
        }

        strCommand += strCondition + ' LIMIT ' + nameSearchHolder.VPageNo + ', 50';

        var countComman = 'SELECT COUNT(VoterId) as cnt FROM Voters' + strCondition;

        var db = window.sqlitePlugin.openDatabase({ name: "sarkar.db" });

        if (db) {
            db.transaction(function (tx) {
                try {
                    tx.executeSql(countComman, [],
                        function (tx, resCount) {
                            
                            var getCount = resCount.rows.item(0).cnt;
                            
                            if (getCount > 0) {

                                SetPaging(50, getCount, nameSearchHolder.VPageNo, nameSearchHolder.VAction);

                                tx.executeSql(strCommand, [], function (tx, res) {
                                    FillList(res);
                                    $('div[data-role="content"]').waitMe('hide');
                                }, function (e) {
                                    $('div[data-role="content"]').waitMe('hide');
                                    showMessage("tx.executeSql ERROR: " + e.message);
                                });
                            }
                            else {
                                $('div[data-role="content"]').waitMe('hide');
                            }
                        }
                        , function (e) {
                            $('div[data-role="content"]').waitMe('hide');
                            showMessage("tx.executeSql ERROR: " + e.message);
                        });

                } catch (e) {
                    $('div[data-role="content"]').waitMe('hide');
                    showMessage("db.executeSql catch block ERROR: " + e.message);
                }
            }, function (e) {
                $('div[data-role="content"]').waitMe('hide');
                showMessage("db.transaction ERROR: " + e.message);
            });
        }
        else {
            $('div[data-role="content"]').waitMe('hide');
            showMessage("Db not created<br/>");
        }
    } catch (e) {
        $('div[data-role="content"]').waitMe('hide');
        showMessage("Error building search result " + JSON.stringify(e));
    }
}

function FillList(results) {
    try {

        var strHtmlLit = '';

        if (results.rows.length > 0) {

            for (var i = 0; i < results.rows.length; i++) {
                row = results.rows.item(i);
                
                strHtmlLit += '<table style="width:100%;border-collapse:collapse;border:solid 1px #4617B4;padding:2px;">';

                strHtmlLit += '<tr>';
                strHtmlLit += '<td style="font-weight:bold;border:solid 1px #4617B4;padding:5px;width:40%;" colspan="2">' + row.Mname + '</td>';
                strHtmlLit += '</tr>';

                strHtmlLit += '<tr>';
                strHtmlLit += '<td style="font-weight:bold;border:solid 1px #4617B4;padding:5px;width:40%;">लिंग</td>';
                strHtmlLit += '<td style="font-weight:normal;border:solid 1px #4617B4;padding:2px;">' + row.Gender + '</td>';
                strHtmlLit += '</tr>';

                strHtmlLit += '<tr>';
                strHtmlLit += '<td style="font-weight:bold;border:solid 1px #4617B4;padding:5px;width:40%;">वय</td>';
                strHtmlLit += '<td style="font-weight:normal;border:solid 1px #4617B4;padding:5px;">' + row.Age + '</td>';
                strHtmlLit += '</tr>';

                strHtmlLit += '<tr>';
                strHtmlLit += '<td style="font-weight:bold;border:solid 1px #4617B4;padding:5px;width:40%;">ओळखपत्र क्रमांक</td>';
                strHtmlLit += '<td style="font-weight:normal;border:solid 1px #4617B4;padding:5px;">' + row.IdCard + '</td>';
                strHtmlLit += '</tr>';

                strHtmlLit += '<tr>';
                strHtmlLit += '<td style="font-weight:bold;border:solid 1px #4617B4;padding:5px;width:40%;">घर क्रमांक</td>';
                strHtmlLit += '<td style="font-weight:normal;border:solid 1px #4617B4;padding:5px;">' + row.HouseNo + '</td>';
                strHtmlLit += '</tr>';

                strHtmlLit += '<tr>';
                strHtmlLit += '<td style="font-weight:bold;border:solid 1px #4617B4;padding:5px;width:40%;">मतदान केंद्र</td>';
                strHtmlLit += '<td style="font-weight:normal;border:solid 1px #4617B4;padding:5px;">' + row.PsName + '</td>';
                strHtmlLit += '</tr>';

                if (row.SrlNo) {
                    strHtmlLit += '<tr>';
                    strHtmlLit += '<td style="font-weight:bold;border:solid 1px #999999;padding:5px;width:40%;">अनुक्रमांक</td>';
                    strHtmlLit += '<td style="font-weight:normal;border:solid 1px #999999;padding:5px;">' + row.SrlNo + '</td>';
                    strHtmlLit += '</tr>';
                }

                strHtmlLit += '<tr>';
                strHtmlLit += '<td style="font-weight:bold;border:solid 1px #4617B4;padding:5px;width:40%;">भाग</td>';
                strHtmlLit += '<td style="font-weight:normal;border:solid 1px #4617B4;padding:5px;">' + row.PsLocation + '</td>';
                strHtmlLit += '</tr>';

                if (row.HouseNo) {
                    strHtmlLit += '<tr>';
                    strHtmlLit += '<td style="font-weight:bold;border:solid 1px #999999;padding:5px;text-align:center;" colspan="2">';
                    strHtmlLit += '<span style="color:#223264;padding:5px;margin:5px;background-color:#bcd7e5;font-size:16px;width:100%;" onclick="showFamily(\'' + row.HouseNo + '\')">कुटुंब पाहा<span>';
                    strHtmlLit += '</tr>';
                }

                strHtmlLit += '</table>';
                strHtmlLit += '<br />';
            }

            $("#nameSearchResultContainer").html(strHtmlLit);

        }
        else {
            $("#nameSearchResultContainer").html('<p style="color:red;">No result found for your search, Please try again with diffrent search</p>');
        }
    } catch (e) {
        showMessage(e.Message);
    }
}


function SetPaging(recordsPerPage, getCount, vPageNo, searchType) {
    try {

        var recordsPerPage = 50;
        var from = 0;
        var to = 0;
        var showing = 0;

        var totalPages = Math.ceil(parseInt(getCount) / parseInt(recordsPerPage));

        if (vPageNo >= 1 && vPageNo < totalPages) {
            to = vPageNo * recordsPerPage;
        }
        else {
            to = parseInt(getCount);
        }

        if (parseInt(vPageNo) >= 1 && parseInt(vPageNo) < parseInt(totalPages)) {
            from = ((parseInt(vPageNo) - 1) * recordsPerPage) + 1;
        }
        else {
            from = 1;
        }

        if (parseInt(vPageNo) > 1) {
            $("#anchPrevious").attr("onclick", "BuildSearchResult(" + (parseInt(vPageNo) - 1) + ")");
        }
        else {
            $("#anchPrevious").removeAttr("onclick");
        }

        if (vPageNo >= 1 && vPageNo < totalPages) {
            $("#anchNext").attr("onclick", "BuildSearchResult(" + (parseInt(vPageNo) + 1) + ")");
        }
        else {
            $("#anchNext").removeAttr("onclick");
        }

        if (totalPages > 0) {
            $("#lblPageCounter").text(from + " - " + to + " of " + getCount);
        }
        else {
            $("#lblPageCounter").text(from + " - " + to + " of " + getCount);
        }

        $("#lblPageNo").text("Page # " + vPageNo);

    } catch (e) {
        showMessage("Calculate Paging Error : " + JSON.stringify(e));
    }
}

function PollingStations(partwiseContainer) {
    $('div[data-role="content"]').waitMe({
        effect: 'ios',
        text: 'Please wait',
        bg: 'rgba(255,255,255,0.7)',
        color: '#000'
    });

    try {

        $("#" + partwiseContainer).html('');

        var db = window.sqlitePlugin.openDatabase({ name: "sarkar.db" });

        var sql = 'SELECT COUNT(PsName) AS VoterCount, PsName FROM Voters GROUP BY PsName HAVING (VoterCount > 100) ORDER BY VoterCount desc';

        if (db) {
            db.transaction(function (tx) {

                try {
                    tx.executeSql(sql, [], function (tx, results) {
                        var str = '<table style="width:100%;border-collapse:collapse;border:solid 1px #999999;">';

                        str += '<tr>';
                        str += '<th style="border:solid 1px #999999;padding:5px;">Poling Station</th>';
                        str += '<th style="border:solid 1px #999999;padding:5px;"Voters</th>';
                        str += '</tr>';

                        if (results.rows.length > 0) {
                            for (var i = 0; i < results.rows.length; i++) {
                                row = results.rows.item(i);
                                str += '<tr>';
                                str += '<td style="border:solid 1px #999999;padding:5px;">' + row.PsName + '</td>';
                                str += '<td style="border:solid 1px #999999;padding:5px;">' + row.VoterCount + '</td>';
                                str += '</tr>';
                            }

                            str += '</table>';
                            $("#" + partwiseContainer).html(str);

                            $('div[data-role="content"]').waitMe('hide');
                        }
                        else {
                            showMessage("No Poling Station Found in Database");

                            $('div[data-role="content"]').waitMe('hide');
                        }

                    }, function (e) {
                        showMessage("tx.executeSql ERROR: " + JSON.stringify(e));
                        $('div[data-role="content"]').waitMe('hide');
                    });
                } catch (e) {
                    showMessage("db.executeSql catch block ERROR: " + JSON.stringify(e));
                    $('div[data-role="content"]').waitMe('hide');
                }
            }, function (e) {
                showMessage("db.transaction ERROR: " + JSON.stringify(e));
                $('div[data-role="content"]').waitMe('hide');
            });
        }
        else {
            showMessage("Db not created<br/>");
            $('div[data-role="content"]').waitMe('hide');
        }
    } catch (e) {
        showMessage(e);
        $('div[data-role="content"]').waitMe('hide');
    }
}


function SurnameListGroup(partwiseContainer) {
    $('div[data-role="content"]').waitMe({
        effect: 'ios',
        text: 'Please wait',
        bg: 'rgba(255,255,255,0.7)',
        color: '#000'
    });

    try {

        $("#" + partwiseContainer).html('');

        var db = window.sqlitePlugin.openDatabase({ name: "sarkar.db" });

        var sql = 'SELECT COUNT(LName) AS VoterCount, LName FROM Voters GROUP BY LName HAVING (VoterCount > 100) ORDER BY VoterCount, LName';

        if (db) {
            db.transaction(function (tx) {

                try {
                    tx.executeSql(sql, [], function (tx, results) {
                        var str = '<table style="width:100%;border-collapse:collapse;border:solid 1px #999999;">';

                        str += '<tr>';
                        str += '<th style="border:solid 1px #999999;padding:5px;">Surname</th>';
                        str += '<th style="border:solid 1px #999999;padding:5px;"Voters</th>';
                        str += '</tr>';

                        if (results.rows.length > 0) {
                            for (var i = 0; i < results.rows.length; i++) {
                                row = results.rows.item(i);
                                str += '<tr>';
                                str += '<td style="border:solid 1px #999999;padding:5px;">' + row.LName + '</td>';
                                str += '<td style="border:solid 1px #999999;padding:5px;">' + row.VoterCount + '</td>';
                                str += '</tr>';
                            }

                            str += '</table>';
                            $("#" + partwiseContainer).html(str);

                            $('div[data-role="content"]').waitMe('hide');
                        }
                        else {
                            showMessage("No Surname Found in Database");

                            $('div[data-role="content"]').waitMe('hide');
                        }

                    }, function (e) {
                        showMessage("tx.executeSql ERROR: " + JSON.stringify(e));
                        $('div[data-role="content"]').waitMe('hide');
                    });
                } catch (e) {
                    showMessage("db.executeSql catch block ERROR: " + JSON.stringify(e));
                    $('div[data-role="content"]').waitMe('hide');
                }
            }, function (e) {
                showMessage("db.transaction ERROR: " + JSON.stringify(e));
                $('div[data-role="content"]').waitMe('hide');
            });
        }
        else {
            showMessage("Db not created<br/>");
            $('div[data-role="content"]').waitMe('hide');
        }
    } catch (e) {
        showMessage(e);
        $('div[data-role="content"]').waitMe('hide');
    }
}


function AgewiseeListGroup(partwiseContainer) {

    $('div[data-role="content"]').waitMe({
        effect: 'ios',
        text: 'Please wait',
        bg: 'rgba(255,255,255,0.7)',
        color: '#000'
    });

    try {

        $("#" + partwiseContainer).html('');

        var db = window.sqlitePlugin.openDatabase({ name: "sarkar.db" });

        var sql = "";

        sql += "SELECT COUNT(Age) AS VoterCount,'18 - 25' AS Range  FROM Voters WHERE Age BETWEEN 18 AND 25 ORDER BY VoterCount";
        sql += " UNION SELECT COUNT(Age) AS VoterCount,'25 - 35' AS Range  FROM Voters WHERE Age BETWEEN 25 AND 35";
        sql += " UNION SELECT COUNT(Age) AS VoterCount,'35 - 55' AS Range  FROM Voters WHERE Age BETWEEN 35 AND 55";
        sql += " UNION SELECT COUNT(Age) AS VoterCount,'45 - 55' AS Range  FROM Voters WHERE Age BETWEEN 45 AND 55";
        sql += " UNION SELECT COUNT(Age) AS VoterCount,'55 - 65' AS Range  FROM Voters WHERE Age BETWEEN 55 AND 65";
        sql += " UNION SELECT COUNT(Age) AS VoterCount,'65 - 75' AS Range  FROM Voters WHERE Age BETWEEN 65 AND 75";
        sql += " UNION SELECT COUNT(Age) AS VoterCount,'75 - 85' AS Range  FROM Voters WHERE Age BETWEEN 75 AND 85";
        sql += " UNION SELECT COUNT(Age) AS VoterCount,'85 - 100' AS Range  FROM Voters WHERE Age BETWEEN 85 AND 100;";

        if (db) {
            db.transaction(function (tx) {

                try {
                    tx.cuteSql(sql, [], function (tx, results) {
                        var str = '<table style="width:100%;border-collapse:collapse;border:solid 1px #999999;">';

                        str += '<tr>';
                        str += '<th style="border:solid 1px #999999;padding:5px;">Age(s)</th>';
                        str += '<th style="border:solid 1px #999999;padding:5px;"Voters</th>';
                        str += '</tr>';

                        if (results.rows.length > 0) {
                            for (var i = 0; i < results.rows.length; i++) {
                                row = results.rows.item(i);
                                str += '<tr>';
                                str += '<td style="border:solid 1px #999999;padding:5px;">' + row.Range + '</td>';
                                str += '<td style="border:solid 1px #999999;padding:5px;">' + row.VoterCount + '</td>';
                                str += '</tr>';
                            }

                            str += '</table>';
                            $("#" + partwiseContainer).html(str);

                            $('div[data-role="content"]').waitMe('hide');
                        }
                        else {
                            showMessage("No Parts Found in Database");

                            $('div[data-role="content"]').waitMe('hide');
                        }

                    }, function (e) {
                        showMessage("tx.executeSql ERROR: " + JSON.stringify(e));
                        $('div[data-role="content"]').waitMe('hide');
                    });
                } catch (e) {
                    showMessage("db.executeSql catch block ERROR: " + JSON.stringify(e));
                    $('div[data-role="content"]').waitMe('hide');
                }
            }, function (e) {
                showMessage("db.transaction ERROR: " + JSON.stringify(e));
                $('div[data-role="content"]').waitMe('hide');
            });
        }
        else {
            showMessage("Db not created<br/>");
            $('div[data-role="content"]').waitMe('hide');
        }
    } catch (e) {
        showMessage(e);
        $('div[data-role="content"]').waitMe('hide');
    }
}

function showFamily(houseNumber) {
    try {
        if (houseNumber != '') {
            nameSearchHolder.VPartNo = 0;
            nameSearchHolder.VName = houseNumber
            nameSearchHolder.VPageNo = 1;
            nameSearchHolder.VAction = 4;

            $.mobile.changePage("#nameSearchResult", {
                transition: "slide",
                reverse: true,
                changeHash: false,
                allowSamePageTransition: true
            });
        }
    } catch (e) {
        showMessage("House No Error : " + JSON.stringify(e));
    }
}